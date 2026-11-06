// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {NumericArray} from '@math.gl/core';
import {validateQueryPoint, normalizeQueryDirection, type QueryPoint} from './queries';

type V = [number, number, number];
const sub = (a: QueryPoint, b: QueryPoint): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: QueryPoint, b: QueryPoint) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: QueryPoint, b: QueryPoint): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const check = (...points: QueryPoint[]) => {
  for (const p of points) validateQueryPoint(p, 3);
};
function output<T extends NumericArray>(out: T, values: QueryPoint): T {
  if (out.length < values.length) throw new RangeError('Result buffer is too short');
  const copy = Array.from(values);
  for (let i = 0; i < copy.length; i++) out[i] = copy[i];
  return out;
}
function direction(d: QueryPoint): void {
  check(d);
  if (Math.hypot(d[0], d[1], d[2]) === 0) throw new RangeError('Ray direction must be nonzero');
}
export function getRayPoint(
  origin: QueryPoint,
  dir: QueryPoint,
  t: number,
  out: NumericArray = [0, 0, 0]
): NumericArray {
  check(origin);
  direction(dir);
  if (!Number.isFinite(t) || t < 0)
    throw new RangeError('Ray parameter must be finite and nonnegative');
  return output(out, [origin[0] + t * dir[0], origin[1] + t * dir[1], origin[2] + t * dir[2]]);
}
export function getClosestPointOnRay(
  point: QueryPoint,
  origin: QueryPoint,
  dir: QueryPoint,
  out: NumericArray = [0, 0, 0]
): NumericArray {
  check(point, origin);
  direction(dir);
  const unit = normalizeQueryDirection(dir, 3);
  const distance = Math.max(0, dot(sub(point, origin), unit));
  return output(
    out,
    [0, 1, 2].map(i => origin[i] + distance * unit[i])
  );
}
export function distanceToRay(point: QueryPoint, origin: QueryPoint, dir: QueryPoint): number {
  const p = getClosestPointOnRay(point, origin, dir);
  return Math.hypot(...sub(point, p));
}
export type RaySegmentClosestPoints = {
  rayPoint: V;
  segmentPoint: V;
  rayParameter: number;
  segmentFraction: number;
  distance: number;
};
export function getClosestPointsRaySegment(
  origin: QueryPoint,
  dir: QueryPoint,
  a: QueryPoint,
  b: QueryPoint
): RaySegmentClosestPoints {
  check(origin, a, b);
  direction(dir);
  const unit = normalizeQueryDirection(dir, 3);
  const directionLength = Math.hypot(dir[0], dir[1], dir[2]);
  const edge = sub(b, a),
    offset = sub(origin, a);
  const segmentLength = Math.hypot(...edge);
  const segmentUnit = edge.map(x => (segmentLength ? x / segmentLength : 0));
  const bb = dot(unit, segmentUnit),
    dd = dot(unit, offset),
    ee = dot(segmentUnit, offset);
  const candidates: [number, number][] = [
    [0, Math.max(0, Math.min(segmentLength, ee))],
    [Math.max(0, -dd), 0],
    [Math.max(0, bb * segmentLength - dd), segmentLength]
  ];
  // Cross products retain the angle when nearly parallel dot products round to one.
  const normal = cross(unit, segmentUnit);
  const sine = Math.hypot(...normal);
  if (segmentLength > 0 && sine > 0) {
    const normalUnit = normal.map(value => value / sine);
    const separation = sub(a, origin);
    const t = dot(cross(separation, segmentUnit), normalUnit) / sine;
    const u = dot(cross(separation, unit), normalUnit) / sine;
    if (t >= 0 && u >= 0 && u <= segmentLength) candidates.push([t, u]);
  }
  let best: RaySegmentClosestPoints | undefined;
  for (const [t, u] of candidates) {
    const rayPoint = [
      origin[0] + t * unit[0],
      origin[1] + t * unit[1],
      origin[2] + t * unit[2]
    ] as V;
    const segmentPoint = [
      a[0] + u * segmentUnit[0],
      a[1] + u * segmentUnit[1],
      a[2] + u * segmentUnit[2]
    ] as V;
    const distance = Math.hypot(...sub(rayPoint, segmentPoint));
    if (!best || distance < best.distance)
      best = {
        rayPoint,
        segmentPoint,
        rayParameter: t / directionLength,
        segmentFraction: segmentLength ? u / segmentLength : 0,
        distance
      };
  }
  return best!;
}
/** Finite affine transforms only. The unnormalized output direction preserves the ray parameter. */
export function transformRay(
  origin: QueryPoint,
  dir: QueryPoint,
  matrix: QueryPoint
): {origin: V; direction: V} {
  check(origin);
  direction(dir);
  if (
    matrix.length !== 16 ||
    Array.from(matrix).some(x => !Number.isFinite(x)) ||
    matrix[3] !== 0 ||
    matrix[7] !== 0 ||
    matrix[11] !== 0 ||
    matrix[15] !== 1
  )
    throw new RangeError('Expected a finite affine matrix');
  const apply = (p: QueryPoint, w: number): V =>
    [0, 1, 2].map(
      i => matrix[i] * p[0] + matrix[i + 4] * p[1] + matrix[i + 8] * p[2] + w * matrix[i + 12]
    ) as V;
  const transformed = {origin: apply(origin, 1), direction: apply(dir, 0)};
  check(transformed.origin);
  direction(transformed.direction);
  return transformed;
}
function triangle(a: QueryPoint, b: QueryPoint, c: QueryPoint) {
  check(a, b, c);
  const ab = sub(b, a),
    ac = sub(c, a);
  const scale = Math.max(Math.hypot(...ab), Math.hypot(...ac));
  const u = ab.map(x => (scale ? x / scale : 0)) as V,
    v = ac.map(x => (scale ? x / scale : 0)) as V;
  return {u, v, scale, normal: cross(u, v)};
}
/** Barycentrics of the point's orthogonal projection; null for a degenerate triangle. */
export function getTriangleBarycentric(
  point: QueryPoint,
  a: QueryPoint,
  b: QueryPoint,
  c: QueryPoint,
  out: NumericArray = [0, 0, 0]
): NumericArray | null {
  check(point);
  const {u, v, scale, normal} = triangle(a, b, c),
    denominator = dot(normal, normal);
  if (denominator === 0) return null;
  const p = sub(point, a).map(x => x / scale);
  const second = dot(cross(p, v), normal) / denominator;
  const third = dot(cross(u, p), normal) / denominator;
  return output(out, [1 - second - third, second, third]);
}
export function getTriangleArea(a: QueryPoint, b: QueryPoint, c: QueryPoint): number {
  const {normal, scale} = triangle(a, b, c);
  return (Math.hypot(...normal) * scale * scale) / 2;
}
export function getTriangleNormal(
  a: QueryPoint,
  b: QueryPoint,
  c: QueryPoint,
  out: NumericArray = [0, 0, 0]
): NumericArray {
  const {normal} = triangle(a, b, c),
    length = Math.hypot(...normal);
  return output(
    out,
    normal.map(x => (length ? x / length : 0))
  );
}
/** Front-facing means the oriented normal points against the viewing/ray direction. */
export function isTriangleFrontFacing(
  a: QueryPoint,
  b: QueryPoint,
  c: QueryPoint,
  dir: QueryPoint
): boolean {
  direction(dir);
  return dot(triangle(a, b, c).normal, dir) < 0;
}
/** Relative tolerance: plane distance is scaled by the longest edge from a. */
export function triangleContainsPoint(
  point: QueryPoint,
  a: QueryPoint,
  b: QueryPoint,
  c: QueryPoint,
  tolerance = 1e-10
): boolean {
  if (!Number.isFinite(tolerance) || tolerance < 0) throw new RangeError('Invalid tolerance');
  const weights = getTriangleBarycentric(point, a, b, c);
  if (!weights) return false;
  const {normal, scale} = triangle(a, b, c);
  const distance =
    Math.abs(
      dot(
        sub(point, a).map(x => x / scale),
        normal
      )
    ) / Math.hypot(...normal);
  return (
    distance <= tolerance && Array.from(weights).every(x => x >= -tolerance && x <= 1 + tolerance)
  );
}
export function interpolateTriangleAttribute(
  weights: QueryPoint,
  a: QueryPoint,
  b: QueryPoint,
  c: QueryPoint,
  out: NumericArray = new Array(a.length)
): NumericArray {
  check(weights);
  if (
    !a.length ||
    a.length !== b.length ||
    a.length !== c.length ||
    [a, b, c].some(p => Array.from(p).some(x => !Number.isFinite(x)))
  )
    throw new RangeError('Expected matching finite attributes');
  return output(
    out,
    Array.from(a, (x, i) => weights[0] * x + weights[1] * b[i] + weights[2] * c[i])
  );
}
/** Closed segment; a coplanar segment returns its start, a disjoint segment returns null. */
export function intersectPlaneSegment(
  normal: QueryPoint,
  constant: number,
  start: QueryPoint,
  end: QueryPoint,
  out: NumericArray = [0, 0, 0]
): NumericArray | null {
  check(start, end);
  direction(normal);
  if (!Number.isFinite(constant)) throw new RangeError('Plane constant must be finite');
  const a = dot(normal, start) + constant,
    b = dot(normal, end) + constant;
  if (a === 0) return output(out, start);
  if (b === 0) return output(out, end);
  if (a > 0 === b > 0) return null;
  const t = a / (a - b);
  return output(
    out,
    [0, 1, 2].map(i => start[i] + t * (end[i] - start[i]))
  );
}
/** Separating-axis test for a closed AABB. Degenerate triangles reduce to segments/points. */
export function triangleIntersectsBounds(
  a: QueryPoint,
  b: QueryPoint,
  c: QueryPoint,
  minimum: QueryPoint,
  maximum: QueryPoint
): boolean {
  check(a, b, c, minimum, maximum);
  if ([0, 1, 2].some(i => minimum[i] > maximum[i])) return false;
  const center = [0, 1, 2].map(i => minimum[i] / 2 + maximum[i] / 2);
  const extent = [0, 1, 2].map(i => maximum[i] / 2 - minimum[i] / 2);
  const vertices = [a, b, c].map(p => sub(p, center));
  const edges = [sub(b, a), sub(c, b), sub(a, c)];
  const basis: V[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];
  const axes = [
    ...basis,
    cross(edges[0], edges[1]),
    ...edges.flatMap(e => basis.map(axis => cross(e, axis)))
  ];
  for (const axis of axes) {
    const length = Math.hypot(...axis);
    if (!length) continue;
    const unit = axis.map(x => x / length);
    const projections = vertices.map(v => dot(v, unit));
    const radius = extent.reduce((sum, x, i) => sum + x * Math.abs(unit[i]), 0);
    if (Math.min(...projections) > radius || Math.max(...projections) < -radius) return false;
  }
  return true;
}
