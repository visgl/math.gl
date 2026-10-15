// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GeographicBounds,
  ProjectionImplementation,
  ProjectionRenderingProfile
} from '../types';
import {unionRenderingBounds} from './geographic-bounds';

/** Algorithms own extent policy; descriptor assembly only selects a resolved profile. */
export function resolveRenderingProfile(
  getRenderingProfile: NonNullable<ProjectionImplementation['getRenderingProfile']>,
  coverage?: GeographicBounds
): ProjectionRenderingProfile {
  if (coverage) {
    try {
      const profile = getRenderingProfile(coverage);
      // Bounds may be lazy. Resolve them here so failures retry the default profile.
      return resolveBounds(profile);
    } catch {
      // Declared metadata remains intact even when its rendering profile falls back.
    }
  }
  const profile = getRenderingProfile();
  return resolveBounds(profile);
}

/** Validate the finite-envelope contract without choosing an extent for an algorithm. */
function resolveBounds(profile: ProjectionRenderingProfile): ProjectionRenderingProfile {
  const bounds = profile.bounds;
  if (bounds.some(corner => corner.some(value => !Number.isFinite(value))))
    throw new Error('Projection rendering bounds must be finite');
  return {bounds, normalize: profile.normalize?.bind(profile)};
}

/** Combine projection-owned profiles for disconnected geographic coverage.
 * A null result explicitly marks an empty piece. Unexpected callback/bounds
 * errors propagate; only an entirely empty collection returns null.
 */
export function combineRenderingProfiles(
  regions: readonly GeographicBounds[],
  getProfile: (region: GeographicBounds) => ProjectionRenderingProfile | null
): ProjectionRenderingProfile | null {
  const profiles: ProjectionRenderingProfile[] = [];
  for (const region of regions) {
    const profile = getProfile(region);
    if (profile !== null) profiles.push(resolveBounds(profile));
  }
  if (!profiles.length) return null;
  if (profiles.length === 1) return profiles[0];
  return {
    bounds: unionRenderingBounds(profiles.map(profile => profile.bounds)),
    normalize(point) {
      let bestX = point.x,
        bestY = point.y,
        best = Infinity;
      for (const profile of profiles) {
        const candidate = {x: point.x, y: point.y, z: point.z};
        profile.normalize?.(candidate);
        // Compare the actual normalized positions, rather than rectangular
        // envelopes that may include points outside a curved rendering target.
        const distance =
          Math.sin((candidate.y - point.y) / 2) ** 2 +
          Math.cos(point.y) * Math.cos(candidate.y) * Math.sin((candidate.x - point.x) / 2) ** 2;
        if (distance < best) {
          best = distance;
          bestX = candidate.x;
          bestY = candidate.y;
        }
      }
      point.x = bestX;
      point.y = bestY;
    }
  };
}
