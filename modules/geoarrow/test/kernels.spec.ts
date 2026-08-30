// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  assertGeoArrowResourceLimits,
  convertGeoArrowColumn,
  getGeoArrowBounds,
  getGeoArrowVertexCount,
  interleaveGeoArrowCoordinates,
  makeGeoArrowColumnFromGeometryRows,
  mapGeoArrowCoordinates,
  mapGeoArrowCoordinatesInto,
  rewindGeoArrow,
  tessellateGeoArrowPolygons,
  type GeoArrowGeometryValue
} from '../src/index';
import {materializeGeoArrowRows} from '../src/layout';

test('coordinate mapping, into mapping and layout conversion are deterministic', () => {
  const source = makeGeoArrowColumnFromGeometryRows(
    [
      {
        type: 'LineString',
        coordinates: [
          [1, 2],
          [3, 4]
        ]
      }
    ],
    {coordinateLayout: 'separated'}
  );
  const mapped = mapGeoArrowCoordinates(source, coordinate => [
    coordinate[0] + 10,
    coordinate[1] - 1
  ]);
  expect(getGeoArrowBounds(mapped)).toEqual([11, 1, 13, 3]);
  const target = mapGeoArrowCoordinates(source, () => [0, 0]);
  expect(
    mapGeoArrowCoordinatesInto(target, source, coordinate => [coordinate[0] * 2, coordinate[1] * 3])
  ).toBe(target);
  expect(getGeoArrowBounds(target)).toEqual([2, 6, 6, 12]);
  expect(interleaveGeoArrowCoordinates(source).coordinateLayout).toBe('interleaved');
});

test('conversion round trips preserve geometry values', () => {
  let seed = 0x12345678;
  const random = (): number => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let iteration = 0; iteration < 50; iteration++) {
    const points = Array.from({length: 1 + Math.floor(random() * 20)}, () => [
      random() * 20 - 10,
      random() * 20 - 10
    ]);
    const source = makeGeoArrowColumnFromGeometryRows([{type: 'LineString', coordinates: points}]);
    const separated = convertGeoArrowColumn(source, {coordinateLayout: 'separated'});
    const roundTrip = convertGeoArrowColumn(separated, {coordinateLayout: 'interleaved'});
    expect(materializeGeoArrowRows(roundTrip)).toEqual(materializeGeoArrowRows(source));
    expect(getGeoArrowBounds(roundTrip)).toEqual(getGeoArrowBounds(source));
  }
});

test('conversion forces dense unions and never reinterprets M as Z', () => {
  const xym = makeGeoArrowColumnFromGeometryRows([{type: 'Point', coordinates: [1, 2, 99]}], {
    dimension: 'xym'
  });
  const xyz = convertGeoArrowColumn(xym, {dimension: 'xyz'});
  expect(materializeGeoArrowRows(xyz)).toEqual([{type: 'Point', coordinates: [1, 2, 0]}]);
  const mixed = convertGeoArrowColumn(xym, {encoding: 'geoarrow.geometry'});
  expect(mixed.encoding).toBe('geoarrow.geometry');
  expect(mixed.chunks[0].kind).toBe('dense-union');
  expect(materializeGeoArrowRows(mixed)).toEqual([{type: 'Point', coordinates: [1, 2, 99]}]);
});

test('winding normalization changes only rings with the wrong orientation', () => {
  const polygon: GeoArrowGeometryValue = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [0, 4],
        [4, 4],
        [4, 0],
        [0, 0]
      ],
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
        [1, 1]
      ]
    ]
  };
  const source = makeGeoArrowColumnFromGeometryRows([polygon]);
  const rewound = rewindGeoArrow(source, {outer: 'counter-clockwise'});
  const row = materializeGeoArrowRows(rewound)[0] as Extract<
    GeoArrowGeometryValue,
    {type: 'Polygon'}
  >;
  expect(signedArea(row.coordinates[0])).toBeGreaterThan(0);
  expect(signedArea(row.coordinates[1])).toBeLessThan(0);
  expect(rewindGeoArrow(rewound, {outer: 'counter-clockwise'})).toBe(rewound);
});

