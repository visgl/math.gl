// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {intersectOrientedBoxes2D} from '@math.gl/culling/oriented-box-2d';
import type {OrientedBox2D} from '@math.gl/culling/oriented-box-2d';
import {intersectOrientedBoxes2D as rootIntersection} from '@math.gl/culling';

/** Construct a small fixture using half-sizes and a radians-based width direction. */
function box(x = 0, y = 0, width = 1, height = 1, angle = 0): OrientedBox2D {
  return {center: [x, y], halfSize: [width, height], direction: [Math.cos(angle), Math.sin(angle)]};
}

/** Independent corner-projection oracle, like Tangram's closed-interval label SAT. */
function cornerOracle(first: OrientedBox2D, second: OrientedBox2D): boolean {
  const corners = (rectangle: OrientedBox2D): number[][] => {
    const angle = Math.atan2(rectangle.direction[1], rectangle.direction[0]);
    const cosine = Math.cos(angle),
      sine = Math.sin(angle);
    return [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1]
    ].map(([width, height]) => [
      rectangle.center[0] +
        width * rectangle.halfSize[0] * cosine -
        height * rectangle.halfSize[1] * sine,
      rectangle.center[1] +
        width * rectangle.halfSize[0] * sine +
        height * rectangle.halfSize[1] * cosine
    ]);
  };
  const firstCorners = corners(first),
    secondCorners = corners(second);
  for (const rectangle of [first, second]) {
    const angle = Math.atan2(rectangle.direction[1], rectangle.direction[0]);
    for (const axis of [
      [Math.cos(angle), Math.sin(angle)],
      [-Math.sin(angle), Math.cos(angle)]
    ]) {
      const firstProjection = firstCorners.map(point => point[0] * axis[0] + point[1] * axis[1]);
      const secondProjection = secondCorners.map(point => point[0] * axis[0] + point[1] * axis[1]);
      if (
        Math.max(...firstProjection) < Math.min(...secondProjection) ||
        Math.max(...secondProjection) < Math.min(...firstProjection)
      )
        return false;
    }
  }
  return true;
}

test('root and standalone entries expose the same query', () => {
  expect(rootIntersection).toBe(intersectOrientedBoxes2D);
});

test.each([
  {second: box(), expected: true},
  {second: box(2, 0), expected: true},
  {second: box(2, 2), expected: true},
  {second: box(2.001, 0), expected: false},
  {second: box(0, -2.001), expected: false},
  {second: box(0, 0, 0.1, 0.1, 0.9), expected: true},
  {second: box(0, 0, 3, 3, 0.9), expected: true}
])('closed rectangles handle contact, separation and containment %j', ({second, expected}) => {
  expect(intersectOrientedBoxes2D(box(), second)).toBe(expected);
  expect(intersectOrientedBoxes2D(second, box())).toBe(expected);
});

test('rejects rotated thin boxes even when their axis-aligned bounds overlap', () => {
  const first = box(0, 0, 3, 0.1, Math.PI / 4);
  const second = box(-0.5, 0.5, 3, 0.1, Math.PI / 4);
  expect(intersectOrientedBoxes2D(first, second)).toBe(false);
  expect(intersectOrientedBoxes2D(first, box(0, 0, 3, 0.1, -Math.PI / 4))).toBe(true);
});

test('points and segments retain closed-set semantics and stable directions', () => {
  expect(intersectOrientedBoxes2D(box(0, 0, 0, 0), box(0, 0, 0, 0, 1))).toBe(true);
  expect(intersectOrientedBoxes2D(box(0, 0, 0, 0), box(1, 0, 0, 0))).toBe(false);
  expect(intersectOrientedBoxes2D(box(0, 0, 2, 0), box(0, 0, 2, 0, Math.PI / 2))).toBe(true);
  expect(intersectOrientedBoxes2D(box(0, 0, 2, 0), box(0, 0.1, 2, 0))).toBe(false);
  expect(intersectOrientedBoxes2D(box(0, 0, 0, 2), box(0, 4, 0, 2))).toBe(true);
});

test('typed-array directions are magnitude-independent and inputs are not changed', () => {
  const first = {
    center: new Float64Array([0, 0]),
    halfSize: new Float32Array([2, 1]),
    direction: new Float64Array([3, 4])
  };
  const before = structuredClone(first);
  const second = box(2, 1, 1, 1, -0.7);
  const expected = intersectOrientedBoxes2D(first, second);
  for (const factor of [1e-300, 1e300, -1, 2]) {
    expect(intersectOrientedBoxes2D({...first, direction: [3 * factor, 4 * factor]}, second)).toBe(
      expected
    );
  }
  expect(first).toEqual(before);
});

