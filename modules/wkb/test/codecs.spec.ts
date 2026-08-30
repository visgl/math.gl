// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  formatWKT,
  inferWellKnownGeometryDimension,
  parseWKB,
  parseWKT,
  writeWKB,
  type WellKnownDimension,
  type WellKnownGeometry
} from '../src/index';

const geometries: WellKnownGeometry[] = [
  {type: 'Point', coordinates: [1, 2]},
  {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [1, 2]
    ]
  },
  {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [2, 0],
        [0, 2],
        [0, 0]
      ]
    ]
  },
  {
    type: 'MultiPoint',
    coordinates: [
      [0, 0],
      [1, 2]
    ]
  },
  {
    type: 'MultiLineString',
    coordinates: [
      [
        [0, 0],
        [1, 2]
      ],
      [
        [3, 4],
        [5, 6]
      ]
    ]
  },
  {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [2, 0],
          [0, 2],
          [0, 0]
        ]
      ]
    ]
  },
  {
    type: 'GeometryCollection',
    geometries: [
      {type: 'Point', coordinates: [1, 2]},
      {
        type: 'LineString',
        coordinates: [
          [3, 4],
          [5, 6]
        ]
      }
    ]
  }
];

test('WKB and WKT round-trip every geometry family', () => {
  for (const geometry of geometries) {
    expect(parseWKB(writeWKB(geometry)).geometry).toEqual(geometry);
    expect(parseWKT(formatWKT(geometry))).toEqual(geometry);
  }
});

test('WKB preserves semantic dimensions declared by ISO headers', () => {
  for (const dimension of ['xy', 'xyz', 'xym', 'xyzm'] as WellKnownDimension[]) {
    const size = dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
    const geometry: WellKnownGeometry = {
      type: 'Point',
      coordinates: Array.from({length: size}, (_, index) => index + 1)
    };
    const result = parseWKB(writeWKB(geometry, dimension));
    expect(result.dimension).toBe(dimension);
    expect(result.geometry).toEqual(geometry);
    expect(result.byteLength).toBe(size * 8 + 5);
  }
});

test('WKB accepts big-endian and EWKB Z/M/SRID headers', () => {
  const bigEndian = new Uint8Array(21);
  const bigEndianView = new DataView(bigEndian.buffer);
  bigEndianView.setUint8(0, 0);
  bigEndianView.setUint32(1, 1, false);
  bigEndianView.setFloat64(5, 12.5, false);
  bigEndianView.setFloat64(13, -4.25, false);
  expect(parseWKB(bigEndian)).toMatchObject({
    geometry: {type: 'Point', coordinates: [12.5, -4.25]},
    dimension: 'xy'
  });

  const ewkb = new Uint8Array(33);
  const ewkbView = new DataView(ewkb.buffer);
  ewkbView.setUint8(0, 1);
  ewkbView.setUint32(1, 0xa0000001, true);
  ewkbView.setUint32(5, 4326, true);
  ewkbView.setFloat64(9, 1, true);
  ewkbView.setFloat64(17, 2, true);
  ewkbView.setFloat64(25, 3, true);
  expect(parseWKB(ewkb)).toMatchObject({
    geometry: {type: 'Point', coordinates: [1, 2, 3]},
    dimension: 'xyz',
    srid: 4326
  });
});

test('WKB rejects truncated, trailing, structurally invalid, and over-limit input', () => {
  expect(() => parseWKB(new Uint8Array([1, 1, 0]))).toThrow(/end of WKB/);
  expect(() => {
    const valid = writeWKB({type: 'Point', coordinates: [1, 2]});
    parseWKB(Uint8Array.from([...valid, 0]));
  }).toThrow(/trailing bytes/);

  const collection = writeWKB({
    type: 'GeometryCollection',
    geometries: [{type: 'Point', coordinates: [1, 2]}]
  });
  expect(() => parseWKB(collection, {maximumDepth: 0})).toThrow(/maximumDepth/);
  expect(() => parseWKB(collection, {maximumElements: 0})).toThrow(/maximumElements/);
});

test('WKT accepts dimensions, empties, nested collections, and both MultiPoint syntaxes', () => {
  expect(parseWKT('LINESTRING EMPTY')).toEqual({type: 'LineString', coordinates: []});
  expect(parseWKT('POINT ZM EMPTY')).toEqual({
    type: 'Point',
    coordinates: [Number.NaN, Number.NaN, Number.NaN, Number.NaN]
  });
  expect(formatWKT(parseWKT('POINT EMPTY'))).toBe('POINT EMPTY');
  expect(formatWKT(parseWKT('GEOMETRYCOLLECTION EMPTY'))).toBe('GEOMETRYCOLLECTION EMPTY');
  expect(parseWKT('MULTIPOINT (1 2, 3 4)')).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [1, 2],
      [3, 4]
    ]
  });
  expect(parseWKT('MULTIPOINT ((1 2), (3 4))')).toEqual({
    type: 'MultiPoint',
    coordinates: [
      [1, 2],
      [3, 4]
    ]
  });
  expect(parseWKT('GEOMETRYCOLLECTION Z (GEOMETRYCOLLECTION (POINT (1 2 3)))')).toEqual({
    type: 'GeometryCollection',
    geometries: [
      {
        type: 'GeometryCollection',
        geometries: [{type: 'Point', coordinates: [1, 2, 3]}]
      }
    ]
  });
});

test('WKT rejects malformed structure and every unrecognized character', () => {
  expect(() => parseWKT('POLYGON (0 0, 1 1)')).toThrow();
  expect(() => parseWKT('NOTAGEOMETRY (0 0)')).toThrow(/Unsupported/);
  expect(() => parseWKT('POINT @ (1 2)')).toThrow(/Unexpected WKT character/);
  expect(() => parseWKT('POINT (1; 2)')).toThrow(/Unexpected WKT character/);
});

test('dimension inference recurses through collections and does not guess M', () => {
  expect(
    inferWellKnownGeometryDimension({
      type: 'GeometryCollection',
      geometries: [
        {type: 'GeometryCollection', geometries: [{type: 'Point', coordinates: [1, 2, 3, 4]}]}
      ]
    })
  ).toBe('xyzm');
  expect(inferWellKnownGeometryDimension({type: 'Point', coordinates: [1, 2, 3]})).toBe('xyz');
});
