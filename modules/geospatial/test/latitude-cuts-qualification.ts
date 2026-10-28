// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  clipGeographicPolyline,
  clipGeographicPolygon,
  subdivideGeographicCutRing
} from '../src/geographic-cuts';
import reference from './geographic-cuts-reference.json';
export const provenance = reference.provenance;
export function qualifyLatitudeCuts() {
  const rows: {id: number; mode: string; passed: boolean; budgetUsage: number; error: string}[] =
    [];
  const run = (mode: string, job: (check: (error: number, budget: number) => void) => void) => {
    let usage = 0,
      error = '';
    try {
      job((e, b) => {
        usage = Math.max(usage, e / b);
      });
    } catch (e) {
      usage = Infinity;
      error = String(e);
    }
    rows.push({
      id: rows.length,
      mode,
      passed: Number.isFinite(usage) && usage <= 1,
      budgetUsage: usage,
      error
    });
  };
  for (const r of reference.rows)
    run('native ' + r.edgeModel, check => {
      const parts = clipGeographicPolyline([...r.start, ...r.end], {
        edgeModel: r.edgeModel as 'geodesic' | 'rhumb',
        latitudeRange: r.latitudeRange as [number, number],
        ellipsoid: {semiMajorAxis: r.axes[0], semiMinorAxis: r.axes[1]},
        longitudeTurns: [r.turns]
      });
      const fragments = parts
        .flatMap(p =>
          p.edges.map((s, i) => ({
            lo: s.startFraction,
            hi: s.endFraction,
            a: [p.positions[2 * i], p.positions[2 * i + 1]],
            b: [p.positions[2 * i + 2], p.positions[2 * i + 3]]
          }))
        )
        .sort((a, b) => a.lo - b.lo);
      const merged: typeof fragments = [];
      for (const p of fragments) {
        const previous = merged[merged.length - 1];
        if (previous && Math.abs(previous.hi - p.lo) < 2e-14) {
          previous.hi = p.hi;
          previous.b = p.b;
        } else merged.push({...p});
      }
      check(Math.abs(merged.length - r.expected.intervals.length), 0.5);
      r.expected.intervals.forEach((e, i) => {
        const p = merged[i];
        if (!p) throw new Error('Missing native visible interval');
        check((Math.abs(p.lo - e[0]) * r.expected.distance) / r.axes[0], 2e-12);
        check((Math.abs(p.hi - e[1]) * r.expected.distance) / r.axes[0], 2e-12);
        for (const [point, lat, lon] of [
          [p.a, e[2], e[3]],
          [p.b, e[4], e[5]]
        ] as [number[], number, number][]) {
          check(Math.abs(point[1] - lat), 1e-10);
          const delta = ((((point[0] - lon) % 360) + 540) % 360) - 180;
          check(Math.abs(delta * Math.cos((lat * Math.PI) / 180)), 1e-10);
        }
      });
    });
  const area = (polygons: ReturnType<typeof clipGeographicPolygon>) =>
    polygons.reduce(
      (sum, p) =>
        sum +
        p.rings.reduce((sum, r) => {
          let a = 0;
          for (let i = 2; i < r.positions.length; i += 2)
            a += r.positions[i - 2] * r.positions[i + 1] - r.positions[i] * r.positions[i - 1];
          return sum + a / 2;
        }, 0),
      0
    );
  for (const shift of [-180, -70, 0, 70, 180])
    run('independent linear filled area', check => {
      const p = clipGeographicPolygon(
        [
          {positions: [shift - 40, -40, shift + 40, -40, shift + 40, 40, shift - 40, 40]},
          {positions: [shift - 10, -30, shift + 10, -30, shift + 10, 10, shift - 10, 10]}
        ],
        {edgeModel: 'linear', latitudeRange: [0, 30]}
      );
      check(Math.abs(area(p) - (80 * 30 - 20 * 10)), 1e-8);
    });
  // Independent sphere great-circle latitude: tan(phi_max)=tan(phi0)/cos(deltaLongitude/2).
  for (const latitude of [10, 30, 50])
    run('independent spherical latitude maximum', check => {
      const max =
        (Math.atan(Math.tan((latitude * Math.PI) / 180) / Math.cos(Math.PI / 3)) * 180) / Math.PI;
      const p = clipGeographicPolyline([-60, latitude, 60, latitude], {
        edgeModel: 'geodesic',
        ellipsoid: {semiMajorAxis: 1, semiMinorAxis: 1},
        latitudeRange: [latitude + 1, 90]
      });
      check(
        Math.abs(
          Math.max(...p.flatMap(p => Array.from(p.positions).filter((_, i) => i % 2 === 1))) - max
        ),
        1e-10
      );
    });
  for (const edgeModel of ['geodesic', 'rhumb'] as const)
    run('polar orthographic parallel ' + edgeModel, check => {
      const a = 6378137,
        b = 6356752.314245179,
        e2 = 1 - (b / a) ** 2,
        inputs = [{positions: [-60, -20, 60, -20, 60, 60, -60, 60]}];
      const options = {
        edgeModel,
        latitudeRange: [20, 90] as const,
        ellipsoid: {semiMajorAxis: a, semiMinorAxis: b}
      };
      const transform = ([lon, lat]: readonly number[]) => {
        const p = (lat * Math.PI) / 180,
          l = (lon * Math.PI) / 180,
          r = Math.abs(lat) === 90 ? 0 : (a * Math.cos(p)) / Math.sqrt(1 - e2 * Math.sin(p) ** 2);
        return [r * Math.sin(l), -r * Math.cos(l)];
      };
      const phi = (20 * Math.PI) / 180,
        radius = (a * Math.cos(phi)) / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
      let count = 0;
      for (const polygon of clipGeographicPolygon(inputs, options))
        for (const ring of polygon.rings) {
          const p = subdivideGeographicCutRing(inputs, ring, {
            ...options,
            transform,
            tolerance: 100,
            maxSegmentLength: 200000,
            maxDepth: 24
          });
          for (let i = 0; i < p.edges.length; i++)
            if (p.edges[i].kind === 'parallel') {
              count++;
              check(
                Math.abs(Math.hypot(p.positions[2 * i], p.positions[2 * i + 1]) - radius) / a,
                2e-12
              );
              const delta =
                ((p.sourcePositions[2 * i + 2] - p.sourcePositions[2 * i]) * Math.PI) / 180;
              check(radius * (1 - Math.cos(delta / 2)), 100 + a * 2e-12);
            }
        }
      if (!count) throw new Error('No sampled parallel closure');
    });
  return rows;
}
