// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original bounded curve/root certificates over the existing attributed GeographicLib-derived geodesic and rhumb solvers.
import {Context, root as axisRoot, type Edge} from '../geographic-seams/edge';
import {GeographicSeamError} from '../geographic-seams/types';
import {
  dot,
  value,
  slope,
  valueError,
  normal,
  position,
  scale,
  add,
  unit,
  cross,
  sincos,
  TAU,
  ROUND,
  ANGULAR,
  type V,
  type Circle
} from './math';
export type Curve = {
  sample(t: number): number[];
  derivative(t: number): V;
  speed: number;
  second: number;
  circular?: {
    normal: V;
    offset: number;
    u: V;
    v: V;
    start: number;
    end: number;
    fraction(theta: number): number;
  };
};
export function sourceCurve(
  edge: Edge,
  context: Context,
  a: number,
  b: number,
  original?: readonly [number[], number[]]
): Curve {
  const model = context.options.edgeModel,
    r = b / a,
    qmax = Math.max(1, 1 / (r * r)),
    wmin = Math.min(1, 1 / r),
    K = qmax / wmin;
  let initialAzimuth = 0;
  let length = 0,
    azimuth = (t: number) => ({azi: 0, longitude: edge.a[0]});
  if (model === 'geodesic') {
    const g = context.options.geodesic!;
    context.tick(2);
    const first = original?.[0] ?? edge.a,
      last = original?.[1] ?? edge.b;
    const inv = g.inverse(first[1], first[0], last[1], last[0]);
    initialAzimuth = inv.azi1;
    length = inv.s12 / a;
    const line = g.line(first[1], first[0], inv.azi1);
    azimuth = t => {
      context.tick();
      const p = line.position(inv.s12 * t);
      return {azi: p.azi2, longitude: p.lon2};
    };
  } else if (model === 'rhumb') {
    const rh = context.options.rhumb!;
    context.tick(2);
    const first = rh.inverse(edge.a[1], edge.a[0], edge.b[1], edge.b[0], {unrollLongitude: true});
    const turns = Math.round((edge.b[0] - first.lon2) / 360);
    const inv = turns
      ? rh.inverse(edge.a[1], edge.a[0], edge.b[1], edge.b[0], {longitudeTurns: turns})
      : first;
    length = inv.s12 / a;
    azimuth = () => ({azi: inv.azi12, longitude: edge.a[0]});
  }
  const dp = ((edge.b[1] - edge.a[1]) * Math.PI) / 180,
    dl = ((edge.b[0] - edge.a[0]) * Math.PI) / 180;
  const speed = model === 'linear' ? Math.abs(dp) + Math.abs(dl) : length * K;
  const minCos = Math.min(...[edge.a[1], edge.b[1]].map(x => Math.abs(sincos(x)[1])));
  // For normalized Q=diag(1,1,1/r²), |Dn| <= K. A unit-speed
  // geodesic has |x''| <= K and differentiating Qx/|Qx| gives
  // |n''| <= 4 K². Constant-bearing frame derivatives add a
  // conservative latitude-dependent bound (rhumbs exclude poles).
  const second =
    model === 'linear'
      ? speed * speed
      : model === 'geodesic'
        ? 4 * speed * speed
        : (100 * K * K * speed * speed) / (minCos * minCos);
  const curve: Curve = {
    sample: edge.sample,
    speed,
    second,
    derivative: t => {
      const p = edge.sample(t),
        heading = model === 'linear' ? undefined : azimuth(t),
        longitude = model === 'geodesic' && Math.abs(p[1]) === 90 ? heading!.longitude : p[0],
        [sp, cp] = sincos(p[1]),
        [sl, cl] = sincos(longitude);
      const north: V = [-sp * cl, -sp * sl, cp],
        east: V = [-sl, cl, 0];
      if (model === 'linear') return add(scale(north, dp), scale(east, cp * dl));
      const [sa, ca] = sincos(heading!.azi),
        w = Math.sqrt(cp * cp + r * r * sp * sp),
        M = (r * r) / (w * w * w),
        N = 1 / w;
      return scale(add(scale(north, ca / M), scale(east, sa / N)), length);
    }
  };
  const axis = (coordinate: 0 | 1, theta: number) => {
    const target = (theta * 180) / Math.PI;
    if (Math.abs(target - edge.a[coordinate]) < 1e-13) return 0;
    if (Math.abs(target - edge.b[coordinate]) < 1e-13) return 1;
    return axisRoot(edge, coordinate, target, context);
  };
  if (
    edge.a[1] === edge.b[1] &&
    (model !== 'geodesic' || (edge.a[1] === 0 && Math.abs(initialAzimuth) === 90))
  ) {
    curve.circular = {
      normal: [0, 0, 1],
      offset: sincos(edge.a[1])[0],
      u: [1, 0, 0],
      v: [0, 1, 0],
      start: (edge.a[0] * Math.PI) / 180,
      end: (edge.b[0] * Math.PI) / 180,
      fraction: t => axis(0, t)
    };
  } else if (edge.a[0] === edge.b[0]) {
    const [s, c] = sincos(edge.a[0]);
    curve.circular = {
      normal: [s, -c, 0],
      offset: 0,
      u: [c, s, 0],
      v: [0, 0, 1],
      start: (edge.a[1] * Math.PI) / 180,
      end: (edge.b[1] * Math.PI) / 180,
      fraction: t => axis(1, t)
    };
  } else if (model === 'geodesic' && a === b && length > 0) {
    const u = normal(edge.a),
      v = unit(curve.derivative(0));
    curve.circular = {
      normal: unit(cross(u, v)),
      offset: 0,
      u,
      v,
      start: 0,
      end: length,
      fraction: t => t / length
    };
  }
  if (curve.circular && Math.abs(curve.circular.offset) === 1) {
    curve.speed = 0;
    curve.second = 0;
  }
  return curve;
}
export function sliceCurve(c: Curve, lo: number, hi: number): Curve {
  const d = hi - lo,
    z = c.circular;
  const theta = (t: number) => {
    const n = normal(c.sample(t)),
      raw = Math.atan2(dot(z!.v, n), dot(z!.u, n)),
      expected = z!.start + (z!.end - z!.start) * t;
    return raw + TAU * Math.round((expected - raw) / TAU);
  };
  return {
    sample: t => c.sample(lo + d * t),
    derivative: t => scale(c.derivative(lo + d * t), d),
    speed: c.speed * Math.abs(d),
    second: c.second * d * d,
    circular: z && {
      ...z,
      start: theta(lo),
      end: theta(hi),
      fraction: angle => (z.fraction(angle) - lo) / d
    }
  };
}
export function circleCurve(
  c: Circle,
  start: number,
  end: number,
  attributesA: readonly number[],
  attributesB: readonly number[]
): Curve {
  const delta = end - start;
  const sample = (t: number) => {
    const theta = start + delta * t,
      n = add(
        scale(c.normal, c.offset),
        scale(add(scale(c.u, Math.cos(theta)), scale(c.v, Math.sin(theta))), c.radius)
      );
    return position(
      n,
      attributesA.map((x, i) => x * (1 - t) + attributesB[i] * t)
    );
  };
  return {
    sample,
    derivative: t => {
      const theta = start + delta * t;
      return scale(
        add(scale(c.u, -Math.sin(theta)), scale(c.v, Math.cos(theta))),
        c.radius * delta
      );
    },
    speed: c.radius * Math.abs(delta),
    second: c.radius * delta * delta,
    circular: {
      normal: c.normal,
      offset: c.offset,
      u: c.u,
      v: c.v,
      start,
      end,
      fraction: theta => (theta - start) / delta
    }
  };
}
export function roots(
  c: Curve,
  b: Circle,
  context: Context
): {fractions: number[]; coincident: boolean} {
  const result: number[] = [];
  const put = (t: number) => {
    if (t >= 0 && t <= 1 && !result.includes(t)) {
      result.push(t);
      context.addVertices(1);
    }
  };
  const f = (t: number) => {
    context.tick();
    return value(b, normal(c.sample(t)));
  };
  if (c.circular) {
    const z = c.circular,
      radius = Math.sqrt((1 - z.offset) * (1 + z.offset)),
      A = radius * dot(b.normal, z.u),
      B = radius * dot(b.normal, z.v),
      direct = dot(b.normal, z.normal),
      // Stable cosine of the angle between the two circle normals.
      d =
        direct >= 0
          ? 1 - 0.5 * b.normal.reduce((sum, x, i) => sum + (x - z.normal[i]) ** 2, 0)
          : -1 + 0.5 * b.normal.reduce((sum, x, i) => sum + (x + z.normal[i]) ** 2, 0),
      C =
        d >= 0
          ? b.offset -
            z.offset +
            z.offset * 0.5 * b.normal.reduce((sum, x, i) => sum + (x - z.normal[i]) ** 2, 0)
          : b.offset +
            z.offset -
            z.offset * 0.5 * b.normal.reduce((sum, x, i) => sum + (x + z.normal[i]) ** 2, 0),
      R = Math.hypot(A, B);
    if (
      Math.hypot(...cross(b.normal, z.normal)) <= ROUND &&
      Math.abs(b.offset - z.offset * (d >= 0 ? 1 : -1)) / radius <= ROUND
    )
      return {fractions: [], coincident: true};
    if (R === 0) return {fractions: [], coincident: false};
    const sine = Math.hypot(...cross(b.normal, z.normal));
    // Use a cross product near parallel normals; 1-d*d erases small angles.
    const left =
        Math.abs(d) > 0.5
          ? radius * radius * sine * sine
          : (1 - b.offset) * (1 + b.offset) * (1 - z.offset) * (1 + z.offset),
      right = Math.abs(d) > 0.5 ? C * C : (d - b.offset * z.offset) ** 2,
      D = left - right,
      error = ROUND * (Math.abs(left) + Math.abs(right));
    if (D < -error) return {fractions: [], coincident: false};
    if (D <= error) throw new GeographicSeamError('precision', 'Unresolved circle tangency');
    if (sine < Math.sqrt(ROUND))
      throw new GeographicSeamError('precision', 'Unresolved nearly coincident source/cut circles');
    const phase = Math.atan2(B, A),
      delta = Math.atan2(Math.sqrt(D), C),
      low = Math.min(z.start, z.end),
      high = Math.max(z.start, z.end);
    for (const base of [phase - delta, phase + delta])
      for (let k = Math.ceil((low - base) / TAU); base + TAU * k <= high; k++) {
        context.tick();
        const theta = base + TAU * k;
        // Endpoints are identities of this curve, not proximity-welded source vertices.
        const t = theta === z.start ? 0 : theta === z.end ? 1 : z.fraction(theta);
        put(t);
      }
    return {fractions: result.sort((x, y) => x - y), coincident: false};
  }
  const bisect = (a: number, b1: number, fa: number) => {
    let lo = a,
      hi = b1;
    for (let i = 0; i < context.iterations; i++) {
      context.tick();
      const mid = (lo + hi) / 2,
        fm = f(mid);
      if (fm === 0) {
        put(mid);
        return;
      }
      if (hi - lo <= 4 * Number.EPSILON && c.speed * (hi - lo) <= ANGULAR) {
        put(mid);
        return;
      }
      if (mid === lo || mid === hi) break;
      if (fm < 0 === fa < 0) {
        lo = mid;
        fa = fm;
      } else hi = mid;
    }
    throw new GeographicSeamError('precision', 'Atlas intersection exhausted its root budget');
  };
  const visit = (lo: number, hi: number, fl: number, fh: number, depth: number) => {
    context.tick();
    const mid = (lo + hi) / 2,
      h = (hi - lo) / 2,
      fm = f(mid);
    const n = normal(c.sample(mid)),
      d = slope(b, n, c.derivative(mid)),
      derivativeError = ROUND * Math.max(1, c.speed);
    const excursion = Math.min(
      c.speed * h,
      (Math.abs(d) + derivativeError) * h + 0.5 * c.second * h * h
    );
    if (Math.abs(fm) > excursion + valueError(b, n)) return;
    if (Math.abs(d) > c.second * h + ROUND * Math.max(1, c.speed)) {
      if (fl === 0) put(lo);
      if (fh === 0) put(hi);
      if (fl * fh < 0) bisect(lo, hi, fl);
      return;
    }
    if (depth >= context.iterations || mid === lo || mid === hi)
      throw new GeographicSeamError('precision', 'Unresolved tangent or coincident source/cut');
    visit(lo, mid, fl, fm, depth + 1);
    visit(mid, hi, fm, fh, depth + 1);
  };
  visit(0, 1, f(0), f(1), 0);
  return {fractions: result.sort((x, y) => x - y), coincident: false};
}
