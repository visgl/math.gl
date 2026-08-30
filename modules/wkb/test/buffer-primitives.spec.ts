// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  inspectWKBHeader,
  parseWKB,
  scanWKB,
  visitWKB,
  WKBBuilder,
  writeWKB,
  type WKBBuilderBaseOptions,
  type WKBGeometryWriter
} from '../src/index';

test('inspectWKBHeader reads only ISO WKB and EWKB headers', () => {
  const isoHeader = writeWKB({type: 'Point', coordinates: [1, 2, 3, 4]}, 'xyzm').subarray(0, 5);
  expect(inspectWKBHeader(isoHeader)).toMatchObject({
    geometryType: 'Point',
    dimension: 'xyzm',
    dialect: 'iso-wkb',
    littleEndian: true,
    byteOffset: 0,
    bodyByteOffset: 5,
    byteLength: 5
  });

  const ewkb = writePointWithBuilder({dimension: 'xym', byteOrder: 'big-endian', srid: 4326});
  const padded = new Uint8Array(ewkb.length + 4);
  padded.set(ewkb, 2);
  expect(inspectWKBHeader(padded.subarray(2, padded.length - 2))).toMatchObject({
    geometryType: 'Point',
    dimension: 'xym',
    dialect: 'ewkb',
    littleEndian: false,
    bodyByteOffset: 9,
    byteLength: 9,
    srid: 4326
  });
  expect(scanWKB(ewkb).bounds).toEqual({
    xmin: 1,
    ymin: 2,
    xmax: 1,
    ymax: 2,
    mmin: 4,
    mmax: 4
  });
});

test('visitWKB traverses nested mixed-endian geometry without row objects', () => {
  const firstPoint = writePointWithBuilder({byteOrder: 'little-endian'}, [1, 2]);
  const secondPoint = writePointWithBuilder({byteOrder: 'big-endian'}, [3, 4]);
  const collection = new Uint8Array(9 + firstPoint.length + secondPoint.length);
  const view = new DataView(collection.buffer);
  view.setUint8(0, 1);
  view.setUint32(1, 7, true);
  view.setUint32(5, 2, true);
  collection.set(firstPoint, 9);
  collection.set(secondPoint, 9 + firstPoint.length);

  const geometryTypes: string[] = [];
  const coordinates: number[] = [];
  expect(
    visitWKB(collection, {
      geometry: header => geometryTypes.push(header.geometryType),
      coordinate: (x, y) => coordinates.push(x, y)
    })
  ).toBe(collection.length);
  expect(geometryTypes).toEqual(['GeometryCollection', 'Point', 'Point']);
  expect(coordinates).toEqual([1, 2, 3, 4]);
});

test('scanWKB combines family counts, nesting, rings, coordinates, and XYZM bounds', () => {
  const polygon = writePolygonWithBuilder({dimension: 'xyzm'});
  expect(scanWKB(polygon)).toMatchObject({
    byteLength: polygon.length,
    coordinateCount: 5,
    ringCount: 1,
    geometryCount: 1,
    maximumDepth: 0,
    geometryTypes: ['Polygon'],
    geometryCounts: {Polygon: 1},
    bounds: {
      xmin: 0,
      ymin: 0,
      xmax: 2,
      ymax: 2,
      zmin: 10,
      zmax: 14,
      mmin: 20,
      mmax: 24
    }
  });

  const empty = writeWKB({type: 'LineString', coordinates: []});
  expect(scanWKB(empty)).toMatchObject({coordinateCount: 0, geometryCount: 1});
  expect(scanWKB(empty).bounds).toBeUndefined();
});

test('WKBBuilder measure and write modes produce identical bytes for every family', () => {
  const writers = makeGeometryWriters();
  for (const writer of writers) {
    const measured = new WKBBuilder({mode: 'measure', dimension: 'xyz'});
    writer(measured);
    const values = new Uint8Array(measured.finishGeometry());
    const written = new WKBBuilder({mode: 'write', target: values, dimension: 'xyz'});
    writer(written);
    expect(written.finishGeometry()).toBe(values.byteLength);
    expect(parseWKB(values).geometry).toBeTruthy();
  }
});

test('WKBBuilder generic geometry dispatch covers every family and default count', () => {
  const geometryTypes = [
    'Point',
    'LineString',
    'Polygon',
    'MultiPoint',
    'MultiLineString',
    'MultiPolygon',
    'GeometryCollection'
  ] as const;

  for (const geometryType of geometryTypes) {
    const geometryWriter: WKBGeometryWriter = builder => {
      builder.beginGeometry(geometryType);
      if (geometryType === 'Point') builder.writeCoordinate(1, 2);
    };
    const valueOffsets = WKBBuilder.measureGeometryArray([geometryWriter]);
    const values = new Uint8Array(valueOffsets[1]);
    WKBBuilder.writeGeometryArray([geometryWriter], valueOffsets, values);
    expect(parseWKB(values).geometry.type).toBe(geometryType);
  }
});

