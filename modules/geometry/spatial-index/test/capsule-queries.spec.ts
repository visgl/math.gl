// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BoxIndex, TriangleBVH} from '@math.gl/geometry/spatial-index';
import {getClosestPointsSegmentTriangle} from '@math.gl/geometry/culling/queries';

test('nearest-box traversal uses conservative closed-box distances and existing budgets', () => {
  const boxes = new BoxIndex({
    dimension: 3,
    bounds: [0, 0, 0, 1, 1, 1, 4, 0, 0, 5, 1, 1],
    leafSize: 1
  });
  const minimum = [2, 0, 0],
    maximum = [3, 1, 1];
  expect(boxes.nearestBoxQuery(minimum, maximum).result).toEqual({index: 0, distance: 1});
  expect(boxes.nearestBoxQuery(minimum, maximum, {maxDistance: 0.99}).result).toBeNull();
  expect(boxes.nearestBoxQuery(minimum, maximum, {filter: i => i === 1}).result?.index).toBe(1);
  const full = boxes.nearestBoxQuery(minimum, maximum);
  for (let maxWork = 0; maxWork <= full.work; maxWork++) {
    const bounded = boxes.nearestBoxQuery(minimum, maximum, {maxWork});
    expect(bounded.work).toBeLessThanOrEqual(maxWork);
    expect(bounded.complete).toBe(maxWork === full.work);
  }
  expect(() => boxes.nearestBoxQuery([3, 0, 0], [2, 1, 1])).toThrow();
  expect(() => boxes.nearestBoxQuery(minimum, maximum, {distanceToItem: () => 0})).toThrow();
});

test('capsule and segment nearest find interior contacts missed by endpoint-only queries', () => {
  const mesh = new TriangleBVH({positions: [0, 0, 0, 4, 0, 0, 0, 4, 0]});
  const start = [1, 1, 2],
    end = [1, 1, -2];
  expect(mesh.intersectSphere(start, 0.5).result).toEqual([]);
  expect(mesh.intersectSphere(end, 0.5).result).toEqual([]);
  expect(mesh.intersectCapsule(start, end, 0.5)).toMatchObject({
    complete: true,
    result: [
      {index: 0, distance: 0, segmentFraction: 0.5, point: [1, 1, 0], segmentPoint: [1, 1, 0]}
    ]
  });
  expect(mesh.nearestSegment(start, end)).toMatchObject({distance: 0, segmentFraction: 0.5});
  expect(mesh.nearestSegment(start, end, {maxDistance: 0, ...{maxWork: 0}})?.distance).toBe(0);
  expect(mesh.intersectCapsule(start, end, 0, {maxWork: 0})).toEqual({
    result: [],
    complete: false,
    work: 0
  });
  expect(mesh.intersectCapsule(start, end, 0, {maxResults: 0}).complete).toBe(false);
  expect(mesh.nearestSegmentQuery(start, end, {maxWork: 1})).toEqual({
    result: null,
    complete: false,
    work: 1
  });
  expect(mesh.nearestSegmentQuery(start, end, {filter: () => false}).result).toBeNull();
  expect(mesh.intersectCapsule(start, end, 1, {filter: () => false}).result).toEqual([]);
  expect(mesh.intersectCapsule([1, 1, 1], [2, 1, 1], 1).result).toHaveLength(1);
  expect(mesh.intersectCapsule([1, 1, 1], [2, 1, 1], 0.99).result).toHaveLength(0);
  expect(mesh.nearestSegment([1, 1, 1], [2, 1, 1], {maxDistance: 0.99})).toBeNull();
  for (const radius of [-1, NaN, Infinity])
    expect(() => mesh.intersectCapsule(start, end, radius)).toThrow();
  expect(() => mesh.nearestSegment([-1e308, 0, 0], [1e308, 0, 0])).toThrow();
  expect(() => mesh.intersectCapsule([1e308, 0, 0], [1e308, 0, 0], 1e308)).toThrow();
});

test('bounded mesh queries agree with exhaustive segment/triangle comparisons', () => {
  const positions: number[] = [];
  for (let y = 0; y < 6; y++)
    for (let x = 0; x < 7; x++) positions.push(x, y, Math.sin(x) * Math.cos(y));
  const indices: number[] = [];
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 6; x++) {
      const a = y * 7 + x;
      indices.push(a, a + 1, a + 8, a, a + 8, a + 7);
    }
  const mesh = new TriangleBVH({positions, indices, leafSize: 2});
  for (let i = 0; i < 40; i++) {
    const start = [((i * 0.7) % 8) - 1, ((i * 0.3) % 7) - 1, Math.sin(i) * 2];
    const end = [((i * 0.2) % 8) - 1, ((i * 0.9) % 7) - 1, Math.cos(i) * 2];
    const radius = (i % 4) * 0.2;
    const exhaustive = Array.from({length: mesh.size}, (_, index) => {
      const vertices = [0, 1, 2].map(j =>
        positions.slice(indices[index * 3 + j] * 3, indices[index * 3 + j] * 3 + 3)
      );
      return {
        index,
        ...getClosestPointsSegmentTriangle(start, end, vertices[0], vertices[1], vertices[2])
      };
    })
      .filter(hit => hit.index % 5 !== 0)
      .sort((a, b) => a.distance - b.distance || a.index - b.index);
    const query = mesh.nearestSegmentQuery(start, end, {filter: index => index % 5 !== 0});
    expect(query.complete).toBe(true);
    expect(query.result?.index).toBe(exhaustive[0].index);
    expect(query.result?.distance).toBe(exhaustive[0].distance);
    const capsule = mesh.intersectCapsule(start, end, radius, {filter: index => index % 5 !== 0});
    expect(capsule.complete).toBe(true);
    expect(capsule.result.map(hit => hit.index)).toEqual(
      exhaustive
        .filter(hit => hit.distance <= radius)
        .map(hit => hit.index)
        .sort((a, b) => a - b)
    );
    for (const maxWork of [0, 1, 4, query.work]) {
      const bounded = mesh.nearestSegmentQuery(start, end, {
        filter: index => index % 5 !== 0,
        maxWork
      });
      expect(bounded.work).toBeLessThanOrEqual(maxWork);
      if (bounded.complete) expect(bounded.result).toEqual(query.result);
    }
  }
});

test('nearest segment pruning avoids refining distant triangles on a large separated mesh', () => {
  const positions: number[] = [];
  for (let i = 0; i < 2048; i++) positions.push(i * 10, 0, 0, i * 10 + 1, 0, 0, i * 10, 1, 0);
  const mesh = new TriangleBVH({positions});
  let refined = 0;
  const result = mesh.nearestSegmentQuery([0.1, 0.1, 1], [0.2, 0.1, 2], {
    filter: () => {
      refined++;
      return true;
    }
  });
  expect(result.result?.index).toBe(0);
  expect(result.result?.distance).toBeCloseTo(1, 14);
  expect(refined).toBeLessThan(20);
  expect(result.work).toBeLessThan(100);
});
