// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {composeAttributeProvenance} from '../src/utils/compose-attribute-provenance';
import {qualifySurfaceTransition} from '../src/utils/qualify-surface-transition';
import {clipTriangleMesh} from '../src/polygon/clip-triangle-mesh';
import {subdivideTriangleMesh} from '../src/polygon/subdivide-triangle-mesh';
const mesh = {positions: [0, 0, 2, 0, 0, 2], indices: [0, 1, 2]};
test('composes clipping and refinement back to original triangle attributes', () => {
  const clipped = clipTriangleMesh(mesh, {
    regions: [
      [
        [0, 0],
        [1, 0],
        [1, 2],
        [0, 2]
      ]
    ]
  });
  const refined = subdivideTriangleMesh(clipped, {
    refinement: 'source-edge',
    maxEdgeLength: 0.3,
    transform: p => p
  });
  const result = composeAttributeProvenance(clipped, refined);
  for (let i = 0; i < refined.positions.length / 2; i++)
    for (let k = 0; k < 2; k++) {
      let value = 0;
      for (let j = 0; j < 3; j++)
        value +=
          mesh.positions[result.sourceVertexIndices[3 * i + j] * 2 + k] *
          result.sourceVertexWeights[3 * i + j];
      expect(value).toBeCloseTo(refined.positions[2 * i + k], 12);
    }
  expect(structuredClone(result)).toEqual(result);
  expect(() => composeAttributeProvenance(clipped, refined, {maxVertices: 1})).toThrow(
    'maxVertices'
  );
});
test('composition rejects malformed weights and ambiguous multi-triangle blends', () => {
  const parent = {
    sourceVertexIndices: [0, 1, 2, 3, 4, 5],
    sourceVertexWeights: [0.2, 0.3, 0.5, 0.2, 0.3, 0.5]
  };
  expect(() =>
    composeAttributeProvenance(parent, {
      sourceVertexIndices: [0, 1, 0],
      sourceVertexWeights: [0.5, 0.5, 0]
    })
  ).toThrow('multiple source triangles');
  expect(() =>
    composeAttributeProvenance(parent, {
      sourceVertexIndices: [0, 0, 0],
      sourceVertexWeights: [-1, 1, 1]
    })
  ).toThrow();
  expect(() =>
    composeAttributeProvenance(parent, {
      sourceVertexIndices: [2, 0, 0],
      sourceVertexWeights: [1, 0, 0]
    })
  ).toThrow();
  expect(() =>
    composeAttributeProvenance(parent, {
      sourceVertexIndices: [0, 0, 0],
      sourceVertexWeights: [0.1, 0, 0]
    })
  ).toThrow();
});
const flat = {positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2]};
test('qualifies a fixed convex patch with moving heights and rejects hidden intermediate reversal', () => {
  expect(qualifySurfaceTransition(flat, [0, 0, 1, 2, 0, 3, 0, 2, -2]).scope).toBe(
    'convex-xy-disk-linear'
  );
  // Both endpoint orientations are positive; a narrow intermediate interval reverses.
  expect(() =>
    qualifySurfaceTransition(flat, [0, 0, 0, 1 - 1 / 0.31, 0, 0, 0, 1 - 1 / 0.32, 0])
  ).toThrow('collapses or reverses');
  expect(() => qualifySurfaceTransition(flat, flat.positions, {maxChecks: 0})).toThrow('maxChecks');
  expect(() => qualifySurfaceTransition(flat, [0, 0, 0, 1, 0, 0, 0, 0, 0])).toThrow();
});
test('rejects disconnected/nonmanifold/nonconvex meshes and accepts refined collinear boundaries', () => {
  const refined = subdivideTriangleMesh(mesh, {
    refinement: 'source-edge',
    maxEdgeLength: 0.5,
    transform: p => [...p, 0],
    targetSize: 3
  });
  expect(qualifySurfaceTransition(refined, refined.positions).boundary.length).toBeGreaterThan(3);
  expect(() =>
    qualifySurfaceTransition({...flat, indices: [0, 1, 2, 0, 1, 2]}, flat.positions)
  ).toThrow('manifold');
  expect(() =>
    qualifySurfaceTransition(
      {
        positions: [0, 0, 0, 2, 0, 0, 1, 0.5, 0, 2, 2, 0, 0, 2, 0],
        indices: [0, 1, 2, 0, 2, 4, 2, 3, 4]
      },
      [0, 0, 0, 2, 0, 0, 1, 0.5, 0, 2, 2, 0, 0, 2, 0]
    )
  ).toThrow('convex');
  expect(() =>
    qualifySurfaceTransition({...flat, positions: [...flat.positions, 2, 2, 2]}, [
      ...flat.positions,
      2,
      2,
      2
    ])
  ).toThrow('unused');
});

test('composition coalesces contributors, ignores unused indices and normalizes numerical weights', () => {
  const parent = {sourceVertexIndices: [2, 2, NaN], sourceVertexWeights: [0.4, 0.6, 0]};
  const child = {sourceVertexIndices: [0, NaN, NaN], sourceVertexWeights: [1 - 5e-11, 0, 0]};
  const p = composeAttributeProvenance(parent, child);
  expect(Array.from(p.sourceVertexIndices)).toEqual([2, 0, 0]);
  expect(Array.from(p.sourceVertexWeights)).toEqual([1, 0, 0]);
  expect(() => composeAttributeProvenance({...parent, sourceVertexWeights: [0.1]}, child)).toThrow(
    'lengths'
  );
  expect(() => composeAttributeProvenance(parent, child, {maxVertices: -1})).toThrow('limit');
});
test('qualification rejects invalid storage and holes rather than inventing correspondence', () => {
  expect(() => qualifySurfaceTransition(flat, [NaN, ...flat.positions.slice(1)])).toThrow(
    'Invalid'
  );
  expect(() => qualifySurfaceTransition(flat, flat.positions, {minimumDoubleArea: 0})).toThrow(
    'margin'
  );
  const positions = [0, 0, 0, 3, 0, 0, 3, 3, 0, 0, 3, 0, 1, 1, 0, 2, 1, 0, 2, 2, 0, 1, 2, 0];
  const ring = {
    positions,
    indices: [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]
  };
  expect(() => qualifySurfaceTransition(ring, positions)).toThrow('disk');
  const report = qualifySurfaceTransition(flat, flat.positions);
  expect(structuredClone(report)).toEqual(report);
});

test('rejects a locally positive double cover with repeated convex-boundary positions', () => {
  const positions = [
    0, 0, 0, 1, 0, 0, 0, 1, 0, -1, 0, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0, -1, 0, 0, 0, -1, 0
  ];
  const indices: number[] = [];
  for (let i = 1; i <= 8; i++) indices.push(0, i, i === 8 ? 1 : i + 1);
  expect(() => qualifySurfaceTransition({positions, indices}, positions)).toThrow(
    'Boundary vertices meet'
  );
});

test('qualification is invariant to large independently moving world origins', () => {
  const target = [0, 0, 0, 2, 0, 1, 0, 2, -1];
  const baseline = qualifySurfaceTransition(flat, target);
  const shift = (p: number[], offset: number) => p.map((v, i) => v + (i % 3 < 2 ? offset : 0));
  const translated = qualifySurfaceTransition(
    {positions: shift(flat.positions, 1e12), indices: flat.indices},
    shift(target, -1e12)
  );
  expect(translated.minimumProjectedDoubleArea).toEqual(baseline.minimumProjectedDoubleArea);
  expect(translated.boundary).toEqual(baseline.boundary);
});
