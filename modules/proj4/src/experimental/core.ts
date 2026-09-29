// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Engine and contracts only: no projection catalogue or optional readers.
export {TypeScriptProjection, checkTypeScriptCRSCompatibility} from './typescript-projection';
export type {
  TypeScriptProjectionOptions,
  ProjectionArray,
  TypeScriptCRSCompatibility
} from './typescript-projection';
export type {
  ProjectionPoint,
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
export type {DatumGrid, DatumGridCollection} from './grids/types';
