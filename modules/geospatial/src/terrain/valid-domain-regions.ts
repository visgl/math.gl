// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {TerrainDirtyWindow} from './dirty-regions';
import type {HeightField} from './height-field';
import {updateMeshRegions, type TerrainMeshRegions} from './mesh-regions-data';
import {createValidDomainTerrainMesh, type ValidDomainTerrainMesh} from './valid-domain-mesh';

export type TerrainValidDomainMeshRegions = TerrainMeshRegions<ValidDomainTerrainMesh>;

export type TerrainValidDomainRegionOptions = {
  maxError: number;
  cellsPerRegion?: number;
  maxSamples?: number;
  maxTests?: number;
  maxTrianglesPerRegion?: number;
  maxSampleTestsPerRegion?: number;
};

/** Rebuild only affected adaptive regions, retaining each valid regular half-cell domain. */
export function updateTerrainValidDomainMeshRegions(
  previous: TerrainValidDomainMeshRegions | null,
  field: HeightField,
  dirty: readonly TerrainDirtyWindow[],
  options: TerrainValidDomainRegionOptions
): TerrainValidDomainMeshRegions {
  const {maxError, maxTrianglesPerRegion, maxSampleTestsPerRegion} = options;
  if (!Number.isFinite(maxError) || maxError < 0) throw new Error('Invalid regional mesh error');
  for (const limit of [maxTrianglesPerRegion, maxSampleTestsPerRegion]) {
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1))
      throw new Error('Invalid regional mesh work limit');
  }
  const configuration = `valid-domain:${maxError}:${maxTrianglesPerRegion ?? ''}:${maxSampleTestsPerRegion ?? ''}`;
  return updateMeshRegions(previous, field, dirty, options, configuration, region =>
    createValidDomainTerrainMesh(region, {
      maxError,
      maxTriangles: maxTrianglesPerRegion,
      maxSampleTests: maxSampleTestsPerRegion
    })
  );
}
