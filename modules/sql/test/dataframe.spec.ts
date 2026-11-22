// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Field,
  FixedSizeList,
  Float64,
  Int32,
  List,
  Schema,
  Struct,
  Table,
  vectorFromArray
} from 'apache-arrow';
import {DataFrame, GeoDataFrame} from '@math.gl/sql/dataframe';
import {createProjectionEngine} from '@math.gl/geospatial/projection-core';
import {projJSONCRSParser} from '@math.gl/geospatial/projection-parsers-projjson';
import {wgs84GeographicCRS} from '@math.gl/geospatial/crs/test/projjson-fixtures';
import {mercator} from '@math.gl/geospatial/projection-projections-merc';

/** Two batches with two geometry fields and a non-geometry attribute. */
function makeTable(): Table {
  const point = new FixedSizeList(2, new Field('xy', new Float64()));
  const metadata = new Map([
    ['ARROW:extension:name', 'geoarrow.point'],
    ['ARROW:extension:metadata', '{"edges":"planar"}']
  ]);
  const schema = new Schema(
    [
      new Field('id', new Int32()),
      ...['start', 'end'].map(name => new Field(name, point, true, metadata))
    ],
    new Map([['source', 'test']])
  );
  return new Table(schema, {
    id: vectorFromArray([1, 2], new Int32()),
    start: vectorFromArray([[1, 2], null], point),
    end: vectorFromArray(
      [
        [3, 4],
        [5, 6]
      ],
      point
    )
  }).concat(
    new Table(schema, {
      id: vectorFromArray([3], new Int32()),
      start: vectorFromArray([[-1, 8]], point),
      end: vectorFromArray([[7, 8]], point)
    })
  );
}

test('GeoDataFrame validates and switches active geometry without copying the table', () => {
  const table = makeTable();
  expect(() => GeoDataFrame.fromArrow(table)).toThrow('exactly one');
  expect(() => GeoDataFrame.fromArrow(table, {geometry: 'id'})).toThrow('named "id"');
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'start'});
  const switched = frame.setGeometry('end');
  expect(frame.toArrow()).toBe(table);
  expect(switched.toArrow()).toBe(table);
  expect(frame.geometry.field.name).toBe('start');
  expect(frame.geometry.totalBounds()).toEqual([-1, 2, 1, 8]);
  expect(frame.geometry.vector.data[0]).toBe(table.getChild('start')!.data[0]);
  expect(switched.geometry.totalBounds()).toEqual([3, 4, 7, 8]);
  expect(
    GeoDataFrame.fromArrow(table.slice(0, 0), {geometry: 'start'}).geometry.totalBounds()
  ).toBeNull();
});

test('DataFrame selects fields in order and shares geometry and attribute buffers across batches', () => {
  const table = makeTable();
  const selected = GeoDataFrame.fromArrow(table, {geometry: 'start'}).select('end', 'id');
  const output = selected.toArrow();
  expect(selected).toBeInstanceOf(DataFrame);
  expect(selected).not.toBeInstanceOf(GeoDataFrame);
  expect(output.schema.fields.map(field => field.name)).toEqual(['end', 'id']);
  expect(output.schema.fields[0].metadata).toEqual(table.schema.fields[2].metadata);
  expect(output.schema.metadata).toEqual(table.schema.metadata);
  expect(output.batches).toHaveLength(2);
  for (const name of ['end', 'id']) {
    output.getChild(name)!.data.forEach((chunk, index) => {
      expect(chunk).toBe(table.getChild(name)!.data[index]);
    });
  }
  expect(GeoDataFrame.fromArrow(output).geometry.field.name).toBe('end');
  expect(() => DataFrame.fromArrow(table).select('missing')).toThrow('Unknown column');
});

