// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import Delatin from './vendor/delatin';
import type {HeightField} from './height-field';
import {assembleTerrainMesh} from './mesh-data';
import {createTerrainMesh} from './mesh';
import {measureTerrainMeshError} from './mesh-error';
import type {AdaptiveTerrainMesh, AdaptiveTerrainMeshOptions} from './adaptive-mesh-types';
export type {AdaptiveTerrainMesh} from './adaptive-mesh-types';

export type DelatinTerrainMeshOptions = AdaptiveTerrainMeshOptions & {
  /** Maximum point insertions; defaults to source sample count minus the four corners. */
  maxRefinements?: number;
};

/** Optional greedy Delaunay terrain meshing for complete rectangular grids.
 * Backend ownership lives here so loaders can retain decoding, padding, UVs, skirts and schema work.
 */
export function createDelatinTerrainMesh(
  field: HeightField,
  options: DelatinTerrainMeshOptions
): AdaptiveTerrainMesh {
  const count = field.width * field.height;
  const maxSamples = options.maxSamples ?? 1_100_000;
  const maxTriangles = options.maxTriangles ?? 2 * (field.width - 1) * (field.height - 1);
  const maxRefinements = options.maxRefinements ?? count - 4;
  if (!Number.isFinite(options.maxError) || options.maxError < 0)
    throw new Error('Delatin terrain maxError must be finite and nonnegative');
  for (const limit of [maxSamples, maxTriangles, maxRefinements])
    if (!Number.isSafeInteger(limit) || limit < 0)
      throw new Error('Invalid Delatin terrain capacity');
  if (count > maxSamples || count > 0xffffffff)
    throw new Error('Delatin terrain sample capacity exceeded');
  if (field.validCount !== count)
    throw new Error('Delatin terrain requires complete source data; use a regular mesh for holes');
  if (maxTriangles < 2) throw new Error('Delatin terrain triangle capacity exceeded');
  if ((options as {fullEdges?: unknown}).fullEdges !== undefined)
    throw new Error(
      'Delatin does not support fullEdges; use MARTINI for forced boundary refinement'
    );
  const {heights} = field.copyData();
  const tin = new Delatin(heights, field.width, field.height);
  let threshold = options.maxError,
    refinements = 0;
  for (let pass = 0; pass <= 8; pass++) {
    if (pass < 8) {
      while (true) {
        const error = tin.getMaxError();
        if (!Number.isFinite(error)) throw new Error('Delatin error arithmetic overflow');
        if (error <= threshold) break;
        if (refinements >= maxRefinements)
          throw new Error('Delatin terrain refinement budget exceeded');
        tin.refine();
        refinements++;
        if (tin.triangles.length / 3 > maxTriangles)
          throw new Error('Delatin terrain triangle capacity exceeded');
      }
    }
    if (pass === 8 && 2 * (field.width - 1) * (field.height - 1) > maxTriangles)
      throw new Error('Delatin terrain fallback triangle capacity exceeded');
    const indices = Uint32Array.from(tin.triangles);
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    const mesh =
      pass === 8
        ? createTerrainMesh(field, options)
        : assembleTerrainMesh(field, Uint32Array.from(tin.coords), indices, options);
    const error = measureTerrainMeshError(field, mesh, {maxSampleTests: options.maxSampleTests});
    if (!error.uncoveredSampleCount && error.maxSampleError <= options.maxError)
      return {
        ...mesh,
        error,
        requestedMaxError: options.maxError,
        refinementPasses: pass + 1,
        tessellator: pass === 8 ? 'regular' : 'delatin'
      };
    threshold /= 2;
  }
  throw new Error('Delatin terrain could not meet the requested sample error');
}
