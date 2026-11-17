// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {isSQLParameterSnapshot, snapshotParameter, type SQLParameterSnapshot} from './parameter-snapshots';
import type {Expression} from '../expressions';
import {
  isColumnarPredicateValue,
  type ColumnarPredicateValue
} from '../expressions/columnar-predicate';

/** Numeric typed arrays accepted as array parameters (Uint8Array is binary unless tagged). */
export type SQLNumericArray =
  | Float32Array
  | Float64Array
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array;

/** Explicit interpretation of byte storage; numeric arrays may also use this form. */
export type SQLBinaryParameter =
  | Readonly<{type: 'utf8' | 'binary'; value: Uint8Array}>
  | Readonly<{type: 'array'; value: SQLNumericArray}>;

/** Bound SQL value, including flat lists and numeric tuples used by color palettes. */
export type SQLParameterValue =
  | ColumnarPredicateValue
  | SQLNumericArray
  | SQLBinaryParameter
  | null
  | readonly number[]
  | readonly string[]
  | readonly (readonly number[] | SQLNumericArray)[];

/** Caller-owned values keyed by case-sensitive names without the leading colon. */
export type SQLParameters = Readonly<Record<string, SQLParameterValue>>;

/** Bind values directly, or retain the existing custom AST interpretation callback. */
export type SQLParameterOptions = Readonly<{
  /** Values referenced by SQL placeholders such as `:minimum` or `:colors`. */
  parameters?: SQLParameters | SQLParameterSnapshot;
  /** Custom interpretation of a placeholder; mutually exclusive with parameters. */
  parseParameter?: (name: string) => Expression;
}>;

/** Rejects ambiguous binding configuration even when a statement has no placeholders. */
export function validateSQLParameterOptions(options: SQLParameterOptions): void {
  if (options.parameters !== undefined && options.parseParameter !== undefined) {
    throw new Error('SQL parameters and parseParameter are mutually exclusive');
  }
}

/** Resolves a named value into a copied literal AST without interpreting it as SQL. */
export function bindSQLParameter(name: string, options: SQLParameterOptions): Expression {
  if (options.parseParameter) return options.parseParameter(name);
  if (isSQLParameterSnapshot(options.parameters))
    return snapshotParameter(options.parameters as SQLParameterSnapshot, name);
  if (!Object.prototype.hasOwnProperty.call(options.parameters ?? {}, name)) {
    throw new Error(`SQL parameter ":${name}" requires a value`);
  }
  const value = options.parameters![name];
  if (isNumericArray(value) && !(value instanceof Uint8Array))
    return typedArrayLiteral(value, name);
  if (value && typeof value === 'object' && 'type' in value) {
    if (value.type === 'array' && isNumericArray(value.value))
      return typedArrayLiteral(value.value, name);
    if ((value.type === 'utf8' || value.type === 'binary') && value.value instanceof Uint8Array) {
      const data = new Uint8Array(value.value);
      if (value.type === 'binary') return literal(data);
      try {
        // Retain the portable string value and its supplied physical representation.
        // Scalar evaluators use value; Arrow comparisons consume utf8 directly.
        return {
          type: 'Literal',
          value: new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(data),
          utf8: data
        } as Expression;
      } catch {
        throw new Error(`SQL parameter ":${name}" requires valid UTF-8 bytes`);
      }
    }
    throw new Error(`SQL parameter ":${name}" has an unsupported binary format`);
  }
  if (Array.isArray(value)) {
    if (
      value.length > 4096 ||
      !(
        Array.from(value).every(item => typeof item === 'number' && Number.isFinite(item)) ||
        Array.from(value).every(item => typeof item === 'string') ||
        Array.from(value).every(
          item =>
            (Array.isArray(item) || isNumericArray(item)) &&
            item.length <= 4096 &&
            Array.from(item).every(
              component => typeof component === 'number' && Number.isFinite(component)
            )
        )
      )
    )
      throw new Error(`SQL parameter ":${name}" has an unsupported array value`);
    return arrayLiteral(value, name);
  }
  if (value !== null && !isColumnarPredicateValue(value)) {
    throw new Error(`SQL parameter ":${name}" has an unsupported value`);
  }
  return literal(
    value instanceof Date
      ? new Date(value.getTime())
      : value instanceof Uint8Array
        ? new Uint8Array(value)
        : value
  );
}

/** Builds an independent array tree; array elements are never identifiers or executable text. */
function arrayLiteral(values: readonly unknown[], name: string): Expression {
  return {
    type: 'ArrayExpression',
    elements: Array.from(values, value =>
      Array.isArray(value)
        ? arrayLiteral(value, name)
        : isNumericArray(value)
          ? typedArrayLiteral(value, name)
          : literal(value)
    )
  } as Expression;
}

/** Creates a typed literal, including scalar values that cannot be represented in JSON. */
function literal(value: unknown): Expression {
  if (value instanceof Uint8Array || value instanceof Date)
    return {type: 'Literal', value} as Expression;
  return {
    type: 'Literal',
    value,
    raw: typeof value === 'bigint' ? String(value) : JSON.stringify(value)
  } as Expression;
}

/** Recognizes supported numeric storage without treating DataView or bigint arrays as numbers. */
function isNumericArray(value: unknown): value is SQLNumericArray {
  return (
    value instanceof Float32Array ||
    value instanceof Float64Array ||
    value instanceof Int8Array ||
    value instanceof Uint8Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Int16Array ||
    value instanceof Uint16Array ||
    value instanceof Int32Array ||
    value instanceof Uint32Array
  );
}

/** Snapshots typed input and supplies equivalent portable elements for non-Arrow evaluators. */
function typedArrayLiteral(value: SQLNumericArray, name: string): Expression {
  if (value.length > 4096 || !value.every(Number.isFinite)) {
    throw new Error(`SQL parameter ":${name}" has an unsupported numeric array`);
  }
  const typedValues = value instanceof Uint8Array ? new Uint8Array(value) : value.slice();
  return {
    type: 'ArrayExpression',
    elements: Array.from(typedValues, item => literal(item)),
    typedValues
  } as Expression;
}
