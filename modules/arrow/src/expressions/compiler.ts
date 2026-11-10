// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Bool,
  Precision,
  DataType,
  Field,
  Float64,
  Float32,
  Float16,
  FixedSizeList,
  Dictionary,
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
import {bindCast} from './cast';
import {float16Values, roundFloat16} from './float16';
import {physicalKey, extensionKey} from './signature';
import {ArrowEvaluationError, isArrowEvaluationError} from './errors';
import {createFunctionLookup} from './registry';
import {
  isTupleType,
  nullTupleVector,
  maskTupleVector,
  validateTupleVector,
  selectTupleVectors,
  compileArrayLiteral
} from './list-values';
import type {
  ArrowTableFunction,
  ArrowTableFunctionPrototype,
  ArrowExpression,
  ArrowExpressionOptions,
  ArrowExpressionEvaluationOptions,
  ArrowExpressionValue,
  CompiledArrowExpression
} from './types';

type BindingOptions = ArrowExpressionOptions & {
  functionLookup: ReadonlyMap<string, ArrowTableFunction>;
};

type Mask = Uint8Array;
type ExecutionContext = {failed?: Uint8Array};
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
  prepare: (batch: RecordBatch, active: Mask, context: ExecutionContext) => Prepared;
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
  const root = bind(parse(expression), {
    ...options,
    functionLookup: createFunctionLookup(options.functions)
  });
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
    const prepared = root.prepare(batch, active, {});
    const result = isTupleType(root.field.type)
      ? maskTupleVector(prepared.vector!, active)
      : prepared.vector &&
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
      return chunks.length
        ? new Vector(chunks)
        : isTupleType(root.field.type)
          ? nullTupleVector(root.field.type, 0)
          : output(root.field, new Uint8Array(0), () => null);
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

/** Compiles a packed floating-point source-column projection, preserving Float64 unless explicitly narrowed. */
export function compileArrowArray(
  columns: readonly string[],
  options: ArrowExpressionOptions & {type?: 'float16' | 'float32' | 'float64'}
): CompiledArrowExpression {
  if (
    !Array.isArray(columns) ||
    !columns.length ||
    columns.length > 4096 ||
    Array.from(columns).some(name => typeof name !== 'string' || !name.length)
  )
    throw new Error('ARRAY requires 1 to 4096 source column names');
  if (options.type !== undefined && !['float16', 'float32', 'float64'].includes(options.type))
    throw new Error('Unsupported ARRAY precision');
  return compileArrowExpression(
    {
      type: 'CallExpression',
      callee: {type: 'Identifier', name: options.type ? `array_${options.type}` : 'array'},
      arguments: columns.map(name => ({type: 'Identifier', name}))
    } as Expression,
    options
  );
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
  const numericData =
    DataType.isFloat(type) && type.precision === Precision.HALF
      ? float16Values(data as Uint16Array)
      : data;
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
    } else numericData[row] = value as any;
  }
  return makeVector(
    makeData({
      type,
      data,
      length: active.length,
      nullBitmap: validity,
      nullCount
    } as any)
  );
}

