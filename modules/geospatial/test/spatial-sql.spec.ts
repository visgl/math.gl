// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Binary,
  LargeBinary,
  Field,
  Int32,
  Schema,
  Table,
  vectorFromArray,
  type Vector
} from 'apache-arrow';
import {
  getGeoArrowFieldInfo,
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector,
  materializeGeoArrowRows,
  makeGeoArrowColumnFromGeometryRows,
  parseWKB,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
import {queryArrowSQL, queryArrowTableInBatches} from '@math.gl/sql/query';
import {parseSQLQuery} from '@math.gl/sql/parser';
import {ST_CONCAVEHULL, ST_CONVEXHULL} from '@math.gl/geospatial/st-hull-functions';
import {POSTGIS_SPATIAL_FUNCTIONS} from '@math.gl/geospatial/st-functions';
import {
  ST_BUFFER,
  ST_DIFFERENCE,
  ST_INTERSECTION,
  ST_SYMDIFFERENCE,
  ST_UNION
} from '@math.gl/geospatial/st-overlay-functions';
import {ST_CLIPBYBOX2D, ST_SUBDIVIDE} from '@math.gl/geospatial/st-viewport-functions';
import {TURF_FUNCTIONS} from '@math.gl/geospatial/turf-functions';

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
    functions: [
      ...POSTGIS_SPATIAL_FUNCTIONS,
      ...TURF_FUNCTIONS,
      ST_CLIPBYBOX2D,
      ST_CONVEXHULL,
      ST_CONCAVEHULL,
      ST_BUFFER,
      ST_DIFFERENCE,
      ST_INTERSECTION,
      ST_SYMDIFFERENCE,
      ST_UNION
    ]
  });
}

/** Decodes a result geometry for assertions independent of physical Arrow storage. */
function geometryAt(table: Table, name: string, row: number) {
  const field = table.schema.fields.find(field => field.name === name)!;
  const vector = table.getChild(name)!;
  if (getGeoArrowFieldInfo(field)?.encoding === 'geoarrow.wkb') {
    const bytes = vector.get(row);
    return bytes ? parseWKB(bytes).geometry : null;
  }
  return materializeGeoArrowRows(
    makeGeoArrowColumnFromArrowVector(vector.slice(row, row + 1), {field})
  )[0];
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
    `SELECT st_contains(shape, p) AS inside, ST_Covers(shape, p) AS covered,
            ST_Within(p, shape) AS within_result, ST_CoveredBy(p, shape) AS covered_by FROM features`,
    batched
  );
  expect([...result.getChild('within_result')!]).toEqual([false, false, false, true, false, null]);
  expect([...result.getChild('covered_by')!]).toEqual([true, true, false, true, false, null]);
  expect([...result.getChild('inside')!]).toEqual([false, false, false, true, false, null]);
  expect([...result.getChild('covered')!]).toEqual([true, true, false, true, false, null]);
});

test('queries route vertices and constructs viewport polygons', () => {
  const route = wkb(...Array(6).fill('LINESTRING(0 0,2 3,4 5)'));
  const n = vectorFromArray([1, -2, 0, 4, -4, null], new Int32());
  const table = new Table(
    new Schema([geometryField('route', route), new Field('n', n.type, true)]),
    {route, n}
  );
  const result = select(
    `SELECT ST_Y(ST_PointN(route, n)) AS y, ST_MakeEnvelope(0, 1, n, 4) AS box FROM features`,
    table
  );
  expect([...result.getChild('y')!]).toEqual([0, 3, null, null, null, null]);
  expect(geometryAt(result, 'box', 0)).toEqual(parseWKT('POLYGON((0 1,0 4,1 4,1 1,0 1))'));
  expect(geometryAt(result, 'box', 5)).toBeNull();
});

test('filters point pairs with inclusive per-row planar radii', () => {
  const p = wkb('POINT(3 4)', 'POINT(3 4)', 'POINT(0 0)', 'POINT EMPTY', null, 'POINT(1 0)');
  const origin = wkb(...Array(6).fill('POINT(0 0)'));
  const r = vectorFromArray([5, 4, 0, 0, 9, null], new Int32());
  const table = new Table(
    new Schema([
      geometryField('p', p),
      geometryField('origin', origin),
      new Field('r', r.type, true)
    ]),
    {p, origin, r}
  );
  const result = select('SELECT ST_DWithin(p, origin, r) AS nearby FROM features', table);
  expect([...result.getChild('nearby')!]).toEqual([true, false, true, false, null, null]);
  expect(() => select('SELECT ST_DWithin(p, origin, -1) FROM features', table)).toThrow(
    /nonnegative/
  );
});

test('label points lie inside concave, holed and multipart surfaces', () => {
  const g = wkb(
    'POLYGON((0 0,6 0,6 1,1 1,1 6,0 6,0 0))',
    'POLYGON((0 0,8 0,8 8,0 8,0 0),(1 1,7 1,7 7,1 7,1 1))',
    'MULTIPOLYGON(((0 0,1 0,1 1,0 1,0 0)),((10 0,20 0,20 4,10 4,10 0)))',
    'POLYGON EMPTY',
    null
  );
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select(
    'SELECT ST_Contains(g, ST_PointOnSurface(g)) AS inside, ST_PointOnSurface(g) AS anchor FROM features',
    table
  );
  expect([...result.getChild('inside')!]).toEqual([true, true, true, false, null]);
  expect(getGeoArrowFieldInfo(result.schema.fields[1]!)?.encoding).toBe('geoarrow.point');
  expect(geometryAt(result, 'anchor', 2)).toEqual({type: 'Point', coordinates: [15, 2]});
  expect(geometryAt(result, 'anchor', 3)).toEqual({type: 'Point', coordinates: []});
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
  const table = new Table(
    new Schema([
      geometryField('shape', shape, 'wkb', {
        crs: 'EPSG:3857',
        crs_type: 'authority_code',
        geometry_types: ['Polygon'],
        bbox: [0, 0, 8, 8]
      })
    ]),
    {
      shape
    }
  );
  const result = select(
    `SELECT ST_Area(shape) AS area, ST_Length(shape) AS length,
    ST_Centroid(shape) AS center, ST_Envelope(shape) AS extent FROM features`,
    table
  );
  // Verified with PostGIS 3.6.2 using ST_Area, ST_Length, ST_Centroid and ST_Envelope.
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
    type: 'Point',
    coordinates: [NaN, NaN]
  });
  expect(geometryAt(result, 'center', 4)).toEqual({
    type: 'Point',
    coordinates: [NaN, NaN]
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
    '{"crs":"EPSG:3857","crs_type":"authority_code"}'
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

test('resolves nullable computed geometries and keeps named CRS constraints', () => {
  const a = wkb('POINT(3 4)', 'POINT(3 4)');
  const b = wkb('POINT(0 0)', 'POINT(0 0)');
  const id = vectorFromArray([0, 1], new Int32());
  const table = new Table(
    new Schema([
      geometryField('a', a, 'wkb', {crs: 'EPSG:3857'}),
      geometryField('b', b, 'wkb', {crs: 'EPSG:3857'}),
      geometryField('other', b, 'wkb', {crs: 'EPSG:4326'}),
      new Field('id', new Int32(), false)
    ]),
    {a, b, other: b, id}
  );
  const result = select(
    'SELECT ST_Distance(CASE WHEN id = 0 THEN a ELSE NULL END, b) AS d FROM features',
    table
  );
  expect([...result.getChild('d')!]).toEqual([5, null]);
  expect(() => select('SELECT ST_Distance(a, other) FROM features', table)).toThrow('same CRS');
  expect(() =>
    select('SELECT ST_Distance(CASE WHEN id = 0 THEN a ELSE other END, b) FROM features', table)
  ).toThrow('branch extension metadata must match');
  const missing = select(
    'SELECT ST_Distance(CASE WHEN id = 0 THEN NULL ELSE NULL END, b) AS d FROM features',
    table
  );
  expect([...missing.getChild('d')!]).toEqual([null, null]);
});

test('Turf SQL declarations retain the defaults of the direct Turf kernels', () => {
  const p = wkb('POINT(0 0)');
  const q = wkb('POINT(2 0)');
  const path = wkb('LINESTRING(0 0,2 0,2 1)');
  const polygon = wkb('POLYGON((0 0,4 0,0 2,0 0))');
  const table = new Table(
    new Schema([
      geometryField('p', p),
      geometryField('q', q),
      geometryField('path', path),
      geometryField('polygon', polygon)
    ]),
    {p, q, path, polygon}
  );
  const result = select(
    `SELECT TURF_BEARING(p, q) AS bearing, TURF_LENGTH(path) AS length,
    TURF_AREA(polygon) AS area, TURF_CENTROID(path) AS centroid, TURF_MIDPOINT(p, q) AS midpoint,
    TURF_BOOLEAN_POINT_IN_POLYGON(p, polygon) AS covered FROM features`,
    table
  );
  expect(result.getChild('bearing')!.get(0)).toBe(90);
  expect(result.getChild('length')!.get(0)).toBeCloseTo(333.58524, 4);
  expect(result.getChild('area')!.get(0)).toBeCloseTo(49447340364.086, -3);
  expect(geometryAt(result, 'centroid', 0)).toEqual({type: 'Point', coordinates: [4 / 3, 1 / 3]});
  const center = geometryAt(result, 'midpoint', 0);
  expect(center?.type === 'Point' && center.coordinates[0]).toBeCloseTo(1);
  expect(center?.type === 'Point' && center.coordinates[1]).toBeCloseTo(0);
  expect(result.getChild('covered')!.get(0)).toBe(true);
});

test('empty point members do not alter centroids, bounds or envelopes', () => {
  const mixed = {
    type: 'MultiPoint' as const,
    coordinates: [
      [NaN, NaN],
      [2, 4]
    ]
  };
  const native = makeArrowVectorFromGeoArrowColumn(makeGeoArrowColumnFromGeometryRows([mixed]));
  const serialized = vectorFromArray([writeWKB(mixed)], new Binary());
  const collection = wkb('GEOMETRYCOLLECTION(POINT EMPTY,POINT(2 4))');
  const table = new Table(
    new Schema([
      geometryField('native', native, 'multipoint'),
      geometryField('serialized', serialized),
      geometryField('collection', collection)
    ]),
    {native, serialized, collection}
  );
  const result = select(
    `SELECT ST_Centroid(native) AS a, ST_Centroid(serialized) AS b,
    ST_Envelope(collection) AS extent, TURF_BBOX(serialized) AS bbox FROM features`,
    table
  );
  for (const name of ['a', 'b', 'extent']) {
    expect(geometryAt(result, name, 0)).toEqual({type: 'Point', coordinates: [2, 4]});
  }
  expect(Array.from(result.getChild('bbox')!.get(0))).toEqual([2, 4, 2, 4]);
});

test('empty centroids remain usable in nested point functions', () => {
  const shape = wkb('POLYGON EMPTY');
  const target = wkb('POINT(2 4)');
  const table = new Table(
    new Schema([geometryField('shape', shape), geometryField('target', target)]),
    {shape, target}
  );
  const result = select(
    `SELECT ST_Distance(ST_Centroid(shape), target) AS distance,
    ST_Centroid(ST_Centroid(shape)) AS center FROM features`,
    table
  );
  expect(result.getChild('distance')!.get(0)).toBeNull();
  expect(geometryAt(result, 'center', 0)).toEqual({type: 'Point', coordinates: [NaN, NaN]});
});

test('extracts route endpoint coordinates through nested SQL calls', () => {
  const route = wkb('LINESTRING(-73 40,-72 41,-71 42)', 'LINESTRING EMPTY', null);
  const table = new Table(new Schema([geometryField('route', route)]), {route});
  const result = select(
    `SELECT ST_X(ST_StartPoint(route)) AS start_x, ST_Y(ST_EndPoint(route)) AS end_y
     FROM features`,
    table
  );
  expect([...result.getChild('start_x')!]).toEqual([-73, null, null]);
  expect([...result.getChild('end_y')!]).toEqual([42, null, null]);
});

test('label scan includes the implied closing edge of a native polygon ring', () => {
  const shape = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [8, 0],
            [8, 4],
            [0, 4]
          ]
        ]
      }
    ])
  );
  const table = new Table(new Schema([geometryField('g', shape, 'polygon')]), {g: shape});
  const result = select('SELECT ST_PointOnSurface(g) AS anchor FROM features', table);
  expect(geometryAt(result, 'anchor', 0)).toEqual({type: 'Point', coordinates: [4, 2]});
});

