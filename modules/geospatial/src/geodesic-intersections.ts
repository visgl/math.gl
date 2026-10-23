// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2023)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Spherical correction adapted from GeographicLib 2.7 Intersect.cpp (MIT, Karney 2024 geodesic-intersection paper). Original bounded search/reporting, analytic sphere enumeration and segment contracts. See ../GEOGRAPHICLIB-LICENSE.txt.
import {EllipsoidGeodesic, type GeodesicParameters, type GeodesicLine} from './ellipsoid-geodesic';
import {geodesic} from './vendor/geographiclib-geodesic/runtime';
export type GeodesicPath = {latitude: number; longitude: number; azimuth: number};
export type IntersectionPoint = {
  s: number;
  t: number;
  latitude: number;
  longitude: number;
  residual: number;
  crossingAngle: number;
  iterations: number;
};
export type IntersectionSearchOptions = {maxDistance: number; origin?: readonly [number, number]};
export type IntersectionSearch = {
  intersections: IntersectionPoint[];
  coincidences: {s: number; t: number; direction: 1 | -1}[];
  complete: boolean;
  attemptedSeeds: number;
  failedSeeds: number;
};
export type ClosestIntersection = IntersectionSearch & {intersection?: IntersectionPoint};
export type SegmentIntersection =
  | {status: 'intersection'; point: IntersectionPoint; complete: boolean}
  | {status: 'overlap'; intervalA: [number, number]; intervalB: [number, number]; complete: boolean}
  | {status: 'disjoint' | 'not-found' | 'ambiguous'; complete: boolean};
const DEG = Math.PI / 180,
  EPS = 3 * Number.EPSILON;
const math = geodesic.Math as unknown as {
  AngDiff(a: number, b: number): {d: number; e: number};
  sincosde(a: number, b: number): {s: number; c: number};
};
type Root = {x: number; y: number; c: 0 | 1 | -1; iterations: number};
type Vec = [number, number, number];

/** Bounded geodesic intersection search. Degrees and caller axis units.
 * Sphere searches enumerate analytically and are complete away from coincidence.
 * Ellipsoid searches explicitly report complete=false: converged roots are
 * residual-gated, but a sampled tiling is not a proof of global completeness.
 */
export class GeodesicIntersections {
  private readonly a: number;
  private readonly r: number;
  private readonly radius: number;
  private readonly solver: EllipsoidGeodesic;
  private readonly tolerance = 5e-14;
  constructor({semiMajorAxis: a, semiMinorAxis: b}: GeodesicParameters) {
    const r = b / a;
    if (!(Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0 && r >= 0.99 && r <= 1.01))
      throw new RangeError('Intersections require finite positive axes with 0.99 <= b/a <= 1.01');
    this.a = a;
    this.r = r;
    this.solver = new EllipsoidGeodesic({semiMajorAxis: 1, semiMinorAxis: r});
    this.radius = Math.sqrt(this.solver.surfaceArea / (4 * Math.PI));
    Object.freeze(this);
  }

