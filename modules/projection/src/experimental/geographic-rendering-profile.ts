// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionParameters, ProjectionImplementation} from './types';
import {DEGREES_TO_RADIANS, numberParameter} from './parameters';
import {createRectangleRenderingProfile} from './rectangular-rendering-profile';

/** Geographic coordinates use their declared longitude interval as a rendering target. */
export function createGeographicProfile(
  parameters: ProjectionParameters
): NonNullable<ProjectionImplementation['getRenderingProfile']> {
  const center = numberParameter(parameters, 'lon_wrap', 0) * DEGREES_TO_RADIANS;
  return coverage =>
    createRectangleRenderingProfile(
      ([west, south, east, north]) => [
        [west, south, 0],
        [east, north, 0]
      ],
      coverage ?? [center - Math.PI, -Math.PI / 2, center + Math.PI, Math.PI / 2]
    );
}
