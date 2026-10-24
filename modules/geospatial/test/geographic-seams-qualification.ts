// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original native/independent C5-C6 matrix shared by Node and browser qualification.
import {EllipsoidRhumb} from '../src/ellipsoid-rhumb';
import {EllipsoidGeodesic} from '../src/ellipsoid-geodesic';
import {RhumbPath} from '../src/rhumb-path';
import {splitGeographicPolyline, splitGeographicPolygon} from '../src/geographic-seams';
import reference from './ellipsoid/geographic-seam-reference.json';
export const provenance = reference.provenance;
export type SeamQualificationRow = {
  id: string;
  family: string;
  passed: boolean;
  maxBudgetUsage: number;
  checks: {name: string; actual: number; expected: number; budget: number}[];
  error?: string;
};
const DEG = Math.PI / 180;
const points = (p: ArrayLike<number>) =>
  Array.from({length: p.length / 2}, (_, i) => [p[2 * i], p[2 * i + 1]]);
export function qualifyGeographicSeams(): SeamQualificationRow[] {
  const rows: SeamQualificationRow[] = [];
  const run = (
    family: string,
    id: string,
    evaluate: (
      check: (name: string, actual: number, expected: number, budget: number) => void
    ) => void
  ): void => {
    const row: SeamQualificationRow = {id, family, passed: true, maxBudgetUsage: 0, checks: []};
    const check = (name: string, actual: number, expected: number, budget: number): void => {
      row.checks.push({name, actual, expected, budget});
      const usage = Number.isFinite(actual)
        ? budget === 0
          ? actual === expected
            ? 0
            : Infinity
          : Math.abs(actual - expected) / budget
        : Infinity;
      row.maxBudgetUsage = Math.max(row.maxBudgetUsage, usage);
      row.passed &&= usage <= 1;
    };
    try {
      evaluate(check);
    } catch (error) {
      row.passed = false;
      row.error = String(error);
    }
    rows.push(row);
  };
  reference.rhumb.forEach((r, i) => {
    const rhumb = new EllipsoidRhumb({semiMajorAxis: r.axes[0], semiMinorAxis: r.axes[1]});
    run('native rhumb adapter', String(i), check => {
      const path = new RhumbPath(r.start, r.end, {rhumb}),
        p = path.sample(r.fraction);
      check('longitude', p[0], r.position[0], 2e-10);
      check('latitude', p[1], r.position[1], 2e-10);
      check('axis-normalized distance', path.length / r.axes[0], r.distance / r.axes[0], 4e-13);
      const distance = path.sampleByDistance(path.length * r.fraction);
      check('distance longitude', distance[0], r.position[0], 2e-10);
      check('distance latitude', distance[1], r.position[1], 2e-10);
    });
    run('native rhumb seam', String(i), check => {
      const parts = splitGeographicPolyline([...r.start, ...r.end], {
        edgeModel: 'rhumb',
        rhumb,
        seamLongitude: r.position[0]
      });
      const part = parts[0],
        p = points(part.positions)[part.positions.length / 2 - 1];
      check('latitude', p[1], r.position[1], 2e-10);
      check('original fraction', part.edges[part.edges.length - 1].endFraction, r.fraction, 2e-13);
    });
  });
  reference.geodesic.forEach((r, i) => {
    const delta = (x: number) => Math.abs(((x + 540) % 360) - 180);
    if (delta(r.position[0] - r.start[0]) < 1e-6 || delta(r.position[0] - r.end[0]) < 1e-6) return;
    run('native geodesic seam', String(i), check => {
      const parts = splitGeographicPolyline([...r.start, ...r.end], {
        edgeModel: 'geodesic',
        geodesic: new EllipsoidGeodesic({semiMajorAxis: r.axes[0], semiMinorAxis: r.axes[1]}),
        seamLongitude: r.position[0]
      });
      const cuts = parts
        .flatMap(part =>
          part.edges.map((edge, j) => ({edge, point: points(part.positions)[j + 1]}))
        )
        .filter(
          c =>
            Math.abs(c.point[0] - r.position[0]) < 1e-12 ||
            Math.abs(c.point[0] - r.position[0] + 360) < 1e-12
        );
      const cut = cuts.reduce<(typeof cuts)[number] | undefined>(
        (best, c) =>
          !best ||
          Math.abs(c.edge.endFraction - r.fraction) < Math.abs(best.edge.endFraction - r.fraction)
            ? c
            : best,
        undefined
      );
      if (!cut) throw new Error('Missing native seam root');
      const sine = Math.abs(Math.sin(r.azimuth * DEG)),
        phi = r.position[1] * DEG,
        ratio = r.axes[1] / r.axes[0];
      const meridian =
        (r.axes[0] * ratio * ratio) /
        (Math.cos(phi) ** 2 + ratio * ratio * Math.sin(phi) ** 2) ** 1.5;
      check(
        'transverse position metres',
        Math.abs(cut.point[1] - r.position[1]) * DEG * meridian * sine,
        0,
        1e-6
      );
      check(
        'transverse parameter metres',
        Math.abs(cut.edge.endFraction - r.fraction) * r.distance * sine,
        0,
        1e-6
      );
      if (sine >= 0.01) {
        check('ordinary latitude', cut.point[1], r.position[1], 2e-10);
        check('ordinary fraction', cut.edge.endFraction, r.fraction, 2e-13);
      }
    });
  });
  const sphere = new EllipsoidRhumb({semiMajorAxis: 1, semiMinorAxis: 1});
  const geodesic = new EllipsoidGeodesic({semiMajorAxis: 1, semiMinorAxis: 1});
  run('independent sphere', 'rhumb parallel and winding', check => {
    const path = new RhumbPath([0, 30], [0, 30], {rhumb: sphere, longitudeTurns: 1});
    check('circumference', path.length, 2 * Math.PI * Math.cos(Math.PI / 6), 2e-14);
    check('half longitude', path.sample(0.5)[0], 180, 2e-12);
  });
  run('independent sphere', 'great-circle seam', check => {
    const parts = splitGeographicPolyline([170, 30, -170, 30], {edgeModel: 'geodesic', geodesic});
    const p = points(parts[0].positions)[parts[0].positions.length / 2 - 1];
    check(
      'great-circle latitude',
      p[1],
      Math.atan(Math.tan(Math.PI / 6) / Math.cos(Math.PI / 18)) / DEG,
      2e-10
    );
  });
  run('independent topology', 'hole notches and area', check => {
    const result = splitGeographicPolygon(
      [
        {positions: [170, -20, 190, -20, 190, 20, 170, 20]},
        {positions: [175, -5, 185, -5, 185, 5, 175, 5]}
      ],
      {edgeModel: 'linear'}
    );
    check('components', result.length, 2, 0);
    let area = 0;
    for (const polygon of result) {
      check('rings', polygon.rings.length, 1, 0);
      const ring = polygon.rings[0],
        p = points(ring.positions);
      let sum = 0;
      for (let j = 1; j < p.length; j++) sum += p[j - 1][0] * p[j][1] - p[j][0] * p[j - 1][1];
      area += Math.abs(sum / 2);
      check('source holes', Number(ring.edges.some(e => e?.ringIndex === 1)), 1, 0);
      check('generated boundaries', Number(ring.edges.some(e => e === null)), 1, 0);
    }
    check('filled area', area, 700, 1e-9);
  });
  for (const pole of ['north', 'south'] as const)
    run('independent sphere', pole + ' cap', check => {
      const sign = pole === 'north' ? 1 : -1;
      const result = splitGeographicPolygon(
        [{positions: [-135, sign * 60, -45, sign * 60, 45, sign * 60, 135, sign * 60], pole}],
        {edgeModel: 'rhumb', rhumb: sphere}
      );
      let integral = 0;
      for (const polygon of result)
        for (const ring of polygon.rings) {
          const p = points(ring.positions);
          for (let j = 1; j < p.length; j++)
            if (p[j - 1][1] === p[j][1])
              integral += (p[j][0] - p[j - 1][0]) * DEG * Math.sin(p[j][1] * DEG);
        }
      check('surface area', Math.abs(integral), 2 * Math.PI * (1 - Math.sin(Math.PI / 3)), 2e-12);
    });
  return rows;
}
