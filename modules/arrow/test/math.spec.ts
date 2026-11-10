// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  Dictionary,
  Float16,
  Float32,
  Float64,
  Int8,
  Int32,
  Int64,
  Table,
  vectorFromArray
} from 'apache-arrow';
import * as math from '../src/math';
import {compileArrowExpression, ArrowEvaluationError} from '../src/expressions';
import {NativeFloat16ArrayConstructor} from '@math.gl/core';

const functions = Object.values(math);
function evaluate(expression: string, values: (number | bigint | null)[], type = new Float64()) {
  const table = new Table({x: vectorFromArray(values, type)});
  const compiled = compileArrowExpression(expression, {inputSchema: table.schema, functions});
  return {compiled, result: compiled.evaluateTable(table)};
}
test('Arrow math declarations implement SQL numeric functions and preserve floating precision', () => {
  const cases: [string, number, number][] = [
    ['ABS', -2, 2],
    ['SIGN', -2, -1],
    ['FLOOR', -1.2, -2],
    ['CEILING', -1.2, -1],
    ['ROUND', -1.5, -2],
    ['TRUNC', -1.8, -1],
    ['SQRT', 4, 2],
    ['EXP', 0, 1],
    ['LN', 1, 0],
    ['LOG10', 100, 2],
    ['SIN', 0, 0],
    ['COS', 0, 1],
    ['TAN', 0, 0],
    ['ASIN', 0, 0],
    ['ACOS', 1, 0],
    ['ATAN', 0, 0],
    ['DEGREES', Math.PI, 180],
    ['RADIANS', 180, Math.PI]
  ];
  for (const [name, input, output] of cases) {
    const {result} = evaluate(`${name}(x)`, [input, null]);
    expect([...result], name).toEqual([output, null]);
  }
  expect([...evaluate('ROUND(x)', [0.5, -0.5, 1.5, -1.5, 4503599627370497]).result]).toEqual([
    1, -1, 2, -2, 4503599627370497
  ]);
  expect([...evaluate('POWER(x, 3)', [-2, 2]).result]).toEqual([-8, 8]);
  expect([...evaluate('MOD(x, 3)', [-5, 5]).result]).toEqual([-2, 2]);
  expect([...evaluate('ATAN2(x, 0)', [1, -1]).result]).toEqual([Math.PI / 2, -Math.PI / 2]);
  expect(evaluate('SIN(x)', [1], new Float32()).compiled.outputField.type).toEqual(new Float32());
});
test('math prototypes use equivalent scalar and vector paths, nulls, slices and masks', () => {
  for (const fn of functions) {
    for (const type of [new Float32(), new Float64(), new Int32()]) {
      const prototype = fn.prototypes.find(
        p => p.arguments[0]!.type.toString() === type.toString()
      )!;
      const input = vectorFromArray([99, 1, null, 1, 99], type).slice(1, 4);
      const args = prototype.arguments.map(() => input);
      const result = prototype.evaluate(args, {length: 3, activeRows: new Uint8Array([1, 1, 0])});
      expect([...result], `${fn.name}/${type}`).toEqual([
        prototype.evaluateScalar!(...args.map(() => 1)),
        null,
        null
      ]);
      expect(
        prototype.evaluate(
          args.map(vector => vector.slice(0, 0)),
          {length: 0, activeRows: new Uint8Array()}
        ).length
      ).toBe(0);
    }
  }
  const table = new Table({
    x: vectorFromArray([1, null, 2], new Dictionary(new Float64(), new Int8()))
  });
  expect([
    ...compileArrowExpression('SQRT(x)', {inputSchema: table.schema, functions}).evaluateTable(
      table
    )
  ]).toEqual([1, null, Math.sqrt(2)]);
});
test('integer math preserves exact bigint values and detects overflow', () => {
  const type = new Int64();
  const table = new Table({x: vectorFromArray([-9007199254740993n, 2n, null], type)});
  const compiled = compileArrowExpression('ABS(x)', {inputSchema: table.schema, functions});
  expect([...compiled.evaluateTable(table)]).toEqual([9007199254740993n, 2n, null]);
  expect(compiled.outputField.type).toEqual(type);
  expect(
    compileArrowExpression('SIN(x)', {inputSchema: table.schema, functions}).outputField.type
  ).toEqual(new Float64());
  const minimum = new Table({x: vectorFromArray([-128], new Int8())});
  expect(() =>
    compileArrowExpression('ABS(x)', {inputSchema: minimum.schema, functions}).evaluateTable(
      minimum
    )
  ).toThrow(ArrowEvaluationError);
  try {
    compileArrowExpression('ABS(x)', {inputSchema: minimum.schema, functions}).evaluateTable(
      minimum
    );
    throw new Error('expected overflow');
  } catch (error) {
    expect((error as ArrowEvaluationError).code).toBe('overflow');
  }
});
test('math integer overflow has the documented code and untyped null calls propagate', () => {
  const input = new Table({x: vectorFromArray([-128], new Int8())});
  let caught: unknown;
  try {
    compileArrowExpression('ABS(x)', {inputSchema: input.schema, functions}).evaluateTable(input);
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(ArrowEvaluationError);
  expect((caught as ArrowEvaluationError).code).toBe('overflow');
  for (const name of ['ABS', 'SQRT'])
    expect([...evaluate(`${name}(null)`, [1]).result]).toEqual([null]);
});
test('math throws classified domain, division and finite-input overflow errors', () => {
  for (const expression of [
    'SQRT(-1)',
    'LN(0)',
    'LOG10(-1)',
    'ASIN(2)',
    'ACOS(-2)',
    'POWER(-2, 0.5)',
    'POWER(0, -1)',
    'MOD(1, 0)',
    'EXP(1000)'
  ]) {
    let caught: unknown;
    try {
      evaluate(expression, [1]);
    } catch (error) {
      caught = error;
    }
    expect(caught, expression).toBeInstanceOf(ArrowEvaluationError);
    expect((caught as ArrowEvaluationError).code, expression).toBe(
      expression.startsWith('MOD')
        ? 'divisionByZero'
        : expression.startsWith('EXP')
          ? 'overflow'
          : 'domain'
    );
  }
  try {
    evaluate('EXP(x)', [100], new Float32());
    throw new Error('expected overflow');
  } catch (error) {
    expect((error as ArrowEvaluationError).code).toBe('overflow');
  }
  expect([...evaluate('EXP(x)', [-1000]).result]).toEqual([0]);
  expect([...evaluate('ABS(x)', [Number.MIN_VALUE]).result]).toEqual([Number.MIN_VALUE]);
  expect([...evaluate('SIN(x)', [NaN]).result][0]).toBeNaN();
  expect([...evaluate('SQRT(x)', [Infinity]).result]).toEqual([Infinity]);
});
test('math functions compose and select the widest float without integer coercion', () => {
  const table = new Table({
    x: vectorFromArray([0, 1], new Float32()),
    y: vectorFromArray([1, 2], new Float64()),
    i: vectorFromArray([1, 2], new Int32())
  });
  const compiled = compileArrowExpression('POWER(SIN(x), y)', {
    inputSchema: table.schema,
    functions
  });
  expect(compiled.outputField.type).toEqual(new Float64());
  expect([...compiled.evaluateTable(table)]).toEqual([0, Math.fround(Math.sin(1)) ** 2]);
  expect(() =>
    compileArrowExpression('POWER(x, i)', {inputSchema: table.schema, functions})
  ).toThrow('type mismatch');
});
test.skipIf(!NativeFloat16ArrayConstructor)(
  'Float16 math rounds results and rejects finite overflow',
  () => {
    const {result, compiled} = evaluate('SIN(x)', [1], new Float16());
    expect(compiled.outputField.type).toEqual(new Float16());
    const Half = NativeFloat16ArrayConstructor!;
    expect([...result]).toEqual([...new Half([Math.sin(1)])]);
    expect(() => evaluate('EXP(x)', [12], new Float16())).toThrow(ArrowEvaluationError);
  }
);

test('POWER propagates NaNs before domain checks and exponentiation in both implementations', () => {
  const prototype = math.POWER.prototypes.find(p => p.arguments[0]!.type.toString() === 'Float64')!;
  for (const values of [
    [-2, NaN],
    [NaN, 0],
    [0, NaN]
  ]) {
    expect(prototype.evaluateScalar!(...values)).toBeNaN();
    const result = prototype.evaluate(
      values.map(value => vectorFromArray([value], new Float64())),
      {length: 1, activeRows: new Uint8Array([1])}
    );
    expect(result.get(0)).toBeNaN();
  }
});
