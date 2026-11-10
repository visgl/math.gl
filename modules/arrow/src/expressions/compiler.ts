// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Bool,
  DataType,
  Field,
  Float64,
  Int64,
  Int32,
  Null,
  Utf8,
  vectorFromArray,
  makeData,
  makeVector,
  type RecordBatch,
  Vector,
  type Table,
  type Schema
} from 'apache-arrow';
import {compareUTF8, parseUTF8Number, parseUTF8BigInt, parseUTF8Boolean} from '../utf8/index';
import {parse, type Expression} from '@math.gl/core/expressions';
import {ColumnReader, typeKey, valueType, validateValue, createValueValidator} from './buffers';
import type {
  ArrowExpression,
  ArrowExpressionOptions,
  ArrowExpressionEvaluationOptions,
  ArrowExpressionValue,
  CompiledArrowExpression
} from './types';

type Mask = Uint8Array;
type Range = [Uint8Array, number, number];
type Prepared = {
  get: (row: number) => ArrowExpressionValue;
  bytes?: (row: number) => Range | null;
  isNull?: (row: number) => boolean;
  vector?: Vector;
};
type Node = {
  field: Field;
  hasKernel: boolean;
  prepare: (batch: RecordBatch, active: Mask) => Prepared;
};
const encoder = new TextEncoder();
const bool = new Bool();

/** Compiles a core expression AST against a fixed Arrow schema. */
export function compileArrowExpression(
  expression: ArrowExpression,
  options: ArrowExpressionOptions
): CompiledArrowExpression {
  const fields = [...options.inputSchema.fields];
  if (new Set(fields.map(field => field.name)).size !== fields.length)
    throw new Error('Expression input field names must be unique');
  const root = bind(parse(expression), options);
  const keys = fields.map(field => ({
    name: field.name,
    type: physicalKey(field.type),
    nullable: field.nullable,
    extension: extensionKey(field)
  }));
  const validateSchema = (schema: Schema) => {
    if (
      schema.fields.length !== keys.length ||
      schema.fields.some((field, index) => {
        const expected = keys[index]!;
        return (
          field.name !== expected.name ||
          physicalKey(field.type) !== expected.type ||
          field.nullable !== expected.nullable ||
          extensionKey(field) !== expected.extension
        );
      })
    )
      throw new Error('Arrow expression input schema mismatch');
  };
  const validateMask = (mask: Uint8Array | undefined, length: number) => {
    if (mask && (mask.length !== length || mask.some(value => value !== 0 && value !== 1)))
      throw new Error('activeRows must contain one 0 or 1 per input row');
  };
  const evaluate = (
    batch: RecordBatch,
    evaluation: ArrowExpressionEvaluationOptions = {}
  ): Vector => {
    evaluation.signal?.throwIfAborted();
    validateSchema(batch.schema);
    validateMask(evaluation.activeRows, batch.numRows);
    const active = evaluation.activeRows
      ? evaluation.activeRows.slice()
      : new Uint8Array(batch.numRows).fill(1);
    const prepared = root.prepare(batch, active);
    const result =
      prepared.vector &&
      !DataType.isDictionary(prepared.vector.type) &&
      !active.some(value => !value)
        ? prepared.vector
        : output(root.field, active, prepared.get);
    evaluation.signal?.throwIfAborted();
    return result;
  };
  return Object.freeze({
    outputField: root.field,
    evaluate,
    evaluateTable(arrowTable: Table, evaluation: ArrowExpressionEvaluationOptions = {}): Vector {
      evaluation.signal?.throwIfAborted();
      validateSchema(arrowTable.schema);
      validateMask(evaluation.activeRows, arrowTable.numRows);
      let offset = 0;
      const chunks = arrowTable.batches.flatMap(batch => {
        const activeRows = evaluation.activeRows?.subarray(offset, offset + batch.numRows);
        offset += batch.numRows;
        return evaluate(batch, {...evaluation, activeRows}).data;
      });
      return chunks.length ? new Vector(chunks) : output(root.field, new Uint8Array(0), () => null);
    }
  });
}

