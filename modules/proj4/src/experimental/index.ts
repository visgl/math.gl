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
export {bonne} from './projections/bonne';
export {cassiniSoldner} from './projections/cass';
export {cylindricalEqualArea} from './projections/cea';
export {eckertVI} from './projections/eck6';
export {equalEarth} from './projections/eqearth';
export {equirectangular} from './projections/equi';
export {geostationary} from './projections/geos';
export {gnomonic} from './projections/gnom';
export {gaussSchreiberTransverseMercator} from './projections/gstmerc';
export {krovak} from './projections/krovak';
export {millerCylindrical} from './projections/mill';
export {mollweide} from './projections/moll';
export {newZealandMapGrid} from './projections/nzmg';
export {obliqueMercator} from './projections/omerc';
export {orthographic} from './projections/ortho';
export {polyconic} from './projections/poly';
export {quadrilateralizedSphericalCube} from './projections/qsc';
export {robinson} from './projections/robin';
export {sinusoidal} from './projections/sinu';
export {swissObliqueMercator} from './projections/somerc';
export {tiltedPerspective} from './projections/tpers';
export {vanDerGrinten} from './projections/vandg';
export {obliqueTransformation} from './projections/ob-tran';

export {parseNTv2Grid} from './grids/ntv2';
export type {NTv2GridOptions} from './grids/ntv2';
export {loadGeoTIFFGrid} from './grids/geotiff';
export type {DatumGridGeoTIFF, DatumGridGeoTIFFImage} from './grids/geotiff';
export type {DatumGrid, DatumGridCollection} from './grids/types';
