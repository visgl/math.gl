// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeographicBounds, ProjectionImplementation, ProjectionRenderingProfile} from './types';

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