test('constructs XY, XYZ and XYZM points from nullable numeric coordinates', () => {
  const x = vectorFromArray([3, null], new Int32());
  const table = new Table({x});
  const result = select(
    `SELECT ST_MakePoint(x, 4.5) AS xy, ST_MakePoint(x, 4, 5) AS xyz,
            ST_MakePoint(x, 4, 5, 6) AS xyzm FROM features`,
    table
  );
  for (const [name, coordinates] of Object.entries({
    xy: [3, 4.5],
    xyz: [3, 4, 5],
    xyzm: [3, 4, 5, 6]
  })) {
    const field = result.schema.fields.find(field => field.name === name)!;
    expect(getGeoArrowFieldInfo(field)).toMatchObject({
      encoding: 'geoarrow.point',
      dimension: name
    });
    expect(geometryAt(result, name, 0)).toEqual({type: 'Point', coordinates});
    expect(result.getChild(name)!.get(1)).toBeNull();
  }
});

test('ST_Intersects includes touching features and excludes holes in either argument order', () => {
  const region = 'POLYGON((0 0,8 0,8 8,0 8,0 0),(2 2,6 2,6 6,2 6,2 2))';
  const fixtures: [string | null, string, boolean | null][] = [
    ['POINT(1 1)', region, true],
    ['POINT(5 5)', region, false],
    ['POINT(2 4)', region, true],
    ['LINESTRING(-2 3,10 3)', region, true],
    ['LINESTRING(3 3,5 5)', region, false],
    ['POLYGON((3 3,4 3,4 4,3 3))', region, false],
    ['POLYGON((8 2,9 2,9 3,8 2))', region, true],
    ['POLYGON((1 1,1.5 1,1.5 1.5,1 1))', region, true],
    ['LINESTRING(0 0,4 4)', 'LINESTRING(0 4,4 0)', true],
    ['LINESTRING(0 0,4 4)', 'LINESTRING(2 2,6 6)', true],
    ['LINESTRING(0 0,4 4)', 'LINESTRING(1 2,4 5)', false],
    ['MULTIPOINT((20 20),(1 1))', region, true],
    ['GEOMETRYCOLLECTION(POINT(5 5),LINESTRING(3 3,4 4))', region, false],
    ['POINT EMPTY', region, false],
    [null, region, null]
  ];
  const a = wkb(...fixtures.map(row => row[0])),
    b = wkb(...fixtures.map(row => row[1]));
  const table = new Table(new Schema([geometryField('a', a), geometryField('b', b)]), {a, b});
  const result = select(
    'SELECT ST_Intersects(a,b) AS forward, ST_Intersects(b,a) AS backward FROM features',
    table
  );
  for (const name of ['forward', 'backward'])
    expect([...result.getChild(name)!]).toEqual(fixtures.map(row => row[2]));
});

test('a substring of a zero-length route has one distinct point', () => {
  const route = wkb('LINESTRING(1 2,1 2)');
  const table = new Table(new Schema([geometryField('route', route)]), {route});
  const result = select('SELECT ST_LineSubstring(route,0,1) AS section FROM features', table);
  expect(geometryAt(result, 'section', 0)).toEqual(parseWKT('POINT(1 2)'));
});

test('linear referencing uses segment lengths and includes bends in clipped routes', () => {
  const line = wkb('LINESTRING(0 0,3 0,3 0,3 7)', 'LINESTRING EMPTY', null);
  const point = wkb('POINT(5 3)', 'POINT(1 1)', 'POINT EMPTY');
  const table = new Table(new Schema([geometryField('l', line), geometryField('p', point)]), {
    l: line,
    p: point
  });
  const result = select(
    `SELECT ST_LineLocatePoint(l,p) AS f, ST_LineInterpolatePoint(l,0.6) AS marker,
    ST_LineSubstring(l,0.1,0.8) AS section, ST_LineSubstring(l,0.3,0.3) AS bend FROM features`,
    table
  );
  expect([...result.getChild('f')!]).toEqual([0.6, null, null]);
  expect(geometryAt(result, 'marker', 0)).toEqual(parseWKT('POINT(3 3)'));
  expect(geometryAt(result, 'section', 0)).toEqual(parseWKT('LINESTRING(1 0,3 0,3 5)'));
  expect(geometryAt(result, 'bend', 0)).toEqual(parseWKT('POINT(3 0)'));
  expect(geometryAt(result, 'section', 1)).toBeNull();
  expect(geometryAt(result, 'marker', 1)).toEqual({type: 'Point', coordinates: [NaN, NaN]});
  expect(() => select('SELECT ST_LineSubstring(l,0.8,0.2) FROM features', table)).toThrow(
    /fractions/
  );
});