test('uses a caller-selected separation allowance, not a fixed scene epsilon', () => {
  expect(intersectOrientedBoxes2D(box(), box(2.25, 0))).toBe(false);
  expect(intersectOrientedBoxes2D(box(), box(2.25, 0), 0.25)).toBe(true);
  expect(intersectOrientedBoxes2D(box(), box(2.25, 0), 0.2)).toBe(false);
  // SAT allowance is per-axis, not Euclidean distance.
  expect(intersectOrientedBoxes2D(box(), box(2.25, 2.25), 0.25)).toBe(true);
});

test('preserves a small displacement after a large common translation', () => {
  for (const translation of [0, 1e12, -1e12]) {
    const first = box(translation, translation);
    expect(intersectOrientedBoxes2D(first, box(translation + 2, translation))).toBe(true);
    expect(intersectOrientedBoxes2D(first, box(translation + 2.125, translation))).toBe(false);
  }
});

test('handles subnormal sizes and overflow-prone finite centers and extents', () => {
  const tiny = Number.MIN_VALUE;
  expect(intersectOrientedBoxes2D(box(0, 0, tiny, tiny), box(2 * tiny, 0, tiny, tiny))).toBe(true);
  expect(intersectOrientedBoxes2D(box(0, 0, tiny, tiny), box(3 * tiny, 0, tiny, tiny))).toBe(false);
  const huge = Number.MAX_VALUE;
  expect(intersectOrientedBoxes2D(box(-huge, 0, huge, huge), box(huge, 0, huge, huge))).toBe(true);
  expect(intersectOrientedBoxes2D(box(-huge, huge), box(huge, -huge))).toBe(false);
  expect(
    intersectOrientedBoxes2D(
      {...box(-huge, huge), direction: [1, 1]},
      {...box(huge, -huge), direction: [1, 1]}
    )
  ).toBe(false);
  expect(intersectOrientedBoxes2D({...box(), direction: [tiny, tiny]}, box())).toBe(true);
  expect(intersectOrientedBoxes2D({...box(), direction: [huge, huge]}, box())).toBe(true);
});

test('per-axis scaling preserves tiny gaps alongside huge perpendicular extents', () => {
  const narrow: OrientedBox2D = {center: [0, 0], halfSize: [1e-200, 1e200], direction: [0, 1]};
  const point = box(0, 2e-200, 0, 0);
  expect(intersectOrientedBoxes2D(narrow, point)).toBe(false);
  expect(intersectOrientedBoxes2D(point, narrow)).toBe(false);
  const flat: OrientedBox2D = {center: [0, 0], halfSize: [1e308, 1e-100], direction: [1, 0]};
  expect(intersectOrientedBoxes2D(flat, {...flat, center: [0, 1e-99]})).toBe(false);
  const huge = Number.MAX_VALUE,
    tiny = 1e-308;
  const first = box(0, 0, huge, tiny);
  const second = box(0, 3 * tiny, huge, tiny);
  expect(intersectOrientedBoxes2D(first, second)).toBe(false);
  expect(intersectOrientedBoxes2D(second, first)).toBe(false);
  const vertical = {...first, direction: [0, 1]};
  expect(intersectOrientedBoxes2D(vertical, {...vertical, center: [3 * tiny, 0]})).toBe(false);
  // X subtraction overflows, but Y remains a representable separating direction.
  expect(
    intersectOrientedBoxes2D({...first, center: [-huge, 0]}, {...second, center: [huge, 3 * tiny]})
  ).toBe(false);
  expect(intersectOrientedBoxes2D(first, second, 2 * tiny)).toBe(true);
});

test('matches an independent corner SAT over deterministic label-sized fixtures', () => {
  let seed = 0x7192a;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let index = 0; index < 1000; index++) {
    const first = box(
      random() * 20 - 10,
      random() * 20 - 10,
      random() * 4,
      random() * 3,
      random() * 7
    );
    const second = box(
      random() * 20 - 10,
      random() * 20 - 10,
      random() * 4,
      random() * 3,
      random() * 7
    );
    expect(intersectOrientedBoxes2D(first, second), `pair ${index}`).toBe(
      cornerOracle(first, second)
    );
    expect(intersectOrientedBoxes2D(second, first)).toBe(cornerOracle(first, second));
  }
});

test.each([
  {center: [0]},
  {center: [0, 0, 0]},
  {center: [NaN, 0]},
  {center: [0, Infinity]},
  {halfSize: [-1, 1]},
  {halfSize: [1, -1]},
  {halfSize: [1]},
  {halfSize: [Infinity, 0]},
  {direction: [0, 0]},
  {direction: [1, NaN]},
  {direction: [1]},
  {direction: [Infinity, 1]}
])('rejects invalid box vectors and half-sizes %j', overrides => {
  expect(() => intersectOrientedBoxes2D({...box(), ...overrides}, box())).toThrow(RangeError);
  expect(() => intersectOrientedBoxes2D(box(), {...box(), ...overrides})).toThrow(RangeError);
});

test.each([-1, NaN, Infinity])('rejects invalid epsilon %s', epsilon => {
  expect(() => intersectOrientedBoxes2D(box(), box(), epsilon)).toThrow(RangeError);
});
