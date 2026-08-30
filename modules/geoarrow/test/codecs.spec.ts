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
  getGeoArrowWKBVertexCount,
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

test('WKB encoding preserves nulls stored in dense-union children', () => {
  const source = makeGeoArrowColumnFromGeometryRows([
    {type: 'Point', coordinates: [1, 2]},
    null,
    {type: 'LineString', coordinates: [[3, 4]]}
  ]);
  const encoded = encodeGeoArrowWKB(source);
  expect(materializeGeoArrowRows(decodeGeoArrowWKB(encoded))).toEqual(
    materializeGeoArrowRows(source)
  );
});

test('WKB encoding preserves native chunk boundaries', () => {
  const oneChunk = makeGeoArrowColumnFromGeometryRows([
    {type: 'Point', coordinates: [1, 2]},
    {type: 'Point', coordinates: [3, 4]}
  ]);
  const source = {...oneChunk, chunks: [oneChunk.chunks[0], oneChunk.chunks[0]]};
  const encoded = encodeGeoArrowWKB(source);
  expect(encoded.chunks).toHaveLength(2);
  const decoded = decodeGeoArrowWKB(encoded);
  expect(decoded.chunks).toHaveLength(2);
  expect(materializeGeoArrowRows(decoded)).toEqual([
    {type: 'Point', coordinates: [1, 2]},
    {type: 'Point', coordinates: [3, 4]},
    {type: 'Point', coordinates: [1, 2]},
    {type: 'Point', coordinates: [3, 4]}
  ]);
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
        ? decodeGeoArrowWKB(serialized, {dimension: 'preserve'})
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

test('WKB decoder infers serialized dimensions and writes requested final buffers', () => {
  const bytes = writeWKB({type: 'Point', coordinates: [1, 2, 3]}, 'xyz');
  const source = makeSerializedFixture('geoarrow.wkb', 'binary', bytes, 'xy');
  const decoded = decodeGeoArrowWKB(source, {
    coordinateLayout: 'separated',
    coordinateType: 'float32',
    offsetType: 'int64'
  });
  expect(decoded.dimension).toBe('xyz');
  expect(decoded.coordinateLayout).toBe('separated');
  expect(materializeGeoArrowRows(decoded)).toEqual([{type: 'Point', coordinates: [1, 2, 3]}]);
  const coordinateStruct = decoded.chunks[0];
  if (coordinateStruct.kind !== 'struct') throw new Error('Expected separated coordinates');
  const x = coordinateStruct.children['x'];
  if (x.kind !== 'primitive') throw new Error('Expected primitive x coordinates');
  expect(x.values).toBeInstanceOf(Float32Array);
});

test('WKB decoder applies explicit family promotion and rejects incompatible targets', () => {
  const bytes = writeWKB({type: 'Point', coordinates: [1, 2]}, 'xy');
  const source = makeSerializedFixture('geoarrow.wkb', 'binary', bytes, 'xy');
  const promoted = decodeGeoArrowWKB(source, {
    encoding: 'geoarrow.multipoint',
    offsetType: 'int64'
  });
  expect(promoted.encoding).toBe('geoarrow.multipoint');
  const promotedChunk = promoted.chunks[0];
  if (promotedChunk.kind !== 'list') throw new Error('Expected MultiPoint list storage');
  expect(promotedChunk.offsets).toBeInstanceOf(BigInt64Array);
  expect(materializeGeoArrowRows(promoted)).toEqual([{type: 'MultiPoint', coordinates: [[1, 2]]}]);
  expect(() => decodeGeoArrowWKB(source, {encoding: 'geoarrow.polygon'})).toThrow(
    'Rows cannot be represented as geoarrow.polygon'
  );
  expect(() => decodeGeoArrowWKB(source, {encoding: 'geoarrow.geometrycollection'})).toThrow(
    'Rows cannot be represented as geoarrow.geometrycollection'
  );
});

test('WKB decoder reads Arrow BinaryView storage without consolidating source bytes', () => {
  const bytes = writeWKB({type: 'Point', coordinates: [11, 12, 13]}, 'xyz');
  const source: GeoArrowColumn = {
    encoding: 'geoarrow.wkb',
    dimension: 'xy',
    coordinateLayout: null,
    chunks: [
      {
        kind: 'serialized',
        encoding: 'binary',
        length: 1,
        offsets: new Int32Array([0, 0]),
        values: new Uint8Array(),
        views: new Uint32Array([bytes.length, 0, 0, 0]),
        dataBuffers: [bytes]
      }
    ]
  };
  const decoded = decodeGeoArrowWKB(source);
  expect(getGeoArrowWKBVertexCount(source)).toBe(1);
  expect(decoded.dimension).toBe('xyz');
  expect(materializeGeoArrowRows(decoded)).toEqual([{type: 'Point', coordinates: [11, 12, 13]}]);
});

test('WKB decoder preserves chunks and a stable mixed-union schema', () => {
  const point = writeWKB({type: 'Point', coordinates: [1, 2]}, 'xy');
  const line = writeWKB(
    {
      type: 'LineString',
      coordinates: [
        [3, 4],
        [5, 6]
      ]
    },
    'xy'
  );
  const source: GeoArrowColumn = {
    encoding: 'geoarrow.wkb',
    dimension: 'xy',
    coordinateLayout: null,
    chunks: [
      makeSerializedFixture('geoarrow.wkb', 'binary', point, 'xy').chunks[0],
      {
        kind: 'serialized',
        encoding: 'binary',
        length: 2,
        offsets: new Int32Array([0, 0, line.length]),
        values: line,
        validity: {values: new Uint8Array([0b10])}
      }
    ]
  };
  const decoded = decodeGeoArrowWKB(source);
  expect(decoded.chunks).toHaveLength(2);
  for (const chunk of decoded.chunks) {
    expect(chunk.kind).toBe('dense-union');
    if (chunk.kind === 'dense-union') {
      expect(chunk.children.map(child => child.name)).toEqual(['Point', 'LineString']);
      expect(chunk.validity).toBeUndefined();
      expect([...chunk.typeIds].every(typeId => typeId > 0)).toBe(true);
    }
  }
  expect(materializeGeoArrowRows(decoded)).toEqual([
    {type: 'Point', coordinates: [1, 2]},
    null,
    {
      type: 'LineString',
      coordinates: [
        [3, 4],
        [5, 6]
      ]
    }
  ]);
});

test('WKB decoder builds nested GeometryCollections without materialized rows', () => {
  const geometry: GeoArrowGeometryValue = {
    type: 'GeometryCollection',
    geometries: [
      {type: 'Point', coordinates: [1, 2, 0]},
      {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'LineString',
            coordinates: [
              [3, 4, 5],
              [6, 7, 8]
            ]
          }
        ]
      }
    ]
  };
  const bytes = writeWKB(geometry, 'xyz');
  const source = makeSerializedFixture('geoarrow.wkb', 'binary', bytes, 'xy');
  const decoded = decodeGeoArrowWKB(source);
  expect(decoded.encoding).toBe('geoarrow.geometrycollection');
  expect(decoded.dimension).toBe('xyz');
  expect(materializeGeoArrowRows(decoded)).toEqual([
    {
      type: 'GeometryCollection',
      geometries: [
        {type: 'Point', coordinates: [1, 2, 0]},
        {
          type: 'GeometryCollection',
          geometries: [
            {
              type: 'LineString',
              coordinates: [
                [3, 4, 5],
                [6, 7, 8]
              ]
            }
          ]
        }
      ]
    }
  ]);
});