test('polygon tessellation returns exact positions, source rows and indices', () => {
  const source = makeGeoArrowColumnFromGeometryRows([
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0]
        ]
      ]
    },
    null,
    {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [3, 0],
            [4, 0],
            [3, 1],
            [3, 0]
          ]
        ]
      ]
    }
  ]);
  const result = tessellateGeoArrowPolygons(source, {positionSize: 3, sourceRowOffset: 10});
  expect(Array.from(result.positions)).toEqual([
    0, 0, 0, 2, 0, 0, 2, 2, 0, 0, 2, 0, 3, 0, 0, 4, 0, 0, 3, 1, 0
  ]);
  expect(Array.from(result.sourceRowIndices)).toEqual([10, 10, 10, 10, 12, 12, 12]);
  expect(Array.from(result.indices)).toEqual([2, 3, 0, 0, 1, 2, 5, 6, 4]);
  expect(result).toMatchObject({polygonCount: 2, vertexCount: 7, triangleCount: 3, rowCount: 3});
});

test('ported tessellation fixtures preserve holes and normalize separated ZM storage', () => {
  const polygon: GeoArrowGeometryValue = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0, 1, 10],
        [4, 0, 2, 20],
        [4, 4, 3, 30],
        [0, 4, 4, 40]
      ],
      [
        [1, 1, 5, 50],
        [1, 3, 6, 60],
        [3, 3, 7, 70],
        [3, 1, 8, 80]
      ]
    ]
  };
  const separated = makeGeoArrowColumnFromGeometryRows([polygon], {
    dimension: 'xyzm',
    coordinateLayout: 'separated'
  });
  const interleaved = makeGeoArrowColumnFromGeometryRows([polygon], {
    dimension: 'xyzm',
    coordinateLayout: 'interleaved'
  });
  const separatedResult = tessellateGeoArrowPolygons(separated);
  const interleavedResult = tessellateGeoArrowPolygons(interleaved);

  expect(separatedResult.sourceDimension).toBe(4);
  expect(Array.from(separatedResult.positions)).toEqual(Array.from(interleavedResult.positions));
  expect(Array.from(separatedResult.indices)).toEqual(Array.from(interleavedResult.indices));
  expect(separatedResult.vertexCount).toBe(8);
  for (let index = 0; index < separatedResult.indices.length; index += 3) {
    const a = separatedResult.indices[index] * 4;
    const b = separatedResult.indices[index + 1] * 4;
    const c = separatedResult.indices[index + 2] * 4;
    const x =
      (separatedResult.positions[a] + separatedResult.positions[b] + separatedResult.positions[c]) /
      3;
    const y =
      (separatedResult.positions[a + 1] +
        separatedResult.positions[b + 1] +
        separatedResult.positions[c + 1]) /
      3;
    expect(x > 1 && x < 3 && y > 1 && y < 3).toBe(false);
  }
});

test('resource limits fail before materializing expensive work', () => {
  const source = makeGeoArrowColumnFromGeometryRows([
    {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 2]
      ]
    }
  ]);
  expect(() => assertGeoArrowResourceLimits(source, {maximumRows: 0})).toThrow(/maximumRows/);
  expect(() => assertGeoArrowResourceLimits(source, {maximumCoordinates: 2})).toThrow(
    /maximumCoordinates/
  );
  expect(() => assertGeoArrowResourceLimits(source, {maximumOutputBytes: 1})).toThrow(
    /maximumOutputBytes/
  );
  expect(getGeoArrowVertexCount(source)).toBe(3);
});

function signedArea(ring: readonly (readonly number[])[]): number {
  let area = 0;
  for (let index = 0; index < ring.length; index++) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}