test('projecting a collection preserves empty point members', () => {
  const g = wkb('GEOMETRYCOLLECTION(POINT EMPTY,POINT(10 45))');
  const table = new Table(new Schema([geometryField('g', g, 'wkb', {crs: 'EPSG:4326'})]), {g});
  const result = geometryAt(
    select('SELECT ST_Transform(g,3857) AS projected FROM features', table),
    'projected',
    0
  );
  expect(result?.type).toBe('GeometryCollection');
  if (result?.type === 'GeometryCollection') {
    expect(result.geometries[0]).toEqual({type: 'Point', coordinates: [NaN, NaN]});
    expect(result.geometries[1]?.type).toBe('Point');
  }
});

test('CRS assignment and reprojection bind output metadata for nested spatial SQL', () => {
  const g = wkb('LINESTRING(0 0,10 45)', 'LINESTRING EMPTY', null);
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select(
    `SELECT ST_SRID(g) AS unknown, ST_SetSRID(g,4326) AS labeled,
    ST_Transform(ST_SetSRID(g,4326),3857) AS meters,
    ST_SRID(ST_Transform(ST_SetSRID(g,4326),3857)) AS code FROM features`,
    table
  );
  expect([...result.getChild('unknown')!]).toEqual([0, 0, null]);
  expect([...result.getChild('code')!]).toEqual([3857, 3857, null]);
  expect(geometryAt(result, 'labeled', 0)).toEqual(parseWKT('LINESTRING(0 0,10 45)'));
  const projected = geometryAt(result, 'meters', 0);
  expect(projected?.type).toBe('LineString');
  if (projected?.type === 'LineString') {
    expect(projected.coordinates[1]![0]).toBeCloseTo(1113194.90793, 4);
    expect(projected.coordinates[1]![1]).toBeCloseTo(5621521.48619, 4);
  }
  expect(geometryAt(result, 'meters', 1)).toEqual(parseWKT('LINESTRING EMPTY'));
  expect(() => select('SELECT ST_Transform(g,3857) FROM features', table)).toThrow(
    /source and target/
  );
  expect(() => select('SELECT ST_SetSRID(g,ST_SRID(g)) FROM features', table)).toThrow(/constant/);
});

test('CRS metadata functions preserve spherical edges', () => {
  const g = wkb('LINESTRING(0 0,10 45)');
  const table = new Table(
    new Schema([geometryField('g', g, 'wkb', {crs: 'EPSG:4326', edges: 'spherical'})]),
    {g}
  );
  const result = select('SELECT ST_SRID(g) AS code, ST_SetSRID(g,0) AS shape FROM features', table);
  expect([...result.getChild('code')!]).toEqual([4326]);
  expect(JSON.parse(result.schema.fields[1]!.metadata.get('ARROW:extension:metadata')!)).toEqual({
    edges: 'spherical'
  });
  expect(geometryAt(result, 'shape', 0)).toEqual(parseWKT('LINESTRING(0 0,10 45)'));
  expect(() => select('SELECT ST_Transform(g,3857) FROM features', table)).toThrow(/planar/);
});

test('reads PROJJSON EPSG identifiers and preserves extension metadata across inverse transforms', () => {
  const g = wkb('POINT(1113194.9079327357 5621521.486192066)');
  const crs = {type: 'ProjectedCRS', id: {authority: 'EPSG', code: 3857}};
  const table = new Table(
    new Schema([geometryField('g', g, 'wkb', {crs, crs_type: 'projjson', edges: 'planar'})]),
    {g}
  );
  const result = select(
    `SELECT ST_SRID(g) AS srid, ST_Transform(g,4326) AS lonlat,
    ST_SRID(ST_SetSRID(g,0)) AS cleared FROM features`,
    table
  );
  expect(result.getChild('srid')!.get(0)).toBe(3857);
  expect(result.getChild('cleared')!.get(0)).toBe(0);
  const point = geometryAt(result, 'lonlat', 0);
  expect(point?.type).toBe('Point');
  if (point?.type === 'Point') {
    expect(point.coordinates[0]).toBeCloseTo(10, 10);
    expect(point.coordinates[1]).toBeCloseTo(45, 10);
  }
  expect(JSON.parse(result.schema.fields[1]!.metadata.get('ARROW:extension:metadata')!)).toEqual({
    crs: 'EPSG:4326',
    crs_type: 'authority_code',
    edges: 'planar'
  });
});

test('geometry inspection distinguishes nested components, vertices, empty geometries and nulls', () => {
  const g = wkb(
    'GEOMETRYCOLLECTION(MULTIPOINT((1 2),(4 5)),LINESTRING(0 0,1 0,2 0))',
    'POLYGON((0 0,1 0,0 1,0 0))',
    'POINT EMPTY',
    null
  );
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select(
    `SELECT ST_NPoints(g) AS vertices, ST_NumGeometries(g) AS parts,
    ST_IsEmpty(g) AS empty, ST_GeometryType(ST_GeometryN(g,2)) AS second FROM features`,
    table
  );
  expect([...result.getChild('vertices')!]).toEqual([5, 4, 0, null]);
  expect([...result.getChild('parts')!]).toEqual([2, 1, 0, null]);
  expect([...result.getChild('empty')!]).toEqual([false, false, true, null]);
  expect([...result.getChild('second')!]).toEqual(['ST_LineString', null, null, null]);
});

test('component extraction uses the selected WKB header and excludes empty atomic geometries', () => {
  const child = writeWKB({type: 'Point', coordinates: [1, 2, 7]}, 'xym');
  const bytes = Uint8Array.from([1, 7, 0, 0, 0, 1, 0, 0, 0, ...child]);
  const g = vectorFromArray([bytes, writeWKB(parseWKT('POINT EMPTY'))], new Binary());
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select('SELECT ST_GeometryN(g,1) AS member FROM features', table);
  expect(result.getChild('member')!.get(0)).toEqual(child);
  expect(result.getChild('member')!.get(1)).toBeNull();
});

test('component extraction retains M and force-2D removes it', () => {
  const g = vectorFromArray(
    [
      writeWKB(
        {
          type: 'MultiPoint',
          coordinates: [
            [1, 2, 7],
            [3, 4, 8]
          ]
        },
        'xym'
      )
    ],
    new Binary()
  );
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select(
    'SELECT ST_GeometryN(g,2) AS part, ST_Force2D(ST_GeometryN(g,2)) AS xy FROM features',
    table
  );
  expect(parseWKB(result.getChild('part')!.get(0))).toMatchObject({
    dimension: 'xym',
    geometry: {type: 'Point', coordinates: [3, 4, 8]}
  });
  expect(parseWKB(result.getChild('xy')!.get(0))).toMatchObject({
    dimension: 'xy',
    geometry: {type: 'Point', coordinates: [3, 4]}
  });
});

test('simplification preserves an empty multipart line with explicit empty members', () => {
  const original = {type: 'MultiLineString' as const, coordinates: [[]]};
  const g = vectorFromArray([writeWKB(original)], new Binary());
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  expect(
    geometryAt(select('SELECT ST_Simplify(g,1) AS reduced FROM features', table), 'reduced', 0)
  ).toEqual(original);
});

test('route reduction preserves endpoints and simplifies each line component independently', () => {
  const g = wkb(
    'LINESTRING(0 0,0 0,1 0,2 0,2 2,2 2.1)',
    'MULTILINESTRING((0 0,1 0,2 0),(5 5,5 5))',
    null
  );
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select(
    `SELECT ST_RemoveRepeatedPoints(g) AS exact, ST_RemoveRepeatedPoints(g,0.2) AS near,
    ST_Simplify(g,0.2) AS reduced FROM features`,
    table
  );
  expect(geometryAt(result, 'exact', 0)).toEqual(parseWKT('LINESTRING(0 0,1 0,2 0,2 2,2 2.1)'));
  expect(geometryAt(result, 'near', 0)).toEqual(parseWKT('LINESTRING(0 0,1 0,2 0,2 2.1)'));
  expect(geometryAt(result, 'reduced', 0)).toEqual(parseWKT('LINESTRING(0 0,2 0,2 2.1)'));
  expect(geometryAt(result, 'reduced', 1)).toEqual(parseWKT('MULTILINESTRING((0 0,2 0))'));
  expect(geometryAt(result, 'reduced', 2)).toBeNull();
});

test('simplifying an empty route preserves its geometry type', () => {
  const g = wkb('LINESTRING EMPTY', 'MULTILINESTRING EMPTY');
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select('SELECT ST_Simplify(g,1) AS reduced FROM features', table);
  expect(geometryAt(result, 'reduced', 0)).toEqual(parseWKT('LINESTRING EMPTY'));
  expect(geometryAt(result, 'reduced', 1)).toEqual(parseWKT('MULTILINESTRING EMPTY'));
});

