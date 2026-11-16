// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Field,
  FixedSizeList,
  Float64,
  Int32,
  List,
  Struct,
  Table,
  Utf8,
  vectorFromArray
} from 'apache-arrow';
import {expect, test} from 'vitest';
import {queryArrowSQL, queryArrowTable} from '@math.gl/sql';
import {compileArrowExpression} from '@math.gl/sql/arrow';
import {parseSQLExpression, parseSQLQuery} from '@math.gl/sql/parser';

/** Sample flight coordinates in both list and named struct form. */
function flightTable() {
  const altitude = new Field('altitude', new Int32(), true, new Map([['units', 'meters']]));
  const coordinates = new Struct([new Field('longitude', new Float64()), altitude]);
  return new Table({
    start: vectorFromArray(
      [[-122, 45, 123], [12, null], null, []],
      new List(new Field('item', new Int32(), true))
    ),
    endpoint: vectorFromArray(
      [
        {longitude: -122, altitude: 123},
        {longitude: 12, altitude: null},
        null,
        {longitude: 40, altitude: 400}
      ],
      coordinates
    ),
    index: vectorFromArray([3, 2, 1, null], new Int32()),
    floatIndex: vectorFromArray([1.5, 1, NaN, Infinity], new Float64()),
    'endpoint.longitude': vectorFromArray(['literal', 'literal', 'literal', 'literal'], new Utf8())
  });
}

test('one-based list indexing supports dynamic indexes, nulls, and fixed-size positions', () => {
  const input = flightTable();
  /** Evaluates a SQL expression against the sample flights. */
  const run = (sql: string) =>
    Array.from(
      compileArrowExpression(parseSQLExpression(sql), {
        inputSchema: input.schema
      }).evaluateTable(input)
    );
  expect(run('start[1]')).toEqual([-122, 12, null, null]);
  expect(run('LIST_EXTRACT(start, index)')).toEqual([123, null, null, null]);
  expect(run('LIST_EXTRACT(start, floatIndex)')).toEqual([null, 12, null, null]);
  expect(run('start[-1]')).toEqual([123, null, null, null]);
  expect(run('start[0]')).toEqual([null, null, null, null]);
  expect(run('ARRAY[1, 2, 3][2]')).toEqual([2, 2, 2, 2]);
  const fixed = new Table({
    start: vectorFromArray([[1, 2], null], new FixedSizeList(2, new Field('item', new Int32())))
  });
  expect(
    Array.from(
      compileArrowExpression(parseSQLExpression('start[2]'), {
        inputSchema: fixed.schema
      }).evaluateTable(fixed)
    )
  ).toEqual([2, null]);
});

test('struct access binds to child fields and preserves parent validity, metadata, and masks', () => {
  const input = flightTable().slice(1);
  const expression = compileArrowExpression(
    parseSQLExpression("STRUCT_EXTRACT(endpoint, 'altitude')"),
    {inputSchema: input.schema}
  );
  expect(expression.outputField.type).toBeInstanceOf(Int32);
  expect(expression.outputField.metadata.get('units')).toBe('meters');
  expect(Array.from(expression.evaluateTable(input))).toEqual([null, null, 400]);
  expect(
    Array.from(expression.evaluateTable(input, {activeRows: new Uint8Array([1, 1, 0])}))
  ).toEqual([null, null, null]);
  expect(() =>
    compileArrowExpression(parseSQLExpression('endpoint.missing'), {inputSchema: input.schema})
  ).toThrow('Unknown Arrow struct field: missing');
});

test('nested extraction works in projections and predicates while quoted dotted names stay literal', () => {
  const input = flightTable();
  const query = parseSQLQuery(
    'SELECT start[3] AS altitude, "endpoint.longitude" AS label WHERE endpoint.longitude < 0'
  );
  if ('command' in query) throw new Error('Expected SELECT');
  const result = queryArrowTable(input, query);
  expect(result.get(0)?.toJSON()).toEqual({altitude: 123, label: 'literal'});
  expect(result.numRows).toBe(1);
  const relational = queryArrowSQL(
    'SELECT f.endpoint.longitude AS longitude, f.start[3] AS altitude FROM flights AS f WHERE endpoint.longitude < 0',
    new Map([['flights', input]])
  );
  expect(relational.get(0)?.toJSON()).toEqual({longitude: -122, altitude: 123});
});

test('list elements and struct fields can be chained without losing nested types', () => {
  const point = new Struct([new Field('longitude', new Float64())]);
  const points = new List(new Field('point', point));
  const batch = new Table({
    route: vectorFromArray([[{longitude: 12}, {longitude: 18}], null], points)
  });
  const input = batch.concat(batch);
  const chained = compileArrowExpression(parseSQLExpression('route[2].longitude'), {
    inputSchema: input.schema
  });
  expect(Array.from(chained.evaluateTable(input))).toEqual([18, null, 18, null]);

  const selected = compileArrowExpression(parseSQLExpression('route[1]'), {
    inputSchema: input.schema
  });
  const result = selected.evaluateTable(input, {activeRows: new Uint8Array([1, 1, 0, 0])});
  expect(result.type).toEqual(point);
  expect(result.get(0)?.toJSON()).toEqual({longitude: 12});
  expect(Array.from(result).slice(1)).toEqual([null, null, null]);
  expect(selected.evaluateTable(new Table(input.schema, [])).type).toEqual(point);
});

test('CASE selects nested list and struct results from Arrow extraction', () => {
  const list = new List(new Field('item', new Int32(), true));
  const entry = new Struct([new Field('values', list)]);
  const input = new Table({
    selectLeft: vectorFromArray([true, false, true]),
    leftEntry: vectorFromArray([{values: [1]}, {values: [2]}, null], entry),
    rightEntry: vectorFromArray([{values: [3]}, {values: [4, null]}, {values: [5]}], entry),
    entries: vectorFromArray(
      [[{values: [1]}], [{values: [2]}], []],
      new List(new Field('item', entry))
    )
  });
  const result = queryArrowSQL(
    `SELECT CASE WHEN selectLeft THEN leftEntry.values ELSE rightEntry.values END AS vals,
            CASE WHEN selectLeft THEN entries[1] ELSE entries[-1] END AS entry,
            CASE WHEN selectLeft THEN entries[1] END AS maybeEntry
     FROM data`,
    new Map([['data', input]])
  );
  const lists = result.getChild('vals')!;
  expect(Array.from(lists, value => (value === null ? null : Array.from(value)))).toEqual([
    [1],
    [4, null],
    null
  ]);
  const entries = result.getChild('entry')!;
  expect(Array.from(entries, value => (value === null ? null : Array.from(value.values)))).toEqual([
    [1],
    [2],
    null
  ]);
  const optional = result.getChild('maybeEntry')!;
  expect(Array.from(optional, value => (value === null ? null : Array.from(value.values)))).toEqual(
    [[1], null, null]
  );
});
