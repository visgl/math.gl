// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {KernelParameters} from './kernel';
import {
  createAngularRanges,
  getAngularRanges,
  getGeographicBounds,
  intersectGeographicBounds,
  unionRenderingBounds
} from './geographic-bounds';
import type {AngularRanges} from './geographic-bounds';
import {normalizeCoverage} from './rectangular-rendering-profile';
import type {ProjectionImplementation, ProjectionRenderingProfile} from './types';
import {wrapLongitude} from './parameters';
import {sphericalRange} from './spherical-rendering-domain';
import {multiply, envelope, add} from './rendering-bounds';

/** The satellite limb is the ellipsoid/satellite tangency, Rg*X=1.
 * Solve the limb's latitude and longitude intersections directly in geodetic coordinates.
 */
export function createGeostationaryProfile(
  base: KernelParameters,
  height: number,
  sweepX = false
): NonNullable<ProjectionImplementation['getRenderingProfile']> {
  const radius = 1 + height / base.a;
  const visibleRadius = radius / (1 + 1e-10);
  const longitudeLimit = (latitude: number) =>
    Math.acos(
      Math.min(
        1,
        Math.sqrt(1 - base.es * Math.sin(latitude) ** 2) / (visibleRadius * Math.cos(latitude))
      )
    );
  const latitudeLimit = (longitude: number) => {
    const squared = (visibleRadius * Math.cos(longitude)) ** 2;
    return Math.asin(Math.sqrt(Math.max(0, (squared - 1) / (squared - base.es))));
  };
  const fullX = height * Math.asin(1 / radius);
  const fullY = height * Math.atan(Math.sqrt((1 - base.es) / (radius * radius - 1)));
  const create = (coverage: AngularRanges, declared: boolean): ProjectionRenderingProfile => {
    const closestLatitude = Math.max(coverage.latitude[0], Math.min(coverage.latitude[1], 0));
    const maximumLongitude = longitudeLimit(closestLatitude);
    const west = Math.max(coverage.longitude[0] - base.long0, -maximumLongitude);
    const east = Math.min(coverage.longitude[1] - base.long0, maximumLongitude);
    const maxLatitude = latitudeLimit(Math.max(west, Math.min(east, 0)));
    const south = Math.max(coverage.latitude[0], -maxLatitude),
      north = Math.min(coverage.latitude[1], maxLatitude);
    if (east < west || north < south)
      throw new Error('CRS coverage does not intersect the satellite limb');
    const region = createAngularRanges(west, south, east, north);
    return {
      get bounds() {
        if (!declared)
          return envelope([base.x0 - fullX, base.x0 + fullX], [base.y0 - fullY, base.y0 + fullY]);
        // Geodetic surface coordinates: N*cos(phi)*sin(lambda), N*(1-e²)*sin(phi).
        const sin = sphericalRange([0, 0, 1], region);
        const n = [1, 1 / Math.sqrt(1 - base.es * Math.max(sin[0] ** 2, sin[1] ** 2))] as const;
        const x = multiply(sphericalRange([1, 0, 0], region), n);
        const y = multiply(sphericalRange([0, 1, 0], region), n);
        const z = multiply(sin, [1 - base.es, (1 - base.es) * n[1]]);
        const denominators = [radius - Math.min(1, x[1]), radius - Math.max(1 / radius, x[0])];
        const angleRange = (
          range: readonly [number, number],
          other: readonly [number, number],
          maximum: number,
          orthogonal: boolean
        ) => {
          const minimumOther =
            other[0] <= 0 && other[1] >= 0 ? 0 : Math.min(Math.abs(other[0]), Math.abs(other[1]));
          const ds = orthogonal
            ? [
                Math.hypot(denominators[0], minimumOther),
                Math.hypot(denominators[1], Math.max(Math.abs(other[0]), Math.abs(other[1])))
              ]
            : denominators;
          const values = range.flatMap(value => ds.map(d => height * Math.atan(value / d)));
          return [
            Math.max(-maximum, Math.min(...values)),
            Math.min(maximum, Math.max(...values))
          ] as const;
        };
        return envelope(
          add([base.x0, base.x0], angleRange(y, z, fullX, sweepX)),
          add([base.y0, base.y0], angleRange(z, y, fullY, !sweepX))
        );
      },
      normalize(point) {
        normalizeCoverage(
          point,
          [
            getGeographicBounds(
              createAngularRanges(west + base.long0, south, east + base.long0, north),
              base.primeMeridian
            )
          ],
          base.long0,
          base.primeMeridian
        );
        point.x = Math.max(west, Math.min(east, wrapLongitude(point.x - base.long0)));
        const limit = latitudeLimit(point.x);
        point.y = Math.max(Math.max(south, -limit), Math.min(Math.min(north, limit), point.y));
        point.x += base.long0;
      }
    };
  };
  const extent = getGeographicBounds(
    createAngularRanges(
      base.long0 - longitudeLimit(0),
      -latitudeLimit(0),
      base.long0 + longitudeLimit(0),
      latitudeLimit(0)
    ),
    base.primeMeridian
  );
  return coverage => {
    const regions = coverage ? intersectGeographicBounds(coverage, extent) : [extent];
    const profiles = regions.map(region =>
      create(getAngularRanges(region, base.primeMeridian, base.long0), Boolean(coverage))
    );
    // Resolve each piece before returning a normalizer; empty coverage must fall back.
    const bounds = unionRenderingBounds(profiles.map(profile => profile.bounds));
    return {
      bounds,
      normalize(point) {
        normalizeCoverage(point, regions, base.long0, base.primeMeridian);
        const longitude = wrapLongitude(point.x - base.long0);
        const index = regions.findIndex(region => {
          const ranges = getAngularRanges(region, base.primeMeridian, base.long0);
          return (
            longitude >= ranges.longitude[0] - base.long0 - 1e-12 &&
            longitude <= ranges.longitude[1] - base.long0 + 1e-12
          );
        });
        profiles[Math.max(0, index)].normalize!(point);
      }
    };
  };
}
