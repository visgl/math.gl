// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independent and pinned-native bounded accuracy workloads.
import {EllipsoidRhumb} from '../../src/ellipsoid-rhumb';
import {RhumbPolygon} from '../../src/rhumb-polygon';
import {GeodesicIntersections} from '../../src/geodesic-intersections';
import {EllipsoidGeodesic} from '../../src/ellipsoid-geodesic';
import reference from '../../test/ellipsoid/g56-reference.json';
export const provenance = reference.provenance;
export function qualifyG56() {
  const rows: {
    id: string;
    family: string;
    budgetUsage: number;
    passed: boolean;
    error?: string;
    nativeAreaDiscrepancy?: number;
  }[] = [];
  const axes = (a: number, b: number) => ({semiMajorAxis: a, semiMinorAxis: b});
  function run(
    id: number,
    family: string,
    body: (check: (v: number, e: number, t: number) => void) => void,
    nativeAreaDiscrepancy?: number
  ) {
    let usage = 0;
    try {
      body((v, e, t) => {
        usage = Math.max(
          usage,
          Number.isFinite(v) && Number.isFinite(e) ? Math.abs(v - e) / t : Infinity
        );
      });
      rows.push({
        id: String(id),
        family,
        budgetUsage: usage,
        passed: usage <= 1,
        ...(nativeAreaDiscrepancy === undefined ? {} : {nativeAreaDiscrepancy})
      });
    } catch (error) {
      rows.push({
        id: String(id),
        family,
        budgetUsage: Infinity,
        passed: false,
        error: String(error)
      });
    }
  }
  reference.inverse.forEach((r, i) =>
    run(i, 'native rhumb inverse', check => {
      const g = new EllipsoidRhumb(axes(r.a, r.b));
      const [x, y, z, w] = r.point;
      const p = g.inverse(x, y, z, w, {area: true});
      check(p.s12, r.expected[0], 5e-14 * r.a);
      if (p.s12) check(p.azi12, r.expected[1], 2e-11);
      check(p.S12!, r.expected[2], 5e-14 * r.a * r.a);
    })
  );
  reference.direct.forEach((r, i) => {
    const independent = 'independentExpected' in r ? r.independentExpected : undefined;
    run(
      i,
      independent ? 'independent polar direct/native discrepancy' : 'native rhumb direct/line',
      check => {
        const g = new EllipsoidRhumb(axes(r.a, r.b));
        const [lat, lon, azi, d] = r.path;
        const expected = independent ?? r.expected;
        for (const p of [
          g.direct(lat, lon, azi, d, {area: true, unrollLongitude: true}),
          g.line(lat, lon, azi, {area: true, unrollLongitude: true}).position(d)
        ]) {
          check(p.lat2, expected[0], 2e-11);
          check((p.lon2 - expected[1]) * Math.cos((p.lat2 * Math.PI) / 180), 0, 2e-11);
          check(p.S12!, expected[2], 5e-14 * r.a * r.a);
        }
      },
      independent ? Math.abs(independent[2] - r.expected[2]) / r.a ** 2 : undefined
    );
  });
  reference.polygons.forEach((r, i) =>
    run(i, 'native rhumb polygons', check => {
      const p = new RhumbPolygon(axes(r.a, r.b));
      r.points.forEach(([lat, lon]) => p.addPoint(lat, lon));
      const result = p.compute();
      check(result.perimeter, r.expected[0], 5e-14 * r.a);
      check(result.area!, r.expected[1], 5e-14 * r.a * r.a);
    })
  );
  reference.independent.forEach((r, i) =>
    run(i, 'independent 80-digit rhumb integrals', check => {
      const [x, y, z, w] = r.point;
      const turns = Math.abs(w) > 180 ? Math.round(w / 360) : 0;
      const p = new EllipsoidRhumb(axes(1, r.ratio)).inverse(x, y, z, w, {
        area: true,
        longitudeTurns: turns
      });
      check(p.s12, r.expected[0], Math.min(5e-14, Math.max(1e-28, Math.abs(r.expected[0]) * 2e-8)));
      check(p.azi12, r.expected[1], 2e-11);
      check(
        p.S12!,
        r.expected[2],
        Math.min(5e-14, Math.max(1e-28, Math.abs(r.expected[2]) * 2e-8))
      );
    })
  );
  reference.intersections.forEach((r, i) =>
    run(i, 'native bounded intersections/counts/residuals', check => {
      const paths = r.paths.map(([latitude, longitude, azimuth]) => ({
        latitude,
        longitude,
        azimuth
      }));
      const g = new GeodesicIntersections(axes(r.a, r.b));
      const result = g.all(paths[0], paths[1], {
        maxDistance: r.maxDistance,
        origin: r.origin as [number, number]
      });
      check(result.intersections.length, r.expected.filter(p => p[2] === 0).length, 0.1);
      const geod = new EllipsoidGeodesic(axes(r.a, r.b));
      for (const expected of r.expected.filter(p => p[2] === 0)) {
        const p = result.intersections.reduce<(typeof result.intersections)[number] | undefined>(
          (best, p) =>
            !best ||
            Math.abs(p.s - expected[0]) + Math.abs(p.t - expected[1]) <
              Math.abs(best.s - expected[0]) + Math.abs(best.t - expected[1])
              ? p
              : best,
          undefined
        );
        if (!p) {
          check(Infinity, 0, 1);
          continue;
        }
        // Parameter conditioning deteriorates as the crossing angle vanishes.
        const conditioning = Math.max(1e-12, Math.sin((p.crossingAngle * Math.PI) / 180));
        check(p.s, expected[0], (5e-14 * r.a) / conditioning);
        check(p.t, expected[1], (5e-14 * r.a) / conditioning);
        check(p.residual, 0, 5e-14 * r.a);
        const a = geod.line(paths[0].latitude, paths[0].longitude, paths[0].azimuth).position(p.s);
        const b = geod.line(paths[1].latitude, paths[1].longitude, paths[1].azimuth).position(p.t);
        check(geod.inverse(a.lat2, a.lon2, b.lat2, b.lon2).s12, 0, 5e-14 * r.a);
      }
      if (r.a !== r.b) check(Number(result.complete), 0, 0.1);
    })
  );
  for (const [i, ratio] of [1, 0.9966471893352525].entries()) {
    for (const longitude of [30, 90, 150])
      run(i * 180 + longitude, 'independent polar crossing angles', check => {
        const g = new GeodesicIntersections(axes(1, ratio));
        const result = g.all(
          {latitude: 0, longitude: 0, azimuth: 0},
          {latitude: 0, longitude, azimuth: 0},
          {maxDistance: 4}
        );
        check(result.intersections.length, 2, 0.1);
        for (const p of result.intersections) {
          check(Math.abs(p.latitude), 90, 2e-11);
          check(p.crossingAngle, Math.min(longitude, 180 - longitude), 2e-11);
          check(p.residual, 0, 5e-14);
        }
      });
  }
  for (const [i, ratio] of [0.5, 0.9966471893352525, 1, 2].entries()) {
    for (const sign of [-1, 1])
      run(2 * i + (sign + 1) / 2, 'independent pole-relative departure', check => {
        const r = new EllipsoidRhumb(axes(1, ratio));
        const latitude = sign * (90 - 2 ** -46),
          distance = -sign * 2e-16;
        for (const p of [
          r.direct(latitude, 0, 0, distance),
          r.line(latitude, 0, 0).position(distance)
        ]) {
          check(Number(Math.abs(p.lat2) < 90 && sign * (p.lat2 - latitude) <= 0), 1, 0.1);
          check(((p.lat2 - latitude) * Math.PI) / 180, distance * ratio, 4e-16);
        }
      });
  }
  run(0, 'independent tiny dateline leg', check => {
    const a = 6378137,
      r = new EllipsoidRhumb(axes(a, a)),
      gap = 2 ** -45;
    const p = r.inverse(0, 180 - gap, 0, -180, {area: true});
    check(p.s12, (a * gap * Math.PI) / 180, 1e-22);
    check(p.azi12, 90, 2e-11);
    check(p.S12!, 0, 1e-28 * a * a);
  });
  run(0, 'native-catalog prolate segment ambiguity', check => {
    const g = new GeodesicIntersections(axes(1, 1.01));
    check(Number(g.segments([10, 0], [-10, 180], [0, 89], [0, 91]).status === 'ambiguous'), 1, 0.1);
    check(
      Number(g.segments([10, 0], [-10, 90], [0, 44], [0, 46]).status === 'intersection'),
      1,
      0.1
    );
  });
  reference.independentDirect.forEach((r, i) =>
    run(i, 'independent 80-digit polar direct rhumbs', check => {
      const scale = 'a' in r ? r.a : 1;
      const [lat, lon, azi, d] = r.path,
        g = new EllipsoidRhumb(axes('a' in r ? r.a : 1, 'b' in r ? r.b : 1));
      for (const p of [
        g.direct(lat, lon, azi, d, {area: true, unrollLongitude: true}),
        g.line(lat, lon, azi, {area: true, unrollLongitude: true}).position(d)
      ]) {
        check(p.lat2, r.expected[0], 2e-11);
        check(p.lon2, r.expected[1], 2e-11);
        check(
          p.S12!,
          r.expected[2],
          Math.min(5e-14 * scale ** 2, Math.max(1e-28, Math.abs(r.expected[2]) * 2e-8))
        );
      }
    })
  );
  return rows;
}
