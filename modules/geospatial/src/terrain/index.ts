// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {HeightField} from './height-field';
export {TerrainSampleStatus} from './types';
export type {
  HeightFieldProps,
  TerrainArray,
  TerrainDiagonal,
  TerrainInterpolation,
  TerrainRegistration,
  TerrainSample,
  TerrainSampleOptions,
  TerrainSampleBatch
} from './types';
export {createTerrainSkirt} from './mesh-skirts';
export type {TerrainSkirtOptions, TerrainSkirtMesh} from './mesh-skirts';

// Public named exports. Implementations remain in independently tree-shakable files.
export {HeightFieldGeometry} from './geometry';
export type {HeightFieldGeometryOptions} from './geometry';
export {GeographicHeightField} from './geographic';
export type {GeographicHeightFieldProps} from './geographic';
export {TiledHeightField} from './tiled';
export type {
  TerrainTileId,
  TerrainHaloChange,
  TerrainTileUpdate,
  TerrainTile,
  TiledHeightFieldProps,
  TiledTerrainSample
} from './tiled';
export {packTerrainHeightField, unpackTerrainHeightField, TERRAIN_BUFFER_VERSION} from './packed';
export type {PackedTerrain, PackTerrainOptions} from './packed';
export {createTerrainSurface, TerrainSurface} from './surface';
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
} from './surface';
export {HeightFieldMinMax} from './bounds';
export type {TerrainCellWindow, TerrainHeightBounds, TerrainBoundsLevel} from './bounds';
export {createTerrainMesh} from './mesh';
export type {TerrainGridMesh, TerrainMeshOptions} from './mesh';
export {measureTerrainMeshError} from './mesh-error';
export type {TerrainMeshError} from './mesh-error';
export {getTerrainMeshEdge} from './mesh-edges';
export type {TerrainMeshEdge} from './mesh-edges';
export {createMartiniTerrainMesh} from './martini';
export type {AdaptiveTerrainMesh, MartiniTerrainMeshOptions} from './martini';
export {createDelatinTerrainMesh} from './delatin';
export type {DelatinTerrainMeshOptions} from './delatin';
export {createTerrainGradientGrid} from './derivatives';
export type {TerrainGradientMethod, TerrainGradientGrid} from './derivatives';
export {getTerrainSlopeAspect, createTerrainSlopeAspectGrid} from './slope-aspect';
export type {TerrainSlopeAspectGrid} from './slope-aspect';
export {sampleTerrainProfile} from './profile';
export type {TerrainProfileSampler, TerrainProfile} from './profile';
export {createTerrainContours} from './contours';
export type {TerrainContours, TerrainContourOptions} from './contours';
export {stitchTerrainContours} from './contour-paths';
export {weldTerrainContourTiles} from './contour-tile-weld';
export {
  diagnoseTerrainContourBoundaries,
  TerrainContourBoundaryAxis
} from './contour-boundary-diagnostics';
export type {TerrainContourBoundaryDiagnostics} from './contour-boundary-diagnostics';
export {stitchTerrainContourTiles} from './contour-tile-paths';
export {createTerrainGradientPyramid} from './gradient-pyramid';
export type {TerrainGradientPyramid, TerrainGradientPyramidLevel} from './gradient-pyramid';
export type {TerrainContourTile, TerrainContourTileWeldOptions} from './contour-tile-weld';
export type {TerrainContourPaths, TerrainContourPathLimits} from './contour-paths';
export {simplifyTerrainContourPaths} from './contour-simplify';
export type {TerrainSimplifiedContourPaths} from './contour-simplify';
export {measureTerrainProfile} from './profile-measure';
export {getTerrainProfileVisibility} from './profile-visibility';
export type {TerrainProfileVisibility} from './profile-visibility';
export {getTerrainProfileHorizon} from './profile-horizon';
export type {TerrainProfileHorizon, TerrainProfileHorizonOptions} from './profile-horizon';
export {getTerrainProfileViewshed, TerrainProfileViewStatus} from './profile-viewshed';
export type {TerrainProfileMeasurements} from './profile-measure';
export {reconcileTerrainVertexTiles} from './vertex-tiles';
export {createTerrainVertexTileHalos, TerrainVertexHaloStatus} from './vertex-halos';
export type {TerrainVertexHaloTile} from './vertex-halos';
export {getTerrainVertexHaloAffectedTiles} from './vertex-halo-invalidation';
export type {TerrainVertexTileAddress} from './vertex-halo-invalidation';
export {updateTerrainVertexTileHalos} from './vertex-halo-update';
export {createTerrainFilteredPyramid} from './filtered-pyramid';
export type {TerrainFilteredLevel} from './filtered-pyramid';
export type {
  TerrainVertexTile,
  TerrainVertexTileOptions,
  ReconciledTerrainVertexTile
} from './vertex-tiles';
export {stitchTerrainMeshEdges} from './mesh-stitch';
export type {TerrainSeamMesh, TerrainMeshStitchOptions} from './mesh-stitch';
export {weldTerrainMixedContourTiles} from './contour-mixed-weld';
export type {TerrainMixedContourTile, TerrainMixedContourWeldOptions} from './contour-mixed-weld';

export {createTerrainMixedVertexTileHalos} from './mixed-vertex-halos';
export type {TerrainMixedVertexTile} from './mixed-vertex-halos';
