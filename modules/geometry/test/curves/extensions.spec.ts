// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {
  LineCurve,
  QuadraticBezierCurve,
  sampleCurveAdaptive,
  computeParallelTransportFrames
} from '@math.gl/geometry';

it('adaptive sampling preserves endpoints, refines bends and reports exhausted budgets', () => {
  const line = new LineCurve([0, 0], [10, 0]);
  expect(sampleCurveAdaptive(line, {tolerance: 0.01}).positions).toEqual(
    new Float64Array([0, 0, 10, 0])
  );
  const curve = new QuadraticBezierCurve([0, 0], [1, 2], [2, 0]);
  const loose = sampleCurveAdaptive(curve, {tolerance: 0.1}),
    tight = sampleCurveAdaptive(curve, {tolerance: 0.001});
  expect(tight.parameters.length).toBeGreaterThan(loose.parameters.length);
  expect(tight.converged).toBe(true);
  expect(tight.maxSampledError).toBeLessThanOrEqual(0.001);
  expect(tight.parameters[0]).toBe(0);
  expect(tight.parameters.at(-1)).toBe(1);
  for (let i = 1; i < tight.parameters.length; i++)
    expect(tight.parameters[i]).toBeGreaterThan(tight.parameters[i - 1]);
  const limited = sampleCurveAdaptive(curve, {tolerance: 1e-8, maxPoints: 3});
  expect(limited.parameters.length).toBeLessThanOrEqual(3);
  expect(limited.converged).toBe(false);
  expect(limited.parameters.at(-1)).toBe(1);
  expect(sampleCurveAdaptive(curve, {tolerance: 1e-8, maxDepth: 0}).converged).toBe(false);
  expect(() => sampleCurveAdaptive(curve, {tolerance: 0})).toThrow();
});

it('transport frames remain orthonormal through repeated points, reversals and closed loops', () => {
  for (const points of [
    [
      [0, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
      [2, 1, 0]
    ],
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 0]
    ],
    [
      [0, 0, 0],
      [-1, -2, -3],
      [-2, -3, -3]
    ]
  ]) {
    const frames = computeParallelTransportFrames(points);
    for (let i = 0; i < points.length; i++) {
      const t = frames.tangents.slice(i * 3, i * 3 + 3),
        n = frames.normals.slice(i * 3, i * 3 + 3),
        b = frames.binormals.slice(i * 3, i * 3 + 3);
      expect(Math.hypot(...t)).toBeCloseTo(1, 12);
      expect(Math.hypot(...n)).toBeCloseTo(1, 12);
      expect(Math.hypot(...b)).toBeCloseTo(1, 12);
      expect(t.reduce((sum, x, j) => sum + x * n[j], 0)).toBeCloseTo(0, 12);
    }
  }
  const closed = [
      [0, 0, 0],
      [1, 0, 1],
      [1, 1, 0],
      [0, 1, -1],
      [0, 0, 0]
    ],
    frames = computeParallelTransportFrames(closed, {closed: true});
  for (let j = 0; j < 3; j++)
    expect(frames.normals[j]).toBeCloseTo(frames.normals[(closed.length - 1) * 3 + j], 12);
  expect(() =>
    computeParallelTransportFrames([
      [0, 0, 0],
      [0, 0, 0]
    ])
  ).toThrow();
  expect(() =>
    computeParallelTransportFrames(
      [
        [0, 0, 0],
        [1, 0, 0]
      ],
      {initialNormal: [1, 0, 0]}
    )
  ).toThrow();
  expect(() =>
    computeParallelTransportFrames(
      [
        [0, 0, 0],
        [1, 0, 0]
      ],
      {closed: true}
    )
  ).toThrow();
});

it('transport rejects diagonal parallel normals and handles long equal-point runs', () => {
  expect(() =>
    computeParallelTransportFrames(
      [
        [0, 0, 0],
        [1, 1, 1]
      ],
      {initialNormal: [1, 1, 1]}
    )
  ).toThrow(RangeError);
  expect(() =>
    computeParallelTransportFrames(
      [
        [0, 0, 0],
        [1, 1, 1]
      ],
      {initialNormal: [-2, -2, -2]}
    )
  ).toThrow(RangeError);
  const points = Array.from({length: 20000}, () => [0, 0, 0]);
  points.push([1, 1, 1]);
  const frames = computeParallelTransportFrames(points);
  expect(frames.tangents.length).toBe(points.length * 3);
  for (const index of [0, 10000, points.length - 1]) {
    const t = frames.tangents.slice(index * 3, index * 3 + 3),
      n = frames.normals.slice(index * 3, index * 3 + 3),
      b = frames.binormals.slice(index * 3, index * 3 + 3);
    expect(Math.hypot(...b)).toBeCloseTo(1, 12);
    expect(t.reduce((sum, x, i) => sum + x * n[i], 0)).toBeCloseTo(0, 12);
  }
});

it('adaptive sampling measures large finite curves without false convergence', () => {
  const curve = new QuadraticBezierCurve([0, 0], [5e199, 1e200], [1e200, 0]);
  const result = sampleCurveAdaptive(curve, {tolerance: 1e198, maxPoints: 1024});
  expect(result.parameters.length).toBeGreaterThan(2);
  expect(Number.isFinite(result.maxSampledError)).toBe(true);
  expect(result.converged).toBe(true);
  expect(result.maxSampledError).toBeLessThanOrEqual(1e198);
});

it('adaptive sampling measures local bends beside large constant coordinates', () => {
  const x = 2 ** 1000;
  const curve = new QuadraticBezierCurve([x, 0], [x, 1e-100], [x, 0]);
  const result = sampleCurveAdaptive(curve, {tolerance: 1e-102});
  expect(result.parameters.length).toBeGreaterThan(2);
  expect(result.converged).toBe(true);
  expect(result.maxSampledError).toBeLessThanOrEqual(1e-102);
});
