// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {compileColumnarPredicate} from '@math.gl/sql/columnar-predicate';
import {expect, test} from 'vitest';

test('binds each column path once and preserves SQL UNKNOWN through Boolean predicates', () => {
  const resolved: string[][] = [];
  const readings = [null, 1, 2];
  const enabled = [true, true, false];
  const predicate = compileColumnarPredicate(
    {
      op: 'and',
      args: [
        {op: 'not', args: [{op: '=', args: [{property: ['sensor', 'value']}, 1]}]},
        {op: '=', args: [{property: 'enabled'}, true]}
      ]
    },
    path => {
      resolved.push([...path]);
      return index => (path[0] === 'sensor' ? readings[index] : enabled[index]);
    }
  );
  expect([0, 1, 2].map(predicate)).toEqual([null, false, false]);
  expect(resolved).toEqual([['sensor', 'value'], ['enabled']]);
});

test('compares exact mixed numeric values and binary members', () => {
  const numeric = compileColumnarPredicate(
    {op: '>', args: [{property: 'value'}, 9_007_199_254_740_992]},
    () => () => 9_007_199_254_740_993n
  );
  const binary = compileColumnarPredicate(
    {op: 'in', args: [{property: 'value'}, [Uint8Array.of(1), Uint8Array.of(1, 2)]]},
    () => () => Uint8Array.of(1, 2)
  );
  expect(numeric(0)).toBe(true);
  expect(binary(0)).toBe(true);
});

test('rejects casts and non-finite numeric comparisons', () => {
  expect(() =>
    compileColumnarPredicate(
      {op: 'isNull', args: [{property: 'value', casts: ['float64']}]},
      () => () => null
    )
  ).toThrow(/casts/);
  const predicate = compileColumnarPredicate(
    {op: '=', args: [{property: 'value'}, 1]},
    () => () => NaN
  );
  expect(() => predicate(0)).toThrow(/non-finite/);
});

test('matches mixed-type IN candidates independently of list order', () => {
  const predicate = compileColumnarPredicate(
    {op: 'in', args: [{property: 'value'}, ['1', Uint8Array.of(1), 1n]]},
    () => index => [1, new Date(0), null][index]
  );
  expect([0, 1, 2].map(predicate)).toEqual([true, false, null]);
});
