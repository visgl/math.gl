// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Low-level Euclidean query kernels shared with spatial indexes. */
export type QueryPoint = Readonly<ArrayLike<number>>;
export type TriangleRayHit = {t: number; barycentric: [number, number, number]};
export type SegmentClosestPoints = {
  distance: number;
  pointA: [number, number, number];
  pointB: [number, number, number];
  fractionA: number;
  fractionB: number;
};
export type SegmentTriangleClosestPoints = {
  distance: number;
  segmentPoint: [number, number, number];
  trianglePoint: [number, number, number];
  /** Parameter on the input segment, not a time of impact. */
  segmentFraction: number;
};

export function validateQueryPoint(point: QueryPoint, dimension: number): void {
  if (point.length !== dimension) throw new RangeError('Query dimension must match the index');
  for (let i = 0; i < dimension; i++) {
    if (!Number.isFinite(point[i])) throw new RangeError('Coordinates must be finite');
  }
}

export function validateQueryDistance(distance: number): void {
  if (Number.isNaN(distance) || distance < 0) throw new RangeError('Distance must be nonnegative');
}

/** Returns a unit direction; ray distances in indexes are always coordinate units. */
export function normalizeQueryDirection(direction: QueryPoint, dimension: number): number[] {
  validateQueryPoint(direction, dimension);
  const scale = Math.max(...Array.from(direction, Math.abs));
  if (scale === 0) throw new RangeError('Ray direction must be nonzero');
  const scaled = Array.from(direction, x => x / scale);
  const length = Math.hypot(...scaled);
  return scaled.map(x => x / length);
}

/** Closed bounds; returns zero for an origin inside. t uses the supplied direction scale. */
export function intersectRayBounds(
  origin: QueryPoint,
  direction: QueryPoint,
  minimum: QueryPoint,
  maximum: QueryPoint,
  maxT = Infinity
): number | null {
  const dimension = origin.length;
  if (dimension !== 2 && dimension !== 3) throw new RangeError('Bounds must be 2D or 3D');
  validateQueryPoint(origin, dimension);
  validateQueryPoint(direction, dimension);
  validateQueryPoint(minimum, dimension);
  validateQueryPoint(maximum, dimension);
  validateQueryDistance(maxT);
  let near = 0,
    far = maxT,
    nonzero = false;
  for (let i = 0; i < dimension; i++) {
    if (minimum[i] > maximum[i]) throw new RangeError('Bounds must be ordered');
    nonzero ||= direction[i] !== 0;
  }
  if (!nonzero) throw new RangeError('Ray direction must be nonzero');
  for (let i = 0; i < dimension; i++) {
    if (direction[i] === 0) {
      if (origin[i] < minimum[i] || origin[i] > maximum[i]) return null;
      continue;
    }
    let a = (minimum[i] - origin[i]) / direction[i];
    let b = (maximum[i] - origin[i]) / direction[i];
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (near > far) return null;
  }
  return Number.isFinite(near) ? near : null;
}

/** Two-sided Möller–Trumbore test; degenerates and coplanar rays have no hit. */
export function intersectRayTriangle(
  origin: QueryPoint,
  direction: QueryPoint,
  a: QueryPoint,
  b: QueryPoint,
  c: QueryPoint,
  options: {backfaceCulling?: boolean; maxT?: number} = {}
): TriangleRayHit | null {
  for (const point of [origin, direction, a, b, c]) validateQueryPoint(point, 3);
  if (direction[0] === 0 && direction[1] === 0 && direction[2] === 0) {
    throw new RangeError('Ray direction must be nonzero');
  }
  const maxT = options.maxT ?? Infinity;
  validateQueryDistance(maxT);
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const p = cross(direction, e2);
  const determinant = dot(e1, p);
  if (determinant === 0 || (options.backfaceCulling && determinant < 0)) return null;
  const offset = [origin[0] - a[0], origin[1] - a[1], origin[2] - a[2]];
  const u = dot(offset, p) / determinant;
  if (u < 0 || u > 1) return null;
  const q = cross(offset, e1);
  const v = dot(direction, q) / determinant;
  if (v < 0 || u + v > 1) return null;
  const t = dot(e2, q) / determinant;
  if (!Number.isFinite(t) || t < 0 || t > maxT) return null;
  return {t: Math.max(0, t), barycentric: [1 - u - v, u, v]};
}

