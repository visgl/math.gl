// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original native count/ranking controls and independent meridian/conjugate identities.
import {
  GeodesicIntersections,
  type GeodesicPath,
  type IntersectionPoint
} from '../../src/geodesic-intersections';
import {EllipsoidGeodesic} from '../../src/ellipsoid-geodesic';
import reference from '../../test/ellipsoid/g6-reference.json';
export const provenance = reference.provenance;
type Axes = {a: number; b: number};
type AllRow = Axes & {
  mode: 'A';
  paths?: number[][];
  pathsGenerated?: number[][];
  maxDistance: number;
  origin: number[];
  expected: number[][];
  closest: number[];
};
type NextRow = Axes & {mode: 'N'; shared: number[]; expected: number[]};
type SegmentRow = Axes & {mode: 'S'; points: number[][]; expected: number[]};
const axes = (r: Axes) => ({semiMajorAxis: r.a, semiMinorAxis: r.b});
const paths = (p: number[][]) =>
  p.map(([latitude, longitude, azimuth]) => ({latitude, longitude, azimuth}));
export function qualifyG6() {
  const rows: {id: string; family: string; budgetUsage: number; passed: boolean; error?: string}[] =
    [];
  const run = (
    id: number,
    family: string,
    body: (check: (a: number, b: number, t: number) => void) => void
  ) => {
    let usage = 0;
    try {
      body((a, b, t) => {
        usage = Math.max(
          usage,
          Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) / t : Infinity
        );
      });
      rows.push({id: String(id), family, budgetUsage: usage, passed: usage <= 1});
    } catch (error) {
      rows.push({
        id: String(id),
        family,
        budgetUsage: Infinity,
        passed: false,
        error: String(error)
      });
    }
  };
  const residual = (
    g: EllipsoidGeodesic,
    a: GeodesicPath,
    b: GeodesicPath,
    p: IntersectionPoint,
    unit: number,
    check: (a: number, b: number, t: number) => void
  ) => {
    const x = g.line(a.latitude, a.longitude, a.azimuth).position(p.s),
      y = g.line(b.latitude, b.longitude, b.azimuth).position(p.t);
    check(g.inverse(x.lat2, x.lon2, y.lat2, y.lon2).s12, 0, 5e-14 * unit);
    check(p.residual, 0, 5e-14 * unit);
  };
  for (const [i, r] of (
    reference.native as unknown as (AllRow | NextRow | SegmentRow)[]
  ).entries()) {
    run(
      i,
      r.mode === 'A'
        ? 'native global all/closest'
        : r.mode === 'N'
          ? 'native global next/conjugates'
          : 'native complete segments',
      check => {
        const g = new GeodesicIntersections(axes(r)),
          geod = new EllipsoidGeodesic(axes(r));
        if (r.mode === 'A') {
          const [a, b] = paths(r.paths ?? r.pathsGenerated!);
          const origin = r.origin as [number, number];
          const report = g.all(a, b, {maxDistance: r.maxDistance, origin});
          check(Number(report.complete), 1, 0.1);

          const margin =
            Math.PI * Math.sqrt(geod.surfaceArea / (4 * Math.PI)) * Number.EPSILON ** 0.2;
          const offset = (p: number[]) => p[1] - p[2] * p[0];
          const lines: number[][] = [];
          for (const p of r.expected.filter(p => p[2] !== 0))
            if (!lines.some(q => q[2] === p[2] && Math.abs(offset(q) - offset(p)) <= margin))
              lines.push(p);
          const isolated = r.expected.filter(
            p => p[2] === 0 && !lines.some(q => Math.abs(p[1] - q[2] * p[0] - offset(q)) <= margin)
          );
          check(report.intersections.length, isolated.length, 0.1);
          check(report.coincidences.length, lines.length, 0.1);
          for (const p of report.intersections) {
            const expected = isolated.reduce<number[] | undefined>(
              (best, q) =>
                !best ||
                Math.abs(p.s - q[0]) + Math.abs(p.t - q[1]) <
                  Math.abs(p.s - best[0]) + Math.abs(p.t - best[1])
                  ? q
                  : best,
              undefined
            );
            if (!expected) {
              check(Infinity, 0, 1);
              continue;
            }
            const conditioning = Math.max(1e-12, Math.sin((p.crossingAngle * Math.PI) / 180));
            check(p.s, expected[0], (5e-14 * r.a) / conditioning);
            check(p.t, expected[1], (5e-14 * r.a) / conditioning);
            residual(geod, a, b, p, r.a, check);
          }
          for (const c of report.coincidences) {
            const line = lines.find(
              q => q[2] === c.direction && Math.abs(c.t - c.direction * c.s - offset(q)) <= margin
            );
            if (!line) {
              check(Infinity, 0, 1);
              continue;
            }
            check(c.t - c.direction * c.s, offset(line), 5e-14 * r.a);
            const p = geod.line(a.latitude, a.longitude, a.azimuth).position(c.s),
              q = geod.line(b.latitude, b.longitude, b.azimuth).position(c.t);
            check(geod.inverse(p.lat2, p.lon2, q.lat2, q.lon2).s12, 0, 5e-14 * r.a);
            check(
              Math.max(0, Math.abs(c.s - origin[0]) + Math.abs(c.t - origin[1]) - r.maxDistance),
              0,
              5e-14 * r.a
            );
          }
          const closest = g.closest(a, b, {origin});
          check(Number(closest.complete), 1, 0.1);
          if (!closest.intersection) {
            check(Infinity, 0, 1);
            return;
          }
          const p = closest.intersection,
            conditioning = Math.max(1e-12, Math.sin((p.crossingAngle * Math.PI) / 180));
          check(
            Math.abs(p.s - origin[0]) + Math.abs(p.t - origin[1]),
            Math.abs(r.closest[0] - origin[0]) + Math.abs(r.closest[1] - origin[1]),
            (5e-14 * r.a) / conditioning
          );
          check(p.coincidence ?? 0, r.closest[2], 0.1);
          residual(geod, a, b, p, r.a, check);
        } else if (r.mode === 'N') {
          const [lat, lon, az, bz] = r.shared;
          const result = g.next(lat, lon, az, bz);
          check(Number(result.complete), 1, 0.1);
          if (!result.intersection) {
            check(Infinity, 0, 1);
            return;
          }
          const p = result.intersection,
            conditioning = Math.max(1e-12, Math.sin((p.crossingAngle * Math.PI) / 180));
          check(
            Math.abs(p.s) + Math.abs(p.t),
            Math.abs(r.expected[0]) + Math.abs(r.expected[1]),
            (5e-14 * r.a) / conditioning
          );
          check(p.coincidence ?? 0, r.expected[2], 0.1);
          residual(
            geod,
            {latitude: lat, longitude: lon, azimuth: az},
            {latitude: lat, longitude: lon, azimuth: bz},
            p,
            r.a,
            check
          );
        } else {
          const [a, b, c, d] = r.points as [number, number][];
          const result = g.segments(a, b, c, d);
          check(Number(result.complete), 1, 0.1);
          const mode = r.expected[3],
            coincidence = r.expected[2];
          if (mode === 0) {
            check(Number(result.status === (coincidence ? 'overlap' : 'intersection')), 1, 0.1);
            if (result.status === 'intersection') {
              const p = result.point,
                ia = geod.inverse(...a, ...b),
                ib = geod.inverse(...c, ...d);
              check(Math.max(0, -p.s, p.s - ia.s12, -p.t, p.t - ib.s12), 0, 5e-14 * r.a);
              residual(
                geod,
                {latitude: a[0], longitude: a[1], azimuth: ia.azi1},
                {latitude: c[0], longitude: c[1], azimuth: ib.azi1},
                p,
                r.a,
                check
              );
            }
          } else check(Number(result.status === 'disjoint'), 1, 0.1);
        }
      }
    );
  }
  for (const [i, r] of reference.independent.entries())
    run(i, 'independent meridian lattice/conjugates', check => {
      const g = new GeodesicIntersections(axes(r));
      if (r.mode === 'meridians') {
        const [a, b] = paths(r.paths!);
        const result = g.all(a, b, {
          maxDistance: r.maxDistance!,
          origin: r.origin as [number, number]
        });
        check(Number(result.complete), 1, 0.1);
        check(result.intersections.length, r.expected!.length, 0.1);
        for (const p of result.intersections) {
          const q = r.expected!.reduce((best, q) =>
            Math.abs(p.s - q[0]) + Math.abs(p.t - q[1]) <
            Math.abs(p.s - best[0]) + Math.abs(p.t - best[1])
              ? q
              : best
          );
          check(p.s, q[0], 5e-14 * r.a);
          check(p.t, q[1], 5e-14 * r.a);
          check(p.residual, 0, 5e-14 * r.a);
        }
      } else {
        const result = r.mode === 'pole-next' ? g.next(90, 0, 0, 180) : g.next(0, 0, 90, 90);
        check(Number(result.complete), 1, 0.1);
        if (!result.intersection) {
          check(Infinity, 0, 1);
          return;
        }
        check(
          Math.abs(result.intersection.s) + Math.abs(result.intersection.t),
          r.distance!,
          5e-14 * r.a
        );
      }
    });
  return rows;
}
