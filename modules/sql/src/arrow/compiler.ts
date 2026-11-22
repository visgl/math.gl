// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Binary,
  Bool,
  Precision,
  DataType,
  DateUnit,
  TimeUnit,
  Field,
  Float64,
  Float32,
  Float16,
  FixedSizeList,
  Dictionary,
  Int64,
  TimestampMicrosecond,
  Int32,
  Uint8,
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
import {compareUTF8, parseUTF8Number, parseUTF8BigInt, parseUTF8Boolean} from '@math.gl/core/utf8';
import {parse, validateExpressionAST, type Expression} from '../expressions';
import {ColumnReader, typeKey, valueType, validateValue, createValueValidator} from './buffers';
import {bindCast} from './cast';
import {compileUTF8Like} from './like';
import {float16Values, roundFloat16} from './float16';
import {physicalKey, extensionKey} from './signature';
import {evaluateVectorSpans, nullVectorData, selectUnionVectors} from './vector-mask';
import {ExpressionEvaluationError, isExpressionEvaluationError} from '../expressions';
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
  /** Use portable comparisons for values originating in a columnar predicate. */
  portablePredicate?: boolean;
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
  /** Preconverted literal storage, shared by all batches of a compiled expression. */
  constant?: Prepared;
  field: Field;
  hasKernel: boolean;
  prepare: (batch: RecordBatch, active: Mask, context: ExecutionContext) => Prepared;
};
const encoder = new TextEncoder();
const bool = new Bool();

