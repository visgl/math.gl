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
