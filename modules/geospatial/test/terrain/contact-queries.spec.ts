// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {TerrainSurface, createTerrainSurface} from '@math.gl/geospatial/terrain/surface';
import {getClosestPointOnTriangle} from '@math.gl/geometry/culling/queries';

function sheet(): TerrainSurface {
  return new TerrainSurface({
    positions: new Float64Array([0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, -10]),
    indices: new Uint16Array([0, 1, 2, 0, 3, 1]),
    triangleValidity: new Uint8Array([1, 0]),
    origin: [100, 200, 300]
  });
}

test('terrain budgets preserve world coordinates and distinguish incomplete null from completed miss', () => {
  const surface = sheet();
  for (const run of [
    (maxWork: number) => surface.intersectRayQuery([100.5, 200.5, 302], [0, 0, -2], {maxWork}),
    (maxWork: number) =>
      surface.intersectSegmentQuery([100.5, 200.5, 302], [100.5, 200.5, 300], {maxWork}),
    (maxWork: number) => surface.nearestQuery([100.5, 200.5, 302], {maxWork})
  ]) {
    expect(run(0)).toEqual({result: null, complete: false, work: 0});
    expect(run(2)).toMatchObject({
      complete: false,
      work: 2,
      result: {triangleIndex: 0, distance: 2, point: [100.5, 200.5, 300]}
    });
    expect(run(3)).toMatchObject({
      complete: true,
      work: 3,
      result: {triangleIndex: 0, distance: 2}
    });
  }
  expect(surface.intersectRayQuery([103, 203, 302], [0, 0, -1])).toMatchObject({
    complete: true,
    result: null
  });
  expect(surface.intersectSegmentQuery([100, 200, 300], [100, 200, 300], {maxWork: 0})).toEqual({
    result: null,
    complete: true,
    work: 0
  });
  expect(() =>
    surface.intersectSegmentQuery([100, 200, 300], [100, 200, 300], {maxWork: NaN})
  ).toThrow();
  expect(() => surface.intersectSegmentQuery([-1e308, 0, 0], [1e308, 0, 0])).toThrow();
  expect(
    surface.nearest([100.5, 200.5, 302], {maxDistance: 2, ...{maxWork: 0}})?.triangleIndex
  ).toBe(0);
  expect(
    surface.intersectRay([100.5, 200.5, 302], [0, 0, -1], {maxDistance: 2, ...{maxWork: 0}})
      ?.triangleIndex
  ).toBe(0);
});

test('sphere contacts use closest features, two-sided normals and deterministic zero-distance fallback', () => {
  const surface = sheet();
  for (const [center, point, normal, distance] of [
    [[100.5, 200.5, 301], [100.5, 200.5, 300], [0, 0, 1], 1],
    [[100.5, 200.5, 299], [100.5, 200.5, 300], [0, 0, -1], 1],
    [[101, 199, 301], [101, 200, 300], [0, -Math.SQRT1_2, Math.SQRT1_2], Math.SQRT2],
    [[99, 200, 300], [100, 200, 300], [-1, 0, 0], 1],
    [[100.5, 200.5, 300], [100.5, 200.5, 300], [0, 0, 1], 0]
  ] as const) {
    const query = surface.intersectSphere(center, 2);
    expect(query.complete).toBe(true);
    expect(query.result).toHaveLength(1);
    const hit = query.result[0];
    expect(hit.triangleIndex).toBe(0);
    expect(hit.point).toEqual(point);
    expect(hit.distance).toBeCloseTo(distance, 14);
    expect(hit.penetration).toBeCloseTo(2 - distance, 14);
    normal.forEach((value, axis) => expect(hit.normal[axis]).toBeCloseTo(value, 14));
    expect(hit.faceNormal[2]).toBe(1);
  }
  // The sheet has no solid volume beneath it and excludes its visual skirt.
  expect(surface.intersectSphere([100.5, 200, 295], 1).result).toEqual([]);
  expect(surface.intersectSphere([100.5, 200.5, 301], 1).result[0].penetration).toBe(0);
  expect(surface.intersectSphere([100.5, 200.5, 301], 0.99).result).toEqual([]);
});

