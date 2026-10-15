// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionRenderingProfile} from '../types';

/** Identity coordinates use a unit square as their default rendering target. */
export function getIdentityRenderingProfile(): ProjectionRenderingProfile {
  return {
    bounds: [
      [-1, -1, 0],
      [1, 1, 0]
    ]
  };
}
