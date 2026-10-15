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
  getGeographicBounds,
  intersectGeographicBounds,
  normalizeLongitude
} from './geographic-bounds';
import {wrapLongitude} from '../parameters';
import {combineRenderingProfiles} from './rendering-profile';

export type ResolveRenderingBounds = (
  parameters: AngularRanges
) => ProjectionRenderingProfile['bounds'];

/** Normalize native kernel coordinates against Greenwich geographic coverage. */
export function normalizeCoverage(
  point: {x: number; y: number},
  coverage: GeographicBounds,
  origin = 0,
  primeMeridian = 0,
  over = false
): void {
  const ranges = getAngularRanges(coverage, primeMeridian, origin);
  // Region combination is owned by combineRenderingProfiles. This helper
  // clamps one rectangle, preserving its continuous branch when +over is set.
  if (over) {
    point.x = Math.max(ranges[0][0], Math.min(ranges[1][0], point.x));
    point.y = Math.max(ranges[0][1], Math.min(ranges[1][1], point.y));
    return;
  }
  const input: [number, number] = [
    ((point.x + primeMeridian) * 180) / Math.PI,
    (point.y * 180) / Math.PI
  ];
  const best = clampGeographicPoint(coverage, input);
  const inputLongitude = (input[0] * Math.PI) / 180 - primeMeridian;
  let longitude = (best[0] * Math.PI) / 180 - primeMeridian;
  if (
    best[0] === normalizeLongitude(input[0]) &&
    inputLongitude >= ranges[0][0] &&
    inputLongitude <= ranges[1][0]
  )
    longitude = inputLongitude;
  else if (longitude < ranges[0][0] || longitude > ranges[1][0])
    longitude +=
      Math.round(((ranges[0][0] + ranges[1][0]) / 2 - longitude) / (2 * Math.PI)) * 2 * Math.PI;
  point.x = origin + wrapLongitude(longitude - origin);
  point.y = (best[1] * Math.PI) / 180;
}

/** Geographic coverage with a projection-owned analytical envelope. */
export function createRectangleRenderingProfile(
  resolveBounds: ResolveRenderingBounds,
  coverage: GeographicBounds,
  origin = 0,
  primeMeridian = 0,
  over = false
): ProjectionRenderingProfile {
  return {
    get bounds() {
      return resolveBounds(getAngularRanges(coverage, primeMeridian, origin));
    },
    normalize(point) {
      normalizeCoverage(point, coverage, origin, primeMeridian, over);
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
  return {
    ...implementation,
    longitudeOrigin: origin,
    getRenderingProfile(coverage) {
      if (!coverage)
        return {
          bounds: resolveBounds(parameters),
          normalize(point) {
            normalizeCoverage(point, defaults, origin, primeMeridian, over);
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
