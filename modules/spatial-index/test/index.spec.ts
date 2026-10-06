// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {BoxIndex, PointIndex, TriangleBVH} from '../src';
import {intersectRayTriangle, getClosestPointOnTriangle} from '../../culling/src/queries';

function random() {
  let seed = 12345;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test('box range and nearest match a brute-force oracle across leaf sizes', () => {
  const rng = random(),
    bounds = [];
  for (let i = 0; i < 250; i++) {
    const x = rng() * 100,
      y = rng() * 100;
    bounds.push(x, y, x + rng() * 5, y + rng() * 5);
  }
  for (const leafSize of [1, 8, 64]) {
    const index = new BoxIndex({bounds, dimension: 2, leafSize});
    for (let q = 0; q < 30; q++) {
      const x = rng() * 100,
        y = rng() * 100,
        expected = [];
      let nearest = 0,
        distance = Infinity;
      for (let i = 0; i < 250; i++) {
        const [a, b, c, d] = bounds.slice(i * 4, i * 4 + 4);
        if (a <= x + 5 && c >= x - 5 && b <= y + 5 && d >= y - 5) expected.push(i);
        const candidate = Math.hypot(Math.max(a - x, 0, x - c), Math.max(b - y, 0, y - d));
        if (candidate < distance) {
          distance = candidate;
          nearest = i;
        }
      }
      expect(index.search([x - 5, y - 5], [x + 5, y + 5])).toEqual(expected);
      expect(index.nearest([x, y])?.index).toBe(nearest);
      expect(index.nearest([x, y])?.distance).toBeCloseTo(distance, 12);
    }
  }
});

test('point indices support 3D, stable ties, filters, limits, and input copying', () => {
  const positions = [-1, 0, 0, 1, 0, 0, 5, 0, 0];
  const index = new PointIndex({positions, dimension: 3, leafSize: 1});
  positions[0] = 100;
  expect(index.nearest([0, 0, 0])).toEqual({index: 0, distance: 1});
  expect(index.nearest([0, 0, 0], {filter: i => i !== 0})).toEqual({index: 1, distance: 1});
  expect(index.nearest([0, 0, 0], {maxDistance: 0.9})).toBeNull();
  expect(index.nearest([0, 0, 0], {maxDistance: 1})?.index).toBe(0);
  expect(index.search([-1, 0, 0], [-1, 0, 0])).toEqual([0]);
});

test('geometry refinement changes nearest bounds result and prunes callbacks', () => {
  const bounds = [-5, -5, 5, 5, 2, 0, 3, 1, 100, 100, 101, 101];
  const index = new BoxIndex({bounds, dimension: 2, leafSize: 1});
  let visits = 0;
  expect(
    index.nearest([0, 0], {
      distanceToItem: i => {
        visits++;
        return [50, 2, 150][i];
      }
    })
  ).toEqual({index: 1, distance: 2});
  expect(visits).toBeLessThan(3);
  expect(index.nearest([0, 0], {distanceToItem: () => null})).toBeNull();
  expect(() => index.nearest([0, 0], {distanceToItem: () => -1})).toThrow();
});

test('ray bounds candidates are ordered by distance and include origins inside', () => {
  const index = new BoxIndex({
    bounds: [2, -1, 3, 1, 5, -1, 6, 1, -1, -1, 1, 1],
    dimension: 2,
    leafSize: 1
  });
  expect(index.searchRay([0, 0], [2, 0])).toEqual([
    {index: 2, distance: 0},
    {index: 0, distance: 2},
    {index: 1, distance: 5}
  ]);
  expect(index.searchRay([0, 0], [1, 0], 2).map(hit => hit.index)).toEqual([2, 0]);
  expect(index.searchRay([0, 2], [1, 0])).toEqual([]);
});

test('triangle BVH picks the first hit and gives exact closest point', () => {
  const bvh = new TriangleBVH({
    positions: [0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 2, 0, 2, 0, 2, 2],
    leafSize: 1
  });
  const hit = bvh.intersectRay([0.5, 0.5, 5], [0, 0, -7]);
  expect(hit).toEqual({
    index: 1,
    distance: 3,
    point: [0.5, 0.5, 2],
    barycentric: [0.5, 0.25, 0.25]
  });
  expect(bvh.intersectRay([0.5, 0.5, 5], [0, 0, -1], {maxDistance: 2})).toBeNull();
  expect(bvh.intersectRay([0.5, 0.5, -1], [0, 0, 1], {backfaceCulling: true})).toBeNull();
  expect(bvh.nearest([0.5, 0.5, 3])).toEqual({index: 1, distance: 1, point: [0.5, 0.5, 2]});
  expect(bvh.nearest([3, 3, 0])?.point).toEqual([1, 1, 0]);
  expect(bvh.search([0, 0, 1], [2, 2, 3])).toEqual([1]);
});

test('triangle acceleration agrees with exhaustive kernel queries on a deterministic corpus', () => {
  const rng = random(),
    positions = [];
  for (let i = 0; i < 40; i++) {
    const x = rng() * 10,
      y = rng() * 10,
      z = rng() * 10;
    positions.push(x, y, z, x + 1, y, z, x, y + 1, z);
  }
  const bvh = new TriangleBVH({positions, leafSize: 2});
  for (let q = 0; q < 30; q++) {
    const origin = [rng() * 11, rng() * 11, 12],
      direction = [0, 0, -1];
    let ray = null,
      nearest = null;
    for (let i = 0; i < 40; i++) {
      const a = positions.slice(i * 9, i * 9 + 3),
        b = positions.slice(i * 9 + 3, i * 9 + 6),
        c = positions.slice(i * 9 + 6, i * 9 + 9);
      const hit = intersectRayTriangle(origin, direction, a, b, c);
      if (hit && (!ray || hit.t < ray.distance)) ray = {index: i, distance: hit.t};
      const point = getClosestPointOnTriangle(origin, a, b, c);
      const distance = Math.hypot(...point.map((v, k) => v - origin[k]));
      if (!nearest || distance < nearest.distance) nearest = {index: i, distance};
    }
    expect(bvh.intersectRay(origin, direction)?.index ?? null).toBe(ray?.index ?? null);
    expect(bvh.nearest(origin)?.index).toBe(nearest.index);
    expect(bvh.nearest(origin)?.distance).toBeCloseTo(nearest.distance, 10);
  }
});

test('indexed, degenerate and empty meshes have explicit behavior', () => {
  const positions = [0, 0, 0, 2, 0, 0, 0, 2, 0];
  const indices = [0, 1, 2, 0, 0, 0];
  const bvh = new TriangleBVH({positions, indices});
  positions[0] = 100;
  indices[0] = 2;
  expect(bvh.intersectRay([0.5, 0.5, 1], [0, 0, -1])?.index).toBe(0);
  expect(bvh.nearest([0, 0, 0])?.index).toBe(0);
  const empty = new BoxIndex({bounds: [], dimension: 2});
  expect(empty.search([0, 0], [1, 1])).toEqual([]);
  expect(empty.nearest([0, 0])).toBeNull();
  expect(empty.searchRay([0, 0], [1, 0])).toEqual([]);
  expect(new TriangleBVH({positions: []}).nearest([0, 0, 0])).toBeNull();
});

test('invalid layouts and query arguments fail early', () => {
  expect(() => new BoxIndex({bounds: [0, 1, 2], dimension: 2})).toThrow();
  expect(() => new BoxIndex({bounds: [1, 0, 0, 1], dimension: 2})).toThrow();
  expect(() => new BoxIndex({bounds: [0, 0, NaN, 1], dimension: 2})).toThrow();
  expect(() => new BoxIndex({bounds: [], dimension: 2, leafSize: 0})).toThrow();
  expect(() => new PointIndex({positions: [1], dimension: 3})).toThrow();
  expect(() => new TriangleBVH({positions: [0, 0, 0], indices: [0, 1, 2]})).toThrow();
  const index = new BoxIndex({bounds: [], dimension: 2});
  expect(() => index.nearest([0, 0], {maxDistance: -1})).toThrow();
  expect(() => index.nearest([0, 0, 0])).toThrow();
  expect(() => index.searchRay([0, 0], [0, 0])).toThrow();
  expect(() => index.search([1, 1], [0, 0])).toThrow();
});

test('16,384 tile boxes match exhaustive queries while pruning nearest refinements', () => {
  const side = 128,
    bounds: number[] = [],
    centers: number[][] = [];
  for (let y = 0; y < side; y++)
    for (let x = 0; x < side; x++) {
      const z = (x * 17 + y * 31) % 13;
      bounds.push(x * 4, y * 4, z, x * 4 + 2, y * 4 + 2, z + 2);
      centers.push([x * 4 + 1, y * 4 + 1, z + 1]);
    }
  const rng = random();
  // Reuse identical queries across different tree shapes.
  const queries = Array.from({length: 24}, () => [rng() * side * 4, rng() * side * 4, rng() * 15]);
  for (const leafSize of [1, 8, 64]) {
    const index = new BoxIndex({bounds, dimension: 3, leafSize});
    for (const point of queries) {
      const min = point.map(v => v - 6),
        max = point.map(v => v + 6);
      const expectedRange: number[] = [];
      let expectedNearest = -1,
        expectedDistance = Infinity;
      for (let i = 0; i < centers.length; i++) {
        if (
          [0, 1, 2].every(
            axis => bounds[i * 6 + axis] <= max[axis] && bounds[i * 6 + axis + 3] >= min[axis]
          )
        )
          expectedRange.push(i);
        // Application filter: ignore every third tile. Reference uses no BVH math.
        if (i % 3 === 0) continue;
        const distance = Math.hypot(...centers[i].map((v, axis) => v - point[axis]));
        if (distance < expectedDistance) {
          expectedDistance = distance;
          expectedNearest = i;
        }
      }
      let refined = 0;
      const nearest = index.nearest(point, {
        filter: i => i % 3 !== 0,
        distanceToItem: i => {
          refined++;
          return Math.hypot(...centers[i].map((v, axis) => v - point[axis]));
        }
      });
      expect(index.search(min, max)).toEqual(expectedRange);
      expect(nearest?.index).toBe(expectedNearest);
      expect(nearest?.distance).toBeCloseTo(expectedDistance, 11);
      // A structural performance assertion, independent of CPU speed or timing.
      expect(refined).toBeGreaterThan(0);
      expect(refined).toBeLessThan(centers.length / 100);
      expect(
        index.nearest(point, {
          maxDistance: expectedDistance / 2,
          filter: i => i % 3 !== 0,
          distanceToItem: i => Math.hypot(...centers[i].map((v, axis) => v - point[axis]))
        })
      ).toBeNull();
    }
  }
});

test('8,192 indexed terrain triangles agree with independent analytic ray and nearest answers', () => {
  const side = 64,
    positions: number[] = [],
    indices: number[] = [];
  const height = (x: number, y: number) => x * 0.25 - y * 0.125;
  for (let y = 0; y <= side; y++)
    for (let x = 0; x <= side; x++) positions.push(x, y, height(x, y));
  for (let y = 0; y < side; y++)
    for (let x = 0; x < side; x++) {
      const a = y * (side + 1) + x,
        b = a + 1,
        c = a + side + 1,
        d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  const normalLength = Math.hypot(-0.25, 0.125, 1);
  const normal = [-0.25, 0.125, 1].map(v => v / normalLength);
  const rng = random();
  const queries = Array.from({length: 24}, () => [2 + rng() * 60, 2 + rng() * 60, 0.5 + rng() * 3]);
  for (const leafSize of [1, 8, 64]) {
    const bvh = new TriangleBVH({positions, indices, leafSize});
    expect(bvh.size).toBe(side * side * 2);
    for (const [x, y, offset] of queries) {
      const surface = [x, y, height(x, y)];
      const hit = bvh.intersectRay([x, y, surface[2] + offset], [0, 0, -7]);
      expect(hit?.distance).toBeCloseTo(offset, 10);
      hit?.point.forEach((v, axis) => expect(v).toBeCloseTo(surface[axis], 10));
      expect(hit?.barycentric.reduce((sum, v) => sum + v, 0)).toBeCloseTo(1, 12);
      // Nearest is known from plane projection, independently of triangle kernels.
      const point = surface.map((v, axis) => v + normal[axis] * offset);
      const nearest = bvh.nearest(point);
      expect(nearest?.distance).toBeCloseTo(offset, 10);
      nearest?.point.forEach((v, axis) => expect(v).toBeCloseTo(surface[axis], 10));
      expect(bvh.nearest(point, {maxDistance: offset / 2})).toBeNull();
      expect(bvh.intersectRay([x, y, surface[2] + offset], [0, 0, 1])).toBeNull();
    }
  }
});
