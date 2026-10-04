// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original factored ENU/NED basis, rotations and matrix commits. No CesiumJS or PROJ source is copied.
import type {NumericArray} from '@math.gl/types';

export type LocalFramePoint = {x: number; y: number; z: number};
export type LocalFrameAxis = 'east' | 'north' | 'up' | 'west' | 'south' | 'down';
/** East has zero Z. North is up × east; northZ is its horizontal radial factor. */
export type LocalFrameBasis = {
  eastX: number;
  eastY: number;
  northZ: number;
  upX: number;
  upY: number;
  upZ: number;
};

/** Setup-time scratch, initially the ENU basis at longitude/latitude zero. */
export function createLocalFrameBasis(): LocalFrameBasis {
  return {eastX: 0, eastY: 1, northZ: 1, upX: 1, upY: 0, upZ: 0};
}

/** Angles in radians. Longitude is periodic; latitude must be within ±π/2. */
export function eastNorthUpBasis(
  longitude: number,
  latitude: number,
  result: LocalFrameBasis
): boolean {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(latitude) > Math.PI / 2)
    return false;
  const sl = Math.sin(longitude),
    cl = Math.cos(longitude);
  const sp = Math.sin(latitude),
    cp = Math.cos(latitude);
  return commitBasis(result, -sl, cl, cp, cp * cl, cp * sl, sp);
}

/**
 * Caller supplies finite unit east/up directions, east.z=0, mutually perpendicular,
 * and an up direction whose horizontal component points radially outward.
 * This form preserves supplied up components rather than inferring a geodetic footpoint.
 * Finiteness is checked; orthonormality is a caller precondition, not certified here.
 */
export function eastNorthUpBasisFromDirections(
  east: LocalFramePoint,
  up: LocalFramePoint,
  result: LocalFrameBasis
): boolean {
  const ex = east.x,
    ey = east.y,
    ez = east.z;
  const ux = up.x,
    uy = up.y,
    uz = up.z;
  if (ez !== 0) return false;
  return commitBasis(result, ex, ey, ux * ey - uy * ex, ux, uy, uz);
}

/** Rotate ENU offsets/velocities to fixed XYZ. Distances retain the input unit. */
export function localToFixed(
  point: LocalFramePoint,
  basis: LocalFrameBasis,
  result: LocalFramePoint = point
): boolean {
  const sl = -basis.eastX,
    cl = basis.eastY,
    sp = basis.upZ,
    cp = basis.northZ;
  const east = point.x,
    north = point.y,
    up = point.z;
  // Retain the factored rotation order used by deformation; no intermediate vector.
  const radial = up * cp - north * sp;
  return commitPoint(
    result,
    radial * cl - east * sl,
    radial * sl + east * cl,
    up * sp + north * cp
  );
}

/** Transpose rotation, valid for the orthonormal ENU basis precondition. */
export function fixedToLocal(
  point: LocalFramePoint,
  basis: LocalFrameBasis,
  result: LocalFramePoint = point
): boolean {
  const ex = basis.eastX,
    ey = basis.eastY,
    nz = basis.northZ;
  const ux = basis.upX,
    uy = basis.upY,
    uz = basis.upZ;
  const x = point.x,
    y = point.y,
    z = point.z;
  return commitPoint(
    result,
    x * ex + y * ey,
    -x * uz * ey + y * uz * ex + z * nz,
    x * ux + y * uy + z * uz
  );
}

/**
 * Column-major affine matrix, with explicit signed local axes and fixed-space origin.
 * Axis triples must be right handed (e.g. east/north/up or north/east/down).
 * Translation uses the origin's distance unit. The basis itself has no origin.
 * A failure leaves output unchanged; caller owns writable storage (a growable number array or a typed array of length ≥16).
 */
