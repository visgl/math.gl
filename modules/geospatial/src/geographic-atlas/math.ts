// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original surface-normal circle and chart mathematics; no upstream clipping code copied.
import {GeographicSeamError} from '../geographic-seams/types';
export type V = [number, number, number];
export const TAU = 2 * Math.PI;
export const ANGULAR = 1e-12;
export const ROUND = 64 * Number.EPSILON;
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V, b: V): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
export const scale = (a: V, s: number): V => a.map(x => x * s) as V;
export const add = (a: V, b: V): V => a.map((x, i) => x + b[i]) as V;
export function unit(a: readonly number[]): V {
  if (a.length !== 3 || !a.every(Number.isFinite))
    throw new GeographicSeamError('input', 'Expected a finite three-component direction');
  const m = Math.max(...a.map(Math.abs));
  if (!m) throw new GeographicSeamError('input', 'Zero direction');
  const v = a.map(x => x / m) as V;
  return scale(v, 1 / Math.hypot(...v));
}
export function sincos(degrees: number): [number, number] {
  const q = Math.round(degrees / 90),
    r = ((degrees - 90 * q) * Math.PI) / 180,
    s = Math.sin(r),
    c = Math.cos(r);
  switch (((q % 4) + 4) % 4) {
    case 0:
      return [s, c];
    case 1:
      return [c, -s];
    case 2:
      return [-s, -c];
    default:
      return [-c, s];
  }
}
export function normal(p: readonly number[]): V {
  const [sp, cp] = sincos(p[1]),
    [sl, cl] = sincos((((p[0] % 360) + 540) % 360) - 180);
  return [cp * cl, cp * sl, sp];
}
export function position(n: V, attributes: readonly number[] = []): number[] {
  return [
    (Math.atan2(n[1], n[0]) * 180) / Math.PI,
    (Math.atan2(n[2], Math.hypot(n[0], n[1])) * 180) / Math.PI,
    ...attributes
  ];
}
export function basis(n: V): [V, V] {
  const axis: V = Math.abs(n[2]) < 0.8 ? [0, 0, 1] : [0, 1, 0];
  const u = unit(cross(axis, n));
  return [u, cross(n, u)];
}
export type Circle = {id: string; normal: V; offset: number; radius: number; u: V; v: V};
export function circle(id: string, n: V, c: number): Circle {
  const [u, v] = basis(n);
  return {id, normal: n, offset: c, radius: Math.sqrt((1 - c) * (1 + c)), u, v};
}
export function onCircle(c: Circle, t: number): V {
  const [s, k] = sincos((t * 180) / Math.PI);
  return add(scale(c.normal, c.offset), scale(add(scale(c.u, k), scale(c.v, s)), c.radius));
}
export const angle = (c: Circle, n: V) => (Math.atan2(dot(c.v, n), dot(c.u, n)) + TAU) % TAU;
export function project(c: Circle, n: V): V {
  const tangent = add(n, scale(c.normal, -dot(c.normal, n)));
  return add(scale(c.normal, c.offset), scale(unit(tangent), c.radius));
}
/** Chord identities avoid dot(n,center)-offset cancellation for small caps. */
export function value(c: Circle, n: V): number {
  if (c.offset > 0.5)
    return 1 - c.offset - 0.5 * n.reduce((sum, x, i) => sum + (x - c.normal[i]) ** 2, 0);
  if (c.offset < -0.5)
    return -1 - c.offset + 0.5 * n.reduce((sum, x, i) => sum + (x + c.normal[i]) ** 2, 0);
  return dot(c.normal, n) - c.offset;
}
export function valueError(c: Circle, n: V): number {
  if (Math.abs(c.offset) > 0.5) {
    const sign = c.offset > 0 ? 1 : -1;
    return (
      ROUND * (1 - Math.abs(c.offset) + Math.hypot(...n.map((x, i) => x - sign * c.normal[i])))
    );
  }
  return ROUND * (Math.abs(c.offset) + n.reduce((sum, x, i) => sum + Math.abs(x * c.normal[i]), 0));
}
export function slope(c: Circle, n: V, tangent: V): number {
  if (c.offset > 0.5) return -n.reduce((sum, x, i) => sum + (x - c.normal[i]) * tangent[i], 0);
  if (c.offset < -0.5) return n.reduce((sum, x, i) => sum + (x + c.normal[i]) * tangent[i], 0);
  return dot(c.normal, tangent);
}
export function intersections(a: Circle, b: Circle): V[] {
  const d = dot(a.normal, b.normal),
    w = cross(a.normal, b.normal),
    w2 = dot(w, w);
  if (w2 === 0) return [];
  if (w2 < ROUND * ROUND)
    throw new GeographicSeamError('precision', 'Unresolved nearly parallel cut circles');
  const x = add(
    scale(a.normal, (a.offset - d * b.offset) / w2),
    scale(b.normal, (b.offset - d * a.offset) / w2)
  );
  const h2 = 1 - dot(x, x);
  if (h2 < -ROUND) return [];
  if (Math.abs(h2) <= ROUND)
    throw new GeographicSeamError('precision', 'Tangent or unresolved cut-circle junction');
  const z = scale(w, Math.sqrt(h2 / w2));
  return [unit(add(x, z)), unit(add(x, scale(z, -1)))];
}
export type ChartFrame = {center: V; u: V; v: V};
export function chartPoint(f: ChartFrame, n: V): [number, number] {
  const d = 1 + dot(f.center, n);
  if (d < 0.5) throw new GeographicSeamError('precision', 'Point outside the chart hemisphere');
  return [dot(f.u, n) / d, dot(f.v, n) / d];
}
export function chartNormal(f: ChartFrame, x: number, y: number): V {
  const r = x * x + y * y;
  return add(
    scale(f.center, (1 - r) / (1 + r)),
    scale(add(scale(f.u, x), scale(f.v, y)), 2 / (1 + r))
  );
}