/** Binds a registered function call using the same expression compiler. */
export function compileArrowFunction(
  name: string,
  arguments_: readonly ArrowExpression[],
  options: ArrowExpressionOptions
): CompiledArrowExpression {
  return compileArrowExpression(
    {
      type: 'CallExpression',
      callee: {type: 'Identifier', name},
      arguments: arguments_.map(argument => parse(argument))
    } as Expression,
    options
  );
}

/** Compares physical encoding as well as logical type when reusing a bound evaluator. */
function physicalKey(type: DataType): string {
  try {
    return DataType.isDictionary(type)
      ? `dictionary:${typeKey(type.indices)}:${typeKey(type.dictionary)}:${type.isOrdered}`
      : typeKey(type);
  } catch {
    // Unreferenced columns may have nested or extension layouts outside this evaluator's subset.
    return `${type.typeId}:${type.toString()}:${JSON.stringify(
      type.children?.map(field => [
        field.name,
        physicalKey(field.type),
        field.nullable,
        [...field.metadata]
      ])
    )}`;
  }
}

/** Builds one vector while validating output values before Arrow can truncate them. */
function output(
  field: Field,
  active: Mask,
  evaluate: (row: number) => ArrowExpressionValue
): Vector {
  const type = valueType(field.type);
  const validate = createValueValidator(type);
  if (DataType.isUtf8(type)) {
    const values: ArrowExpressionValue[] = new Array(active.length).fill(null);
    for (let row = 0; row < active.length; row++)
      if (active[row]) {
        const value = evaluate(row);
        if (value === null && !field.nullable)
          throw new Error(`Non-nullable expression ${field.name} returned null`);
        validate(value);
        values[row] = value;
      }
    return vectorFromArray(values as any[], type);
  }
  if (DataType.isNull(type)) {
    for (let row = 0; row < active.length; row++) if (active[row]) validate(evaluate(row));
    return makeVector(makeData({type, length: active.length}));
  }
  const isBoolean = DataType.isBool(type);
  const data = isBoolean
    ? new Uint8Array(Math.ceil(active.length / 8))
    : new type.ArrayType(active.length);
  const validity = new Uint8Array(Math.ceil(active.length / 8));
  let nullCount = 0;
  for (let row = 0; row < active.length; row++) {
    if (!active[row]) {
      nullCount++;
      continue;
    }
    const value = evaluate(row);
    if (value === null) {
      if (!field.nullable) throw new Error(`Non-nullable expression ${field.name} returned null`);
      nullCount++;
      continue;
    }
    validate(value);
    validity[row >> 3] |= 1 << (row & 7);
    if (isBoolean) {
      if (value) data[row >> 3] |= 1 << (row & 7);
    } else data[row] = value as any;
  }
  return makeVector(
    makeData({type, data, length: active.length, nullBitmap: validity, nullCount} as any)
  );
}

/** Wraps a source vector without materializing rows or decoding string operands. */
function sourceReader(vector: Vector): Prepared {
  const data = vector.data[0];
  if (vector.data.length === 1 && (DataType.isInt(data.type) || DataType.isFloat(data.type))) {
    const values = data.values,
      bitmap = data.nullBitmap,
      offset = data.offset;
    const valid = data.nullCount
      ? (row: number) => Boolean(bitmap[(offset + row) >> 3]! & (1 << ((offset + row) & 7)))
      : () => true;
    return {
      vector,
      get: row => (valid(row) ? (values[row] as number | bigint) : null),
      isNull: row => !valid(row)
    };
  }
  const reader = new ColumnReader(vector);
  return {
    vector,
    get: row => reader.get(row),
    isNull: row => !reader.isValid(row),
    bytes:
      typeKey(vector.type) === 'utf8'
        ? row => (reader.isValid(row) ? reader.utf8(row) : null)
        : undefined
  };
}

