// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Portable primitive conversion targets, independent of Arrow and SQL spelling. */
export type ColumnarScalarType =
  | 'int16'
  | 'int32'
  | 'int64'
  | 'float16'
  | 'float32'
  | 'float64'
  | 'bool'
  | 'utf8';
export const COLUMNAR_SCALAR_TYPES: readonly ColumnarScalarType[] = Object.freeze([
  'int16',
  'int32',
  'int64',
  'float16',
  'float32',
  'float64',
  'bool',
  'utf8'
]);

/** Rejects unknown conversion targets rather than silently applying JavaScript coercion. */
export function isColumnarScalarType(value: unknown): value is ColumnarScalarType {
  return typeof value === 'string' && (COLUMNAR_SCALAR_TYPES as readonly string[]).includes(value);
}
