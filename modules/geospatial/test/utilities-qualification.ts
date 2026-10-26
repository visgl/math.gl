// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  projectGrid,
  unprojectGrid,
  formatMGRS,
  parseMGRS,
  parseAngle,
  transferGrid,
  parseMGRSZone
} from '../src/coordinates';
import {TriaxialEllipsoid} from '../src/triaxial';
import {EllipsoidGeodesic} from '../src/ellipsoid-geodesic';
import {EllipsoidRhumb} from '../src/ellipsoid-rhumb';
import {GeodesicLineBuffer, RhumbLineBuffer} from '../src/geodesic-buffer';
import native from './utilities-reference.json';
import sampling from './sampling-reference.json';
import g7 from './g7-reference.json';
import workload from './g7-workload.json';
export const provenance = {
  utilities: native.provenance,
  sampling: sampling.provenance,
  lines: g7.provenance
};
type Row = {id: number; mode: string; passed: boolean; budgetUsage: number; error: string};
export function qualifyUtilities(): Row[] {
  const rows: Row[] = [];
  const run = (
    mode: string,
    id: number,
    job: (check: (error: number, budget: number) => void) => void
  ) => {
    const row = {mode, id, passed: true, budgetUsage: 0, error: ''};
    try {
      job((error, budget) => {
        row.passed &&= Number.isFinite(error) && error <= budget;
        row.budgetUsage = Math.max(row.budgetUsage, error / budget);
      });
    } catch (e) {
      row.passed = false;
      row.error = String(e);
      row.budgetUsage = Infinity;
    }
    rows.push(row);
  };
  native.rows.forEach((raw, id) =>
    run(raw.mode, id, check => {
      const r = raw as {
        mode: string;
        latitude?: number;
        longitude?: number;
        precision?: number;
        text?: string;
        zone?: number;
        north?: number;
        grid?: number[];
        expected: (number | string)[] | null;
      };
      if (r.expected === null) {
        let rejected = false;
        try {
          if (r.mode === 'F')
            projectGrid(r.latitude!, r.longitude!, {
              zone: r.zone,
              north: r.north! < 0 ? undefined : !!r.north,
              extended: true
            });
          else if (r.mode === 'T')
            transferGrid(
              {zone: r.grid![0], north: !!r.grid![1], easting: r.grid![2], northing: r.grid![3]},
              {zone: r.zone, north: !!r.north, extended: true}
            );
          else if (r.mode === 'H')
            formatMGRS(r.latitude!, r.longitude!, r.precision, {zone: r.zone});
          else if (r.mode === 'V')
            unprojectGrid(
              {zone: r.grid![0], north: !!r.grid![1], easting: r.grid![2], northing: r.grid![3]},
              {extended: true}
            );
          else if (r.mode === 'Z') parseMGRSZone(r.text!);
          else parseMGRS(r.text!);
        } catch {
          rejected = true;
        }
        check(rejected ? 0 : 1, 0.5);
        return;
      }
      const e = r.expected;
      if (r.mode === 'D') {
        check(Math.abs(parseAngle(r.text!) - Number(e[0])), 2e-12);
        return;
      }
      if (r.mode === 'H') {
        check(
          formatMGRS(r.latitude!, r.longitude!, r.precision, {zone: r.zone}) === e[0] ? 0 : 1,
          0.5
        );
        return;
      }
      if (r.mode === 'V') {
        const p = unprojectGrid(
          {zone: r.grid![0], north: !!r.grid![1], easting: r.grid![2], northing: r.grid![3]},
          {extended: true}
        );
        check(Math.abs(p.latitude - Number(e[0])), 2e-10);
        // Longitude is undefined at a pole: math.gl keeps its documented zero,
        // while native UTMUPS selects 180 at the north UPS origin.
        if (Math.abs(Number(e[0])) === 90) check(p.longitude === 0 ? 0 : 1, 0.5);
        else check(Math.abs(((p.longitude - Number(e[1]) + 540) % 360) - 180), 2e-10);
        return;
      }
      if (r.mode === 'Z') {
        const p = parseMGRSZone(r.text!);
        check(p.zone === e[0] && Number(p.north) === e[1] ? 0 : 1, 0.5);
        return;
      }
      if (r.mode === 'F' || r.mode === 'T') {
        const p =
          r.mode === 'F'
            ? projectGrid(r.latitude!, r.longitude!, {
                zone: r.zone,
                north: r.north! < 0 ? undefined : !!r.north,
                extended: true
              })
            : transferGrid(
                {zone: r.grid![0], north: !!r.grid![1], easting: r.grid![2], northing: r.grid![3]},
                {zone: r.zone, north: !!r.north, extended: true}
              );
        check(p.zone === e[0] && Number(p.north) === e[1] ? 0 : 1, 0.5);
        check(Math.abs(p.easting - Number(e[2])), 5e-7);
        check(Math.abs(p.northing - Number(e[3])), 5e-7);
        if (r.mode === 'F') {
          const inverse = unprojectGrid(p, {extended: true});
          check(Math.abs(inverse.latitude - Number(e[4])), 2e-10);
          if (Math.abs(r.latitude!) !== 90)
            check(Math.abs(((inverse.longitude - Number(e[5]) + 540) % 360) - 180), 2e-10);
        }
        return;
      }
      if (r.mode === 'R') {
        const p = parseMGRS(r.text!);
        check(p.zone === e[0] && Number(p.north) === e[1] ? 0 : 1, 0.5);
        check(Math.abs(p.easting - Number(e[2])), 1e-8);
        check(Math.abs(p.northing - Number(e[3])), 1e-8);
        check(p.precision === e[4] ? 0 : 1, 0.5);
        return;
      }
      const g = projectGrid(r.latitude!, r.longitude!);
      check(g.zone === e[0] && Number(g.north) === e[1] ? 0 : 1, 0.5);
      check(Math.abs(g.easting - Number(e[2])), 5e-7);
      check(Math.abs(g.northing - Number(e[3])), 5e-7);
      const text = formatMGRS(r.latitude!, r.longitude!, r.precision);
      if (r.precision! <= 5) check(text === e[4] ? 0 : 1, 0.5);
      else {
        // Extra digits expose projection roundoff, not extra physical accuracy.
        const actual = parseMGRS(text),
          expected = parseMGRS(String(e[4]));
        check(Math.abs(actual.easting - expected.easting), 5e-7 + actual.resolution);
        check(Math.abs(actual.northing - expected.northing), 5e-7 + actual.resolution);
      }
      const p = parseMGRS(String(e[4]));
      check(Math.abs(p.easting - Number(e[5])), 1e-8);
      check(Math.abs(p.northing - Number(e[6])), 1e-8);
      check(Math.abs(p.latitude - Number(e[7])), 2e-10);
      check(Math.abs(p.longitude - Number(e[8])), 2e-10);
      const inverse = unprojectGrid({
        zone: g.zone,
        north: g.north,
        easting: Number(e[2]),
        northing: Number(e[3])
      });
      check(Math.abs(inverse.latitude - r.latitude!), 2e-10);
      if (Math.abs(r.latitude!) !== 90)
        check(Math.abs(((inverse.longitude - r.longitude! + 540) % 360) - 180), 2e-10);
    })
  );
  sampling.rows.forEach((r, id) =>
    run('surface moments', id, check => {
      const shape = new TriaxialEllipsoid({radii: r.axes as [number, number, number]}),
        sum = [0, 0, 0];
      let seed = 3281971;
      const random = () => {
          seed = (1664525 * seed + 1013904223) >>> 0;
          return seed / 2 ** 32;
        },
        count = 32768;
      for (let i = 0; i < count; i++) {
        const p = shape.sampleSurface(random);
        check(Math.abs(p.reduce((s, x, j) => s + (x / r.axes[j]) ** 2, 0) - 1), 2e-12);
        for (let j = 0; j < 3; j++) sum[j] += (p[j] / r.axes[j]) ** 2;
      }
      for (let j = 0; j < 3; j++)
        check(Math.abs(sum[j] / count - r.normalizedSecondMoments[j]), 0.012);
    })
  );
  for (const [operation, kind] of [
    ['gl', 'geodesic'],
    ['rl', 'rhumb']
  ] as const)
    workload.direct.forEach((r, id) =>
      run('packed ' + kind, id, check => {
        const [lat, lon, azimuth, distance] = r.input,
          axes = {semiMajorAxis: r.axes[0], semiMinorAxis: r.axes[1]};
        const line =
          kind === 'geodesic'
            ? new EllipsoidGeodesic(axes).line(lat, lon, azimuth, {unrollLongitude: true})
            : new EllipsoidRhumb(axes).line(lat, lon, azimuth, {unrollLongitude: true});
        const buffer =
          kind === 'geodesic'
            ? new GeodesicLineBuffer(line as ReturnType<EllipsoidGeodesic['line']>, 1)
            : new RhumbLineBuffer(line as ReturnType<EllipsoidRhumb['line']>, 1);
        const output = buffer.positions([distance], new Float64Array(buffer.stride));
        const fields =
          kind === 'geodesic'
            ? ['lat2', 'lon2', 'azi2', 's12', 'm12', 'M12', 'M21', 'a12']
            : ['lat2', 'lon2'];
        fields.forEach((field, j) => {
          const actual = output[buffer.fields.indexOf(field)],
            expected = g7.operations[operation][id][j];
          const budget = ['s12', 'm12'].includes(field)
            ? 4e-13 * r.axes[0]
            : ['M12', 'M21'].includes(field)
              ? 4e-13
              : ['azi2', 'a12'].includes(field)
                ? 1e-9
                : 2e-10;
          check(Math.abs(actual - expected), budget);
        });
      })
    );
  return rows;
}
