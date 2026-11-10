// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {ExpressionEvaluationErrorCode} from './evaluation-error';

/** Logical numeric types, independent of Arrow fields, GPU formats, or shader spelling. */
export type ExpressionNumericType =
  | 'int8'
  | 'int16'
  | 'int32'
  | 'int64'
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'uint64'
  | 'float16'
  | 'float32'
  | 'float64';
/** One exact numeric function signature; conversions are chosen by a backend at binding time. */
export type NumericFunctionPrototype = Readonly<{
  arguments: readonly ExpressionNumericType[];
  result: ExpressionNumericType;
}>;
/** Portable numeric semantics consumed by CPU or GPU compilers without Arrow dependencies. */
export type NumericFunctionDefinition = Readonly<{
  name: string;
  prototypes: readonly NumericFunctionPrototype[];
  nullHandling: 'propagate';
  overloadResolution: 'exactThenFloatingWidening';
  nanHandling: 'propagate';
  errors: readonly ExpressionEvaluationErrorCode[];
  domain?: 'nonNegative' | 'positive' | 'unitInterval' | 'power';
  angleUnit?: 'radians';
  rounding?: 'tiesAwayFromZero';
  remainderSign?: 'dividend';
}>;
const numericTypes: readonly ExpressionNumericType[] = [
  'int8',
  'int16',
  'int32',
  'int64',
  'uint8',
  'uint16',
  'uint32',
  'uint64',
  'float16',
  'float32',
  'float64'
];
function definition(
  name: string,
  arity = 1,
  preserveInteger = false,
  semantics: Partial<
    Pick<NumericFunctionDefinition, 'domain' | 'angleUnit' | 'rounding' | 'remainderSign'>
  > = {},
  errors: readonly ExpressionEvaluationErrorCode[] = ['domain', 'overflow']
): NumericFunctionDefinition {
  return Object.freeze({
    name,
    prototypes: Object.freeze(
      numericTypes.map(type =>
        Object.freeze({
          arguments: Object.freeze(Array.from({length: arity}, () => type)),
          result: preserveInteger || type.startsWith('float') ? type : 'float64'
        })
      )
    ),
    nullHandling: 'propagate',
    overloadResolution: 'exactThenFloatingWidening',
    nanHandling: 'propagate',
    errors: Object.freeze([...errors]),
    ...semantics
  });
}
/** Standard numeric declarations. These describe semantics and contain no executable callbacks. */
export const NUMERIC_FUNCTION_DEFINITIONS = Object.freeze({
  ABS: definition('ABS', 1, true, {}, ['overflow']),
  SIGN: definition('SIGN', 1, true, {}, []),
  FLOOR: definition('FLOOR', 1, true, {}, []),
  CEILING: definition('CEILING', 1, true, {}, []),
  ROUND: definition('ROUND', 1, true, {rounding: 'tiesAwayFromZero'}, []),
  TRUNC: definition('TRUNC', 1, true, {}, []),
  SQRT: definition('SQRT', 1, false, {domain: 'nonNegative'}),
  POWER: definition('POWER', 2, false, {domain: 'power'}),
  EXP: definition('EXP'),
  LN: definition('LN', 1, false, {domain: 'positive'}),
  LOG10: definition('LOG10', 1, false, {domain: 'positive'}),
  SIN: definition('SIN', 1, false, {angleUnit: 'radians'}),
  COS: definition('COS', 1, false, {angleUnit: 'radians'}),
  TAN: definition('TAN', 1, false, {angleUnit: 'radians'}),
  ASIN: definition('ASIN', 1, false, {domain: 'unitInterval', angleUnit: 'radians'}),
  ACOS: definition('ACOS', 1, false, {domain: 'unitInterval', angleUnit: 'radians'}),
  ATAN: definition('ATAN', 1, false, {angleUnit: 'radians'}),
  ATAN2: definition('ATAN2', 2, false, {angleUnit: 'radians'}),
  DEGREES: definition('DEGREES'),
  RADIANS: definition('RADIANS'),
  MOD: definition('MOD', 2, true, {remainderSign: 'dividend'}, ['divisionByZero', 'domain'])
});
