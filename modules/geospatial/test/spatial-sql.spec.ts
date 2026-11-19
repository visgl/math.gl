// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Binary, Field, Int32, Schema, Table, vectorFromArray, type Vector} from 'apache-arrow';
import {
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromGeometryRows,
  parseWKB,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
import {queryArrowSQL} from '@math.gl/sql';
import {POSTGIS_SPATIAL_FUNCTIONS, TURF_FUNCTIONS} from '@math.gl/geospatial/turf/expressions';

/** Marks a native or WKB vector with the extension and optional CRS used by SQL binding. */
function geometryField(name: string, vector: Vector, encoding = 'wkb', metadata?: object): Field {
  const extension = new Map([['ARROW:extension:name', 'geoarrow.' + encoding]]);
  if (metadata) extension.set('ARROW:extension:metadata', JSON.stringify(metadata));
  return new Field(name, vector.type, true, extension);
}

/** Prepares a nullable geometry column from PostGIS-style WKT fixtures. */
function wkb(...wkts: (string | null)[]) {
  return vectorFromArray(
    wkts.map(wkt => (wkt === null ? null : writeWKB(parseWKT(wkt)))),
    new Binary()
  );
}

/** Executes a spatial SELECT over a single Arrow table. */
function select(sql: string, table: Table): Table {
  return queryArrowSQL(sql, new Map([['features', table]]), {
    functions: [...POSTGIS_SPATIAL_FUNCTIONS, ...TURF_FUNCTIONS]
  });
}

/** Decodes a result geometry for assertions independent of physical Arrow storage. */
function geometryAt(table: Table, name: string, row: number) {
  const bytes = table.getChild(name)!.get(row);
  return bytes ? parseWKB(bytes).geometry : null;
}

test('PostGIS point-in-polygon signatures distinguish hole boundaries from interiors across batches', () => {
  const polygonWkt = 'POLYGON((0 0,8 0,8 8,0 8,0 0),(1 1,3 1,3 3,1 3,1 1))';
  const boundary = wkb('POINT(0 2)', 'POINT(1 2)', 'POINT(2 2)', 'POINT(5 5)', 'POINT EMPTY', null);
  const shapes = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows(Array.from({length: 6}, () => parseWKT(polygonWkt)))
  );
  const table = new Table(
    new Schema([geometryField('shape', shapes, 'polygon'), geometryField('p', boundary)]),
    {shape: shapes, p: boundary}
  );
  const batched = new Table(table.schema, [
    ...table.slice(0, 3).batches,
    ...table.slice(3).batches
  ]);
  const result = select(
    'SELECT st_contains(shape, p) AS inside, ST_Covers(shape, p) AS covered FROM features',
    batched
  );
  expect([...result.getChild('inside')!]).toEqual([false, false, false, true, false, null]);
  expect([...result.getChild('covered')!]).toEqual([true, true, false, true, false, null]);
});

test('planar measurements and weighted centroids agree with PostGIS geometry fixture values', () => {
  const shape = wkb(
    'POLYGON((0 0,8 0,8 8,0 8,0 0),(1 1,3 1,3 3,1 3,1 1))',
    'LINESTRING(0 0,4 0,4 2)',
    'MULTIPOINT((2 4),(4 8))',
    'POLYGON EMPTY',
    'POINT EMPTY',
    null
  );
  const table = new Table(new Schema([geometryField('shape', shape, 'wkb', {crs: 'EPSG:3857'})]), {
    shape
  });
  const result = select(
    `SELECT ST_Area(shape) AS area, ST_Length(shape) AS length,
    ST_Centroid(shape) AS center, ST_Envelope(shape) AS extent FROM features`,
    table
  );
  // PostGIS geometry fixtures: use ST_Area, ST_Length and ST_AsText(ST_Centroid(...)) with these WKTs.
  expect([...result.getChild('area')!]).toEqual([60, 0, 0, 0, 0, null]);
  expect([...result.getChild('length')!]).toEqual([0, 6, 0, 0, 0, null]);
  expect(geometryAt(result, 'center', 0)).toEqual({
    type: 'Point',
    coordinates: [62 / 15, 62 / 15]
  });
  expect(geometryAt(result, 'center', 1)).toEqual({
    type: 'Point',
    coordinates: [8 / 3, 1 / 3]
  });
  expect(geometryAt(result, 'center', 2)).toEqual({
    type: 'Point',
    coordinates: [3, 6]
  });
  expect(geometryAt(result, 'center', 3)).toEqual({
    type: 'GeometryCollection',
    geometries: []
  });
  expect(geometryAt(result, 'center', 4)).toEqual({
    type: 'GeometryCollection',
    geometries: []
  });
  expect(geometryAt(result, 'center', 5)).toBeNull();
  expect(geometryAt(result, 'extent', 3)).toEqual({
    type: 'Polygon',
    coordinates: []
  });
  expect(geometryAt(result, 'extent', 4)).toEqual({
    type: 'Point',
    coordinates: [NaN, NaN]
  });
  expect(result.schema.fields[2]!.metadata.get('ARROW:extension:name')).toBe('geoarrow.wkb');
  expect(result.schema.fields[2]!.metadata.get('ARROW:extension:metadata')).toBe(
    '{"crs":"EPSG:3857"}'
  );
});