test('WKBBuilder writes every ISO dimension and substitutes missing ordinates', () => {
  for (const dimension of ['xy', 'xyz', 'xym', 'xyzm'] as const) {
    const geometryWriter: WKBGeometryWriter = builder => {
      builder.beginPoint();
      builder.writeCoordinate(1, 2);
    };
    const valueOffsets = WKBBuilder.measureGeometryArray([geometryWriter], {dimension});
    const arrayBuffer = new ArrayBuffer(valueOffsets[1]);
    WKBBuilder.writeGeometryArray([geometryWriter], valueOffsets, new Uint8Array(arrayBuffer), {
      dimension,
      byteOrder: 'big-endian'
    });
    const result = parseWKB(new Uint8Array(arrayBuffer));
    expect(result.dimension).toBe(dimension);
    expect(result.geometry.type).toBe('Point');
    if (result.geometry.type !== 'Point') throw new Error('Expected Point');
    expect(result.geometry.coordinates.slice(0, 2)).toEqual([1, 2]);
    expect(result.geometry.coordinates.slice(2).every(Number.isNaN)).toBe(true);
  }
});

test('WKBBuilder supports destination offsets, endian, EWKB SRID, and transforms', () => {
  const measure = new WKBBuilder({mode: 'measure', dimension: 'xyzm', srid: 3857});
  measure.beginPoint();
  measure.writeCoordinate(1, 2, 3, 4);
  const target = new Uint8Array(measure.finishGeometry() + 6).fill(255);
  const writer = new WKBBuilder({
    mode: 'write',
    target: target.subarray(2, target.length - 2),
    byteOffset: 1,
    dimension: 'xyzm',
    byteOrder: 'big-endian',
    srid: 3857,
    transform: coordinate => coordinate.map(value => value + 10)
  });
  writer.beginPoint();
  writer.writeCoordinate(1, 2, 3, 4);
  const bytes = target.subarray(3, 3 + writer.finishGeometry());
  expect(parseWKB(bytes)).toMatchObject({
    geometry: {type: 'Point', coordinates: [11, 12, 13, 14]},
    dimension: 'xyzm',
    srid: 3857
  });
  expect(target.subarray(0, 3)).toEqual(new Uint8Array([255, 255, 255]));
  expect(target.subarray(target.length - 2)).toEqual(new Uint8Array([255, 255]));
});

test('WKBBuilder builds plain Binary buffers with null rows', () => {
  const geometryArray = WKBBuilder.buildGeometryArray([
    builder => {
      builder.beginPoint();
      builder.writeCoordinate(1, 2);
    },
    null,
    builder => {
      builder.beginPoint();
      builder.writeCoordinate(3, 4);
    }
  ]);
  expect(Array.from(geometryArray.valueOffsets)).toEqual([0, 21, 21, 42]);
  expect(geometryArray.nullBitmap).toEqual(new Uint8Array([0b00000101]));
  expect(geometryArray.nullCount).toBe(1);
  expect(parseWKB(geometryArray.values.subarray(geometryArray.valueOffsets[2])).geometry).toEqual({
    type: 'Point',
    coordinates: [3, 4]
  });

  const nonNullable = WKBBuilder.buildGeometryArray([
    builder => {
      builder.beginPoint();
      builder.writeCoordinate(5, 6);
    }
  ]);
  expect(nonNullable.nullBitmap).toBeUndefined();
  expect(nonNullable.nullCount).toBe(0);
});

