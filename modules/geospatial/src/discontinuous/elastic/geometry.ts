// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {Position} from '../math';
import type {MapSamplingOptions} from '../map-layout';
export type Polygons = Position[][][];
export const rectangle = (w: number, s: number, e: number, n: number): Position[][] => [
  [
    [w, s],
    [e, s],
    [e, n],
    [w, n],
    [w, s]
  ]
];
export function onSegment(p: readonly number[], a: readonly number[], b: readonly number[]) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    l = Math.hypot(dx, dy);
  return (
    l > 0 &&
    Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) <= 1e-8 * l &&
    (p[0] - a[0]) * (p[0] - b[0]) + (p[1] - a[1]) * (p[1] - b[1]) <= 1e-8
  );
}
export function inRing(
  p: readonly number[],
  ring: readonly (readonly number[])[],
  includeBoundary = true
) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j],
      b = ring[i];
    if (onSegment(p, a, b)) return includeBoundary;
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
export const contains = (polygons: Polygons, p: readonly number[]) =>
  polygons.some(rings => inRing(p, rings[0]) && !rings.slice(1).some(r => inRing(p, r, false)));
export const lerp = (a: readonly number[], b: readonly number[], t: number): Position => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t
];
/** Split a sampled source segment at every domain edge, including narrow lobes. */
export function clipSegment(a: Position, b: Position, polygons: Polygons): Position[][] {
  const ts = [0, 1],
    dx = b[0] - a[0],
    dy = b[1] - a[1];
  for (const rings of polygons)
    for (const ring of rings)
      for (let i = 1; i < ring.length; i++) {
        const c = ring[i - 1],
          d = ring[i],
          ex = d[0] - c[0],
          ey = d[1] - c[1],
          det = dx * ey - dy * ex;
        if (Math.abs(det) < 1e-14) continue;
        const t = ((c[0] - a[0]) * ey - (c[1] - a[1]) * ex) / det;
        const u = ((c[0] - a[0]) * dy - (c[1] - a[1]) * dx) / det;
        if (t > 0 && t < 1 && u >= -1e-10 && u <= 1 + 1e-10) ts.push(t);
      }
  ts.sort((a, b) => a - b);
  const result: Position[][] = [];
  for (let i = 1; i < ts.length; i++)
    if (ts[i] - ts[i - 1] > 1e-12 && contains(polygons, lerp(a, b, (ts[i] + ts[i - 1]) / 2)))
      result.push([lerp(a, b, ts[i - 1]), lerp(a, b, ts[i])]);
  return result;
}
export function sampling(options: MapSamplingOptions) {
  const step = options.maxAngularStep ?? 2,
    tolerance = options.tolerance ?? 1e-4;
  if (
    !Number.isFinite(step) ||
    step <= 0 ||
    step > 90 ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0
  )
    throw new Error('Invalid map sampling options');
  return {step, tolerance};
}
export function sample(
  line: Position[],
  project: (p: Position) => Position | null,
  options: MapSamplingOptions,
  cellStep: number
) {
  const {step, tolerance} = sampling(options),
    source: Position[] = [],
    xy: Position[] = [];
  const emit = (p: Position, q: Position) => {
    if (source.length >= 100000) throw new Error('Elastic sampling limit exceeded');
    source.push(p);
    xy.push(q);
  };
  const at = (p: Position) => {
    const q = project(p);
    if (!q) throw new Error('Elastic grid is undefined inside its coverage');
    return q;
  };
  const visit = (a: Position, b: Position, qa: Position, qb: Position, depth: number) => {
    const mid = lerp(a, b, 0.5),
      qm = at(mid),
      chord = lerp(qa, qb, 0.5);
    if (
      Math.hypot(b[0] - a[0], b[1] - a[1]) > Math.min(step, cellStep / 2) ||
      Math.hypot(qm[0] - chord[0], qm[1] - chord[1]) > tolerance
    ) {
      if (depth >= 24) throw new Error('Elastic sampling limit exceeded');
      visit(a, mid, qa, qm, depth + 1);
      visit(mid, b, qm, qb, depth + 1);
    } else emit(b, qb);
  };
  if (line.length) {
    emit(line[0], at(line[0]));
    for (let i = 1; i < line.length; i++)
      visit(line[i - 1], line[i], at(line[i - 1]), at(line[i]), 0);
  }
  return {source, xy};
}

/** Latitude buckets accelerate repeated coverage queries without approximating
 * the published boundary. Narrow cuts retain every original segment. */
export function indexDomain(polygons: Polygons): (p: readonly number[]) => boolean {
  const compiled = polygons.map(rings =>
    rings.map(ring => {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      const bins: Position[][][] = Array.from({length: 64}, () => []);
      const index = (y: number) => Math.max(0, Math.min(63, Math.floor(((y + 90) / 180) * 64)));
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1],
          b = ring[i];
        for (
          let j = index(Math.min(a[1], b[1]) - 1e-8);
          j <= index(Math.max(a[1], b[1]) + 1e-8);
          j++
        )
          bins[j].push([a, b]);
      }
      return (p: readonly number[], inclusive: boolean) => {
        if (p[0] < minX - 1e-8 || p[0] > maxX + 1e-8 || p[1] < minY - 1e-8 || p[1] > maxY + 1e-8)
          return false;
        let inside = false;
        for (const [a, b] of bins[index(p[1])]) {
          if (onSegment(p, a, b)) return inclusive;
          if (
            a[1] > p[1] !== b[1] > p[1] &&
            p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
          )
            inside = !inside;
        }
        return inside;
      };
    })
  );
  return p => compiled.some(rings => rings[0](p, true) && !rings.slice(1).some(r => r(p, false)));
}