/** Compiles a core expression AST against a fixed Arrow schema. */
export function compileArrowExpression(
  expression: ArrowExpression,
  options: ArrowExpressionOptions,
  portablePredicate = false
): CompiledArrowExpression {
  const fields = [...options.inputSchema.fields];
  if (new Set(fields.map(field => field.name)).size !== fields.length)
    throw new Error('Expression input field names must be unique');
  const ast = parse(expression);
  validateExpressionAST(ast);
  const root = bind(ast, {
    ...options,
    portablePredicate,
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
      : isVectorResult(root.field.type)
        ? nestedVector(prepared.vector!, root.field.type, active)
        : prepared.vector &&
            (root.constant ||
              (!DataType.isDictionary(prepared.vector.type) && !active.some(value => !value)))
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
          : isVectorResult(root.field.type)
            ? makeVector(nullVectorData(root.field.type, 0))
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
  options: ArrowExpressionOptions & {
    type?: 'float16' | 'float32' | 'float64' | 'uint8';
  }
): CompiledArrowExpression {
  if (
    !Array.isArray(columns) ||
    !columns.length ||
    columns.length > 4096 ||
    Array.from(columns).some(name => typeof name !== 'string' || !name.length)
  )
    throw new Error('ARRAY requires 1 to 4096 source column names');
  if (
    options.type !== undefined &&
    !['float16', 'float32', 'float64', 'uint8'].includes(options.type)
  )
    throw new Error('Unsupported ARRAY component type');
  return compileArrowExpression(
    {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: options.type ? `array_${options.type}` : 'array'
      },
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
  if (DataType.isUtf8(type) || DataType.isBinary(type) || DataType.isFixedSizeBinary(type)) {
    const values: ArrowExpressionValue[] = new Array(active.length).fill(null);
    for (let row = 0; row < active.length; row++)
      if (active[row]) {
        const value = evaluate(row);
        if (value === null && !field.nullable)
          throw new Error(`Non-nullable expression ${field.name} returned null`);
        validate(value);
        values[row] = value;
      }
    return vectorFromArray(values as any[], field.type);
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

/** Interleaves matching, non-null float columns without per-row scalar reads. */
function interleaveFloatColumns(
  type: FixedSizeList,
  values: Prepared[],
  active: Mask
): Vector | undefined {
  const component = type.children[0]!.type;
  if (!DataType.isFloat(component) || component.precision === Precision.HALF) {
    return undefined;
  }
  const ArrayType = component.precision === Precision.SINGLE ? Float32Array : Float64Array;
  const inputs: (Float32Array | Float64Array)[] = [];
  for (const value of values) {
    const vector = value.vector;
    const data = vector?.data[0];
    if (
      vector?.data.length !== 1 ||
      !data ||
      data.nullCount !== 0 ||
      data.length !== active.length ||
      !(data.values instanceof ArrayType)
    ) {
      return undefined;
    }
    // Arrow slices already offset primitive value views. Data.offset applies to validity.
    inputs.push(data.values);
  }
  if (active.includes(0)) {
    return undefined;
  }

  const width = inputs.length;
  const output = new ArrayType(active.length * width);
  for (let column = 0; column < width; column++) {
    const input = inputs[column]!;
    for (let row = 0; row < active.length; row++) {
      output[row * width + column] = input[row]!;
    }
  }
  const child = makeData({type: component, length: output.length, data: output});
  return makeVector(makeData({type, length: active.length, child, nullCount: 0}));
}

/** Obtains UTF-8 bytes, encoding only values returned by scalar functions. */
function bytes(value: Prepared, row: number): Range | null {
  if (value.bytes) return value.bytes(row);
  const text = value.get(row);
  if (text === null) return null;
  const encoded = encoder.encode(text as string);
  return [encoded, 0, encoded.length];
}

/** Wraps scalar reads only inside a recovery scope; normal fused paths avoid these guards. */
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
          if (!isExpressionEvaluationError(error)) throw error;
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

/** Converts a Date literal to the receiving Arrow temporal unit. */
function bindDateLiteral(date: Date, type: DataType | undefined): number | bigint {
  const milliseconds = date.getTime();
  if (type && DataType.isDate(type))
    return type.unit === DateUnit.DAY ? Math.floor(milliseconds / 86400000) : BigInt(milliseconds);
  if (type && DataType.isTimestamp(type)) {
    switch (type.unit) {
      case TimeUnit.SECOND:
        return milliseconds % 1000 === 0 ? BigInt(milliseconds / 1000) : milliseconds / 1000;
      case TimeUnit.MILLISECOND:
        return BigInt(milliseconds);
      case TimeUnit.NANOSECOND:
        return BigInt(milliseconds) * 1000000n;
    }
  }
  return BigInt(milliseconds) * 1000n;
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
    const vectorOnly = isTupleType(source.type) || DataType.isDenseUnion(source.type);
    if (!vectorInput && !vectorOnly) typeKey(source.type);
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
        return vectorInput || vectorOnly ? vectorReader(vector) : sourceReader(vector);
      }
    };
  }
  if (ast.type === 'Literal') {
    if (vectorInput && expected && DataType.isDictionary(expected))
      throw new Error('Dictionary function arguments require a dictionary-encoded source column');
    const date = ast.value instanceof Date ? ast.value : undefined;
    let value: ArrowExpressionValue = date ? bindDateLiteral(date, expected) : ast.value;
    if (value instanceof Uint8Array) value = new Uint8Array(value);
    // Portable numeric literals keep their input representation until comparison.
    const portableNumber =
      options.portablePredicate &&
      expected &&
      (DataType.isInt(expected) ||
        DataType.isFloat(expected) ||
        DataType.isTime(expected) ||
        DataType.isDuration(expected)) &&
      (typeof value === 'number' || typeof value === 'bigint');

    if (
      !portableNumber &&
      expected &&
      DataType.isInt(expected) &&
      expected.bitWidth === 64 &&
      typeof value === 'number' &&
      Number.isSafeInteger(value)
    )
      value = BigInt(value);
    const type =
      expected ??
      (date
        ? new TimestampMicrosecond('UTC')
        : value instanceof Uint8Array
          ? new Binary()
          : value === null
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
    if (value === null && isVectorResult(type))
      return {
        field: new Field('literal', type, true),
        hasKernel: false,
        prepare: (_batch, active) =>
          vectorReader(makeVector(nullVectorData(type, active.length)))
      };
    const fractionalTimestampSecond =
      date &&
      DataType.isTimestamp(type) &&
      type.unit === TimeUnit.SECOND &&
      typeof value === 'number';
    if (!portableNumber && !fractionalTimestampSecond) validateValue(value, type);
    const rounded = portableNumber ? value : roundToType(type)(value);
    if (typeof value === 'number' && Number.isFinite(value) && !Number.isFinite(rounded))
      throw new Error(`Numeric literal overflow for ${type}`);
    // A tagged UTF-8 parameter supplies physical bytes. Check the optional annotation
    // against the portable value once, so edited external ASTs cannot change semantics.
    const encoded =
      typeof value === 'string'
        ? ast.utf8 instanceof Uint8Array &&
          new TextDecoder('utf-8', {ignoreBOM: true}).decode(ast.utf8) === value
          ? new Uint8Array(ast.utf8)
          : encoder.encode(value)
        : undefined;
    const range: Range | undefined = encoded ? [encoded, 0, encoded.length] : undefined;
    const constant: Prepared = {
      get: () => rounded,
      isNull: () => value === null,
      bytes: range ? () => range : undefined
    };
    return {
      field: new Field('literal', type, value === null),
      hasKernel: false,
      constant,
      prepare: (_batch, active) => {
        if (!encoded) return constant;
        let vector: Vector | undefined;
        return {
          ...constant,
          // Comparisons only read bytes. Materialize physical UTF-8 only when a
          // projection or vector function actually requests a batch-sized vector.
          get vector() {
            if (!vector) vector = repeatUTF8(encoded, active);
            return vector;
          }
        };
      }
    };
  }
  if (ast.type === 'CallExpression') return bindCall(ast, options, expected);
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
    const nested = isVectorResult(yes.field.type);
    if (nested) {
      if (physicalKey(yes.field.type) !== physicalKey(no.field.type))
        throw new Error('Arrow expression operand types must match');
    } else sameType(yes, no);
    if (
      (nested || DataType.isBinary(yes.field.type)) &&
      !isContextualLiteral(ast.consequent) &&
      !isContextualLiteral(ast.alternate) &&
      extensionKey(yes.field) !== extensionKey(no.field)
    )
      throw new Error('Arrow expression branch extension metadata must match');
    const metadata = isContextualLiteral(ast.consequent) ? no.field.metadata : yes.field.metadata;
    const field = new Field(
      'conditional',
      yes.field.type,
      yes.field.nullable || no.field.nullable,
      metadata
    );
    return {
      field,
      hasKernel: nested || condition.hasKernel || yes.hasKernel || no.hasKernel,
      prepare(batch, active, context) {
        const test = condition.prepare(batch, active, context);
        // A vector kernel must receive its branch mask before it executes. Pure scalar paths stay lazy.
        const selected =
          nested || yes.hasKernel || no.hasKernel
            ? active.map((value, row) => (value && test.get(row) === true ? 1 : 0))
            : undefined;
        const a = yes.prepare(batch, selected ?? active, context);
        const b = no.prepare(
          batch,
          selected ? active.map((value, row) => (value && !selected[row] ? 1 : 0)) : active,
          context
        );
        if (list && DataType.isDictionary(a.vector!.type) && DataType.isDictionary(b.vector!.type))
          return vectorReader(
            selectListVectors(field.type, a.vector!, b.vector!, selected!, active)
          );
        if (tuple) {
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
        if (DataType.isDenseUnion(field.type)) {
          return vectorReader(
            selectUnionVectors(field.type, a.vector!, b.vector!, selected!, active, context.failed)
          );
        }
        if (nested) {
          const values = Array.from(active, (valid, row) =>
            valid && !context.failed?.[row]
              ? nestedValue((selected![row] ? a : b).vector!.get(row), field.type)
              : null
          );
          return vectorReader(vectorFromArray(values, field.type));
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
  const comparison = ['==', '===', '!=', '!==', '<', '<=', '>', '>='].includes(op);
  const portableComparison = comparison && options.portablePredicate;
  let left = bind(ast.left, options, logical ? bool : undefined);
  if (portableComparison && DataType.isNull(left.field.type)) return makeUnknownPredicate();
  let right: Node;
  if (portableComparison && ast.right.type === 'Literal') {
    right = bind(ast.right, options, left.field.type);
  } else {
    right = bind(ast.right, options, logical ? bool : undefined);
    if (!logical) {
      if (isContextualLiteral(ast.left) && !DataType.isNull(right.field.type))
        left = bind(ast.left, options, right.field.type);
      if (isContextualLiteral(ast.right)) right = bind(ast.right, options, left.field.type);
    }
  }
  sameType(left, right);
  if (logical) requireType(left, 'bool');
  else if (!comparison) {
    if (!['+', '-', '*', '/', '%'].includes(op))
      throw new Error(`Unsupported binary operator: ${op}`);
    requireNumeric(left);
  }
  const type = left.field.type,
    utf8 = typeKey(type) === 'utf8',
    binary = DataType.isBinary(type) || DataType.isFixedSizeBinary(type),
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
          if (binary) return compare(op, compareUTF8(x, 0, x.length, y, 0, y.length), 0);
          if (comparison) {
            if (portableComparison) {
              const left = portableMembershipKey(x);
              const right = portableMembershipKey(y);
              return compare(op, left, right);
            }
            return compare(op, x, y);
          }
          if ((op === '/' || op === '%') && (y === 0 || y === 0n))
            throw new ExpressionEvaluationError('divisionByZero', 'Division by zero');
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
            throw new ExpressionEvaluationError('overflow', 'Floating expression overflow');
          return rounded;
        }
      };
    }
  };
}

/** Gives integers the same predicate key without rounding large integers to Number. */
function portableMembershipKey(value: ArrowExpressionValue): ArrowExpressionValue {
  if (typeof value !== 'number') return value;
  if (!Number.isFinite(value))
    throw new ExpressionEvaluationError(
      'domain',
      'Arrow predicate cannot compare non-finite numbers'
    );
  return Number.isInteger(value) ? BigInt(value) : value;
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

/** Selects broadcast list arguments without decoding their elements. */
function selectListVectors(
  type: DataType,
  left: Vector,
  right: Vector,
  selected: Mask,
  active: Mask
): Vector {
  if (!DataType.isDictionary(left.type) || !DataType.isDictionary(right.type))
    throw new Error('Computed List arguments require array literal branches');
  const a = left.data[0]!,
    b = right.data[0]!;
  const leftDictionary = a.dictionary!,
    rightDictionary = b.dictionary!;
  const indices = new Int32Array(active.length);
  const valid = new Uint8Array(active.length);
  for (let row = 0; row < active.length; row++) {
    if (!active[row]) continue;
    if (selected[row]) {
      indices[row] = Number(a.values[row]);
      valid[row] = a.getValid(row) ? 1 : 0;
    } else {
      indices[row] = leftDictionary.length + Number(b.values[row]);
      valid[row] = b.getValid(row) ? 1 : 0;
    }
  }
  return maskTupleVector(
    makeVector(
      makeData({
        type: new Dictionary(type, new Int32()),
        length: active.length,
        data: indices,
        dictionary: leftDictionary.concat(rightDictionary)
      })
    ),
    valid
  );
}

/** Materializes one recovery boundary without retrying callbacks or leaking row errors outward. */
function bindRecovery(
  name: string,
  expressions: any[],
  options: BindingOptions,
  expected?: DataType
): Node {
  if (expected && DataType.isDictionary(expected))
    throw new Error('Dictionary function arguments require a dictionary-encoded source column');
  if (name === 'TRY' ? expressions.length < 1 || expressions.length > 2 : !expressions.length)
    throw new Error(`${name} has an invalid argument count`);
  const indices = expressions.map((_, index) => index);
  const ordered = [
    ...indices.filter(index => !isContextualLiteral(expressions[index])),
    ...indices.filter(index => isContextualLiteral(expressions[index]))
  ];
  let anchor = 0;
  let candidate: Node | undefined;
  for (const index of ordered) {
    const expression = expressions[index];
    if (!expected && isContextualLiteral(expression) && containsContextualArray(expression))
      continue;
    const node = bind(expression, options, expected);
    if (!candidate || !DataType.isNull(node.field.type)) {
      anchor = index;
      candidate = node;
    }
    if (!DataType.isNull(node.field.type)) break;
  }
  const first = candidate ?? bind(expressions[anchor], options, expected);
  const nodes = expressions.map((expression, index) =>
    index === anchor ? first : bind(expression, options, first.field.type)
  );
  for (const [index, node] of nodes.entries()) {
    if (
      physicalKey(node.field.type) !== physicalKey(first.field.type) ||
      (!isContextualLiteral(expressions[index]) &&
        extensionKey(node.field) !== extensionKey(first.field))
    )
      throw new Error(`${name} arguments must have matching types and metadata`);
  }
  const field = new Field(name.toLowerCase(), first.field.type, true, first.field.metadata);
  const tuple = isTupleType(field.type);
  const list = Boolean(expected && DataType.isList(expected) && DataType.isList(field.type));
  if (!tuple && !list) typeKey(field.type);
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
        tuple || list
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
      // Mask reported errors before selecting nested fallback values.
      if ((tuple || list) && name === 'TRY')
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
        else if (list) result = selectListVectors(field.type, result, vector, keep, active);
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

/** Labels opaque WKB bytes as geometry and preserves metadata from existing WKB fields. */
function bindGeometryCast(argument: Node): Node {
  const source = valueType(argument.field.type);
  const metadata = new Map(argument.field.metadata);
  const extension = metadata.get('ARROW:extension:name');
  if (
    (!DataType.isBinary(source) && !DataType.isNull(source)) ||
    (extension && extension !== 'geoarrow.wkb')
  )
    throw new Error('GEOMETRY CAST requires Binary WKB input');
  metadata.set('ARROW:extension:name', 'geoarrow.wkb');
  return {
    ...argument,
    field: new Field('cast', new Binary(), argument.field.nullable, metadata),
    prepare(batch, active, context) {
      const child = argument.prepare(batch, active, context);
      return {get: row => child.get(row)};
    }
  };
}

/** Binds a bounded IN list once, keeping the tested expression and casts as one subtree. */
function bindMembership(arguments_: any[], options: BindingOptions): Node {
  if (
    arguments_.length < 2 ||
    arguments_.length > 4097 ||
    arguments_.slice(1).some(value => value.type !== 'Literal' && !isSignedLiteral(value))
  )
    throw new Error('IN requires a value and 1 to 4096 scalar literals');
  const argument = bind(arguments_[0], options);
  if (options.portablePredicate && DataType.isNull(argument.field.type))
    return makeUnknownPredicate();
  const utf8 = typeKey(argument.field.type) === 'utf8';
  const binary =
    DataType.isBinary(argument.field.type) || DataType.isFixedSizeBinary(argument.field.type);
  const literals = arguments_.slice(1).map(value => bind(value, options, argument.field.type));
  // Every membership item is a scalar literal: convert and index once at compilation.
  const prepared = literals.map(value => value.constant!);
  const key = options.portablePredicate
    ? portableMembershipKey
    : (value: ArrowExpressionValue) => value;
  const values = new Set(prepared.map(value => key(value.get(0))));
  const ranges: Range[] = utf8
    ? prepared.map(value => bytes(value, 0)).filter((range): range is Range => range !== null)
    : binary
      ? prepared.flatMap(value => {
          const data = value.get(0) as Uint8Array | null;
          return data === null ? [] : [[data, 0, data.length] as Range];
        })
      : [];
  ranges.sort((a, b) => compareUTF8(a[0], a[1], a[2], b[0], b[1], b[2]));
  return {
    field: new Field(
      'in',
      bool,
      argument.field.nullable || literals.some(value => value.field.nullable)
    ),
    hasKernel: argument.hasKernel,
    prepare(batch, active, context) {
      const source = argument.prepare(batch, active, context);
      return {
        get(row) {
          if (utf8 || binary) {
            const data = binary ? (source.get(row) as Uint8Array | null) : null;
            const value: Range | null = utf8
              ? bytes(source, row)
              : data === null
                ? null
                : [data, 0, data.length];
            if (!value) return null;
            if (containsByteRange(ranges, value)) return true;
          } else {
            const value = source.get(row);
            if (value === null) return null;
            if ((options.portablePredicate || !Number.isNaN(value)) && values.has(key(value)))
              return true;
          }
          return values.has(null) ? null : false;
        }
      };
    }
  };
}

/** Broadcasts pre-encoded text to Arrow storage without re-encoding strings per row. */
function repeatUTF8(encoded: Uint8Array, active: Mask): Vector<Utf8> {
  const count = active.reduce((sum, value) => sum + value, 0);
  const data = new Uint8Array(count * encoded.length);
  const offsets = new Int32Array(active.length + 1);
  const validity = new Uint8Array(Math.ceil(active.length / 8));
  let position = 0;
  for (let row = 0; row < active.length; row++) {
    if (active[row]) {
      data.set(encoded, position);
      position += encoded.length;
      validity[row >> 3] |= 1 << (row & 7);
    }
    offsets[row + 1] = position;
  }
  return makeVector(
    makeData({
      type: new Utf8(),
      length: active.length,
      data,
      valueOffsets: offsets,
      nullBitmap: validity,
      nullCount: active.length - count
    })
  );
}

/** Searches pre-sorted UTF-8 or binary constants without decoding source values. */
function containsByteRange(ranges: readonly Range[], value: Range): boolean {
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    const candidate = ranges[middle]!;
    const order = compareUTF8(
      value[0],
      value[1],
      value[2],
      candidate[0],
      candidate[1],
      candidate[2]
    );
    if (order === 0) return true;
    if (order < 0) high = middle - 1;
    else low = middle + 1;
  }
  return false;
}

/** Binds SQL pattern matching and precompiles literal patterns. */
function bindLike(args: any[], options: BindingOptions, insensitive: boolean): Node {
  if (args.length < 2 || args.length > 3) throw new Error('LIKE requires two or three arguments');
  const value = bind(args[0], options, new Utf8());
  const pattern = bind(args[1], options, new Utf8());
  requireType(value, 'utf8');
  requireType(pattern, 'utf8');
  const escape = args[2];
  if (escape && (escape.type !== 'Literal' || typeof escape.value !== 'string')) {
    throw new Error('LIKE ESCAPE requires a literal character');
  }
  const compile = (text: string) => compileUTF8Like(text, insensitive, escape?.value);
  const literal = args[1].type === 'Literal' && typeof args[1].value === 'string';
  const matcher = literal ? compile(args[1].value) : undefined;
  return {
    field: new Field('like', bool, value.field.nullable || pattern.field.nullable),
    hasKernel: value.hasKernel || pattern.hasKernel,
    prepare(batch, active, context) {
      const source = value.prepare(batch, active, context);
      const patterns = pattern.prepare(batch, active, context);
      return {
        get(row) {
          const range = bytes(source, row);
          const text = patterns.get(row) as string | null;
          if (!range || text === null) return null;
          return (matcher || compile(text))(...range);
        }
      };
    }
  };
}

/** Converts a number to a byte without typed-array wraparound. */
function convertByte(value: number, normalized: boolean): number {
  if (!Number.isFinite(value))
    throw new ExpressionEvaluationError('conversion', 'Byte conversion requires a finite number');
  if (normalized) {
    if (value < 0 || value > 1)
      throw new ExpressionEvaluationError('domain', 'PACK_UNORM8 requires values in [0, 1]');
    return Math.round(value * 255);
  }
  const integer = Math.trunc(value);
  if (integer < 0 || integer > 255)
    throw new ExpressionEvaluationError('overflow', 'UINT8 cast overflow');
  return integer;
}

/** Packs fixed-size numeric tuples directly from child buffers, including sliced inputs. */
function bindPackUnorm8(arguments_: any[], options: BindingOptions): Node {
  if (arguments_.length !== 1) throw new Error('PACK_UNORM8 requires one fixed-size numeric array');
  const argument = bind(arguments_[0], options, undefined, true);
  const inputType = argument.field.type;
  if (!DataType.isFixedSizeList(inputType) || !inputType.listSize || inputType.listSize > 4096)
    throw new Error('PACK_UNORM8 requires a fixed-size numeric array of 1 to 4096 components');
  const width = inputType.listSize;
  const child = inputType.children[0]!;
  if (!DataType.isInt(valueType(child.type)) && !DataType.isFloat(valueType(child.type)))
    throw new Error('PACK_UNORM8 requires numeric components');
  const type = new FixedSizeList(width, new Field('value', new Uint8(), false));
  const field = new Field('pack_unorm8', type, argument.field.nullable || child.nullable);
  return {
    field,
    hasKernel: true,
    prepare(batch, active, context) {
      const input = argument.prepare(batch, active, context).vector!;
      const parent = new ColumnReader(input);
      const components = new ColumnReader(input.getChildAt(0)!);
      const result = nullTupleVector(type, active.length);
      const data = result.data[0]!;
      const bytes = data.children[0]!.values as Uint8Array;
      const rowValues = new Float64Array(width);
      for (let row = 0; row < active.length; row++) {
        if (!active[row] || context.failed?.[row] || !parent.isValid(row)) continue;
        const start = row * width;
        let valid = true;
        for (let component = 0; component < width; component++) {
          const value = components.get(start + component);
          if (value === null) {
            valid = false;
            break;
          }
          rowValues[component] = Number(value);
        }
        if (!valid) continue;
        try {
          for (let component = 0; component < width; component++)
            bytes[start + component] = convertByte(rowValues[component]!, true);
        } catch (error) {
          if (!context.failed || !isExpressionEvaluationError(error)) throw error;
          context.failed[row] = 1;
          bytes.fill(0, start, start + width);
          continue;
        }
        data.setValid(row, true);
      }
      return vectorReader(result);
    }
  };
}

/** Identifies the Arrow layouts that can be traversed with nested extraction. */
function isNestedType(type: DataType): boolean {
  return DataType.isStruct(type) || DataType.isList(type) || DataType.isFixedSizeList(type);
}

/** Identifies result types that require a vector kernel. */
function isVectorResult(type: DataType): boolean {
  return isNestedType(type) || DataType.isDenseUnion(type);
}

/** Converts nested Arrow values to builder inputs while preserving scalar values. */
function nestedValue(value: any, type: DataType): unknown {
  if (value == null) return null;
  if (DataType.isList(type) || DataType.isFixedSizeList(type))
    return Array.from(value as Vector, item => nestedValue(item, type.valueType));
  if (DataType.isStruct(type))
    return Object.fromEntries(
      type.children.map(field => [field.name, nestedValue(value[field.name], field.type)])
    );
  return value;
}

/** Masks nested results without coercing their child types. */
function nestedVector(vector: Vector, type: DataType, active: Mask): Vector {
  if (!active.some((valid, row) => !valid && vector.isValid(row))) return vector;
  if (DataType.isDenseUnion(type))
    return evaluateVectorSpans(vector, type, active, span => span);
  return vectorFromArray(
    Array.from(active, (valid, row) => (valid ? nestedValue(vector.get(row), type) : null)),
    type
  );
}

/** Returns a nullable Boolean expression for a comparison against a missing field. */
function makeUnknownPredicate(): Node {
  return {
    field: new Field('predicate', bool, true),
    hasKernel: false,
    prepare: () => ({get: () => null})
  };
}

/** Represents a missing portable property with an Arrow Null type. */
function makeMissingProperty(): Node {
  return {
    field: new Field('missing', new Null(), true),
    hasKernel: false,
    prepare: () => ({get: () => null, isNull: () => true})
  };
}

/** Binds list indexing and named struct access against the input Arrow types. */
function bindNestedExtract(
  name: 'LIST_EXTRACT' | 'STRUCT_EXTRACT',
  args: readonly Expression[],
  options: BindingOptions
): Node {
  if (args.length !== 2) throw new Error(`${name} requires two arguments`);
  const input = bind(args[0], options, undefined, true);
  const inputType = input.field.type;
  const selector = args[1]!;
  let child: Field;
  let index: Node | undefined;

  if (name === 'LIST_EXTRACT') {
    if (!DataType.isList(inputType) && !DataType.isFixedSizeList(inputType))
      throw new Error('LIST_EXTRACT requires an Arrow List or FixedSizeList');
    child = inputType.children[0]!;
    index = bind(selector, options);
    if (
      !DataType.isInt(index.field.type) &&
      !DataType.isFloat(index.field.type) &&
      !DataType.isNull(index.field.type)
    )
      throw new Error('LIST_EXTRACT requires an integer index');
  } else {
    if (!DataType.isStruct(inputType)) {
      if (options.portablePredicate) return makeMissingProperty();
      throw new Error('STRUCT_EXTRACT requires an Arrow Struct');
    }
    if (selector.type !== 'Literal' || typeof selector.value !== 'string')
      throw new Error('STRUCT_EXTRACT requires a literal field name');
    const field = inputType.children.find(candidate => candidate.name === selector.value);
    if (!field) {
      if (options.portablePredicate) return makeMissingProperty();
      throw new Error(`Unknown Arrow struct field: ${selector.value}`);
    }
    child = field;
  }
  const field = new Field(child.name, valueType(child.type), true, child.metadata);
  return {
    field,
    hasKernel: true,
    prepare(batch, active, context) {
      const inputValues = input.prepare(batch, active, context).vector!;
      const positions = index?.prepare(batch, active, context);
      const childValues = index ? undefined : inputValues.getChild(child.name)!;
      const values = Array.from(active, (valid, row) => {
        if (!valid || !inputValues.isValid(row)) return null;
        if (!positions) return nestedValue(childValues!.get(row), field.type);

        const position = positions.get(row);
        if (position === null) return null;
        const offset = Number(position);
        if (!Number.isSafeInteger(offset)) return null;
        const list = inputValues.get(row) as Vector;
        const element = offset < 0 ? list.length + offset : offset - 1;
        return element >= 0 && element < list.length
          ? nestedValue(list.get(element), field.type)
          : null;
      });
      return vectorReader(vectorFromArray(values, field.type));
    }
  };
}

/** Binds built-ins and custom functions, materializing arguments only for vector kernels. */
function bindCall(ast: any, options: BindingOptions, expected?: DataType): Node {
  if (ast.callee.type !== 'Identifier')
    throw new Error('Only registered named function calls are supported');
  let name = ast.callee.name;
  const recovery = recoveryName(ast);
  if (recovery) return bindRecovery(recovery, ast.arguments, options, expected);
  if (ast.sqlFunction) {
    const matches = [
      ...options.functionLookup.keys(),
      'array',
      'array_float16',
      'array_float32',
      'array_float64',
      'array_uint8',
      'PACK_UNORM8',
      'EPOCH_MS',
      'LIST_EXTRACT',
      'STRUCT_EXTRACT',
      'cast',
      'like',
      'ilike',
      'concat',
      'concatStrict',
      'upper',
      'lower',
      'capitalize',
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
  if (name === 'LIST_EXTRACT' || name === 'STRUCT_EXTRACT')
    return bindNestedExtract(name, ast.arguments, options);
  if (name === 'PACK_UNORM8') return bindPackUnorm8(ast.arguments, options);
  if (['array', 'array_float16', 'array_float32', 'array_float64', 'array_uint8'].includes(name)) {
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
      name === 'array_uint8'
        ? new Uint8()
        : name === 'array_float16'
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
    const plainColumns = ast.arguments.every(
      (argument: Expression) => argument.type === 'Identifier'
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
        if (plainColumns && !context.failed) {
          const packed = interleaveFloatColumns(type, values, active);
          if (packed) {
            return vectorReader(packed);
          }
        }
        const vector = nullTupleVector(type, active.length),
          data = vector.data[0]!,
          output =
            DataType.isFloat(component) && component.precision === Precision.HALF
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
              output[index] = name === 'array_uint8' ? convertByte(value, false) : value;
              if (Number.isFinite(value) && !Number.isFinite(output[index]))
                throw new ExpressionEvaluationError('overflow', 'ARRAY cast overflow');
            }
          } catch (error) {
            if (!context.failed || !isExpressionEvaluationError(error)) throw error;
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
  if (name === 'like' || name === 'ilike')
    return bindLike(ast.arguments, options, name === 'ilike');
  if (name === 'upper' || name === 'lower' || name === 'capitalize') {
    if (ast.arguments.length !== 1) throw new Error('Case conversion requires one argument');
    const arg = bind(ast.arguments[0], options, new Utf8());
    requireType(arg, 'utf8');
    return {
      field: new Field(name, new Utf8(), arg.field.nullable),
      hasKernel: arg.hasKernel,
      prepare(batch, active, context) {
        const input = arg.prepare(batch, active, context);
        return {
          get(row) {
            const value = input.get(row) as string | null;
            if (!value) return value;
            if (name === 'upper') return value.toUpperCase();
            if (name === 'lower') return value.toLowerCase();
            const first = String.fromCodePoint(value.codePointAt(0)!);
            return first.toUpperCase() + value.slice(first.length);
          }
        };
      }
    };
  }
  if (name === 'concat' || name === 'concatStrict') {
    if (!ast.arguments.length) throw new Error('CONCAT requires at least one argument');
    const args = ast.arguments.map((arg: any) => bind(arg, options, new Utf8()));
    for (const arg of args) requireType(arg, 'utf8');
    const strict = name === 'concatStrict';
    return {
      field: new Field(
        'concat',
        new Utf8(),
        strict && args.some((arg: Node) => arg.field.nullable)
      ),
      hasKernel: args.some((arg: Node) => arg.hasKernel),
      prepare(batch, active, context) {
        const inputs = args.map((arg: Node) => arg.prepare(batch, active, context));
        return {
          get(row) {
            let result = '';
            for (const input of inputs) {
              const value = input.get(row);
              if (value === null && strict) return null;
              if (value !== null) result += value;
            }
            return result;
          }
        };
      }
    };
  }
  if (name === 'in') return bindMembership(ast.arguments, options);
  if (name === 'EPOCH_MS') {
    if (ast.arguments.length !== 1) throw new Error('EPOCH_MS requires one argument');
    const argument = bind(ast.arguments[0], options);
    const key = typeKey(argument.field.type);
    if (key !== 'date32' && !key.startsWith('timestamp_us:')) {
      throw new Error('EPOCH_MS requires DATE or microsecond TIMESTAMP');
    }
    return {
      field: new Field('epoch_ms', new Float64(), argument.field.nullable),
      hasKernel: argument.hasKernel,
      prepare(batch, active, context) {
        const input = argument.prepare(batch, active, context);
        return {
          get(row) {
            const value = input.get(row);
            if (value === null) return null;
            // Divide before conversion to retain submillisecond precision around the epoch.
            return key === 'date32'
              ? Number(value) * 86400000
              : Number((value as bigint) / 1000n) + Number((value as bigint) % 1000n) / 1000;
          }
        };
      }
    };
  }
  if (name === 'cast') {
    if (ast.arguments.length !== 2 || ast.arguments[1]?.type !== 'Literal')
      throw new Error('cast requires a value and a literal scalar target');
    const argument = bind(ast.arguments[0], options);
    const target = ast.arguments[1].value;
    if (target === 'geometry') return bindGeometryCast(argument);
    const cast = bindCast(argument.field.type, target);
    return {
      field: new Field('cast', cast.type, argument.field.nullable),
      hasKernel: argument.hasKernel,
      prepare(batch, active, context) {
        const child = argument.prepare(batch, active, context);
        return {
          get: row =>
            cast.textInput && !DataType.isUtf8(valueType(cast.type))
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
                throw new ExpressionEvaluationError(
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
  const candidates: {
    prototype: ArrowTableFunctionPrototype;
    arguments: Node[];
    cost: number;
  }[] = [];
  const allLiteralArguments = ast.arguments.every(isContextualLiteral);
  let contextualError: unknown;
  // Try a schema-dependent overload only when no fixed overload matches.
  const resolvePrototype = group.resolvePrototype;
  const resolve = () =>
    resolvePrototype?.(
      inferred.map((node, index) => {
        if (node) return node.field;
        const argument = ast.arguments[index];
        return argument.type === 'ConditionalExpression' &&
          !isContextualLiteral(argument) &&
          !containsContextualArray(argument)
          ? bind(argument, options, undefined, true).field
          : undefined;
      }),
      ast.arguments.map((arg: Expression) =>
        arg.type === 'Literal' && typeof arg.value === 'number' ? arg.value : undefined
      )
    );
  for (let index = 0; index <= group.prototypes.length; index++) {
    const prototype = group.prototypes[index] ?? (candidates.length ? undefined : resolve());
    if (!prototype) break;
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
    Boolean(recoveryName(value) && value.arguments.every(untypedNumeric)) ||
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
  const nested = isVectorResult(result.type);
  if (nested && declaration.evaluateScalar) {
    throw new Error('Nested results require a vector-only function');
  }
  if (declaration.evaluateScalar) for (const argument of arguments_) typeKey(argument.field.type);
  const validate = nested ? undefined : createValueValidator(result.type);
  const round = nested ? undefined : roundToType(result.type);
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
              if (!context.failed || !isExpressionEvaluationError(error)) throw error;
              context.failed[row] = 1;
              mask[row] = 0;
            }
          });
          if (
            vector.length !== active.length ||
            (nested
              ? physicalKey(vector.type) !== physicalKey(result.type)
              : typeKey(vector.type) !== typeKey(result.type))
          )
            throw new Error(`Invalid kernel result for ${name}`);
          if (tuple) {
            validateTupleVector(vector, result, mask);
            return vectorReader(maskTupleVector(vector, mask));
          }
          if (nested) {
            if (!result.nullable && mask.some((valid, row) => valid && !vector.isValid(row))) {
              throw new Error(`Function ${name} returned null for a non-nullable result`);
            }
            return vectorReader(nestedVector(vector, result.type, mask));
          }
          if (
            DataType.isBinary(result.type) &&
            DataType.isBinary(vector.type) &&
            !mask.includes(0)
          ) {
            if (!result.nullable && vector.nullCount) {
              throw new Error(`Function ${name} returned null for a non-nullable result`);
            }
            return vectorReader(vector);
          }
          kernel = sourceReader(vector);
        }
      }
      if (tuple) return vectorReader(nullTupleVector(result.type, active.length));
      if (nested) {
        return vectorReader(makeVector(nullVectorData(result.type, active.length)));
      }
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
function recoveryName(ast: any): 'TRY' | 'COALESCE' | undefined {
  if (ast.type !== 'CallExpression' || ast.callee.type !== 'Identifier') return undefined;
  const name = ast.sqlFunction ? ast.callee.name.toUpperCase() : ast.callee.name;
  return name === 'TRY' || name === 'COALESCE' ? name : undefined;
}

function containsContextualArray(ast: any): boolean {
  return (
    ast.type === 'ArrayExpression' ||
    (ast.type === 'ConditionalExpression' &&
      (containsContextualArray(ast.consequent) || containsContextualArray(ast.alternate))) ||
    Boolean(recoveryName(ast) && ast.arguments.some(containsContextualArray))
  );
}

function isContextualLiteral(ast: any): boolean {
  return (
    ast.type === 'Literal' ||
    ast.type === 'ArrayExpression' ||
    isSignedLiteral(ast) ||
    Boolean(recoveryName(ast) && ast.arguments.every(isContextualLiteral)) ||
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
    Boolean(recoveryName(ast) && ast.arguments.some(containsContextualArray)) ||
    (ast.type === 'ConditionalExpression' &&
      (needsArgumentContext(ast.consequent) || needsArgumentContext(ast.alternate)))
  );
}

// Shared by the grouped relation executor, with the same physical value contract.
export {output as writeArrowExpressionValues};