test('traversal and builder reject malformed structure, limits, and buffer mismatches', () => {
  const collection = writeWKB({
    type: 'GeometryCollection',
    geometries: [{type: 'Point', coordinates: [1, 2]}]
  });
  expect(() => visitWKB(collection, {}, {maximumDepth: 0})).toThrow(/maximumDepth/);
  expect(() => scanWKB(collection, {maximumElements: 0})).toThrow(/maximumElements/);
  expect(() => visitWKB(Uint8Array.from([...collection, 0]), {})).toThrow(/trailing bytes/);

  const invalidMultiPoint = writeWKB({
    type: 'GeometryCollection',
    geometries: [{type: 'LineString', coordinates: []}]
  });
  new DataView(invalidMultiPoint.buffer).setUint32(1, 4, true);
  expect(() => visitWKB(invalidMultiPoint, {})).toThrow(/Point collection contains a LineString/);

  const tooSmall = new Uint8Array(20);
  const writer = new WKBBuilder({mode: 'write', target: tooSmall});
  expect(() => {
    writer.beginPoint();
    writer.writeCoordinate(1, 2);
  }).toThrow(/overflow/);

  expect(() =>
    WKBBuilder.writeGeometryArray(
      [builder => builder.beginPoint()],
      new Int32Array([0, 6]),
      new Uint8Array(6)
    )
  ).toThrow(/different byte lengths/);

  expect(() => new WKBBuilder({mode: 'write', target: new Uint8Array(1), byteOffset: -1})).toThrow(
    /outside the target/
  );
  expect(() => new WKBBuilder({mode: 'measure', srid: -1})).toThrow(/srid/);
  expect(() => {
    const invalidCount = new WKBBuilder({mode: 'measure'});
    invalidCount.beginLineString(-1);
  }).toThrow(/unsigned 32-bit/);
  expect(() =>
    WKBBuilder.writeGeometryArray([], new Int32Array([0, 0]), new Uint8Array(0))
  ).toThrow(/geometry count plus one/);
  expect(() =>
    WKBBuilder.writeGeometryArray(
      [builder => builder.beginPoint()],
      new Int32Array([0, 21]),
      new Uint8Array(20)
    )
  ).toThrow(/smaller than its final offset/);

  expect(() => inspectWKBHeader(new Uint8Array([2, 1, 0, 0, 0]))).toThrow(/byte order/);
  expect(() => inspectWKBHeader(new Uint8Array([1, 8, 0, 0, 0]))).toThrow(/geometry type/);
  expect(() => inspectWKBHeader(new Uint8Array(5), -1)).toThrow(/end of WKB/);
  expect(() => visitWKB(collection, {}, {maximumDepth: -1})).toThrow(/maximumDepth/);

  const pointBuffer = writeWKB({type: 'Point', coordinates: [1, 2]}).buffer;
  expect(inspectWKBHeader(pointBuffer).geometryType).toBe('Point');
});

function writePointWithBuilder(
  options: WKBBuilderBaseOptions,
  coordinate: readonly number[] = [1, 2, 3, 4]
): Uint8Array {
  const geometryWriter: WKBGeometryWriter = builder => {
    builder.beginPoint();
    builder.writeCoordinate(coordinate[0], coordinate[1], coordinate[2], coordinate[3]);
  };
  const measure = new WKBBuilder({mode: 'measure', ...options});
  geometryWriter(measure);
  const bytes = new Uint8Array(measure.finishGeometry());
  const write = new WKBBuilder({mode: 'write', target: bytes, ...options});
  geometryWriter(write);
  return bytes;
}

function writePolygonWithBuilder(options: WKBBuilderBaseOptions): Uint8Array {
  const geometryWriter: WKBGeometryWriter = builder => {
    builder.beginPolygon(1);
    builder.beginLinearRing(5);
    builder.writeCoordinate(0, 0, 10, 20);
    builder.writeCoordinate(2, 0, 11, 21);
    builder.writeCoordinate(0, 2, 12, 22);
    builder.writeCoordinate(0, 0, 13, 23);
    builder.writeCoordinate(0, 0, 14, 24);
  };
  const measure = new WKBBuilder({mode: 'measure', ...options});
  geometryWriter(measure);
  const bytes = new Uint8Array(measure.finishGeometry());
  const write = new WKBBuilder({mode: 'write', target: bytes, ...options});
  geometryWriter(write);
  return bytes;
}

function makeGeometryWriters(): WKBGeometryWriter[] {
  return [
    builder => {
      builder.beginPoint();
      builder.writeCoordinate(1, 2, 3);
    },
    builder => {
      builder.beginLineString(2);
      builder.writeCoordinate(1, 2, 3);
      builder.writeCoordinate(4, 5, 6);
    },
    builder => {
      builder.beginPolygon(1);
      builder.beginLinearRing(4);
      builder.writeCoordinate(0, 0, 1);
      builder.writeCoordinate(1, 0, 1);
      builder.writeCoordinate(0, 1, 1);
      builder.writeCoordinate(0, 0, 1);
    },
    builder => {
      builder.beginMultiPoint(1);
      builder.beginPoint();
      builder.writeCoordinate(1, 2, 3);
    },
    builder => {
      builder.beginMultiLineString(1);
      builder.beginLineString(1);
      builder.writeCoordinate(1, 2, 3);
    },
    builder => {
      builder.beginMultiPolygon(1);
      builder.beginPolygon(1);
      builder.beginLinearRing(4);
      builder.writeCoordinate(0, 0, 1);
      builder.writeCoordinate(1, 0, 1);
      builder.writeCoordinate(0, 1, 1);
      builder.writeCoordinate(0, 0, 1);
    },
    builder => {
      builder.beginGeometry('GeometryCollection', 1);
      builder.beginPoint();
      builder.writeCoordinate(1, 2, 3);
    }
  ];
}