test('WKB decoder builds mixed collection and multi-geometry children directly', () => {
  const geometries: GeoArrowGeometryValue[] = [
    {
      type: 'GeometryCollection',
      geometries: [
        {
          type: 'MultiLineString',
          coordinates: [
            [
              [0, 1, 2, 3],
              [4, 5, 6, 7]
            ],
            [
              [8, 9, 10, 11],
              [12, 13, 14, 15]
            ]
          ]
        },
        {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [0, 0, 1, 2],
                [1, 0, 3, 4],
                [0, 1, 5, 6],
                [0, 0, 1, 2]
              ]
            ]
          ]
        }
      ]
    },
    {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [20, 20, 1, 2],
            [21, 20, 3, 4],
            [20, 21, 5, 6],
            [20, 20, 1, 2]
          ]
        ]
      ]
    }
  ];
  const source = makeSerializedWKBRows([
    writeWKB(geometries[0], 'xyzm'),
    writeWKB(geometries[1], 'xyzm'),
    null
  ]);
  const decoded = decodeGeoArrowWKB(source, {
    encoding: 'geoarrow.geometry',
    coordinateLayout: 'separated',
    coordinateType: 'float32',
    offsetType: 'int64'
  });
  expect(getGeoArrowWKBVertexCount(source)).toBe(12);
  expect(decoded.chunks[0].kind).toBe('dense-union');
  expect(materializeGeoArrowRows(decoded)).toEqual([...geometries, null]);
});

