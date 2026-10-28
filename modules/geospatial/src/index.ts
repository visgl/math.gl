// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export * from './entries/ellipsoid';
export * from './globe';
export * from './tiles';

// Public named exports. Implementations remain in independently tree-shakable files.
export {
  PROJJSON_SCHEMA_URL,
  PROJJSON_SCHEMA_VERSION,
  createSpatialReference,
  createCRSDescriptor,
  createCRSProjectionDomain,
  createCRSExecutionIdentity,
  getCRSExecutionKey,
  inferCRSRepresentation,
  encodeWKTCRS,
  parseWKTCRS,
  validateWKTCRS,
  WKTCRSSyntaxError,
  WKTCRSValidationError,
  encodePROJString,
  parsePROJString,
  PROJStringSyntaxError,
  getCRSSignature,
  linearUnits
} from './crs/index';
export type {
  CRSExecutionIdentity,
  CRSDefinition,
  CRSIdentifier,
  CRSStringDefinition,
  PROJJSONCRS,
  PROJJSONCRSByType,
  PROJJSONCRSType,
  PROJStringDefinition,
  WKTCRSDefinition,
  CreateSpatialReferenceOptions,
  CRSInput,
  CRSReference,
  KnownCRSReference,
  ReadonlyCRSDefinition,
  ReadonlyPROJJSONCRS,
  SpatialReference,
  SpatialReferenceAlternative,
  SpatialReferenceCoordinateFrame,
  SpatialReferenceProvenance,
  SpatialReferenceRepresentation,
  SpatialReferenceState,
  UnresolvedCRSReference,
  EncodeWKTCRSOptions,
  ParseWKTCRSOptions,
  ValidateWKTCRSOptions,
  WKTCRSAst,
  WKTCRSDelimiter,
  WKTCRSEnumeration,
  WKTCRSNode,
  WKTCRSNumber,
  WKTCRSProfile,
  WKTCRSString,
  WKTCRSValidationIssue,
  WKTCRSValidationIssueCode,
  WKTCRSValue,
  EncodePROJStringOptions,
  PROJParameter,
  PROJStringAst,
  CRSMetadata,
  CRSDescriptorOptions,
  CRSProjectionDomainPoint,
  CRSProjectionDomainRing,
  CRSProjectionDomainPolygon,
  CRSProjectionPeriod,
  CRSProjectionDomain,
  CRSCoordinate,
  CRSOutput,
  CRSDescriptor,
  CRSConversion,
  CRSConverter,
  CRSBounds,
  CRSRenderingScale,
  CRSRenderingScaleCallback,
  CRSUnit
} from './crs/index';
export {createCRSDictionaryProvider, createCRSResolver, CRSResolutionError} from './crs/resolver';
export type {
  CRSDefinitionProvider,
  CRSLookup,
  CRSResolution,
  CRSResolverOptions,
  CRSResolver
} from './crs/resolver';
export {
  WebMercatorViewport,
  getBounds,
  fitBounds,
  normalizeViewportProps,
  flyToViewport,
  getFlyToDuration,
  MAX_LATITUDE,
  lngLatToWorld,
  worldToLngLat,
  worldToPixels,
  pixelsToWorld,
  zoomToScale,
  scaleToZoom,
  altitudeToFovy,
  fovyToAltitude,
  getMeterZoom,
  unitsPerMeter,
  getDistanceScales,
  addMetersToLngLat,
  getViewMatrix,
  getProjectionMatrix,
  getProjectionParameters,
  EPSG3857_EARTH_RADIUS,
  EPSG3857_HALF_CIRCUMFERENCE,
  EPSG3857_MAX_LATITUDE,
  EPSG3857_UNITS_PER_METER,
  lngLatToEPSG3857,
  EPSG3857ToLngLat,
  EPSG4326ToEPSG3857,
  EPSG3857ToEPSG4326
} from './web-mercator';
export type {EPSG3857Options, FitBoundsOptions, DistanceScales} from './web-mercator';
export {
  getWellKnownDimensionSize,
  inferWellKnownGeometryDimension,
  parseWKB,
  writeWKB,
  inspectWKBHeader,
  scanWKB,
  visitWKB,
  WKBBuilder,
  formatWKT,
  parseWKT,
  parseWKTWithMetadata
} from './wkb/index';
export type {
  WellKnownDimension,
  WellKnownGeometry,
  WKBParseOptions,
  WKBParseResult,
  WKBBounds,
  WKBDialect,
  WKBGeometryCounts,
  WKBGeometryType,
  WKBHeader,
  WKBScanResult,
  WKBTraversalOptions,
  WKBVisitor,
  WKBBuilderBaseOptions,
  WKBBuilderMeasureOptions,
  WKBBuilderOptions,
  WKBBuilderWriteOptions,
  WKBCoordinateTransform,
  WKBGeometryArray,
  WKBGeometryWriter,
  WKTParseOptions,
  WKTParseResult
} from './wkb/index';
export {
  getGeoArrowDimensionSize,
  getGeoArrowEncodingForGeometry,
  getGeoArrowGeometryType,
  inferGeoArrowGeometryDimension,
  mergeGeoArrowDimensions,
  iterateGeoArrowBatches,
  getGeoArrowRowView,
  concatenateGeoArrowColumns,
  getGeoArrowRowCount,
  getGeoArrowTransferList,
  getGeoArrowVertexCount,
  inspectGeoArrowColumn,
  isGeoArrowValueValid,
  materializeGeoArrowRows,
  sliceGeoArrowArray,
  sliceGeoArrowColumn,
  validateGeoArrowColumn,
  visitGeoArrowCoordinates,
  allocateGeoArrowBuilderTarget,
  GeoArrowBuilder,
  makeGeoArrowColumnFromGeometryRows,
  assertGeoArrowResourceLimits,
  convertGeoArrowColumn,
  getGeoArrowBounds,
  getGeoArrowRowBounds,
  interleaveGeoArrowCoordinates,
  mapGeoArrowCoordinates,
  mapGeoArrowCoordinatesInto,
  normalizeGeoArrowUnion,
  rewindGeoArrow,
  decodeGeoArrowWKB,
  decodeGeoArrowWKT,
  encodeGeoArrowWKB,
  encodeGeoArrowWKT,
  getGeoArrowWKBVertexCount,
  tessellateGeoArrowPolygons
} from './geoarrow/index';
export type {
  GeoArrowArray,
  GeoArrowArrayBase,
  GeoArrowBox,
  GeoArrowBounds,
  GeoArrowColumn,
  GeoArrowCoordinateLayout,
  GeoArrowCoordinateMapper,
  GeoArrowDenseUnion,
  GeoArrowDenseUnionChild,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowFixedSizeList,
  GeoArrowGeometryValue,
  GeoArrowList,
  GeoArrowNumericArray,
  GeoArrowOffsets,
  GeoArrowPrimitive,
  GeoArrowSerialized,
  GeoArrowStruct,
  GeoArrowValidity,
  GeoArrowBatchView,
  GeoArrowRowView,
  GeoArrowColumnInspection,
  GeoArrowValidationIssue,
  GeoArrowValidationResult,
  GeoArrowBuilderEncoding,
  GeoArrowBuilderMeasurement,
  GeoArrowBuilderModeOptions,
  GeoArrowBuilderOptions,
  GeoArrowColumnFromRowsOptions,
  GeoArrowBuilderTarget,
  ConvertGeoArrowColumnOptions,
  GeoArrowResourceLimitOptions,
  GeoArrowRingOrientation,
  MapGeoArrowCoordinatesOptions,
  RewindGeoArrowOptions,
  DecodeGeoArrowWKBOptions,
  GeoArrowTessellation,
  TessellateGeoArrowPolygonsOptions
} from './geoarrow/index';
export {prepareGeoArrowTransfer} from './geoarrow/worker';
export type {GeoArrowTransfer} from './geoarrow/worker';
export {GEOSPATIAL_FUNCTION_LIBRARY} from './expressions';
export {
  createOrthographicCutAtlas,
  createOctahedralCutGraph,
  createOctahedralCutAtlas,
  GeographicCutAtlas
} from './geographic-atlas';
export type {
  AtlasSubdivisionOptions,
  SubdividedAtlasRing,
  SubdividedAtlasPolyline,
  GeographicAtlasOptions,
  GeographicAtlasBoundary,
  GeographicAtlasChart,
  GeographicCutGraph,
  GeographicAtlasSource,
  GeographicAtlasEdge,
  GeographicAtlasRing,
  GeographicAtlasPolygon,
  GeographicAtlasPolyline
} from './geographic-atlas';
export {EllipsoidGeodesicExact, GeodesicPolygonExact} from './geodesic-exact';
export type {ExactGeodesicOptions, ExactPolygonOptions, ExactPolygonResult} from './geodesic-exact';
export {TriaxialEllipsoid} from './triaxial';
export type {
  TriaxialCoordinates,
  TriaxialParameters,
  CartesianGeodesicState,
  TriaxialGeodesicLine
} from './triaxial';
export {
  parseAngle,
  formatAngle,
  parseGeographicCoordinates,
  formatGeographicCoordinates,
  standardGridZone,
  projectGrid,
  unprojectGrid,
  transferGrid,
  formatMGRS,
  parseMGRS,
  formatMGRSZone,
  parseMGRSZone
} from './coordinates';
export type {AngleAxis, GridCoordinate, GridOptions, MGRSCoordinate, MGRSZone} from './coordinates';
export {
  GEODESIC_BUFFER_FIELDS,
  RHUMB_BUFFER_FIELDS,
  GeodesicLineBuffer,
  RhumbLineBuffer
} from './geodesic-buffer';
export {
  clipGeographicPolyline,
  clipGeographicPolygon,
  subdivideGeographicCutRing
} from './geographic-cuts';
export type {
  LatitudeRange,
  GeographicClipOptions,
  GeographicCutEdge,
  GeographicCutRing,
  GeographicCutPolygon,
  SubdivideGeographicCutRingOptions,
  SubdividedGeographicCutRing
} from './geographic-cuts';
export {HeightField, TerrainSampleStatus, createTerrainSkirt} from './terrain/index';
export type {
  HeightFieldProps,
  TerrainArray,
  TerrainDiagonal,
  TerrainInterpolation,
  TerrainRegistration,
  TerrainSample,
  TerrainSampleOptions,
  TerrainSampleBatch,
  TerrainSkirtOptions,
  TerrainSkirtMesh
} from './terrain/index';
export {HeightFieldGeometry} from './terrain/geometry';
export type {HeightFieldGeometryOptions} from './terrain/geometry';
export {GeographicHeightField} from './terrain/geographic';
export type {GeographicHeightFieldProps} from './terrain/geographic';
export {TiledHeightField} from './terrain/tiled';
export type {
  TerrainTileId,
  TerrainHaloChange,
  TerrainTileUpdate,
  TerrainTile,
  TiledHeightFieldProps,
  TiledTerrainSample
} from './terrain/tiled';
export {
  packTerrainHeightField,
  unpackTerrainHeightField,
  TERRAIN_BUFFER_VERSION
} from './terrain/packed';
export type {PackedTerrain, PackTerrainOptions} from './terrain/packed';
export {createTerrainSurface, TerrainSurface} from './terrain/surface';
export type {
  TerrainSurfaceProps,
  TerrainSurfaceSample,
  TerrainSurfaceHit,
  TerrainSurfaceRayHit,
  TerrainQueryOptions,
  TerrainQueryResult,
  TerrainSphereContact,
  TerrainSegmentHit,
  TerrainCapsuleContact,
  TerrainSurfaceTopology
} from './terrain/surface';
export {HeightFieldMinMax} from './terrain/bounds';
export type {TerrainCellWindow, TerrainHeightBounds, TerrainBoundsLevel} from './terrain/bounds';
export {createTerrainMesh} from './terrain/mesh';
export type {TerrainGridMesh, TerrainMeshOptions} from './terrain/mesh';
export {measureTerrainMeshError} from './terrain/mesh-error';
export type {TerrainMeshError} from './terrain/mesh-error';
export {getTerrainMeshEdge} from './terrain/mesh-edges';
export type {TerrainMeshEdge} from './terrain/mesh-edges';
export {createMartiniTerrainMesh} from './terrain/martini';
export type {AdaptiveTerrainMesh, MartiniTerrainMeshOptions} from './terrain/martini';
export {createDelatinTerrainMesh} from './terrain/delatin';
export type {DelatinTerrainMeshOptions} from './terrain/delatin';
export {createTerrainGradientGrid} from './terrain/derivatives';
export type {TerrainGradientMethod, TerrainGradientGrid} from './terrain/derivatives';
export {getTerrainSlopeAspect, createTerrainSlopeAspectGrid} from './terrain/slope-aspect';
export type {TerrainSlopeAspectGrid} from './terrain/slope-aspect';
export {sampleTerrainProfile} from './terrain/profile';
export type {TerrainProfileSampler, TerrainProfile} from './terrain/profile';
export {createTerrainContours} from './terrain/contours';
export type {TerrainContours, TerrainContourOptions} from './terrain/contours';
export {stitchTerrainContours} from './terrain/contour-paths';
export type {TerrainContourPaths, TerrainContourPathLimits} from './terrain/contour-paths';
export {simplifyTerrainContourPaths} from './terrain/contour-simplify';
export type {TerrainSimplifiedContourPaths} from './terrain/contour-simplify';
export {measureTerrainProfile} from './terrain/profile-measure';
export type {TerrainProfileMeasurements} from './terrain/profile-measure';
export {reconcileTerrainVertexTiles} from './terrain/vertex-tiles';
export type {
  TerrainVertexTile,
  TerrainVertexTileOptions,
  ReconciledTerrainVertexTile
} from './terrain/vertex-tiles';
export {stitchTerrainMeshEdges} from './terrain/mesh-stitch';
export type {TerrainSeamMesh, TerrainMeshStitchOptions} from './terrain/mesh-stitch';

export {streamGeoArrow, tessellateGeoArrowStream} from './geoarrow/index';
export type {
  GeoArrowGeometryStream,
  StreamGeoArrowOptions,
  TessellateGeoArrowStreamOptions,
  GeoArrowStreamMesh
} from './geoarrow/index';
