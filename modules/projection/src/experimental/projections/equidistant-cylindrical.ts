// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original implementation of projection equations; compatibility informed by proj4js 2.22.0.

import {createProjection} from '../mutable-projection';
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
    const width = a * Math.abs(parallelScale) * Math.PI;
    return {
      profile: {
        bounds: [
          [x0 - width, y0 + a * (-Math.PI / 2 - latitudeOrigin), 0],
          [x0 + width, y0 + a * (Math.PI / 2 - latitudeOrigin), 0]
        ],
        longitudeCenter: longitudeOrigin,
        maxLatitude: Math.PI / 2
      },
      ...createProjection(
        point => {
          point.x = x0 + a * parallelScale * wrap(point.x - longitudeOrigin);
          point.y = y0 + a * (point.y - latitudeOrigin);
        },
        point => {
          point.x = wrap(longitudeOrigin + (point.x - x0) / (a * parallelScale));
          point.y = latitudeOrigin + (point.y - y0) / a;
        }
      )
    };
  }
};
