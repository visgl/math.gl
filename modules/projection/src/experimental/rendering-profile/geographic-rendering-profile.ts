// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionParameters, ProjectionImplementation} from '../types';
import {DEGREES_TO_RADIANS, numberParameter} from '../parameters';
import {createRectangleRenderingProfile} from './rectangular-rendering-profile';
import {longitudeRange} from './rendering-bounds';

/** Geographic rendering follows the same longitude branch as its output convention. */
export function createGeographicProfile(
  parameters: ProjectionParameters,
  primeMeridian = 0
): NonNullable<ProjectionImplementation['getRenderingProfile']> {
  const center = numberParameter(parameters, 'lon_wrap', 0) * DEGREES_TO_RADIANS;
  return coverage =>
    createRectangleRenderingProfile(
      ranges => {
        const longitude = longitudeRange(ranges, center);
        return [
          [center + longitude[0], ranges[0][1], 0],
          [center + longitude[1], ranges[1][1], 0]
        ];
      },
      coverage ?? [-180, -90, 180, 90],
      center,
      primeMeridian
    );
}
