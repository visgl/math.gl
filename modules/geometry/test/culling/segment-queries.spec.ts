// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getClosestPointsOnSegments,
  getClosestPointsSegmentTriangle,
  getClosestPointOnTriangle
} from '@math.gl/geometry/culling';

const triangle = [
  [0, 0, 0],
  [4, 0, 0],
  [0, 4, 0]
] as const;

test('segment pairs include skew interior minima, parallel overlaps, caps and zero lengths', () => {
  for (const [a0, a1, b0, b1, distance, fractionA, fractionB] of [
    [[-1, 0, 0], [1, 0, 0], [0, -1, 1], [0, 1, 1], 1, 0.5, 0.5],
    [[0, 0, 0], [2, 0, 0], [1, 1, 0], [3, 1, 0], 1, 0.5, 0],
    [[0, 0, 0], [1, 0, 0], [2, 1, 0], [3, 1, 0], Math.SQRT2, 1, 0],
    [[0, 0, 0], [0, 0, 0], [-1, 1, 0], [1, 1, 0], 1, 0, 0.5],
    [[0, 0, 0], [1, 0, 0], [0.5, 1, 0], [0.5, 1, 0], 1, 0.5, 0],
    [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], 0, 0, 0]
  ] as const) {
    const pair = getClosestPointsOnSegments(a0, a1, b0, b1);
    expect(pair.distance).toBeCloseTo(distance, 14);
    expect(pair.fractionA).toBeCloseTo(fractionA, 14);
    expect(pair.fractionB).toBeCloseTo(fractionB, 14);
    expect(Math.hypot(...pair.pointA.map((value, axis) => value - pair.pointB[axis]))).toBe(
      pair.distance
    );
    expect(getClosestPointsOnSegments(b0, b1, a0, a1).distance).toBeCloseTo(distance, 14);
  }
});

test('segment/triangle covers face crossing, coplanar overlap, endpoint/edge/vertex and degenerate minima', () => {
  for (const [start, end, distance, fraction, point] of [
    [[1, 1, 2], [1, 1, -2], 0, 0.5, [1, 1, 0]],
    [[-4, 2, 0], [4, 2, 0], 0, 0.5, [0, 2, 0]],
    [[1, 1, 2], [2, 1, 2], 2, 0, [1, 1, 0]],
    [[2, -2, 1], [2, 2, 1], 1, 0.5, [2, 0, 0]],
    [[-1, -1, 2], [-1, -1, -2], Math.SQRT2, 0.5, [0, 0, 0]],
    [[1, 1, 2], [1, 1, 2], 2, 0, [1, 1, 0]]
  ] as const) {
    const pair = getClosestPointsSegmentTriangle(start, end, ...triangle);
    expect(pair.distance).toBeCloseTo(distance, 13);
    expect(pair.segmentFraction).toBeCloseTo(fraction, 13);
    pair.trianglePoint.forEach((value, axis) => expect(value).toBeCloseTo(point[axis], 13));
  }
  expect(
    getClosestPointsSegmentTriangle([0, 0, 0], [2, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0])
  ).toMatchObject({distance: 0, segmentFraction: 0.5});
  expect(
    getClosestPointsSegmentTriangle([1, -1, 1], [1, 1, 1], [0, 0, 0], [2, 0, 0], [1, 0, 0])
  ).toMatchObject({distance: 1, segmentFraction: 0.5});
});

test('segment kernels retain uniformly tiny/large geometry and near-parallel intersections', () => {
  for (const scale of [1e-150, 1, 1e150]) {
    const scaled = (point: readonly number[]) => point.map(value => value * scale);
    const pair = getClosestPointsOnSegments(
      scaled([-1, 0, 0]),
      scaled([1, 0, 0]),
      scaled([-1, -1e-10, 0]),
      scaled([1, 1e-10, 0])
    );
    expect(pair.distance / scale).toBeLessThan(1e-14);
    expect(pair.fractionA).toBeCloseTo(0.5, 13);
    const result = getClosestPointsSegmentTriangle(
      scaled([1, 1, 2]),
      scaled([2, 1, 2]),
      scaled(triangle[0]),
      scaled(triangle[1]),
      scaled(triangle[2])
    );
    expect(result.distance / scale).toBeCloseTo(2, 13);
  }
  expect(() => getClosestPointsOnSegments([NaN, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0])).toThrow();
  expect(() =>
    getClosestPointsSegmentTriangle([-1e308, 0, 0], [1e308, 0, 0], ...triangle)
  ).toThrow();
});

test('segment/triangle distances satisfy independently sampled point-distance bounds', () => {
  for (let i = 0; i < 60; i++) {
    const start = [Math.sin(i * 2.1) * 5, Math.cos(i * 1.3) * 5, Math.sin(i * 0.7) * 3];
    const end = [Math.cos(i * 0.9) * 5, Math.sin(i * 1.7) * 5, Math.cos(i * 1.1) * 3];
    const pair = getClosestPointsSegmentTriangle(start, end, ...triangle);
    let sampled = Infinity;
    const steps = 200;
    for (let j = 0; j <= steps; j++) {
      const point = start.map((value, axis) => value + ((end[axis] - value) * j) / steps);
      const closest = getClosestPointOnTriangle(point, ...triangle);
      sampled = Math.min(sampled, Math.hypot(...point.map((value, axis) => value - closest[axis])));
    }
    expect(pair.distance).toBeLessThanOrEqual(sampled + 1e-12);
    const length = Math.hypot(...end.map((value, axis) => value - start[axis]));
    expect(sampled - pair.distance).toBeLessThanOrEqual(length / steps + 1e-12);
    expect(getClosestPointsSegmentTriangle(end, start, ...triangle).distance).toBeCloseTo(
      pair.distance,
      11
    );
    expect(pair.segmentFraction).toBeGreaterThanOrEqual(0);
    expect(pair.segmentFraction).toBeLessThanOrEqual(1);
  }
});
