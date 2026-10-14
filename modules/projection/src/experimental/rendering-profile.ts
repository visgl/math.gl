// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {KernelParameters} from './kernel';
import type {ProjectionImplementation, ProjectionPoint, ProjectionRenderingProfile} from './types';
import {wrapLongitude} from './parameters';

type Curve = (fraction: number) => [number, number];
type Project = ProjectionImplementation['forward'];

/** Retain curve segments inside the other domain, refining their intersection endpoints. */
function intersectCurve(curve: Curve, contains: (x: number, y: number) => boolean): Curve[] {
  const count = 256;
  const curves: Curve[] = [];
  let start = 0;
  let previousInside = contains(...curve(0));
  for (let index = 1; index <= count; index++) {
    const end = index / count;
    const inside = contains(...curve(end));
    if (inside !== previousInside) {
      let left = (index - 1) / count;
      let right = end;
      for (let iteration = 0; iteration < 48; iteration++) {
        const middle = (left + right) / 2;
        if (contains(...curve(middle)) === previousInside) left = middle;
        else right = middle;
      }
      const intersection = inside ? right : left;
      if (inside) start = intersection;
      else {
        const segmentStart = start;
        curves.push(t => curve(segmentStart + t * (intersection - segmentStart)));
      }
    }
    if (index === count && inside) {
      const segmentStart = start;
      curves.push(t => curve(segmentStart + t * (1 - segmentStart)));
    }
    previousInside = inside;
  }
  return curves;
}

function rectangleCurves([west, south, east, north]: GeographicRenderingBounds): Curve[] {
  return [
    t => [west + t * (east - west), south],
    t => [east, south + t * (north - south)],
    t => [east - t * (east - west), north],
    t => [west, north - t * (north - south)]
  ];
}
/** Native geographic rectangle in radians, with an unwrapped east endpoint. */
export type GeographicRenderingBounds = readonly [
  west: number,
  south: number,
  east: number,
  north: number
];

/** Project the boundary rather than its corners: curved edges can contain the extrema. */
function projectBoundaryBounds(
  project: Project,
  curves: readonly Curve[]
): ProjectionRenderingProfile['bounds'] {
  const count = 64;
  const minimum = [Infinity, Infinity, 0];
  const maximum = [-Infinity, -Infinity, 0];
  for (const curve of curves) {
    const sample = (t: number) => project(...curve(t));
    const points = Array.from({length: count + 1}, (_, index) => sample(index / count));
    for (const point of points) {
      if (!point.every(Number.isFinite))
        throw new Error('Projection rendering boundary is not finite');
      for (let axis = 0; axis < 2; axis++) {
        minimum[axis] = Math.min(minimum[axis], point[axis]);
        maximum[axis] = Math.max(maximum[axis], point[axis]);
      }
    }
    for (let axis = 0; axis < 2; axis++) {
      for (const sign of [-1, 1]) {
        // Refine each local extremum, including projections with several lobes.
        for (let index = 1; index < count; index++) {
          const value = sign * points[index][axis];
          if (value <= sign * points[index - 1][axis] || value < sign * points[index + 1][axis])
            continue;
          let left = (index - 1) / count,
            right = (index + 1) / count;
          const ratio = (Math.sqrt(5) - 1) / 2;
          let a = right - ratio * (right - left),
            b = left + ratio * (right - left);
          let valueA = sample(a)[axis],
            valueB = sample(b)[axis];
          for (let iteration = 0; iteration < 40; iteration++) {
            if (sign * valueA > sign * valueB) {
              right = b;
              b = a;
              valueB = valueA;
              a = right - ratio * (right - left);
              valueA = sample(a)[axis];
            } else {
              left = a;
              a = b;
              valueA = valueB;
              b = left + ratio * (right - left);
              valueB = sample(b)[axis];
            }
          }
          minimum[axis] = Math.min(minimum[axis], valueA, valueB);
          maximum[axis] = Math.max(maximum[axis], valueA, valueB);
        }
      }
    }
  }
  for (let axis = 0; axis < 2; axis++) {
    // Enclose numerical extrema without making this rectangle a validity test.
    const padding = Math.max(1, Math.abs(minimum[axis]), Math.abs(maximum[axis])) * 1e-12;
    minimum[axis] -= padding;
    maximum[axis] += padding;
  }
  return [minimum as [number, number, number], maximum as [number, number, number]];
}

