// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Field, Float64, Int32, List, Table, tableFromArrays, vectorFromArray} from 'apache-arrow';
import {expect, test, vi} from 'vitest';
import {queryArrowSQL, type ArrowSQLTableFunction} from '../src';

/** Assembles paths from shared segments and scales segment times to each trip. */
const expandTrips: ArrowSQLTableFunction = input => {
  const segmentCount = input.getChild('positions')!.indexOf(null);
  const trips = [];
  for (const {vendor, start, end, segment_ids: segmentIds} of input.slice(segmentCount)) {
    const path: number[] = [];
    const timestamps: number[] = [];
    let duration = 0;
    for (const id of segmentIds) {
      const segment = input.get(id)!;
      for (let point = path.length ? 1 : 0; point < segment.positions.length; point++) {
        path.push(segment.positions.get(point));
        timestamps.push(duration + segment.times.get(point));
      }
      duration += segment.times.get(segment.times.length - 1);
    }
    trips.push({
      vendor,
      path,
      timestamps: timestamps.map(t => start + (t / duration) * (end - start))
    });
  }
  const list = new List(new Field('value', new Float64()));
  return new Table({
    vendor: vectorFromArray(
      trips.map(trip => trip.vendor),
      new Int32()
    ),
    path: vectorFromArray(
      trips.map(trip => trip.path),
      list
    ),
    timestamps: vectorFromArray(
      trips.map(trip => trip.timestamps),
      list
    )
  });
};

test('a SQL table function expands a shared Trips segment dictionary', () => {
  const input = new Table({
    positions: vectorFromArray([[5, 6], [6, 8], null, null]),
    times: vectorFromArray([[0, 1], [0, 2], null, null]),
    segment_ids: vectorFromArray([null, null, [0, 1], [0]]),
    vendor: vectorFromArray([null, null, 0, 1]),
    start: vectorFromArray([null, null, 10, 30]),
    end: vectorFromArray([null, null, 16, 34])
  });
  const expand = vi.fn(expandTrips);
  const result = queryArrowSQL(
    'SELECT trip.vendor, trip.path, trip.timestamps FROM EXPAND_TRIPS(data) AS trip ORDER BY vendor',
    new Map([['data', input]]),
    {tableFunctions: {expand_trips: expand}}
  );
  expect(expand).toHaveBeenCalledTimes(1);
  expect(expand.mock.calls[0]![0]).toBe(input);
  expect(result.numRows).toBe(2);
  expect(Array.from(result.getChild('path')!.get(0))).toEqual([5, 6, 8]);
  expect(Array.from(result.getChild('timestamps')!.get(0))).toEqual([10, 12, 16]);
  expect(Array.from(result.getChild('path')!.get(1))).toEqual([5, 6]);
  expect(Array.from(result.getChild('timestamps')!.get(1))).toEqual([30, 34]);
});

test('table functions require a registered name and a catalog input', () => {
  const tables = new Map([['data', tableFromArrays({value: [1]})]]);
  const sql = 'SELECT * FROM SOURCE(data)';
  expect(() => queryArrowSQL(sql, tables)).toThrow('Unknown Arrow SQL table function: SOURCE');
  const source = vi.fn((table: Table) => table);
  const tableFunctions = {source};
  expect(() => queryArrowSQL('SELECT * FROM SOURCE(missing)', tables, {tableFunctions})).toThrow(
    'Unknown Arrow SQL table: missing'
  );
  const signal = AbortSignal.abort(new Error('cancelled'));
  expect(() => queryArrowSQL(sql, tables, {tableFunctions, signal})).toThrow('cancelled');
  expect(source).not.toHaveBeenCalled();
});

test('the result of a table function participates in an equality join', () => {
  const tables = new Map([['data', tableFromArrays({id: [1, 2]})]]);
  const result = queryArrowSQL(
    'SELECT source.id FROM data AS source JOIN FIRST_ROW(data) AS matched ON source.id = matched.id',
    tables,
    {tableFunctions: {FIRST_ROW: input => input.slice(0, 1)}}
  );
  expect(Array.from(result.getChild('id')!)).toEqual([1]);
});
