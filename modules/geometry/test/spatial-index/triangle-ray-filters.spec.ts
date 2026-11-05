// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  TriangleBVH,
  type TriangleRayOptions,
  type TriangleRayResult
} from '../../src/spatial-index';
import {intersectRayTriangle, normalizeQueryDirection} from '../../src/culling/queries';

/** Indexed stacked triangles, including coincident surfaces and one degenerate face. */
function createFixture(leafSize: number) {
  const positions = [0, 0, 3, 2, 0, 3, 0, 2, 3, 0, 0, 1, 2, 0, 1, 0, 2, 1];
  const indices = [0, 1, 2, 3, 4, 5, 0, 1, 2, 0, 0, 0];
  return {positions, indices, index: new TriangleBVH({positions, indices, leafSize})};
}

test.each([1, 2, 8])(
  'rejected foreground hits do not occlude accepted background surfaces (leaf %i)',
  leafSize => {
    const {index} = createFixture(leafSize);
    const acceptHit = vi.fn<NonNullable<TriangleRayOptions['acceptHit']>>(hit => hit.point[2] < 2);
    expect(index.intersectRay([0.5, 0.5, 5], [0, 0, -7], {acceptHit})).toEqual({
      index: 1,
      distance: 4,
      point: [0.5, 0.5, 1],
      barycentric: [0.5, 0.25, 0.25]
    });
    expect(acceptHit.mock.calls.map(([hit]) => hit.index).sort()).toEqual([0, 1, 2]);
    expect(index.intersectRay([0.5, 0.5, 5], [0, 0, -7], {acceptHit, maxDistance: 3})).toBeNull();
    expect(index.intersectRay([0.5, 0.5, 5], [0, 0, -7], {acceptHit, maxDistance: 4})?.index).toBe(
      1
    );
  }
);

test('index filters run before exact acceptance and stable ties retain original triangle identity', () => {
  const {index} = createFixture(1);
  const acceptHit = vi.fn(() => true);
  expect(
    index.intersectRay([0.5, 0.5, 5], [0, 0, -1], {filter: triangle => triangle !== 0, acceptHit})
      ?.index
  ).toBe(2);
  expect(acceptHit.mock.calls).toHaveLength(1);
  expect(index.intersectRay([0.5, 0.5, 5], [0, 0, -1], {acceptHit: () => true})?.index).toBe(0);
  expect(
    index.intersectRay([0.5, 0.5, 5], [0, 0, -1], {filter: () => false, acceptHit})
  ).toBeNull();
  expect(index.intersectRay([0.5, 0.5, 5], [0, 0, -1], {acceptHit: () => false})).toBeNull();
});

test('acceptance sees original vertex-order weights, physical distance and detached points', () => {
  const {index} = createFixture(1);
  let captured: Parameters<NonNullable<TriangleRayOptions['acceptHit']>>[0] | undefined;
  const result = index.intersectRay([0.5, 0.5, 5], [0, 0, -20], {
    acceptHit: hit => {
      captured = hit;
      return hit.barycentric[0] === 0.5;
    }
  });
  expect(captured).toEqual({
    index: 0,
    distance: 2,
    point: [0.5, 0.5, 3],
    barycentric: [0.5, 0.25, 0.25]
  });
  if (!result) throw new Error('Expected a hit');
  result.point[2] = 1000;
  result.barycentric[0] = 1000;
  expect(index.intersectRay([0.5, 0.5, 5], [0, 0, -1])?.point).toEqual([0.5, 0.5, 3]);
});

test('misses, degeneracy, backface culling, limits and callback errors keep explicit behavior', () => {
  const {index} = createFixture(1),
    acceptHit = vi.fn(() => true);
  expect(index.intersectRay([3, 3, 5], [0, 0, -1], {acceptHit})).toBeNull();
  expect(
    index.intersectRay([0.5, 0.5, 0], [0, 0, 1], {backfaceCulling: true, acceptHit})
  ).toBeNull();
  expect(
    new TriangleBVH({positions: []}).intersectRay([0, 0, 1], [0, 0, -1], {acceptHit})
  ).toBeNull();
  expect(acceptHit).not.toHaveBeenCalled();
  for (const maxDistance of [-1, NaN])
    expect(() => index.intersectRay([0, 0, 5], [0, 0, -1], {maxDistance, acceptHit})).toThrow();
  expect(() =>
    index.intersectRay([0, 0, 5], [0, 0, -1], {
      acceptHit: () => {
        throw new Error('provider failed');
      }
    })
  ).toThrow('provider failed');
  expect(index.intersectRay([0.5, 0.5, 3], [0, 0, -1], {maxDistance: 0, acceptHit})?.distance).toBe(
    0
  );
});

