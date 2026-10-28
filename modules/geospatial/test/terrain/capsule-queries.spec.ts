// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {TerrainSurface, createTerrainSurface} from '@math.gl/geospatial/terrain';

function sheet(): TerrainSurface {
  return new TerrainSurface({
    positions: new Float64Array([0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, -10]),
    indices: new Uint16Array([0, 1, 2, 0, 3, 1]),
    triangleValidity: new Uint8Array([1, 0]),
    origin: [100, 200, 300]
  });
}

test('terrain segment clearance and capsules preserve world points and original face masks', () => {
  const surface = sheet();
  const start = [101, 201, 302] as const,
    end = [101, 201, 298] as const;
  const query = surface.nearestSegmentQuery(start, end);
  expect(query).toMatchObject({
    complete: true,
    result: {
      triangleIndex: 0,
      distance: 0,
      point: [101, 201, 300],
      segmentPoint: [101, 201, 300],
      segmentFraction: 0.5
    }
  });
  expect(surface.nearestSegment(start, end, {maxDistance: 0, ...{maxWork: 0}})).toEqual(
    query.result
  );
  const contacts = surface.intersectCapsule(start, end, 0.5);
  expect(contacts.complete).toBe(true);
  expect(contacts.result).toHaveLength(1);
  expect(contacts.result[0]).toMatchObject({
    triangleIndex: 0,
    penetration: 0.5,
    segmentFraction: 0.5,
    segmentPoint: [101, 201, 300]
  });
  expect(contacts.result[0].normal[2]).toBe(1);
  expect(contacts.result[0].faceNormal[2]).toBe(1);
  // Both caps miss; the capsule's interior meets the physical face.
  expect(surface.intersectSphere(start, 0.5).result).toEqual([]);
  expect(surface.intersectSphere(end, 0.5).result).toEqual([]);
  // The excluded visual skirt does not obstruct a path below the sheet.
  expect(surface.intersectCapsule([100, 200, 295], [103, 200, 295], 1).result).toEqual([]);
});

test('capsule normals follow the closest axis point, with edge, below-sheet and point-capsule cases', () => {
  const surface = sheet();
  const edge = surface.intersectCapsule([101, 199, 299], [101, 199, 301], 1).result[0];
  expect(edge.point).toEqual([101, 200, 300]);
  expect(edge.segmentPoint).toEqual([101, 199, 300]);
  [0, -1, 0].forEach((value, axis) => expect(edge.normal[axis]).toBeCloseTo(value, 14));
  expect(edge.segmentFraction).toBeCloseTo(0.5, 14);
  expect(edge.penetration).toBe(0);
  expect(surface.intersectCapsule([101, 201, 299], [102, 201, 299], 1).result[0].normal[2]).toBe(
    -1
  );
  const center = [101, 201, 301] as const;
  const point = surface.intersectCapsule(center, center, 1).result[0];
  const sphere = surface.intersectSphere(center, 1).result[0];
  expect(point.triangleIndex).toBe(sphere.triangleIndex);
  expect(point.distance).toBeCloseTo(sphere.distance, 14);
  point.point.forEach((value, axis) => expect(value).toBeCloseTo(sphere.point[axis], 13));
  point.normal.forEach((value, axis) => expect(value).toBeCloseTo(sphere.normal[axis], 14));
  expect(point.segmentFraction).toBe(0);
  expect(point.segmentPoint).toEqual(center);
  expect(surface.intersectCapsule([101, 201, 301], [102, 201, 301], 0.99).result).toEqual([]);
});

test('terrain capsule work and capacity limits cannot silently become complete misses', () => {
  const surface = createTerrainSurface(
    new HeightField({width: 3, height: 3, heights: new Float64Array(9)})
  );
  const start = [0, 0, 1] as const,
    end = [2, 2, 1] as const;
  const full = surface.intersectCapsule(start, end, 2);
  expect(full.result).toHaveLength(8);
  for (let maxWork = 0; maxWork <= full.work; maxWork++) {
    const query = surface.intersectCapsule(start, end, 2, {maxWork});
    expect(query.work).toBeLessThanOrEqual(maxWork);
    expect(query.complete).toBe(maxWork === full.work);
  }
  for (const maxContacts of [0, 1, 7, 8]) {
    const query = surface.intersectCapsule(start, end, 2, {maxContacts});
    expect(query.result).toHaveLength(maxContacts);
    expect(query.complete).toBe(maxContacts === 8);
  }
  expect(surface.nearestSegmentQuery(start, end, {maxWork: 0})).toEqual({
    result: null,
    complete: false,
    work: 0
  });
  expect(surface.nearestSegment(start, end, {maxDistance: 0.99})).toBeNull();
  full.result[0].segmentPoint.fill(999);
  full.result[0].point.fill(999);
  expect(surface.intersectCapsule(start, end, 2).result[0].segmentPoint[2]).toBe(1);
  const empty = new TerrainSurface({positions: new Float64Array(), indices: new Uint16Array()});
  expect(empty.nearestSegmentQuery(start, end, {maxWork: 0})).toEqual({
    result: null,
    complete: true,
    work: 0
  });
  expect(empty.intersectCapsule(start, end, 1, {maxWork: 0})).toEqual({
    result: [],
    complete: true,
    work: 0
  });
  expect(() => empty.nearestSegmentQuery(start, end, {maxWork: -1})).toThrow();
  expect(() => surface.intersectCapsule(start, end, 1, {maxContacts: 0.5})).toThrow();
  expect(() => surface.intersectCapsule([NaN, 0, 0], end, 1)).toThrow();
});

test('large-origin capsule normals are evaluated in the local frame', () => {
  const origin = 1e16;
  const surface = new TerrainSurface({
    positions: new Float64Array([0, 0, 0, 4, 0, 4, 0, 4, 0]),
    indices: new Uint16Array([0, 1, 2]),
    origin: [origin, origin, origin]
  });
  const hit = surface.intersectCapsule(
    [origin + 2, origin, origin],
    [origin + 2, origin + 2, origin],
    2
  ).result[0];
  expect(hit.distance).toBeCloseTo(Math.SQRT2, 14);
  expect(Math.hypot(...hit.normal)).toBeCloseTo(1, 14);
  expect(hit.normal[0]).toBeCloseTo(Math.SQRT1_2, 14);
  expect(hit.normal[2]).toBeCloseTo(-Math.SQRT1_2, 14);
});
