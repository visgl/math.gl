// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type Position = [number, number];
export type Vector = [number, number, number];
export const RAD = Math.PI / 180;
export const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vector, b: Vector): Vector => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
export const add = (a: Vector, b: Vector): Vector => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: Vector, t: number): Vector => [a[0] * t, a[1] * t, a[2] * t];
export function unit(a: Vector): Vector {
  const length = Math.hypot(...a);
  if (!(length > 1e-14)) throw new Error('Degenerate spherical direction');
  return scale(a, 1 / length);
}
export function geographic(p: readonly number[]): Vector {
  if (p.length !== 2 || !p.every(Number.isFinite) || Math.abs(p[1]) > 90)
    throw new Error('Expected finite [longitude, latitude] in degrees, latitude within [-90, 90]');
  const lon = (((((p[0] + 180) % 360) + 360) % 360) - 180) * RAD,
    lat = p[1] * RAD;
  return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
}
export function coordinates(p: Vector): Position {
  return [Math.atan2(p[1], p[0]) / RAD, Math.atan2(p[2], Math.hypot(p[0], p[1])) / RAD];
}
export function angle(a: Vector, b: Vector): number {
  return Math.atan2(Math.hypot(...cross(a, b)), dot(a, b));
}
export function validateArc(a: Vector, b: Vector) {
  if (Math.PI - angle(a, b) < 1e-9)
    throw new Error('Antipodal edges are ambiguous; insert an intermediate vertex');
}
export function basis(center: Vector): [Vector, Vector] {
  const x = unit(cross(Math.abs(center[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0], center));
  return [x, cross(center, x)];
}
export function area(ring: Position[]): number {
  return (
    ring.reduce((sum, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return sum + p[0] * q[1] - p[1] * q[0];
    }, 0) / 2
  );
}