test('GeoDataFrame filters across batches and retains active geometry, metadata, and row order', () => {
  const table = makeTable();
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'end'});
  const filtered = frame.filter('id <> :excluded', {parameters: {excluded: 2}});
  expect(filtered.geometry.field.name).toBe('end');
  expect(filtered.geometry.totalBounds()).toEqual([3, 4, 7, 8]);
  expect([...filtered.toArrow().getChild('id')!]).toEqual([1, 3]);
  expect(filtered.toArrow().schema).toBe(table.schema);
  expect(filtered.toArrow().getChild('end')!.data[1]).toBe(table.getChild('end')!.data[1]);
  expect(frame.filter('id < 0').geometry.totalBounds()).toBeNull();
});

test('withColumns evaluates simultaneous expressions and shares unchanged geometry chunks', () => {
  const table = makeTable();
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'start'});
  const output = frame.withColumns(
    {id: 'id + :step', doubled: 'id * 2'},
    {
      parameters: {step: 10}
    }
  );
  expect(output.geometry.field).toBe(frame.geometry.field);
  expect(output.toArrow().schema.metadata).toBe(table.schema.metadata);
  expect(output.toArrow().schema.fields.map(field => field.name)).toEqual([
    'id',
    'start',
    'end',
    'doubled'
  ]);
  expect([...output.toArrow().getChild('id')!]).toEqual([11, 12, 13]);
  expect([...output.toArrow().getChild('doubled')!]).toEqual([2, 4, 6]);
  output.geometry.vector.data.forEach((chunk, index) => {
    expect(chunk).toBe(frame.geometry.vector.data[index]);
  });
  expect(frame.withColumns({})).toBe(frame);
  expect(() => frame.withColumns({start: 'id'})).toThrow('active geometry');
});

test('contiguous filtering keeps the binary point view aligned with row IDs', () => {
  const table = makeTable();
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'end'});
  const filtered = frame.filter('id = 2');
  const coordinates = filtered.geometry.vector.data[0].children[0];
  const positions = coordinates.values.subarray(0, 2);
  expect(coordinates.offset).toBeGreaterThan(0);
  expect(positions.buffer).toBe(frame.geometry.vector.data[0].children[0].values.buffer);
  expect([...positions]).toEqual([5, 6]);
  expect(filtered.toArrow().getChild('id')!.get(0)).toBe(2);
});

test('viewport filtering preserves schema, active field, row order and contiguous buffers', () => {
  const table = makeTable();
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'end'});
  expect(frame.filterViewport([3, 4, 7, 8])).toBe(frame);
  const filtered = frame.filterViewport([5, 6, 7, 8]);
  expect(filtered.geometry.field).toBe(frame.geometry.field);
  expect(filtered.toArrow().schema).toBe(table.schema);
  expect([...filtered.toArrow().getChild('id')!]).toEqual([2, 3]);
  expect(filtered.geometry.vector.data[0].children[0].values.buffer).toBe(
    frame.geometry.vector.data[0].children[0].values.buffer
  );
  expect(filtered.toArrow().batches[1]).toBe(table.batches[1]);
  expect(frame.setGeometry('start').filterViewport([0, 0, 2, 3]).toArrow().numRows).toBe(1);
  const empty = frame.filterViewport([0, 0, 0, 0]);
  expect(empty.geometry.totalBounds()).toBeNull();
  expect(empty.toArrow().schema).toBe(table.schema);
  expect(() => frame.filterViewport([1, 0, -1, 1])).toThrow('Invalid');
  expect(() => frame.filterViewport([0, 2, 1, 1])).toThrow('Invalid');
  expect(() => frame.filterViewport([0, 0, Infinity, 1])).toThrow('Invalid');
});

test('viewport filtering uses cached envelopes for repeated queries on the same table and field', () => {
  const table = makeTable();
  const frame = GeoDataFrame.fromArrow(table, {geometry: 'end'});
  expect(frame.filterViewport([0, 0, 10, 10])).toBe(frame);
  const rebuilt = GeoDataFrame.fromArrow(table, {geometry: 'end'});
  const coordinates = rebuilt.geometry.vector.data[0].children[0];
  let coordinateReads = 0;
  const values = coordinates.values;
  Object.defineProperty(coordinates, 'values', {
    get() {
      coordinateReads++;
      return values;
    }
  });
  expect(rebuilt.filterViewport([20, 20, 30, 30]).toArrow().numRows).toBe(0);
  expect(coordinateReads).toBe(0);
});

