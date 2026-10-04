// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {
  EllipsoidOccluder,
  getGlobeHorizonBounds,
  splitGlobeBounds,
  Ellipsoid
} from '@math.gl/geospatial';

const sphere = new EllipsoidOccluder([1, 1, 1]);

test('globe rays distinguish forward hits, misses, tangency and inside origins', () => {
  expect(sphere.intersectRay([3, 0, 0], [-2, 0, 0])).toEqual([1, 2]);
  expect(sphere.intersectRay([3, 0, 0], [1, 0, 0])).toBeUndefined();
  expect(sphere.intersectRay([3, 1, 0], [-1, 0, 0])).toEqual([3, 3]);
  expect(sphere.intersectRay([3, 1 + 1e-9, 0], [-1, 0, 0])).toBeUndefined();
  expect(sphere.intersectRay([0, 0, 0], [0, 0, 1])).toEqual([0, 1]);
  expect(sphere.intersectRay([1, 0, 0], [1, 0, 0])).toEqual([0, 0]);
  expect(sphere.intersectRay([3, 0, 0], [0, 0, 0])).toBeUndefined();
  const result = [17, 19];
  expect(sphere.intersectRay([3, 2, 0], [-1, 0, 0], result)).toBeUndefined();
  expect(result).toEqual([17, 19]);
  expect(sphere.intersectRay([3, 0, 0], [-1, 0, 0], result)).toBe(result);
  expect(result).toEqual([2, 4]);
});

test('ECEF-scale rays and translated triaxial ellipsoids preserve parameter units', () => {
  const earth = new EllipsoidOccluder(Array.from(Ellipsoid.WGS84.radii));
  const radius = earth.radii[0];
  const interval = earth.intersectRay(new Float64Array([radius + 1, 0, 0]), [-1, 0, 0])!;
  expect(interval[0]).toBeCloseTo(1, 8);
  expect(interval[1]).toBeCloseTo(2 * radius + 1, 7);
  const translated = new EllipsoidOccluder([2, 3, 4], [10, 20, 30]);
  expect(translated.intersectRay([14, 20, 30], [-2, 0, 0])).toEqual([1, 3]);
  expect(translated.isPointOccluded([14, 20, 30], [8, 20, 30])).toBe(true);
});

test('finite-segment occlusion handles surface anchors and elevated points', () => {
  expect(sphere.isPointOccluded([3, 0, 0], [1, 0, 0])).toBe(false);
  expect(sphere.isPointOccluded([3, 0, 0], [-1, 0, 0])).toBe(true);
  expect(sphere.isPointOccluded([3, 0, 0], [0, 2, 0])).toBe(false);
  expect(sphere.isPointOccluded([3, 0, 0], [-2, 0, 0])).toBe(true);
  expect(sphere.isPointOccluded([3, 1, 0], [-3, 1, 0])).toBe(false);
  expect(sphere.isPointOccluded([0, 0, 0], [0, 0, 0])).toBe(true);
  expect(sphere.isPointOccluded([3, 0, 0], [4, 0, 0])).toBe(false);
});

test('analytic horizon is on the ellipsoid and tangent from the camera', () => {
  const body = new EllipsoidOccluder([2, 3, 4], [7, 11, 13]);
  for (const camera of [
    [15, 17, 21],
    [7, 11, 25],
    [7, -1, 13]
  ]) {
    const horizon = body.getHorizon(camera)!;
    for (let i = 0; i < 100; i++) {
      const angle = (i * 2 * Math.PI) / 100;
      const point = horizon.center.map(
        (value, j) =>
          value + horizon.axis1[j] * Math.cos(angle) + horizon.axis2[j] * Math.sin(angle)
      );
      const q = point.map((value, j) => (value - body.center[j]) / body.radii[j]);
      expect(Math.hypot(...q)).toBeCloseTo(1, 12);
      const normal = q.map((value, j) => value / body.radii[j]);
      expect(normal.reduce((sum, value, j) => sum + value * (camera[j] - point[j]), 0)).toBeCloseTo(
        0,
        12
      );
      expect(body.isPointOccluded(camera, point)).toBe(false);
    }
  }
  expect(sphere.getHorizon([1, 0, 0])).toBeUndefined();
  expect(sphere.getHorizon([0, 0, 0])).toBeUndefined();
});

test('horizon bounds conservatively cover independently sampled visible sphere points', () => {
  for (const camera of [
    [2, 0, 0],
    [-2, 0.1, 0],
    [0.2, 0, 2],
    [0, 0, 2],
    [1.000001, 0, 0]
  ]) {
    const bounds = getGlobeHorizonBounds(camera, 1)!;
    const rectangles = splitGlobeBounds(bounds);
    for (let lat = -90; lat <= 90; lat += 3)
      for (let lng = -180; lng <= 180; lng += 3) {
        const phi = (lat * Math.PI) / 180,
          lambda = (lng * Math.PI) / 180;
        const point = [
          Math.cos(phi) * Math.cos(lambda),
          Math.cos(phi) * Math.sin(lambda),
          Math.sin(phi)
        ];
        // Independent surface visibility plane: dot(camera, surface) >= radius squared.
        if (point.reduce((sum, v, j) => sum + v * camera[j], 0) >= 1 + 1e-12)
          expect(
            rectangles.some(([w, s, e, n]) => lng >= w && lng <= e && lat >= s && lat <= n)
          ).toBe(true);
      }
  }
  expect(splitGlobeBounds([170, -10, -170, 10])).toEqual([
    [170, -10, 180, 10],
    [-180, -10, -170, 10]
  ]);
  const polarBounds = getGlobeHorizonBounds([0, 0, 2], 1)!;
  expect(polarBounds[0]).toBe(-180);
  expect(polarBounds[1]).toBeCloseTo(30, 8);
  expect(polarBounds[2]).toBe(180);
  expect(polarBounds[3]).toBe(90);
  expect(getGlobeHorizonBounds([1, 0, 0], 1)).toBeUndefined();
});

test('query configuration validates finite geometry and owns its input', () => {
  const radii = [1, 2, 3],
    center = [0, 0, 0];
  const body = new EllipsoidOccluder(radii, center);
  radii[0] = 9;
  center[0] = 9;
  expect(body.radii).toEqual([1, 2, 3]);
  expect(body.center).toEqual([0, 0, 0]);
  for (const bad of [
    [0, 1, 1],
    [NaN, 1, 1],
    [1, 2]
  ])
    expect(() => new EllipsoidOccluder(bad)).toThrow(RangeError);
  expect(() => sphere.intersectRay([Infinity, 0, 0], [1, 0, 0])).toThrow(RangeError);
  expect(() => sphere.isPointOccluded([2, 0, 0], [1, 0, 0], -1)).toThrow(RangeError);
  expect(() => getGlobeHorizonBounds([2, 0, 0], 0)).toThrow(RangeError);
  expect(() => splitGlobeBounds([180, 20, 0, -20])).toThrow(RangeError);
});

test('scaled ray queries are invariant under direction magnitude and body units', () => {
  for (const radius of [1, 256, 6371000]) {
    const body = new EllipsoidOccluder([radius, radius, radius]);
    for (const magnitude of [1e-6, 1, 1e6]) {
      const hit = body.intersectRay([3 * radius, 0, 0], [-magnitude, 0, 0])!;
      expect((hit[0] * magnitude) / radius).toBeCloseTo(2, 12);
      expect((hit[1] * magnitude) / radius).toBeCloseTo(4, 12);
      expect(body.intersectRay([3 * radius, 1.01 * radius, 0], [-magnitude, 0, 0])).toBeUndefined();
    }
  }
});
