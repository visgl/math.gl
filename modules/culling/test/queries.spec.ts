// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {intersectRayBounds, intersectRayTriangle, getClosestPointOnTriangle} from '../src/queries';

test('closed slab intersections handle inside, parallel, boundary and backward rays', () => {
  expect(intersectRayBounds([-2, 0, 0], [2, 0, 0], [-1, -1, -1], [1, 1, 1])).toBe(0.5);
  expect(intersectRayBounds([0, 0, 0], [1, 0, 0], [-1, -1, -1], [1, 1, 1])).toBe(0);
  expect(intersectRayBounds([-2, 1, 0], [1, 0, 0], [-1, -1, -1], [1, 1, 1])).toBe(1);
  expect(intersectRayBounds([-2, 2, 0], [1, 0, 0], [-1, -1, -1], [1, 1, 1])).toBeNull();
  expect(intersectRayBounds([-2, 0, 0], [-1, 0, 0], [-1, -1, -1], [1, 1, 1])).toBeNull();
  expect(intersectRayBounds([-2, 0], [1, 0], [-1, -1], [1, 1], 0.9)).toBeNull();
  expect(intersectRayBounds([-2, 0], [1, 0], [-1, -1], [1, 1], 1)).toBe(1);
  expect(() => intersectRayBounds([0, 0], [0, 0], [-1, -1], [1, 1])).toThrow();
  expect(() => intersectRayBounds([0, 0], [1, 0], [1, -1], [-1, 1])).toThrow();
});

test('triangle rays return scaled t and barycentrics, including vertices and edges', () => {
  const a = [0, 0, 0],
    b = [2, 0, 0],
    c = [0, 2, 0];
  expect(intersectRayTriangle([0.5, 0.5, 2], [0, 0, -2], a, b, c)).toEqual({
    t: 1,
    barycentric: [0.5, 0.25, 0.25]
  });
  expect(intersectRayTriangle([0, 0, 1], [0, 0, -1], a, b, c)?.barycentric).toEqual([1, 0, 0]);
  expect(intersectRayTriangle([1, 1, 1], [0, 0, -1], a, b, c)?.barycentric).toEqual([0, 0.5, 0.5]);
  expect(intersectRayTriangle([1, 1, 0], [0, 0, 1], a, b, c)?.t).toBe(0);
  expect(intersectRayTriangle([3, 3, 1], [0, 0, -1], a, b, c)).toBeNull();
  expect(
    intersectRayTriangle([0.5, 0.5, -1], [0, 0, 1], a, b, c, {backfaceCulling: true})
  ).toBeNull();
  expect(
    intersectRayTriangle([0.5, 0.5, 1], [0, 0, -1], a, b, c, {backfaceCulling: true})
  ).not.toBeNull();
  expect(intersectRayTriangle([0.5, 0.5, 1], [1, 0, 0], a, b, c)).toBeNull();
  expect(intersectRayTriangle([0.5, 0.5, 1], [0, 0, -1], a, a, c)).toBeNull();
  expect(intersectRayTriangle([0.5, 0.5, 1], [0, 0, -1], a, b, c, {maxT: 0.5})).toBeNull();
});

test('closest triangle points cover face, edge, vertex and degenerate geometry', () => {
  const a = [0, 0, 0],
    b = [2, 0, 0],
    c = [0, 2, 0];
  expect(getClosestPointOnTriangle([0.5, 0.5, 3], a, b, c)).toEqual([0.5, 0.5, 0]);
  expect(getClosestPointOnTriangle([2, 2, 0], a, b, c)).toEqual([1, 1, 0]);
  expect(getClosestPointOnTriangle([-1, -1, 0], a, b, c)).toEqual(a);
  expect(getClosestPointOnTriangle([1, 1, 0], a, b, b)).toEqual([1, 0, 0]);
  expect(getClosestPointOnTriangle([1, 1, 0], a, a, a)).toEqual(a);
  expect(() => getClosestPointOnTriangle([NaN, 0, 0], a, b, c)).toThrow();
  expect(() => intersectRayTriangle([0, 0, 1], [0, 0, 0], a, b, c)).toThrow();
});
