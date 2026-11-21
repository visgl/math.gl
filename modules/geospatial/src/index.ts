// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export * from './entries/ellipsoid';
export * from './geodesics';
export * from './coordinates';
export * from './globe';
export * from './tiles';

// Public named exports. Implementations remain in independently tree-shakable files.
/** @deprecated Import these APIs from `@math.gl/geospatial/crs`. */
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
} from './crs';
/** @deprecated Import these APIs from `@math.gl/geospatial/crs`. */
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
} from './crs';
/** @deprecated Import these APIs from `@math.gl/geospatial/crs`. */
export {createCRSDictionaryProvider, createCRSResolver, CRSResolutionError} from './crs/resolver';
/** @deprecated Import these APIs from `@math.gl/geospatial/crs`. */
export type {
  CRSDefinitionProvider,
  CRSLookup,
  CRSResolution,
  CRSResolverOptions,
  CRSResolver
} from './crs/resolver';
/** @deprecated Import these APIs from `@math.gl/geospatial/web-mercator`. */
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
/** @deprecated Import these APIs from `@math.gl/geospatial/web-mercator`. */
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
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {HeightField, TerrainSampleStatus, createTerrainSkirt} from './terrain';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
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
} from './terrain';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {HeightFieldGeometry} from './terrain/geometry';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {HeightFieldGeometryOptions} from './terrain/geometry';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {GeographicHeightField} from './terrain/geographic';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {GeographicHeightFieldProps} from './terrain/geographic';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {TiledHeightField} from './terrain/tiled';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {
  TerrainTileId,
  TerrainHaloChange,
  TerrainTileUpdate,
  TerrainTile,
  TiledHeightFieldProps,
  TiledTerrainSample
} from './terrain/tiled';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  packTerrainHeightField,
  unpackTerrainHeightField,
  TERRAIN_BUFFER_VERSION
} from './terrain/packed';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {PackedTerrain, PackTerrainOptions} from './terrain/packed';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainSurface, TerrainSurface} from './terrain/surface';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
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
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {HeightFieldMinMax} from './terrain/bounds';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainCellWindow, TerrainHeightBounds, TerrainBoundsLevel} from './terrain/bounds';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainMesh} from './terrain/mesh';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainGridMesh, TerrainMeshOptions} from './terrain/mesh';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {measureTerrainMeshError} from './terrain/mesh-error';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainMeshError} from './terrain/mesh-error';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {getTerrainMeshEdge} from './terrain/mesh-edges';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainMeshEdge} from './terrain/mesh-edges';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createMartiniTerrainMesh} from './terrain/martini';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {AdaptiveTerrainMesh, MartiniTerrainMeshOptions} from './terrain/martini';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createDelatinTerrainMesh} from './terrain/delatin';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {DelatinTerrainMeshOptions} from './terrain/delatin';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainGradientGrid} from './terrain/derivatives';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainGradientMethod, TerrainGradientGrid} from './terrain/derivatives';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {getTerrainSlopeAspect, createTerrainSlopeAspectGrid} from './terrain/slope-aspect';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainSlopeAspectGrid} from './terrain/slope-aspect';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {sampleTerrainProfile} from './terrain/profile';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainProfileSampler, TerrainProfile} from './terrain/profile';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainContours} from './terrain/contours';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainContours, TerrainContourOptions} from './terrain/contours';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {stitchTerrainContours} from './terrain/contour-paths';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {weldTerrainContourTiles} from './terrain/contour-tile-weld';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  diagnoseTerrainContourBoundaries,
  TerrainContourBoundaryAxis
} from './terrain/contour-boundary-diagnostics';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainContourBoundaryDiagnostics} from './terrain/contour-boundary-diagnostics';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {stitchTerrainContourTiles} from './terrain/contour-tile-paths';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainGradientPyramid} from './terrain/gradient-pyramid';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainGradientPyramid, TerrainGradientPyramidLevel} from './terrain/gradient-pyramid';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainContourTile, TerrainContourTileWeldOptions} from './terrain/contour-tile-weld';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainContourPaths, TerrainContourPathLimits} from './terrain/contour-paths';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {simplifyTerrainContourPaths} from './terrain/contour-simplify';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainSimplifiedContourPaths} from './terrain/contour-simplify';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {measureTerrainProfile} from './terrain/profile-measure';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {getTerrainProfileVisibility} from './terrain/profile-visibility';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainProfileVisibility} from './terrain/profile-visibility';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {getTerrainProfileHorizon} from './terrain/profile-horizon';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainProfileHorizon, TerrainProfileHorizonOptions} from './terrain/profile-horizon';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {getTerrainProfileViewshed, TerrainProfileViewStatus} from './terrain/profile-viewshed';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainProfileMeasurements} from './terrain/profile-measure';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {reconcileTerrainVertexTiles} from './terrain/vertex-tiles';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainVertexTileHalos, TerrainVertexHaloStatus} from './terrain/vertex-halos';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainVertexHaloTile} from './terrain/vertex-halos';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {getTerrainVertexHaloAffectedTiles} from './terrain/vertex-halo-invalidation';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainVertexTileAddress} from './terrain/vertex-halo-invalidation';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainVertexTileHalos} from './terrain/vertex-halo-update';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainFilteredPyramid} from './terrain/filtered-pyramid';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainFilteredLevel} from './terrain/filtered-pyramid';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {
  TerrainVertexTile,
  TerrainVertexTileOptions,
  ReconciledTerrainVertexTile
} from './terrain/vertex-tiles';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {stitchTerrainMeshEdges} from './terrain/mesh-stitch';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainSeamMesh, TerrainMeshStitchOptions} from './terrain/mesh-stitch';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {weldTerrainMixedContourTiles} from './terrain/contour-mixed-weld';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {
  TerrainMixedContourTile,
  TerrainMixedContourWeldOptions
} from './terrain/contour-mixed-weld';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainMixedVertexTileHalos} from './terrain/mixed-vertex-halos';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainMixedVertexTile} from './terrain/mixed-vertex-halos';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainMixedVertexTileHalos} from './terrain/mixed-halo-update';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainMixedGradientGrids} from './terrain/mixed-gradient-update';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {simplifyTerrainContourPathsTopology} from './terrain/contour-topology';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainMixedHaloSnapshot} from './terrain/mixed-halo-update';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainMixedGradientSnapshot} from './terrain/mixed-gradient-update';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainIsobands} from './terrain/isobands';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainIsobands} from './terrain/isobands';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainMeshes} from './terrain/mesh-update';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainMeshSnapshot} from './terrain/mesh-update';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainBounds} from './terrain/bounds-update';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainBoundsSnapshot} from './terrain/bounds-update';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainGradientPyramids} from './terrain/gradient-pyramid-update';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainGradientPyramidSnapshot} from './terrain/gradient-pyramid-update';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainFieldTile} from './terrain/tile-update-data';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainMeshRegions} from './terrain/mesh-regions';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainRegularMeshRegions} from './terrain/mesh-regions';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainMartiniMeshRegions} from './terrain/martini-regions';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainMartiniMeshRegions} from './terrain/martini-regions';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainDelatinMeshRegions} from './terrain/delatin-regions';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainDelatinMeshRegions} from './terrain/delatin-regions';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainBoundsRegions} from './terrain/bounds-regions';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainBoundsRegions} from './terrain/bounds-regions';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainGradientPyramidRegions} from './terrain/gradient-pyramid-regions';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainGradientPyramidRegions} from './terrain/gradient-pyramid-regions';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainDirtyWindow} from './terrain/dirty-regions';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainPersistentBounds} from './terrain/persistent-bounds';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainPersistentBounds} from './terrain/persistent-bounds';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {updateTerrainPersistentGradients} from './terrain/persistent-gradients';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainPersistentGradients} from './terrain/persistent-gradients';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {getTerrainHierarchyNode} from './terrain/persistent-hierarchy-data';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainPersistentLevel} from './terrain/persistent-hierarchy-data';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainLodMorph} from './terrain/lod-morph';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainLodMorph} from './terrain/lod-morph';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {evaluateTerrainLodMorph} from './terrain/lod-morph-evaluate';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {TerrainMorphStatus} from './terrain/lod-morph';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {
  TerrainHierarchyBlock,
  TerrainHierarchyUpdateStats
} from './terrain/persistent-hierarchy-data';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {coordinateTerrainLodMorphs} from './terrain/lod-coordinate';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {createTerrainMixedIsobands} from './terrain/isobands-mixed';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainLodTile} from './terrain/lod-coordinate';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainMixedSurface, TerrainMixedSurfaceOptions} from './terrain/mixed-surface';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  createValidDomainTerrainMesh,
  type ValidDomainTerrainMesh,
  type ValidDomainMeshOptions
} from './terrain/valid-domain-mesh';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  createBreaklineTerrainMesh,
  type TerrainBreaklinePoint,
  type TerrainBreakline,
  type BreaklineTerrainMesh,
  type BreaklineMeshOptions
} from './terrain/breakline-mesh';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  boundTerrainMeshError,
  type TerrainContinuousMesh,
  type TerrainContinuousError
} from './terrain/continuous-mesh-error';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  wrapTerrainLongitude,
  measureGeographicTerrainSeam,
  type TerrainGeographicProbe
} from './terrain/geographic-seam';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  selectTerrainLod,
  type TerrainLodCandidate,
  type TerrainLodCertifiedView,
  type TerrainLodView
} from './terrain/lod-select';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {stitchTerrainLodCut, type TerrainLodSeam} from './terrain/lod-stitch';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {splitTerrainBreaklines} from './terrain/breakline-preprocess';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  updateTerrainValidDomainMeshRegions,
  type TerrainValidDomainMeshRegions,
  type TerrainValidDomainRegionOptions
} from './terrain/valid-domain-regions';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {certifyTerrainMeshCoverage} from './terrain/mesh-coverage';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {TerrainCoverageMesh, TerrainMeshCoverage} from './terrain/mesh-coverage';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  getGeographicTerrainNeighbor,
  type TerrainGeographicEdge,
  type TerrainGeographicNeighbor
} from './terrain/geographic-neighbor';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  sweepTerrainSphere,
  type TerrainSphereSweepOptions,
  type TerrainSphereSweepResult
} from './terrain/sweep-sphere';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  sweepTerrainCapsule,
  sweepTerrainTaperedCapsule,
  type TerrainCapsuleSweepResult
} from './terrain/sweep-capsule';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  sweepTerrainBox,
  sweepTerrainPolytope,
  sweepTerrainTriangleMesh,
  type TerrainPolytope,
  type TerrainPolytopeSweepResult
} from './terrain/sweep-polytope';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  sweepTerrainRotatingCapsule,
  sweepTerrainRotatingSphere
} from './terrain/sweep-rotating-capsule';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {sweepTerrainCylinder} from './terrain/sweep-cylinder';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {sweepTerrainPlane} from './terrain/sweep-plane';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {discoverGeographicTerrainLodSeams} from './terrain/geographic-lod-seams';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  discoverGeographicTerrainPoles,
  type TerrainPoleIncidence,
  type TerrainPoleCoverage
} from './terrain/geographic-poles';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  sweepTerrainRotatingBox,
  sweepTerrainRotatingPolytope,
  type TerrainRigidMotion,
  type TerrainRotationalSweepResult
} from './terrain/sweep-rotation';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  boundTerrainLodScreenError,
  type TerrainLodErrorBounds,
  type TerrainLodProjection
} from './terrain/lod-screen-error';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  createTerrainRegionalViewshed,
  TerrainRegionalViewStatus,
  type TerrainRegionalViewshed,
  type TerrainRegionalViewshedOptions,
  type TerrainViewshedGrid
} from './terrain/regional-viewshed';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  createTerrainDrainage,
  getTerrainCellMetrics,
  type TerrainCellMetrics,
  type TerrainDrainage,
  type TerrainDrainageOptions
} from './terrain/hydrology';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  fillTerrainDepressions,
  type TerrainDepressionFill,
  type TerrainDepressionFillOptions
} from './terrain/depression-fill';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  splitTerrainMesh,
  createTerrainCutoutSkirts,
  type TerrainCutout,
  type TerrainCutoutInput,
  type TerrainCutoutOptions,
  type TerrainCutoutPiece,
  type SkirtedTerrainCutout,
  type TerrainCutoutSkirtOptions
} from './terrain';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  accumulateTerrainWatersheds,
  type TerrainWatershedAccumulation,
  type TerrainWatershedAccumulationOptions
} from './terrain/watershed-accumulation';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  splitTerrainMeshTiles,
  type TerrainCutoutTile,
  type TerrainTileCutout
} from './terrain/tile-cutout';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  updateTerrainTileCutouts,
  type TerrainCutoutResident,
  type TerrainTileCutoutUpdateOptions,
  type TerrainTileCutoutCache,
  type TerrainTileCutoutUpdate
} from './terrain/tile-cutout-update';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  createGeographicTerrainCutoutFrame,
  projectGeographicTerrainCutout,
  unprojectGeographicTerrainCutout,
  type GeographicTerrainCutoutFrame,
  type GeographicTerrainCutoutFrameOptions
} from './terrain/geographic-cutout';

/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export {
  prepareTerrainCutoutPolygons,
  type TerrainCutoutPolygonOptions
} from './terrain/cutout-polygons';
/** @deprecated Import these APIs from `@math.gl/geospatial/terrain`. */
export type {
  TerrainCutoutPolygon,
  TerrainCutoutPolygonSet,
  TerrainCutoutRegion
} from './terrain/cutout-region';
