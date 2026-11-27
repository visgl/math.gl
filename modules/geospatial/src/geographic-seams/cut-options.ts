// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {EllipsoidGeodesic, type GeodesicParameters} from '../ellipsoid-geodesic';
import {EllipsoidRhumb} from '../ellipsoid-rhumb';
import {WGS84_RADIUS_X, WGS84_RADIUS_Z} from '../constants';
import {GeographicSeamError, type GeographicSeamOptions} from './types';
import {readLatitudeRange, type LatitudeRange} from './latitude';
export type GeographicClipOptions = Omit<GeographicSeamOptions, 'geodesic' | 'rhumb'> & {
  latitudeRange: LatitudeRange;
  ellipsoid?: GeodesicParameters;
};
export function cutOptions(options: GeographicClipOptions): {
  options: GeographicSeamOptions;
  axes: GeodesicParameters;
  range: LatitudeRange;
} {
  const range = readLatitudeRange(options.latitudeRange),
    axes = {
      ...(options.ellipsoid ?? {semiMajorAxis: WGS84_RADIUS_X, semiMinorAxis: WGS84_RADIUS_Z})
    };
  const a = axes.semiMajorAxis,
    b = axes.semiMinorAxis,
    r = b / a;
  if (
    !Number.isFinite(a) ||
    !Number.isFinite(b) ||
    a < 1e-60 ||
    a > 1e60 ||
    b < 1e-60 ||
    b > 1e60 ||
    (options.edgeModel === 'geodesic' && (r < 0.99 || r > 1.01)) ||
    (options.edgeModel === 'rhumb' && (r < 0.5 || r > 2))
  )
    throw new GeographicSeamError('input', 'Ellipsoid outside the qualified cut profile');
  return {
    range,
    axes,
    options: {
      ...options,
      geodesic: undefined,
      rhumb: undefined,
      ...(options.edgeModel === 'geodesic'
        ? {geodesic: new EllipsoidGeodesic(axes)}
        : options.edgeModel === 'rhumb'
          ? {rhumb: new EllipsoidRhumb(axes)}
          : {})
    }
  };
}
