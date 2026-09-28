// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DEGREES_TO_RADIANS, latitudeParameter, numberParameter, wrapLongitude} from '../parameters';
import type {ProjectionPlugin} from '../types';

/** Spherical and ellipsoidal Mercator, using the PROJ Mercator equations. */
export const mercator: ProjectionPlugin = {
  name: 'merc',
  aliases: [
    'Mercator',
    'Popular Visualisation Pseudo Mercator',
    'Mercator_1SP',
    'Mercator_Auxiliary_Sphere',
    'Mercator_Variant_A'
  ],
  parameters: ['lon_0', 'lat_ts', 'k', 'k_0', 'x_0', 'y_0'],
  create({semiMajorAxis: a, eccentricitySquared: es, parameters}) {
    const e = Math.sqrt(es);
    const wrap = Object.prototype.hasOwnProperty.call(parameters, 'over')
      ? (value: number) => value
      : wrapLongitude;
    const longitudeOrigin = numberParameter(parameters, 'lon_0', 0) * DEGREES_TO_RADIANS;
    const x0 = numberParameter(parameters, 'x_0', 0);
    const y0 = numberParameter(parameters, 'y_0', 0);
    let scale = numberParameter(parameters, 'k_0', numberParameter(parameters, 'k', 1));
    if (Object.prototype.hasOwnProperty.call(parameters, 'lat_ts')) {
      const latitude = latitudeParameter(parameters, 'lat_ts');
      scale = Math.cos(latitude) / Math.sqrt(1 - es * Math.sin(latitude) ** 2);
    }
    if (scale <= 0) throw new Error('Mercator scale must be positive');
    const radius = a * scale;
    return {
      forward(longitude, latitude) {
        if (Math.abs(latitude) >= Math.PI / 2) {
          throw new Error('Mercator is undefined at the poles');
        }
        const isometricLatitude =
          Math.asinh(Math.tan(latitude)) - e * Math.atanh(e * Math.sin(latitude));
        return [x0 + radius * wrap(longitude - longitudeOrigin), y0 + radius * isometricLatitude];
      },
      inverse(x, y) {
        const isometricLatitude = (y - y0) / radius;
        let latitude = Math.atan(Math.sinh(isometricLatitude));
        for (let iteration = 0; iteration < 30; iteration++) {
          const next = Math.atan(
            Math.sinh(isometricLatitude + e * Math.atanh(e * Math.sin(latitude)))
          );
          if (Math.abs(next - latitude) < 1e-13) {
            return [wrap(longitudeOrigin + (x - x0) / radius), next];
          }
          latitude = next;
        }
        throw new Error('Mercator inverse did not converge');
      }
    };
  }
};
