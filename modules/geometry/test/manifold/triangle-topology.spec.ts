// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {analyzeTriangleTopology, applyTriangleIndexReplacements} from '../../src';

const tetrahedron = new Uint32Array([0, 2, 1, 0, 1, 3, 1, 2, 3, 2, 0, 3]);

describe('triangle topology', () => {
  test('finds opposite half-edges on a closed oriented tetrahedron', () => {
    const result = analyzeTriangleTopology({indices: tetrahedron, vertexCount: 4});
    expect(result.closedOrientedManifold).toBe(true);
    expect(result.boundaryEdgeCount).toBe(0);
    for (let halfEdge = 0; halfEdge < tetrahedron.length; halfEdge++) {
      const opposite = result.oppositeHalfEdges[halfEdge];
      expect(opposite).toBeGreaterThanOrEqual(0);
      expect(result.oppositeHalfEdges[opposite]).toBe(halfEdge);
    }
  });

  test('distinguishes boundaries, inconsistent winding and excess incidence', () => {
    expect(analyzeTriangleTopology({indices: [0, 1, 2]})).toMatchObject({
      boundaryEdgeCount: 3,
      closedOrientedManifold: false
    });
    expect(analyzeTriangleTopology({indices: [0, 1, 2, 0, 1, 3]}).inconsistentEdgeCount).toBe(1);
    expect(
      analyzeTriangleTopology({indices: [0, 1, 2, 1, 0, 3, 0, 1, 4]}).nonManifoldEdgeCount
    ).toBe(1);
    expect(analyzeTriangleTopology({indices: [0, 0, 1]}).degenerateTriangleCount).toBe(1);
    expect(analyzeTriangleTopology({indices: []}).closedOrientedManifold).toBe(false);
  });

  test('reconstructs a split render stream using sparse index replacements', () => {
    const split = Uint32Array.from(tetrahedron);
    split[0] = 4;
    expect(analyzeTriangleTopology({indices: split}).closedOrientedManifold).toBe(false);
    const reconstructed = applyTriangleIndexReplacements(split, [0], [0]);
    expect(reconstructed).toEqual(tetrahedron);
    expect(split[0]).toBe(4);
    expect(analyzeTriangleTopology({indices: reconstructed}).closedOrientedManifold).toBe(true);
  });

  test('rejects malformed triangles and sparse replacements', () => {
    expect(() => analyzeTriangleTopology({indices: [0, 1]})).toThrow();
    expect(() => analyzeTriangleTopology({indices: [0, 1, 4], vertexCount: 4})).toThrow();
    expect(() => applyTriangleIndexReplacements(tetrahedron, [1, 1], [0, 0])).toThrow();
    expect(() => applyTriangleIndexReplacements(tetrahedron, [12], [0])).toThrow();
    expect(() => applyTriangleIndexReplacements(tetrahedron, [0], [-1])).toThrow();
  });
});
