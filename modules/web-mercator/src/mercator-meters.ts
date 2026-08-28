// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const PI = Math.PI;
const DEGREES_TO_RADIANS = PI / 180;
const RADIANS_TO_DEGREES = 180 / PI;

/** Radius of the sphere used by EPSG:3857, in meters. */
export const EPSG3857_EARTH_RADIUS = 6378137;

/** Half the circumference of the EPSG:3857 sphere, in meters. */
export const EPSG3857_HALF_CIRCUMFERENCE = PI * EPSG3857_EARTH_RADIUS;

/** Maximum latitude with a finite value in the spherical Mercator projection. */
export const EPSG3857_MAX_LATITUDE = Math.atan(Math.sinh(PI)) * RADIANS_TO_DEGREES;

/** EPSG:3857 meters per 512-unit world coordinate at the equator. */
export const EPSG3857_UNITS_PER_METER = 512 / (2 * EPSG3857_HALF_CIRCUMFERENCE);

export type EPSG3857Options = {
  /** Clamp latitude to the finite Web Mercator range. Defaults to true. */
  clampLatitude?: boolean;
};

/**
 * Convert WGS84 longitude/latitude coordinates to EPSG:3857 meters.
 *
 * The optional third coordinate is preserved as an elevation in meters.
 */
export function lngLatToEPSG3857(lngLatZ: number[], options: EPSG3857Options = {}): number[] {
  const [longitude, latitude, z] = lngLatZ;
  const {clampLatitude = true} = options;

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new Error('Invalid longitude or latitude');
  }
  if (lngLatZ.length >= 3 && !Number.isFinite(z)) {
    throw new Error('Invalid elevation');
  }

  const projectedLatitude = clampLatitude
    ? Math.max(-EPSG3857_MAX_LATITUDE, Math.min(EPSG3857_MAX_LATITUDE, latitude))
    : latitude;

  if (projectedLatitude < -EPSG3857_MAX_LATITUDE || projectedLatitude > EPSG3857_MAX_LATITUDE) {
    throw new Error('Latitude is outside the finite EPSG:3857 range');
  }

  const x = EPSG3857_EARTH_RADIUS * longitude * DEGREES_TO_RADIANS;
  const y =
    EPSG3857_EARTH_RADIUS *
    Math.log(Math.tan(PI / 4 + (projectedLatitude * DEGREES_TO_RADIANS) / 2));

  return lngLatZ.length >= 3 ? [x, y, z] : [x, y];
}

/**
 * Convert EPSG:3857 meters to WGS84 longitude/latitude coordinates.
 *
 * The optional third coordinate is preserved as an elevation in meters.
 */
export function EPSG3857ToLngLat(xyz: number[]): number[] {
  const [x, y, z] = xyz;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error('Invalid EPSG:3857 coordinate');
  }
  if (xyz.length >= 3 && !Number.isFinite(z)) {
    throw new Error('Invalid elevation');
  }

  const longitude = (x / EPSG3857_EARTH_RADIUS) * RADIANS_TO_DEGREES;
  const latitude = Math.atan(Math.sinh(y / EPSG3857_EARTH_RADIUS)) * RADIANS_TO_DEGREES;

  return xyz.length >= 3 ? [longitude, latitude, z] : [longitude, latitude];
}

/** Explicit EPSG:4326 to EPSG:3857 alias. */
export const EPSG4326ToEPSG3857 = lngLatToEPSG3857;

/** Explicit EPSG:3857 to EPSG:4326 alias. */
export const EPSG3857ToEPSG4326 = EPSG3857ToLngLat;
