// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original implementation of projection equations; compatibility informed by proj4js 2.22.0.

import {createFlatProjection as createProjection} from '../flat-projection';
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
    return createProjection(
      point => {
        const longitude = point.x,
          latitude = point.y;
        if (Math.abs(latitude) >= Math.PI / 2) {
          throw new Error('Mercator is undefined at the poles');
        }
        const isometricLatitude = Math.asinh(Math.tan(latitude));
        point.x = x0 + radius * wrap(longitude - longitudeOrigin);
        // Spherical Mercator has no ellipsoidal correction. Normalize signed zero.
        point.y =
          y0 +
          radius *
            (e === 0
              ? isometricLatitude + 0
              : isometricLatitude - e * Math.atanh(e * Math.sin(latitude)));
      },
      point => {
        const x = point.x,
          y = point.y;
        const isometricLatitude = (y - y0) / radius;
        let latitude = Math.atan(Math.sinh(isometricLatitude));
        // The spherical inverse is already exact; no iteration is needed.
        if (e === 0) {
          point.x = wrap(longitudeOrigin + (x - x0) / radius);
          point.y = latitude + 0;
          return;
        }
        for (let iteration = 0; iteration < 30; iteration++) {
          const next = Math.atan(
            Math.sinh(isometricLatitude + e * Math.atanh(e * Math.sin(latitude)))
          );
          if (Math.abs(next - latitude) < 1e-13) {
            point.x = wrap(longitudeOrigin + (x - x0) / radius);
            point.y = next;
            return;
          }
          latitude = next;
        }
        throw new Error('Mercator inverse did not converge');
      }
    );
  }
};
