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
  createAirOceanMap,
  createInterruptedSinusoidalMap,
  createInterruptedMollweideMap,
  createInterruptedHomolosineMap
} from './discontinuous/presets';

export {createAlbersUsaMap} from './discontinuous/albers-usa';
export {getMapLayout, fitMapLayout} from './discontinuous/layout';
export type {MapBounds, MapRegionLayout} from './discontinuous/map-layout';
export type {MapLayout, MapLayoutRegion, MapViewportOptions} from './discontinuous/layout';

export {
  createMyriahedralMap,
  createMyriahedralLayout,
  MyriahedralMap,
  MYRIAHEDRAL_PRESETS
} from './discontinuous/myriahedral';
export type {
  MyriahedralOptions,
  MyriahedralPreset,
  MyriahedralMesh,
  MyriahedralSolid,
  MyriahedralEdge,
  MyriahedralLayout
} from './discontinuous/myriahedral';
