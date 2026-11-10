// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export * from './experimental/index';
export {FullProjectionEngine, projectionEngine} from './lib/projection';

// Shared chart, raster and transition preparation for rendering integrations.
export {
  MapEngine,
  prepareMapTransitionMesh,
  prepareMapTransitionMeshAsync,
  createH3FaceMap
} from '../discontinuous';
export type {
  MapDescription,
  MapDefinition,
  MapSurfaceMesh,
  MapSurfaceMeshOptions,
  MapTransitionMesh,
  MapTransitionEndpoint,
  MapTransitionMeshPoint,
  MapTransitionMeshOptions,
  MapTransitionMeshAsyncOptions
} from '../discontinuous';

export {prepareProjectionSurface} from './surface';
export type {ProjectionSurfaceOptions} from './surface';
