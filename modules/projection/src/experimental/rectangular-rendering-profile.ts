// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionImplementation, ProjectionRenderingProfile} from './types';
import type {GeographicRenderingBounds} from './rendering-profile';
import {wrapLongitude} from './parameters';

export type ResolveRenderingBounds = (
  coverage: GeographicRenderingBounds
) => ProjectionRenderingProfile['bounds'];

/** Geographic rectangle with a projection-owned analytical envelope. */
export function createRectangleRenderingProfile(
  resolveBounds: ResolveRenderingBounds,
  coverage: GeographicRenderingBounds
): ProjectionRenderingProfile {
  const [west, south, east, north] = coverage;
  const center = (west + east) / 2;
  if (!(east > west && east - west <= 2 * Math.PI + 1e-12 && north >= south))
    throw new Error('Invalid geographic rendering extent');
  return {
    get bounds() {
      return resolveBounds(coverage);
    },
    normalize(point) {
      point.x = Math.max(west, Math.min(east, center + wrapLongitude(point.x - center)));
      point.y = Math.max(south, Math.min(north, point.y));
    }
  };
}

/** Attach analytical bounds without changing coordinate conversion. */
export function withRectangleRenderingProfile(
  implementation: ProjectionImplementation,
  bounds: GeographicRenderingBounds,
  resolveBounds: ResolveRenderingBounds
): ProjectionImplementation {
  const getRenderingProfile = (coverage?: GeographicRenderingBounds) => {
    let region = coverage ?? bounds;
    try {
      resolveBounds(region);
    } catch {
      // The algorithm's extrema may reach a singularity (e.g. LCC's opposite
      // pole). Intersect coverage with its finite rendering policy in that case.
      const shift =
        Math.round((region[0] + region[2] - bounds[0] - bounds[2]) / (4 * Math.PI)) * 2 * Math.PI;
      region = [
        Math.max(region[0], bounds[0] + shift),
        Math.max(region[1], bounds[1]),
        Math.min(region[2], bounds[2] + shift),
        Math.min(region[3], bounds[3])
      ];
    }
    return createRectangleRenderingProfile(resolveBounds, region);
  };
  return {...implementation, getRenderingProfile};
}
