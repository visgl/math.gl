// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  ProjectionTransform,
  checkProjectionCompatibility,
  normalizeCRS,
  TypeScriptCRSError,
  createProjectionDescriptor,
  preloadProjection,
  getLoadedProjection,
  ConfigurableProjectionEngine,
  createProjectionEngine
} from './core';
export type {
  ProjectionTransformOptions,
  ProjectionTransformCreateOptions,
  ProjectionCompatibility,
  ProjectionArray,
  ProjectionPoint,
  ProjectionFlatContext,
  ProjectionFlatOperation,
  ProjectionContext,
  ProjectionImplementation,
  ProjectionRenderingProfile,
  GeographicBounds,
  ProjectionParameters,
  ProjectionPlugin,
  DatumDefinition,
  DatumCatalogPlugin,
  NormalizedCRS,
  CRSParser,
  ParsedCRS,
  CRSNormalizationOptions,
  CRSCompatibilityReason,
  TypeScriptCRSInput,
  DatumGrid,
  DatumGridCollection,
  VerticalGrid,
  VerticalGridCollection,
  ProjectionDescriptor,
  ProjectionCoordinate,
  ProjectionOutput,
  SpheroidParameters,
  CRSEngine,
  CRSDescriptor,
  CRSConversion,
  CRSConverter,
  CRSBounds,
  CRSRenderingScale,
  CRSRenderingScaleCallback,
  GetCRSOptions,
  ProjectionEngine,
  ProjectionEngineOptions,
  CreateProjectionOptions,
  Projection,
  PreparedProjection,
  ProjectionAlgorithmIdentity,
  ProjectionCRSDescription,
  ProjectionTransformStage,
  ProjectionDirectionDescription,
  ProjectionTransformDescription
} from './core';
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
export {wktCRSParser} from './crs/wkt';
export {projJSONCRSParser} from './crs/projjson';
export {parseNTv2Grid} from './grids/ntv2';
export type {NTv2GridOptions} from './grids/ntv2';
export {loadGeoTIFFGrid} from './grids/geotiff';
export type {DatumGridGeoTIFF, DatumGridGeoTIFFImage} from './grids/geotiff';

export {parseGTXGrid} from './grids/gtx';
export {createVerticalGrid, createGeoidGrid} from './grids/vertical';
export type {VerticalGridOptions} from './grids/vertical';

export {loadVerticalGeoTIFFGrid} from './grids/vertical-geotiff';
export type {
  VerticalGridGeoTIFF,
  VerticalGridGeoTIFFImage,
  VerticalGridGeoTIFFData
} from './grids/vertical-geotiff';

export {ProjectionPipeline} from './projection-pipeline';
export type {
  PipelineEpochs,
  PipelineHelmertRates,
  PipelineUnit,
  PipelineCoordinateSystem,
  PipelineEllipsoid,
  PipelineProjectionOutput,
  PipelineStep,
  ProjectionPipelineOptions
} from './projection-pipeline';
