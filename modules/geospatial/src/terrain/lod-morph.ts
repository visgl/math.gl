// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {HeightField} from './height-field';
import {sampleTerrainTriangleHeight} from './sample-triangle-height';
export const TerrainMorphStatus = {
  VALID: 0,
  FINE_NO_DATA: 1,
  COARSE_NO_DATA: 2,
  OUTSIDE_COARSE: 3
} as const;
export type TerrainLodMorph = {
  width: number;
  height: number;
  origin: readonly [number, number];
  columnStep: readonly [number, number];
  rowStep: readonly [number, number];
  heightReference: string;
  fineHeights: Float64Array;
  coarseHeights: Float64Array;
  deltas: Float64Array;
  statuses: Uint8Array;
  /** Fine node -> coarse fractional grid coordinates. */
  coarseCoordinates: Float64Array;
  /** Maximum valid nodal vertical displacement; not a continuous geometric error certificate. */
  maxNodalDisplacement: number;
  ratio: number;
  coarseOrigin: readonly [number, number];
  diagonal: HeightField['diagonal'];
};
/** Prepare fine-node correspondence to a coarser regular triangle surface. Shared
 * affine frame, vertex registration, matching diagonal and dyadic ratio are required.
 * No extrapolation or nodata filling. Origins stay separate from local coordinates. */
export function createTerrainLodMorph(
  fine: HeightField,
  coarse: HeightField,
  options: {ratio: number; coarseOrigin?: readonly [number, number]; maxSamples?: number}
): TerrainLodMorph {
  const {ratio} = options,
    offset = options.coarseOrigin ?? [0, 0],
    limit = options.maxSamples ?? 4_000_000,
    count = fine.width * fine.height;
  if (
    !Number.isSafeInteger(ratio) ||
    ratio < 2 ||
    2 ** Math.round(Math.log2(ratio)) !== ratio ||
    offset.length !== 2 ||
    !offset.every(Number.isSafeInteger) ||
    !Number.isSafeInteger(limit) ||
    limit < 0 ||
    count > limit
  )
    throw new Error('Invalid terrain LOD ratio, origin or sample capacity');
  if (
    fine.registration !== 'vertex' ||
    coarse.registration !== 'vertex' ||
    fine.diagonal !== coarse.diagonal ||
    fine.heightReference !== coarse.heightReference
  )
    throw new Error('Incompatible terrain LOD registration, diagonal or height reference');
  for (let axis = 0; axis < 2; axis++) {
    if (
      fine.columnStep[axis] * ratio !== coarse.columnStep[axis] ||
      fine.rowStep[axis] * ratio !== coarse.rowStep[axis]
    )
      throw new Error('Terrain LOD steps differ');
    const a = offset[0] * fine.columnStep[axis],
      b = offset[1] * fine.rowStep[axis],
      expected = fine.origin[axis] + a + b;
    const tolerance = Math.min(
      16 *
        Number.EPSILON *
        Math.max(
          1,
          Math.abs(fine.origin[axis]),
          Math.abs(coarse.origin[axis]),
          Math.abs(a),
          Math.abs(b)
        ),
      1e-9 * Math.max(Math.abs(fine.columnStep[axis]), Math.abs(fine.rowStep[axis]))
    );
    if (!Number.isFinite(expected) || Math.abs(coarse.origin[axis] - expected) > tolerance)
      throw new Error('Terrain LOD origins differ');
  }
  const fineHeights = new Float64Array(count),
    coarseHeights = new Float64Array(count),
    deltas = new Float64Array(count),
    statuses = new Uint8Array(count),
    coarseCoordinates = new Float64Array(2 * count);
  let maxNodalDisplacement = 0;
  for (let y = 0; y < fine.height; y++)
    for (let x = 0; x < fine.width; x++) {
      const i = y * fine.width + x,
        u = (x - offset[0]) / ratio,
        v = (y - offset[1]) / ratio;
      if (!Number.isSafeInteger(x - offset[0]) || !Number.isSafeInteger(y - offset[1]))
        throw new Error('Terrain LOD lattice overflow');
      coarseCoordinates[2 * i] = u;
      coarseCoordinates[2 * i + 1] = v;
      const source = fine.getHeight(x, y);
      if (source === undefined) {
        statuses[i] = TerrainMorphStatus.FINE_NO_DATA;
        continue;
      }
      fineHeights[i] = source;
      if (u < 0 || v < 0 || u > coarse.width - 1 || v > coarse.height - 1) {
        statuses[i] = TerrainMorphStatus.OUTSIDE_COARSE;
        continue;
      }
      const target = sampleTerrainTriangleHeight(coarse, u, v);
      if (target === undefined) {
        statuses[i] = TerrainMorphStatus.COARSE_NO_DATA;
        continue;
      }
      const delta = target - source;
      if (!Number.isFinite(delta)) throw new Error('Terrain LOD displacement overflow');
      coarseHeights[i] = target;
      deltas[i] = delta;
      maxNodalDisplacement = Math.max(maxNodalDisplacement, Math.abs(delta));
    }
  return {
    width: fine.width,
    height: fine.height,
    origin: [...fine.origin],
    columnStep: [...fine.columnStep],
    rowStep: [...fine.rowStep],
    heightReference: fine.heightReference,
    fineHeights,
    coarseHeights,
    deltas,
    statuses,
    coarseCoordinates,
    maxNodalDisplacement,
    ratio,
    coarseOrigin: [...offset],
    diagonal: fine.diagonal
  };
}
