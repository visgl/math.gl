// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainGridMesh, TerrainMeshOptions} from './mesh-data';
import type {TerrainMeshError} from './mesh-error';

export type AdaptiveTerrainMeshOptions = TerrainMeshOptions & {
  /** Maximum independently measured vertical error at source nodes, in meters. */
  maxError: number;
  /** Admission bound before allocating the backend. Defaults to 1,100,000. */
  maxSamples?: number;
  /** Output capacity; exceeding it throws instead of reducing quality. */
  maxTriangles?: number;
  /** Per-certification-pass bounding-box tests. Defaults to 10,000,000. */
  maxSampleTests?: number;
};
export type AdaptiveTerrainMesh = TerrainGridMesh & {
  error: TerrainMeshError;
  requestedMaxError: number;
  /** Candidate meshes measured before meeting the requested nodal error (at most 9). */
  refinementPasses: number;
  /** Actual output topology; a regular fallback is reported explicitly. */
  tessellator: 'martini' | 'delatin' | 'regular';
};
