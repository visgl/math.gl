// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {subdivideGeodesicPolyline} from '@math.gl/geospatial';
import {Ellipsoid, EllipsoidGeodesic, GeodesicPath} from '@math.gl/geospatial';
import {subdividePolyline} from '@math.gl/geometry';

const radius = 1000;
const geodesic = new EllipsoidGeodesic({semiMajorAxis: radius, semiMinorAxis: radius});
function xyz(point: readonly number[]): number[] {
  const longitude = (point[0] * Math.PI) / 180;
  const latitude = (point[1] * Math.PI) / 180;
  const r = radius + (point[2] || 0);
  return [
    r * Math.cos(latitude) * Math.cos(longitude),
    r * Math.cos(latitude) * Math.sin(longitude),
    r * Math.sin(latitude)
  ];
}

function sphericalSample(a: number[], b: number[], t: number): number[] {
  const angle = Math.acos(
    Math.min(1, Math.max(-1, a.reduce((sum, value, i) => sum + value * b[i], 0) / radius ** 2))
  );
  return a.map(
    (value, i) => (Math.sin((1 - t) * angle) * value + Math.sin(t * angle) * b[i]) / Math.sin(angle)
  );
}

test('Geodesic subdivision meets dense independent spherical sagitta checks', () => {
  const input = [-45, 60, 45, 60];
  const tolerance = 0.1;
  const result = subdivideGeodesicPolyline(input, {
    geodesic,
    transform: xyz,
    targetSize: 3,
    tolerance
  });
  const first = xyz(input.slice(0, 2));
  const last = xyz(input.slice(2));
  expect(result.segmentIndices.length).toBeGreaterThan(2);
  for (let i = 0; i < result.segmentFractions.length - 1; i++) {
    const start = result.segmentFractions[i];
    const end = result.segmentFractions[i + 1];
    for (let j = 0; j <= 20; j++) {
      const t = j / 20;
      const exact = sphericalSample(first, last, start * (1 - t) + end * t);
      const interpolated = exact.map(
        (_value, axis) =>
          result.positions[i * 3 + axis] * (1 - t) + result.positions[(i + 1) * 3 + axis] * t
      );
      expect(
        Math.hypot(...interpolated.map((value, axis) => value - exact[axis]))
      ).toBeLessThanOrEqual(tolerance + 1e-10);
    }
  }
  const linear = subdividePolyline(input, {transform: xyz, targetSize: 3, tolerance});
  expect(
    Array.from(linear.sourcePositions)
      .filter((_v, i) => i % 2 === 1)
      .every(v => v === 60)
  ).toBe(true);
  expect(Array.from(result.sourcePositions).some((v, i) => i % 2 === 1 && v > 67)).toBe(true);
});

test('Surface-distance bounds, height and attributes retain original-edge attribution', () => {
  const input = new Float64Array([170, 0, 0, -170, 0, 100, -150, 0, 200]);
  const original = Array.from(input);
  const result = subdivideGeodesicPolyline(input, {
    geodesic,
    size: 3,
    transform: xyz,
    tolerance: 1e6,
    maxSurfaceDistance: 100
  });
  expect(Array.from(input)).toEqual(original);
  expect(Array.from(result.sourcePositions.slice(-3))).toEqual([210, 0, 200]);
  expect(Array.from(result.segmentFractions).filter(t => t === 1)).toHaveLength(2);
  for (let i = 0; i < result.segmentIndices.length; i++) {
    const edge = result.segmentIndices[i];
    const fraction = result.segmentFractions[i];
    expect(result.sourcePositions[i * 3]).toBeCloseTo(170 + 20 * (edge + fraction), 11);
    expect(result.sourcePositions[i * 3 + 2]).toBeCloseTo(100 * (edge + fraction), 11);
    // An external color/time attribute can use the same original edge fraction.
    const colors = [10, 50, 90];
    expect(colors[edge] * (1 - fraction) + colors[edge + 1] * fraction).toBeCloseTo(
      10 + 40 * (edge + fraction),
      12
    );
    if (i > 0) {
      const previousFraction =
        result.segmentIndices[i - 1] === edge ? result.segmentFractions[i - 1] : 0;
      expect(((fraction - previousFraction) * radius * 20 * Math.PI) / 180).toBeLessThanOrEqual(
        100
      );
    }
  }
});

