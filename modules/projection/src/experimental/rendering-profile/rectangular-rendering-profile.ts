// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GeographicBounds,
  ProjectionImplementation,
  ProjectionRenderingProfile
} from '../types';
import type {AngularRanges} from './geographic-bounds';
import {
  clampGeographicPoint,
  getAngularRanges,
  getLongitudeSpan,
  getGeographicBounds,
  intersectGeographicBounds,
  normalizeLongitude
} from './geographic-bounds';
import {combineRenderingProfiles} from './rendering-profile';

export type ResolveRenderingBounds = (
  parameters: AngularRanges
) => ProjectionRenderingProfile['bounds'];

/** Clamp Greenwich longitude/latitude in degrees to one rendering rectangle. */
export function normalizeCoverage(
  point: {x: number; y: number},
  coverage: GeographicBounds,
  center = 0,
  over = false
): void {
  const span = getLongitudeSpan(coverage);
  const west =
    span === 360
      ? center - 180
      : coverage[0] + Math.round((center - coverage[0] - span / 2) / 360) * 360;
  const east = west + span;
  // Keep geographic values in degrees: a covered seam endpoint must not be
  // perturbed by a radians round trip onto the opposite projection branch.
  if (over) {
    point.x = Math.max(west, Math.min(east, point.x));
    point.y = Math.max(coverage[1], Math.min(coverage[3], point.y));
    return;
  }
  const best = clampGeographicPoint(coverage, [point.x, point.y]);
  let longitude = best[0];
  if (best[0] === normalizeLongitude(point.x) && point.x >= west && point.x <= east)
    longitude = point.x;
  else if (longitude < west || longitude > east)
    longitude += Math.round(((west + east) / 2 - longitude) / 360) * 360;
  const offset = longitude - center;
  point.x = Math.abs(offset) <= 180 ? longitude : center + normalizeLongitude(offset);
  point.y = best[1];
}

/** Geographic coverage with a projection-owned analytical envelope. */
export function createRectangleRenderingProfile(
  resolveBounds: ResolveRenderingBounds,
  coverage: GeographicBounds,
  origin = 0,
  primeMeridian = 0,
  over = false
): ProjectionRenderingProfile {
  const center = ((origin + primeMeridian) * 180) / Math.PI;
  return {
    get bounds() {
      return resolveBounds(getAngularRanges(coverage, primeMeridian, origin));
    },
    normalize(point) {
      normalizeCoverage(point, coverage, center, over);
    }
  };
}

function createRegionsRenderingProfile(
  resolveBounds: ResolveRenderingBounds,
  regions: readonly GeographicBounds[],
  origin: number,
  primeMeridian: number,
  over: boolean
): ProjectionRenderingProfile {
  const profile = combineRenderingProfiles(regions, region =>
    createRectangleRenderingProfile(resolveBounds, region, origin, primeMeridian, over)
  );
  if (!profile) throw new Error('CRS coverage does not intersect the rendering target');
  return profile;
}

/** Algorithms opt into rectangular coverage and clipping to their own default target. */
export function withRectangleRenderingProfile(
  implementation: ProjectionImplementation,
  parameters: AngularRanges,
  resolveBounds: ResolveRenderingBounds,
  primeMeridian = 0,
  over = false
): ProjectionImplementation {
  const origin = (parameters[0][0] + parameters[1][0]) / 2;
  const defaults = getGeographicBounds(parameters, primeMeridian);
  const center = ((origin + primeMeridian) * 180) / Math.PI;
  return {
    ...implementation,
    longitudeOrigin: origin,
    getRenderingProfile(coverage) {
      if (!coverage)
        return {
          bounds: resolveBounds(parameters),
          normalize(point) {
            normalizeCoverage(point, defaults, center, over);
          }
        };
      try {
        const profile = createRectangleRenderingProfile(
          resolveBounds,
          coverage,
          origin,
          primeMeridian,
          over
        );
        const bounds = profile.bounds;
        return {bounds, normalize: profile.normalize};
      } catch {
        // Singular coverage is clipped to this algorithm's chosen finite target.
        return createRegionsRenderingProfile(
          resolveBounds,
          intersectGeographicBounds(coverage, defaults),
          origin,
          primeMeridian,
          over
        );
      }
    }
  };
}
