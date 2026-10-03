// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Engine and contracts only: no projection catalogue or optional readers.
export {ProjectionEngine, checkProjectionCompatibility} from './typescript-projection';
export type {
  ProjectionEngineOptions,
  ProjectionEngineCreateOptions,
  ProjectionCompatibility,
  ProjectionArray
} from './typescript-projection';
export type {
  ProjectionPoint,
  ProjectionFlatContext,
  ProjectionFlatOperation,
  ProjectionContext,
  ProjectionImplementation,
  ProjectionParameters,
  ProjectionPlugin
} from './types';
export {normalizeCRS} from './crs/normalize';
export {TypeScriptCRSError} from './crs/types';
export type {
  NormalizedCRS,
  CRSParser,
  ParsedCRS,
  CRSNormalizationOptions,
  CRSCompatibilityReason
} from './crs/types';
export type {TypeScriptCRSInput} from './crs/spatial-reference';
export type {
  DatumGrid,
  DatumGridCollection,
  VerticalGrid,
  VerticalGridCollection
} from './grids/types';

export {
  createProjectionDescriptor,
  preloadProjection,
  getLoadedProjection
} from './projection-descriptor';
export type {ProjectionDescriptor} from './projection-descriptor';
