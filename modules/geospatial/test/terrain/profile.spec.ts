// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField, TerrainSampleStatus as Status} from '@math.gl/geospatial/terrain';
import {createTerrainSurface} from '@math.gl/geospatial/terrain/surface';
import {sampleTerrainProfile} from '@math.gl/geospatial/terrain/profile';

const plane = (x: number, y: number) => ({status: Status.VALID, height: 2 * x + 3 * y});

test('profiles preserve corners and endpoints with bounded per-segment spacing', () => {
  const path = [0, 0, 3, 0, 3, 4];
  const profile = sampleTerrainProfile(plane, path, {spacing: 2});
  expect(Array.from(profile.positions)).toEqual([0, 0, 1.5, 0, 3, 0, 3, 2, 3, 4]);
  expect(Array.from(profile.distances)).toEqual([0, 1.5, 3, 5, 7]);
  expect(profile.length).toBe(7);
  expect(Array.from(profile.heights)).toEqual([0, 3, 6, 12, 18]);
  expect(Array.from(profile.statuses)).toEqual([0, 0, 0, 0, 0]);
  profile.positions[0] = 999;
  expect(path[0]).toBe(0);
});

test('profiles handle repeated vertices, point paths, exact capacity and detached input', () => {
  expect(sampleTerrainProfile(plane, [1, 2], {spacing: 1}).length).toBe(0);
  expect(Array.from(sampleTerrainProfile(plane, [1, 2, 1, 2, 1, 2], {spacing: 1}).heights)).toEqual(
    [8]
  );
  const path = [0, 0, 2, 0];
  const result = sampleTerrainProfile(
    (x, y) => {
      path[2] = 100;
      return plane(x, y);
    },
    path,
    {spacing: 1, maxSamples: 3}
  );
  expect(Array.from(result.positions)).toEqual([0, 0, 1, 0, 2, 0]);
});

test('profiles use explicit field/surface interpolation policies and keep gaps', () => {
  const field = new HeightField({width: 2, height: 2, heights: Float64Array.from([0, 0, 0, 1])});
  const surface = createTerrainSurface(field);
  const bilinear = sampleTerrainProfile((x, y) => field.sample(x, y), [0, 0, 1, 1], {spacing: 1});
  const triangles = sampleTerrainProfile((x, y) => surface.sample(x, y), [0, 0, 1, 1], {
    spacing: 1
  });
  expect(bilinear.heights[1]).toBe(0.25);
  expect(triangles.heights[1]).toBe(0.5);
  const gaps = sampleTerrainProfile((x, y) => field.sample(x, y), [-1, 0, 2, 0], {spacing: 1});
  expect(Array.from(gaps.statuses)).toEqual([1, 0, 0, 1]);
  expect(gaps.heights[0]).toBe(0);
  const missing = sampleTerrainProfile(() => ({status: Status.NO_DATA, height: 123}), [0, 0], {
    spacing: 1
  });
  expect(missing.heights[0]).toBe(0);
  const numeric = sampleTerrainProfile(() => ({status: Status.VALID, height: Infinity}), [0, 0], {
    spacing: 1
  });
  expect(numeric.statuses[0]).toBe(Status.NUMERIC_ERROR);
});

test('profile admission fails before sampling and propagates sampler failures', () => {
  let calls = 0;
  const sample = (x: number, y: number) => {
    calls++;
    return plane(x, y);
  };
  for (const options of [
    {spacing: 0},
    {spacing: NaN},
    {spacing: -1},
    {spacing: 1, maxSamples: 1},
    {spacing: 1e-300},
    {spacing: 1, maxSamples: NaN}
  ])
    expect(() => sampleTerrainProfile(sample, [0, 0, 2, 0], options)).toThrow();
  for (const path of [[], [1], [0, NaN], [-1e308, 0, 1e308, 0], [0, 0, 1e20, 0, 1e20, 1]])
    expect(() => sampleTerrainProfile(sample, path, {spacing: 1e20})).toThrow();
  expect(calls).toBe(0);
  expect(() =>
    sampleTerrainProfile(() => ({status: 99 as never, height: 0}), [0, 0], {spacing: 1})
  ).toThrow(/status/);
  expect(() =>
    sampleTerrainProfile(
      () => {
        throw new Error('unavailable');
      },
      [0, 0],
      {spacing: 1}
    )
  ).toThrow(/unavailable/);
});

test('profiles reject sub-resolution points instead of silently repeating positions', () => {
  expect(() => sampleTerrainProfile(plane, [2 ** 54, 0, 2 ** 54 + 4, 0], {spacing: 1})).toThrow(
    /precision/
  );
});

test('a nonzero segment retains its endpoint even when distance divided by spacing underflows', () => {
  const profile = sampleTerrainProfile(plane, [0, 0, 1e-300, 0], {spacing: 1e300});
  expect(Array.from(profile.positions)).toEqual([0, 0, 1e-300, 0]);
  expect(profile.length).toBe(1e-300);
});
