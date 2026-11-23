// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  createRecordBatchWithMetadata,
  getRecordBatchMetadata,
  takeArrowTableRows
} from '../../src/arrow-integration/arrow';

test('multi-chunk gather preserves sliced physical storage, nested values and typed nulls', () => {
  const dictionary = arrow.vectorFromArray(
    ['a', 'b', 'c', 'd'],
    new arrow.Dictionary(new arrow.Utf8(), new arrow.Int8(), 17)
  );
  const timestamp = new arrow.Vector([
    arrow.makeData({
      type: new arrow.TimestampNanosecond(),
      data: BigInt64Array.of(1n, 9007199254740993n, 3n, 9007199254740995n)
    })
  ]);
  const source = new arrow.Table({
    dictionary,
    timestamp,
    text: arrow.vectorFromArray(['a', null, 'ccc', 'dddd'], new arrow.Utf8()),
    enabled: arrow.vectorFromArray([true, false, null, true], new arrow.Bool()),
    empty: arrow.vectorFromArray([null, null, null, null], new arrow.Null()),
    pairs: arrow.vectorFromArray(
      [[0, 1], [2, 3], null, [6, 7]],
      new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()))
    ),
    list: arrow.vectorFromArray(
      [[0], [1, 2], null, [3, 4, 5]],
      new arrow.List(new arrow.Field('item', new arrow.Int32()))
    )
  });
  const chunks = source.slice(1, 2).concat(source.slice(2, 4));
  const result = takeArrowTableRows(chunks, Int32Array.of(-1, 0, 2, 0, 1, 2));
  expect(result.batches).toHaveLength(1);
  expect(result.batches[0]!.data.nullCount).toBe(0);
  expect(result.get(0)).not.toBeNull();
  expect(result.schema).toBe(chunks.schema);
  expect([...result.getChild('dictionary')!]).toEqual([null, 'b', 'd', 'b', 'c', 'd']);
  expect([...result.getChild('text')!]).toEqual([null, null, 'dddd', null, 'ccc', 'dddd']);
  expect([...result.getChild('enabled')!]).toEqual([null, false, true, false, null, true]);
  expect([...result.getChild('empty')!]).toEqual([null, null, null, null, null, null]);
  expect([...result.getChild('timestamp')!.data[0]!.values]).toEqual([
    0n,
    9007199254740993n,
    9007199254740995n,
    9007199254740993n,
    3n,
    9007199254740995n
  ]);
  expect(result.getChild('pairs')!.get(0)).toBeNull();
  expect([...result.getChild('pairs')!.get(2)!]).toEqual([6, 7]);
  expect(result.getChild('pairs')!.get(4)).toBeNull();
  expect([...result.getChild('list')!.get(2)!]).toEqual([3, 4, 5]);
  expect(result.getChild('list')!.get(4)).toBeNull();
  expect(result.getChild('dictionary')!.data[0]!.dictionary!.data[0]!.values.buffer).not.toBe(
    dictionary.data[0]!.dictionary!.data[0]!.values.buffer
  );
});

test('multi-chunk gather retains shared batch metadata and falls back for distinct metadata', () => {
  const source = arrow.tableFromArrays({value: Int32Array.of(10, 11, 20, 21)});
  const schema = new arrow.Schema(source.schema.fields, new Map([['origin', 'table']]));
  const shared = new Map([['batch', 'shared']]);
  const other = new Map([['batch', 'other']]);
  for (const metadata of [shared, other]) {
    const table = new arrow.Table(schema, [
      createRecordBatchWithMetadata(schema, source.batches[0]!.data.slice(0, 2), shared),
      createRecordBatchWithMetadata(schema, source.batches[0]!.data.slice(2, 2), metadata)
    ]);
    const result = takeArrowTableRows(table, Int32Array.of(2, 0, 3, 1));
    expect([...result.getChild('value')!]).toEqual([20, 10, 21, 11]);
    expect(result.schema).toBe(schema);
    expect(result.batches.map(getRecordBatchMetadata)).toEqual(
      metadata === shared ? [shared] : [other, shared, other, shared]
    );
  }
});

test('multi-chunk gather keeps distinct dictionaries on the source-run fallback', () => {
  const type = new arrow.Dictionary(new arrow.Utf8(), new arrow.Int8(), 18);
  const first = new arrow.Table({label: arrow.vectorFromArray(['a', 'b'], type)});
  const second = new arrow.Table({label: arrow.vectorFromArray(['c', 'd'], type)});
  const result = takeArrowTableRows(first.concat(second), Int32Array.of(0, 2, 1, 3));
  expect([...result.getChild('label')!]).toEqual(['a', 'c', 'b', 'd']);
  expect(result.batches).toHaveLength(4);
  expect(result.getChild('label')!.type).toStrictEqual(type);
  const data = result.getChild('label')!.data;
  expect(data[0]!.dictionary).toBe(data[2]!.dictionary);
  expect(data[1]!.dictionary).toBe(data[3]!.dictionary);
  expect(data[0]!.dictionary).not.toBe(data[1]!.dictionary);
});

test('single-chunk typed nulls retain valid record containers', () => {
  const source = arrow.tableFromArrays({value: Int32Array.of(7)});
  const result = takeArrowTableRows(source, Int32Array.of(-1, 0));
  expect(result.batches[0]!.data.nullCount).toBe(0);
  expect(result.get(0)!.value).toBeNull();
  expect(result.get(1)!.value).toBe(7);
});

test('multi-chunk gather treats independently created empty metadata maps as compatible', () => {
  const table = arrow.tableFromArrays({value: Int32Array.of(10, 11, 20, 21)});
  const source = new arrow.Table(
    table.schema,
    [0, 2].map(offset =>
      createRecordBatchWithMetadata(
        table.schema,
        table.batches[0]!.data.slice(offset, 2),
        new Map()
      )
    )
  );
  const result = takeArrowTableRows(source, Int32Array.of(0, 2, 1, 3));
  expect(result.batches).toHaveLength(1);
  expect([...result.getChild('value')!]).toEqual([10, 20, 11, 21]);
  expect(getRecordBatchMetadata(result.batches[0]!)?.size).toBe(0);
});
