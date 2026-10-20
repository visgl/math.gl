// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original implementation of projection equations; compatibility informed by proj4js 2.22.0.

import {createProjection} from '../mutable-projection';
import {DEGREES_TO_RADIANS, latitudeParameter, numberParameter, wrapLongitude} from '../parameters';
import type {ProjectionPlugin} from '../types';
import {createAngularRanges, getGeographicBounds} from '../rendering-profile/geographic-bounds';
import {createRectangleRenderingProfile} from '../rendering-profile/rectangular-rendering-profile';
import {longitudeRange, envelope, scale, add} from '../rendering-profile/rendering-bounds';

/** Spherical equidistant cylindrical (the eqc formulation used by proj4js). */
export const equidistantCylindrical: ProjectionPlugin = {
  name: 'eqc',
  aliases: ['Equirectangular', 'Equidistant_Cylindrical', 'Equidistant_Cylindrical_Spherical'],
  parameters: ['lon_0', 'lat_0', 'lat_ts', 'x_0', 'y_0'],
  create({semiMajorAxis: a, parameters, primeMeridian = 0}) {
    const over = Object.prototype.hasOwnProperty.call(parameters, 'over');
    const longitudeOrigin = numberParameter(parameters, 'lon_0', 0) * DEGREES_TO_RADIANS;
    const latitudeOrigin = latitudeParameter(parameters, 'lat_0');
    const parallelScale = Math.cos(latitudeParameter(parameters, 'lat_ts'));
    const x0 = numberParameter(parameters, 'x_0', 0);
    const y0 = numberParameter(parameters, 'y_0', 0);
    const width = a * Math.abs(parallelScale) * Math.PI;
    return {
      longitudeOrigin,
      getRenderingProfile(coverage) {
        if (coverage)
          return createRectangleRenderingProfile(
            region =>
              envelope(
                add(
                  [x0, x0],
                  scale(longitudeRange(region, longitudeOrigin, over), a * parallelScale)
                ),
                [y0 + a * (region[0][1] - latitudeOrigin), y0 + a * (region[1][1] - latitudeOrigin)]
              ),
            coverage,
            longitudeOrigin,
            primeMeridian,
            over
          );
        const defaultBounds = [
          [x0 - width, y0 + a * (-Math.PI / 2 - latitudeOrigin), 0],
          [x0 + width, y0 + a * (Math.PI / 2 - latitudeOrigin), 0]
        ] as const;
        return {
          bounds: defaultBounds,
          normalize: createRectangleRenderingProfile(
            () => defaultBounds,
            getGeographicBounds(
              createAngularRanges(
                longitudeOrigin - Math.PI,
                -(Math.PI / 2),
                longitudeOrigin + Math.PI,
                Math.PI / 2
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
          point.x = x0 + a * parallelScale * wrapLongitude(point.x - longitudeOrigin, over);
          point.y = y0 + a * (point.y - latitudeOrigin);
        },
        point => {
          point.x = wrapLongitude(longitudeOrigin + (point.x - x0) / (a * parallelScale), over);
          point.y = latitudeOrigin + (point.y - y0) / a;
        }
      )
    };
  }
};
