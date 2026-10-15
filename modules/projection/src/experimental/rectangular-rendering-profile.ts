// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeographicBounds, ProjectionImplementation, ProjectionRenderingProfile} from './types';
import type {AngularRanges} from './geographic-bounds';
import {
  clampGeographicPoint,
  getAngularRanges,
  getGeographicBounds,
  intersectGeographicBounds,
  normalizeLongitude,
  unionRenderingBounds
} from './geographic-bounds';
import {wrapLongitude} from './parameters';

export type ResolveRenderingBounds = (
  parameters: AngularRanges
) => ProjectionRenderingProfile['bounds'];

/** Normalize native kernel coordinates against Greenwich geographic coverage. */
export function normalizeCoverage(
  point: {x: number; y: number},
  regions: readonly GeographicBounds[],
  origin = 0,
  primeMeridian = 0,
  over = false
): void {
  const input: [number, number] = [
    ((point.x + primeMeridian) * 180) / Math.PI,
    (point.y * 180) / Math.PI
  ];
  let selected: GeographicBounds | undefined;
  let best: [number, number] | undefined,
    distance = Infinity;
  for (const region of regions) {
    const candidate = clampGeographicPoint(region, input);
    const d = Math.hypot(normalizeLongitude(candidate[0] - input[0]), candidate[1] - input[1]);
    if (d < distance) {
      best = candidate;
      selected = region;
      distance = d;
    }
  }
  if (!best) throw new Error('CRS coverage does not intersect the rendering target');
  const ranges = getAngularRanges(selected!, primeMeridian, origin);
  const inputLongitude = (input[0] * Math.PI) / 180 - primeMeridian;
  let longitude = (best[0] * Math.PI) / 180 - primeMeridian;
  if (
    best[0] === normalizeLongitude(input[0]) &&
    inputLongitude >= ranges.longitude[0] &&
    inputLongitude <= ranges.longitude[1]
  )
    longitude = inputLongitude;
  else if (longitude < ranges.longitude[0] || longitude > ranges.longitude[1])
    longitude +=
      Math.round(((ranges.longitude[0] + ranges.longitude[1]) / 2 - longitude) / (2 * Math.PI)) *
      2 *
      Math.PI;
  // +over keeps the chosen continuous interval; ordinary kernels wrap relative
  // to their effective origin. Both choices use the same ranges as the bounds.
  point.x = over ? longitude : origin + wrapLongitude(longitude - origin);
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
  return createRegionsRenderingProfile(resolveBounds, [coverage], origin, primeMeridian, over);
}

function createRegionsRenderingProfile(
  resolveBounds: ResolveRenderingBounds,
  regions: readonly GeographicBounds[],
  origin: number,
  primeMeridian: number,
  over: boolean
): ProjectionRenderingProfile {
  return {
    get bounds() {
      return unionRenderingBounds(
        regions.map(region => resolveBounds(getAngularRanges(region, primeMeridian, origin)))
      );
    },
    normalize(point) {
      normalizeCoverage(point, regions, origin, primeMeridian, over);
    }
  };
}

/** Algorithms opt into rectangular coverage and clipping to their own default target. */
export function withRectangleRenderingProfile(
  implementation: ProjectionImplementation,
  parameters: AngularRanges,
  resolveBounds: ResolveRenderingBounds,
  primeMeridian = 0,
  over = false
): ProjectionImplementation {
  const origin = (parameters.longitude[0] + parameters.longitude[1]) / 2;
  const defaults = getGeographicBounds(parameters, primeMeridian);
  return {
    ...implementation,
    longitudeOrigin: origin,
    getRenderingProfile(coverage) {
      if (!coverage)
        return {
          bounds: resolveBounds(parameters),
          normalize(point) {
            normalizeCoverage(point, [defaults], origin, primeMeridian, over);
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
