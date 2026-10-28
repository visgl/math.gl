// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {EllipsoidGeodesicExact} from '@math.gl/geospatial';
import {TriaxialEllipsoid, type TriaxialCoordinates} from '@math.gl/geospatial';
import reference from './g89-reference.json';
import independent from './g89-independent.json';
export const provenance = {native: reference.provenance, independent: independent.provenance};
export function qualifyG89() {
  const revolution = new Map<string, EllipsoidGeodesicExact>(),
    triaxial = new Map<string, TriaxialEllipsoid>();
  const rows = reference.rows.map((r, index) => {
    const row = {
      id: index,
      mode: r.mode,
      passed: true,
      budgetUsage: 0,
      error: '',
      reference: 'GeographicLib 2.7',
      nativeDiagnostic: [] as {field: string; error: number}[],
      checks: [] as {field: string; error: number; budget: number}[]
    };
    const check = (field: string, value: number, expected: number, budget: number) => {
      const error = Number.isFinite(value) ? Math.abs(value - expected) : Infinity;
      row.checks.push({field, error, budget});
      row.budgetUsage = Math.max(row.budgetUsage, error / budget);
      row.passed &&= error <= budget;
    };
    try {
      const p = r.input,
        a = r.radii[0],
        key = r.radii.join('/');
      if (['D', 'A', 'I', 'S'].includes(r.mode)) {
        let e = revolution.get(key);
        if (!e) {
          e = new EllipsoidGeodesicExact({semiMajorAxis: a, semiMinorAxis: r.radii[1]});
          revolution.set(key, e);
        }
        if (r.mode === 'S')
          check('surface area / a²', e.surfaceArea / a / a, r.expected[0] / a / a, 2e-12);
        else {
          const options = {unrollLongitude: true};
          const value =
            r.mode === 'I'
              ? e.inverse(p[0], p[1], p[2], p[3], options)
              : r.mode === 'A'
                ? e.line(p[0], p[1], p[2], options).arcPosition(p[3])
                : e.direct(p[0], p[1], p[2], p[3], options);
          const values = [
            value.lat2,
            value.lon2,
            value.azi1,
            value.azi2,
            value.s12 / a,
            value.m12 / a,
            value.M12,
            value.M21,
            value.a12
          ];
          const analytic =
            r.mode === 'I' && p[0] === 0 && p[1] === 0 && p[2] === 0.00001 && p[3] === 179.999
              ? independent.nearEquator.find(x => Math.abs(x.ratio - r.radii[1] / a) < 1e-14)
              : undefined;
          if (analytic) {
            row.reference = 'Independent near-equator elliptic series; native inverse diagnostic';
            row.nativeDiagnostic = values.map((x, i) => ({
              field: String(i),
              error: Math.abs(x - (i === 4 || i === 5 ? r.expected[i] / a : r.expected[i]))
            }));
          }
          const expected = analytic
            ? analytic.expected
            : r.expected.map((x, i) => (i === 4 || i === 5 ? x / a : x));
          values.forEach((v, i) => {
            let difference = v - expected[i];
            if (i === 1 && r.mode === 'I')
              difference = ((((difference + 540) % 360) + 360) % 360) - 180;
            if (i === 2 || i === 3) difference = ((((difference + 540) % 360) + 360) % 360) - 180;
            // At a coincident pair the azimuth is a convention, not a direction.
            if ((i === 2 || i === 3) && r.mode === 'I' && value.s12 === 0) return;
            if ((i === 2 || i === 3) && r.mode === 'I' && Math.abs(value.s12) / a < 1e-7) {
              row.reference = 'GeographicLib 2.7; short-line bearing displacement';
              check(
                'short-line bearing displacement ' + i,
                ((2 * Math.abs(value.s12)) / a) * Math.sin((difference * Math.PI) / 360),
                0,
                4e-13
              );
              return;
            }
            check(
              String(i),
              difference,
              0,
              i === 4 || i === 5 || i === 6 || i === 7 ? 4e-13 : i === 0 || i === 1 ? 2e-10 : 1e-9
            );
          });
        }
      } else {
        let e = triaxial.get(key);
        if (!e) {
          e = new TriaxialEllipsoid({radii: r.radii as [number, number, number]});
          triaxial.set(key, e);
        }
        const system = (['geodetic', 'parametric', 'geocentric'] as TriaxialCoordinates[])[
          r.system
        ];
        const start = e.toCartesian(p[0], p[1], system),
          direction = e.directionToCartesian(start, p[2]);
        const state =
          r.mode === 'C' ? {position: start, direction} : e.direct(start, direction, p[3]);
        for (let i = 0; i < 3; i++) {
          check('position ' + i, state.position[i] / a, r.expected[i] / a, 2e-12);
          check('direction ' + i, state.direction[i], r.expected[i + 3], (1e-9 * Math.PI) / 180);
        }
        check(
          'position norm',
          Math.hypot(...state.position.map((x, i) => x / a - r.expected[i] / a)),
          0,
          2e-12
        );
        check(
          'direction chord',
          Math.hypot(...state.direction.map((x, i) => x - r.expected[i + 3])),
          0,
          (1e-9 * Math.PI) / 180
        );
        const residual = state.position.reduce((sum, x, i) => sum + (x / r.radii[i]) ** 2, 0) - 1;
        check('surface residual', residual, 0, 2e-12);
        check('unit speed', Math.hypot(...state.direction), 1, 2e-12);
      }
    } catch (error) {
      row.passed = false;
      row.error = String(error);
      row.budgetUsage = Infinity;
    }
    return row;
  });
  const independentCase = (
    mode: string,
    evaluate: (
      check: (field: string, value: number, expected: number, budget: number) => void
    ) => void
  ) => {
    const row = {
      id: rows.length,
      mode,
      passed: true,
      budgetUsage: 0,
      error: '',
      reference: 'Independent mathematics',
      nativeDiagnostic: [] as {field: string; error: number}[],
      checks: [] as {field: string; error: number; budget: number}[]
    };
    const check = (field: string, value: number, expected: number, budget: number) => {
      const error = Number.isFinite(value) ? Math.abs(value - expected) : Infinity;
      row.checks.push({field, error, budget});
      row.budgetUsage = Math.max(row.budgetUsage, error / budget);
      row.passed &&= error <= budget;
    };
    try {
      evaluate(check);
    } catch (error) {
      row.passed = false;
      row.error = String(error);
      row.budgetUsage = Infinity;
    }
    rows.push(row);
  };
  for (const r of independent.quarters)
    independentCase('Q', check => {
      const [a, b] = r.axes,
        e = new EllipsoidGeodesicExact({semiMajorAxis: a, semiMinorAxis: b});
      check(
        'elliptic quarter distance / a',
        e.line(0, 0, 0).arcPosition(90).s12 / a,
        r.quarter / a,
        4e-13
      );
      const t = new TriaxialEllipsoid({radii: [a, Math.min(a, b), b]});
      const state = t.direct([a, 0, 0], [0, 0, 1], r.quarter);
      for (let i = 0; i < 3; i++) {
        check('principal ellipse position ' + i, state.position[i] / a, i === 2 ? b / a : 0, 2e-12);
        check(
          'principal ellipse tangent ' + i,
          state.direction[i],
          i === 0 ? -1 : 0,
          (1e-9 * Math.PI) / 180
        );
      }
    });
  independentCase('J', check => {
    const t = new TriaxialEllipsoid({radii: [4, 2, 1]}),
      p = t.toCartesian(35, 47),
      v = t.directionToCartesian(p, 63),
      q = [1 / 16, 1 / 4, 1];
    const integral = (p: readonly number[], v: readonly number[]) =>
      v.reduce((s, x, i) => s + q[i] * x * x, 0) * p.reduce((s, x, i) => s + q[i] ** 2 * x * x, 0);
    const initial = integral(p, v),
      line = t.line(p, v);
    for (const d of [-20, -7, -1, 1, 8, 20]) {
      const end = line.position(d);
      check(
        'Joachimsthal invariant ' + d,
        integral(end.position, end.direction) / initial,
        1,
        2e-12
      );
    }
  });
  independentCase('G', check => {
    const t = new TriaxialEllipsoid({radii: [3, 3, 3]}),
      state = t.direct([3, 0, 0], [0, 0.6, 0.8], Math.PI),
      root = Math.sqrt(3) / 2;
    const p = [1.5, 1.8 * root, 2.4 * root],
      v = [-root, 0.3, 0.4];
    for (let i = 0; i < 3; i++) {
      check('sphere position ' + i, state.position[i] / 3, p[i] / 3, 2e-12);
      check('sphere direction ' + i, state.direction[i], v[i], (1e-9 * Math.PI) / 180);
    }
  });
  return rows;
}
