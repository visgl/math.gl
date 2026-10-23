// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GeodesicPath, EllipsoidGeodesic} from '@math.gl/geospatial/ellipsoid';
import reference from './geodesic-path-reference.json';

const sphere = new EllipsoidGeodesic({semiMajorAxis: 10, semiMinorAxis: 10});

function cartesian(point: ArrayLike<number>, radius = 1): number[] {
  const longitude = (point[0] * Math.PI) / 180;
  const latitude = (point[1] * Math.PI) / 180;
  return [
    radius * Math.cos(latitude) * Math.cos(longitude),
    radius * Math.cos(latitude) * Math.sin(longitude),
    radius * Math.sin(latitude)
  ];
}

test('GeodesicPath samples match 180 pinned native PROJ path controls', () => {
  for (const row of reference.cases) {
    const geodesic = new EllipsoidGeodesic({
      semiMajorAxis: row.axes[0],
      semiMinorAxis: row.axes[1]
    });
    const path = new GeodesicPath(row.start, row.end, {geodesic});
    expect(Math.abs(path.length - row.distance)).toBeLessThan(1e-7);
    const actual = path.sample(row.fraction);
    const expectedXYZ = cartesian(row.position, row.axes[0]);
    const actualXYZ = cartesian(actual, row.axes[0]);
    expect(Math.hypot(...actualXYZ.map((value, i) => value - expectedXYZ[i]))).toBeLessThan(1e-6);
    if (Math.abs(row.position[1]) < 89.99) {
      expect(Math.abs(actual[0] - row.position[0])).toBeLessThan(1e-9);
      expect(Math.abs(actual[1] - row.position[1])).toBeLessThan(1e-9);
    }
    expect(path.sampleByDistance(row.fraction * path.length)).toEqual(actual);
  }
});

test('GeodesicPath matches independent spherical interpolation, not linear latitude', () => {
  const path = new GeodesicPath([-45, 60], [45, 60], {geodesic: sphere});
  const a = cartesian([-45, 60]);
  const b = cartesian([45, 60]);
  const angle = Math.acos(a.reduce((sum, value, i) => sum + value * b[i], 0));
  expect(path.length).toBeCloseTo(10 * angle, 13);
  for (const fraction of [0.1, 0.25, 0.5, 0.8]) {
    const xyz = cartesian(path.sample(fraction));
    for (let i = 0; i < 3; i++) {
      const exact =
        (Math.sin((1 - fraction) * angle) * a[i] + Math.sin(fraction * angle) * b[i]) /
        Math.sin(angle);
      expect(xyz[i]).toBeCloseTo(exact, 14);
    }
  }
  expect(path.sample(0.5)[1]).toBeGreaterThan(67);
});

test('GeodesicPath preserves snapshots, unrolls the dateline and interpolates heights', () => {
  const start = [170, 0, 10];
  const end = [-170, 0, 30];
  const path = new GeodesicPath(start, end, {geodesic: sphere});
  start.fill(0);
  end.fill(0);
  path.start.fill(0);
  path.end.fill(0);
  expect(path.sample(0)).toEqual([170, 0, 10]);
  expect(path.sample(1)).toEqual([190, 0, 30]);
  const output = new Float64Array(3);
  expect(path.sample(0.5, output)).toBe(output);
  expect(Array.from(output)).toEqual([180, 0, 20]);
  expect(path.length).toBeCloseTo((10 * Math.PI) / 9, 13);
  const reverse = new GeodesicPath([-170, 0], [170, 0], {geodesic: sphere});
  expect(reverse.sample(1)).toEqual([-190, 0]);
});

test('Zero-length horizontal paths retain fraction-based height and distance zero selects start', () => {
  const path = new GeodesicPath([20, 30, 5], [20, 30, 15]);
  expect(path.length).toBe(0);
  expect(path.sample(0.5)).toEqual([20, 30, 10]);
  expect(path.sample(1)).toEqual([20, 30, 15]);
  expect(path.sampleByDistance(0)).toEqual([20, 30, 5]);
});

test('Path validation is atomic, including undersized and float32 outputs', () => {
  for (const point of [[0, 91], [NaN, 0], [0, 0, Infinity], [0]]) {
    expect(() => new GeodesicPath(point, [1, 1])).toThrow(RangeError);
  }
  expect(() => new GeodesicPath([0, 0], [1, 1, 0])).toThrow(RangeError);
  const path = new GeodesicPath([0, 0, 1e100], [1, 0, 1e100]);
  const result = new Float32Array([7, 8, 9]);
  expect(() => path.sample(0.5, result)).toThrow(RangeError);
  expect(Array.from(result)).toEqual([7, 8, 9]);
  for (const fraction of [-1, 1.01, NaN, Infinity])
    expect(() => path.sample(fraction)).toThrow(RangeError);
  for (const distance of [-1, path.length + 1, NaN])
    expect(() => path.sampleByDistance(distance)).toThrow(RangeError);
  expect(() => path.sample(0.5, new Float64Array(2))).toThrow(RangeError);
});
