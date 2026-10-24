// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Experimental static discontinuous spherical maps. */
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
export {createPeirceQuincuncialMap, createBerghausMap} from './discontinuous/quincuncial-star';
export type {QuincuncialMapOptions, BerghausMapOptions} from './discontinuous/quincuncial-star';
export {getMapLayout, fitMapLayout, pickMapLayout} from './discontinuous/layout';
export type {MapBounds, MapRegionLayout} from './discontinuous/map-layout';
export type {MapLayout, MapLayoutRegion, MapViewportOptions} from './discontinuous/layout';

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
