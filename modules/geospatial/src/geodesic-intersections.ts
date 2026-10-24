// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2011-2023)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Global capture tiling, characteristic bounds, conjugates and spherical correction adapted from GeographicLib 2.7 Intersect.cpp (MIT, Karney 2024). Geodesic.hpp ambiguity catalog; original adaptive coverage, typed reporting and analytic sphere enumeration. See ../GEOGRAPHICLIB-LICENSE.txt.
import {EllipsoidGeodesic, type GeodesicParameters, type GeodesicLine} from './ellipsoid-geodesic';
import {IntersectionBounds} from './ellipsoid-helpers/intersection-bounds';
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
  /** Continuum representative; next() uses the native conjugate-point convention. */
  coincidence?: 1 | -1;
};
export type IntersectionSearchOptions = {maxDistance: number; origin?: readonly [number, number]};
export type IntersectionSearch = {
  intersections: IntersectionPoint[];
  coincidences: {s: number; t: number; direction: 1 | -1}[];
  /** Every tile/candidate is covered and all output residuals pass. */
  complete: boolean;
  attemptedSeeds: number;
  /** Failed refinement/candidate attempts, including recovered tiles. */
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
type CoincidenceDirection = 1 | -1;
type Root = {x: number; y: number; c: 0 | 1 | -1; iterations: number};
type Vec = [number, number, number];

/** Global geodesic intersection search in the declared numerical profile.
 * All finite L1 search tiles use GeographicLib capture bounds and a boundary
 * margin. Completeness is withheld on unresolved convergence or residual failure.
 */
export class GeodesicIntersections {
  private readonly a: number;
  private readonly r: number;
  private readonly radius: number;
  private readonly solver: EllipsoidGeodesic;
  private readonly bounds: IntersectionBounds;
  private readonly tolerance = 5e-14;
  constructor({semiMajorAxis: a, semiMinorAxis: b}: GeodesicParameters) {
    const r = b / a;
    if (!(Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0 && r >= 0.99 && r <= 1.01))
      throw new RangeError('Intersections require finite positive axes with 0.99 <= b/a <= 1.01');
    this.a = a;
    this.r = r;
    this.solver = new EllipsoidGeodesic({semiMajorAxis: 1, semiMinorAxis: r});
    this.radius = Math.sqrt(this.solver.surfaceArea / (4 * Math.PI));
    this.bounds = new IntersectionBounds(this.solver, r, this.radius);
    Object.freeze(this);
  }

  /** Find all discovered roots in the L1 ball |s-originS|+|t-originT| <= maxDistance. */
  all(a: GeodesicPath, b: GeodesicPath, options: IntersectionSearchOptions): IntersectionSearch {
    return this.search(a, b, options, false);
  }

  private search(
    a: GeodesicPath,
    b: GeodesicPath,
    options: IntersectionSearchOptions,
    normalized: boolean
  ): IntersectionSearch {
    const A = this.solver.line(a.latitude, a.longitude, a.azimuth),
      B = this.solver.line(b.latitude, b.longitude, b.azimuth);
    const d = normalized ? options.maxDistance : options.maxDistance / this.a,
      origin = options.origin ?? [0, 0];
    const x = origin[0] / this.a,
      y = origin[1] / this.a;
    if (
      !(
        Number.isFinite(d) &&
        d > 0 &&
        (normalized
          ? d <= 4 * this.bounds.halfCircumference
          : options.maxDistance <= 4 * this.bounds.halfCircumference * this.a) &&
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Math.max(Math.abs(origin[0]), Math.abs(origin[1])) <=
          4 * this.bounds.halfCircumference * this.a
      )
    )
      throw new RangeError(
        'Intersection search requires finite bounds within four half-circumferences'
      );
    if (this.r === 1) {
      const analytic = this.sphere(a, b, A, B, d, x, y);
      if (analytic) return analytic;
    }
    // GeographicLib AllInt0 capture-radius tiling, without its optional seed
    // pruning: every tile is refined. Extend by delta before tiling so roots
    // at the requested boundary still lie inside a capture region.
    const extended = d + this.bounds.margin;
    const m = Math.ceil(extended / this.bounds.spacing),
      n = m - 1;
    const spacing = extended / m;
    const seeds: [number, number, number, number][] = [[x, y, spacing, 0]];
    for (let i = -n; i <= n; i += 2)
      for (let j = -n; j <= n; j += 2)
        if (i || j)
          seeds.push([x + (spacing * (i + j)) / 2, y + (spacing * (i - j)) / 2, spacing, 0]);
    let failed = 0,
      unresolved = 0;
    const isolated: Root[] = [],
      lines: Root[] = [];
    const equal = (p: Root, q: Root) =>
      Math.abs(p.x - q.x) + Math.abs(p.y - q.y) <= this.bounds.margin;
    const canonical = (p: Root, c: CoincidenceDirection) => {
      const shift = (x + c * y - (p.x + c * p.y)) / 2;
      return {...p, x: p.x + shift, y: p.y + c * shift, c};
    };
    const retry = (seed: [number, number, number, number]) => {
      ++failed;
      if (seed[3] === 3) {
        ++unresolved;
        return;
      }
      // Four half-radius L1 diamonds exactly cover their parent. A failed
      // coarse refinement is not evidence of an empty tile: cover it again.
      const half = seed[2] / 2,
        depth = seed[3] + 1;
      for (const [dx, dy] of [
        [half, 0],
        [-half, 0],
        [0, half],
        [0, -half]
      ])
        seeds.push([seed[0] + dx, seed[1] + dy, half, depth]);
    };
    for (const seed of seeds) {
      const root = this.refine(A, B, seed[0], seed[1]);
      if (!root) {
        retry(seed);
        continue;
      }
      if (root.c) {
        const q = canonical(root, root.c);
        if (!this.point(A, B, q)) {
          retry(seed);
          continue;
        }
        if (!lines.some(p => p.c === q.c && equal(p, q))) lines.push(q);
      } else if (!isolated.some(p => equal(p, root))) isolated.push(root);
    }
    const roots: IntersectionPoint[] = [],
      coincidences: IntersectionSearch['coincidences'] = [];
    for (const p of isolated) {
      if (lines.some(q => equal(canonical(p, q.c as CoincidenceDirection), q))) continue;
      if (Math.abs(p.x - x) + Math.abs(p.y - y) > d + this.tolerance) continue;
      const point = this.point(A, B, p);
      if (point) roots.push(point);
      else {
        ++failed;
        ++unresolved;
      }
    }
    for (const p of lines) {
      if (Math.abs(p.x - x) + Math.abs(p.y - y) <= d + this.tolerance)
        coincidences.push({
          s: p.x * this.a,
          t: p.y * this.a,
          direction: p.c as CoincidenceDirection
        });
    }
    this.sort(roots, origin);
    this.sort(coincidences, origin);
    return {
      intersections: roots,
      coincidences,
      complete: unresolved === 0,
      attemptedSeeds: seeds.length,
      failedSeeds: failed
    };
  }

  /** Without an explicit radius, search the full native global profile.
   * A returned root from any complete centered L1 search is globally closest:
   * every point outside that ball is farther from its center.
   */
  closest(
    a: GeodesicPath,
    b: GeodesicPath,
    options: Partial<IntersectionSearchOptions> = {}
  ): ClosestIntersection {
    const settings = {
      ...options,
      maxDistance: options.maxDistance ?? 4 * this.bounds.halfCircumference
    };
    const search = this.search(a, b, settings, options.maxDistance === undefined);
    const candidates = [...search.intersections];
    for (const c of search.coincidences) {
      const point = this.coincidencePoint(a, b, c);
      if (point) candidates.push(point);
      else {
        search.complete = false;
        ++search.failedSeeds;
      }
    }
    this.sort(candidates, settings.origin ?? [0, 0]);
    return {...search, intersection: candidates[0]};
  }

  /** Global next crossing, excluding the shared parameter origin. For a
   * coincident continuum use GeographicLib's nearest-conjugate convention.
   */
  next(
    latitude: number,
    longitude: number,
    azimuthA: number,
    azimuthB: number,
    maxDistance?: number
  ): ClosestIntersection {
    const a = {latitude, longitude, azimuth: azimuthA},
      b = {latitude, longitude, azimuth: azimuthB};
    const bound =
      maxDistance === undefined ? 4 * this.bounds.halfCircumference : maxDistance / this.a;
    const search = this.search(
      a,
      b,
      {maxDistance: maxDistance ?? bound},
      maxDistance === undefined
    );
    search.intersections = search.intersections.filter(
      p => Math.abs(p.s / this.a) + Math.abs(p.t / this.a) > this.bounds.margin
    );
    const candidates = [...search.intersections];
    const A = this.solver.line(latitude, longitude, azimuthA);
    for (const c of search.coincidences) {
      if (Math.abs(c.s / this.a) + Math.abs(c.t / this.a) > this.bounds.margin) {
        const point = this.coincidencePoint(a, b, c);
        if (point) candidates.push(point);
        else {
          search.complete = false;
          ++search.failedSeeds;
        }
      } else {
        for (const sign of [-1, 1]) {
          try {
            const s = this.bounds.conjugate(A, sign * this.bounds.halfCircumference);
            const point = this.coincidencePoint(a, b, {
              s: s * this.a,
              t: c.direction * s * this.a,
              direction: c.direction
            });
            if (point) candidates.push(point);
            else {
              search.complete = false;
              ++search.failedSeeds;
            }
          } catch {
            search.complete = false;
            ++search.failedSeeds;
          }
        }
      }
    }
    const bounded = candidates.filter(
      p => Math.abs(p.s / this.a) + Math.abs(p.t / this.a) <= bound + this.tolerance
    );
    this.sort(bounded, [0, 0]);
    return {...search, intersection: bounded[0]};
  }

  private coincidencePoint(
    a: GeodesicPath,
    b: GeodesicPath,
    c: {s: number; t: number; direction: 1 | -1}
  ): IntersectionPoint | undefined {
    return this.point(
      this.solver.line(a.latitude, a.longitude, a.azimuth),
      this.solver.line(b.latitude, b.longitude, b.azimuth),
      {x: c.s / this.a, y: c.t / this.a, c: c.direction, iterations: 0}
    );
  }

  segments(
    a0: readonly [number, number],
    a1: readonly [number, number],
    b0: readonly [number, number],
    b1: readonly [number, number]
  ): SegmentIntersection {
    const ia = this.solver.inverse(...a0, ...a1),
      ib = this.solver.inverse(...b0, ...b1);
    if (this.ambiguous(a0, a1, ia) || this.ambiguous(b0, b1, ib))
      return {status: 'ambiguous', complete: false};
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
            complete: search.complete
          };
        const s = (lo + hi) / 2,
          t = c.direction * s + offset;
        const A = this.solver.line(a0[0], a0[1], ia.azi1),
          B = this.solver.line(b0[0], b0[1], ib.azi1);
        const point = this.point(A, B, {x: s, y: t, c: 0, iterations: 0});
        if (point) return {status: 'intersection', point, complete: search.complete};
        search.complete = false;
        ++search.failedSeeds;
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

  private ambiguous(
    start: readonly [number, number],
    end: readonly [number, number],
    path: {a12: number; azi1: number; azi2: number}
  ): boolean {
    if (path.a12 > 180 - 1e-10) return true;
    if (Math.abs(start[0]) === 90 || Math.abs(end[0]) === 90) return false;
    // GeographicLib's nonunique shortest-path catalog is distinct from arc
    // length: on prolate ellipsoids the cut locus can have a12 well below 180.
    if (start[0] === -end[0] && math.AngDiff(path.azi1, path.azi2).d !== 0) return true;
    const longitude = math.AngDiff(start[1], end[1]);
    return (
      Math.abs(longitude.d) === 180 &&
      longitude.e === 0 &&
      path.azi1 !== 0 &&
      Math.abs(path.azi1) !== 180
    );
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
    const s = p.x * this.a,
      t = p.y * this.a;
    if (
      !(Number.isFinite(s) && Number.isFinite(t)) ||
      Math.abs(s / this.a - p.x) > this.tolerance ||
      Math.abs(t / this.a - p.y) > this.tolerance
    )
      return undefined;
    const a = A.position(p.x),
      b = B.position(p.y),
      v = this.solver.inverse(a.lat2, a.lon2, b.lat2, b.lon2);
    if (
      !(
        Number.isFinite(v.s12) &&
        v.s12 <= this.tolerance &&
        Number.isFinite(p.x * this.a) &&
        Number.isFinite(p.y * this.a)
      )
    )
      return undefined;
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
      iterations: p.iterations,
      ...(p.c ? {coincidence: p.c} : {})
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
  ): IntersectionSearch | undefined {
    const [pa, ta, na] = frame(a),
      [pb, tb, nb] = frame(b),
      crossing = cross(na, nb),
      length = Math.hypot(...crossing);
    // Almost dependent plane normals amplify their floating-point error.
    // Resolve these through capture-bound geodesic refinement and the native
    // coincidence convention instead of normalizing an unreliable cross product.
    if (length > 0 && length < Math.sqrt(Number.EPSILON)) return undefined;
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
      let failed = 0;
      const checked = coincidences.filter(c => {
        const p = this.point(A, B, {
          x: c.s / this.a,
          y: c.t / this.a,
          c: c.direction,
          iterations: 0
        });
        if (!p) ++failed;
        return Boolean(p);
      });
      return {
        intersections: [],
        coincidences: checked,
        complete: failed === 0,
        attemptedSeeds: 0,
        failedSeeds: failed
      };
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
  private sort<T extends {s: number; t: number}>(
    points: T[],
    origin: readonly [number, number]
  ): void {
    const x = origin[0] / this.a,
      y = origin[1] / this.a;
    points.sort(
      (p, q) =>
        Math.abs(p.s / this.a - x) +
          Math.abs(p.t / this.a - y) -
          (Math.abs(q.s / this.a - x) + Math.abs(q.t / this.a - y)) ||
        p.s / this.a - q.s / this.a ||
        p.t / this.a - q.t / this.a
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