test('WKB decoder preserves null GeometryCollection rows in concrete storage', () => {
  const geometry: GeoArrowGeometryValue = {
    type: 'GeometryCollection',
    geometries: [{type: 'Point', coordinates: [1, 2]}]
  };
  const decoded = decodeGeoArrowWKB(makeSerializedWKBRows([writeWKB(geometry, 'xy'), null]), {
    encoding: 'geoarrow.geometrycollection'
  });
  expect(materializeGeoArrowRows(decoded)).toEqual([geometry, null]);
});

test('WKB decoder builds an empty GeometryCollection without child schemas', () => {
  const geometry: GeoArrowGeometryValue = {type: 'GeometryCollection', geometries: []};
  const decoded = decodeGeoArrowWKB(makeSerializedWKBRows([writeWKB(geometry, 'xy')]));
  expect(materializeGeoArrowRows(decoded)).toEqual([geometry]);
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
  const fixture = makeSerializedFixture('geoarrow.wkb', 'binary', values);
  const serialized = fixture.chunks[0];
  if (serialized.kind !== 'serialized') throw new Error('Expected serialized fixture');
  const source: GeoArrowColumn = {
    ...fixture,
    chunks: [
      {
        ...serialized,
        length: 2,
        offsets: new Int32Array([0, point.length, values.length])
      }
    ]
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

test('WKB decoder normalizes dimensions on nested multi-geometry members', () => {
  // MultiPoint Z with one XY Point child (valid mixed-member WKB).
  const bytes = new Uint8Array(30);
  const view = new DataView(bytes.buffer);
  view.setUint8(0, 1);
  view.setUint32(1, 1004, true);
  view.setUint32(5, 1, true);
  view.setUint8(9, 1);
  view.setUint32(10, 1, true);
  view.setFloat64(14, 10, true);
  view.setFloat64(22, 20, true);
  const source = makeSerializedFixture('geoarrow.wkb', 'binary', bytes, 'xyz');
  expect(materializeGeoArrowRows(decodeGeoArrowWKB(source))).toEqual([
    {type: 'MultiPoint', coordinates: [[10, 20, 0]]}
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

function makeSerializedWKBRows(rows: readonly (Uint8Array | null)[]): GeoArrowColumn {
  const offsets = new Int32Array(rows.length + 1);
  const validity = new Uint8Array(Math.ceil(rows.length / 8));
  const byteLength = rows.reduce((sum, row) => sum + (row?.length || 0), 0);
  const values = new Uint8Array(byteLength);
  let byteOffset = 0;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row) {
      values.set(row, byteOffset);
      byteOffset += row.length;
      validity[rowIndex >> 3] |= 1 << (rowIndex & 7);
    }
    offsets[rowIndex + 1] = byteOffset;
  }
  return {
    encoding: 'geoarrow.wkb',
    dimension: 'xy',
    coordinateLayout: null,
    chunks: [
      {
        kind: 'serialized',
        encoding: 'binary',
        length: rows.length,
        offsets,
        values,
        validity: {values: validity}
      }
    ]
  };
}