test('spatial constructors preserve order, point duplicates and collection nesting', () => {
  const a = wkb('POINT(1 2)', 'LINESTRING(0 0,1 2)', 'MULTIPOINT((0 0),(1 2))', null);
  const b = wkb('POINT(1 2)', 'LINESTRING(1 2,1 2,3 4)', 'POINT(3 4)', 'POINT EMPTY');
  const table = new Table(new Schema([geometryField('a', a), geometryField('b', b)]), {a, b});
  const result = select(
    'SELECT ST_MakeLine(a,b) AS route, ST_Collect(a,b) AS parts FROM features',
    table
  );
  expect(geometryAt(result, 'route', 0)).toEqual(parseWKT('LINESTRING(1 2,1 2)'));
  expect(geometryAt(result, 'route', 1)).toEqual(parseWKT('LINESTRING(0 0,1 2,1 2,3 4)'));
  expect(geometryAt(result, 'route', 2)).toEqual(parseWKT('LINESTRING(0 0,1 2,3 4)'));
  expect(geometryAt(result, 'parts', 0)).toEqual(parseWKT('MULTIPOINT((1 2),(1 2))'));
  expect(geometryAt(result, 'parts', 1)?.type).toBe('MultiLineString');
  expect(geometryAt(result, 'parts', 2)).toEqual(
    parseWKT('GEOMETRYCOLLECTION(MULTIPOINT((0 0),(1 2)),POINT(3 4))')
  );
  expect(geometryAt(result, 'route', 3)).toBeNull();
  expect(geometryAt(result, 'parts', 3)).toEqual({type: 'Point', coordinates: [NaN, NaN]});
  const missing = select(
    'SELECT ST_Collect(NULL,a) AS single, ST_Collect(NULL,NULL) AS neither FROM features',
    table
  );
  expect(geometryAt(missing, 'single', 0)).toEqual(parseWKT('POINT(1 2)'));
  expect(geometryAt(missing, 'neither', 0)).toBeNull();
});

test('XYZ tile polygons use top-left indexing, root CRS and clamped fractional margins', () => {
  const g = wkb('LINESTRING(0 0,80 40)', null);
  const table = new Table(new Schema([geometryField('g', g, 'wkb', {crs: 'EPSG:4326'})]), {g});
  const result = select(
    `SELECT ST_TileEnvelope(2,1,1) AS mercator,
    ST_TileEnvelope(2,0,0,g,0.25) AS custom, ST_TileEnvelope(2,0,0,g,-0.25) AS inset FROM features`,
    table
  );
  expect(geometryAt(result, 'mercator', 0)).toEqual(
    parseWKT(
      'POLYGON((-10018754.171394622 0,-10018754.171394622 10018754.171394622,0 10018754.171394622,0 0,-10018754.171394622 0))'
    )
  );
  expect(geometryAt(result, 'custom', 0)).toEqual(
    parseWKT('POLYGON((0 27.5,0 40,25 40,25 27.5,0 27.5))')
  );
  expect(geometryAt(result, 'inset', 0)).toEqual(
    parseWKT('POLYGON((5 32.5,5 37.5,15 37.5,15 32.5,5 32.5))')
  );
  expect(geometryAt(result, 'custom', 1)).toBeNull();
  expect(JSON.parse(result.schema.fields[0]!.metadata.get('ARROW:extension:metadata')!).crs).toBe(
    'EPSG:3857'
  );
  expect(JSON.parse(result.schema.fields[1]!.metadata.get('ARROW:extension:metadata')!).crs).toBe(
    'EPSG:4326'
  );
  expect(() => select('SELECT ST_TileEnvelope(1,2,0) FROM features', table)).toThrow(/index/);
});

test('ST_Extent combines groups across batches and ignores empty and null rows', () => {
  const g = wkb('LINESTRING(-4 8,3 5)', null, 'POINT(7 -2)', 'POLYGON EMPTY');
  const k = vectorFromArray([1, 2, 1, 2], new Int32());
  const source = new Table(new Schema([geometryField('g', g), new Field('k', k.type, false)]), {
    g,
    k
  });
  const table = source.slice(0, 2).concat(source.slice(2));
  const result = select(
    'SELECT k, ST_Extent(g) AS bounds FROM features GROUP BY k ORDER BY k',
    table
  );
  expect(Array.from(result.getChild('bounds')!.get(0))).toEqual([-4, -2, 7, 8]);
  expect(result.getChild('bounds')!.get(1)).toBeNull();
  const empty = select('SELECT ST_Extent(g) AS bounds FROM features WHERE k = 3', table);
  expect(empty.getChild('bounds')!.get(0)).toBeNull();
});

test('ST_Extent accepts LargeBinary geometry columns', () => {
  const g = vectorFromArray([writeWKB(parseWKT('POINT(2 3)')), null], new LargeBinary());
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select('SELECT ST_Extent(g) AS bounds FROM features', table);
  expect(Array.from(result.getChild('bounds')!.get(0))).toEqual([2, 3, 2, 3]);
});

test('ST_Extent aggregates native polygon columns with nested Arrow storage', () => {
  const shapes = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([
      parseWKT('POLYGON((2 1,6 1,6 4,2 1))'),
      null,
      parseWKT('POLYGON((-4 0,0 0,0 8,-4 0))')
    ])
  );
  const table = new Table(new Schema([geometryField('g', shapes, 'polygon')]), {g: shapes});
  const result = select(
    'SELECT ST_Extent(g) AS bounds FROM features',
    table.slice(0, 1).concat(table.slice(1))
  );
  expect(Array.from(result.getChild('bounds')!.get(0))).toEqual([-4, 0, 6, 8]);
});

test('extracts Z and M independently for dimensional points', () => {
  const p = vectorFromArray(
    ['xy', 'xyz', 'xym', 'xyzm'].map(dimension =>
      writeWKB(
        {type: 'Point', coordinates: [2, 3, 4, 5]},
        dimension as 'xy' | 'xyz' | 'xym' | 'xyzm'
      )
    ),
    new Binary()
  );
  const table = new Table(new Schema([geometryField('p', p)]), {p});
  const result = select('SELECT ST_X(p) AS x, ST_Z(p) AS z, ST_M(p) AS m FROM features', table);
  expect([...result.getChild('x')!]).toEqual([2, 2, 2, 2]);
  expect([...result.getChild('z')!]).toEqual([null, 4, null, 4]);
  expect([...result.getChild('m')!]).toEqual([null, null, 4, 5]);
});

test('native XYZ and constructed XYZM points expose their ordinates', () => {
  const native = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([{type: 'Point', coordinates: [3, 4, 8]}, null], {
      dimension: 'xyz'
    })
  );
  const table = new Table(new Schema([geometryField('p', native, 'point')]), {p: native});
  const result = select(
    'SELECT ST_Z(p) AS z, ST_M(p) AS m, ST_M(ST_MakePoint(1, 2, 3, ST_Z(p))) AS nested FROM features',
    table
  );
  expect([...result.getChild('z')!]).toEqual([8, null]);
  expect([...result.getChild('m')!]).toEqual([null, null]);
  expect([...result.getChild('nested')!]).toEqual([8, null]);
});

test('repeated-point removal preserves empty multipart line members', () => {
  const g = vectorFromArray(
    [
      writeWKB({
        type: 'MultiLineString',
        coordinates: [
          [],
          [
            [0, 0],
            [0, 0],
            [1, 1]
          ],
          []
        ]
      })
    ],
    new Binary()
  );
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select('SELECT ST_RemoveRepeatedPoints(g) AS reduced FROM features', table);
  expect(geometryAt(result, 'reduced', 0)).toEqual({
    type: 'MultiLineString',
    coordinates: [
      [],
      [
        [0, 0],
        [1, 1]
      ],
      []
    ]
  });
});

test('native point access honors sliced validity, active rows, and XYM in both coordinate layouts', () => {
  for (const coordinateLayout of ['interleaved', 'separated'] as const) {
    const g = makeArrowVectorFromGeoArrowColumn(
      makeGeoArrowColumnFromGeometryRows(
        [
          {type: 'Point', coordinates: [100, 100, 100]},
          null,
          {type: 'Point', coordinates: [1, 2, 3]},
          {type: 'Point', coordinates: []},
          {type: 'Point', coordinates: [4, 5, 6]}
        ],
        {dimension: 'xym', coordinateLayout}
      )
    );
    const id = vectorFromArray([0, 1, 2, 3, 4], new Int32());
    const table = new Table(
      new Schema([geometryField('g', g, 'point'), new Field('id', id.type)]),
      {
        g,
        id
      }
    );
    const sliced = table.slice(1, 3).concat(table.slice(3));
    const result = select(
      'SELECT CASE WHEN id < 4 THEN ST_M(g) ELSE 0 END AS m, ST_Z(g) AS z, ST_X(g) AS x FROM features',
      sliced
    );
    expect([...result.getChild('m')!]).toEqual([null, 3, null, 0]);
    expect([...result.getChild('z')!]).toEqual([null, null, null, null]);
    expect([...result.getChild('x')!]).toEqual([null, 1, null, 4]);
  }
});

