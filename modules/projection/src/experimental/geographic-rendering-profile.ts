// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionParameters, ProjectionRenderingProfile} from './types';
import {DEGREES_TO_RADIANS, numberParameter} from './parameters';

/** Geographic conversion is built into the engine; its native coordinates are radians. */
export function createGeographicProfile(
  parameters: ProjectionParameters
): ProjectionRenderingProfile {
  const center = numberParameter(parameters, 'lon_wrap', 0) * DEGREES_TO_RADIANS;
  return {
    bounds: [
      [center - Math.PI, -Math.PI / 2, 0],
      [center + Math.PI, Math.PI / 2, 0]
    ],
    longitudeCenter: center,
    maxLatitude: Math.PI / 2
  };
}