/** Obtains UTF-8 bytes, encoding only values returned by scalar functions. */
function bytes(value: Prepared, row: number): Range | null {
  if (value.bytes) return value.bytes(row);
  const text = value.get(row);
  if (text === null) return null;
  const encoded = encoder.encode(text as string);
  return [encoded, 0, encoded.length];
}

/** Binds supported syntax to fused per-row operations and explicit vector boundaries. */
function bind(
  ast: any,
  options: ArrowExpressionOptions,
  expected?: DataType,
  vectorInput = false
): Node {
  if (isSignedLiteral(ast)) {
    const value = ast.operator === '-' ? -ast.argument.value : ast.argument.value;
    return bind({type: 'Literal', value}, options, expected);
  }
  if (ast.type === 'Identifier') {
    const index = options.inputSchema.fields.findIndex(field => field.name === ast.name);
    if (index < 0) throw new Error(`Unknown Arrow expression field: ${ast.name}`);
    const source = options.inputSchema.fields[index]!;
    if (!vectorInput) typeKey(source.type);
    return {
      field: new Field(source.name, valueType(source.type), source.nullable, source.metadata),
      hasKernel: false,
      prepare: batch =>
        vectorInput
          ? {
              vector: batch.getChildAt(index)!,
              get: () => {
                throw new Error('Nested function arguments require a vector kernel');
              }
            }
          : sourceReader(batch.getChildAt(index)!)
    };
  }
  if (ast.type === 'Literal') {
    const value = ast.value as ArrowExpressionValue;
    const type =
      expected ??
      (value === null
        ? new Null()
        : typeof value === 'boolean'
          ? bool
          : typeof value === 'number'
            ? new Float64()
            : typeof value === 'bigint'
              ? new Int64()
              : new Utf8());
    validateValue(value, type);
    const rounded = roundToType(type)(value);
    const encoded = typeof value === 'string' ? encoder.encode(value) : undefined;
    const range: Range | undefined = encoded ? [encoded, 0, encoded.length] : undefined;
    return {
      field: new Field('literal', type, value === null),
      hasKernel: false,
      prepare: () => ({
        get: () => rounded,
        isNull: () => value === null,
        bytes: range ? () => range : undefined
      })
    };
  }
  if (ast.type === 'CallExpression') return bindCall(ast, options);
  if (ast.type === 'ConditionalExpression') {
    const condition = bind(ast.test, options, bool);
    requireType(condition, 'bool');
    let yes = bind(ast.consequent, options),
      no = bind(ast.alternate, options);
    if (isContextualLiteral(ast.consequent) && !DataType.isNull(no.field.type))
      yes = bind(ast.consequent, options, no.field.type);
    if (isContextualLiteral(ast.alternate)) no = bind(ast.alternate, options, yes.field.type);
    sameType(yes, no);
    const field = new Field('conditional', yes.field.type, yes.field.nullable || no.field.nullable);
    return {
      field,
      hasKernel: condition.hasKernel || yes.hasKernel || no.hasKernel,
      prepare(batch, active) {
        const test = condition.prepare(batch, active);
        // A vector kernel must receive its branch mask before it executes. Pure scalar paths stay lazy.
        const selected =
          yes.hasKernel || no.hasKernel
            ? active.map((value, row) => (value && test.get(row) === true ? 1 : 0))
            : undefined;
        const a = yes.prepare(batch, selected ?? active);
        const b = no.prepare(
          batch,
          selected ? active.map((value, row) => (value && !selected[row] ? 1 : 0)) : active
        );
        const choose = (row: number) =>
          (selected ? selected[row] : test.get(row) === true) ? a : b;
        return {
          get: row => choose(row).get(row),
          isNull: row => {
            const branch = choose(row);
            return branch.isNull ? branch.isNull(row) : branch.get(row) === null;
          },
          bytes: typeKey(field.type) === 'utf8' ? row => bytes(choose(row), row) : undefined
        };
      }
    };
  }
  if (ast.type === 'UnaryExpression') {
    const argument = bind(ast.argument, options, ast.operator === '!' ? bool : undefined);
    if (ast.operator === '!') requireType(argument, 'bool');
    else if (ast.operator === '+' || ast.operator === '-') requireNumeric(argument);
    else throw new Error(`Unsupported unary operator: ${ast.operator}`);
    const validate = createValueValidator(argument.field.type);
    const round = roundToType(argument.field.type);
    return {
      field: new Field('unary', argument.field.type, argument.field.nullable),
      hasKernel: argument.hasKernel,
      prepare(batch, active) {
        const child = argument.prepare(batch, active);
        return {
          get: row => {
            const value = child.get(row);
            if (value === null) return null;
            const result =
              ast.operator === '!' ? !value : ast.operator === '+' ? value : -(value as any);
            validate(result);
            return round(result);
          }
        };
      }
    };
  }
  if (ast.type === 'BinaryExpression' || ast.type === 'LogicalExpression')
    return bindBinary(ast, options);
  throw new Error(`Unsupported Arrow expression syntax: ${ast.type}`);
}