  /** Find all discovered roots in the L1 ball |s-originS|+|t-originT| <= maxDistance. */
  all(a: GeodesicPath, b: GeodesicPath, options: IntersectionSearchOptions): IntersectionSearch {
    const A = this.solver.line(a.latitude, a.longitude, a.azimuth),
      B = this.solver.line(b.latitude, b.longitude, b.azimuth);
    const d = options.maxDistance / this.a,
      origin = options.origin ?? [0, 0];
    const x = origin[0] / this.a,
      y = origin[1] / this.a;
    if (
      !(
        Number.isFinite(d) &&
        d > 0 &&
        d <= 4 * Math.PI * this.radius &&
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Math.max(Math.abs(x), Math.abs(y)) <= 4 * Math.PI * this.radius
      )
    )
      throw new RangeError(
        'Intersection search requires finite bounds within four half-circumferences'
      );
    if (this.r === 1) return this.sphere(a, b, A, B, d, x, y);
    const roots: IntersectionPoint[] = [],
      coincidences: IntersectionSearch['coincidences'] = [];
    const m = Math.ceil(d / ((Math.PI * Math.min(1, this.r)) / 2));
    const n = m - 1,
      spacing = d / m,
      seeds: [number, number][] = [[x, y]];
    for (let i = -n; i <= n; i += 2)
      for (let j = -n; j <= n; j += 2)
        if (i || j) seeds.push([x + (spacing * (i + j)) / 2, y + (spacing * (i - j)) / 2]);
    let failed = 0;
    for (const seed of seeds) {
      const root = this.refine(A, B, seed[0], seed[1]);
      if (!root) {
        ++failed;
        continue;
      }
      if (root.c) {
        const shift = (x + root.c * y - (root.x + root.c * root.y)) / 2;
        const sx = root.x + shift,
          sy = root.y + root.c * shift;
        if (
          Math.abs(sx - x) + Math.abs(sy - y) <= d + this.tolerance &&
          !coincidences.some(p => Math.abs(p.s / this.a - sx) + Math.abs(p.t / this.a - sy) < 1e-10)
        )
          coincidences.push({s: sx * this.a, t: sy * this.a, direction: root.c});
        continue;
      }
      if (Math.abs(root.x - x) + Math.abs(root.y - y) > d + this.tolerance) continue;
      const point = this.point(A, B, root);
      if (
        point &&
        !roots.some(p => Math.abs(p.s / this.a - root.x) + Math.abs(p.t / this.a - root.y) < 1e-10)
      )
        roots.push(point);
    }
    this.sort(roots, origin);
    return {
      intersections: roots,
      coincidences,
      complete: false,
      attemptedSeeds: seeds.length,
      failedSeeds: failed
    };
  }

  closest(
    a: GeodesicPath,
    b: GeodesicPath,
    options: IntersectionSearchOptions
  ): ClosestIntersection {
    const search = this.all(a, b, options);
    return {...search, intersection: search.intersections[0]};
  }

  /** Next isolated crossing after the shared start, ranked by |s|+|t|.
   * Signed directions are retained; equal-distance ties are deterministic.
   */
  next(
    latitude: number,
    longitude: number,
    azimuthA: number,
    azimuthB: number,
    maxDistance: number
  ): ClosestIntersection {
    const search = this.all(
      {latitude, longitude, azimuth: azimuthA},
      {latitude, longitude, azimuth: azimuthB},
      {maxDistance}
    );
    search.intersections = search.intersections.filter(
      p => Math.abs(p.s / this.a) + Math.abs(p.t / this.a) > 1e-10
    );
    return {...search, intersection: search.intersections[0]};
  }

  segments(
    a0: readonly [number, number],
    a1: readonly [number, number],
    b0: readonly [number, number],
    b1: readonly [number, number]
  ): SegmentIntersection {
    const ia = this.solver.inverse(...a0, ...a1),
      ib = this.solver.inverse(...b0, ...b1);
    if (ia.a12 > 180 - 1e-10 || ib.a12 > 180 - 1e-10) return {status: 'ambiguous', complete: false};
    const sa = ia.s12,
      sb = ib.s12;
    if (sa === 0 || sb === 0) {
      const p = sa === 0 ? a0 : b0,
        start = sa === 0 ? b0 : a0,
        end = sa === 0 ? b1 : a1,
        len = sa === 0 ? sb : sa;
      const ip = this.solver.inverse(...start, ...p);
      const d0 = ip.s12;
      const route = this.solver.inverse(...start, ...end);
      const projected = this.solver.direct(start[0], start[1], route.azi1, d0);
      const residual = this.solver.inverse(projected.lat2, projected.lon2, ...p).s12;
      if (d0 > len + this.tolerance || residual > this.tolerance)
        return {status: 'disjoint', complete: true};
      return {
        status: 'intersection',
        complete: true,
        point: {
          s: (sa === 0 ? 0 : d0) * this.a,
          t: (sb === 0 ? 0 : d0) * this.a,
          latitude: p[0],
          longitude: p[1],
          residual: residual * this.a,
          crossingAngle: 0,
          iterations: 0
        }
      };
    }
    const search = this.all(
      {latitude: a0[0], longitude: a0[1], azimuth: ia.azi1},
      {latitude: b0[0], longitude: b0[1], azimuth: ib.azi1},
      {
        origin: [(sa * this.a) / 2, (sb * this.a) / 2],
        maxDistance: ((sa + sb) * this.a) / 2 + this.tolerance * this.a
      }
    );
    for (const c of search.coincidences) {
      const offset = c.t / this.a - (c.direction * c.s) / this.a;
      const lo = Math.max(0, c.direction === 1 ? -offset : offset - sb),
        hi = Math.min(sa, c.direction === 1 ? sb - offset : offset);
      if (hi >= lo - this.tolerance) {
        if (hi - lo > this.tolerance)
          return {
            status: 'overlap',
            intervalA: [lo * this.a, hi * this.a],
            intervalB: [(c.direction * lo + offset) * this.a, (c.direction * hi + offset) * this.a],
            complete: false
          };
        const s = (lo + hi) / 2,
          t = c.direction * s + offset;
        const A = this.solver.line(a0[0], a0[1], ia.azi1),
          B = this.solver.line(b0[0], b0[1], ib.azi1);
        const point = this.point(A, B, {x: s, y: t, c: 0, iterations: 0});
        if (point) return {status: 'intersection', point, complete: false};
      }
    }
    const point = search.intersections.find(
      p =>
        p.s / this.a >= -this.tolerance &&
        p.s / this.a <= sa + this.tolerance &&
        p.t / this.a >= -this.tolerance &&
        p.t / this.a <= sb + this.tolerance
    );
    return point
      ? {status: 'intersection', point, complete: search.complete}
      : {status: search.complete ? 'disjoint' : 'not-found', complete: search.complete};
  }