/** A finite rectangular rendering domain; conversions themselves remain unrestricted. */
export function createRectangleRenderingProfile(
  project: Project,
  bounds: GeographicRenderingBounds
): ProjectionRenderingProfile {
  const [west, south, east, north] = bounds;
  const center = (west + east) / 2;
  const spanX = east - west,
    spanY = north - south;
  if (!(spanX > 0 && spanX <= 2 * Math.PI + 1e-12 && spanY > 0))
    throw new Error('Invalid geographic rendering extent');
  return {
    // Bounds are needed by descriptors, not by ordinary coordinate conversion.
    get bounds() {
      return projectBoundaryBounds(project, rectangleCurves(bounds));
    },
    longitudeCenter: center,
    maxLatitude: Math.PI / 2,
    normalize(point) {
      point.x = Math.max(west, Math.min(east, center + wrapLongitude(point.x - center)));
      point.y = Math.max(south, Math.min(north, point.y));
    }
  };
}

/** A center-relative angular rendering cap; its horizon may depend on azimuth. */
export function createAngularRenderingProfile(
  base: Pick<KernelParameters, 'long0' | 'lat0'>,
  project: Project,
  maximumDistance: number | ((bearing: number) => number)
): ProjectionRenderingProfile {
  const sinLatitude = Math.sin(base.lat0),
    cosLatitude = Math.cos(base.lat0);
  const sinLongitude = Math.sin(base.long0),
    cosLongitude = Math.cos(base.long0);
  const center = [cosLatitude * cosLongitude, cosLatitude * sinLongitude, sinLatitude];
  const north = [-sinLatitude * cosLongitude, -sinLatitude * sinLongitude, cosLatitude];
  const east = [-sinLongitude, cosLongitude, 0];
  const distance = typeof maximumDistance === 'function' ? maximumDistance : () => maximumDistance;
  function boundary(bearing: number): [number, number] {
    const angle = distance(bearing);
    const position = center.map(
      (value, axis) =>
        value * Math.cos(angle) +
        (north[axis] * Math.cos(bearing) + east[axis] * Math.sin(bearing)) * Math.sin(angle)
    );
    return [
      Math.atan2(position[1], position[0]),
      Math.atan2(position[2], Math.hypot(position[0], position[1]))
    ];
  }
  return {
    get bounds() {
      return projectBoundaryBounds(project, [t => boundary(t * 2 * Math.PI)]);
    },
    longitudeCenter: base.long0,
    maxLatitude: Math.PI / 2,
    boundary: t => boundary(t * 2 * Math.PI),
    contains(longitude, latitude) {
      const delta = longitude - base.long0;
      const dot =
        sinLatitude * Math.sin(latitude) + cosLatitude * Math.cos(latitude) * Math.cos(delta);
      const bearing = Math.atan2(
        Math.cos(latitude) * Math.sin(delta),
        cosLatitude * Math.sin(latitude) - sinLatitude * Math.cos(latitude) * Math.cos(delta)
      );
      return dot >= Math.cos(distance(bearing)) - 1e-14;
    },
    requiresClipping([west, south, east, north]) {
      // A rectangle can surround the antipode while every edge remains convertible.
      // Resolve its meridian into the coverage interval, including dateline crossings.
      const antipodeLongitude =
        west + ((((base.long0 + Math.PI - west) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
      const longitudeCovered = Math.abs(cosLatitude) < 1e-12 || antipodeLongitude <= east + 1e-12;
      return longitudeCovered && -base.lat0 >= south && -base.lat0 <= north;
    },
    normalize(point) {
      const delta = point.x - base.long0;
      const sin = Math.sin(point.y),
        cos = Math.cos(point.y);
      const dot = sinLatitude * sin + cosLatitude * cos * Math.cos(delta);
      let bearing = Math.atan2(
        cos * Math.sin(delta),
        cosLatitude * sin - sinLatitude * cos * Math.cos(delta)
      );
      if (Math.abs(cosLatitude) < 1e-12) {
        // Retain the input meridian even at the antipodal pole, preserving graticules.
        bearing = Math.atan2(Math.sin(delta), -sinLatitude * Math.cos(delta));
      } else if (Math.abs(dot + 1) < 1e-14) {
        // An exact antipode has no unique azimuth; choose the northward boundary.
        bearing = 0;
      }
      if (dot >= Math.cos(distance(bearing))) return;
      [point.x, point.y] = boundary(bearing);
    }
  };
}

/** Declared CRS coverage replaces the algorithm's default rendering domain. */
export function createCoverageRenderingProfile(
  implementation: ProjectionImplementation,
  profile: ProjectionRenderingProfile,
  bounds: GeographicRenderingBounds
): ProjectionRenderingProfile {
  let clipToDomain = profile.requiresClipping?.(bounds) ?? false,
    coverageChecked = false;
  const clip = (point: ProjectionPoint) => {
    point.y = Math.max(-profile.maxLatitude, Math.min(profile.maxLatitude, point.y));
    profile.normalize?.(point);
  };
  const covered = createRectangleRenderingProfile((x, y) => {
    const point = {x, y, z: 0};
    if (clipToDomain) clip(point);
    return implementation.forward(point.x, point.y);
  }, bounds);
  const [west, south, east, north] = bounds;
  const longitudeCenter = (west + east) / 2;
  const unwrap = (longitude: number) =>
    longitudeCenter + wrapLongitude(longitude - longitudeCenter);
  const inCoverage = (x: number, y: number) =>
    x >= west - 1e-12 && x <= east + 1e-12 && y >= south - 1e-12 && y <= north + 1e-12;
  let intersection: Curve[] = [];
  const clippedBounds = () => {
    if (!profile.boundary || !profile.contains) return covered.bounds;
    // The intersection boundary consists of coverage edges inside the cap and
    // cap arcs inside coverage. Neither domain's full envelope belongs here.
    intersection = rectangleCurves(bounds).flatMap(curve =>
      intersectCurve(curve, profile.contains!)
    );
    intersection.push(
      ...intersectCurve(t => {
        const [x, y] = profile.boundary!(t);
        return [unwrap(x), y];
      }, inCoverage)
    );
    if (!intersection.length)
      throw new Error('CRS coverage does not intersect the rendering domain');
    return projectBoundaryBounds(implementation.forward, intersection);
  };
  const resolveBounds = () => {
    try {
      const result = clipToDomain ? clippedBounds() : covered.bounds;
      coverageChecked = true;
      return result;
    } catch (error) {
      if (clipToDomain || (!profile.normalize && profile.maxLatitude >= Math.PI / 2)) throw error;
      // Explicit coverage replaces defaults when convertible. At a horizon use
      // the projection-owned finite clipping policy, e.g. Gnomonic's 80-degree cap.
      clipToDomain = true;
      const result = clippedBounds();
      coverageChecked = true;
      return result;
    }
  };
  return {
    get bounds() {
      return resolveBounds();
    },
    longitudeCenter: covered.longitudeCenter,
    maxLatitude: covered.maxLatitude,
    normalize(point) {
      if (!coverageChecked) resolveBounds();
      covered.normalize!(point);
      if (clipToDomain) {
        clip(point);
        point.x = unwrap(point.x);
        if (intersection.length && !inCoverage(point.x, point.y)) {
          // Radial cap clamping can leave the coverage rectangle. Choose the
          // closest point on the intersection boundary to satisfy both domains.
          const target = [
            Math.cos(point.y) * Math.cos(point.x),
            Math.cos(point.y) * Math.sin(point.x),
            Math.sin(point.y)
          ];
          const score = (coordinate: [number, number]) => {
            const [x, y] = coordinate;
            return (
              target[0] * Math.cos(y) * Math.cos(x) +
              target[1] * Math.cos(y) * Math.sin(x) +
              target[2] * Math.sin(y)
            );
          };
          let bestScore = -Infinity;
          let bestCurve = intersection[0];
          let bestT = 0;
          for (const curve of intersection) {
            for (let index = 0; index <= 64; index++) {
              const value = score(curve(index / 64));
              if (value > bestScore) {
                bestScore = value;
                bestCurve = curve;
                bestT = index / 64;
              }
            }
          }
          let left = Math.max(0, bestT - 1 / 64);
          let right = Math.min(1, bestT + 1 / 64);
          for (let iteration = 0; iteration < 48; iteration++) {
            const a = left + (right - left) / 3;
            const b = right - (right - left) / 3;
            if (score(bestCurve(a)) > score(bestCurve(b))) right = b;
            else left = a;
          }
          [point.x, point.y] = bestCurve((left + right) / 2);
        }
      }
    }
  };
}

/** Attach a rectangular domain without changing the conversion implementation. */
export function withRectangleRenderingProfile(
  implementation: ProjectionImplementation,
  bounds: GeographicRenderingBounds
): ProjectionImplementation {
  return {
    ...implementation,
    profile: createRectangleRenderingProfile(implementation.forward, bounds)
  };
}

/** Attach a spherical cap without changing the conversion implementation. */
export function withAngularRenderingProfile(
  implementation: ProjectionImplementation,
  base: Pick<KernelParameters, 'long0' | 'lat0'>,
  distance: number | ((bearing: number) => number)
): ProjectionImplementation {
  return {
    ...implementation,
    profile: createAngularRenderingProfile(base, implementation.forward, distance)
  };
}
