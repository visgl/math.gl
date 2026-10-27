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
export type {TerrainContourPaths, TerrainContourPathLimits} from './contour-paths';
export {simplifyTerrainContourPaths} from './contour-simplify';
export type {TerrainSimplifiedContourPaths} from './contour-simplify';
export {measureTerrainProfile} from './profile-measure';
export type {TerrainProfileMeasurements} from './profile-measure';
export {reconcileTerrainVertexTiles} from './vertex-tiles';
export type {
  TerrainVertexTile,
  TerrainVertexTileOptions,
  ReconciledTerrainVertexTile
} from './vertex-tiles';
export {stitchTerrainMeshEdges} from './mesh-stitch';
export type {TerrainSeamMesh, TerrainMeshStitchOptions} from './mesh-stitch';
