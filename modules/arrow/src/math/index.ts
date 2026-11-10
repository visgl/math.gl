// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  DataType,
  Field,
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
  Precision,
  makeData,
  makeVector
} from 'apache-arrow';
import {ColumnReader, createValueValidator} from '../expressions/buffers';
import {ArrowEvaluationError} from '../expressions/errors';
import {float16Values, roundFloat16} from '../expressions/float16';
import type {ArrowTableFunction, ArrowExpressionValue} from '../expressions/types';

type Numeric = number | bigint;
type Operation = (x: Numeric, y: Numeric) => Numeric;
const types = [
  new Int8(),
  new Int16(),
  new Int32(),
  new Int64(),
  new Uint8(),
  new Uint16(),
  new Uint32(),
  new Uint64(),
  new Float16(),
  new Float32(),
  new Float64()
];

/** Internal declaration builder; public declarations take explicit numeric arguments. */
function declaration(
  name: string,
  operation: Operation,
  arity = 1,
  preserveInteger = false
): ArrowTableFunction {
  return {
    name,
    prototypes: types.map(input => {
      const output = DataType.isInt(input) && !preserveInteger ? new Float64() : input;
      const validate = DataType.isInt(output) ? createValueValidator(output) : undefined;
      let half: ((value: number) => number) | undefined;
      function run(values: readonly ArrowExpressionValue[]): Numeric | null {
        if (values.some(value => value === null)) return null;
        const x = values[0] as Numeric;
        const y = values[1] as Numeric;
        let result = operation(x, y);
        if (DataType.isFloat(output)) {
          result = Number(result);
          if (output.precision === Precision.SINGLE) result = Math.fround(result);
          if (output.precision === Precision.HALF) {
            half ||= roundFloat16();
            result = half(result);
          }
          const finiteInputs = values.every(
            value => typeof value === 'bigint' || Number.isFinite(value)
          );
          if (finiteInputs && !Number.isFinite(result))
            throw new ArrowEvaluationError(
              Number.isNaN(result) ? 'domain' : 'overflow',
              `${name}: result outside ${output}`
            );
          if (
            Number.isNaN(result) &&
            !values.some(value => typeof value === 'number' && Number.isNaN(value))
          )
            throw new ArrowEvaluationError('domain', `${name}: invalid argument`);
        }
        validate?.(result);
        return result;
      }
      return {
        arguments: Array.from(
          {length: arity},
          (_, index) => new Field(`arg${index + 1}`, input, true)
        ),
        result: new Field(name.toLowerCase(), output, false),
        evaluateScalar: (...values) => run(values),
        evaluate(vectors, {length, activeRows}) {
          const readers = vectors.map(vector => new ColumnReader(vector));
          const values: ArrowExpressionValue[] = new Array(arity);
          const storage = new output.ArrayType(length);
          const decoded =
            DataType.isFloat(output) && output.precision === Precision.HALF
              ? float16Values(storage as Uint16Array)
              : storage;
          const validity = new Uint8Array(Math.ceil(length / 8));
          let nullCount = length;
          for (let row = 0; row < length; row++) {
            if (!activeRows[row]) continue;
            for (let arg = 0; arg < arity; arg++) values[arg] = readers[arg]!.get(row);
            const value = run(values);
            if (value === null) continue;
            // The prototype fixes both the output buffer and the scalar numeric kind.
            (decoded as Float64Array)[row] = value as number;
            validity[row >> 3] |= 1 << (row & 7);
            nullCount--;
          }
          return makeVector(
            makeData({
              type: output,
              length,
              data: storage,
              nullBitmap: validity,
              nullCount
            } as any)
          );
        }
      };
    })
  };
}
function domain(condition: boolean, name: string): void {
  if (condition) throw new ArrowEvaluationError('domain', `${name}: invalid argument`);
}
function rounded(x: number): number {
  if (Number.isInteger(x)) return x;
  const truncated = Math.trunc(x);
  return Math.abs(x - truncated) >= 0.5 ? truncated + Math.sign(x) : truncated;
}

