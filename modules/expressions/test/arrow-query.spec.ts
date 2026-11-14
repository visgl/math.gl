// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Float64, Table, vectorFromArray} from 'apache-arrow';
import {expect, test} from 'vitest';
import {queryArrowTable} from '@math.gl/expressions/arrow';
import {parseSQLQuery} from '@math.gl/expressions/sql';

/** Parses the SELECT requests used by these tests. */
function select(sql: string) {
  const query = parseSQLQuery(sql);
  if ('command' in query) throw new Error('Expected SELECT');
  return query;
}

test('SELECT preserves column order and aliases and applies WHERE before computing and limiting', () => {
  const batch = new Table({
    x: vectorFromArray([null, 1, 2, 3], new Float64()),
    y: vectorFromArray([5, 6, null, 8], new Float64())
  });
  const source = batch.concat(batch);
  const result = queryArrowTable(
    source,
    select('SELECT x AS id, x + y AS sum, x AS original FROM input WHERE x >= 2 LIMIT 3')
  );
  expect(result.schema.fields.map(field => field.name)).toEqual(['id', 'sum', 'original']);
  expect(Array.from(result.getChild('id')!)).toEqual([2, 3, 2]);
  expect(Array.from(result.getChild('sum')!)).toEqual([null, 11, null]);
  expect(Array.from(result.getChild('original')!)).toEqual([2, 3, 2]);
});

test('projection shares source buffers and empty results retain their schema', () => {
  const source = new Table({x: vectorFromArray([1, 2], new Float64())});
  const projected = queryArrowTable(source, {select: [{column: 'x', as: 'value'}]});
  expect(projected.getChild('value')!.data[0]).toBe(source.getChild('x')!.data[0]);
  expect(queryArrowTable(source, {select: [], limit: 1}).numRows).toBe(1);
  const empty = queryArrowTable(source, select('SELECT x + 1 AS value WHERE x > 5'));
  expect(empty.numRows).toBe(0);
  expect(empty.schema.fields.map(field => field.name)).toEqual(['value']);
  expect(queryArrowTable(source, {limit: 0}).schema).toBe(source.schema);
  expect(() => queryArrowTable(source, {select: ['x', {column: 'x', as: 'x'}]})).toThrow(
    /duplicate/
  );
});

test('unaliased computed columns get distinct names without displacing explicit aliases', () => {
  const source = new Table({x: vectorFromArray([1], new Float64())});
  const result = queryArrowTable(source, select('SELECT x + 1, x - 1, x AS expression_1'));
  expect(result.schema.fields.map(field => field.name)).toEqual([
    'expression_1_',
    'expression_2',
    'expression_1'
  ]);
  expect(Array.from(result.getChildAt(0)!)).toEqual([2]);
  expect(Array.from(result.getChildAt(1)!)).toEqual([0]);
});

test('filters and groups UNION ALL inputs before stable ordering and pagination', () => {
  const source = new Table({
    id: vectorFromArray([1, 2, 3, null], new Float64()),
    group: vectorFromArray([2, 1, 2, null], new Float64())
  });
  const result = queryArrowTable(source, {
    union: [source.slice(1, 3)],
    where: select('SELECT * WHERE id >= 2').where,
    groupBy: ['group'],
    aggregates: {total: {operation: 'SUM', expression: 'id'}, count: {operation: 'COUNT'}},
    orderBy: [{column: 'total', direction: 'desc'}],
    select: ['group', 'total', 'count'],
    limit: 1
  });
  expect(Array.from(result.getChild('group')!)).toEqual([2]);
  expect(Array.from(result.getChild('total')!)).toEqual([6]);
  expect(Array.from(result.getChild('count')!)).toEqual([2n]);
  expect(() => queryArrowTable(source, {union: [source.select(['id'])]})).toThrow(/UNION ALL/);

  const empty = queryArrowTable(source.slice(0, 0), {
    aggregates: {count: {operation: 'COUNT'}, sum: {operation: 'SUM', expression: 'id'}}
  });
  expect(Array.from(empty.getChild('count')!)).toEqual([0n]);
  expect(Array.from(empty.getChild('sum')!)).toEqual([null]);
});

test('inner join preserves duplicate matches, excludes null keys, and exposes right columns', () => {
  const left = new Table({
    id: vectorFromArray([2, null, 1, 2], new Float64()),
    value: vectorFromArray([10, 20, 30, 40], new Float64())
  });
  const right = new Table({
    id: vectorFromArray([2, null, 2, 1], new Float64()),
    value: vectorFromArray([50, 60, 70, 80], new Float64())
  });
  const query = {
    join: {table: right, left: 'id', right: 'id', rightPrefix: 'right.'},
    select: ['value', {column: 'right.value', as: 'matched'}]
  };
  const result = queryArrowTable(left, query);
  expect(Array.from(result.getChild('value')!)).toEqual([10, 10, 30, 40, 40]);
  expect(Array.from(result.getChild('matched')!)).toEqual([50, 70, 80, 50, 70]);
  const empty = queryArrowTable(left, {...query, join: {...query.join, table: right.slice(0, 0)}});
  expect(empty.numRows).toBe(0);
  expect(empty.schema.fields.map(field => field.name)).toEqual(['value', 'matched']);
});

test('sorts by multiple keys with stable ties and explicit null placement', () => {
  const source = new Table({
    key: vectorFromArray([2, null, 1, 2, 2], new Float64()),
    tie: vectorFromArray([2, 2, 2, 1, 2], new Float64()),
    index: vectorFromArray([0, 1, 2, 3, 4], new Float64())
  });
  const result = queryArrowTable(source, {
    select: ['index'],
    orderBy: [{column: 'key', direction: 'desc', nulls: 'first'}, {column: 'tie'}],
    offset: 1,
    limit: 3
  });
  expect(Array.from(result.getChild('index')!)).toEqual([3, 0, 4]);
});
