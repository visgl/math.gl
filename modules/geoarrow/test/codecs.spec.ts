// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {writeWKB} from '@math.gl/wkb';
import {
  decodeGeoArrowWKB,
  decodeGeoArrowWKT,
  encodeGeoArrowWKB,
  encodeGeoArrowWKT,
  makeGeoArrowColumnFromGeometryRows,
  type GeoArrowColumn,
  type GeoArrowDimension,
  type GeoArrowGeometryValue
} from '../src/index';
import {materializeGeoArrowRows} from '../src/layout';

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

test('serialized identity is preserved', () => {
  const source = makeGeoArrowColumnFromGeometryRows([{type: 'Point', coordinates: [1, 2]}]);
  const wkb = encodeGeoArrowWKB(source);
  const wkt = encodeGeoArrowWKT(source);
  expect(encodeGeoArrowWKB(wkb)).toBe(wkb);
  expect(encodeGeoArrowWKT(wkt)).toBe(wkt);
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

test('WKB decoder writes concrete families directly from visitor events', () => {
  const geometries: GeoArrowGeometryValue[] = [
    {
      type: 'LineString',
      coordinates: [
        [0, 1],
        [2, 3]
      ]
    },
    {
      type: 'MultiPoint',
      coordinates: [
        [4, 5],
        [6, 7]
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
      type: 'MultiLineString',
      coordinates: [
        [
          [0, 0],
          [1, 1]
        ],
        [
          [2, 2],
          [3, 3]
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
    }
  ];
  for (const geometry of geometries) {
    const bytes = writeWKB(geometry, 'xy');
    const source = makeSerializedFixture('geoarrow.wkb', 'binary', bytes, 'xy');
    const decoded = decodeGeoArrowWKB(source);
    expect(decoded.encoding).toBe(`geoarrow.${geometry.type.toLowerCase()}`);
    expect(materializeGeoArrowRows(decoded)).toEqual([geometry]);
  }
});

test('WKB decoder uses mixed-dimension dense-union children without row materialization', () => {
  const point = writeWKB({type: 'Point', coordinates: [1, 2]}, 'xy');
  const line = writeWKB(
    {
      type: 'LineString',
      coordinates: [
        [3, 4, 5],
        [6, 7, 8]
      ]
    },
    'xyz'
  );
  const values = new Uint8Array(point.length + line.length);
  values.set(point, 0);
  values.set(line, point.length);
  const source = makeSerializedFixture('geoarrow.wkb', 'binary', values);
  source.chunks[0] = {
    ...source.chunks[0],
    length: 2,
    offsets: new Int32Array([0, point.length, values.length])
  };
  const decoded = decodeGeoArrowWKB(source);
  expect(decoded.encoding).toBe('geoarrow.geometry');
  expect(decoded.chunks[0].kind).toBe('dense-union');
  expect(materializeGeoArrowRows(decoded)).toEqual([
    {type: 'Point', coordinates: [1, 2]},
    {
      type: 'LineString',
      coordinates: [
        [3, 4, 5],
        [6, 7, 8]
      ]
    }
  ]);
});

function makeSerializedFixture(
  encoding: 'geoarrow.wkb' | 'geoarrow.wkt',
  physicalEncoding: 'binary' | 'utf8',
  values: Uint8Array,
  dimension: GeoArrowDimension = 'xyzm'
): GeoArrowColumn {
  return {
    encoding,
    dimension,
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
