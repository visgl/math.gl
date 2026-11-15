// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createTerrainRegionalViewshed,
  TerrainRegionalViewStatus as View,
  TerrainSampleStatus as Sample
} from '@math.gl/geospatial/terrain';

test('regional coverage keeps missing targets, unknown paths and known blockers distinct', () => {
  const result = createTerrainRegionalViewshed(
    {width: 5, height: 2, origin: [0, 0], spacing: [1, 1]},
    (x, y) => {
      if (x === 1 && y === 0) return {status: Sample.NOT_RESIDENT, height: 0};
      if (x === 3 && y === 0) return {status: Sample.NO_DATA, height: 0};
      return {status: Sample.VALID, height: x === 2 && y === 0 ? 6 : 0};
    },
    {observer: [0, 0, 2], targetOffset: 1, sampleStep: 1}
  );
  expect([...result.statuses.slice(0, 5)]).toEqual([
    View.OBSERVER,
    View.MISSING_TARGET,
    View.UNKNOWN,
    View.MISSING_TARGET,
    View.BLOCKED
  ]);
  expect(result.statuses[5]).toBe(View.VISIBLE);
  expect(result.targetStatuses[1]).toBe(Sample.NOT_RESIDENT);
  expect(result.targetStatuses[3]).toBe(Sample.NO_DATA);
  expect(result.sampledCoverage[4]).toBe(0);
});

test('touching a sampled station blocks and missing observer coverage stays unknown', () => {
  const grid = {width: 1, height: 1, origin: [2, 0], spacing: [1, 1]} as const;
  const options = {observer: [0, 0, 1], targetOffset: 1, sampleStep: 1} as const;
  expect(
    createTerrainRegionalViewshed(
      grid,
      x => ({
        status: Sample.VALID,
        height: x === 1 ? 1 : 0
      }),
      options
    ).statuses[0]
  ).toBe(View.BLOCKED);
  expect(
    createTerrainRegionalViewshed(
      grid,
      x => ({
        status: x === 0 ? Sample.OUTSIDE_DOMAIN : Sample.VALID,
        height: 0
      }),
      options
    ).statuses[0]
  ).toBe(View.UNKNOWN);
});

test('spherical classification agrees with the independent chord–sphere horizon', () => {
  const radius = 6_371_000;
  for (const elevation of [2, 125, 2_000]) {
    // Equal-height endpoints yield a chord whose minimum radius is at its midpoint.
    const horizon = 2 * radius * Math.acos(radius / (radius + elevation));
    for (const scale of [0.99, 1.01]) {
      const distance = horizon * scale;
      for (const [dx, dy] of [
        [distance, 0],
        [distance * 0.6, distance * 0.8]
      ]) {
        const grid = {width: 1, height: 1, origin: [dx, dy], spacing: [1, 1]} as const;
        const sample = () => ({status: Sample.VALID, height: 0});
        const options = {
          observer: [0, 0, elevation],
          targetOffset: elevation,
          sampleStep: distance * 0.6
        } as const;
        const clearance = (radius + elevation) * Math.cos(distance / (2 * radius)) - radius;
        expect(createTerrainRegionalViewshed(grid, sample, {...options, radius}).statuses[0]).toBe(
          clearance > 0 ? View.VISIBLE : View.BLOCKED
        );
        expect(createTerrainRegionalViewshed(grid, sample, options).statuses[0]).toBe(View.VISIBLE);
      }
    }
  }
});

test('invalid coverage and budgets are rejected with bounded callback work', () => {
  const grid = {width: 1, height: 1, origin: [2, 0], spacing: [1, 1]} as const;
  const options = {observer: [0, 0, 1], sampleStep: 0.01, maxSamples: 2} as const;
  let calls = 0;
  expect(() =>
    createTerrainRegionalViewshed(
      grid,
      () => {
        calls++;
        return {status: Sample.VALID, height: 0};
      },
      options
    )
  ).toThrow(/budget/);
  expect(calls).toBe(2);
  expect(() =>
    createTerrainRegionalViewshed(
      grid,
      () => ({
        status: Sample.VALID,
        height: NaN
      }),
      options
    )
  ).toThrow(/sample/);
  expect(() =>
    createTerrainRegionalViewshed(
      grid,
      () => ({
        status: Sample.VALID,
        height: 0
      }),
      {...options, sampleStep: 0}
    )
  ).toThrow(/options/);
});

test('unequal endpoints agree with independent radial chord intersections', () => {
  const radius = 1000;
  const eye = 40;
  const target = 10;
  const horizon =
    radius * (Math.acos(radius / (radius + eye)) + Math.acos(radius / (radius + target)));
  for (const distance of [0.95 * horizon, 1.05 * horizon]) {
    const theta = distance / radius;
    const a = [0, radius + eye];
    const b = [(radius + target) * Math.sin(theta), (radius + target) * Math.cos(theta)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const closest = -(a[0] * dx + a[1] * dy) / (dx * dx + dy * dy);
    const clearance = Math.hypot(a[0] + closest * dx, a[1] + closest * dy) - radius;
    const result = createTerrainRegionalViewshed(
      {width: 1, height: 1, origin: [distance, 0], spacing: [1, 1]},
      () => ({height: 0, status: Sample.VALID}),
      {observer: [0, 0, eye], targetOffset: target, radius, sampleStep: distance / 64}
    );
    expect(result.statuses[0]).toBe(clearance > 0 ? View.VISIBLE : View.BLOCKED);
    expect(result.sampledCoverage[0]).toBe(1);
  }
});