export function localFrameToMatrix(
  basis: LocalFrameBasis,
  origin: LocalFramePoint,
  firstAxis: LocalFrameAxis,
  secondAxis: LocalFrameAxis,
  thirdAxis: LocalFrameAxis,
  result: NumericArray
): boolean {
  const first = axisCode(firstAxis),
    second = axisCode(secondAxis),
    third = axisCode(thirdAxis);
  const a = Math.abs(first),
    b = Math.abs(second),
    c = Math.abs(third);
  if (!a || !b || !c || a === b || a === c || b === c) return false;
  const parity = (a % 3) + 1 === b ? 1 : -1;
  if (
    parity * Math.sign(first * second * third) !== 1 ||
    (!Array.isArray(result) && result.length < 16)
  )
    return false;
  const ex = basis.eastX,
    ey = basis.eastY,
    nz = basis.northZ;
  const ux = basis.upX,
    uy = basis.upY,
    uz = basis.upZ;
  const nx = -uz * ey,
    ny = uz * ex;
  const x = origin.x,
    y = origin.y,
    z = origin.z;
  const ax = (a === 1 ? ex : a === 2 ? nx : ux) * Math.sign(first);
  const ay = (a === 1 ? ey : a === 2 ? ny : uy) * Math.sign(first);
  const az = (a === 1 ? 0 : a === 2 ? nz : uz) * Math.sign(first);
  const bx = (b === 1 ? ex : b === 2 ? nx : ux) * Math.sign(second);
  const by = (b === 1 ? ey : b === 2 ? ny : uy) * Math.sign(second);
  const bz = (b === 1 ? 0 : b === 2 ? nz : uz) * Math.sign(second);
  const cx = (c === 1 ? ex : c === 2 ? nx : ux) * Math.sign(third);
  const cy = (c === 1 ? ey : c === 2 ? ny : uy) * Math.sign(third);
  const cz = (c === 1 ? 0 : c === 2 ? nz : uz) * Math.sign(third);
  if (
    !Number.isFinite(ax) ||
    !Number.isFinite(ay) ||
    !Number.isFinite(az) ||
    !Number.isFinite(bx) ||
    !Number.isFinite(by) ||
    !Number.isFinite(bz) ||
    !Number.isFinite(cx) ||
    !Number.isFinite(cy) ||
    !Number.isFinite(cz) ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(z)
  )
    return false;
  if (
    result instanceof Float32Array &&
    (!Number.isFinite(Math.fround(ax)) ||
      !Number.isFinite(Math.fround(ay)) ||
      !Number.isFinite(Math.fround(az)) ||
      !Number.isFinite(Math.fround(bx)) ||
      !Number.isFinite(Math.fround(by)) ||
      !Number.isFinite(Math.fround(bz)) ||
      !Number.isFinite(Math.fround(cx)) ||
      !Number.isFinite(Math.fround(cy)) ||
      !Number.isFinite(Math.fround(cz)) ||
      !Number.isFinite(Math.fround(x)) ||
      !Number.isFinite(Math.fround(y)) ||
      !Number.isFinite(Math.fround(z)))
  )
    return false;
  // Snapshot every component before application setters can recursively change scratch.
  result[0] = ax;
  result[1] = ay;
  result[2] = az;
  result[3] = 0;
  result[4] = bx;
  result[5] = by;
  result[6] = bz;
  result[7] = 0;
  result[8] = cx;
  result[9] = cy;
  result[10] = cz;
  result[11] = 0;
  result[12] = x;
  result[13] = y;
  result[14] = z;
  result[15] = 1;
  return true;
}
function axisCode(axis: LocalFrameAxis): number {
  switch (axis) {
    case 'east':
      return 1;
    case 'west':
      return -1;
    case 'north':
      return 2;
    case 'south':
      return -2;
    case 'up':
      return 3;
    case 'down':
      return -3;
    default:
      return 0;
  }
}
function commitBasis(
  result: LocalFrameBasis,
  ex: number,
  ey: number,
  nz: number,
  ux: number,
  uy: number,
  uz: number
): boolean {
  if (
    !Number.isFinite(ex) ||
    !Number.isFinite(ey) ||
    !Number.isFinite(nz) ||
    !Number.isFinite(ux) ||
    !Number.isFinite(uy) ||
    !Number.isFinite(uz)
  )
    return false;
  result.eastX = ex;
  result.eastY = ey;
  result.northZ = nz;
  result.upX = ux;
  result.upY = uy;
  result.upZ = uz;
  return true;
}
function commitPoint(result: LocalFramePoint, x: number, y: number, z: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return false;
  result.x = x;
  result.y = y;
  result.z = z;
  return true;
}
