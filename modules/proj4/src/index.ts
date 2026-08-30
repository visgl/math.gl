// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {Proj4Projection} from './lib/proj4-projection';
export type {
  Proj4DatumGridOptions,
  Proj4ProjectionOptions
} from './lib/proj4-projection';
export {
  checkProj4CRSCompatibility,
  Proj4CRSCompatibilityError,
  toProj4CRSDefinition
} from './lib/proj4-crs';
export type {
  CheckProj4CRSCompatibilityOptions,
  Proj4CRSCompatibilityReason,
  Proj4CRSCompatibilityResult,
  Proj4CRSCompatibilityStatus,
  Proj4CRSDefinition,
  Proj4CRSConversionMode,
  Proj4PROJJSONCRS,
  Proj4SerializedCRSCheckMode,
  ToProj4CRSDefinitionOptions
} from './lib/proj4-crs';
