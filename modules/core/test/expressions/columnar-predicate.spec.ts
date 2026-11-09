// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  bindColumnarPredicateParameters,
  copyColumnarPredicate,
  getColumnarPredicateColumns,
  getColumnarPredicatePaths,
  getColumnarPredicateParameterNames,
  validateColumnarPredicate,
  type ParameterizedColumnarPredicate
} from '../../src/expressions';

test('portable predicates retain paths, parameter names and independent scalar copies', () => {
  const predicate: ParameterizedColumnarPredicate = {
    op: 'and',
    args: [
      {op: '=', args: [{property: ['nested', 'value']}, {parameter: 'value'}]},
      {
        op: 'not',
        args: [
          {op: 'in', args: [{property: 'other'}, [{parameter: 'value'}, {parameter: 'extra'}]]}
        ]
      }
    ]
  };
  expect(getColumnarPredicateColumns(predicate)).toEqual(['nested', 'other']);
  expect(getColumnarPredicatePaths(predicate)).toEqual([['nested', 'value'], ['other']]);
  expect(getColumnarPredicateParameterNames(predicate)).toEqual(['value', 'extra']);
  const bytes = new Uint8Array([1, 2]);
  const bound = bindColumnarPredicateParameters(predicate, {value: bytes, extra: new Date(0)});
  const copied = copyColumnarPredicate(bound);
  expect(getColumnarPredicatePaths(copied)).toEqual(getColumnarPredicatePaths(bound));
  expect(copyColumnarPredicate(copied)).toEqual(copied);
  expect(copied).not.toBe(bound);
  bytes[0] = 9;
  expect(JSON.stringify(bound)).toContain('"0":1');
  expect(() => bindColumnarPredicateParameters(predicate, {})).toThrow('requires a value');
  expect(() => validateColumnarPredicate(bound, new Set(['nested', 'other']))).not.toThrow();
  expect(() => validateColumnarPredicate(bound, new Set(['nested']))).toThrow('not found');
});

test('portable predicates reject missing values and invalid query structure', () => {
  const comparison: ParameterizedColumnarPredicate = {
    op: '=',
    args: [{property: 'x'}, {parameter: 'p'}]
  };
  expect(() => bindColumnarPredicateParameters(comparison, {p: NaN})).toThrow('unsupported value');
  expect(() => bindColumnarPredicateParameters(comparison, {p: {parameter: 'q'}} as any)).toThrow(
    'cannot reference'
  );
  expect(() => validateColumnarPredicate({op: 'and', args: []}, new Set())).toThrow('at least two');
  expect(() =>
    validateColumnarPredicate({op: 'isNull', args: [{property: []}]}, new Set())
  ).toThrow('non-empty');
  expect(() =>
    validateColumnarPredicate({op: 'in', args: [{property: 'x'}, []]}, new Set(['x']))
  ).toThrow('at least one');
  const nullTest = {op: 'isNull', args: [{property: 'x'}]} as const;
  expect(bindColumnarPredicateParameters(nullTest, {})).toEqual(nullTest);
  expect(copyColumnarPredicate(nullTest)).toEqual({op: 'isNull', args: [{property: ['x']}]});
});
