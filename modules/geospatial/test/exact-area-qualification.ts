// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {EllipsoidGeodesicExact, GeodesicPolygonExact} from '@math.gl/geospatial/geodesic-exact';
import native from './exact-area-reference.json';
import independent from './exact-area-independent.json';
export const provenance = {native: native.provenance, independent: independent.provenance};
export function qualifyExactArea() {
  const rows = native.rows.map((raw, id) => {
    const r = raw as {
      mode: string;
      axes: number[];
      input?: number[];
      points?: number[][];
      reverse?: boolean;
      unsigned?: boolean;
      expected: number[];
    };
    const [a, b] = r.axes,
      solver = new EllipsoidGeodesicExact({semiMajorAxis: a, semiMinorAxis: b});
    const checks: {field: string; error: number; budget: number}[] = [];
    let failure = '';
    try {
      let area: number, length: number;
      if (r.mode === 'P') {
        const p = new GeodesicPolygonExact({semiMajorAxis: a, semiMinorAxis: b});
        for (const [lat, lon] of r.points!) p.addPoint(lat, lon);
        const result = p.compute({reverse: r.reverse, unsigned: r.unsigned});
        area = result.area!;
        length = result.perimeter;
      } else {
        const p = r.input!,
          options = {area: true};
        const result =
          r.mode === 'I'
            ? solver.inverse(p[0], p[1], p[2], p[3], options)
            : r.mode === 'A'
              ? solver.line(p[0], p[1], p[2], options).arcPosition(p[3])
              : solver.direct(p[0], p[1], p[2], p[3], options);
        area = result.S12!;
        length = result.s12;
      }
      let error = Math.abs(area / a / a - r.expected[1] / a / a);
      // Unsigned algebraic area is modulo the full surface; at exactly zero,
      // either side of that boundary can be selected by last-bit cancellation.
      if (r.unsigned && Math.abs(r.expected[1] / a / a) < 5e-14)
        error = Math.min(error, Math.abs(error - solver.surfaceArea / a / a));
      checks.push({field: 'area / a²', error, budget: 5e-14 * (r.points?.length ?? 1)});
      checks.push({
        field: 'length / a',
        error: Math.abs(length / a - r.expected[0] / a),
        budget: 4e-13 * (r.points?.length ?? 1)
      });
    } catch (e) {
      failure = String(e);
    }
    return {
      id,
      mode: r.mode,
      checks,
      error: failure,
      passed: !failure && checks.every(c => Number.isFinite(c.error) && c.error <= c.budget),
      budgetUsage: failure ? Infinity : Math.max(...checks.map(c => c.error / c.budget))
    };
  });
  for (const [id, r] of independent.rows.entries()) {
    const solver = new EllipsoidGeodesicExact({semiMajorAxis: 1, semiMinorAxis: r.ratio});
    let value = NaN,
      failure = '';
    try {
      if (r.mode === 'polar')
        value = solver.line(r.latitude!, 20, 45, {area: true}).arcPosition(r.arc!).S12!;
      else if (r.mode === 'edge') value = solver.direct(0, 0, 45, r.distance!, {area: true}).S12!;
      else {
        const d = r.degrees!,
          p = new GeodesicPolygonExact({semiMajorAxis: 1, semiMinorAxis: r.ratio});
        p.addPoint(0, 0)
          .addPoint(0, d)
          .addPoint(r.mode === 'lune' ? 90 : d, 0);
        value = p.compute().area!;
      }
    } catch (e) {
      failure = String(e);
    }
    const budget =
      r.mode === 'lune' || r.mode === 'polar'
        ? 5e-14 * 3
        : r.mode === 'edge'
          ? Math.abs(r.expected) * 2e-8
          : Math.max(r.mode === 'sphere' ? 1e-29 : 1e-27, Math.abs(r.expected) * 2e-8);
    const error = Math.abs(value - r.expected);
    rows.push({
      id,
      mode: r.mode,
      checks: [{field: 'independent area', error, budget}],
      error: failure,
      passed: !failure && Number.isFinite(error) && error <= budget,
      budgetUsage: error / budget
    });
  }
  return rows;
}
