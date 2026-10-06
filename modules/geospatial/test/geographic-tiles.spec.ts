// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {
  getGeographicTile,
  getGeographicTileBounds,
  getGeographicTileRanges
} from '@math.gl/geospatial';

test('geographic tile bounds and point ownership', () => {
  expect(getGeographicTileBounds({x: 0, y: 0, level: 0})).toEqual([-180, -90, 180, 90]);
  expect(getGeographicTileBounds({x: 1, y: 0, level: 1})).toEqual([0, 0, 180, 90]);
  expect(getGeographicTile(0, 0, 1)).toEqual({x: 1, y: 1, level: 1});
  expect(getGeographicTile(180, -90, 30)).toEqual({x: 2 ** 30 - 1, y: 2 ** 30 - 1, level: 30});
  for (let level = 0; level <= 5; level++) {
    for (let y = 0; y < 2 ** level; y++)
      for (let x = 0; x < 2 ** level; x++) {
        const [w, s, e, n] = getGeographicTileBounds({x, y, level});
        expect(getGeographicTile((w + e) / 2, (s + n) / 2, level)).toEqual({x, y, level});
        expect(getGeographicTileRanges([w, s, e, n], level)).toEqual([
          {minX: x, maxX: x, minY: y, maxY: y}
        ]);
      }
  }
});

test('compact ranges split the antimeridian and deduplicate coarse levels', () => {
  expect(getGeographicTileRanges([170, -10, -170, 10], 3)).toEqual([
    {minX: 0, maxX: 0, minY: 3, maxY: 4},
    {minX: 7, maxX: 7, minY: 3, maxY: 4}
  ]);
  expect(getGeographicTileRanges([170, -10, -170, 10], 0)).toEqual([
    {minX: 0, maxX: 0, minY: 0, maxY: 0}
  ]);
  expect(getGeographicTileRanges([-180, -90, 180, 90], 30)).toEqual([
    {minX: 0, maxX: 2 ** 30 - 1, minY: 0, maxY: 2 ** 30 - 1}
  ]);
  expect(getGeographicTileRanges([0, 0, 0, 0], 1)).toEqual([{minX: 1, maxX: 1, minY: 1, maxY: 1}]);
});

test('range candidates agree with positive-area overlap of exhaustive tile bounds', () => {
  const queries = [
    [-123, -42, 56, 71],
    [156, -90, -145, 90],
    [-180, 45, 0, 90],
    [0, -90, 180, 0]
  ];
  for (const q of queries)
    for (let level = 0; level <= 4; level++) {
      const ranges = getGeographicTileRanges(q as [number, number, number, number], level);
      for (let y = 0; y < 2 ** level; y++)
        for (let x = 0; x < 2 ** level; x++) {
          const [w, s, e, n] = getGeographicTileBounds({x, y, level});
          const longitudeOverlap = q[0] <= q[2] ? e > q[0] && w < q[2] : e > q[0] || w < q[2];
          const expected = longitudeOverlap && n > q[1] && s < q[3];
          expect(ranges.some(r => x >= r.minX && x <= r.maxX && y >= r.minY && y <= r.maxY)).toBe(
            expected
          );
        }
    }
});

test('wrapped seam fragments do not add edge-only neighbors', () => {
  expect(getGeographicTileRanges([180, 0, -170, 10], 3)).toEqual([
    {minX: 0, maxX: 0, minY: 3, maxY: 3}
  ]);
  expect(getGeographicTileRanges([170, 0, -180, 10], 3)).toEqual([
    {minX: 7, maxX: 7, minY: 3, maxY: 3}
  ]);
});

test('invalid coordinates, levels and bounds are rejected', () => {
  for (const level of [-1, 31, 0.5, NaN, Infinity])
    expect(() => getGeographicTile(0, 0, level)).toThrow(RangeError);
  for (const [longitude, latitude] of [
    [181, 0],
    [-181, 0],
    [0, 91],
    [0, -91],
    [NaN, 0]
  ])
    expect(() => getGeographicTile(longitude, latitude, 1)).toThrow(RangeError);
  for (const tile of [
    {x: -1, y: 0, level: 1},
    {x: 2, y: 0, level: 1},
    {x: 0, y: 0.5, level: 1}
  ])
    expect(() => getGeographicTileBounds(tile)).toThrow(RangeError);
  expect(() => getGeographicTileRanges([0, 10, 0, -10], 1)).toThrow(RangeError);
});
