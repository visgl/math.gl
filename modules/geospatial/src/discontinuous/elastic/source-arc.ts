// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {angle, geographic, RAD, type Position} from '../math';
import {contains, type Polygons} from './geometry';
import {sourceArc} from '../source-arc';

/** Clip a source minor arc against straight lon/lat domain constraints. Analytic
 * derivative bounds isolate roots; unresolved tangencies/pole conditioning reject
 * rather than trusting a fixed set of midpoint probes. */
export function clipSourceArc(
  a: Position,
  b: Position,
  polygons: Polygons
): {a: Position; b: Position}[] {
  const at = sourceArc(a, b),
    va = geographic(a),
    vb = geographic(b),
    omega = angle(va, vb),
    ts = [0, 1];
  let work = 0;
  const tick = () => {
    if (++work > 1000000) throw new Error('Elastic source clipping limit exceeded');
  };
  const linear =
    omega < 1e-14 ||
    (Math.abs(a[1]) < 1e-12 && Math.abs(b[1]) < 1e-12) ||
    Math.abs(a[0] - b[0]) < 1e-12;
  const tangent =
    omega > 1e-14 ? va.map((v, k) => (vb[k] - v * Math.cos(omega)) / Math.sin(omega)) : [0, 0, 0];
  const vector = (t: number) =>
    va.map((v, k) => v * Math.cos(omega * t) + tangent[k] * Math.sin(omega * t));
  const derivative = (t: number) =>
    va.map((v, k) => omega * (-v * Math.sin(omega * t) + tangent[k] * Math.cos(omega * t)));
  for (const rings of polygons)
    for (const ring of rings)
      for (let edge = 1; edge < ring.length; edge++) {
        const c = ring[edge - 1],
          d = ring[edge],
          dx = d[0] - c[0],
          dy = d[1] - c[1],
          length = Math.hypot(dx, dy);
        if (!length) continue;
        const value = (t: number) => {
          tick();
          const p = at(t);
          return ((p[0] - c[0]) * dy - (p[1] - c[1]) * dx) / length;
        };
        const put = (t: number) => {
          const p = at(t),
            u = ((p[0] - c[0]) * dx + (p[1] - c[1]) * dy) / (length * length);
          if (u >= -1e-10 && u <= 1 + 1e-10) ts.push(t);
        };
        const bisect = (lo: number, hi: number, f: number) => {
          for (let k = 0; k < 52; k++) {
            const mid = (lo + hi) / 2;
            if (value(mid) >= 0 === f >= 0) lo = mid;
            else hi = mid;
          }
          put((lo + hi) / 2);
        };
        const visit = (lo: number, hi: number, depth: number) => {
          tick();
          const f = value(lo),
            g = value(hi),
            mid = (lo + hi) / 2,
            h = (hi - lo) / 2;
          if (Math.abs(f) < 1e-12) put(lo);
          if (Math.abs(g) < 1e-12) put(hi);
          if (linear) {
            if (f * g < 0) bisect(lo, hi, f);
            return;
          }
          const v = vector(mid),
            dv = derivative(mid),
            r2 = v[0] * v[0] + v[1] * v[1];
          const df =
            (((v[0] * dv[1] - v[1] * dv[0]) / r2) * dy - (dv[2] / Math.sqrt(r2)) * dx) /
            (RAD * length);
          // Bound |latitude| over the complete finite arc, including interior extrema.
          let z = Math.max(Math.abs(vector(lo)[2]), Math.abs(vector(hi)[2]));
          const phase = Math.atan2(tangent[2], va[2]);
          for (let k = -2; k <= 2; k++) {
            const theta = phase + k * Math.PI;
            if (theta >= omega * lo && theta <= omega * hi)
              z = Math.max(z, Math.hypot(va[2], tangent[2]));
          }
          const r = Math.sqrt(Math.max(0, 1 - Math.min(1, z) ** 2));
          const second = r
            ? (omega *
                omega *
                ((2 * Math.abs(dy)) / r ** 4 + Math.abs(dx) * (1 / r + 1 / r ** 3))) /
              (RAD * length)
            : Infinity;
          if (Number.isFinite(df) && Math.abs(df) > second * h + 1e-12) {
            if (f * g < 0) bisect(lo, hi, f);
            return;
          }
          const speed = r ? (omega * (Math.abs(dy) / r + Math.abs(dx))) / (RAD * length) : Infinity;
          if (Math.abs(value(mid)) > speed * h + 1e-12) return;
          if (depth >= 24) throw new Error('Unresolved Elastic source clipping tangent or pole');
          visit(lo, mid, depth + 1);
          visit(mid, hi, depth + 1);
        };
        visit(0, 1, 0);
      }
  ts.sort((a, b) => a - b);
  const result: {a: Position; b: Position}[] = [];
  for (let i = 1; i < ts.length; i++)
    if (ts[i] - ts[i - 1] > 1e-12 && contains(polygons, at((ts[i] + ts[i - 1]) / 2)))
      result.push({a: at(ts[i - 1]), b: at(ts[i])});
  return result;
}
