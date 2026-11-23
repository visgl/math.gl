// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Dictionary, Int8, Int32, Table, Utf8, vectorFromArray} from 'apache-arrow';
import {expect, test} from 'vitest';
import {queryArrowAggregateSnapshots} from '@math.gl/sql/query';

test('grouped snapshots retain null keys and remain independent as later batches arrive', async () => {
  const first = new Table({
    'region name': vectorFromArray(['a', null], new Utf8()),
    value: vectorFromArray([2, 3], new Int32())
  });
  const second = new Table({
    'region name': vectorFromArray(['a', 'b'], new Utf8()),
    value: vectorFromArray([5, 7], new Int32())
  });
  const input = first.concat(second);
  const snapshots = await Array.fromAsync(
    queryArrowAggregateSnapshots(input.batches, input.schema, {
      groupBy: 'region name',
      aggregates: {sum: {operation: 'SUM', expression: 'value'}, count: {operation: 'COUNT'}}
    })
  );
  expect(snapshots.map(({rowsProcessed, final}) => [rowsProcessed, final])).toEqual([
    [2, false],
    [4, false],
    [4, true]
  ]);
  expect(Array.from(snapshots[0]!.table.getChild('sum')!)).toEqual([2n, 3n]);
  expect(Array.from(snapshots[2]!.table.getChild('region name')!)).toEqual(['a', null, 'b']);
  expect(Array.from(snapshots[2]!.table.getChild('sum')!)).toEqual([7n, 3n, 7n]);
});

test('an empty input emits a typed final scalar snapshot', async () => {
  const source = new Table({value: vectorFromArray([], new Int32())});
  const [result] = await Array.fromAsync(
    queryArrowAggregateSnapshots([], source.schema, {
      aggregates: {count: {operation: 'COUNT'}, sum: {operation: 'SUM', expression: 'value'}}
    })
  );
  expect(result?.final).toBe(true);
  expect(result?.rowsProcessed).toBe(0);
  expect(result?.table.getChild('count')?.get(0)).toBe(0n);
  expect(result?.table.getChild('sum')?.get(0)).toBeNull();
});

test('dictionary group keys can outgrow a source batch index width', async () => {
  const type = new Dictionary(new Utf8(), new Int8());
  const first = Array.from({length: 100}, (_, index) => String(index));
  const second = Array.from({length: 100}, (_, index) => String(index + 100));
  const source = new Table({key: vectorFromArray(first, type)});
  const other = new Table({key: vectorFromArray(second, type)});
  const results = await Array.fromAsync(
    queryArrowAggregateSnapshots([...source.batches, ...other.batches], source.schema, {
      groupBy: 'key',
      aggregates: {count: {operation: 'COUNT'}}
    })
  );
  const keys = results.at(-1)!.table.getChild('key')!;
  expect(keys.type).toBeInstanceOf(Utf8);
  expect(Array.from(keys)).toEqual([...first, ...second]);
});