  private refine(A: GeodesicLine, B: GeodesicLine, x: number, y: number): Root | undefined {
    for (let i = 0; i < 100; i++) {
      const a = A.position(x),
        b = B.position(y),
        v = this.solver.inverse(a.lat2, a.lon2, b.lat2, b.lon2);
      const X = math.AngDiff(a.azi2, v.azi1),
        Y = math.AngDiff(b.azi2, v.azi2),
        XY = math.AngDiff(X.d, Y.d);
      const orientation = XY.d + (XY.e + Y.e - X.e) < 0 ? -1 : 1;
      const sx = math.sincosde(orientation * X.d, orientation * X.e),
        sy = math.sincosde(orientation * Y.d, orientation * Y.e);
      let dx: number,
        dy: number,
        c: Root['c'] = 0;
      if (v.s12 <= EPS * this.radius) {
        if (Math.abs(sx.s - sy.s) <= EPS && Math.abs(sx.c - sy.c) <= EPS) c = 1;
        else if (Math.abs(sx.s + sy.s) <= EPS && Math.abs(sx.c + sy.c) <= EPS) c = -1;
        return {x, y, c, iterations: i};
      }
      if (Math.abs(sx.s) <= EPS && Math.abs(sy.s) <= EPS) {
        c = sx.c * sy.c > 0 ? 1 : -1;
        dx = (sx.c * v.s12) / 2;
        dy = (-sy.c * v.s12) / 2;
      } else {
        const sz = Math.sin(v.s12 / this.radius),
          cz = Math.cos(v.s12 / this.radius);
        dx = this.radius * Math.atan2(sy.s * sz, sy.s * sx.c * cz - sy.c * sx.s);
        dy = this.radius * Math.atan2(sx.s * sz, -sx.s * sy.c * cz + sx.c * sy.s);
      }
      if (!(Number.isFinite(dx) && Number.isFinite(dy))) return undefined;
      x += dx;
      y += dy;
      if (Math.max(Math.abs(x), Math.abs(y)) > 12 * Math.PI * this.radius) return undefined;
      if (c) return {x, y, c, iterations: i + 1};
      if (Math.abs(dx) + Math.abs(dy) <= this.tolerance) {
        const root = {x, y, c, iterations: i + 1};
        if (this.point(A, B, root)) return root;
      }
    }
    return undefined;
  }

  private point(A: GeodesicLine, B: GeodesicLine, p: Root): IntersectionPoint | undefined {
    const a = A.position(p.x),
      b = B.position(p.y),
      v = this.solver.inverse(a.lat2, a.lon2, b.lat2, b.lon2);
    if (!(Number.isFinite(v.s12) && v.s12 <= this.tolerance)) return undefined;
    // Azimuths at a pole can use different longitude reference frames.
    const ta = frame({latitude: a.lat2, longitude: a.lon2, azimuth: a.azi2})[1];
    const tb = frame({latitude: b.lat2, longitude: b.lon2, azimuth: b.azi2})[1];
    const angle = Math.atan2(Math.hypot(...cross(ta, tb)), Math.abs(dot(ta, tb))) / DEG;
    return {
      s: p.x * this.a,
      t: p.y * this.a,
      latitude: a.lat2,
      longitude: a.lon2,
      residual: v.s12 * this.a,
      crossingAngle: angle,
      iterations: p.iterations
    };
  }

