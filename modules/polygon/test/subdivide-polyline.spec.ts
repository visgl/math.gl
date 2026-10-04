// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {subdividePolyline} from '@math.gl/polygon';

const identity = (position: readonly number[]) => position;

test('linear transforms preserve endpoints, closure, input and segment attribution', () => {
  const input = Object.freeze([0, 0, 1, 0, 1, 1, 0, 0]);
  const result = subdividePolyline(input, {
    transform: p => [p[0] * 2 + 10, p[1] * 3 - 4],
    tolerance: 0.001
  });
  expect(Array.from(result.sourcePositions)).toEqual(input);
  expect(Array.from(result.positions)).toEqual([10, -4, 12, -4, 12, -1, 10, -4]);
  expect(Array.from(result.segmentIndices)).toEqual([0, 0, 1, 2]);
  expect(Array.from(result.segmentFractions)).toEqual([0, 1, 1, 1]);
});

test('curved projection meets a dense independent error check and preserves altitude', () => {
  const tolerance = 0.001;
  const transform = (p: readonly number[]) => [p[0], p[0] * p[0], p[2]];
  const result = subdividePolyline(new Float64Array([0, 0, 10, 1, 0, 20]), {
    transform,
    tolerance,
    size: 3
  });
  expect(result.positions.length).toBeGreaterThan(6);
  for (let i = 0; i < result.positions.length - 3; i += 3) {
    const x0 = result.positions[i];
    const x1 = result.positions[i + 3];
    for (let j = 1; j < 100; j++) {
      const t = j / 100;
      const x = x0 * (1 - t) + x1 * t;
      const y = result.positions[i + 1] * (1 - t) + result.positions[i + 4] * t;
      expect(Math.abs(y - x * x)).toBeLessThanOrEqual(tolerance);
    }
  }
  for (let i = 0; i < result.segmentFractions.length; i++) {
    const t = result.segmentFractions[i];
    expect(result.sourcePositions[i * 3 + 2]).toBeCloseTo(10 + 10 * t);
    expect(result.positions[i * 3 + 2]).toBeCloseTo(10 + 10 * t);
  }
});

test('quarter samples catch an S curve whose midpoint is on the chord', () => {
  const result = subdividePolyline([0, 0, 1, 0], {
    transform: p => [p[0], Math.sin(2 * Math.PI * p[0])],
    tolerance: 0.01
  });
  expect(result.positions.length).toBeGreaterThan(4);
});

test('source-length limit subdivides linear projections and supports different output dimensions', () => {
  const result = subdividePolyline([0, 0, 8, 0], {
    transform: p => [p[0], p[1], 7],
    tolerance: 0.01,
    targetSize: 3,
    maxSegmentLength: 2
  });
  expect(Array.from(result.sourcePositions)).toEqual([0, 0, 2, 0, 4, 0, 6, 0, 8, 0]);
  expect(Array.from(result.segmentFractions)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  expect(result.positions.length).toBe(15);
});

test('invalid domains, depth exhaustion and vertex exhaustion fail without partial output', () => {
  const input = [0, 0, 1, 0];
  expect(() =>
    subdividePolyline(input, {
      transform: p => (p[0] === 0.5 ? null : p),
      tolerance: 1
    })
  ).toThrow(RangeError);
  expect(() => subdividePolyline(input, {transform: () => null, tolerance: 1})).toThrow(RangeError);
  expect(() => subdividePolyline(input, {transform: () => [NaN, 0], tolerance: 1})).toThrow(
    RangeError
  );
  expect(() => subdividePolyline(input, {transform: () => [0], tolerance: 1})).toThrow(RangeError);
  const options = {transform: (p: readonly number[]) => [p[0], p[0] ** 2], tolerance: 0.0001};
  expect(() => subdividePolyline(input, {...options, maxDepth: 0})).toThrow(/maxDepth/);
  expect(() => subdividePolyline(input, {...options, maxVertices: 2})).toThrow(/maxVertices/);
  const error = new Error('projection domain');
  expect(() =>
    subdividePolyline(input, {
      transform: () => {
        throw error;
      },
      tolerance: 1
    })
  ).toThrow(error);
});

test('validates buffers/options and supports empty and singleton geometry', () => {
  expect(subdividePolyline([], {transform: identity, tolerance: 1}).positions.length).toBe(0);
  expect(
    Array.from(subdividePolyline([2, 3], {transform: identity, tolerance: 1}).positions)
  ).toEqual([2, 3]);
  expect(() => subdividePolyline([0, 0, 1], {transform: identity, tolerance: 1})).toThrow(
    RangeError
  );
  expect(() => subdividePolyline([Infinity, 0], {transform: identity, tolerance: 1})).toThrow(
    RangeError
  );
  for (const tolerance of [0, -1, NaN, Infinity]) {
    expect(() => subdividePolyline([], {transform: identity, tolerance})).toThrow(RangeError);
  }
  for (const maxDepth of [-1, 31, 0.5]) {
    expect(() => subdividePolyline([], {transform: identity, tolerance: 1, maxDepth})).toThrow(
      RangeError
    );
  }
});

test('a transform that mutates its argument cannot change source positions', () => {
  const result = subdividePolyline([0, 0, 1, 1], {
    transform: p => {
      const writable = p as number[];
      writable[0] += 10;
      return writable;
    },
    tolerance: 1
  });
  expect(Array.from(result.sourcePositions)).toEqual([0, 0, 1, 1]);
  expect(Array.from(result.positions)).toEqual([10, 0, 11, 1]);
});

test('polar CRS adapter approximates a curved latitude edge in meter units', async () => {
  const {Projection} = await import('@math.gl/projection');
  const projection = new Projection({
    from: 'WGS84',
    to: '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=0 +datum=WGS84 +units=m'
  });
  const transform = (p: readonly number[]) => projection.project(Array.from(p));
  const result = subdividePolyline([-45, 80, 45, 80], {transform, tolerance: 100});
  expect(result.positions.length).toBeGreaterThan(4);
  for (let i = 0; i < result.positions.length - 2; i += 2) {
    for (let j = 1; j < 20; j++) {
      const t = j / 20;
      const longitude = result.sourcePositions[i] * (1 - t) + result.sourcePositions[i + 2] * t;
      const exact = transform([longitude, 80]);
      const x = result.positions[i] * (1 - t) + result.positions[i + 2] * t;
      const y = result.positions[i + 1] * (1 - t) + result.positions[i + 3] * t;
      expect(Math.hypot(exact[0] - x, exact[1] - y)).toBeLessThanOrEqual(100);
    }
  }
});
