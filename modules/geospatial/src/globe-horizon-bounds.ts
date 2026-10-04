// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original spherical-cap extrema; requirements from https://github.com/keplergl/kepler.gl/pull/3557. No sampled viewport or upstream implementation copied.

/** Degrees [west, south, east, north]; west > east means a dateline crossing. */
export type GlobeBounds = readonly [number, number, number, number];

/** Conservative geographic extent of every visible surface point on a sphere.
 * Cartesian X points to longitude 0, Y to longitude 90, Z north. Covers the
 * entire horizon cap, not just the screen: safe overfetch, not viewport-tight.
 * Returns undefined on/inside the sphere. Radius and camera use matching units.
 */
export function getGlobeHorizonBounds(
  camera: Readonly<ArrayLike<number>>,
  radius: number
): GlobeBounds | undefined {
  if (
    camera.length !== 3 ||
    !Array.from(camera).every(Number.isFinite) ||
    !Number.isFinite(radius) ||
    radius <= 0
  )
    throw new RangeError('Expected a finite camera and positive sphere radius');
  const distance = Math.hypot(camera[0], camera[1], camera[2]);
  if (!Number.isFinite(distance)) throw new RangeError('Camera magnitude must be finite');
  if (distance <= radius) return undefined;
  const latitude = Math.atan2(camera[2], Math.hypot(camera[0], camera[1]));
  const longitude = Math.atan2(camera[1], camera[0]);
  const angle = Math.acos(radius / distance);
  const degrees = 180 / Math.PI;
  // Outward padding protects tangent and near-pole limits from floating rounding.
  const padding = 1e-10;
  const south = Math.max(-90, (latitude - angle) * degrees - padding);
  const north = Math.min(90, (latitude + angle) * degrees + padding);
  if (Math.abs(latitude) + angle >= Math.PI / 2 - 1e-12) return [-180, south, 180, north];
  const extent = Math.asin(Math.min(1, Math.sin(angle) / Math.cos(latitude))) * degrees + padding;
  return [wrap(longitude * degrees - extent), south, wrap(longitude * degrees + extent), north];
}

/** Split wrapped bounds into protocol-safe rectangles (e.g. EPSG:4326 WMS).
 * No screen sampling, image caching or request policy is implied.
 */
export function splitGlobeBounds(bounds: GlobeBounds): GlobeBounds[] {
  const [west, south, east, north] = bounds;
  if (
    bounds.length !== 4 ||
    !bounds.every(Number.isFinite) ||
    west < -180 ||
    west > 180 ||
    east < -180 ||
    east > 180 ||
    south < -90 ||
    north > 90 ||
    south > north
  )
    throw new RangeError('Invalid degree bounds');
  return west <= east
    ? [[west, south, east, north]]
    : [
        [west, south, 180, north],
        [-180, south, east, north]
      ];
}

function wrap(longitude: number): number {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}
