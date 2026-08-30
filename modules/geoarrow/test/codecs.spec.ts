// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  decodeGeoArrowWKB,
  decodeGeoArrowWKT,
  encodeGeoArrowWKB,
  encodeGeoArrowWKT,
  formatWKT,
  makeGeoArrowColumnFromGeometryRows,
  parseWKB,
  parseWKT,
  writeWKB,
  type GeoArrowColumn,
  type GeoArrowDimension,
  type GeoArrowGeometryValue
} from '../src/index';
import {materializeGeoArrowRows} from '../src/layout';

const geometries: GeoArrowGeometryValue[] = [
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

test('column codecs preserve nulls, declared dimensions and metadata', () => {
  for (const dimension of ['xy', 'xyz', 'xym', 'xyzm'] as GeoArrowDimension[]) {
    const size = dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
    const point: GeoArrowGeometryValue = {
      type: 'Point',
      coordinates: Array.from({length: size}, (_, index) => index + 1)
    };
    const source = {
      ...makeGeoArrowColumnFromGeometryRows([point, null], {dimension}),
      metadata: {fixture: true}
    };
    for (const encoded of [encodeGeoArrowWKB(source), encodeGeoArrowWKT(source)]) {
      const decoded =
        encoded.encoding === 'geoarrow.wkb'
          ? decodeGeoArrowWKB(encoded)
          : decodeGeoArrowWKT(encoded);
      expect(decoded.dimension).toBe(dimension);
      expect(decoded.metadata).toBe(source.metadata);
      expect(materializeGeoArrowRows(decoded)).toEqual([point, null]);
    }
  }
});

test('serialized identity and malformed inputs are handled', () => {
  const source = makeGeoArrowColumnFromGeometryRows([{type: 'Point', coordinates: [1, 2]}]);
  const wkb = encodeGeoArrowWKB(source);
  const wkt = encodeGeoArrowWKT(source);
  expect(encodeGeoArrowWKB(wkb)).toBe(wkb);
  expect(encodeGeoArrowWKT(wkt)).toBe(wkt);
  expect(() => parseWKB(new Uint8Array([1, 1, 0]))).toThrow(/end of WKB/);
  expect(() => parseWKT('POLYGON (0 0, 1 1)')).toThrow();
  expect(() => parseWKT('NOTAGEOMETRY (0 0)')).toThrow(/Unsupported/);
});

test('WKB accepts big-endian and EWKB Z/SRID headers', () => {
  const bigEndian = new Uint8Array(21);
  const bigEndianView = new DataView(bigEndian.buffer);
  bigEndianView.setUint8(0, 0);
  bigEndianView.setUint32(1, 1, false);
  bigEndianView.setFloat64(5, 12.5, false);
  bigEndianView.setFloat64(13, -4.25, false);
  expect(parseWKB(bigEndian).geometry).toEqual({type: 'Point', coordinates: [12.5, -4.25]});

  const ewkb = new Uint8Array(33);
  const ewkbView = new DataView(ewkb.buffer);
  ewkbView.setUint8(0, 1);
  ewkbView.setUint32(1, 0xa0000001, true);
  ewkbView.setUint32(5, 4326, true);
  ewkbView.setFloat64(9, 1, true);
  ewkbView.setFloat64(17, 2, true);
  ewkbView.setFloat64(25, 3, true);
  expect(parseWKB(ewkb).geometry).toEqual({type: 'Point', coordinates: [1, 2, 3]});
});

test('WKT accepts empties and both MultiPoint syntaxes', () => {
  expect(parseWKT('LINESTRING EMPTY')).toEqual({type: 'LineString', coordinates: []});
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
});

test('serialized mixed-dimension collections normalize to the declared column dimension', () => {
  const point = writeWKB({type: 'Point', coordinates: [1, 2]}, 'xy');
  const line = writeWKB(
    {
      type: 'LineString',
      coordinates: [
        [3, 4, 5, 6],
        [7, 8, 9, 10]
      ]
    },
    'xyzm'
  );
  const wkbBytes = Uint8Array.from([1, 7, 0, 0, 0, 2, 0, 0, 0, ...point, ...line]);
  const wktBytes = new TextEncoder().encode(
    'GEOMETRYCOLLECTION ZM (POINT (1 2), LINESTRING ZM (3 4 5 6, 7 8 9 10))'
  );
  const columns: GeoArrowColumn[] = [
    makeSerializedFixture('geoarrow.wkb', 'binary', wkbBytes),
    makeSerializedFixture('geoarrow.wkt', 'utf8', wktBytes)
  ];
  for (const serialized of columns) {
    const decoded =
      serialized.encoding === 'geoarrow.wkb'
        ? decodeGeoArrowWKB(serialized)
        : decodeGeoArrowWKT(serialized);
    const collection = materializeGeoArrowRows(decoded)[0] as Extract<
      GeoArrowGeometryValue,
      {type: 'GeometryCollection'}
    >;
    expect(collection.geometries[0]).toEqual({type: 'Point', coordinates: [1, 2, 0, 0]});
    expect(collection.geometries[1]).toEqual({
      type: 'LineString',
      coordinates: [
        [3, 4, 5, 6],
        [7, 8, 9, 10]
      ]
    });
  }
});

function makeSerializedFixture(
  encoding: 'geoarrow.wkb' | 'geoarrow.wkt',
  physicalEncoding: 'binary' | 'utf8',
  values: Uint8Array
): GeoArrowColumn {
  return {
    encoding,
    dimension: 'xyzm',
    coordinateLayout: null,
    chunks: [
      {
        kind: 'serialized',
        encoding: physicalEncoding,
        length: 1,
        offsets: new Int32Array([0, values.length]),
        values
      }
    ]
  };
}
