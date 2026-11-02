// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mat4, mat4GetScaling, vec3Normalize, createLocalFrameBasis} from '@math.gl/core';
import {getGeohashBounds} from '@math.gl/dggs';
import {
  TriangleBVH,
  getClosestPointsSegmentTriangle,
  type UtilityGeometry
} from '@math.gl/geometry';
import {getSkySnapshot, getStartOfDay, type SkySnapshotOptions} from '@math.gl/earth';
import {
  createTerrainMesh,
  weldTerrainContourTiles,
  diagnoseTerrainContourBoundaries,
  createTerrainGradientPyramid,
  createTerrainSkirt,
  getTerrainProfileVisibility,
  getTerrainProfileHorizon,
  createTerrainVertexTileHalos,
  createTerrainFilteredPyramid,
  createCRSResolver,
  parseWKB,
  type TerrainGridMesh
} from '@math.gl/geospatial';
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
  type TerrainGridMesh as TerrainMesh
} from '@math.gl/geospatial/terrain';
import {prepareGeoArrowTransfer} from '@math.gl/geospatial/geoarrow';
import {createCRSResolver as crsResolver} from '@math.gl/geospatial/crs';
import {STAR_CATALOG} from '@math.gl/earth/sun/stars';
// @ts-expect-error The old terrain leaf is not a published API.
import {createTerrainMesh as removedMesh} from '@math.gl/geospatial/terrain/mesh';
// @ts-expect-error The old geometry leaf is not a published API.
import {TriangleBVH as removedBVH} from '@math.gl/geometry/spatial-index';
void [
  mat4,
  mat4GetScaling,
  vec3Normalize,
  createLocalFrameBasis,
  getGeohashBounds,
  TriangleBVH,
  getClosestPointsSegmentTriangle,
  getSkySnapshot,
  getStartOfDay,
  createTerrainMesh,
  weldTerrainContourTiles,
  diagnoseTerrainContourBoundaries,
  createTerrainGradientPyramid,
  stitchTerrainContourTiles,
  createTerrainSkirt,
  getTerrainProfileVisibility,
  getTerrainProfileHorizon,
  getTerrainProfileViewshed,
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
  removedBVH
];
const typeChecks: [
  UtilityGeometry?,
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