test('geographic viewports include both sides of the seam without duplicating rows', () => {
  const point = new FixedSizeList(2, new Field('xy', new Float64()));
  const schema = new Schema([
    new Field('id', new Int32()),
    new Field('position', point, true, new Map([['ARROW:extension:name', 'geoarrow.point']]))
  ]);
  const table = new Table(schema, {
    id: vectorFromArray([1, 2, 3, 4, 5, 6, 7], new Int32()),
    position: vectorFromArray(
      [[175, 1], [0, 0], [-175, 1], [180, 0], [-180, 0], [178, 40], null],
      point
    )
  });
  const frame = GeoDataFrame.fromArrow(table);
  /** Returns filtered IDs in input order. */
  const idsIn = (bounds: Parameters<GeoDataFrame['filterViewport']>[0]) => [
    ...frame.filterViewport(bounds, {wrapLongitude: true}).toArrow().getChild('id')!
  ];
  expect(idsIn([175, 0, -175, 1])).toEqual([1, 3, 4, 5]);
  expect(idsIn([535, 0, 545, 1])).toEqual([1, 3, 4, 5]);
  expect(idsIn([180, 0, 180, 0])).toEqual([4, 5]);
  expect(idsIn([-540, -10, 540, 10])).toEqual([1, 2, 3, 4, 5]);
});

test('viewport filtering uses inclusive row envelopes for non-point geometry', () => {
  const vertex = new FixedSizeList(2, new Field('xy', new Float64()));
  const line = new List(new Field('vertices', vertex));
  const field = new Field(
    'route',
    line,
    true,
    new Map([['ARROW:extension:name', 'geoarrow.linestring']])
  );
  const frame = GeoDataFrame.fromArrow(
    new Table(new Schema([field]), {
      route: vectorFromArray(
        [
          [
            [179, 10],
            [181, 10]
          ],
          [],
          null
        ],
        line
      )
    })
  );
  const clipped = frame.filterViewport([-180, 10, -180, 11], {wrapLongitude: true});
  expect(clipped.toArrow().numRows).toBe(1);
  expect(clipped.geometry.totalBounds()).toEqual([179, 10, 181, 10]);
});

test('wrapped and full-world GeoArrow boxes intersect the corresponding periodic window', () => {
  const box = new Struct(
    ['xmin', 'ymin', 'xmax', 'ymax'].map(name => new Field(name, new Float64()))
  );
  const field = new Field('extent', box, true, new Map([['ARROW:extension:name', 'geoarrow.box']]));
  const table = new Table(new Schema([field, new Field('id', new Int32())]), {
    extent: vectorFromArray(
      [
        {xmin: 170, ymin: 0, xmax: -170, ymax: 1},
        {xmin: -180, ymin: 0, xmax: 180, ymax: 1}
      ],
      box
    ),
    id: vectorFromArray([1, 2], new Int32())
  });
  const frame = GeoDataFrame.fromArrow(table);
  const options = {wrapLongitude: true};
  expect(frame.filterViewport([-175, 0, -174, 1], options)).toBe(frame);
  expect([...frame.filterViewport([0, 0, 1, 1], options).toArrow().getChild('id')!]).toEqual([2]);
});

