// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getTerrainProfileHorizon,
  getTerrainProfileViewshed,
  TerrainProfileViewStatus as V,
  type TerrainProfile
} from '@math.gl/geospatial/terrain';
import {compareTerrainSlopes} from '@math.gl/geospatial/terrain/profile-slope';

test('near-tangent rays select the higher slope before angle rounding', () => {
  const p = profile([0, 101, 201.00000000000003]);
  expect(getTerrainProfileHorizon(p, {observerHeight: 1}).sampleIndex).toBe(2);
  expect(Array.from(getTerrainProfileViewshed(p, {observerHeight: 1}))).toEqual([
    V.OBSERVER,
    V.VISIBLE,
    V.VISIBLE
  ]);
});

test('slope comparisons preserve order through overflow, underflow and exact ties', () => {
  expect(compareTerrainSlopes(1e308, 0.5, 1e308, 1)).toBeGreaterThan(0);
  expect(compareTerrainSlopes(-1e308, 0.5, -1e308, 1)).toBeLessThan(0);
  expect(compareTerrainSlopes(Number.MIN_VALUE, 4, Number.MIN_VALUE, 2)).toBeLessThan(0);
  expect(compareTerrainSlopes(3, 6, 2, 4)).toBe(0);
  expect(compareTerrainSlopes(0, 1, -Number.MIN_VALUE, Number.MAX_VALUE)).toBeGreaterThan(0);
});

function profile(heights: number[], statuses = heights.map(() => 0)): TerrainProfile {
  return {
    positions: Float64Array.from(heights.flatMap((_, i) => [i, 0])),
    distances: Float64Array.from(heights.map((_, i) => i)),
    heights: Float64Array.from(heights),
    statuses: Uint8Array.from(statuses),
    length: heights.length - 1
  };
}

test('horizon selects the first maximum and viewshed identifies visible, blocked and tangent samples', () => {
  const p = profile([0, 2, 1, 4, 5]);
  const result = getTerrainProfileHorizon(p, {observerHeight: 1});
  expect(result).toEqual({
    angle: Math.atan2(1, 1),
    sampleIndex: 1,
    missingSampleCount: 0,
    complete: true
  });
  expect(Array.from(getTerrainProfileViewshed(p, {observerHeight: 1}))).toEqual([
    V.OBSERVER,
    V.VISIBLE,
    V.BLOCKED,
    V.BLOCKED,
    V.BLOCKED
  ]);
});

test('missing observations produce lower bounds and uncertain targets without concealing known blockers', () => {
  const p = profile([0, 3, 0, 2, 10], [0, 0, 2, 0, 0]);
  expect(getTerrainProfileHorizon(p, {observerHeight: 1})).toMatchObject({
    sampleIndex: 4,
    missingSampleCount: 1,
    complete: false
  });
  expect(Array.from(getTerrainProfileViewshed(p, {observerHeight: 1}))).toEqual([
    V.OBSERVER,
    V.VISIBLE,
    V.MISSING,
    V.BLOCKED,
    V.UNKNOWN
  ]);
  const missing = profile([0, 0, 0], [2, 2, 2]);
  expect(getTerrainProfileHorizon(missing, {observerHeight: 1})).toEqual({
    angle: undefined,
    sampleIndex: undefined,
    missingSampleCount: 3,
    complete: false
  });
  expect(Array.from(getTerrainProfileViewshed(missing, {observerHeight: 1}))).toEqual([
    V.OBSERVER,
    V.MISSING,
    V.MISSING
  ]);
});

test('viewshed agrees with an independent all-pairs slope comparison', () => {
  for (let seed = 0; seed < 30; seed++) {
    const p = profile(Array.from({length: 20}, (_, i) => (i ? Math.sin(i * (seed + 1)) * 5 : 0)));
    const actual = getTerrainProfileViewshed(p, {observerHeight: 2});
    for (let i = 1; i < p.heights.length; i++) {
      const targetSlope = (p.heights[i] - 2) / i;
      const blocked = Array.from({length: i - 1}, (_, j) => (p.heights[j + 1] - 2) / (j + 1)).some(
        slope => slope >= targetSlope
      );
      expect(actual[i]).toBe(blocked ? V.BLOCKED : V.VISIBLE);
    }
  }
});

test('invalid stationing, status, capacity, observer and arithmetic are rejected', () => {
  const p = profile([0, 1, 2]);
  expect(() => getTerrainProfileHorizon(p, {observerHeight: 0})).toThrow();
  expect(() => getTerrainProfileHorizon(p, {observerHeight: 1, maxSamples: 2})).toThrow();
  p.distances[1] = 0;
  expect(() => getTerrainProfileViewshed(p, {observerHeight: 1})).toThrow();
  p.distances[1] = 1;
  p.statuses[1] = 255;
  expect(() => getTerrainProfileHorizon(p, {observerHeight: 1})).toThrow();
  p.statuses[1] = 0;
  p.heights[1] = NaN;
  expect(() => getTerrainProfileHorizon(p, {observerHeight: 1})).toThrow();
  p.heights[0] = -Number.MAX_VALUE;
  p.heights[1] = -Number.MAX_VALUE;
  expect(() => getTerrainProfileHorizon(p, {observerHeight: Number.MAX_VALUE})).toThrow();
});