test('geometry results chain through SQL with planar point units and degenerate envelopes', () => {
  const points = wkb('POINT(3 4)', 'POINT(0 0)');
  const origin = wkb('POINT(0 0)', 'POINT(0 0)');
  const extents = wkb('LINESTRING(3 1,3 4)', 'POINT(0 0)');
  const table = new Table(
    new Schema([
      geometryField('p', points),
      geometryField('origin', origin),
      geometryField('shape', extents)
    ]),
    {p: points, origin, shape: extents}
  );
  const result = select(
    `SELECT ST_Distance(ST_Centroid(p), origin) AS distance,
    ST_Azimuth(p, origin) AS azimuth, ST_Envelope(shape) AS envelope,
    ST_Envelope(ST_Centroid(shape)) AS chained, TURF_DISTANCE(p, origin) AS kilometers,
    TURF_BBOX(shape) AS bbox FROM features`,
    table
  );
  expect([...result.getChild('distance')!]).toEqual([5, 0]);
  expect(result.getChild('azimuth')!.get(0)).toBeCloseTo(Math.PI + Math.atan2(3, 4));
  expect(result.getChild('azimuth')!.get(1)).toBeNull();
  expect(geometryAt(result, 'envelope', 0)).toEqual({
    type: 'LineString',
    coordinates: [
      [3, 1],
      [3, 4]
    ]
  });
  expect(geometryAt(result, 'envelope', 1)).toEqual({
    type: 'Point',
    coordinates: [0, 0]
  });
  expect(geometryAt(result, 'chained', 0)).toEqual({
    type: 'Point',
    coordinates: [3, 2.5]
  });
  expect(result.getChild('kilometers')!.get(0)).toBeCloseTo(555.812709, 3);
  expect(Array.from(result.getChild('bbox')!.get(0))).toEqual([3, 1, 3, 4]);
});

test('validates native signatures at bind time and only decodes active WKB rows', () => {
  const bytes = vectorFromArray(
    [
      writeWKB(parseWKT('POINT(1 2)')),
      new Uint8Array([42]),
      writeWKB(parseWKT('LINESTRING(0 0,1 1)'))
    ],
    new Binary()
  );
  const points = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([parseWKT('POINT(1 2)'), null, null])
  );
  const table = new Table(
    new Schema([
      geometryField('bytes', bytes),
      geometryField('p', points, 'point'),
      new Field('id', new Int32(), false)
    ]),
    {bytes, p: points, id: vectorFromArray([0, 1, 2], new Int32())}
  );
  expect(() => select('SELECT ST_Contains(p, p) FROM features', table)).toThrow(
    'requires GeoArrow Polygon'
  );
  expect(() => select('SELECT ST_Distance(bytes, bytes) FROM features', table)).toThrow();
  expect(() =>
    select('SELECT ST_Distance(bytes, bytes) FROM features WHERE id = 2', table)
  ).toThrow('does not support LineString');
  const result = select(
    `SELECT CASE WHEN id = 0 THEN ST_Distance(bytes, p) ELSE 0 END AS distance,
    ST_Distance(NULL, p) AS null_distance FROM features`,
    table
  );
  expect([...result.getChild('distance')!]).toEqual([0, 0, 0]);
  expect([...result.getChild('null_distance')!]).toEqual([null, null, null]);
});