/** Wraps a source vector without materializing rows or decoding string operands. */
function sourceReader(vector: Vector): Prepared {
  const data = vector.data[0];
  if (
    vector.data.length === 1 &&
    (DataType.isInt(data.type) ||
      (DataType.isFloat(data.type) && data.type.precision !== Precision.HALF))
  ) {
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

/** Keeps nested values on the vector path, with parent validity available to null tests. */
function vectorReader(vector: Vector): Prepared {
  try {
    typeKey(vector.type);
    return sourceReader(vector);
  } catch {
    // Nested layouts have no scalar callback representation.
  }
  const reader = new ColumnReader(vector);
  return {
    vector,
    isNull: row => !reader.isValid(row),
    get: () => {
      throw new Error('Nested values require a vector kernel');
    }
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

/** Wraps scalar reads only inside a recovery scope; normal fused paths remain allocation-free per row. */
function bind(ast: any, options: BindingOptions, expected?: DataType, vectorInput = false): Node {
  const node = bindNode(ast, options, expected, vectorInput);
  return {
    ...node,
    prepare(batch, active, context) {
      const mask = context.failed
        ? active.map((value, row) => (value && !context.failed![row] ? 1 : 0))
        : active;
      const prepared = node.prepare(batch, mask, context);
      if (!context.failed) return prepared;
      const guard = <T>(row: number, read: () => T): T | null => {
        if (!mask[row] || context.failed![row]) return null;
        try {
          const value = read();
          return context.failed![row] ? null : value;
        } catch (error) {
          if (!isArrowEvaluationError(error)) throw error;
          context.failed![row] = 1;
          return null;
        }
      };
      return {
        ...prepared,
        get: row => guard(row, () => prepared.get(row)),
        bytes: prepared.bytes ? row => guard(row, () => prepared.bytes!(row)) : undefined,
        isNull: row =>
          guard(row, () => (prepared.isNull ? prepared.isNull(row) : prepared.get(row) === null)) ??
          true
      };
    }
  };
}

/** Resolves earlier scalar inputs before later kernels can run in a recovery scope. */
function prepareInput(
  node: Node,
  batch: RecordBatch,
  active: Mask,
  context: ExecutionContext,
  force: boolean
): Prepared {
  const prepared = node.prepare(batch, active, context);
  if (!context.failed || !force || prepared.vector) return prepared;
  const mask = active.map((value, row) => (value && !context.failed![row] ? 1 : 0));
  const field = new Field(node.field.name, node.field.type, true, node.field.metadata);
  return sourceReader(output(field, mask, prepared.get));
}

/** Binds supported syntax to fused per-row operations and explicit vector boundaries. */
function bindNode(
  ast: any,
  options: BindingOptions,
  expected?: DataType,
  vectorInput = false
): Node {
  if (isSignedLiteral(ast)) {
    const value = ast.operator === '-' ? -ast.argument.value : ast.argument.value;
    return bind({type: 'Literal', value}, options, expected, vectorInput);
  }
  if (ast.type === 'ArrayExpression') {
    if (!expected) throw new Error('Array literals require a declared list type');
    const materialize = compileArrayLiteral(ast, expected);
    return {
      field: new Field('literal', expected, false),
      hasKernel: false,
      prepare: (_batch, active) => vectorReader(materialize(active.length))
    };
  }
  if (ast.type === 'Identifier') {
    const index = options.inputSchema.fields.findIndex(field => field.name === ast.name);
    if (index < 0) throw new Error(`Unknown Arrow expression field: ${ast.name}`);
    const source = options.inputSchema.fields[index]!;
    const tuple = isTupleType(source.type);
    if (!vectorInput && !tuple) typeKey(source.type);
    return {
      field: new Field(
        source.name,
        vectorInput ? source.type : valueType(source.type),
        source.nullable,
        source.metadata
      ),
      hasKernel: false,
      prepare: batch => {
        const vector = batch.getChildAt(index)!;
        return vectorInput || tuple ? vectorReader(vector) : sourceReader(vector);
      }
    };
  }
  if (ast.type === 'Literal') {
    if (vectorInput && expected && DataType.isDictionary(expected))
      throw new Error('Dictionary function arguments require a dictionary-encoded source column');
    let value = ast.value as ArrowExpressionValue;
    if (
      expected &&
      DataType.isInt(expected) &&
      expected.bitWidth === 64 &&
      typeof value === 'number' &&
      Number.isSafeInteger(value)
    )
      value = BigInt(value);
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
    if (value === null && isTupleType(type))
      return {
        field: new Field('literal', type, true),
        hasKernel: false,
        prepare: (_batch, active) => vectorReader(nullTupleVector(type, active.length))
      };
    if (value === null && DataType.isList(type)) {
      const dictionary = vectorFromArray([null], type);
      return {
        field: new Field('literal', type, true),
        hasKernel: false,
        prepare: (_batch, active) =>
          vectorReader(
            makeVector(
              makeData({
                type: new Dictionary(type, new Int32()),
                length: active.length,
                data: new Int32Array(active.length),
                dictionary
              })
            )
          )
      };
    }
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
    // A computed conditional produces logical values, even when passed to a vector kernel.
    // Raw dictionary encodings are retained only for direct source arguments.
    let yes: Node, no: Node;
    if (isContextualLiteral(ast.consequent) && !isContextualLiteral(ast.alternate)) {
      no = bind(ast.alternate, options, expected);
      yes = bind(ast.consequent, options, no.field.type);
    } else {
      yes = bind(ast.consequent, options, expected);
      no = bind(
        ast.alternate,
        options,
        isContextualLiteral(ast.alternate) && !DataType.isNull(yes.field.type)
          ? yes.field.type
          : expected
      );
      if (isContextualLiteral(ast.consequent) && !DataType.isNull(no.field.type))
        yes = bind(ast.consequent, options, no.field.type);
    }
    const tuple = isTupleType(yes.field.type);
    const list = DataType.isList(yes.field.type);
    if (tuple || list) {
      if (physicalKey(yes.field.type) !== physicalKey(no.field.type))
        throw new Error('Arrow expression operand types must match');
      if (
        !isContextualLiteral(ast.consequent) &&
        !isContextualLiteral(ast.alternate) &&
        extensionKey(yes.field) !== extensionKey(no.field)
      )
        throw new Error('Arrow expression branch extension metadata must match');
    } else sameType(yes, no);
    const metadata = isContextualLiteral(ast.consequent) ? no.field.metadata : yes.field.metadata;
    const field = new Field(
      'conditional',
      yes.field.type,
      yes.field.nullable || no.field.nullable,
      metadata
    );
    return {
      field,
      hasKernel: tuple || list || condition.hasKernel || yes.hasKernel || no.hasKernel,
      prepare(batch, active, context) {
        const test = condition.prepare(batch, active, context);
        // A vector kernel must receive its branch mask before it executes. Pure scalar paths stay lazy.
        const selected =
          tuple || list || yes.hasKernel || no.hasKernel
            ? active.map((value, row) => (value && test.get(row) === true ? 1 : 0))
            : undefined;
        const a = yes.prepare(batch, selected ?? active, context);
        const b = no.prepare(
          batch,
          selected ? active.map((value, row) => (value && !selected[row] ? 1 : 0)) : active,
          context
        );
        if (list) {
          const av = a.vector!,
            bv = b.vector!;
          if (!DataType.isDictionary(av.type) || !DataType.isDictionary(bv.type))
            throw new Error('Conditional List values currently require array literal branches');
          const left = av.data[0]!.dictionary!,
            right = bv.data[0]!.dictionary!;
          const dictionary = left.concat(right);
          const indices = Int32Array.from(selected!, (value, row) =>
            value ? Number(av.data[0]!.values[row]) : left.length + Number(bv.data[0]!.values[row])
          );
          return vectorReader(
            makeVector(
              makeData({
                type: new Dictionary(field.type, new Int32()),
                length: active.length,
                data: indices,
                dictionary
              })
            )
          );
        }
        if (isTupleType(field.type)) {
          const validActive = context.failed
            ? active.map((value, row) => (value && !context.failed![row] ? 1 : 0))
            : active;
          const yesMask = validActive.map((value, row) => (value && selected![row] ? 1 : 0));
          const noMask = validActive.map((value, row) => (value && !selected![row] ? 1 : 0));
          validateTupleVector(a.vector!, yes.field, yesMask);
          validateTupleVector(b.vector!, no.field, noMask);
          return vectorReader(
            selectTupleVectors(field.type, a.vector!, b.vector!, yesMask, validActive)
          );
        }
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
      prepare(batch, active, context) {
        const child = argument.prepare(batch, active, context);
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
function bindBinary(ast: any, options: BindingOptions): Node {
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
    prepare(batch, active, context) {
      const a = prepareInput(left, batch, active, context, left.hasKernel || right.hasKernel);
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
      const b = right.prepare(batch, mask, context);
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
          if ((op === '/' || op === '%') && (y === 0 || y === 0n))
            throw new ArrowEvaluationError('divisionByZero', 'Division by zero');
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
          const rounded = round(result);
          if (!integer && Number.isFinite(x) && Number.isFinite(y) && !Number.isFinite(rounded))
            throw new ArrowEvaluationError('overflow', 'Floating expression overflow');
          return rounded;
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

/** Materializes one recovery boundary without retrying callbacks or leaking row errors outward. */
function bindRecovery(name: string, expressions: any[], options: BindingOptions): Node {
  if (name === 'TRY' ? expressions.length < 1 || expressions.length > 2 : !expressions.length)
    throw new Error(`${name} has an invalid argument count`);
  let nodes: Node[];
  const typed = expressions.findIndex(expression => !isContextualLiteral(expression));
  const nonNull = expressions.findIndex(
    expression => !(expression.type === 'Literal' && expression.value === null)
  );
  const first = bind(expressions[typed < 0 ? Math.max(0, nonNull) : typed], options);
  nodes = expressions.map(expression => bind(expression, options, first.field.type));
  for (const node of nodes) {
    if (
      physicalKey(node.field.type) !== physicalKey(first.field.type) ||
      extensionKey(node.field) !== extensionKey(first.field)
    )
      throw new Error(`${name} arguments must have matching types and metadata`);
  }
  const field = new Field(name.toLowerCase(), first.field.type, true, first.field.metadata);
  const tuple = isTupleType(field.type);
  if (!tuple) typeKey(field.type);
  return {
    field,
    hasKernel: true,
    prepare(batch, active, context) {
      const failed = new Uint8Array(active.length);
      const childContext = name === 'TRY' ? {failed} : context;
      const child = nodes[0]!.prepare(batch, active, childContext);
      const nullable = (node: Node) =>
        new Field(node.field.name, node.field.type, true, node.field.metadata);
      const materialize = (node: Node, prepared: Prepared, mask: Mask): Vector =>
        tuple
          ? maskTupleVector(prepared.vector!, mask)
          : output(nullable(node), mask, prepared.get);
      const original = materialize(nodes[0]!, child, active);
      const reader = tuple ? undefined : new ColumnReader(original);
      let result = original;
      let pending = active.map((value, row) =>
        value &&
        (name === 'TRY' ? failed[row] : tuple ? !original.isValid(row) : !reader!.isValid(row))
          ? 1
          : 0
      );
      // A reported tuple error must be masked before selecting fallback values.
      if (tuple && name === 'TRY')
        result = maskTupleVector(
          result,
          active.map((value, row) => (value && !failed[row] ? 1 : 0))
        );
      for (let index = 1; index < nodes.length && pending.some(Boolean); index++) {
        const node = nodes[index]!;
        const fallback = node.prepare(batch, pending, context);
        const vector = materialize(node, fallback, pending);
        const keep = active.map((value, row) => (value && !pending[row] ? 1 : 0));
        if (tuple)
          result = selectTupleVectors(field.type as FixedSizeList, result, vector, keep, active);
        else {
          const a = new ColumnReader(result),
            b = new ColumnReader(vector);
          result = output(field, active, row => (pending[row] ? b.get(row) : a.get(row)));
        }
        const next = tuple ? undefined : new ColumnReader(vector);
        pending = pending.map((value, row) =>
          value && (tuple ? !vector.isValid(row) : !next!.isValid(row)) ? 1 : 0
        );
      }
      return vectorReader(result);
    }
  };
}

/** Binds built-ins and custom functions, materializing arguments only for vector kernels. */
function bindCall(ast: any, options: BindingOptions): Node {
  if (ast.callee.type !== 'Identifier')
    throw new Error('Only registered named function calls are supported');
  let name = ast.callee.name;
  if (ast.sqlFunction && ['TRY', 'COALESCE'].includes(name.toUpperCase()))
    name = name.toUpperCase();
  if (['TRY', 'COALESCE'].includes(name)) return bindRecovery(name, ast.arguments, options);
  if (ast.sqlFunction) {
    const matches = [
      ...options.functionLookup.keys(),
      'array',
      'array_float16',
      'array_float32',
      'array_float64',
      'cast',
      'isNull',
      'isNotNull',
      'parseNumber',
      'parseBigInt',
      'parseBoolean',
      'toFloat64',
      'toInt32',
      'toInt64'
    ].filter(key => key.toUpperCase() === name.toUpperCase());
    if (matches.length > 1) throw new Error(`Ambiguous SQL function: ${name}`);
    name = matches[0] ?? name;
  }
  if (['array', 'array_float16', 'array_float32', 'array_float64'].includes(name)) {
    if (!ast.arguments.length || ast.arguments.length > 4096)
      throw new Error('ARRAY requires 1 to 4096 numeric expressions');
    const arguments_ = ast.arguments.map((value: any) => bind(value, options)) as Node[];
    if (
      arguments_.some(
        value =>
          !DataType.isFloat(valueType(value.field.type)) &&
          !DataType.isInt(valueType(value.field.type))
      )
    )
      throw new Error('ARRAY requires numeric expressions');
    const component =
      name === 'array_float16'
        ? new Float16()
        : name === 'array_float32'
          ? new Float32()
          : name === 'array_float64' ||
              arguments_.every(value => DataType.isInt(valueType(value.field.type))) ||
              arguments_.some(value => typeKey(value.field.type) === 'f2')
            ? new Float64()
            : arguments_.some(value => typeKey(value.field.type) === 'f1')
              ? new Float32()
              : new Float16();
    const type = new FixedSizeList(arguments_.length, new Field('value', component, false));
    const field = new Field(
      'array',
      type,
      arguments_.some(value => value.field.nullable)
    );
    return {
      field,
      hasKernel: true,
      prepare(batch, active, context) {
        const values = arguments_.map(value =>
          prepareInput(
            value,
            batch,
            active,
            context,
            arguments_.some(argument => argument.hasKernel)
          )
        );
        const vector = nullTupleVector(type, active.length),
          data = vector.data[0]!,
          output =
            component.precision === Precision.HALF
              ? float16Values(data.children[0]!.values as Uint16Array)
              : data.children[0]!.values;
        const rowValues: (number | bigint | null)[] = new Array(values.length);
        for (let row = 0; row < active.length; row++) {
          if (!active[row]) continue;
          for (let column = 0; column < values.length; column++)
            rowValues[column] = values[column]!.get(row) as number | bigint | null;
          if (rowValues.some(value => value === null)) continue;
          try {
            for (let column = 0; column < values.length; column++) {
              const index = row * values.length + column;
              const value = Number(rowValues[column]);
              output[index] = value;
              if (Number.isFinite(value) && !Number.isFinite(output[index]))
                throw new ArrowEvaluationError('overflow', 'ARRAY cast overflow');
            }
          } catch (error) {
            if (!context.failed || !isArrowEvaluationError(error)) throw error;
            context.failed[row] = 1;
            output.fill(0, row * values.length, (row + 1) * values.length);
            continue;
          }
          data.setValid(row, true);
        }
        return vectorReader(vector);
      }
    };
  }
  if (name === 'cast') {
    if (ast.arguments.length !== 2 || ast.arguments[1]?.type !== 'Literal')
      throw new Error('cast requires a value and a literal scalar target');
    const argument = bind(ast.arguments[0], options);
    const cast = bindCast(argument.field.type, ast.arguments[1].value);
    return {
      field: new Field('cast', cast.type, argument.field.nullable),
      hasKernel: argument.hasKernel,
      prepare(batch, active, context) {
        const child = argument.prepare(batch, active, context);
        return {
          get: row =>
            cast.textInput && !DataType.isUtf8(cast.type)
              ? cast.evaluate(null, bytes(child, row))
              : cast.evaluate(child.get(row))
        };
      }
    };
  }
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
      prepare(batch, active, context) {
        const child = argument.prepare(batch, active, context);
        return {
          get: row => {
            if (nullTest) {
              const missing = child.isNull ? child.isNull(row) : child.get(row) === null;
              return name === 'isNull' ? missing : !missing;
            }
            if (conversion) {
              const value = child.get(row);
              if (value === null) return null;
              if (name === 'toInt64' && typeof value === 'number' && !Number.isInteger(value))
                throw new ArrowEvaluationError(
                  'conversion',
                  'Int64 conversion requires a finite integer'
                );
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
  const group = options.functionLookup.get(name);
  if (!group) throw new Error(`Unknown Arrow function: ${name}`);
  const inferred = ast.arguments.map((argument: any) =>
    needsArgumentContext(argument) ? undefined : bind(argument, options, undefined, true)
  ) as (Node | undefined)[];
  const candidates: {prototype: ArrowTableFunctionPrototype; arguments: Node[]; cost: number}[] =
    [];
  const allLiteralArguments = ast.arguments.every(isContextualLiteral);
  let contextualError: unknown;
  for (const prototype of group.prototypes) {
    if (ast.arguments.length !== prototype.arguments.length) continue;
    let cost = 0;
    const arguments_: Node[] = [];
    let compatible = true;
    for (let index = 0; index < ast.arguments.length; index++) {
      const argument = ast.arguments[index],
        field = prototype.arguments[index]!,
        source = inferred[index];
      let bound: Node;
      if (isContextualLiteral(argument) || !source) {
        try {
          bound = bind(argument, options, field.type, !prototype.evaluateScalar);
        } catch (error) {
          contextualError = error;
          compatible = false;
          break;
        }
        if (
          source &&
          allLiteralArguments &&
          physicalKey(valueType(source.field.type)) !== physicalKey(field.type)
        )
          cost += 4;
      } else {
        bound = source!;
      }
      // Contextual binding can retain a column's physical type (for example
      // flag ? intColumn : null). Validate it just like an inferred argument.
      const sourceType = valueType(bound.field.type);
      if (DataType.isDictionary(bound.field.type) && !DataType.isDictionary(field.type)) cost += 1;
      if (
        physicalKey(DataType.isDictionary(field.type) ? bound.field.type : sourceType) !==
        physicalKey(field.type)
      ) {
        if (
          DataType.isFloat(sourceType) &&
          DataType.isFloat(field.type) &&
          sourceType.precision < field.type.precision
        ) {
          cost += field.type.precision - sourceType.precision;
          const child = bound,
            round = roundToType(field.type);
          bound = {
            field: new Field(
              child.field.name,
              field.type,
              child.field.nullable,
              child.field.metadata
            ),
            hasKernel: child.hasKernel,
            prepare(batch, active, context) {
              const prepared = child.prepare(batch, active, context);
              return {get: row => round(prepared.get(row))};
            }
          };
        } else {
          compatible = false;
          break;
        }
      }
      if (
        [...field.metadata].some(([key, value]) => bound.field.metadata.get(key) !== value) ||
        (prototype.nullHandling === 'call' && bound.field.nullable && !field.nullable)
      ) {
        compatible = false;
        break;
      }
      arguments_.push(bound);
    }
    if (compatible) candidates.push({prototype, arguments: arguments_, cost});
  }
  const untypedNumeric = (value: any): boolean =>
    (value.type === 'Literal' && (value.value === null || typeof value.value === 'number')) ||
    isSignedLiteral(value) ||
    (value.type === 'ConditionalExpression' &&
      untypedNumeric(value.consequent) &&
      untypedNumeric(value.alternate));
  const allFloat64 = (prototype: ArrowTableFunctionPrototype) =>
    prototype.arguments.every(
      field => DataType.isFloat(field.type) && field.type.precision === Precision.DOUBLE
    );
  if (
    ast.arguments.every(untypedNumeric) &&
    candidates.every(candidate =>
      candidate.prototype.arguments.every(
        field => DataType.isInt(field.type) || DataType.isFloat(field.type)
      )
    ) &&
    candidates.some(candidate => allFloat64(candidate.prototype))
  ) {
    for (const candidate of candidates) if (!allFloat64(candidate.prototype)) candidate.cost++;
  }
  candidates.sort((a, b) => a.cost - b.cost);
  if (!candidates.length && group.prototypes.length === 1 && contextualError) throw contextualError;
  if (!candidates.length)
    throw new Error(`Argument type mismatch or wrong argument count for ${name}`);
  if (candidates[1]?.cost === candidates[0]!.cost)
    throw new Error(`Ambiguous Arrow function call: ${name}`);
  const declaration = candidates[0]!.prototype;
  const arguments_ = candidates[0]!.arguments;
  const evaluateVector = declaration.evaluateScalar ? undefined : declaration.evaluate;
  const result = declaration.result;
  const tuple = isTupleType(result.type);
  if (tuple && declaration.evaluateScalar)
    throw new Error('Fixed-size list results require a vector-only function');
  if (!tuple) typeKey(result.type);
  const validate = tuple ? undefined : createValueValidator(result.type);
  const round = tuple ? undefined : roundToType(result.type);
  const field = new Field(
    result.name,
    valueType(result.type),
    result.nullable ||
      (declaration.nullHandling !== 'call' && arguments_.some(argument => argument.field.nullable)),
    result.metadata
  );
  return {
    field,
    hasKernel: Boolean(evaluateVector) || arguments_.some(argument => argument.hasKernel),
    prepare(batch, active, context) {
      const children = arguments_.map(argument =>
        prepareInput(
          argument,
          batch,
          active,
          context,
          Boolean(evaluateVector) || arguments_.some(value => value.hasKernel)
        )
      );
      let kernel: Prepared | undefined;
      let mask = active;
      if (evaluateVector && active.some(Boolean)) {
        const vectors = children.map(
          (child, index) =>
            child.vector ??
            output(
              arguments_[index]!.field,
              context.failed
                ? active.map((value, row) => (value && !context.failed![row] ? 1 : 0))
                : active,
              child.get
            )
        );
        const readers = vectors.map(vector => new ColumnReader(vector));
        mask = active.map((value, row) =>
          value &&
          !context.failed?.[row] &&
          (declaration.nullHandling === 'call' || readers.every(reader => reader.isValid(row)))
            ? 1
            : 0
        );
        if (mask.some(Boolean)) {
          const vector = evaluateVector(vectors, {
            activeRows: mask,
            length: active.length,
            reportError(row, error) {
              if (!Number.isInteger(row) || row < 0 || row >= active.length || !mask[row])
                throw new Error('Kernel reported an inactive or invalid row');
              if (!context.failed || !isArrowEvaluationError(error)) throw error;
              context.failed[row] = 1;
              mask[row] = 0;
            }
          });
          if (
            vector.length !== active.length ||
            (tuple
              ? physicalKey(vector.type) !== physicalKey(result.type)
              : typeKey(vector.type) !== typeKey(result.type))
          )
            throw new Error(`Invalid kernel result for ${name}`);
          if (tuple) {
            validateTupleVector(vector, result, mask);
            return vectorReader(maskTupleVector(vector, mask));
          }
          kernel = sourceReader(vector);
        }
      }
      if (isTupleType(result.type))
        return vectorReader(nullTupleVector(result.type, active.length));
      return {
        get: row => {
          let value: ArrowExpressionValue;
          if (evaluateVector) {
            if (!mask[row] || !kernel) return null;
            value = kernel.get(row);
          } else {
            const args = children.map(child => child.get(row));
            if (context.failed?.[row]) return null;
            if (declaration.nullHandling !== 'call' && args.some(value => value === null))
              return null;
            value = declaration.evaluateScalar!(...args);
          }
          if (value === null && !result.nullable)
            throw new Error(`Function ${name} returned null for a non-nullable result`);
          validate!(value);
          return round!(value);
        }
      };
    }
  };
}

/** Preserve declared Float32 precision at fused operation boundaries. */
function roundToType(type: DataType): (value: ArrowExpressionValue) => ArrowExpressionValue {
  if (typeKey(type) === 'f0') {
    const round = roundFloat16();
    return value => (value === null ? null : round(value as number));
  }
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
  return (
    ast.type === 'Literal' ||
    ast.type === 'ArrayExpression' ||
    isSignedLiteral(ast) ||
    (ast.type === 'ConditionalExpression' &&
      isContextualLiteral(ast.consequent) &&
      isContextualLiteral(ast.alternate))
  );
}

/** Array and null branches receive their list/tuple type from the selected prototype. */
function needsArgumentContext(ast: any): boolean {
  return (
    ast.type === 'ArrayExpression' ||
    (ast.type === 'Literal' && ast.value === null) ||
    (ast.type === 'ConditionalExpression' &&
      (needsArgumentContext(ast.consequent) || needsArgumentContext(ast.alternate)))
  );
}
