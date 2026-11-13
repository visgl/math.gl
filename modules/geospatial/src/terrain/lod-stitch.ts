// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainMeshEdge} from './mesh-data';
import {
  stitchTerrainMeshEdges,
  type TerrainSeamMesh,
  type TerrainMeshStitchOptions
} from './mesh-stitch';

export type TerrainLodSeam = {
  /** The first tile owns the seam heights. Process coarse owners first. */
  a: number;
  edgeA: TerrainMeshEdge;
  b: number;
  edgeB: TerrainMeshEdge;
  options?: TerrainMeshStitchOptions;
};

/** Stitch a selected cut by splitting only incident boundary faces. */
export function stitchTerrainLodCut(
  input: readonly TerrainSeamMesh[],
  seams: readonly TerrainLodSeam[]
): TerrainSeamMesh[] {
  const meshes = input.slice();
  const paired: {a: number; b: number; idsA: Uint32Array; idsB: Uint32Array}[] = [];
  for (const {a, edgeA, b, edgeB, options} of seams) {
    if (a === b || !Number.isInteger(a) || !Number.isInteger(b) || !meshes[a] || !meshes[b])
      throw new Error('Invalid terrain LOD seam tile index');
    const result = stitchTerrainMeshEdges(meshes[a], edgeA, meshes[b], edgeB, options);
    meshes[a] = result.a;
    meshes[b] = result.b;
    paired.push({a, b, idsA: result.seamA, idsB: result.seamB});
  }
  // Later operations may move shared corners or subdivide an earlier seam.
  // Recheck complete segment chains against the final meshes.
  for (const {a, b, idsA, idsB} of paired) {
    const ma = meshes[a],
      mb = meshes[b];
    const path = (mesh: TerrainSeamMesh, ids: Uint32Array) => {
      const links = new Set<string>();
      for (let i = 1; i < ids.length; i++) {
        links.add(`${Math.min(ids[i - 1], ids[i])},${Math.max(ids[i - 1], ids[i])}`);
      }
      for (let i = 0; i < mesh.indices.length; i += 3) {
        for (let j = 0; j < 3; j++) {
          const p = mesh.indices[i + j],
            q = mesh.indices[i + ((j + 1) % 3)];
          links.delete(`${Math.min(p, q)},${Math.max(p, q)}`);
        }
      }
      return links.size === 0;
    };
    if (!path(ma, idsA) || !path(mb, idsB))
      throw new Error('Overlapping terrain LOD seam ranges require a common subdivision');
    for (let i = 0; i < idsA.length; i++) {
      for (let axis = 0; axis < 3; axis++) {
        const offset = mb.origin[axis] - ma.origin[axis];
        const av = ma.positions[3 * idsA[i] + axis],
          bv = mb.positions[3 * idsB[i] + axis];
        const residual = av - bv - offset;
        const roundoff = 8 * Number.EPSILON * (Math.abs(av) + Math.abs(bv) + Math.abs(offset));
        if (!Number.isFinite(residual) || Math.abs(residual) > roundoff)
          throw new Error('Incompatible terrain LOD seam heights or shared corners');
      }
    }
  }
  return meshes;
}
