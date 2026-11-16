// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** A spherical gnomonic chart with terrain height retained as the third ordinate. */
export type GeographicTerrainCutoutFrame = {
  /** Central longitude/latitude in degrees. Longitude is normalized to [-180,180). */
  center: readonly [number, number];
  /** Sphere radius in meters; default WGS84 semi-major axis (6378137). */
  radius: number;
  /** Maximum angular distance from the center in degrees; must be below 90. */
  maxAngularRadius: number;
};
/** Explicit chart choice for regional terrain cutting. */
export type GeographicTerrainCutoutFrameOptions = {
  /** Center longitude/latitude in degrees; polar centers are supported. */
  center: readonly [number, number];
  /** Spherical radius in meters. This is not an ellipsoidal distance certificate. */
  radius?: number;
  /** Angular cap in degrees, default 30; positive and at most 80. */
  maxAngularRadius?: number;
};
/** Degrees to radians. */
const RAD = Math.PI / 180;

/** Create a bounded chart that has no antimeridian cut and supports either pole.
 * Great-circle segments project to straight lines. Mesh connectivity must
 * already describe the intended local surface (polar fans rather than duplicate
 * pole rows). Heights retain their input datum; Z is not ECEF or tangent-plane up.
 */
export function createGeographicTerrainCutoutFrame(
  options: GeographicTerrainCutoutFrameOptions
): GeographicTerrainCutoutFrame {
  if (options.center.length !== 2) throw new RangeError('Invalid geographic terrain cutout center');
  const frame = {
    center: [wrap(options.center[0]), options.center[1]] as const,
    radius: options.radius ?? 6378137,
    maxAngularRadius: options.maxAngularRadius ?? 30
  };
  validateFrame(frame);
  return Object.freeze({...frame, center: Object.freeze(frame.center)});
}

/** Project packed longitude/latitude/height to chart X/Y/height in Float64.
 * Longitude aliases are normalized relative to the chart center. Vertices at
 * the same pole project identically regardless of longitude. No connectivity,
 * height filling, edge densification or geographic winding repair is performed.
 * Triangle edges and cut edges mean straight segments in this chart (minor
 * great-circle arcs horizontally); interpolate terrain height in chart space.
 */
export function projectGeographicTerrainCutout(
  positions: Float32Array | Float64Array,
  frame: GeographicTerrainCutoutFrame
): Float64Array {
  validateFrame(frame);
  validatePositions(positions);
  const result = new Float64Array(positions.length);
  const [sin0, cos0] = latitude(frame.center[1]);
  const minimum = Math.cos(frame.maxAngularRadius * RAD);
  for (let i = 0; i < positions.length; i += 3) {
    const lon = positions[i],
      lat = positions[i + 1];
    if (lat < -90 || lat > 90) throw new RangeError('Invalid geographic terrain latitude');
    const sin = Math.sin(lat * RAD);
    const cos = Math.abs(lat) === 90 ? 0 : Math.cos(lat * RAD);
    const delta = wrap(wrap(lon) - frame.center[0]) * RAD;
    const dot = sin0 * sin + cos0 * cos * Math.cos(delta);
    if (dot < minimum) throw new RangeError('Terrain coordinate exceeds geographic cutout chart');
    result[i] = (frame.radius * cos * Math.sin(delta)) / dot;
    result[i + 1] = (frame.radius * (cos0 * sin - sin0 * cos * Math.cos(delta))) / dot;
    result[i] ||= 0;
    result[i + 1] ||= 0;
    result[i + 2] = positions[i + 2];
  }
  if (!result.every(Number.isFinite))
    throw new RangeError('Geographic terrain projection overflow');
  return result;
}

/** Invert chart X/Y/height to canonical longitude/latitude/height.
 * Points outside the declared cap are rejected. At the exact pole, longitude
 * is the chart center's longitude. Height and vertical datum are unchanged.
 */
export function unprojectGeographicTerrainCutout(
  positions: Float32Array | Float64Array,
  frame: GeographicTerrainCutoutFrame
): Float64Array {
  validateFrame(frame);
  validatePositions(positions);
  const result = new Float64Array(positions.length);
  const [sin0, cos0] = latitude(frame.center[1]);
  const maximum = Math.tan(frame.maxAngularRadius * RAD);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] / frame.radius,
      y = positions[i + 1] / frame.radius;
    const distance = Math.hypot(x, y);
    if (!Number.isFinite(distance) || distance > maximum * (1 + 8 * Number.EPSILON))
      throw new RangeError('Terrain coordinate exceeds geographic cutout chart');
    const horizontal = cos0 - y * sin0;
    const vertical = sin0 + y * cos0;
    const lat = Math.atan2(vertical, Math.hypot(horizontal, x)) / RAD;
    result[i] =
      Math.abs(lat) === 90
        ? frame.center[0]
        : wrap(frame.center[0] + Math.atan2(x, horizontal) / RAD);
    result[i + 1] = lat;
    result[i + 2] = positions[i + 2];
  }
  return result;
}

/** Normalize aliases before subtraction to avoid overflow and inconsistent seams. */
function wrap(longitude: number) {
  const result = longitude % 360;
  return result >= 180 ? result - 360 : result < -180 ? result + 360 : result;
}
/** Exact pole cosines prevent longitude-dependent roundoff at the poles. */
function latitude(degrees: number): readonly [number, number] {
  return [Math.sin(degrees * RAD), Math.abs(degrees) === 90 ? 0 : Math.cos(degrees * RAD)];
}
/** Validate frames even when callers supply a structural object. */
function validateFrame(frame: GeographicTerrainCutoutFrame) {
  if (
    frame.center.length !== 2 ||
    !frame.center.every(Number.isFinite) ||
    frame.center[0] < -180 ||
    frame.center[0] >= 180 ||
    Math.abs(frame.center[1]) > 90 ||
    !Number.isFinite(frame.radius) ||
    frame.radius <= 0 ||
    !Number.isFinite(frame.maxAngularRadius) ||
    frame.maxAngularRadius <= 0 ||
    frame.maxAngularRadius > 80
  )
    throw new RangeError('Invalid geographic terrain cutout frame');
}
/** Reject malformed or nonfinite packed XYZ before allocating output. */
function validatePositions(positions: Float32Array | Float64Array) {
  if (
    !(positions instanceof Float32Array || positions instanceof Float64Array) ||
    positions.length % 3 ||
    !positions.every(Number.isFinite)
  )
    throw new RangeError('Invalid geographic terrain cutout positions');
}
