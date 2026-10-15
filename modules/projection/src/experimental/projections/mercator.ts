// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original implementation of projection equations; compatibility informed by proj4js 2.22.0.

import {createFlatProjection as createProjection} from '../flat-projection';
import {DEGREES_TO_RADIANS, latitudeParameter, numberParameter, wrapLongitude} from '../parameters';
import type {ProjectionPlugin} from '../types';
import {createAngularRanges, getGeographicBounds} from '../rendering-profile/geographic-bounds';
import {createRectangleRenderingProfile} from '../rendering-profile/rectangular-rendering-profile';
import {
  longitudeRange,
  envelope,
  scale as scaleRange,
  add
} from '../rendering-profile/rendering-bounds';

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
  create({semiMajorAxis: a, eccentricitySquared: es, parameters, primeMeridian = 0}) {
    const e = Math.sqrt(es);
    const over = Object.prototype.hasOwnProperty.call(parameters, 'over');
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
    // One finite world is the rendering target, even with unrestricted +over conversion.
    const maxLatitude = Math.atan(Math.sinh(Math.PI));
    const width = radius * Math.PI;
    const height = radius * (Math.PI - e * Math.atanh(e * Math.sin(maxLatitude)));
    return {
      longitudeOrigin,
      getRenderingProfile(coverage) {
        if (coverage) {
          // Only the mathematical poles trigger clipping; finite declared
          // latitudes beyond the default cap remain available as render targets.
          const clipped = coverage[1] <= -90 || coverage[3] >= 90;
          const bounds = [
            coverage[0],
            clipped
              ? Math.max(
                  (-maxLatitude * 180) / Math.PI,
                  Math.min((maxLatitude * 180) / Math.PI, coverage[1])
                )
              : coverage[1],
            coverage[2],
            clipped
              ? Math.max(
                  (-maxLatitude * 180) / Math.PI,
                  Math.min((maxLatitude * 180) / Math.PI, coverage[3])
                )
              : coverage[3]
          ] as const;
          const northing = (latitude: number) =>
            y0 + radius * (Math.asinh(Math.tan(latitude)) - e * Math.atanh(e * Math.sin(latitude)));
          return createRectangleRenderingProfile(
            region =>
              envelope(
                add([x0, x0], scaleRange(longitudeRange(region, longitudeOrigin, over), radius)),
                [northing(region[0][1]), northing(region[1][1])]
              ),
            bounds,
            longitudeOrigin,
            primeMeridian,
            over
          );
        }
        const defaultBounds = [
          [x0 - width, y0 - height, 0],
          [x0 + width, y0 + height, 0]
        ] as const;
        return {
          bounds: defaultBounds,
          normalize: createRectangleRenderingProfile(
            () => defaultBounds,
            getGeographicBounds(
              createAngularRanges(
                longitudeOrigin - Math.PI,
                -maxLatitude,
                longitudeOrigin + Math.PI,
                maxLatitude
              ),
              primeMeridian
            ),
            longitudeOrigin,
            primeMeridian,
            over
          ).normalize
        };
      },
      ...createProjection(
        point => {
          const longitude = point.x,
            latitude = point.y;
          if (Math.abs(latitude) >= Math.PI / 2) {
            throw new Error('Mercator is undefined at the poles');
          }
          const isometricLatitude = Math.asinh(Math.tan(latitude));
          point.x = x0 + radius * wrapLongitude(longitude - longitudeOrigin, over);
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
            point.x = wrapLongitude(longitudeOrigin + (x - x0) / radius, over);
            point.y = latitude + 0;
            return;
          }
          for (let iteration = 0; iteration < 30; iteration++) {
            const next = Math.atan(
              Math.sinh(isometricLatitude + e * Math.atanh(e * Math.sin(latitude)))
            );
            if (Math.abs(next - latitude) < 1e-13) {
              point.x = wrapLongitude(longitudeOrigin + (x - x0) / radius, over);
              point.y = next;
              return;
            }
            latitude = next;
          }
          throw new Error('Mercator inverse did not converge');
        }
      )
    };
  }
};
