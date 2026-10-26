// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Experimental static discontinuous spherical maps. */
export {createHealpixMap} from './discontinuous/healpix';
export type {HealpixMapOptions} from './discontinuous/healpix';
export {createGingeryMap} from './discontinuous/quincuncial-star';
export type {GingeryMapOptions} from './discontinuous/quincuncial-star';
export {createInterruptedMap} from './discontinuous/presets';
export type {
  InterruptedProjection,
  InterruptedLobe,
  InterruptedMapOptions
} from './discontinuous/presets';
export {DiscontinuousMap} from './discontinuous/map-layout';
export type {
  GeographicPosition,
  MapPlacement,
  MapRegion,
  MapSeam,
  MapPoint,
  MapLine,
  MapPolygon,
  MapSamplingOptions
} from './discontinuous/map-layout';
export {
  createGoodeMap,
  createAirOceanMap,
  createInterruptedSinusoidalMap,
  createInterruptedMollweideMap,
  createInterruptedHomolosineMap
} from './discontinuous/presets';

export {createAlbersUsaMap} from './discontinuous/albers-usa';
export {
  createPeirceQuincuncialMap,
  createBerghausMap
} from './discontinuous/quincuncial-star';
export type {
  QuincuncialMapOptions,
  BerghausMapOptions
} from './discontinuous/quincuncial-star';
export {
  getMapLayout,
  fitMapLayout,
  pickMapLayout
} from './discontinuous/layout';
export type {MapBounds, MapRegionLayout} from './discontinuous/map-layout';
export type {
  MapLayout,
  MapLayoutRegion,
  MapViewportOptions
} from './discontinuous/layout';

export {
  createMyriahedralMap,
  createMyriahedralLayout,
  MyriahedralMap,
  MYRIAHEDRAL_PRESETS
} from './discontinuous/myriahedral';
export {MapEngine} from './discontinuous/map-engine';
export type {
  MapDescription,
  MapDefinition,
  MapChartDescription,
  MapEngineOptions,
  MapCapabilities,
  MapState,
  MapPosition3D,
  MapTransitionPlan
} from './discontinuous/map-engine';
export type {
  MyriahedralOptions,
  MyriahedralPreset,
  MyriahedralMesh,
  MyriahedralSolid,
  MyriahedralEdge,
  MyriahedralLayout
} from './discontinuous/myriahedral';

export {createGuyouMap} from './discontinuous/quincuncial-star';
export {createGringortenQuincuncialMap} from './discontinuous/quincuncial-star';
export {createButterflyMap} from './discontinuous/polyhedral';
export {createCollignonButterflyMap} from './discontinuous/polyhedral';
export {createWatermanMap} from './discontinuous/polyhedral';
export {createGoodeOceanMap} from './discontinuous/presets';
export {createInterruptedBoggsMap} from './discontinuous/presets';
export {createInterruptedSinuMollweideMap} from './discontinuous/presets';
export {createInterruptedQuarticAuthalicMap} from './discontinuous/presets';
export {createInterruptedMollweideHemispheresMap} from './discontinuous/presets';
export type {PolyhedralMapOptions} from './discontinuous/polyhedral';

export {createGrayFullerMap} from './discontinuous/presets';
export {createPetroffMap} from './discontinuous/petroff';
export {createIcosahedralSnyderMap, createDodecahedralSnyderMap} from './discontinuous/snyder';
export type {SnyderMapOptions} from './discontinuous/snyder';

export {createWorldMap} from './discontinuous/world-map';
export type {
  WorldMapOptions,
  WorldProjection,
  WorldProjectionParameters
} from './discontinuous/world-map';

export {WORLD_PROJECTIONS} from './discontinuous/world-kernels';

export {createRegionalMap, REGIONAL_PROJECTIONS} from './discontinuous/regional-map';
export type {RegionalProjection, RegionalMapOptions} from './discontinuous/regional-map';

export {createProjectionMap, MAP_PROJECTIONS} from './discontinuous/projection-catalog';
export type {MapProjection, ProjectionMapOptions} from './discontinuous/projection-catalog';

export {createElasticMap} from './discontinuous/elastic/map';
export {parseElasticMap} from './discontinuous/elastic/data';
export type {ElasticMapData, ElasticSection} from './discontinuous/elastic/data';
export type {MapSurface} from './discontinuous/map-layout';

export {MapTransition, MapTransitionGeometry} from './discontinuous/map-transition';
export type {
  MapTransitionOptions,
  MapTransitionPart,
  MapTransitionFrame
} from './discontinuous/map-transition';

export type {
  MapFeatureGeometry,
  MapFeature,
  PreparedMapPart,
  PreparedMapPathPart,
  PreparedMapVertices,
  PreparedMapGeometry,
  MapPrepareFeaturesOptions
} from './discontinuous/prepare-features';

export {cutSphericalPolygon, projectSphericalPolygon} from './discontinuous/global-polygons';
export type {
  SphericalCutOptions,
  SphericalCutPolygon,
  SphericalCutEdge
} from './discontinuous/global-polygons';
