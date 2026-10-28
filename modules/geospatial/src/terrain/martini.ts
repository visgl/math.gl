// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import Martini from '@mapbox/martini';
import type {HeightField} from './height-field';
import {assembleTerrainMesh, type TerrainMeshEdge} from './mesh-data';
import {measureTerrainMeshError} from './mesh-error';
import type {AdaptiveTerrainMesh, AdaptiveTerrainMeshOptions} from './adaptive-mesh-types';
export type {AdaptiveTerrainMesh} from './adaptive-mesh-types';

export type MartiniTerrainMeshOptions = AdaptiveTerrainMeshOptions & {
  /** Force every sample on selected grid edges into the mesh, independently of maxError. */
  fullEdges?: readonly TerrainMeshEdge[];
};

/** Optional MARTINI RTIN adapter, with independent nodal-error measurement and explicit edge constraints.
 * Requires a complete square (2^k+1) grid. Output is plain data; no renderer or query index is built.
 */
export function createMartiniTerrainMesh(
  field: HeightField,
  options: MartiniTerrainMeshOptions
): AdaptiveTerrainMesh {
  const size = field.width,
    cells = size - 1;
  const maxSamples = options.maxSamples ?? 1_100_000,
    maxTriangles = options.maxTriangles ?? 2 * cells * cells;
  if (!Number.isFinite(options.maxError) || options.maxError < 0)
    throw new Error('Adaptive terrain maxError must be finite and nonnegative');
  for (const value of [maxSamples, maxTriangles])
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error('Invalid adaptive terrain capacity');
  if (size !== field.height || cells < 1 || cells > 32768 || (cells & (cells - 1)) !== 0)
    throw new Error('Adaptive terrain requires a square (2^k+1) grid within uint16 coordinates');
  if (size * size > maxSamples) throw new Error('Adaptive terrain sample capacity exceeded');
  if (field.validCount !== size * size)
    throw new Error('Adaptive terrain requires complete source data; use a regular mesh for holes');
  const edges = options.fullEdges ?? [];
  for (const edge of edges)
    if (!['minColumn', 'maxColumn', 'minRow', 'maxRow'].includes(edge))
      throw new Error('Unknown adaptive terrain edge');
  const {heights} = field.copyData();
  const tile = new Martini(size).createTile(heights);
  // Pinned MARTINI 0.2.0 exposes its error grid. Infinity forces selected edge midpoints;
  // update propagates these requirements to ancestors, retaining conforming RTIN splits.
  for (const edge of edges)
    for (let i = 0; i < size; i++) {
      const column = edge === 'minColumn' ? 0 : edge === 'maxColumn' ? cells : i;
      const row = edge === 'minRow' ? 0 : edge === 'maxRow' ? cells : i;
      tile.errors[row * size + column] = Infinity;
    }
  if (edges.length) tile.update();
  let threshold = options.maxError;
  // MARTINI's f32 midpoint-error heuristic is not treated as an error certificate.
  // Refine failed candidates; the final pass forces the full RTIN triangulation.
  for (let pass = 0; pass <= 8; pass++) {
    const {vertices, triangles} = tile.getMesh(pass === 8 ? -1 : threshold);
    if (triangles.length / 3 > maxTriangles)
      throw new Error('Adaptive terrain triangle capacity exceeded');
    // MARTINI emits clockwise grid triangles. Our shared assembler takes CCW grid indices.
    const indices = Uint32Array.from(triangles);
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    const mesh = assembleTerrainMesh(field, Uint32Array.from(vertices), indices, options);
    const error = measureTerrainMeshError(field, mesh, {maxSampleTests: options.maxSampleTests});
    if (!error.uncoveredSampleCount && error.maxSampleError <= options.maxError)
      return {
        ...mesh,
        error,
        requestedMaxError: options.maxError,
        refinementPasses: pass + 1,
        tessellator: 'martini'
      };
    threshold /= 2;
  }
  throw new Error('Adaptive terrain could not meet the requested sample error');
}
