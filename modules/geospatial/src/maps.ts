// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Experimental static discontinuous spherical maps. */
export {createHealpixMap} from './maps/healpix';
export type {HealpixMapOptions} from './maps/healpix';
export {createGingeryMap} from './maps/quincuncial-star';
export type {GingeryMapOptions} from './maps/quincuncial-star';
export {createInterruptedMap} from './maps/preset-kernels';
export type {
  InterruptedProjection,
  InterruptedLobe,
  InterruptedMapOptions
} from './maps/preset-kernels';
export {DiscontinuousMap} from './maps/map-layout';
export type {
  GeographicPosition,
  MapPlacement,
  MapRegion,
  MapSeam,
  MapPoint,
  MapLine,
  MapPolygon,
  MapSamplingOptions
} from './maps/map-layout';
export {
  createGoodeMap,
  createAirOceanMap,
  createInterruptedSinusoidalMap,
  createInterruptedMollweideMap,
  createInterruptedHomolosineMap
} from './maps/preset-kernels';

export {createAlbersUsaMap} from './maps/albers-usa';
export {
  createPeirceQuincuncialMap,
  createBerghausMap
} from './maps/quincuncial-star';
export type {
  QuincuncialMapOptions,
  BerghausMapOptions
} from './maps/quincuncial-star';
export {
  getMapLayout,
  fitMapLayout,
  pickMapLayout
} from './maps/layout';
export type {MapBounds, MapRegionLayout} from './maps/map-layout';
export type {
  MapLayout,
  MapLayoutRegion,
  MapViewportOptions
} from './maps/layout';

export {
  createMyriahedralMap,
  createMyriahedralLayout,
  MyriahedralMap,
  MYRIAHEDRAL_PRESETS
} from './maps/myriahedral';
export {MapEngine} from './maps/map-engine';
export type {
  MapDescription,
  PreparedMap,
  MapDefinition,
  MapChartDescription,
  MapEngineOptions,
  MapCapabilities,
  MapState,
  MapPosition3D,
  MapTransitionPlan
} from './maps/map-engine';
export type {
  MyriahedralOptions,
  MyriahedralPreset,
  MyriahedralMesh,
  MyriahedralSolid,
  MyriahedralEdge,
  MyriahedralLayout
} from './maps/myriahedral';

export {createGuyouMap} from './maps/quincuncial-star';
export {createGringortenQuincuncialMap} from './maps/quincuncial-star';
export {createButterflyMap} from './maps/polyhedral';
export {createCollignonButterflyMap} from './maps/polyhedral';
export {createWatermanMap} from './maps/polyhedral';
export {createGoodeOceanMap} from './maps/preset-kernels';
export {createInterruptedBoggsMap} from './maps/preset-kernels';
export {createInterruptedSinuMollweideMap} from './maps/preset-kernels';
export {createInterruptedQuarticAuthalicMap} from './maps/preset-kernels';
export {createInterruptedMollweideHemispheresMap} from './maps/preset-kernels';
export type {PolyhedralMapOptions} from './maps/polyhedral';

export {createGrayFullerMap} from './maps/preset-kernels';
export {createPetroffMap} from './maps/petroff';
export {createIcosahedralSnyderMap, createDodecahedralSnyderMap} from './maps/snyder';
export type {SnyderMapOptions} from './maps/snyder';

export {createWorldMap} from './maps/world-map';
export type {
  WorldMapOptions,
  WorldProjection,
  WorldProjectionParameters
} from './maps/world-map';

export {WORLD_PROJECTIONS} from './maps/world-kernels';

export {createRegionalMap, REGIONAL_PROJECTIONS} from './maps/regional-map';
export type {RegionalProjection, RegionalMapOptions} from './maps/regional-map';

export {createProjectionMap, MAP_PROJECTIONS} from './maps/projection-catalog';
export type {MapProjection, ProjectionMapOptions} from './maps/projection-catalog';

export {createElasticMap} from './maps/elastic/map';
export {parseElasticMap} from './maps/elastic/data';
export type {ElasticMapData, ElasticSection} from './maps/elastic/data';
export type {MapSurface} from './maps/map-layout';

export {MapTransition, MapTransitionGeometry} from './maps/map-transition';
export type {
  MapTransitionOptions,
  MapTransitionPart,
  MapTransitionFrame
} from './maps/map-transition';

export type {
  MapFeatureGeometry,
  MapFeature,
  PreparedMapPart,
  PreparedMapPathPart,
  PreparedMapVertices,
  PreparedMapGeometry,
  MapPrepareFeaturesOptions
} from './maps/prepare-features';

export {cutSphericalPolygon, projectSphericalPolygon} from './maps/global-polygons';
export type {
  SphericalCutOptions,
  SphericalCutPolygon,
  SphericalCutEdge
} from './maps/global-polygons';

export {
  prepareMapTransitionMesh,
  prepareMapTransitionMeshAsync
} from './maps/map-transition-mesh';
export type {
  MapTransitionMeshPoint,
  MapTransitionEndpoint,
  MapTransitionMeshOptions,
  MapTransitionMeshAsyncOptions,
  MapTransitionMesh
} from './maps/map-transition-mesh';

export {createH3FaceMap} from './maps/h3-face-map';

export type {MapSurfaceMesh, MapSurfaceMeshOptions} from './maps/map-surface-mesh';

export {prepareProjectionSurface} from './maps/projection-surface';
export type {ProjectionSurfaceOptions} from './maps/projection-surface';

export * from './maps/presets';
export {mapGeometry, withMapGeometry} from './maps/geometry';
export {mapTransitions} from './maps/transitions';
export type {MapPreset, MapDefinitionFor} from './maps/map-engine';

export {prepareMapSurface} from './maps/map-surface-mesh';