test('A surface-distance bound forces refinement even for straight geographic output', () => {
  const result = subdivideGeodesicPolyline([0, 0, 90, 0], {
    geodesic,
    transform: p => p,
    tolerance: 1,
    maxSurfaceDistance: (radius * Math.PI) / 8
  });
  expect(Array.from(result.sourcePositions)).toEqual([0, 0, 22.5, 0, 45, 0, 67.5, 0, 90, 0]);
  expect(Array.from(result.segmentFractions)).toEqual([0, 0.25, 0.5, 0.75, 1]);
});

test('Default WGS84, polar and nearly antipodal paths stay finite through ECEF transforms', () => {
  for (const input of [
    [170, 70, -170, 75],
    [0, 0, 179.99999, 0.00001],
    [0, 90, 100, -89.9],
    [0, 0, 180, 0]
  ]) {
    const result = subdivideGeodesicPolyline(input, {
      transform: p => Ellipsoid.WGS84.cartographicToCartesian([p[0], p[1], 0]),
      targetSize: 3,
      tolerance: 1000,
      maxSurfaceDistance: 1e6
    });
    expect(result.positions.every(Number.isFinite)).toBe(true);
    expect(result.segmentFractions[0]).toBe(0);
    expect(result.segmentFractions[result.segmentFractions.length - 1]).toBe(1);
  }
});

test('Geodesic adapter preserves empty/singleton/closed/vertical paths and isolates transforms', () => {
  const identity = (p: readonly number[]) => p;
  expect(subdivideGeodesicPolyline([], {transform: identity, tolerance: 1}).positions.length).toBe(
    0
  );
  expect(
    Array.from(
      subdivideGeodesicPolyline([20, 30, 5], {transform: identity, size: 3, tolerance: 1}).positions
    )
  ).toEqual([20, 30, 5]);
  const vertical = subdivideGeodesicPolyline([20, 30, 5, 20, 30, 15], {
    transform: identity,
    size: 3,
    tolerance: 1
  });
  expect(Array.from(vertical.sourcePositions)).toEqual([20, 30, 5, 20, 30, 15]);
  const closed = subdivideGeodesicPolyline([0, 0, 10, 0, 0, 0], {
    transform: identity,
    tolerance: 1
  });
  expect(Array.from(closed.sourcePositions.slice(-2))).toEqual([0, 0]);
  const result = subdivideGeodesicPolyline([0, 0, 10, 0], {
    transform: p => {
      (p as number[])[0] += 100;
      return p;
    },
    tolerance: 1
  });
  expect(Array.from(result.sourcePositions)).toEqual([0, 0, 10, 0]);
  expect(Array.from(result.positions)).toEqual([100, 0, 110, 0]);
});

test('Invalid paths, transforms and limits fail without partial geometry or input mutation', () => {
  const options = {geodesic, transform: xyz, targetSize: 3 as const, tolerance: 0.001};
  const input = Object.freeze([-45, 60, 45, 60]);
  expect(() => subdivideGeodesicPolyline(input, {...options, maxDepth: 0})).toThrow(/maxDepth/);
  expect(() => subdivideGeodesicPolyline(input, {...options, maxVertices: 2})).toThrow(
    /maxVertices/
  );
  for (const maxSurfaceDistance of [0, -1, NaN])
    expect(() => subdivideGeodesicPolyline(input, {...options, maxSurfaceDistance})).toThrow(
      RangeError
    );
  for (const invalid of [
    [0, 91],
    [NaN, 0],
    [0, 0, 1]
  ])
    expect(() => subdivideGeodesicPolyline(invalid, options)).toThrow(RangeError);
  expect(() => subdivideGeodesicPolyline(input, {...options, transform: () => null})).toThrow(
    RangeError
  );
  expect(() =>
    subdivideGeodesicPolyline(input, {...options, transform: () => [Infinity, 0, 0]})
  ).toThrow(RangeError);
  const rejection = new Error('projection seam');
  expect(() =>
    subdivideGeodesicPolyline(input, {
      ...options,
      transform: () => {
        throw rejection;
      }
    })
  ).toThrow(rejection);
});

test('Reusable path integrates directly with the generic source-edge factory', () => {
  let setups = 0;
  const result = subdividePolyline([-45, 60, 45, 60], {
    transform: xyz,
    targetSize: 3,
    tolerance: 0.1,
    createEdgeSampler: (start, end) => {
      setups++;
      return new GeodesicPath(start, end, {geodesic});
    }
  });
  expect(setups).toBe(1);
  expect(result.segmentIndices.length).toBeGreaterThan(2);
});
