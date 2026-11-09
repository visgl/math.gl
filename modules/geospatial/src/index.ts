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
  normalizeCRSIdentifier,
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
export {weldTerrainContourTiles} from './terrain/contour-tile-weld';
export {
  diagnoseTerrainContourBoundaries,
  TerrainContourBoundaryAxis
} from './terrain/contour-boundary-diagnostics';
export type {TerrainContourBoundaryDiagnostics} from './terrain/contour-boundary-diagnostics';
export {stitchTerrainContourTiles} from './terrain/contour-tile-paths';
export {createTerrainGradientPyramid} from './terrain/gradient-pyramid';
export type {TerrainGradientPyramid, TerrainGradientPyramidLevel} from './terrain/gradient-pyramid';
export type {TerrainContourTile, TerrainContourTileWeldOptions} from './terrain/contour-tile-weld';
export type {TerrainContourPaths, TerrainContourPathLimits} from './terrain/contour-paths';
export {simplifyTerrainContourPaths} from './terrain/contour-simplify';
export type {TerrainSimplifiedContourPaths} from './terrain/contour-simplify';
export {measureTerrainProfile} from './terrain/profile-measure';
export {getTerrainProfileVisibility} from './terrain/profile-visibility';
export type {TerrainProfileVisibility} from './terrain/profile-visibility';
export {getTerrainProfileHorizon} from './terrain/profile-horizon';
export type {TerrainProfileHorizon, TerrainProfileHorizonOptions} from './terrain/profile-horizon';
export {getTerrainProfileViewshed, TerrainProfileViewStatus} from './terrain/profile-viewshed';
export type {TerrainProfileMeasurements} from './terrain/profile-measure';
export {reconcileTerrainVertexTiles} from './terrain/vertex-tiles';
export {createTerrainVertexTileHalos, TerrainVertexHaloStatus} from './terrain/vertex-halos';
export type {TerrainVertexHaloTile} from './terrain/vertex-halos';
export {getTerrainVertexHaloAffectedTiles} from './terrain/vertex-halo-invalidation';
export type {TerrainVertexTileAddress} from './terrain/vertex-halo-invalidation';
export {updateTerrainVertexTileHalos} from './terrain/vertex-halo-update';
export {createTerrainFilteredPyramid} from './terrain/filtered-pyramid';
export type {TerrainFilteredLevel} from './terrain/filtered-pyramid';
export type {
  TerrainVertexTile,
  TerrainVertexTileOptions,
  ReconciledTerrainVertexTile
} from './terrain/vertex-tiles';
export {stitchTerrainMeshEdges} from './terrain/mesh-stitch';
export type {TerrainSeamMesh, TerrainMeshStitchOptions} from './terrain/mesh-stitch';

export {weldTerrainMixedContourTiles} from './terrain/contour-mixed-weld';
export type {
  TerrainMixedContourTile,
  TerrainMixedContourWeldOptions
} from './terrain/contour-mixed-weld';

export {createTerrainMixedVertexTileHalos} from './terrain/mixed-vertex-halos';
export type {TerrainMixedVertexTile} from './terrain/mixed-vertex-halos';

export {updateTerrainMixedVertexTileHalos} from './terrain/mixed-halo-update';

export {updateTerrainMixedGradientGrids} from './terrain/mixed-gradient-update';

export {simplifyTerrainContourPathsTopology} from './terrain/contour-topology';
export type {TerrainMixedHaloSnapshot} from './terrain/mixed-halo-update';
export type {TerrainMixedGradientSnapshot} from './terrain/mixed-gradient-update';

export {createTerrainIsobands} from './terrain/isobands';
export type {TerrainIsobands} from './terrain/isobands';

export {updateTerrainMeshes} from './terrain/mesh-update';
export type {TerrainMeshSnapshot} from './terrain/mesh-update';

export {updateTerrainBounds} from './terrain/bounds-update';
export type {TerrainBoundsSnapshot} from './terrain/bounds-update';

export {updateTerrainGradientPyramids} from './terrain/gradient-pyramid-update';
export type {TerrainGradientPyramidSnapshot} from './terrain/gradient-pyramid-update';
export type {TerrainFieldTile} from './terrain/tile-update-data';

export {updateTerrainMeshRegions} from './terrain/mesh-regions';
export type {TerrainRegularMeshRegions} from './terrain/mesh-regions';

export {updateTerrainMartiniMeshRegions} from './terrain/martini-regions';
export type {TerrainMartiniMeshRegions} from './terrain/martini-regions';

export {updateTerrainDelatinMeshRegions} from './terrain/delatin-regions';
export type {TerrainDelatinMeshRegions} from './terrain/delatin-regions';

export {updateTerrainBoundsRegions} from './terrain/bounds-regions';
export type {TerrainBoundsRegions} from './terrain/bounds-regions';

export {updateTerrainGradientPyramidRegions} from './terrain/gradient-pyramid-regions';
export type {TerrainGradientPyramidRegions} from './terrain/gradient-pyramid-regions';
export type {TerrainDirtyWindow} from './terrain/dirty-regions';

export {updateTerrainPersistentBounds} from './terrain/persistent-bounds';
export type {TerrainPersistentBounds} from './terrain/persistent-bounds';

export {updateTerrainPersistentGradients} from './terrain/persistent-gradients';
export type {TerrainPersistentGradients} from './terrain/persistent-gradients';

export {getTerrainHierarchyNode} from './terrain/persistent-hierarchy-data';
export type {TerrainPersistentLevel} from './terrain/persistent-hierarchy-data';

export {createTerrainLodMorph} from './terrain/lod-morph';
export type {TerrainLodMorph} from './terrain/lod-morph';

export {evaluateTerrainLodMorph} from './terrain/lod-morph-evaluate';
export {TerrainMorphStatus} from './terrain/lod-morph';
export type {
  TerrainHierarchyBlock,
  TerrainHierarchyUpdateStats
} from './terrain/persistent-hierarchy-data';

export {coordinateTerrainLodMorphs} from './terrain/lod-coordinate';

export {createTerrainMixedIsobands} from './terrain/isobands-mixed';
export type {TerrainLodTile} from './terrain/lod-coordinate';
export type {TerrainMixedSurfaceOptions} from './terrain/mixed-surface';
