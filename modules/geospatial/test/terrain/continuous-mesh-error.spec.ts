// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {boundTerrainMeshError, createTerrainMesh, HeightField} from '@math.gl/geospatial/terrain';

test('continuous bounds enclose an independent saddle maximum between zero-error nodes', () => {
  const field = new HeightField({width: 2, height: 2, heights: Float64Array.of(0, 0, 0, 4)});
  const mesh = createTerrainMesh(field);
  // z_mesh = 4 min(x,y), z_bilinear = 4xy. Their maximum difference is 1 at (1/2,1/2).
  const result = boundTerrainMeshError(field, mesh, {reference: 'bilinear', gap: 0.1});
  expect(result.upperBound).toBeGreaterThanOrEqual(1);
  expect(result.upperBound).toBeLessThan(1.1);
  expect(result.lowerBound).toBeGreaterThan(0.9);
  expect(result.witness).not.toBeNull();
  expect(boundTerrainMeshError(field, mesh).upperBound).toBe(0);

  // Reversing the diagonal keeps all nodal values but changes the center by 2 m.
  const opposite = createTerrainMesh(
    new HeightField({
      width: 2,
      height: 2,
      heights: Float64Array.of(0, 0, 0, 4),
      diagonal: '10-01'
    })
  );
  const triangles = boundTerrainMeshError(field, opposite, {gap: 0.15, maxDepth: 16});
  expect(triangles.upperBound).toBeGreaterThanOrEqual(2);
  expect(triangles.upperBound).toBeLessThan(2.15);
});

test('half-cell nodata remains comparable only in triangle mode', () => {
  const field = new HeightField({width: 2, height: 2, heights: Float64Array.of(2, 3, NaN, 5)});
  const mesh = createTerrainMesh(field);
  expect(boundTerrainMeshError(field, mesh).upperBound).toBe(0);
  expect(boundTerrainMeshError(field, mesh, {reference: 'bilinear'}).upperBound).toBeNull();
  expect(() => boundTerrainMeshError(field, {...mesh, origin: [0, 0, 1]}, {maxBoxes: 1})).toThrow(
    /limit/
  );
});

test('fractional mesh footprints and rebased heights retain their vertical error', () => {
  const base = 1e12;
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: Float64Array.of(base, base, base, base)
  });
  const mesh = {
    gridCoordinates: [0.25, 0.25, 0.75, 0.25, 0.25, 0.75],
    positions: [0, 0, 3, 0, 0, 3, 0, 0, 3],
    indices: [0, 1, 2],
    origin: [0, 0, base] as const,
    heightReference: field.heightReference
  };
  const bound = boundTerrainMeshError(field, mesh, {reference: 'bilinear'});
  expect(bound.upperBound).toBeGreaterThanOrEqual(3);
  expect(bound.upperBound).toBeLessThan(3.001);
  expect(bound.lowerBound).toBeGreaterThan(2.999);
  expect(bound.converged).toBe(true);
  expect(
    boundTerrainMeshError(field, {...mesh, gridCoordinates: [2, 2, 3, 2, 2, 3]}).upperBound
  ).toBeNull();
});
