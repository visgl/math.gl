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
