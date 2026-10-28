// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BoxIndex, TriangleBVH} from '@math.gl/geometry';

test('bounded box queries count node and item visits and complete at the exact budget', () => {
  const boxes = new BoxIndex({dimension: 2, bounds: [0, 0, 1, 1, 0, 0, 1, 1]});
  for (const run of [
    (maxWork: number) => boxes.searchQuery([0, 0], [1, 1], {maxWork}),
    (maxWork: number) => boxes.nearestQuery([0, 0], {maxWork}),
    (maxWork: number) => boxes.intersectRayQuery([-1, 0], [2, 0], {maxWork})
  ]) {
    for (let maxWork = 0; maxWork <= 3; maxWork++) {
      const query = run(maxWork);
      expect(query.work).toBe(maxWork);
      expect(query.complete).toBe(maxWork === 3);
    }
  }
  expect(boxes.searchQuery([2, 2], [3, 3], {maxWork: 1})).toEqual({
    result: [],
    complete: true,
    work: 1
  });
  expect(boxes.intersectRayQuery([-1, 2], [-1, 0], {maxWork: 1})).toEqual({
    result: null,
    complete: true,
    work: 1
  });
  expect(boxes.nearestQuery([0, 0], {maxWork: 2}).result).toEqual({index: 0, distance: 0});
  const budget = {maxWork: 0, maxDistance: 10};
  // Wider option objects cannot silently make the legacy methods return partial results.
  expect(boxes.nearest([0, 0], budget)?.index).toBe(0);
  expect(boxes.intersectRay([-1, 0], [2, 0], budget)?.distance).toBe(1);
});

test('bounded tree traversals converge to exhaustive answers with deterministic original-index ties', () => {
  const bounds = Array.from({length: 24}, (_, i) => [i % 4, 0, (i % 4) + 1, 1]).flat();
  const boxes = new BoxIndex({dimension: 2, bounds, leafSize: 1});
  for (const run of [
    (maxWork: number) => boxes.searchQuery([0, 0], [4, 1], {maxWork, filter: i => i % 2 === 0}),
    (maxWork: number) => boxes.nearestQuery([-1, 0.5], {maxWork, filter: i => i >= 5}),
    (maxWork: number) => boxes.intersectRayQuery([-1, 0.5], [3, 0], {maxWork, filter: i => i >= 5})
  ]) {
    const full = run(Infinity);
    expect(full.complete).toBe(true);
    for (let maxWork = 0; maxWork <= full.work; maxWork++) {
      const bounded = run(maxWork);
      expect(bounded.work).toBeLessThanOrEqual(maxWork);
      expect(bounded.complete).toBe(maxWork === full.work);
      if (bounded.complete) expect(bounded.result).toEqual(full.result);
    }
  }
  expect(boxes.searchQuery([0, 0], [4, 1], {filter: i => i === 7, maxResults: 1}).complete).toBe(
    true
  );
  expect(boxes.searchQuery([0, 0], [4, 1], {maxResults: 1}).complete).toBe(false);
  expect(boxes.searchQuery([0, 0], [4, 1], {maxResults: 0}).result).toEqual([]);
  expect(boxes.searchQuery([0, 0], [4, 1], {maxResults: 0, filter: () => false}).complete).toBe(
    true
  );
});

test('zero budgets never call refinements; invalid limits fail even for empty indexes', () => {
  for (const bounds of [[], [0, 0, 1, 1]]) {
    const boxes = new BoxIndex({dimension: 2, bounds});
    const filter = () => {
      throw new Error('Unexpected refinement');
    };
    expect(boxes.nearestQuery([0, 0], {maxWork: 0, filter}).complete).toBe(bounds.length === 0);
    expect(boxes.intersectRayQuery([0, 0], [1, 0], {maxWork: 0, filter}).work).toBe(0);
    expect(boxes.searchQuery([0, 0], [1, 1], {maxWork: 0, filter}).work).toBe(0);
    for (const maxWork of [-1, 0.5, NaN, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => boxes.searchQuery([0, 0], [1, 1], {maxWork})).toThrow();
      expect(() => boxes.nearestQuery([0, 0], {maxWork})).toThrow();
      expect(() => boxes.intersectRayQuery([0, 0], [1, 0], {maxWork})).toThrow();
      expect(() => boxes.searchQuery([0, 0], [1, 1], {maxResults: maxWork})).toThrow();
    }
  }
});

test('triangle query budgets preserve filters, rejection, inclusive bounds and provisional hits', () => {
  const bvh = new TriangleBVH({positions: [0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1, 2, 0, 1, 0, 2, 1]});
  const origin = [0.25, 0.25, 2];
  const direction = [0, 0, -10];
  expect(bvh.intersectRayQuery(origin, direction, {maxWork: 2})).toMatchObject({
    complete: false,
    result: {index: 0, distance: 2}
  });
  expect(bvh.intersectRayQuery(origin, direction, {maxWork: 3})).toMatchObject({
    complete: true,
    result: {index: 1, distance: 1}
  });
  expect(
    bvh.intersectRayQuery(origin, direction, {acceptHit: hit => hit.index === 0}).result?.index
  ).toBe(0);
  expect(bvh.intersectRayQuery(origin, direction, {maxDistance: 0.99}).result).toBeNull();
  expect(bvh.nearestQuery(origin, {maxWork: 2})).toMatchObject({
    complete: false,
    result: {index: 0, distance: 2}
  });
  expect(bvh.nearestQuery(origin, {maxDistance: 1}).result?.index).toBe(1);
  expect(bvh.searchQuery([0, 0, 0], [2, 2, 2], {maxResults: 1}).complete).toBe(false);
  expect(bvh.nearest(origin, {maxDistance: 2, ...{maxWork: 0}})?.index).toBe(1);
  expect(bvh.intersectRay(origin, direction, {maxDistance: 2, ...{maxWork: 0}})?.index).toBe(1);
});

test('sphere triangle queries include touching faces, edges and vertices and exclude broad-phase false positives', () => {
  const bvh = new TriangleBVH({positions: [0, 0, 0, 2, 0, 0, 0, 2, 0]});
  for (const [center, radius, point] of [
    [[0.5, 0.5, 1], 1, [0.5, 0.5, 0]],
    [[1, -1, 0], 1, [1, 0, 0]],
    [[-1, 0, 0], 1, [0, 0, 0]],
    [[0.5, 0.5, 0], 0, [0.5, 0.5, 0]]
  ] as const) {
    const query = bvh.intersectSphere(center, radius);
    expect(query).toMatchObject({complete: true, result: [{index: 0, distance: radius, point}]});
    expect(bvh.intersectSphere(center, radius, {maxWork: 1}).complete).toBe(false);
    if (radius) expect(bvh.intersectSphere(center, radius * 0.99).result).toEqual([]);
  }
  expect(bvh.intersectSphere([1.9, 1.9, 0], 0.2).result).toEqual([]);
  expect(bvh.intersectSphere([0.5, 0.5, 0], 1, {filter: () => false}).result).toEqual([]);
  expect(bvh.intersectSphere([0.5, 0.5, 0], 1, {maxResults: 0})).toMatchObject({
    complete: false,
    result: []
  });
  for (const radius of [-1, Infinity, NaN])
    expect(() => bvh.intersectSphere([0, 0, 0], radius)).toThrow();
  expect(() => bvh.intersectSphere([Number.MAX_VALUE, 0, 0], Number.MAX_VALUE)).toThrow();
});
