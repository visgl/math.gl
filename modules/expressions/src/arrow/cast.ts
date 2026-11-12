// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Bool, DataType, Float16, Float32, Float64, Int16, Int32, Int64, Utf8} from 'apache-arrow';
import {isColumnarScalarType} from '../expressions/index';
import {parseUTF8Number, parseUTF8BigInt, parseUTF8Boolean} from '@math.gl/arrow/utf8';
import {ExpressionEvaluationError} from '../expressions/index';
import {roundFloat16} from './float16';
import {typeKey, createValueValidator} from './buffers';
import type {ArrowExpressionValue} from './types';

type Range = [Uint8Array, number, number];

/** Resolves explicit scalar casts once, leaving active-row selection to the expression compiler. */
export function bindCast(source: DataType, target: unknown) {
  if (!isColumnarScalarType(target)) throw new Error('Unsupported scalar CAST target');
  const type =
    target === 'int16'
      ? new Int16()
      : target === 'int32'
        ? new Int32()
        : target === 'int64'
          ? new Int64()
          : target === 'float16'
            ? new Float16()
            : target === 'float32'
              ? new Float32()
              : target === 'float64'
                ? new Float64()
                : target === 'bool'
                  ? new Bool()
                  : new Utf8();
  const sourceKey = typeKey(source);
  const textInput = sourceKey === 'utf8';
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
    type,
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
            : target.startsWith('int')
              ? (parseUTF8BigInt(bytes, start, end) ?? null)
              : (parseUTF8Number(bytes, start, end) ?? null);
        if (result === null)
          throw new ExpressionEvaluationError('conversion', `Invalid text for CAST to ${target}`);
        if (target === 'int16' || target === 'int32') result = Number(result);
      } else if (target === 'bool') result = value;
      else if (target === 'int64') {
        if (typeof value === 'number' && !Number.isFinite(value))
          throw new ExpressionEvaluationError('conversion', 'Non-finite integer CAST');
        result = typeof value === 'bigint' ? value : BigInt(Math.trunc(value as number));
      } else if (target === 'int16' || target === 'int32') result = Math.trunc(Number(value));
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
