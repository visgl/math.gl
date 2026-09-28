// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original implementation of projection equations; compatibility informed by proj4js 2.22.0.

import {DEGREES_TO_RADIANS, latitudeParameter, numberParameter, wrapLongitude} from '../parameters';
import type {ProjectionPlugin} from '../types';

/** Spherical equidistant cylindrical (the eqc formulation used by proj4js). */
export const equidistantCylindrical: ProjectionPlugin = {
  name: 'eqc',
  aliases: ['Equirectangular', 'Equidistant_Cylindrical', 'Equidistant_Cylindrical_Spherical'],
  parameters: ['lon_0', 'lat_0', 'lat_ts', 'x_0', 'y_0'],
  create({semiMajorAxis: a, parameters}) {
    const wrap = Object.prototype.hasOwnProperty.call(parameters, 'over')
      ? (value: number) => value
      : wrapLongitude;
    const longitudeOrigin = numberParameter(parameters, 'lon_0', 0) * DEGREES_TO_RADIANS;
    const latitudeOrigin = latitudeParameter(parameters, 'lat_0');
    const parallelScale = Math.cos(latitudeParameter(parameters, 'lat_ts'));
    const x0 = numberParameter(parameters, 'x_0', 0);
    const y0 = numberParameter(parameters, 'y_0', 0);
    return {
      forward(longitude, latitude) {
        return [
          x0 + a * parallelScale * wrap(longitude - longitudeOrigin),
          y0 + a * (latitude - latitudeOrigin)
        ];
      },
      inverse(x, y) {
        return [
          wrap(longitudeOrigin + (x - x0) / (a * parallelScale)),
          latitudeOrigin + (y - y0) / a
        ];
      }
    };
  }
};
