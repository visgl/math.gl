// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {KernelParameters} from './kernel';
import type {GeographicBounds, ProjectionImplementation, ProjectionRenderingProfile} from './types';
import {createAngularRanges, getAngularRanges} from './geographic-bounds';
import type {AngularRanges} from './geographic-bounds';
import {createRectangleRenderingProfile} from './rectangular-rendering-profile';
import {geographicVector, sphericalExtremum} from './spherical-rendering-domain';
import type {AngularDomain} from './spherical-rendering-domain';
import {wrapLongitude} from './parameters';

export type ResolveAngularBounds = (
  parameters: AngularRanges,
  domain?: AngularDomain
) => ProjectionRenderingProfile['bounds'];

/** A spherical cap with projection-owned analytical bounds and exact coverage intersections. */
export function createAngularRenderingProfile(
  base: Pick<KernelParameters, 'long0' | 'lat0' | 'primeMeridian'>,
  maximumDistance: number,
  resolveBounds: ResolveAngularBounds,
  horizon = Math.PI
): NonNullable<ProjectionImplementation['getRenderingProfile']> {
  const full: GeographicBounds = [-180, -90, 180, 90];
  const create = (coverage: GeographicBounds, declared: boolean): ProjectionRenderingProfile => {
    const parameters = getAngularRanges(coverage, base.primeMeridian, base.long0);
    const local = createAngularRanges(
      parameters.longitude[0] - base.long0,
      parameters.latitude[0],
      parameters.longitude[1] - base.long0,
      parameters.latitude[1]
    );
    const axis = [Math.cos(base.lat0), 0, Math.sin(base.lat0)] as const;
    const minimum = declared ? sphericalExtremum(axis, local, undefined, false).value : -1;
    const clipped = !declared || minimum <= Math.cos(horizon) + 1e-13;
    const domain = clipped ? {latitude: base.lat0, distance: maximumDistance} : undefined;
    const rectangle = createRectangleRenderingProfile(
      () => resolveBounds(local, domain),
      coverage,
      base.long0,
      base.primeMeridian
    );
    return {
      get bounds() {
        return resolveBounds(local, domain);
      },
      normalize(point) {
        rectangle.normalize!(point);
        if (domain) {
          if (Math.abs(Math.cos(base.lat0)) < 1e-12) {
            // At the antipodal pole every meridian is equally close; retain the
            // input meridian so graticules do not collapse onto one longitude.
            point.y =
              base.lat0 > 0
                ? Math.max(Math.PI / 2 - maximumDistance, point.y)
                : Math.min(-Math.PI / 2 + maximumDistance, point.y);
            return;
          }
          const target = geographicVector(point.x - base.long0, point.y);
          if (
            target[0] * Math.cos(base.lat0) + target[2] * Math.sin(base.lat0) >=
            Math.cos(domain.distance) - 1e-14
          )
            return;
          if (Math.hypot(target[0] + axis[0], target[1], target[2] + axis[2]) < 1e-12) {
            // All cap bearings are equally close to an exact antipode. Prefer
            // northward to keep normalization stable, provided coverage allows it.
            const angle = base.lat0 + domain.distance;
            const center = (local.longitude[0] + local.longitude[1]) / 2;
            const longitude = center + wrapLongitude((Math.cos(angle) < 0 ? Math.PI : 0) - center);
            const latitude = Math.atan2(Math.sin(angle), Math.abs(Math.cos(angle)));
            if (
              longitude >= local.longitude[0] &&
              longitude <= local.longitude[1] &&
              latitude >= local.latitude[0] &&
              latitude <= local.latitude[1]
            ) {
              point.x = longitude + base.long0;
              point.y = latitude;
              return;
            }
          }
          const result = sphericalExtremum(target, local, domain);
          [point.x, point.y] = [result.point[0] + base.long0, result.point[1]];
        }
      }
    };
  };
  return coverage => create(coverage ?? full, Boolean(coverage));
}

export function withAngularRenderingProfile(
  implementation: ProjectionImplementation,
  base: Pick<KernelParameters, 'long0' | 'lat0' | 'primeMeridian'>,
  distance: number,
  resolveBounds: ResolveAngularBounds,
  horizon = Math.PI
): ProjectionImplementation {
  return {
    ...implementation,
    longitudeOrigin: base.long0,
    getRenderingProfile: createAngularRenderingProfile(base, distance, resolveBounds, horizon)
  };
}