/** Absolute value, preserving the argument type and checking integer overflow. */
export const ABS: ArrowTableFunction = /* @__PURE__ */ declaration(
  'ABS',
  x => (typeof x === 'bigint' ? (x < 0n ? -x : x) : Math.abs(x)),
  1,
  true
);
/** Sign (-1, 0, 1), preserving the argument type. */
export const SIGN: ArrowTableFunction = /* @__PURE__ */ declaration(
  'SIGN',
  x => (typeof x === 'bigint' ? (x < 0n ? -1n : x > 0n ? 1n : 0n) : Math.sign(x)),
  1,
  true
);
/** Round toward negative infinity. */
export const FLOOR: ArrowTableFunction = /* @__PURE__ */ declaration(
  'FLOOR',
  x => (typeof x === 'bigint' ? x : Math.floor(x)),
  1,
  true
);
/** Round toward positive infinity. */
export const CEILING: ArrowTableFunction = /* @__PURE__ */ declaration(
  'CEILING',
  x => (typeof x === 'bigint' ? x : Math.ceil(x)),
  1,
  true
);
/** Round to the nearest integer, with ties away from zero. */
export const ROUND: ArrowTableFunction = /* @__PURE__ */ declaration(
  'ROUND',
  x => (typeof x === 'bigint' ? x : rounded(x)),
  1,
  true
);
/** Truncate toward zero. */
export const TRUNC: ArrowTableFunction = /* @__PURE__ */ declaration(
  'TRUNC',
  x => (typeof x === 'bigint' ? x : Math.trunc(x)),
  1,
  true
);
/** Square root; negative arguments raise a domain error. */
export const SQRT: ArrowTableFunction = /* @__PURE__ */ declaration('SQRT', x => {
  domain(x < 0, 'SQRT');
  return Math.sqrt(Number(x));
});
/** Exponentiation; negative bases require integral exponents. */
export const POWER: ArrowTableFunction = /* @__PURE__ */ declaration(
  'POWER',
  (x, y) => {
    domain(
      ((x === 0 || x === 0n) && y < 0) || (x < 0 && typeof y !== 'bigint' && !Number.isInteger(y)),
      'POWER'
    );
    // Preserve parity when a bigint exponent cannot be represented exactly as a number.
    if (x < 0 && typeof y === 'bigint') return (y % 2n ? -1 : 1) * Math.pow(-Number(x), Number(y));
    return Math.pow(Number(x), Number(y));
  },
  2
);
/** Natural exponential. */
export const EXP: ArrowTableFunction = /* @__PURE__ */ declaration('EXP', x => Math.exp(Number(x)));
/** Natural logarithm; arguments must be positive. */
export const LN: ArrowTableFunction = /* @__PURE__ */ declaration('LN', x => {
  domain(x <= 0, 'LN');
  return Math.log(Number(x));
});
/** Base-10 logarithm; arguments must be positive. */
export const LOG10: ArrowTableFunction = /* @__PURE__ */ declaration('LOG10', x => {
  domain(x <= 0, 'LOG10');
  return Math.log10(Number(x));
});
/** Sine of an angle in radians. */
export const SIN: ArrowTableFunction = /* @__PURE__ */ declaration('SIN', x => Math.sin(Number(x)));
/** Cosine of an angle in radians. */
export const COS: ArrowTableFunction = /* @__PURE__ */ declaration('COS', x => Math.cos(Number(x)));
/** Tangent of an angle in radians. */
export const TAN: ArrowTableFunction = /* @__PURE__ */ declaration('TAN', x => Math.tan(Number(x)));
/** Inverse sine in radians; arguments must be in [-1, 1]. */
export const ASIN: ArrowTableFunction = /* @__PURE__ */ declaration('ASIN', x => {
  domain(x < -1 || x > 1, 'ASIN');
  return Math.asin(Number(x));
});
/** Inverse cosine in radians; arguments must be in [-1, 1]. */
export const ACOS: ArrowTableFunction = /* @__PURE__ */ declaration('ACOS', x => {
  domain(x < -1 || x > 1, 'ACOS');
  return Math.acos(Number(x));
});
/** Inverse tangent in radians. */
export const ATAN: ArrowTableFunction = /* @__PURE__ */ declaration('ATAN', x =>
  Math.atan(Number(x))
);
/** Angle of (x, y) in radians, with arguments ordered (y, x). */
export const ATAN2: ArrowTableFunction = /* @__PURE__ */ declaration(
  'ATAN2',
  (y, x) => Math.atan2(Number(y), Number(x)),
  2
);
/** Convert radians to degrees. */
export const DEGREES: ArrowTableFunction = /* @__PURE__ */ declaration(
  'DEGREES',
  x => Number(x) * (180 / Math.PI)
);
/** Convert degrees to radians. */
export const RADIANS: ArrowTableFunction = /* @__PURE__ */ declaration(
  'RADIANS',
  x => Number(x) * (Math.PI / 180)
);
/** Remainder with the dividend's sign; a zero divisor raises divisionByZero. */
export const MOD: ArrowTableFunction = /* @__PURE__ */ declaration(
  'MOD',
  (x, y) => {
    if (y === 0 || y === 0n)
      throw new ArrowEvaluationError('divisionByZero', 'MOD: division by zero');
    return typeof x === 'bigint' && typeof y === 'bigint' ? x % y : Number(x) % Number(y);
  },
  2,
  true
);