test('native envelopes retain empty types and extent honors sliced and filtered rows', () => {
  const shapes = [
    'LINESTRING(100 100,110 110)',
    null,
    'LINESTRING EMPTY',
    'LINESTRING(2 8,2 3)',
    'LINESTRING(-4 5,4 1)'
  ];
  const g = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows(shapes.map(shape => (shape ? parseWKT(shape) : null)))
  );
  const id = vectorFromArray([0, 1, 2, 3, 4], new Int32());
  const table = new Table(
    new Schema([geometryField('g', g, 'linestring'), new Field('id', id.type)]),
    {
      g,
      id
    }
  );
  const sliced = table.slice(1, 3).concat(table.slice(3));
  const native = select('SELECT ST_Envelope(g) AS box FROM features', sliced);
  const bytes = wkb(...shapes.slice(1));
  const serialized = select(
    'SELECT ST_Envelope(g) AS box FROM features',
    new Table(new Schema([geometryField('g', bytes)]), {g: bytes})
  );
  expect([...native.getChild('box')!]).toEqual([...serialized.getChild('box')!]);
  const extent = select('SELECT ST_Extent(g) AS box FROM features WHERE id < 4', sliced);
  expect(Array.from(extent.getChild('box')!.get(0))).toEqual([2, 3, 2, 8]);
});

test('snaps to the nearest route segment with argument-order and radius semantics', () => {
  const l = wkb(
    'LINESTRING(0 0,3 0,3 0,3 7)',
    'LINESTRING(0 0,10 10)',
    'LINESTRING(1 2,1 2)',
    'LINESTRING EMPTY',
    'LINESTRING(0 0,3 0,3 7)',
    null
  );
  const p = wkb(
    'POINT(5 3)',
    'POINT(3 3)',
    'POINT(4 6)',
    'POINT(1 1)',
    'POINT EMPTY',
    'POINT(1 1)'
  );
  const table = new Table(new Schema([geometryField('l', l), geometryField('p', p)]), {l, p});
  const result = select(
    `SELECT ST_ClosestPoint(l,p) AS snap, ST_ClosestPoint(p,l) AS observation,
    ST_ShortestLine(l,p) AS gap, ST_ShortestLine(p,l) AS reverse_gap,
    ST_DWithin(l,p,2) AS nearby, ST_DWithin(p,l,0) AS on_route,
    ST_LineLocatePoint(l,p) AS fraction FROM features`,
    table
  );
  expect(getGeoArrowFieldInfo(result.schema.fields[0]!)?.encoding).toBe('geoarrow.point');
  expect(getGeoArrowFieldInfo(result.schema.fields[2]!)?.encoding).toBe('geoarrow.linestring');
  expect(geometryAt(result, 'snap', 0)).toEqual(parseWKT('POINT(3 3)'));
  expect(geometryAt(result, 'observation', 0)).toEqual(parseWKT('POINT(5 3)'));
  expect(geometryAt(result, 'gap', 0)).toEqual(parseWKT('LINESTRING(3 3,5 3)'));
  expect(geometryAt(result, 'reverse_gap', 0)).toEqual(parseWKT('LINESTRING(5 3,3 3)'));
  expect(geometryAt(result, 'gap', 1)).toEqual(parseWKT('LINESTRING(3 3,3 3)'));
  expect(geometryAt(result, 'snap', 2)).toEqual(parseWKT('POINT(1 2)'));
  for (const row of [3, 4, 5]) {
    expect(geometryAt(result, 'snap', row)).toBeNull();
    expect(geometryAt(result, 'gap', row)).toBeNull();
  }
  expect([...result.getChild('nearby')!]).toEqual([true, true, false, false, false, null]);
  expect([...result.getChild('on_route')!]).toEqual([false, true, false, false, false, null]);
  expect(result.getChild('fraction')!.get(0)).toBe(0.6);
  expect(result.getChild('fraction')!.get(2)).toBe(0);
  expect(() => select('SELECT ST_ShortestLine(l,l) FROM features', table)).toThrow(/Point/);
});

test('snaps native GeoArrow points to endpoints and resolves ties in route order', () => {
  const l = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([
      parseWKT('LINESTRING(0 0,4 0,4 4)'),
      parseWKT('LINESTRING(0 0,4 0)')
    ])
  );
  const p = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([parseWKT('POINT(2 2)'), parseWKT('POINT(6 1)')])
  );
  const metadata = {crs: 'EPSG:3857', crs_type: 'authority_code'};
  const table = new Table(
    new Schema([
      geometryField('l', l, 'linestring', metadata),
      geometryField('p', p, 'point', metadata)
    ]),
    {l, p}
  );
  const batched = new Table(table.schema, [
    ...table.slice(0, 1).batches,
    ...table.slice(1).batches
  ]);
  const result = select(
    `SELECT ST_ClosestPoint(l,p) AS snap,
            ST_LineLocatePoint(l, ST_ClosestPoint(l,p)) AS fraction,
            ST_Length(ST_ShortestLine(l, ST_MakePoint(ST_X(p), ST_Y(p)))) AS gap
     FROM features`,
    batched
  );
  expect(result.batches.map(batch => batch.numRows)).toEqual([1, 1]);
  expect([...result.getChild('fraction')!]).toEqual([0.25, 1]);
  expect([...result.getChild('gap')!]).toEqual([2, Math.sqrt(5)]);
  expect(geometryAt(result, 'snap', 0)).toEqual(parseWKT('POINT(2 0)'));
  expect(geometryAt(result, 'snap', 1)).toEqual(parseWKT('POINT(4 0)'));
  expect(result.schema.fields[0]!.metadata.get('ARROW:extension:metadata')).toBe(
    JSON.stringify(metadata)
  );
});

test('clips a route into separate fragments and keeps row positions', () => {
  const g = wkb('LINESTRING(-1 1,3 1,3 2,-1 2)', 'LINESTRING(-1 -1,0 0)', null);
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select(
    'SELECT ST_ClipByBox2D(g,ST_MakeEnvelope(0,0,2,3)) AS clipped FROM features',
    table
  );
  expect(geometryAt(result, 'clipped', 0)).toEqual(
    parseWKT('MULTILINESTRING((0 1,2 1),(2 2,0 2))')
  );
  expect(geometryAt(result, 'clipped', 1)).toEqual(parseWKT('GEOMETRYCOLLECTION EMPTY'));
  expect(geometryAt(result, 'clipped', 2)).toBeNull();
});

test('clips a native polygon without filling its hole and retains the CRS', () => {
  const polygon = parseWKT('POLYGON((-1 -1,5 -1,5 5,-1 5,-1 -1),(1 1,1 2,2 2,2 1,1 1))');
  const g = makeArrowVectorFromGeoArrowColumn(makeGeoArrowColumnFromGeometryRows([polygon]));
  const metadata = {crs_type: 'authority_code', crs: 'EPSG:3857'};
  const table = new Table(new Schema([geometryField('g', g, 'polygon', metadata)]), {g});
  const result = select(
    `SELECT ST_ClipByBox2D(g,ST_TileEnvelope(0,0,0,ST_SetSRID(ST_MakeEnvelope(0,0,3,3),3857))) AS clipped,
    ST_Area(ST_ClipByBox2D(g,ST_MakeEnvelope(0,0,3,3))) AS area FROM features`,
    table
  );
  const clipped = geometryAt(result, 'clipped', 0);
  expect(clipped?.type).toBe('Polygon');
  if (clipped?.type === 'Polygon') expect(clipped.coordinates).toHaveLength(2);
  expect(result.getChild('area')!.get(0)).toBe(8);
  expect(JSON.parse(result.schema.fields[0]!.metadata.get('ARROW:extension:metadata')!)).toEqual(
    metadata
  );
});

test('clipping an unlabeled geometry cannot assign the bounds CRS', () => {
  const g = wkb('POINT(1 1)');
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select(
    `SELECT ST_ClipByBox2D(g,ST_SetSRID(ST_MakeEnvelope(0,0,2,2),3857)) AS clipped,
    ST_SRID(ST_ClipByBox2D(g,ST_SetSRID(ST_MakeEnvelope(0,0,2,2),3857))) AS srid
    FROM features`,
    table
  );
  expect(geometryAt(result, 'clipped', 0)).toEqual(parseWKT('POINT(1 1)'));
  expect(result.getChild('srid')!.get(0)).toBe(0);
});