test('toCRS reprojects an active geometry while retaining other fields and batch structure', () => {
  const engine = createProjectionEngine({projections: [mercator]});
  const table = makeTable();
  const start = GeoDataFrame.fromArrow(table, {geometry: 'start'});
  expect(start.filterViewport([-2, 1, 2, 9]).toArrow().numRows).toBe(2);
  const projected = start.toCRS('EPSG:3857', {engine, from: 'EPSG:4326'});
  expect(projected.filterViewport([-2, 1, 2, 9]).toArrow().numRows).toBe(0);
  const roundTrip = projected.toCRS('EPSG:4326', {engine});
  const actual = projected.toArrow();
  const coordinates = projected.geometry.vector.get(0)!.toArray();
  expect(coordinates[0]).toBeCloseTo(111319.490793, 5);
  expect(coordinates[1]).toBeCloseTo(222684.208506, 5);
  expect(roundTrip.geometry.totalBounds()![0]).toBeCloseTo(-1, 9);
  expect(roundTrip.geometry.totalBounds()![3]).toBeCloseTo(8, 9);
  expect(projected.geometry.vector.get(1)).toBeNull();
  expect(actual.batches).toHaveLength(2);
  expect(actual.schema.metadata).toBe(table.schema.metadata);
  expect(actual.schema.fields[2]).toBe(table.schema.fields[2]);
  for (const name of ['id', 'end']) {
    expect(actual.getChild(name)!.data[1]).toBe(table.getChild(name)!.data[1]);
  }
  expect(JSON.parse(projected.geometry.field.metadata.get('ARROW:extension:metadata')!)).toEqual({
    crs: 'EPSG:3857',
    crs_type: 'authority_code',
    edges: 'planar'
  });
  expect(start.geometry.totalBounds()).toEqual([-1, 2, 1, 8]);
  expect(projected.toCRS('EPSG:3857', {engine})).toBe(projected);
  expect(() => start.toCRS('EPSG:3857', {engine})).toThrow('source CRS');
  expect(() => projected.toCRS('bogus', {engine})).toThrow('authority code');
  expect(
    start
      .filterViewport([20, 20, 30, 30])
      .toCRS('EPSG:3857', {
        engine,
        from: 'EPSG:4326'
      })
      .toArrow().numRows
  ).toBe(0);
});

test('toCRS preserves extra ordinates and rejects non-finite transform results', () => {
  const engine = createProjectionEngine({projections: [mercator]});
  const type = new FixedSizeList(4, new Field('xyzm', new Float64()));
  const field = new Field(
    'point',
    type,
    true,
    new Map([['ARROW:extension:name', 'geoarrow.point']])
  );
  const frame = GeoDataFrame.fromArrow(
    new Table(new Schema([field]), {
      point: vectorFromArray(
        [
          [1, 2, 123, 456],
          [NaN, NaN, NaN, NaN]
        ],
        type
      )
    })
  );
  const output = frame.toCRS('EPSG:3857', {engine, from: 'EPSG:4326'});
  expect([...output.geometry.vector.get(0)!].slice(2)).toEqual([123, 456]);
  expect([...output.geometry.vector.get(1)!]).toEqual([NaN, NaN, NaN, NaN]);
  const invalid = {createProjection: () => ({projectSync: () => [Infinity, 0]})};
  expect(() => frame.toCRS('EPSG:3857', {engine: invalid, from: 'EPSG:4326'})).toThrow('row 0');
});

test('toCRS passes structured source metadata to the configured CRS parser', () => {
  const engine = createProjectionEngine({projections: [mercator], parsers: [projJSONCRSParser]});
  const type = new FixedSizeList(2, new Field('xy', new Float64()));
  const metadata = new Map([
    ['ARROW:extension:name', 'geoarrow.point'],
    ['ARROW:extension:metadata', JSON.stringify({crs: wgs84GeographicCRS, crs_type: 'projjson'})]
  ]);
  const table = new Table(new Schema([new Field('point', type, true, metadata)]), {
    point: vectorFromArray([[1, 2]], type)
  });
  const projected = GeoDataFrame.fromArrow(table).toCRS('EPSG:3857', {engine});
  expect(projected.geometry.totalBounds()![0]).toBeCloseTo(111319.490793, 5);
  const sphericalMetadata = new Map(metadata);
  sphericalMetadata.set(
    'ARROW:extension:metadata',
    JSON.stringify({
      crs: wgs84GeographicCRS,
      crs_type: 'projjson',
      edges: 'spherical'
    })
  );
  const spherical = new Table(
    new Schema([table.schema.fields[0].clone({metadata: sphericalMetadata})]),
    {
      point: table.getChild('point')!
    }
  );
  expect(() => GeoDataFrame.fromArrow(spherical).toCRS('EPSG:3857', {engine})).toThrow('planar');
});