/** Closest point on a filled triangle; degenerate triangles reduce to segments/points. */
export function getClosestPointOnTriangle(
  point: QueryPoint,
  a: QueryPoint,
  b: QueryPoint,
  c: QueryPoint
): [number, number, number] {
  for (const value of [point, a, b, c]) validateQueryPoint(value, 3);
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const ap = [point[0] - a[0], point[1] - a[1], point[2] - a[2]];
  const aa = dot(ab, ab),
    bb = dot(ac, ac),
    cc = dot(ab, ac);
  const denominator = aa * bb - cc * cc;
  if (denominator > 0 && Number.isFinite(denominator)) {
    const u = (bb * dot(ap, ab) - cc * dot(ap, ac)) / denominator;
    const v = (aa * dot(ap, ac) - cc * dot(ap, ab)) / denominator;
    if (u >= 0 && v >= 0 && u + v <= 1) {
      return [
        a[0] + u * ab[0] + v * ac[0],
        a[1] + u * ab[1] + v * ac[1],
        a[2] + u * ab[2] + v * ac[2]
      ];
    }
  }
  let best: [number, number, number] = [a[0], a[1], a[2]];
  let distance = Infinity;
  for (const [start, end] of [
    [a, b],
    [b, c],
    [c, a]
  ]) {
    const edge = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
    const offset = [point[0] - start[0], point[1] - start[1], point[2] - start[2]];
    const squared = dot(edge, edge);
    const t = squared > 0 ? Math.max(0, Math.min(1, dot(offset, edge) / squared)) : 0;
    const candidate: [number, number, number] = [
      start[0] + t * edge[0],
      start[1] + t * edge[1],
      start[2] + t * edge[2]
    ];
    const d = Math.hypot(point[0] - candidate[0], point[1] - candidate[1], point[2] - candidate[2]);
    if (d < distance) {
      distance = d;
      best = candidate;
    }
  }
  return best;
}

/** Closest pair on two closed segments; zero-length segments are points.
 * Enumerates endpoint projections and the interior line-line stationary point.
 * Equal computed distances prefer the lowest first-segment parameter, then the second.
 */
export function getClosestPointsOnSegments(
  a0: QueryPoint,
  a1: QueryPoint,
  b0: QueryPoint,
  b1: QueryPoint
): SegmentClosestPoints {
  const frame = queryFrame([a0, a1, b0, b1]);
  const pair = closestSegments(...(frame.points as [number[], number[], number[], number[]]));
  const pointA = interpolatePoint(a0, a1, pair.fractionA);
  const pointB = interpolatePoint(b0, b1, pair.fractionB);
  return {
    distance: finiteDistance(pointA, pointB),
    pointA,
    pointB,
    fractionA: pair.fractionA,
    fractionB: pair.fractionB
  };
}

/** Closest pair on a closed segment and a filled triangle, including coplanar and degenerate cases.
 * Face crossings, endpoint-face minima and all three segment-edge minima are considered.
 * Equal computed distances prefer the lowest segment parameter; other ties use feature order.
 */
export function getClosestPointsSegmentTriangle(
  start: QueryPoint,
  end: QueryPoint,
  a: QueryPoint,
  b: QueryPoint,
  c: QueryPoint
): SegmentTriangleClosestPoints {
  const frame = queryFrame([start, end, a, b, c]);
  const [s, e, va, vb, vc] = frame.points;
  const direction = subtract(e, s);
  if (direction.some(value => value !== 0)) {
    const hit = intersectRayTriangle(s, direction, va, vb, vc, {maxT: 1});
    if (hit) {
      const point = interpolatePoint(start, end, hit.t);
      return {distance: 0, segmentPoint: point, trianglePoint: [...point], segmentFraction: hit.t};
    }
  }
  let best = {distance: Infinity, segmentFraction: 0, trianglePoint: va};
  const consider = (point: QueryPoint, trianglePoint: number[], segmentFraction: number): void => {
    const distance = Math.hypot(...subtract(point, trianglePoint));
    if (
      distance < best.distance ||
      (distance === best.distance && segmentFraction < best.segmentFraction)
    )
      best = {distance, segmentFraction, trianglePoint};
  };
  consider(s, getClosestPointOnTriangle(s, va, vb, vc), 0);
  consider(e, getClosestPointOnTriangle(e, va, vb, vc), 1);
  for (const [v0, v1] of [
    [va, vb],
    [vb, vc],
    [vc, va]
  ]) {
    const pair = closestSegments(s, e, v0, v1);
    consider(
      interpolatePoint(s, e, pair.fractionA),
      interpolatePoint(v0, v1, pair.fractionB),
      pair.fractionA
    );
  }
  // Restore and keep rounded coordinates inside the triangle's closed bounds.
  const trianglePoint = best.trianglePoint.map((value, axis) =>
    Math.max(
      Math.min(a[axis], b[axis], c[axis]),
      Math.min(Math.max(a[axis], b[axis], c[axis]), start[axis] + value * frame.scale)
    )
  ) as [number, number, number];
  if (!trianglePoint.every(Number.isFinite)) throw new RangeError('Closest-point result overflow');
  const segmentPoint = interpolatePoint(start, end, best.segmentFraction);
  return {
    distance: finiteDistance(segmentPoint, trianglePoint),
    segmentPoint,
    trianglePoint,
    segmentFraction: best.segmentFraction
  };
}

