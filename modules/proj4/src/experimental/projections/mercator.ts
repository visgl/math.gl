// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original implementation of projection equations; compatibility informed by proj4js 2.22.0.

import {createProjection} from '../mutable-projection';
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
    // Select the spherical equations once, avoiding ellipsoidal corrections and
    // inverse iteration for every Web Mercator coordinate.
    if (e === 0) {
      return createProjection(
        point => {
          const latitude = point.y;
          if (Math.abs(latitude) >= Math.PI / 2) {
            throw new Error('Mercator is undefined at the poles');
          }
          point.x = x0 + radius * wrap(point.x - longitudeOrigin);
          point.y = y0 + radius * (Math.asinh(Math.tan(latitude)) + 0);
        },
        point => {
          point.x = wrap(longitudeOrigin + (point.x - x0) / radius);
          point.y = Math.atan(Math.sinh((point.y - y0) / radius + 0));
        }
      );
    }
    return createProjection(
      point => {
        const longitude = point.x,
          latitude = point.y;
        if (Math.abs(latitude) >= Math.PI / 2) {
          throw new Error('Mercator is undefined at the poles');
        }
        const isometricLatitude =
          Math.asinh(Math.tan(latitude)) - e * Math.atanh(e * Math.sin(latitude));
        point.x = x0 + radius * wrap(longitude - longitudeOrigin);
        point.y = y0 + radius * isometricLatitude;
      },
      point => {
        const x = point.x,
          y = point.y;
        const isometricLatitude = (y - y0) / radius;
        let latitude = Math.atan(Math.sinh(isometricLatitude));
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