test('clipping geometry with bounds metadata but no CRS cannot inherit the envelope CRS', () => {
  const g = wkb('POINT(1 1)');
  const table = new Table(
    new Schema([geometryField('g', g, 'wkb', {geometry_types: ['Point'], bbox: [1, 1, 1, 1]})]),
    {g}
  );
  const result = select(
    `SELECT ST_ClipByBox2D(g,ST_SetSRID(ST_MakeEnvelope(0,0,2,2),3857)) AS clipped,
    ST_SRID(ST_ClipByBox2D(g,ST_SetSRID(ST_MakeEnvelope(0,0,2,2),3857))) AS srid
    FROM features`,
    table
  );
  expect(geometryAt(result, 'clipped', 0)).toEqual(parseWKT('POINT(1 1)'));
  expect(result.getChild('srid')!.get(0)).toBe(0);
});

test('box clipping excludes boundary-only points and returns disjoint polygon pieces', () => {
  const g = wkb(
    'MULTIPOINT((0 0),(-0.5 1),(3 3))',
    'POLYGON((-2 -1,2 -1,2 4,-2 4,-2 3,1 3,1 0,-2 0,-2 -1))',
    'POLYGON EMPTY'
  );
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select(
    'SELECT ST_ClipByBox2D(g,ST_MakeEnvelope(-1,-1,0,4)) AS clipped FROM features',
    table
  );
  expect(geometryAt(result, 'clipped', 0)).toEqual(parseWKT('POINT(-0.5 1)'));
  expect(geometryAt(result, 'clipped', 1)?.type).toBe('MultiPolygon');
  expect(geometryAt(result, 'clipped', 2)).toEqual(parseWKT('POLYGON EMPTY'));
});

test('subdivides large polygons through a lateral join with a shared vertex cap', () => {
  const ring = Array.from({length: 320}, (_, i) => {
    const angle = (i * Math.PI) / 160;
    return [10 * Math.cos(angle), 10 * Math.sin(angle)];
  });
  ring.push(ring[0]!);
  const polygon = {type: 'Polygon', coordinates: [ring]} as const;
  const g = vectorFromArray(
    [writeWKB(polygon), null, writeWKB(parseWKT('POLYGON EMPTY'))],
    new Binary()
  );
  const id = vectorFromArray([10, 11, 12], new Int32());
  const metadata = {crs: 'EPSG:3857', crs_type: 'authority_code'};
  const table = new Table(
    new Schema([geometryField('g', g, 'wkb', metadata), new Field('id', id.type)]),
    {g, id}
  );
  const result = queryArrowSQL(
    `SELECT id, p.geom AS geom, ST_NPoints(p.geom) AS vertices, ST_Area(p.geom) AS area
    FROM features AS f LEFT JOIN LATERAL ST_Subdivide(f.g) AS p(geom) ON TRUE`,
    new Map([['features', table]]),
    {functions: [POSTGIS_SPATIAL_FUNCTIONS, ST_SUBDIVIDE]}
  );
  const ids = [...result.getChild('id')!];
  const pieces = ids.filter(id => id === 10).length;
  expect(pieces).toBeGreaterThan(1);
  expect(ids.slice(pieces)).toEqual([11, 12]);
  expect([...result.getChild('vertices')!].slice(0, pieces).every(n => n <= 256)).toBe(true);
  expect([...result.getChild('geom')!].slice(pieces)).toEqual([null, null]);
  expect(result.schema.fields[1]!.metadata.get('ARROW:extension:metadata')).toBe(
    JSON.stringify(metadata)
  );
  const totalArea = [...result.getChild('area')!].slice(0, pieces).reduce((a, b) => a + b, 0);
  const sourceArea = select('SELECT ST_Area(g) AS area FROM features', table)
    .getChild('area')!
    .get(0);
  expect(totalArea).toBeCloseTo(sourceArea, 9);
});

test('adds measures by XY distance across parts, preserving Z and replacing M', () => {
  const source = parseWKT(
    'MULTILINESTRING ZM ((1 0 4 99,2 0 5 98,4 0 6 97),(11 0 7 96,14 0 8 95))'
  );
  const route = vectorFromArray([writeWKB(source, 'xyzm'), null], new Binary());
  const metadata = {crs: 'EPSG:3857', crs_type: 'authority_code'};
  const table = new Table(new Schema([geometryField('route', route, 'wkb', metadata)]), {route});
  const result = select('SELECT ST_AddMeasure(route,10,70) AS measured FROM features', table);
  const measured = parseWKB(result.getChild('measured')!.get(0));
  expect(measured.dimension).toBe('xyzm');
  expect(measured.geometry).toEqual(
    parseWKT('MULTILINESTRING ZM ((1 0 4 10,2 0 5 20,4 0 6 40),(11 0 7 40,14 0 8 70))')
  );
  expect(result.getChild('measured')!.get(1)).toBeNull();
  expect(result.schema.fields[0]!.metadata.get('ARROW:extension:metadata')).toBe(
    JSON.stringify(metadata)
  );
});

test('locates measures in native XYM route segments with peaks and plateaus', () => {
  const route = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows(
      [parseWKT('LINESTRING M (0 0 0,4 0 4,8 0 0,10 0 0)'), null],
      {dimension: 'xym', coordinateLayout: 'separated'}
    )
  );
  const table = new Table(new Schema([geometryField('route', route, 'linestring')]), {route});
  const result = select(
    `SELECT ST_LocateAlong(route,2) AS markers, ST_LocateAlong(route,0) AS plateau,
       ST_LocateAlong(route,4) AS shared, ST_LocateBetween(route,3,1) AS clips,
       ST_LocateBetween(route,4,4) AS peak, ST_LocateAlong(route,7) AS missing FROM features`,
    table
  );
  expect(geometryAt(result, 'markers', 0)).toEqual(parseWKT('MULTIPOINT M ((2 0 2),(6 0 2))'));
  expect(geometryAt(result, 'plateau', 0)).toEqual(
    parseWKT('MULTIPOINT M ((0 0 0),(8 0 0),(9 0 0))')
  );
  expect(geometryAt(result, 'shared', 0)).toEqual(parseWKT('MULTIPOINT M ((4 0 4))'));
  expect(geometryAt(result, 'clips', 0)).toEqual(
    parseWKT('MULTILINESTRING M ((1 0 1,3 0 3),(5 0 3,7 0 1))')
  );
  expect(geometryAt(result, 'peak', 0)).toEqual(parseWKT('GEOMETRYCOLLECTION M (POINT M(4 0 4))'));
  expect(geometryAt(result, 'missing', 0)).toEqual(parseWKT('MULTIPOINT M EMPTY'));
  expect(geometryAt(result, 'clips', 1)).toBeNull();
});

test('preserves measured Z in clipped segments and rejects a missing M ordinate', () => {
  const route = wkb('LINESTRING(0 0,3 0,3 4)', 'LINESTRING EMPTY');
  const measured = vectorFromArray(
    [
      writeWKB(parseWKT('LINESTRING ZM (0 0 2 0,3 0 8 3,3 4 12 7)'), 'xyzm'),
      writeWKB(parseWKT('LINESTRING ZM EMPTY'), 'xyzm')
    ],
    new Binary()
  );
  const table = new Table(
    new Schema([geometryField('route', route), geometryField('measured', measured)]),
    {route, measured}
  );
  const result = select(
    `SELECT ST_LocateBetween(measured,1,5) AS clip,
      ST_LocateAlong(ST_AddMeasure(route,0,7),5) AS marker FROM features`,
    table
  );
  expect(geometryAt(result, 'clip', 0)).toEqual(
    parseWKT('MULTILINESTRING ZM ((1 0 4 1,3 0 8 3,3 2 10 5))')
  );
  expect(geometryAt(result, 'clip', 1)).toEqual(parseWKT('MULTILINESTRING ZM EMPTY'));
  expect(geometryAt(result, 'marker', 0)?.type).toBe('MultiPoint');
  expect(() => select('SELECT ST_LocateAlong(route,2) FROM features', table)).toThrow(/measure/);
});

test('locate along retains separate visits to the same coordinates and measure', () => {
  const route = vectorFromArray(
    [writeWKB(parseWKT('LINESTRING M (0 0 0,2 0 2,0 0 0)'), 'xym')],
    new Binary()
  );
  const table = new Table(new Schema([geometryField('route', route)]), {route});
  const result = select('SELECT ST_LocateAlong(route,1) AS visits FROM features', table);
  expect(geometryAt(result, 'visits', 0)).toEqual(parseWKT('MULTIPOINT M ((1 0 1),(1 0 1))'));
});

