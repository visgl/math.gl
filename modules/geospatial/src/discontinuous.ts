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
export {createAirOceanMap, createInterruptedSinusoidalMap} from './discontinuous/presets';
