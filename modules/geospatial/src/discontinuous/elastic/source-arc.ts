// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {angle, geographic, RAD, type Position} from '../math';
import {contains, type Polygons} from './geometry';
import {sourceArc} from '../source-arc';

/** Split an already sampled source arc against the explicit lon/lat chart
 * constraints. Bracket roots on bounded subintervals and refine on the arc;
 * never assign source parameters by matching output projected coordinates.
 */
export function clipSourceArc(
  a: Position,
  b: Position,
  polygons: Polygons
): {a: Position; b: Position}[] {
  const at = sourceArc(a, b),
    steps = Math.max(1, Math.ceil(angle(geographic(a), geographic(b)) / RAD / 0.25));
  if (steps > 720) throw new Error('Elastic source clipping limit exceeded');
  const ts = [0, 1];
  let work = 0;
  for (const rings of polygons)
    for (const ring of rings)
      for (let edge = 1; edge < ring.length; edge++) {
        const c = ring[edge - 1],
          d = ring[edge],
          dx = d[0] - c[0],
          dy = d[1] - c[1],
          length2 = dx * dx + dy * dy;
        if (!length2) continue;
        const value = (t: number) => {
          const p = at(t);
          return (p[0] - c[0]) * dy - (p[1] - c[1]) * dx;
        };
        for (let j = 0; j < steps; j++) {
          if (++work > 1000000) throw new Error('Elastic source clipping limit exceeded');
          let lo = j / steps,
            hi = (j + 1) / steps,
            f = value(lo),
            g = value(hi);
          const add = (t: number) => {
            const p = at(t),
              u = ((p[0] - c[0]) * dx + (p[1] - c[1]) * dy) / length2;
            if (u >= -1e-10 && u <= 1 + 1e-10) ts.push(t);
          };
          if (Math.abs(f) < 1e-12) add(lo);
          if (Math.abs(g) < 1e-12) add(hi);
          if (f * g >= 0) continue;
          for (let k = 0; k < 48; k++) {
            const mid = (lo + hi) / 2;
            if (value(mid) >= 0 === f >= 0) lo = mid;
            else hi = mid;
          }
          add((lo + hi) / 2);
        }
      }
  ts.sort((a, b) => a - b);
  const result: {a: Position; b: Position}[] = [];
  for (let i = 1; i < ts.length; i++)
    if (ts[i] - ts[i - 1] > 1e-12 && contains(polygons, at((ts[i] + ts[i - 1]) / 2)))
      result.push({a: at(ts[i - 1]), b: at(ts[i])});
  return result;
}