test.each([1, 1e-8, 1e8])(
  'fractional triangle kernels retain valid exact hits at scale %s',
  scale => {
    const positions = [0, 0, 0, 0.1 * scale, 0, 0, 0, 0.1 * scale, 0];
    const origin = [0.01 * scale, 0.01 * scale, 0.3 * scale],
      direction = [0, 0, -1];
    const expected = intersectRayTriangle(
      origin,
      direction,
      positions.slice(0, 3),
      positions.slice(3, 6),
      positions.slice(6, 9)
    );
    if (!expected) throw new Error('Expected a fractional triangle hit');
    const index = new TriangleBVH({positions});
    expect(index.intersectRay(origin, direction)?.distance).toBe(expected.t);
    expect(
      index.intersectRay(origin, direction, {maxDistance: expected.t, acceptHit: () => true})
        ?.distance
    ).toBe(expected.t);
    expect(
      index.intersectRay(origin, direction, {maxDistance: expected.t * (1 - 1e-10)})
    ).toBeNull();
  }
);

test('oblique rays preserve triangle-kernel results across nonunit directions', () => {
  const positions = [0, 0, 0, 2, 0, 0, 0, 2, 0];
  const index = new TriangleBVH({positions});
  for (const horizontal of [0, 0.3, 1, 1.5])
    for (const vertical of [0.1, 0.3, 1]) {
      if (horizontal + vertical > 2) continue;
      for (const altitude of [0.1, 3, 12345]) {
        const origin = [horizontal + 0.1, vertical + 0.7, altitude],
          direction = [-0.1, -0.7, -altitude];
        const unit = normalizeQueryDirection(direction, 3);
        const expected = intersectRayTriangle(
          origin,
          unit,
          positions.slice(0, 3),
          positions.slice(3, 6),
          positions.slice(6, 9)
        );
        const hit = index.intersectRay(origin, direction);
        expect(hit?.distance ?? null).toBe(expected?.t ?? null);
        expect(hit?.barycentric ?? null).toEqual(expected?.barycentric ?? null);
      }
    }
});

test.each([1, 8])(
  'filtered BVH agrees with exhaustive accepted-hit queries (leaf %i)',
  leafSize => {
    const {index, positions, indices} = createFixture(leafSize);
    const acceptHit: NonNullable<TriangleRayOptions['acceptHit']> = hit =>
      hit.index !== 2 && (hit.point[0] > 0.75 || hit.point[2] < 2);
    for (const horizontal of [0, 0.5, 1, 2, 3])
      for (const vertical of [0, 0.5, 1, 2])
        for (const maxDistance of [0, 2, 4, Infinity]) {
          const origin = [horizontal, vertical, 5],
            direction = [0, 0, -1];
          let expected: TriangleRayResult | null = null;
          for (let triangle = 0; triangle < indices.length / 3; triangle++) {
            const vertices = [0, 1, 2].map(vertex =>
              positions.slice(
                indices[triangle * 3 + vertex] * 3,
                indices[triangle * 3 + vertex] * 3 + 3
              )
            );
            const hit = intersectRayTriangle(
              origin,
              direction,
              vertices[0],
              vertices[1],
              vertices[2],
              {maxT: maxDistance}
            );
            if (!hit) continue;
            const candidate: TriangleRayResult = {
              index: triangle,
              distance: hit.t,
              point: [horizontal, vertical, 5 - hit.t],
              barycentric: hit.barycentric
            };
            if (acceptHit(candidate) && (!expected || hit.t < expected.distance))
              expected = candidate;
          }
          expect(index.intersectRay(origin, [0, 0, -7], {maxDistance, acceptHit})).toEqual(
            expected
          );
        }
  }
);
