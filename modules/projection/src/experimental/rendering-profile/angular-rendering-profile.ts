// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {KernelParameters} from '../kernel';
import type {
  GeographicBounds,
  ProjectionImplementation,
  ProjectionRenderingProfile
} from '../types';
import {createAngularRanges, getAngularRanges, normalizeLongitude} from './geographic-bounds';
import type {AngularRanges} from './geographic-bounds';
import {createRectangleRenderingProfile} from './rectangular-rendering-profile';
import {geographicVector, sphericalExtremum} from './spherical-rendering-domain';
import type {AngularDomain} from './spherical-rendering-domain';
import {wrapLongitude} from '../parameters';
import {createAngularNormalization} from './rendering-profile';

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
      parameters[0][0] - base.long0,
      parameters[0][1],
      parameters[1][0] - base.long0,
      parameters[1][1]
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
    const polar = Math.abs(Math.cos(base.lat0)) < 1e-12;
    const polarLatitude = ((Math.PI / 2 - maximumDistance) * 180) / Math.PI;
    const normalizeCap =
      domain &&
      !polar &&
      createAngularNormalization(point => {
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
          const center = (local[0][0] + local[1][0]) / 2;
          const longitude = center + wrapLongitude((Math.cos(angle) < 0 ? Math.PI : 0) - center);
          const latitude = Math.atan2(Math.sin(angle), Math.abs(Math.cos(angle)));
          if (
            longitude >= local[0][0] &&
            longitude <= local[1][0] &&
            latitude >= local[0][1] &&
            latitude <= local[1][1]
          ) {
            point.x = longitude + base.long0;
            point.y = latitude;
            return;
          }
        }
        const result = sphericalExtremum(target, local, domain);
        [point.x, point.y] = [result.point[0] + base.long0, result.point[1]];
      }, base.primeMeridian);
    return {
      get bounds() {
        return resolveBounds(local, domain);
      },
      normalize(point) {
        rectangle.normalize!(point);
        if (domain && polar) {
          // A polar cap is a latitude clamp in degrees; retain its input meridian.
          point.y =
            base.lat0 > 0 ? Math.max(polarLatitude, point.y) : Math.min(-polarLatitude, point.y);
        } else normalizeCap?.(point);
        // Cap extrema use a continuous coverage interval, which may lie on a
        // different longitude branch than the rectangle's normalized output.
        const center = ((base.long0 + base.primeMeridian) * 180) / Math.PI;
        const offset = point.x - center;
        if (Math.abs(offset) > 180) point.x = center + normalizeLongitude(offset);
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
