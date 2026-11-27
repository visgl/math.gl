// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {TerrainLodMorph} from './lod-morph';
/** CPU reference for a uniform morph factor in [0,1]. Invalid targets remain
 * unavailable even at endpoints. No mutation, physics integration or shader code. */
export function evaluateTerrainLodMorph(
  morph: TerrainLodMorph,
  factor: number
): {heights: Float64Array; validity: Uint8Array} {
  const count = morph.width * morph.height;
  if (
    !Number.isFinite(factor) ||
    factor < 0 ||
    factor > 1 ||
    !Number.isSafeInteger(count) ||
    count < 1 ||
    morph.fineHeights.length !== count ||
    morph.coarseHeights.length !== count ||
    morph.statuses.length !== count
  )
    throw new Error('Invalid terrain morph evaluation');
  const heights = new Float64Array(count),
    validity = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    if (morph.statuses[i] > 3) throw new Error('Invalid terrain morph status');
    if (morph.statuses[i] !== 0) continue;
    const a = morph.fineHeights[i],
      b = morph.coarseHeights[i];
    if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Invalid terrain morph height');
    heights[i] = factor === 0 ? a : factor === 1 ? b : a * (1 - factor) + b * factor;
    if (!Number.isFinite(heights[i])) throw new Error('Terrain morph arithmetic overflow');
    validity[i] = 1;
  }
  return {heights, validity};
}
