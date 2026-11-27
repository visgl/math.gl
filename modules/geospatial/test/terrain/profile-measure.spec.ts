// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {sampleTerrainProfile, type TerrainProfile} from '@math.gl/geospatial/terrain';
import {measureTerrainProfile} from '@math.gl/geospatial/terrain';

function profile(distances: number[], heights: number[], statuses?: number[]): TerrainProfile {
  return {
    positions: Float64Array.from(distances.flatMap(x => [x, 0])),
    distances: Float64Array.from(distances),
    heights: Float64Array.from(heights),
    statuses: Uint8Array.from(statuses ?? heights.map(() => 0)),
    length: distances[distances.length - 1]
  };
}

test('profile measurements integrate the sampled linear surface with horizontal distance weights', () => {
  const result = measureTerrainProfile(profile([0, 4, 6], [0, 3, 1]));
  expect(result.length).toBe(6);
  expect(result.coveredLength).toBe(6);
  expect(result.missingLength).toBe(0);
  expect(result.ascent).toBe(3);
  expect(result.descent).toBe(2);
  expect(result.surfaceLength).toBe(5 + Math.sqrt(8));
  expect(result.heightIntegral).toBe(10);
  expect(result.meanHeight).toBeCloseTo(10 / 6, 14);
  expect(result.minimumHeight).toBe(0);
  expect(result.maximumHeight).toBe(3);
  expect(result.complete).toBe(true);
  expect(result.coveredSegmentCount).toBe(2);
  expect(result.missingSegmentCount).toBe(0);
  expect(result.validSampleCount).toBe(3);
});

test('gaps split covered runs rather than adding fabricated ascent, length or height integral', () => {
  const source = profile([0, 2, 4, 6, 8], [1, 3, 999, 5, 9], [0, 0, 2, 0, 0]);
  const result = measureTerrainProfile(source);
  expect(result.coveredLength).toBe(4);
  expect(result.missingLength).toBe(4);
  expect(result.ascent).toBe(6);
  expect(result.descent).toBe(0);
  expect(result.heightIntegral).toBe(18);
  expect(result.meanHeight).toBe(4.5);
  expect(result.minimumHeight).toBe(1);
  expect(result.maximumHeight).toBe(9);
  expect(result.coveredSegmentCount).toBe(2);
  expect(result.missingSegmentCount).toBe(2);
  expect(result.validSampleCount).toBe(4);
  expect(result.complete).toBe(false);
  expect(source.heights[2]).toBe(999);
});

test('single points, isolated valid samples and all missing samples remain explicit', () => {
  const point = measureTerrainProfile(profile([0], [7]));
  expect(point.complete).toBe(true);
  expect(point.minimumHeight).toBe(7);
  expect(point.meanHeight).toBeUndefined();
  expect(point.surfaceLength).toBe(0);
  const missing = measureTerrainProfile(profile([0], [NaN], [6]));
  expect(missing.complete).toBe(false);
  expect(missing.minimumHeight).toBeUndefined();
  expect(missing.maximumHeight).toBeUndefined();
  expect(missing.meanHeight).toBeUndefined();
  const isolated = measureTerrainProfile(profile([0, 1, 2], [0, 10, 0], [2, 0, 2]));
  expect(isolated.maximumHeight).toBe(10);
  expect(isolated.coveredLength).toBe(0);
  expect(isolated.missingLength).toBe(2);
  expect(isolated.meanHeight).toBeUndefined();
});

test('profile measurements compose with sampling without importing or resampling terrain', () => {
  let calls = 0;
  const sampled = sampleTerrainProfile(
    x => {
      calls++;
      return {status: 0, height: 2 * x + 3};
    },
    [0, 0, 4, 0],
    {spacing: 0.5}
  );
  const result = measureTerrainProfile(sampled);
  expect(calls).toBe(9);
  expect(result.ascent).toBe(8);
  expect(result.heightIntegral).toBe(28);
  expect(result.meanHeight).toBe(7);
  expect(result.surfaceLength).toBeCloseTo(Math.sqrt(80), 14);
});

test('weighted means remain defined when the unnormalized height integral underflows', () => {
  const tiny = measureTerrainProfile(profile([0, Number.MIN_VALUE], [0.1, 0.1]));
  expect(tiny.heightIntegral).toBe(0);
  expect(tiny.meanHeight).toBe(0.1);
  const small = measureTerrainProfile(profile([0, 1], [Number.MIN_VALUE, Number.MIN_VALUE]));
  expect(small.heightIntegral).toBe(Number.MIN_VALUE);
  expect(small.meanHeight).toBe(Number.MIN_VALUE);
  const opposite = measureTerrainProfile(
    profile([0, 0.125, 0.25, 0.375, 0.5], [-1e308, -1e308, NaN, 1e308, 1e308], [0, 0, 2, 0, 0])
  );
  expect(opposite.meanHeight).toBe(0);
  expect(opposite.heightIntegral).toBe(0);
});

test('profile measurements reject malformed metadata, exhausted admission and overflow', () => {
  const source = profile([0, 1, 2], [0, 1, 2]);
  expect(() => measureTerrainProfile(source, {maxSamples: 2})).toThrow();
  expect(() => measureTerrainProfile(source, {maxSamples: NaN})).toThrow();
  expect(measureTerrainProfile(source, {maxSamples: 3}).complete).toBe(true);
  for (const bad of [
    {...source, positions: new Float64Array(2)},
    {...source, heights: new Float64Array(2)},
    {...source, statuses: new Uint8Array(2)},
    {...source, length: 3},
    {...source, length: NaN},
    profile([1, 2], [0, 1]),
    profile([0, 1, 1], [0, 1, 2]),
    profile([0, 2, 1], [0, 1, 2]),
    profile([0, NaN, 2], [0, 1, 2]),
    profile([0, 1], [0, NaN]),
    profile([0, 1], [0, 1], [0, 99]),
    profile([], [])
  ])
    expect(() => measureTerrainProfile(bad)).toThrow();
  expect(() => measureTerrainProfile(profile([0, 1], [-1e308, 1e308]))).toThrow(/overflow/);
  expect(() => measureTerrainProfile(profile([0, 2], [1e308, 1e308]))).toThrow(/overflow/);
});

test('profile means use interval weights when a later interval dominates and heights are negative', () => {
  const result = measureTerrainProfile(profile([0, 1, 4], [-5, -3, -1]));
  expect(result.meanHeight).toBe(-2.5);
  expect(result.heightIntegral).toBe(-10);
  expect(result.coveredLength).toBe(4);
});

test('profile means retain contributions whose interval weights underflow', () => {
  for (const distance of [1e-100, 1e-10]) {
    const result = measureTerrainProfile(
      profile(
        [0, distance, 2 * distance, 3 * distance, 1e308],
        [1e308, 1e308, NaN, 0, 0],
        [0, 0, 2, 0, 0]
      )
    );
    expect(result.meanHeight! / distance).toBeCloseTo(1, 14);
    expect(result.heightIntegral / 1e308 / distance).toBeCloseTo(1, 14);
  }
});
