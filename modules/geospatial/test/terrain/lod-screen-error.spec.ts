// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {mat4FrustumProjection} from '@math.gl/core';
import {
  boundTerrainLodScreenError,
  selectTerrainLod,
  type TerrainLodErrorBounds,
  type TerrainLodProjection
} from '@math.gl/geospatial/terrain';

/** Cartesian point or displacement used by the projection oracle. */
type Point = readonly [number, number, number];

/** Directly project a pair of points, independently of the bound's algebra. */
function pixelDistance(
  matrix: ArrayLike<number>,
  a: Point,
  b: Point,
  width: number,
  height: number
) {
  const project = ([x, y, z]: Point) => {
    const clip = [0, 1, 2, 3].map(
      i => matrix[i] * x + matrix[i + 4] * y + matrix[i + 8] * z + matrix[i + 12]
    );
    return [(width * (1 + clip[0] / clip[3])) / 2, (height * (1 - clip[1] / clip[3])) / 2];
  };
  const p = project(a);
  const q = project(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1]);
}

/** Asymmetric perspective with positive camera-forward depth and a near plane at Z=1. */
const perspective = [1.5, 0, 0, 0, 0, 2, 0, 0, 0.4, -0.2, 1.25, 1, 0, 0, -2.25, 0];
/** Non-square viewport and asymmetric perspective projection. */
const projection = {matrix: perspective, width: 1300, height: 720};

test('certificate encloses independently projected pairs in a rotated off-axis view', () => {
  // Rotate the camera frame so depth also depends on world X.
  const matrix = perspective.map((value, i) =>
    i < 4
      ? 0.8 * value + 0.6 * perspective[i + 8]
      : i >= 8 && i < 12
        ? -0.6 * perspective[i - 8] + 0.8 * value
        : value
  );
  const bounds = {min: [10, -1, 2], max: [13, 2, 5], geometricError: 0.4} as const;
  const bound = boundTerrainLodScreenError(bounds, {...projection, matrix});
  expect(Number.isFinite(bound)).toBe(true);
  let observed = 0;
  for (const x of [10, 11.5, 13]) {
    for (const y of [-1, 0.5, 2]) {
      for (const z of [2, 3.5, 5]) {
        for (const dx of [-0.2, 0, 0.2]) {
          for (const dy of [-0.2, 0, 0.2]) {
            for (const dz of [-0.2, 0, 0.2]) {
              observed = Math.max(
                observed,
                pixelDistance(matrix, [x, y, z], [x + dx, y + dy, z + dz], 1300, 720)
              );
            }
          }
        }
      }
    }
  }
  expect(observed).toBeGreaterThan(0);
  expect(bound).toBeGreaterThanOrEqual(observed);
});

test('orthographic projection encloses the analytical horizontal displacement', () => {
  const matrix = [0.5, 0, 0, 0, 0, 0.25, 0, 0, 0, 0, 0.1, 0, 0.3, 0, 0, 1];
  const bound = boundTerrainLodScreenError(
    {min: [1, 0, 5], max: [3, 1, 6], geometricError: 0.25},
    {
      matrix,
      width: 800,
      height: 400,
      depthRange: 'zero-to-one'
    }
  );
  expect(bound).toBeGreaterThanOrEqual(50);
  expect(bound).toBeLessThan(63);
});

test('near-plane crossings, clipped volumes and zero error are explicit in either clip convention', () => {
  const zeroToOne = [...perspective];
  zeroToOne[10] = 1.25;
  zeroToOne[14] = -1.25;
  const cases: TerrainLodProjection[] = [
    projection,
    {...projection, matrix: zeroToOne, depthRange: 'zero-to-one'}
  ];
  for (const view of cases) {
    const at = (z: number, geometricError = 0.25): TerrainLodErrorBounds => ({
      min: [0, 0, z],
      max: [1, 1, z],
      geometricError
    });
    expect(boundTerrainLodScreenError(at(0.25), view)).toBe(0);
    expect(boundTerrainLodScreenError(at(0.9), view)).toBe(Infinity);
    expect(boundTerrainLodScreenError(at(1.125), view)).toBe(Infinity);
    expect(boundTerrainLodScreenError(at(1, 0), view)).toBe(0);
    expect(Number.isFinite(boundTerrainLodScreenError(at(3), view))).toBe(true);
  }
  expect(() =>
    boundTerrainLodScreenError({min: [0, 0, 0], max: [1, 1, 1], geometricError: -1}, projection)
  ).toThrow(RangeError);
});

test('resident selection refines a near-crossing tile and exposes infinity during fallback', () => {
  const child = {
    id: 'child',
    min: [0, 0, 1.125] as const,
    max: [1, 1, 2] as const,
    geometricError: 0,
    resident: true
  };
  const parent = {...child, id: 'parent', geometricError: 0.25, children: [child]};
  const view = {projection, targetPixels: 100};
  expect(selectTerrainLod([parent], view).selected).toEqual([{tile: child, pixels: 0}]);
  const fallback = {...parent, children: [{...child, resident: false}]};
  expect(selectTerrainLod([fallback], view).selected).toEqual([{tile: fallback, pixels: Infinity}]);
});

test('uncertain homogeneous division and invalid empty-cut projections are explicit', () => {
  const matrix = [...perspective];
  matrix[10] = 0;
  matrix[14] = 10;
  expect(
    boundTerrainLodScreenError(
      {min: [0, 0, 0.125], max: [1, 1, 1], geometricError: 0.25},
      {...projection, matrix, depthRange: 'zero-to-one'}
    )
  ).toBe(Infinity);
  expect(() =>
    selectTerrainLod([], {
      targetPixels: 1,
      projection: {...projection, matrix: []}
    })
  ).toThrow(/clip matrix/);
});

test('core projection options work with both forward and reversed depth', () => {
  for (const depthRange of ['negative-one-to-one', 'zero-to-one'] as const) {
    for (const reversedDepth of [false, true]) {
      const options = {depthRange, reversedDepth};
      const matrix = mat4FrustumProjection(new Float64Array(16), {
        left: -0.5,
        right: 1,
        bottom: -1,
        top: 1,
        near: 1,
        far: 100,
        ...options
      });
      const view = {...projection, matrix, ...options};
      const at = (z: number): TerrainLodErrorBounds => ({
        min: [0, 0, z],
        max: [1, 1, z],
        geometricError: 0.25
      });
      expect(boundTerrainLodScreenError(at(-0.25), view)).toBe(0);
      expect(boundTerrainLodScreenError(at(-1.125), view)).toBe(Infinity);
      expect(Number.isFinite(boundTerrainLodScreenError(at(-3), view))).toBe(true);
    }
  }
});
