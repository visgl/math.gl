// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {KernelParameters} from '../kernel';
import {
  createAngularRanges,
  getAngularRanges,
  getGeographicBounds,
  intersectGeographicBounds
} from './geographic-bounds';
import type {AngularRanges} from './geographic-bounds';
import {combineRenderingProfiles, createAngularNormalization} from './rendering-profile';
import {normalizeCoverage} from './rectangular-rendering-profile';
import type {ProjectionImplementation, ProjectionRenderingProfile} from '../types';
import {wrapLongitude} from '../parameters';
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
  const create = (
    coverage: AngularRanges,
    declared: boolean
  ): ProjectionRenderingProfile | null => {
    const closestLatitude = Math.max(coverage[0][1], Math.min(coverage[1][1], 0));
    const maximumLongitude = longitudeLimit(closestLatitude);
    const west = Math.max(coverage[0][0] - base.long0, -maximumLongitude);
    const east = Math.min(coverage[1][0] - base.long0, maximumLongitude);
    const maxLatitude = latitudeLimit(Math.max(west, Math.min(east, 0)));
    const south = Math.max(coverage[0][1], -maxLatitude),
      north = Math.min(coverage[1][1], maxLatitude);
    if (east < west || north < south) return null;
    const region = createAngularRanges(west, south, east, north);
    const geographicCoverage = getGeographicBounds(
      createAngularRanges(west + base.long0, south, east + base.long0, north),
      base.primeMeridian
    );
    const center = ((base.long0 + base.primeMeridian) * 180) / Math.PI;
    const normalizeLimb = createAngularNormalization(point => {
      const longitude = Math.max(west, Math.min(east, wrapLongitude(point.x - base.long0)));
      const limit = latitudeLimit(longitude);
      const latitude = Math.max(Math.max(south, -limit), Math.min(Math.min(north, limit), point.y));
      // Avoid reconstructing a native longitude when it is already within the limb.
      if (longitude !== point.x - base.long0) point.x = longitude + base.long0;
      point.y = latitude;
    }, base.primeMeridian);
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
        normalizeCoverage(point, geographicCoverage, center);
        normalizeLimb(point);
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
    const profile = combineRenderingProfiles(regions, region =>
      create(getAngularRanges(region, base.primeMeridian, base.long0), Boolean(coverage))
    );
    if (!profile) throw new Error('CRS coverage does not intersect the satellite limb');
    return profile;
  };
}
