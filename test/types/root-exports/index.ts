// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mat4, mat4GetScaling, vec3Normalize, createLocalFrameBasis} from '@math.gl/core/matrix';
import {getGeohashBounds} from '@math.gl/dggs/geohash';
import {A5Decoder} from '@math.gl/dggs/a5';
import {GeohashDecoder} from '@math.gl/dggs/geohash';
import {H3Decoder} from '@math.gl/dggs/h3';
import {PlusCodeDecoder} from '@math.gl/dggs/plus-code';
import {QuadkeyDecoder} from '@math.gl/dggs/quadkey';
import {S2Decoder} from '@math.gl/dggs/s2';
import {TriangleBVH} from '@math.gl/geometry/spatial-index';
import {getClosestPointsSegmentTriangle} from '@math.gl/geometry/culling';
import {type GeometryInput} from '@math.gl/geometry/processing';
import {getSkySnapshot, type SkySnapshotOptions} from '@math.gl/earth/sun';
import {getStartOfDay} from '@math.gl/earth/timezone';
import {
  createTerrainMesh,
  weldTerrainContourTiles,
  weldTerrainMixedContourTiles,
  diagnoseTerrainContourBoundaries,
  createTerrainGradientPyramid,
  createTerrainSkirt,
  getTerrainProfileVisibility,
  getTerrainProfileHorizon,
  updateTerrainMixedVertexTileHalos,
  updateTerrainMixedGradientGrids,
  simplifyTerrainContourPathsTopology,
  createTerrainIsobands,
  updateTerrainMeshes,
  updateTerrainBounds,
  updateTerrainGradientPyramids,
  updateTerrainMeshRegions,
  updateTerrainMartiniMeshRegions,
  updateTerrainDelatinMeshRegions,
  updateTerrainBoundsRegions,
  updateTerrainGradientPyramidRegions,
  updateTerrainPersistentBounds,
  updateTerrainPersistentGradients,
  getTerrainHierarchyNode,
  createTerrainLodMorph,
  evaluateTerrainLodMorph,
  TerrainMorphStatus,
  coordinateTerrainLodMorphs,
  createTerrainMixedIsobands,
  createTerrainMixedVertexTileHalos,
  createTerrainVertexTileHalos,
  createTerrainFilteredPyramid,
  type TerrainGridMesh,
  type TerrainMixedSurface
} from '@math.gl/geospatial/terrain';
import {createCRSResolver} from '@math.gl/geospatial/crs';
import {parseWKB} from '@math.gl/core/arrow';
import {
  createTerrainMesh as terrainMesh,
  stitchTerrainContourTiles,
  type TerrainGradientPyramid,
  type TerrainContourTileWeldOptions,
  type TerrainContourBoundaryDiagnostics,
  getTerrainProfileViewshed,
  getTerrainVertexHaloAffectedTiles,
  updateTerrainVertexTileHalos,
  type TerrainFilteredLevel,
  type TerrainVertexHaloTile,
  type TerrainProfileHorizonOptions,
  type TerrainProfileVisibility,
  type TerrainGridMesh as TerrainMesh,
  type TerrainMixedSurface as TerrainSurface
} from '@math.gl/geospatial/terrain';
import {prepareGeoArrowTransfer} from '@math.gl/core/arrow';
import {createCRSResolver as crsResolver} from '@math.gl/geospatial/crs';
import {STAR_CATALOG} from '@math.gl/earth/sun-stars';
// @ts-expect-error The old terrain leaf is not a published API.
import {createTerrainMesh as removedMesh} from '@math.gl/geospatial/terrain/mesh';
import {TriangleBVH as spatialIndexBVH} from '@math.gl/geometry/spatial-index';
void [
  mat4,
  mat4GetScaling,
  vec3Normalize,
  createLocalFrameBasis,
  getGeohashBounds,
  A5Decoder,
  GeohashDecoder,
  H3Decoder,
  PlusCodeDecoder,
  QuadkeyDecoder,
  S2Decoder,
  TriangleBVH,
  getClosestPointsSegmentTriangle,
  getSkySnapshot,
  getStartOfDay,
  createTerrainMesh,
  weldTerrainContourTiles,
  weldTerrainMixedContourTiles,
  diagnoseTerrainContourBoundaries,
  createTerrainGradientPyramid,
  stitchTerrainContourTiles,
  createTerrainSkirt,
  getTerrainProfileVisibility,
  getTerrainProfileHorizon,
  getTerrainProfileViewshed,
  updateTerrainMixedVertexTileHalos,
  updateTerrainMixedGradientGrids,
  simplifyTerrainContourPathsTopology,
  createTerrainIsobands,
  updateTerrainMeshes,
  updateTerrainBounds,
  updateTerrainGradientPyramids,
  updateTerrainMeshRegions,
  updateTerrainMartiniMeshRegions,
  updateTerrainDelatinMeshRegions,
  updateTerrainBoundsRegions,
  updateTerrainGradientPyramidRegions,
  updateTerrainPersistentBounds,
  updateTerrainPersistentGradients,
  getTerrainHierarchyNode,
  createTerrainLodMorph,
  evaluateTerrainLodMorph,
  TerrainMorphStatus,
  coordinateTerrainLodMorphs,
  createTerrainMixedIsobands,
  createTerrainMixedVertexTileHalos,
  createTerrainVertexTileHalos,
  createTerrainFilteredPyramid,
  updateTerrainVertexTileHalos,
  getTerrainVertexHaloAffectedTiles,
  createCRSResolver,
  parseWKB,
  terrainMesh,
  prepareGeoArrowTransfer,
  crsResolver,
  STAR_CATALOG,
  removedMesh,
  spatialIndexBVH
];
const typeChecks: [
  GeometryInput?,
  TerrainMixedSurface?,
  TerrainSurface?,
  SkySnapshotOptions?,
  TerrainGridMesh?,
  TerrainMesh?,
  TerrainProfileVisibility?,
  TerrainProfileHorizonOptions?,
  TerrainVertexHaloTile?,
  TerrainFilteredLevel?,
  TerrainContourTileWeldOptions?,
  TerrainGradientPyramid?,
  TerrainContourBoundaryDiagnostics?
] = [];
void typeChecks;

export {queryArrowTable, type ArrowTableQuery} from '@math.gl/sql/query';