test('computes convex hulls for collections, degenerate point clouds, and null rows', () => {
  const g = wkb(
    'GEOMETRYCOLLECTION(LINESTRING(0 0,4 0,4 4),MULTIPOINT((0 4),(2 2)))',
    'MULTIPOINT((2 2),(1 1),(3 3),(2 2))',
    'MULTIPOINT((2 1),(2 1))',
    'MULTIPOINT EMPTY',
    null
  );
  const table = new Table(new Schema([geometryField('g', g)]), {g});
  const result = select('SELECT ST_ConvexHull(g) AS footprint FROM features', table);
  expect(geometryAt(result, 'footprint', 0)).toEqual(parseWKT('POLYGON((0 0,4 0,4 4,0 4,0 0))'));
  expect(geometryAt(result, 'footprint', 1)).toEqual(parseWKT('LINESTRING(1 1,3 3)'));
  expect(geometryAt(result, 'footprint', 2)).toEqual(parseWKT('POINT(2 1)'));
  expect(geometryAt(result, 'footprint', 3)).toEqual(parseWKT('GEOMETRYCOLLECTION EMPTY'));
  expect(geometryAt(result, 'footprint', 4)).toBeNull();
});

test('erodes a native point-cloud hull without losing sites or CRS metadata', () => {
  const coordinates = [
    [0, 0],
    [6, 0],
    [6, 6],
    [0, 6],
    [2, 1],
    [4, 1],
    [1, 3],
    [5, 3],
    [1, 5],
    [5, 5],
    [2, 1]
  ];
  const g = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([{type: 'MultiPoint', coordinates}])
  );
  const metadata = {crs: 'EPSG:3857', crs_type: 'authority_code'};
  const table = new Table(new Schema([geometryField('g', g, 'multipoint', metadata)]), {g});
  const result = select(
    `SELECT ST_ConcaveHull(g,0) AS hull,
      ST_Area(ST_ConcaveHull(g,0)) AS tight_area,
      ST_Area(ST_ConcaveHull(g,1)) AS convex_area,
      ST_ConvexHull(g) AS convex, ST_ConcaveHull(g,1) AS maximum FROM features`,
    table
  );
  expect(geometryAt(result, 'maximum', 0)).toEqual(geometryAt(result, 'convex', 0));
  expect(result.getChild('convex_area')!.get(0)).toBe(36);
  expect(result.getChild('tight_area')!.get(0)).toBeLessThan(36);
  const hull = geometryAt(result, 'hull', 0)!;
  expect(hull.type).toBe('Polygon');
  if (hull.type === 'Polygon') {
    expect(hull.coordinates).toHaveLength(1);
    const ring = hull.coordinates[0]!;
    const signedArea = ring.slice(1).reduce((sum, point, i) => {
      const previous = ring[i]!;
      return sum + previous[0]! * point[1]! - point[0]! * previous[1]!;
    }, 0);
    expect(signedArea).toBeGreaterThan(0);
  }
  expect(result.schema.fields[0]!.metadata.get('ARROW:extension:metadata')).toBe(
    JSON.stringify(metadata)
  );
  const footprint = vectorFromArray(
    coordinates.map(() => writeWKB(hull, 'xy')),
    new Binary()
  );
  const site = vectorFromArray(
    coordinates.map(coordinates => writeWKB({type: 'Point', coordinates}, 'xy')),
    new Binary()
  );
  const containment = new Table(
    new Schema([geometryField('footprint', footprint), geometryField('site', site)]),
    {footprint, site}
  );
  const covers = select('SELECT ST_Covers(footprint,site) AS covered FROM features', containment);
  expect([...covers.getChild('covered')!]).toEqual(coordinates.map(() => true));
  expect(() => select('SELECT ST_ConcaveHull(g,1.1) FROM features', table)).toThrow(/ratio/);
});

test('point buffers emit native polygons and feed other spatial functions directly', () => {
  const p = wkb('POINT(0 0)', 'POINT(2 2)', 'POINT EMPTY', null);
  const radius = vectorFromArray([2, -1, 1, 2], new Int32());
  const metadata = {crs: 'EPSG:3857', crs_type: 'authority_code'};
  const table = new Table(
    new Schema([geometryField('p', p, 'wkb', metadata), new Field('radius', radius.type)]),
    {p, radius}
  );
  const result = select(
    `SELECT ST_Buffer(p,radius) AS buffer, ST_NPoints(ST_Buffer(p,radius)) AS vertices,
       ST_Area(ST_Buffer(p,radius)) AS area FROM features`,
    table
  );
  const field = result.schema.fields[0]!;
  expect(field.metadata.get('ARROW:extension:name')).toBe('geoarrow.polygon');
  expect(field.metadata.get('ARROW:extension:metadata')).toBe(JSON.stringify(metadata));
  const column = makeGeoArrowColumnFromArrowVector(result.getChild('buffer')!, {field});
  expect(column.coordinateLayout).toBe('interleaved');
  const rows = materializeGeoArrowRows(column);
  expect(rows[0]?.type).toBe('Polygon');
  expect(rows.slice(1)).toEqual([
    {type: 'Polygon', coordinates: []},
    {type: 'Polygon', coordinates: []},
    null
  ]);
  expect([...result.getChild('vertices')!]).toEqual([33, 0, 0, null]);
  expect(result.getChild('area')!.get(0)).toBeCloseTo(64 * Math.sin(Math.PI / 16));
});

test('areal overlays emit native multipolygons and preserve split pieces, holes, and nulls', () => {
  const a = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([
      parseWKT('POLYGON((0 0,6 0,6 4,0 4,0 0))'),
      parseWKT('POLYGON((0 0,6 0,6 4,0 4,0 0))'),
      parseWKT('POLYGON((0 0,6 0,6 4,0 4,0 0))'),
      null
    ])
  );
  const b = wkb(
    'POLYGON((2 -1,4 -1,4 5,2 5,2 -1))',
    'POLYGON((1 1,3 1,3 3,1 3,1 1))',
    'POLYGON((6 0,8 0,8 4,6 4,6 0))',
    'POLYGON EMPTY'
  );
  const table = new Table(new Schema([geometryField('a', a, 'polygon'), geometryField('b', b)]), {
    a,
    b
  });
  const result = select(
    `SELECT ST_Difference(a,b) AS remaining, ST_Intersection(a,b) AS shared,
      ST_Area(ST_Difference(a,b)) AS area, ST_Area(ST_Intersection(a,b)) AS overlap
      FROM features`,
    table
  );
  const fields = result.schema.fields;
  expect(fields[0]!.metadata.get('ARROW:extension:name')).toBe('geoarrow.multipolygon');
  expect(fields[1]!.metadata.get('ARROW:extension:name')).toBe('geoarrow.multipolygon');
  const remaining = materializeGeoArrowRows(
    makeGeoArrowColumnFromArrowVector(result.getChild('remaining')!, {field: fields[0]!})
  );
  expect(remaining[0]?.type === 'MultiPolygon' && remaining[0].coordinates).toHaveLength(2);
  expect(remaining[1]?.type === 'MultiPolygon' && remaining[1].coordinates[0]).toHaveLength(2);
  expect([...result.getChild('area')!]).toEqual([16, 20, 24, null]);
  expect([...result.getChild('overlap')!]).toEqual([8, 4, 0, null]);
  const empty = select('SELECT ST_Intersection(a,b) AS g FROM features WHERE 1 = 0', table);
  expect(empty.numRows).toBe(0);
  expect(empty.schema.fields[0]!.metadata.get('ARROW:extension:name')).toBe(
    'geoarrow.multipolygon'
  );
});

test('accepts native XY dense-union inputs and keeps inactive or null rows out of kernels', () => {
  const g = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows(
      [parseWKT('POINT(1 1)'), null, parseWKT('POLYGON((0 0,2 0,2 2,0 2,0 0))')],
      {encoding: 'geoarrow.geometry', dimension: 'xy'}
    )
  );
  const id = vectorFromArray([0, 1, 2], new Int32());
  const table = new Table(
    new Schema([geometryField('g', g, 'geometry'), new Field('id', id.type)]),
    {g, id}
  );
  const buffers = select('SELECT ST_Buffer(g,1) AS footprint FROM features WHERE id < 2', table);
  expect(buffers.getChild('footprint')!.isValid(0)).toBe(true);
  expect(buffers.getChild('footprint')!.isValid(1)).toBe(false);
  const sliced = select('SELECT ST_Buffer(g,1) AS footprint FROM features', table.slice(1, 2));
  expect(sliced.numRows).toBe(1);
  expect(sliced.getChild('footprint')!.isValid(0)).toBe(false);
  const overlaps = select(
    'SELECT ST_Area(ST_Intersection(g,ST_MakeEnvelope(0,0,1,1))) AS area FROM features WHERE id = 2',
    table
  );
  expect(overlaps.getChild('area')!.get(0)).toBe(1);
  expect(() => select('SELECT ST_Buffer(g,1) FROM features', table)).toThrow(
    /does not support Polygon/
  );
});

