// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parseTWKB, writeTWKB, type WellKnownGeometry} from '../../src/twkb';

test('TWKB reads and writes spec-derived point bytes with independent M precision', () => {
  const geometry = {type: 'Point', coordinates: [1, -2, 0.25]} as const;
  // XY precision 0, extended M at precision 2, signed ordinates 1, -2, 25.
  const bytes = Uint8Array.of(0x01, 0x08, 0x42, 0x02, 0x03, 0x32);
  expect(writeTWKB(geometry, {precision: 0, mPrecision: 2, dimension: 'xym'})).toEqual(bytes);
  const padded = Uint8Array.of(0xff, ...bytes, 0xff);
  expect(parseTWKB(padded.subarray(1, -1))).toEqual({geometry, dimension: 'xym'});
});

test('TWKB interoperates with the published PostGIS linestring example', () => {
  // https://postgis.net/docs/ST_AsTWKB.html
  const bytes = Uint8Array.of(2, 0, 2, 2, 2, 8, 8);
  const geometry = {
    type: 'LineString',
    coordinates: [
      [1, 1],
      [5, 5]
    ]
  } as const;
  expect(parseTWKB(bytes)).toEqual({geometry, dimension: 'xy'});
  expect(writeTWKB(geometry, {precision: 0})).toEqual(bytes);
});

test('TWKB preserves deltas beyond 32 bits and per-child dimensions', () => {
  const geometry: WellKnownGeometry = {
    type: 'GeometryCollection',
    geometries: [
      {
        type: 'LineString',
        coordinates: [
          [-1e8, 2],
          [1e8, 3]
        ]
      },
      {type: 'Point', coordinates: [1, 2, 3]},
      {type: 'Polygon', coordinates: []}
    ]
  };
  const result = parseTWKB(writeTWKB(geometry));
  expect(result.geometry).toEqual(geometry);
  expect(result.children?.map(child => child.dimension)).toEqual(['xy', 'xyz', 'xy']);
});

test('TWKB decodes size, bounds, component IDs and implicit polygon closure', () => {
  // MultiPoint with a size, bounding box, one ID and a single point.
  const bytes = Uint8Array.of(4, 7, 8, 2, 0, 4, 0, 1, 14, 2, 4);
  expect(parseTWKB(bytes).geometry).toEqual({type: 'MultiPoint', coordinates: [[1, 2]]});

  const polygon = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [0, 0]
      ]
    ]
  } as const;
  const encoded = Uint8Array.of(3, 0, 1, 3, 0, 0, 2, 0, 1, 2);
  expect(writeTWKB(polygon, {precision: 0})).toEqual(encoded);
  expect(parseTWKB(encoded).geometry).toEqual(polygon);
});

test('TWKB rejects malformed inputs and unrepresentable coordinates', () => {
  expect(() => parseTWKB(Uint8Array.of(1, 0, 2))).toThrow(/Unexpected end/);
  expect(() => parseTWKB(Uint8Array.of(1, 2, 3, 2, 2, 0))).toThrow(/size mismatch/);
  expect(() => parseTWKB(Uint8Array.of(1, 16, 0))).toThrow(/trailing bytes/);
  expect(() => parseTWKB(Uint8Array.of(1, 0, ...Array(10).fill(255)))).toThrow(/64 bits/);
  expect(() => writeTWKB({type: 'Point', coordinates: [1e15, 0]})).toThrow(/safe integer/);
  expect(() => writeTWKB({type: 'Point', coordinates: [1, 2]}, {precision: 8})).toThrow(
    /precision/
  );
});
