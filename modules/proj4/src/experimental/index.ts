// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {TypeScriptProjection} from './typescript-projection';
export type {TypeScriptProjectionOptions} from './typescript-projection';
export type {
  ProjectionContext,
  ProjectionImplementation,
  ProjectionParameters,
  ProjectionPlugin
} from './types';
export {mercator} from './projections/mercator';
export {equidistantCylindrical} from './projections/equidistant-cylindrical';
export {lambertConformalConic} from './projections/lcc';
export {albersEqualArea} from './projections/aea';
export {equidistantConic} from './projections/eqdc';
export {lambertAzimuthalEqualArea} from './projections/laea';
export {stereographic} from './projections/stere';
export {obliqueStereographic} from './projections/sterea';
export {azimuthalEquidistant} from './projections/aeqd';
export {transverseMercator, extendedTransverseMercator} from './projections/transverse-mercator';
export {universalTransverseMercator} from './projections/utm';

export {geocentric} from './projections/geocentric';
export {normalizeCRS} from './crs/normalize';
export {checkTypeScriptCRSCompatibility} from './typescript-projection';
export type {TypeScriptCRSCompatibility} from './typescript-projection';
export {TypeScriptCRSError} from './crs/types';
export type {
  NormalizedCRS,
  CRSParser,
  ParsedCRS,
  CRSNormalizationOptions,
  CRSCompatibilityReason
} from './crs/types';
export {wktCRSParser} from './crs/wkt';
export {projJSONCRSParser} from './crs/projjson';
export type {TypeScriptCRSInput} from './crs/spatial-reference';
