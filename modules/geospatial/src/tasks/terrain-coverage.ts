// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Task} from '@math.gl/tasks';
import type {HeightFieldProps} from '../terrain/types';
import type {TerrainCoverageMesh, TerrainMeshCoverage} from '../terrain/mesh-coverage';

export type CertifyTerrainCoverageTypes = {
  input: {field: HeightFieldProps; mesh: TerrainCoverageMesh};
  output: TerrainMeshCoverage;
  options: {reference?: 'triangle' | 'bilinear' | TerrainCoverageMesh; maxTriangles?: number};
};

/** Certify coverage from serializable field and triangle buffers. */
export const CertifyTerrainCoverageTask = {
  id: 'certify-terrain-coverage',
  async process({field, mesh}, options) {
    const [{HeightField}, {certifyTerrainMeshCoverage}] = await Promise.all([
      import('../terrain/height-field'),
      import('../terrain/mesh-coverage')
    ]);
    return certifyTerrainMeshCoverage(new HeightField(field), mesh, options);
  }
} satisfies Task<CertifyTerrainCoverageTypes>;
