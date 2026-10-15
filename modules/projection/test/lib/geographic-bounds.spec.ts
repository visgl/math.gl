// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import type {GeographicBounds} from '../../src/experimental/types';
import {
  createAngularRanges,
  createGeographicBounds,
  normalizeLongitude,
  splitGeographicBounds,
  containsGeographicPoint,
  intersectGeographicBounds,
  clampGeographicPoint,
  getAngularRanges,
  getGeographicBounds
} from '../../src/experimental/geographic-bounds';

const world: GeographicBounds = [-180, -90, 180, 90];

test.each([
  [-540, -180],
  [-180, -180],
  [180, -180],
  [540, -180],
  [370, 10],
  [-370, -10],
  [0, 0]
])('normalizes longitude %s to %s', (input, output) => {
  expect(normalizeLongitude(input)).toBe(output);
});

test('constructs canonical coverage without losing the full-world interval', () => {
  expect(createGeographicBounds(170, -20, 190, 20)).toEqual([170, -20, -170, 20]);
  expect(createGeographicBounds(170, -20, -170, 20)).toEqual([170, -20, -170, 20]);
  expect(createGeographicBounds(350, -20, 370, 20)).toEqual([-10, -20, 10, 20]);
  expect(createGeographicBounds(0, -90, 360, 90)).toEqual(world);
  expect(createGeographicBounds(180, -20, 180, 20)).toEqual([-180, -20, -180, 20]);
  expect(() => createGeographicBounds(-180, -100, 180, 90)).toThrow('Invalid geographic coverage');
});

test('splits wrapped coverage while retaining ordered endpoint rectangles', () => {
  expect(splitGeographicBounds([170, -10, -170, 10])).toEqual([
    [170, -10, 180, 10],
    [-180, -10, -170, 10]
  ]);
  expect(splitGeographicBounds(world)).toEqual([world]);
});

test('membership recognizes dateline aliases, wrapped regions, poles and meridians', () => {
  for (const longitude of [-180, 180]) {
    expect(containsGeographicPoint([170, -10, -170, 10], [longitude, 0])).toBe(true);
    expect(containsGeographicPoint([170, -10, 180, 10], [longitude, 0])).toBe(true);
    expect(containsGeographicPoint([-180, -10, -180, 10], [longitude, 0])).toBe(true);
  }
  expect(containsGeographicPoint([170, -10, -170, 10], [0, 0])).toBe(false);
  expect(containsGeographicPoint(world, [0, 90])).toBe(true);
  expect(containsGeographicPoint([170, -10, -170, 10], [175, 11])).toBe(false);
});

test('intersections preserve disconnected longitude regions', () => {
  expect(intersectGeographicBounds([-170, -20, 170, 20], [10, -10, -10, 10])).toEqual([
    [-170, -10, -10, 10],
    [10, -10, 170, 10]
  ]);
  expect(intersectGeographicBounds(world, [170, -10, -170, 10])).toEqual([[170, -10, -170, 10]]);
  expect(intersectGeographicBounds([170, -10, -170, 10], [175, -5, -175, 5])).toEqual([
    [175, -5, -175, 5]
  ]);
  expect(intersectGeographicBounds([-10, -10, 10, 10], [20, -10, 30, 10])).toEqual([]);
  expect(intersectGeographicBounds([-10, -10, 10, 10], [-10, 20, 10, 30])).toEqual([]);
  expect(intersectGeographicBounds([0, -10, 10, 10], [10, 0, 20, 20])).toEqual([[10, 0, 10, 10]]);
  const seam = intersectGeographicBounds([170, -10, 180, 10], [-180, -5, -170, 5]);
  expect(seam.some(region => containsGeographicPoint(region, [180, 0]))).toBe(true);
});

const cases: GeographicBounds[] = [
  world,
  [-170, -20, 170, 20],
  [10, -10, -10, 10],
  [170, -10, -170, 10],
  [175, -5, -175, 5],
  [-180, 0, -180, 0],
  [180, 0, 180, 0],
  [-10, 10, 10, 10],
  [-10, 20, 10, 30],
  [170, -90, 180, 90]
];
for (const a of cases)
  for (const b of cases) {
    test(`intersection membership agrees for ${a} and ${b}`, () => {
      const intersection = intersectGeographicBounds(a, b);
      for (const longitude of [-180, -175, -170, -10, 0, 10, 170, 175, 180])
        for (const latitude of [-90, -20, -10, 0, 10, 20, 30, 90]) {
          const point: [number, number] = [longitude, latitude];
          expect(intersection.some(region => containsGeographicPoint(region, point))).toBe(
            containsGeographicPoint(a, point) && containsGeographicPoint(b, point)
          );
        }
    });
  }

test('clamping uses circular distance and preserves covered positions', () => {
  expect(clampGeographicPoint([170, -10, -170, 10], [-175, 20])).toEqual([-175, 10]);
  expect(clampGeographicPoint([6, 0, 12, 84], [-179, 40])).toEqual([12, 40]);
  expect(clampGeographicPoint(world, [540, 100])).toEqual([-180, 90]);
});

test('kernel range conversion preserves periodic coverage and applies the prime meridian explicitly', () => {
  const radians = Math.PI / 180;
  const ranges = getAngularRanges([170, -10, -170, 10], 2 * radians, 177 * radians);
  expect(ranges.longitude[0]).toBeCloseTo(168 * radians, 12);
  expect(ranges.longitude[1]).toBeCloseTo(188 * radians, 12);
  expect(getGeographicBounds(ranges, 2 * radians)).toEqual([170, -10, -170, 10]);
  expect(
    getGeographicBounds(createAngularRanges(0, -Math.PI / 2, 2 * Math.PI, Math.PI / 2))
  ).toEqual(world);
  const full = getAngularRanges(world, 0, 170 * radians);
  expect(full.longitude[0]).toBeCloseTo(-10 * radians, 12);
  expect(full.longitude[1]).toBeCloseTo(350 * radians, 12);
});
