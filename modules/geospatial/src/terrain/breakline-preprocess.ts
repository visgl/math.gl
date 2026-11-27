// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {TerrainBreakline, TerrainBreaklinePoint} from './breakline-mesh';

/** Split a set of XYZ constraints at crossings and T-junctions. */
export function splitTerrainBreaklines(
  input: readonly TerrainBreakline[],
  options: {heightTolerance?: number; maxPairTests?: number; maxSegments?: number} = {}
): {segments: TerrainBreakline[]; sourceSegments: Uint32Array} {
  const {heightTolerance = 1e-8, maxPairTests = 2_100_000, maxSegments = 2048} = options;
  if (
    !Number.isFinite(heightTolerance) ||
    heightTolerance < 0 ||
    ![maxPairTests, maxSegments].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 0xffffffff)
  )
    throw new Error('Invalid breakline split limits');
  if (input.length > maxSegments || (input.length * (input.length - 1)) / 2 > maxPairTests)
    throw new Error('Breakline preprocessing work limit exceeded');
  type Knot = {t: number; point: TerrainBreaklinePoint};
  const vertices = new Map<string, TerrainBreaklinePoint>();
  const canonical = (p: TerrainBreaklinePoint): TerrainBreaklinePoint => {
    if (!p.every(Number.isFinite)) throw new Error('Invalid breakline vertex');
    const key = `${p[0]},${p[1]}`;
    const prior = vertices.get(key);
    if (prior) {
      if (Math.abs(prior[2] - p[2]) > heightTolerance)
        throw new Error('Conflicting breakline heights');
      return prior;
    }
    const point: TerrainBreaklinePoint = [...p];
    vertices.set(key, point);
    return point;
  };
  const lines = input.map(([a, b]) => {
    const p = canonical(a),
      q = canonical(b);
    if (p === q) throw new Error('Zero-length breakline');
    const knots: Knot[] = [
      {t: 0, point: p},
      {t: 1, point: q}
    ];
    return {p, q, dx: q[0] - p[0], dy: q[1] - p[1], knots};
  });
  let count = input.length;
  const add = (knots: Knot[], t: number, point: TerrainBreaklinePoint) => {
    if (knots.some(k => k.point === point)) return;
    if (knots.some(k => k.t === t))
      throw new Error('Unresolved coincident breakline intersections');
    if (++count > maxSegments) throw new Error('Breakline output limit exceeded');
    knots.push({t, point});
  };
  const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx;
  for (let i = 0; i < lines.length; i++) {
    const a = lines[i];
    for (let j = i + 1; j < lines.length; j++) {
      const b = lines[j];
      const x = b.p[0] - a.p[0],
        y = b.p[1] - a.p[1];
      const det = cross(a.dx, a.dy, b.dx, b.dy);
      const u = cross(x, y, a.dx, a.dy),
        t = cross(x, y, b.dx, b.dy);
      if (![det, u, t].every(Number.isFinite)) throw new Error('Breakline intersection overflow');
      if (det === 0) {
        if (u !== 0 || t !== 0) continue;
        const axis = Math.abs(a.dx) >= Math.abs(a.dy) ? 0 : 1;
        if (
          Math.max(Math.min(a.p[axis], a.q[axis]), Math.min(b.p[axis], b.q[axis])) <
          Math.min(Math.max(a.p[axis], a.q[axis]), Math.max(b.p[axis], b.q[axis]))
        )
          throw new Error('Overlapping collinear breaklines');
        continue;
      }
      const fa = t / det,
        fb = u / det;
      if (fa < 0 || fa > 1 || fb < 0 || fb > 1) continue;
      const za = (1 - fa) * a.p[2] + fa * a.q[2],
        zb = (1 - fb) * b.p[2] + fb * b.q[2];
      if (!Number.isFinite(za) || !Number.isFinite(zb) || Math.abs(za - zb) > heightTolerance)
        throw new Error('Conflicting breakline heights at intersection');
      const point = canonical(
        fa === 0
          ? a.p
          : fa === 1
            ? a.q
            : fb === 0
              ? b.p
              : fb === 1
                ? b.q
                : [a.p[0] + fa * a.dx, a.p[1] + fa * a.dy, za]
      );
      add(a.knots, fa, point);
      add(b.knots, fb, point);
    }
  }
  const segments: TerrainBreakline[] = [];
  const sourceSegments = new Uint32Array(count);
  for (let i = 0; i < lines.length; i++) {
    const knots = lines[i].knots.sort((a, b) => a.t - b.t);
    for (let j = 1; j < knots.length; j++) {
      sourceSegments[segments.length] = i;
      segments.push([knots[j - 1].point, knots[j].point]);
    }
  }
  return {segments, sourceSegments};
}