test('streams a chain of native geometry kernels without reading ahead', async () => {
  const p = wkb('POINT(0 0)', null);
  const table = new Table(new Schema([geometryField('p', p)]), {p});
  let reads = 0;
  /** Supplies two batches on demand with the same input schema. */
  function* source() {
    for (let row = 0; row < 2; row++) {
      reads++;
      yield table.slice(row, row + 1).batches[0]!;
    }
  }
  const plan = parseSQLQuery(
    'SELECT ST_Intersection(ST_Buffer(p,2),ST_MakeEnvelope(-1,-1,1,1)) AS geom, ST_Area(ST_Intersection(ST_Buffer(p,2),ST_MakeEnvelope(-1,-1,1,1))) AS area FROM features'
  );
  if ('command' in plan) throw new Error('Expected a SELECT');
  const batches = queryArrowTableInBatches(source(), table.schema, {
    ...plan,
    functions: [POSTGIS_SPATIAL_FUNCTIONS, ST_BUFFER, ST_INTERSECTION]
  })[Symbol.asyncIterator]();
  const first = (await batches.next()).value!;
  expect(reads).toBe(1);
  expect(first.schema.fields[0]!.metadata.get('ARROW:extension:name')).toBe(
    'geoarrow.multipolygon'
  );
  expect(first.getChild('area')!.get(0)).toBe(4);
  const second = (await batches.next()).value!;
  expect(reads).toBe(2);
  expect(second.schema.fields[0]!.type.toString()).toBe(first.schema.fields[0]!.type.toString());
  expect(second.getChild('geom')!.isValid(0)).toBe(false);
  expect((await batches.next()).done).toBe(true);
});

test('point buffers chain through overlays at exact cardinal tangencies', () => {
  const p = wkb('POINT(2 0)', 'POINT(14 0)');
  const table = new Table(new Schema([geometryField('p', p)]), {p});
  const result = select(
    'SELECT ST_Area(ST_Intersection(ST_Buffer(p,2),ST_MakeEnvelope(0,0,12,12))) AS area FROM features',
    table
  );
  expect(result.getChild('area')!.get(0)).toBeCloseTo(32 * Math.sin(Math.PI / 16));
  expect(result.getChild('area')!.get(1)).toBe(0);
});

test('streams binary polygon unions and symmetric differences with native multipolygon output', async () => {
  const a = wkb(
    'POLYGON((0 0,4 0,4 4,0 4,0 0))',
    'POLYGON EMPTY',
    'POLYGON((0 0,4 0,4 4,0 4,0 0))',
    null
  );
  const b = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromGeometryRows([
      parseWKT('MULTIPOLYGON(((2 0,6 0,6 4,2 4,2 0)))'),
      parseWKT('MULTIPOLYGON(((2 0,6 0,6 4,2 4,2 0)))'),
      parseWKT('MULTIPOLYGON EMPTY'),
      parseWKT('MULTIPOLYGON EMPTY')
    ])
  );
  const table = new Table(
    new Schema([
      geometryField('a', a, 'wkb', {crs: 'OGC:CRS84'}),
      geometryField('b', b, 'multipolygon')
    ]),
    {a, b}
  );
  let reads = 0;
  /** Provides one row per input batch so empty and null cases bind the same schema. */
  function* source() {
    for (let row = 0; row < table.numRows; row++) {
      reads++;
      yield table.slice(row, row + 1).batches[0]!;
    }
  }
  const plan = parseSQLQuery(
    `SELECT ST_Union(a,b) AS combined, ST_SymDifference(a,b) AS changed,
      ST_Area(ST_Union(a,b)) AS total, ST_Area(ST_SymDifference(a,b)) AS change
      FROM features`
  );
  if ('command' in plan) throw new Error('Expected a SELECT');
  const output = [];
  for await (const batch of queryArrowTableInBatches(source(), table.schema, {
    ...plan,
    functions: [POSTGIS_SPATIAL_FUNCTIONS, ST_UNION, ST_SYMDIFFERENCE]
  })) {
    expect(reads).toBe(output.length + 1);
    for (const field of batch.schema.fields.slice(0, 2)) {
      expect(field.metadata.get('ARROW:extension:name')).toBe('geoarrow.multipolygon');
      expect(field.metadata.get('ARROW:extension:metadata')).toBe('{"crs":"OGC:CRS84"}');
      expect(field.type.toString()).toBe(batch.schema.fields[0]!.type.toString());
    }
    output.push(batch);
  }
  expect(output.map(batch => batch.getChild('total')!.get(0))).toEqual([24, 16, 16, null]);
  expect(output.map(batch => batch.getChild('change')!.get(0))).toEqual([16, 16, 16, null]);
  expect(output[0]!.getChild('changed')!.get(0).length).toBe(2);

  const identical = select('SELECT ST_SymDifference(b,b) AS changed FROM features', table);
  expect(identical.getChild('changed')!.get(0).length).toBe(0);
});

test('line merge crosses only degree-two endpoints and chains native results across batches', () => {
  const geometries = [
    parseWKT('MULTILINESTRING((0 0,4 0),(8 0,4 0))'),
    parseWKT('MULTILINESTRING((0 0,4 0),(4 0,8 0),(4 0,4 4))'),
    parseWKT('MULTILINESTRING((0 0,1 0),(1 0,1 1),(1 1,0 0))'),
    parseWKT('MULTILINESTRING((0 0,4 0),(4.000001 0,8 0))'),
    parseWKT('MULTILINESTRING EMPTY'),
    null
  ];
  const g = makeArrowVectorFromGeoArrowColumn(makeGeoArrowColumnFromGeometryRows(geometries));
  const table = new Table(new Schema([geometryField('g', g, 'multilinestring')]), {g});
  const batched = new Table(table.schema, [
    ...table.slice(0, 1).batches,
    ...table.slice(1).batches
  ]);
  const result = select(
    `SELECT ST_LineMerge(g) AS merged,
            ST_Segmentize(ST_LineMerge(g), 3) AS route FROM features`,
    batched
  );
  expect(result.batches.map(batch => batch.numRows)).toEqual([1, 5]);
  expect(getGeoArrowFieldInfo(result.schema.fields[0]!)?.encoding).toBe('geoarrow.geometry');
  expect(geometryAt(result, 'merged', 0)).toEqual(parseWKT('LINESTRING(0 0,4 0,8 0)'));
  expect(geometryAt(result, 'route', 0)).toEqual(parseWKT('LINESTRING(0 0,2 0,4 0,6 0,8 0)'));
  expect(geometryAt(result, 'merged', 1)).toEqual(geometries[1]);
  expect(geometryAt(result, 'merged', 2)).toEqual(parseWKT('LINESTRING(0 0,1 0,1 1,0 0)'));
  expect(geometryAt(result, 'merged', 3)).toEqual(geometries[3]);
  expect(geometryAt(result, 'merged', 4)).toEqual(geometries[4]);
  expect(geometryAt(result, 'route', 5)).toBeNull();
});

test('densifies native planar routes evenly, preserving their CRS and specialized encoding', () => {
  const coordinates = wkb('LINESTRING(0 0,0 1,0 9)');
  const decoded = [parseWKT('MULTILINESTRING((0 0,0 1,0 9),(1 10,1 18))')];
  const route = makeArrowVectorFromGeoArrowColumn(makeGeoArrowColumnFromGeometryRows(decoded));
  const crs = {crs: 'EPSG:3857'};
  const table = new Table(
    new Schema([
      geometryField('route', route, 'multilinestring', crs),
      geometryField('wkb', coordinates)
    ]),
    {route, wkb: coordinates}
  );
  const result = select(
    'SELECT ST_Segmentize(route,5) AS native, ST_Segmentize(wkb,5) AS converted FROM features',
    table
  );
  expect(getGeoArrowFieldInfo(result.schema.fields[0]!)).toMatchObject({
    encoding: 'geoarrow.multilinestring',
    metadata: crs
  });
  expect(geometryAt(result, 'native', 0)).toEqual(
    parseWKT('MULTILINESTRING((0 0,0 1,0 5,0 9),(1 10,1 14,1 18))')
  );
  expect(geometryAt(result, 'converted', 0)).toEqual(parseWKT('LINESTRING(0 0,0 1,0 5,0 9)'));
  expect(() => select('SELECT ST_Segmentize(route,0) FROM features', table)).toThrow(
    /finite positive maximum segment length/
  );
  expect(() => select('SELECT ST_Segmentize(route,0.0000001) FROM features', table)).toThrow(
    /would add more than/
  );
});
