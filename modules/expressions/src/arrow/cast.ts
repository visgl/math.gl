// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Binary,
  Bool,
  DataType,
  Dictionary,
  FixedSizeBinary,
  Float16,
  Float32,
  Float64,
  Int8,
  Int16,
  Int32,
  Int64,
  Uint8,
  Uint16,
  Uint32,
  Uint64,
  Utf8
} from 'apache-arrow';
import {isColumnarScalarType} from '../expressions/index';
import {parseUTF8Number, parseUTF8BigInt, parseUTF8Boolean} from '@math.gl/arrow/utf8';
import {ExpressionEvaluationError} from '../expressions/index';
import {bindTemporalCast} from './temporal-cast';
import {roundFloat16} from './float16';
import {typeKey, createValueValidator} from './buffers';
import type {ArrowExpressionValue} from './types';

/** Arrow constructors for portable scalar cast targets. */
const CAST_TYPES = {
  int8: Int8,
  int16: Int16,
  int32: Int32,
  int64: Int64,
  uint8: Uint8,
  uint16: Uint16,
  uint32: Uint32,
  uint64: Uint64,
  float16: Float16,
  float32: Float32,
  float64: Float64,
  bool: Bool,
  utf8: Utf8
};

type Range = [Uint8Array, number, number];

/** Resolves explicit scalar casts once, leaving active-row selection to the expression compiler. */
export function bindCast(source: DataType, target: unknown) {
  if (target === 'date' || target === 'timestamp' || target === 'timestamp_utc')
    return bindTemporalCast(source, target);
  const binaryTarget =
    typeof target === 'string' && /^(varbinary|fixedsizebinary):([1-9]\d*)$/.exec(target);
  if (target === 'binary' || binaryTarget) {
    const byteWidth = binaryTarget ? Number(binaryTarget[2]) : undefined;
    if (byteWidth !== undefined && byteWidth > 0x7fffffff)
      throw new Error('Binary CAST requires a positive 32-bit byte width');
    const type =
      binaryTarget && binaryTarget[1] === 'fixedsizebinary'
        ? new FixedSizeBinary(byteWidth!)
        : new Binary();
    const sourceKey = typeKey(source);
    const textInput = sourceKey === 'utf8';
    if (
      !textInput &&
      sourceKey !== 'null' &&
      sourceKey !== 'binary' &&
      !sourceKey.startsWith('fixedsizebinary:')
    )
      throw new Error('Binary CAST requires binary or UTF8 input');
    return {
      type,
      textInput,
      evaluate(value: ArrowExpressionValue, range?: Range | null): ArrowExpressionValue {
        const bytes = range ? range[0].subarray(range[1], range[2]) : (value as Uint8Array | null);
        if (bytes === null || byteWidth === undefined) return bytes;
        if (bytes.byteLength > byteWidth)
          throw new ExpressionEvaluationError('overflow', `Binary CAST exceeds ${byteWidth} bytes`);
        if (DataType.isFixedSizeBinary(type) && bytes.byteLength < byteWidth) {
          const padded = new Uint8Array(byteWidth);
          padded.set(bytes);
          return padded;
        }
        return bytes;
      }
    };
  }
  const dictionary = target === 'dictionary_utf8_int32';
  if (dictionary) target = 'utf8';
  if (!isColumnarScalarType(target)) throw new Error('Unsupported scalar CAST target');
  const type = new CAST_TYPES[target]();
  const integer = DataType.isInt(type);
  const wideInteger = integer && type.bitWidth === 64;
  const sourceKey = typeKey(source);
  const textInput = sourceKey === 'utf8';
  if (sourceKey === 'date32' || sourceKey.startsWith('timestamp_us:'))
    throw new Error('Temporal CAST requires a matching temporal target');
  if (sourceKey === 'binary' || sourceKey.startsWith('fixedsizebinary:'))
    throw new Error('CAST from binary requires a binary target');
  if (
    sourceKey !== 'null' &&
    ((sourceKey === 'bool' && !['bool', 'utf8'].includes(target)) ||
      (target === 'bool' && !['bool', 'utf8'].includes(sourceKey)))
  )
    throw new Error('CAST between Boolean and numeric values is not supported');
  const validate = createValueValidator(type);
  const halfRound = target === 'float16' ? roundFloat16() : undefined;
  const encoder = new TextEncoder();
  return {
    type: dictionary ? new Dictionary(new Utf8(), new Int32()) : type,
    textInput,
    evaluate(value: ArrowExpressionValue, range?: Range | null): ArrowExpressionValue {
      if (value === null && !range) return null;
      let result: ArrowExpressionValue;
      if (target === 'utf8') {
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        return String(value);
      }
      if (textInput) {
        const input =
          range ??
          (() => {
            const bytes = encoder.encode(value as string);
            return [bytes, 0, bytes.length] as Range;
          })();
        const [bytes, start, end] = input;
        result =
          target === 'bool'
            ? (parseUTF8Boolean(bytes, start, end) ?? null)
            : integer
              ? (parseUTF8BigInt(bytes, start, end) ?? null)
              : (parseUTF8Number(bytes, start, end) ?? null);
        if (result === null)
          throw new ExpressionEvaluationError('conversion', `Invalid text for CAST to ${target}`);
        if (integer && !wideInteger) result = Number(result);
      } else if (target === 'bool') result = value;
      else if (wideInteger) {
        if (typeof value === 'number' && !Number.isFinite(value))
          throw new ExpressionEvaluationError('conversion', 'Non-finite integer CAST');
        result = typeof value === 'bigint' ? value : BigInt(Math.trunc(value as number));
      } else if (integer) result = Math.trunc(Number(value));
      else result = Number(value);
      if (halfRound) result = halfRound(result as number);
      if (target === 'float32') result = Math.fround(result as number);
      if (
        (target === 'float16' || target === 'float32' || target === 'float64') &&
        !Number.isFinite(result)
      )
        throw new ExpressionEvaluationError(
          'overflow',
          'Floating CAST overflow or non-finite value'
        );
      validate(result);
      return result;
    }
  };
}