/** Rejects implicit coercion between operands. */
function sameType(a: Node, b: Node): void {
  if (typeKey(a.field.type) !== typeKey(b.field.type))
    throw new Error('Arrow expression operand types must match');
}
/** Requires a particular primitive type. */
function requireType(node: Node, key: string): void {
  if (typeKey(node.field.type) !== key) throw new Error(`Arrow expression requires ${key}`);
}
/** Requires a numeric primitive. */
function requireNumeric(node: Node): void {
  if (!DataType.isInt(node.field.type) && !DataType.isFloat(node.field.type))
    throw new Error('Arrow expression requires numeric operands');
}

/** Fuses primitive operations; only kernel boundaries require a mask prepass. */
function bindBinary(ast: any, options: ArrowExpressionOptions): Node {
  const op = ast.operator,
    logical = op === '&&' || op === '||';
  let left = bind(ast.left, options, logical ? bool : undefined),
    right = bind(ast.right, options, logical ? bool : undefined);
  if (!logical) {
    if (isContextualLiteral(ast.left) && !DataType.isNull(right.field.type))
      left = bind(ast.left, options, right.field.type);
    if (isContextualLiteral(ast.right)) right = bind(ast.right, options, left.field.type);
  }
  sameType(left, right);
  const comparison = ['==', '===', '!=', '!==', '<', '<=', '>', '>='].includes(op);
  if (logical) requireType(left, 'bool');
  else if (!comparison) {
    if (!['+', '-', '*', '/', '%'].includes(op))
      throw new Error(`Unsupported binary operator: ${op}`);
    requireNumeric(left);
  }
  const type = left.field.type,
    utf8 = typeKey(type) === 'utf8',
    integer = DataType.isInt(type);
  const validate = createValueValidator(type);
  const round = roundToType(type);
  const field = new Field(
    'expression',
    logical || comparison ? bool : type,
    left.field.nullable || right.field.nullable
  );
  return {
    field,
    hasKernel: left.hasKernel || right.hasKernel,
    prepare(batch, active) {
      const a = left.prepare(batch, active);
      let truth: Uint8Array | undefined;
      let mask = active;
      if (logical && right.hasKernel) {
        truth = new Uint8Array(active.length);
        mask = active.map((value, row) => {
          if (!value) return 0;
          const x = a.get(row);
          truth![row] = x === null ? 2 : x ? 1 : 0;
          return (op === '&&' ? x !== false : x !== true) ? 1 : 0;
        });
      }
      const b = right.prepare(batch, mask);
      return {
        get: row => {
          if (logical) {
            const x = truth ? (truth[row] === 2 ? null : truth[row] === 1) : a.get(row);
            if (op === '&&' && x === false) return false;
            if (op === '||' && x === true) return true;
            const y = b.get(row);
            return op === '&&'
              ? y === false
                ? false
                : x === null || y === null
                  ? null
                  : true
              : y === true
                ? true
                : x === null || y === null
                  ? null
                  : false;
          }
          if (utf8) {
            const x = bytes(a, row),
              y = bytes(b, row);
            if (!x || !y) return null;
            return compare(op, compareUTF8(x[0], x[1], x[2], y[0], y[1], y[2]), 0);
          }
          const x = a.get(row) as any,
            y = b.get(row) as any;
          if (x === null || y === null) return null;
          if (comparison) return compare(op, x, y);
          if (integer && (op === '/' || op === '%') && (y === 0 || y === 0n))
            throw new RangeError('Division by zero');
          const result =
            op === '+'
              ? x + y
              : op === '-'
                ? x - y
                : op === '*'
                  ? x * y
                  : op === '/'
                    ? integer && typeof x === 'number'
                      ? Math.trunc(x / y)
                      : x / y
                    : x % y;
          validate(result);
          return round(result);
        }
      };
    }
  };
}

