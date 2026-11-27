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
  /** Translate B along X for this seam, then restore its original longitude branch. */
  offsetBX?: number;
};

/** Stitch a selected cut by splitting only incident boundary faces. */
export function stitchTerrainLodCut(
  input: readonly TerrainSeamMesh[],
  seams: readonly TerrainLodSeam[]
): TerrainSeamMesh[] {
  const meshes = input.slice();
  const paired: {a: number; b: number; idsA: Uint32Array; idsB: Uint32Array; offsetBX: number}[] =
    [];
  for (const {a, edgeA, b, edgeB, options, offsetBX = 0} of seams) {
    if (a === b || !Number.isInteger(a) || !Number.isInteger(b) || !meshes[a] || !meshes[b])
      throw new Error('Invalid terrain LOD seam tile index');
    if (!Number.isFinite(offsetBX)) throw new Error('Invalid terrain LOD seam offset');
    const meshB = meshes[b];
    const shiftedB: TerrainSeamMesh =
      offsetBX === 0
        ? meshB
        : {
            ...meshB,
            origin: [meshB.origin[0] + offsetBX, meshB.origin[1], meshB.origin[2]]
          };
    const result = stitchTerrainMeshEdges(meshes[a], edgeA, shiftedB, edgeB, options);
    meshes[a] = result.a;
    meshes[b] =
      offsetBX === 0
        ? result.b
        : {
            ...result.b,
            origin: [result.b.origin[0] - offsetBX, result.b.origin[1], result.b.origin[2]]
          };
    paired.push({a, b, idsA: result.seamA, idsB: result.seamB, offsetBX});
  }
  // Later operations may move shared corners or subdivide an earlier seam.
  // Recheck complete segment chains against the final meshes.
  for (const {a, b, idsA, idsB, offsetBX} of paired) {
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
        const offset = mb.origin[axis] + (axis === 0 ? offsetBX : 0) - ma.origin[axis];
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