/** Translate and uniformly scale before dot/cross products to avoid absolute-scale overflow. */
function queryFrame(input: QueryPoint[]): {points: number[][]; scale: number} {
  input.forEach(point => validateQueryPoint(point, 3));
  const offsets = input.map(point => subtract(point, input[0]));
  let scale = 0;
  for (const offset of offsets)
    for (const value of offset) {
      if (!Number.isFinite(value)) throw new RangeError('Closest-point coordinate span overflow');
      scale = Math.max(scale, Math.abs(value));
    }
  scale ||= 1;
  return {points: offsets.map(point => point.map(value => value / scale)), scale};
}

function closestSegments(
  a0: QueryPoint,
  a1: QueryPoint,
  b0: QueryPoint,
  b1: QueryPoint
): {distance: number; fractionA: number; fractionB: number} {
  const da = subtract(a1, a0),
    db = subtract(b1, b0);
  const lengthA = Math.hypot(...da),
    lengthB = Math.hypot(...db);
  const ua = da.map(value => (lengthA ? value / lengthA : 0));
  const ub = db.map(value => (lengthB ? value / lengthB : 0));
  let best = {distance: Infinity, fractionA: 0, fractionB: 0};
  const consider = (fractionA: number, fractionB: number): void => {
    const distance = Math.hypot(
      ...subtract(interpolatePoint(a0, a1, fractionA), interpolatePoint(b0, b1, fractionB))
    );
    if (
      distance < best.distance ||
      (distance === best.distance &&
        (fractionA < best.fractionA ||
          (fractionA === best.fractionA && fractionB < best.fractionB)))
    )
      best = {distance, fractionA, fractionB};
  };
  for (const t of [0, 1]) {
    consider(t, lengthB ? clampUnit(dot(subtract(t ? a1 : a0, b0), ub) / lengthB) : 0);
    consider(lengthA ? clampUnit(dot(subtract(t ? b1 : b0, a0), ua) / lengthA) : 0, t);
  }
  const normal = cross(ua, ub);
  const sine = Math.hypot(...normal);
  if (sine > 0) {
    const unit = normal.map(value => value / sine);
    const offset = subtract(b0, a0);
    const fractionA = dot(cross(offset, ub), unit) / sine / lengthA;
    const fractionB = dot(cross(offset, ua), unit) / sine / lengthB;
    if (fractionA >= 0 && fractionA <= 1 && fractionB >= 0 && fractionB <= 1)
      consider(fractionA, fractionB);
  }
  return best;
}

function subtract(a: QueryPoint, b: QueryPoint): number[] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function interpolatePoint(a: QueryPoint, b: QueryPoint, t: number): [number, number, number] {
  return [0, 1, 2].map(axis =>
    Math.max(
      Math.min(a[axis], b[axis]),
      Math.min(Math.max(a[axis], b[axis]), (1 - t) * a[axis] + t * b[axis])
    )
  ) as [number, number, number];
}

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function finiteDistance(a: QueryPoint, b: QueryPoint): number {
  const distance = Math.hypot(...subtract(a, b));
  if (!Number.isFinite(distance)) throw new RangeError('Closest-point distance overflow');
  return distance;
}

function dot(a: QueryPoint, b: QueryPoint): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: QueryPoint, b: QueryPoint): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