  private sphere(
    a: GeodesicPath,
    b: GeodesicPath,
    A: GeodesicLine,
    B: GeodesicLine,
    d: number,
    x: number,
    y: number
  ): IntersectionSearch {
    const [pa, ta, na] = frame(a),
      [pb, tb, nb] = frame(b),
      crossing = cross(na, nb),
      length = Math.hypot(...crossing);
    if (length <= EPS) {
      const sign = dot(na, nb) >= 0 ? 1 : -1;
      const offset = Math.atan2(dot(pa, tb), dot(pa, pb));
      const coincidences: IntersectionSearch['coincidences'] = [];
      for (
        let k = Math.ceil((y - sign * x - d - offset) / (2 * Math.PI));
        k <= Math.floor((y - sign * x + d - offset) / (2 * Math.PI));
        k++
      ) {
        const shift = offset + 2 * Math.PI * k;
        const sx = (x + sign * (y - shift)) / 2;
        const sy = sign * sx + shift;
        if (Math.abs(sx - x) + Math.abs(sy - y) <= d + this.tolerance)
          coincidences.push({s: sx * this.a, t: sy * this.a, direction: sign});
      }
      return {intersections: [], coincidences, complete: false, attemptedSeeds: 0, failedSeeds: 0};
    }
    const result: IntersectionPoint[] = [];
    let failed = 0;
    for (const sign of [-1, 1]) {
      const p = crossing.map(v => (sign * v) / length) as Vec;
      const s = Math.atan2(dot(p, ta), dot(p, pa)),
        t = Math.atan2(dot(p, tb), dot(p, pb));
      const k0 = Math.ceil((x - d - s) / (2 * Math.PI)),
        k1 = Math.floor((x + d - s) / (2 * Math.PI));
      const l0 = Math.ceil((y - d - t) / (2 * Math.PI)),
        l1 = Math.floor((y + d - t) / (2 * Math.PI));
      for (let k = k0; k <= k1; k++)
        for (let l = l0; l <= l1; l++) {
          const sx = s + 2 * Math.PI * k,
            sy = t + 2 * Math.PI * l;
          if (Math.abs(sx - x) + Math.abs(sy - y) > d + this.tolerance) continue;
          const point = this.point(A, B, {x: sx, y: sy, c: 0, iterations: 0});
          if (point) result.push(point);
          else ++failed;
        }
    }
    this.sort(result, [x * this.a, y * this.a]);
    return {
      intersections: result,
      coincidences: [],
      complete: failed === 0,
      attemptedSeeds: 0,
      failedSeeds: failed
    };
  }
  private sort(points: IntersectionPoint[], origin: readonly [number, number]): void {
    points.sort(
      (p, q) =>
        Math.abs(p.s - origin[0]) +
          Math.abs(p.t - origin[1]) -
          (Math.abs(q.s - origin[0]) + Math.abs(q.t - origin[1])) ||
        p.s - q.s ||
        p.t - q.t
    );
  }
}
function frame(p: GeodesicPath): [Vec, Vec, Vec] {
  const [s, c] = sincos(p.latitude),
    [sl, cl] = sincos(p.longitude),
    [sa, ca] = sincos(p.azimuth);
  const point: Vec = [c * cl, c * sl, s],
    north: Vec = [-s * cl, -s * sl, c],
    east: Vec = [-sl, cl, 0];
  const tangent = north.map((v, i) => ca * v + sa * east[i]) as Vec;
  return [point, tangent, cross(point, tangent)];
}
function sincos(degrees: number): [number, number] {
  const a = degrees % 360,
    q = Math.round(a / 90),
    d = (a - 90 * q) * DEG,
    s = Math.sin(d),
    c = Math.cos(d);
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
function dot(a: Vec, b: Vec): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: Vec, b: Vec): Vec {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
