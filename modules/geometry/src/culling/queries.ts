// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Low-level Euclidean query kernels shared with spatial indexes. */
export type QueryPoint = Readonly<ArrayLike<number>>;
export type TriangleRayHit = {t: number; barycentric: [number, number, number]};

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

function dot(a: QueryPoint, b: QueryPoint): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: QueryPoint, b: QueryPoint): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