test('ridge contacts retain adjacent faces and local normals survive world-coordinate rounding', () => {
  const ridge = new TerrainSurface({
    positions: new Float64Array([0, -2, 1, 0, 2, 1, -2, 0, -1, 2, 0, -1]),
    indices: new Uint16Array([0, 1, 2, 1, 0, 3])
  });
  const contacts = ridge.intersectSphere([0, 0, 1.5], 0.5).result;
  expect(contacts).toHaveLength(2);
  for (const contact of contacts) {
    expect(contact.point).toEqual([0, 0, 1]);
    expect(contact.normal).toEqual([0, 0, 1]);
    expect(contact.penetration).toBe(0);
    expect(contact.faceNormal[2]).toBeCloseTo(Math.SQRT1_2, 14);
  }
  expect(contacts[0].faceNormal[0]).toBeCloseTo(-Math.SQRT1_2, 14);
  expect(contacts[1].faceNormal[0]).toBeCloseTo(Math.SQRT1_2, 14);
  const origin = 1e16;
  const translated = new TerrainSurface({
    positions: new Float64Array([0, 0, 0, 4, 0, 4, 0, 4, 0]),
    indices: new Uint16Array([0, 1, 2]),
    origin: [origin, origin, origin]
  });
  const contact = translated.intersectSphere([origin + 2, origin + 2, origin], 2).result[0];
  expect(contact.distance).toBeCloseTo(Math.SQRT2, 14);
  expect(contact.normal[0]).toBeCloseTo(Math.SQRT1_2, 14);
  expect(contact.normal[2]).toBeCloseTo(-Math.SQRT1_2, 14);
  expect(Math.hypot(...contact.normal)).toBeCloseTo(1, 14);
});

test('sphere contact lists match exhaustive triangle distances on irregular terrain with holes', () => {
  const heights = Float64Array.from({length: 35}, (_, i) => Math.sin(i * 1.7) * 2);
  const validity = Uint8Array.from({length: 35}, (_, i) => (i % 11 ? 1 : 0));
  const surface = createTerrainSurface(new HeightField({width: 7, height: 5, heights, validity}), {
    origin: [3, 2, 1]
  });
  const {positions, indices} = surface.copyData();
  for (let i = 0; i < 60; i++) {
    const center: [number, number, number] = [
      ((i * 0.37) % 8) - 1,
      ((i * 0.73) % 6) - 1,
      Math.sin(i) * 3
    ];
    const local = center.map((value, axis) => value - surface.origin[axis]);
    const radius = (i % 7) * 0.3;
    const expected: number[] = [];
    for (let triangle = 0; triangle < indices.length / 3; triangle++) {
      const vertices = [0, 1, 2].map(j =>
        positions.subarray(indices[triangle * 3 + j] * 3, indices[triangle * 3 + j] * 3 + 3)
      );
      const point = getClosestPointOnTriangle(local, vertices[0], vertices[1], vertices[2]);
      if (Math.hypot(...point.map((value, axis) => value - local[axis])) <= radius)
        expected.push(triangle);
    }
    const query = surface.intersectSphere(center, radius);
    expect(query.complete).toBe(true);
    expect(query.result.map(hit => hit.triangleIndex)).toEqual(expected);
    for (const hit of query.result) {
      expect(Math.hypot(...hit.normal)).toBeCloseTo(1, 13);
      expect(hit.penetration).toBeGreaterThanOrEqual(0);
    }
  }
});

test('contact and work limits are explicit, retain valid partial contacts and do not mutate snapshots', () => {
  const surface = createTerrainSurface(
    new HeightField({width: 3, height: 3, heights: new Float64Array(9)})
  );
  const full = surface.intersectSphere([1, 1, 0], 2);
  expect(full.result).toHaveLength(8);
  for (let maxWork = 0; maxWork <= full.work; maxWork++) {
    const query = surface.intersectSphere([1, 1, 0], 2, {maxWork});
    expect(query.work).toBeLessThanOrEqual(maxWork);
    expect(query.complete).toBe(maxWork === full.work);
    expect(query.result.every(hit => hit.distance <= 2)).toBe(true);
  }
  for (const maxContacts of [0, 1, 7, 8]) {
    const query = surface.intersectSphere([1, 1, 0], 2, {maxContacts});
    expect(query.result).toHaveLength(maxContacts);
    expect(query.complete).toBe(maxContacts === 8);
  }
  full.result[0].point.fill(99);
  full.result[0].faceNormal.fill(99);
  full.result[0].normal.fill(99);
  expect(surface.intersectSphere([1, 1, 0], 2).result[0].point[2]).toBe(0);
  expect(() => surface.intersectSphere([NaN, 0, 0], 1)).toThrow();
  expect(() => surface.intersectSphere([1, 1, 0], 1, {maxContacts: -1})).toThrow();
  expect(() => surface.intersectSphere([1, 1, 0], 1, {maxWork: 0.5})).toThrow();
  const empty = new TerrainSurface({positions: new Float64Array(), indices: new Uint16Array()});
  expect(empty.intersectSphere([0, 0, 0], 1, {maxWork: 0, maxContacts: 0})).toEqual({
    result: [],
    complete: true,
    work: 0
  });
});
