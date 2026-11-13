// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Bool,
  Dictionary,
  Float64,
  Int8,
  Int64,
  Int32,
  Table,
  Utf8,
  vectorFromArray
} from 'apache-arrow';
import {compileArrowAggregates} from '../src/arrow';

test('scalar aggregate partials merge across slices, with a count-weighted average', async () => {
  const table = new Table({
    price: vectorFromArray([100, 1, null, 4, 12], new Float64()),
    quantity: vectorFromArray([1, 2, 3, 1, 2], new Float64())
  });
  const expression = 'price * quantity';
  const compiled = compileArrowAggregates(
    {
      rows: {operation: 'COUNT'},
      valid: {operation: 'COUNT', expression},
      sum: {operation: 'SUM', expression},
      average: {operation: 'AVG', expression},
      min: {operation: 'MIN', expression},
      max: {operation: 'MAX', expression}
    },
    {inputSchema: table.schema}
  );
  const first = table.slice(1, 2).batches[0]!;
  const second = table.slice(2).batches[0]!;
  const running = compiled.createAccumulator();
  const partial = compiled.createAccumulator();
  running.update(first);
  partial.update(second);
  const before = running.result();
  running.merge(partial);
  expect(before).toEqual({rows: 1n, valid: 1n, sum: 2, average: 2, min: 2, max: 2});
  const expected = {rows: 4n, valid: 3n, sum: 30, average: 10, min: 2, max: 24};
  expect(running.result()).toEqual(expected);
  expect(compiled.evaluate(table.slice(1))).toEqual(expected);
  expect(
    await compiled.evaluateInBatches(
      (async function* () {
        yield first;
        yield second;
      })()
    )
  ).toEqual(expected);
  expect(() => running.merge(running)).toThrow('another accumulator');
  expect(compiled.evaluate([])).toEqual({
    rows: 0n,
    valid: 0n,
    sum: null,
    average: null,
    min: null,
    max: null
  });
});

test('Boolean, bitwise and binary UTF-8 reductions preserve null and width semantics', () => {
  const table = new Table({
    flag: vectorFromArray([true, null, false], new Bool()),
    bits: vectorFromArray([-1, null, 5], new Int8()),
    wide: vectorFromArray([1n << 60n, null, 1n], new Int64()),
    word: vectorFromArray(['𐀀', null, 'ﬀ'], new Dictionary(new Utf8(), new Int32()))
  });
  const compiled = compileArrowAggregates(
    {
      every: {operation: 'EVERY', expression: 'flag'},
      all: {operation: 'BOOL_AND', expression: 'flag'},
      any: {operation: 'BOOL_OR', expression: 'flag'},
      and: {operation: 'BIT_AND', expression: 'bits'},
      or: {operation: 'BIT_OR', expression: 'bits'},
      xor: {operation: 'BIT_XOR', expression: 'wide'},
      total: {operation: 'SUM', expression: 'wide'},
      min: {operation: 'MIN', expression: 'word'},
      max: {operation: 'MAX', expression: 'word'}
    },
    {inputSchema: table.schema}
  );
  expect(compiled.evaluate([...table.slice(0, 1).batches, ...table.slice(1).batches])).toEqual({
    every: false,
    all: false,
    any: true,
    and: 5,
    or: -1,
    xor: (1n << 60n) + 1n,
    total: (1n << 60n) + 1n,
    min: 'ﬀ',
    max: '𐀀'
  });
  expect(Object.values(compiled.evaluate(table.slice(1, 2)))).toEqual(Array(9).fill(null));
});

test('a shared expression runs once per batch and a failed update keeps the previous result', () => {
  const table = new Table({x: vectorFromArray([2, 4], new Float64())});
  let calls = 0;
  const compiled = compileArrowAggregates(
    {
      sum: {operation: 'SUM', expression: 'F(x)'},
      average: {operation: 'AVG', expression: 'F(x)'}
    },
    {
      inputSchema: table.schema,
      functions: [
        {
          name: 'F',
          prototypes: [
            {
              arguments: table.schema.fields,
              result: table.schema.fields[0]!,
              evaluate([input]) {
                calls++;
                return input!;
              }
            }
          ]
        }
      ]
    }
  );
  const running = compiled.createAccumulator();
  running.update(table.batches[0]!);
  expect(calls).toBe(1);
  const other = new Table({y: table.getChild('x')!});
  expect(() => running.update(other.batches[0]!)).toThrow('schema mismatch');
  const signal = AbortSignal.abort(new Error('stop'));
  expect(() => running.update(table.batches[0]!, {signal})).toThrow('stop');
  expect(running.result()).toEqual({sum: 6, average: 3});
  expect(() =>
    compileArrowAggregates(
      {
        bad: {operation: 'BIT_OR', expression: 'x'}
      },
      {inputSchema: table.schema}
    )
  ).toThrow('does not support');
});

test('grouped aggregates update interleaved keys across batches and detach snapshots', () => {
  const table = new Table({
    region: vectorFromArray(['west', null, 'west', 'east', 'west'], new Utf8()),
    price: vectorFromArray([2, null, 4, 10, null], new Float64()),
    note: vectorFromArray([null, 'yes', 'yes', null, 'yes'], new Utf8())
  });
  const plan = compileArrowAggregates(
    {
      rows: {operation: 'COUNT'},
      valid: {operation: 'COUNT', expression: 'price'},
      tagged: {operation: 'COUNT', expression: 'note'},
      mean: {operation: 'AVG', expression: 'price'}
    },
    {inputSchema: table.schema}
  );
  const grouped = plan.createGroupedAccumulator('region');
  expect(grouped.result().size).toBe(0);
  grouped.update(table.slice(0, 3).batches[0]!);
  const first = grouped.result();
  grouped.update(table.slice(3).batches[0]!);
  expect([...first]).toEqual([
    ['west', {rows: 2n, valid: 2n, tagged: 1n, mean: 3}],
    [null, {rows: 1n, valid: 0n, tagged: 1n, mean: null}]
  ]);
  expect([...grouped.result()]).toEqual([
    ['west', {rows: 3n, valid: 2n, tagged: 2n, mean: 3}],
    [null, {rows: 1n, valid: 0n, tagged: 1n, mean: null}],
    ['east', {rows: 1n, valid: 1n, tagged: 0n, mean: 10}]
  ]);
});

test('grouped aggregate updates preserve prior results on a key error or cancellation', () => {
  const table = new Table({key: vectorFromArray([1, 2, Infinity], new Float64())});
  const grouped = compileArrowAggregates(
    {rows: {operation: 'COUNT'}},
    {
      inputSchema: table.schema
    }
  ).createGroupedAccumulator('key');
  grouped.update(table.slice(0, 1).batches[0]!);
  const before = grouped.result();
  expect(() => grouped.update(table.slice(1).batches[0]!)).toThrow('group keys must be finite');
  expect(() =>
    grouped.update(table.slice(1, 2).batches[0]!, {
      signal: AbortSignal.abort()
    })
  ).toThrow();
  expect(grouped.result()).toEqual(before);
});