/** Primitive comparisons preserve IEEE NaN behavior. */
function compare(op: string, a: any, b: any): boolean {
  switch (op) {
    case '==':
    case '===':
      return a === b;
    case '!=':
    case '!==':
      return a !== b;
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    case '>':
      return a > b;
    case '>=':
      return a >= b;
    default:
      throw new Error('Invalid comparison');
  }
}

/** Binds built-ins and custom functions, materializing arguments only for vector kernels. */
function bindCall(ast: any, options: ArrowExpressionOptions): Node {
  if (ast.callee.type !== 'Identifier')
    throw new Error('Only registered named function calls are supported');
  const name = ast.callee.name;
  const conversion = ['toFloat64', 'toInt32', 'toInt64'].includes(name);
  const nullTest = name === 'isNull' || name === 'isNotNull';
  if (conversion || nullTest || ['parseNumber', 'parseBigInt', 'parseBoolean'].includes(name)) {
    if (ast.arguments.length !== 1) throw new Error(`${name} requires one argument`);
    const argument = bind(ast.arguments[0], options);
    if (conversion) requireNumeric(argument);
    else if (!nullTest) requireType(argument, 'utf8');
    const type =
      name === 'parseNumber' || name === 'toFloat64'
        ? new Float64()
        : name === 'toInt32'
          ? new Int32()
          : name === 'parseBigInt' || name === 'toInt64'
            ? new Int64()
            : bool;
    const validate = createValueValidator(type);
    const round = roundToType(type);
    const field = new Field(name, type, conversion ? argument.field.nullable : !nullTest);
    return {
      field,
      hasKernel: argument.hasKernel,
      prepare(batch, active) {
        const child = argument.prepare(batch, active);
        return {
          get: row => {
            if (nullTest) {
              const missing = child.isNull ? child.isNull(row) : child.get(row) === null;
              return name === 'isNull' ? missing : !missing;
            }
            if (conversion) {
              const value = child.get(row);
              if (value === null) return null;
              const result = name === 'toInt64' ? BigInt(value as number | bigint) : Number(value);
              validate(result);
              return result;
            }
            const range = bytes(child, row);
            if (!range) return null;
            const [buffer, start, end] = range;
            const result =
              (name === 'parseNumber'
                ? parseUTF8Number(buffer, start, end)
                : name === 'parseBigInt'
                  ? parseUTF8BigInt(buffer, start, end)
                  : parseUTF8Boolean(buffer, start, end)) ?? null;
            validate(result);
            return round(result);
          }
        };
      }
    };
  }
  const declaration = options.registry?.getFunction(name);
  if (!declaration) throw new Error(`Unknown Arrow function: ${name}`);
  if (ast.arguments.length !== declaration.arguments.length)
    throw new Error(`Wrong argument count for ${name}`);
  const arguments_ = ast.arguments.map((argument: any, index: number) => {
    const field = declaration.arguments[index]!;
    const vectorInput = !declaration.scalar;
    const bound = bind(argument, options, field.type, vectorInput);
    if (
      (vectorInput
        ? physicalKey(bound.field.type) !== physicalKey(field.type)
        : typeKey(bound.field.type) !== typeKey(field.type)) ||
      (vectorInput &&
        [...field.metadata].some(([key, value]) => bound.field.metadata.get(key) !== value))
    )
      throw new Error(`Argument type mismatch for ${name}`);
    if (declaration.nullHandling === 'call' && bound.field.nullable && !field.nullable)
      throw new Error(`Nullable argument not accepted by ${name}`);
    return bound;
  }) as Node[];
  const result = declaration.result;
  typeKey(result.type);
  const validate = createValueValidator(result.type);
  const round = roundToType(result.type);
  const field = new Field(
    result.name,
    valueType(result.type),
    result.nullable ||
      (declaration.nullHandling !== 'call' && arguments_.some(argument => argument.field.nullable)),
    result.metadata
  );
  return {
    field,
    hasKernel: Boolean(declaration.kernel) || arguments_.some(argument => argument.hasKernel),
    prepare(batch, active) {
      const children = arguments_.map(argument => argument.prepare(batch, active));
      let kernel: Prepared | undefined;
      let mask = active;
      if (declaration.kernel && active.some(Boolean)) {
        const vectors = children.map(
          (child, index) => child.vector ?? output(arguments_[index]!.field, active, child.get)
        );
        const readers = vectors.map(vector => new ColumnReader(vector));
        mask = active.map((value, row) =>
          value &&
          (declaration.nullHandling === 'call' || readers.every(reader => reader.isValid(row)))
            ? 1
            : 0
        );
        if (mask.some(Boolean)) {
          const vector = declaration.kernel(vectors, {
            activeRows: mask.slice(),
            length: active.length
          });
          if (vector.length !== active.length || typeKey(vector.type) !== typeKey(result.type))
            throw new Error(`Invalid kernel result for ${name}`);
          kernel = sourceReader(vector);
        }
      }
      return {
        get: row => {
          let value: ArrowExpressionValue;
          if (declaration.kernel) {
            if (!mask[row] || !kernel) return null;
            value = kernel.get(row);
          } else {
            const args = children.map(child => child.get(row));
            if (declaration.nullHandling !== 'call' && args.some(value => value === null))
              return null;
            value = declaration.scalar!(...args);
          }
          if (value === null && !result.nullable)
            throw new Error(`Function ${name} returned null for a non-nullable result`);
          validate(value);
          return round(value);
        }
      };
    }
  };
}

/** Preserve declared Float32 precision at fused operation boundaries. */
function roundToType(type: DataType): (value: ArrowExpressionValue) => ArrowExpressionValue {
  return typeKey(type) === 'f1'
    ? value => (value === null ? null : Math.fround(value as number))
    : value => value;
}

/** A signed number is one literal, including the negative limit of a signed integer. */
function isSignedLiteral(ast: any): boolean {
  return (
    ast.type === 'UnaryExpression' &&
    (ast.operator === '+' || ast.operator === '-') &&
    ast.argument.type === 'Literal' &&
    typeof ast.argument.value === 'number'
  );
}
function isContextualLiteral(ast: any): boolean {
  return ast.type === 'Literal' || isSignedLiteral(ast);
}

/** Geometry encoding/CRS metadata is part of a schema-bound vector function contract. */
function extensionKey(field: Field): string {
  return JSON.stringify([
    field.metadata.get('ARROW:extension:name'),
    field.metadata.get('ARROW:extension:metadata')
  ]);
}
