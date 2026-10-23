// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original bounded qualification workload; not a universal accuracy proof.
import {EllipsoidMetrics, type AuxiliaryLatitude} from '../../src/ellipsoid-metrics';
import {EllipsoidGeodesic} from '../../src/ellipsoid-geodesic';
import {GeodesicPolygon} from '../../src/geodesic-polygon';
import reference from '../../test/ellipsoid/g34-reference.json';
const kinds: AuxiliaryLatitude[] = [
  'geocentric',
  'parametric',
  'rectifying',
  'authalic',
  'conformal',
  'isometric'
];
export const provenance = reference.provenance;

export function qualifyG34() {
  const rows: {
    id: string;
    family: string;
    budgetUsage: number;
    passed: boolean;
    nativeAreaDiscrepancy?: number;
  }[] = [];
  let usage = 0,
    finite = true;
  const check = (a: number, b: number, t: number) => {
    if (a === b) return;
    finite &&= Number.isFinite(a) && Number.isFinite(b);
    usage = Math.max(usage, Math.abs(a - b) / t);
  };
  const finish = (id: string, family: string, discrepancy?: number) => {
    rows.push({
      id,
      family,
      budgetUsage: usage,
      passed: finite && usage <= 1,
      ...(discrepancy === undefined ? {} : {nativeAreaDiscrepancy: discrepancy})
    });
    usage = 0;
    finite = true;
  };
  for (const [i, r] of reference.metrics.entries()) {
    const m = new EllipsoidMetrics({semiMajorAxis: r.a, semiMinorAxis: r.b});
    const actual = [
      m.surfaceArea,
      m.volume,
      m.quarterMeridian,
      m.meridianDistance(r.latitude),
      m.meridionalCurvatureRadius(r.latitude),
      m.transverseCurvatureRadius(r.latitude),
      m.normalCurvatureRadius(r.latitude, 37)
    ];
    const scales = [r.a ** 2, r.a ** 3, r.a, r.a, r.a, r.a, r.a];
    actual.forEach((v, j) =>
      check(v, r.expected[j]!, 5e-14 * Math.max(scales[j], Math.abs(r.expected[j]!)))
    );
    kinds.forEach((kind, j) => {
      check(
        m.latitudeToAuxiliary(r.latitude, kind),
        r.expected[7 + j] ?? Math.sign(r.latitude) * Infinity,
        2e-11
      );
      check(m.latitudeFromAuxiliary(r.latitude, kind), r.expected[13 + j]!, 2e-11);
    });
    finish(String(i), 'native metrics/latitudes');
  }
  for (const [i, r] of reference.independent.metrics.entries()) {
    const m = new EllipsoidMetrics({semiMajorAxis: 1, semiMinorAxis: r.ratio});
    const actual = [
      m.surfaceArea,
      m.volume,
      m.quarterMeridian,
      m.meridianDistance(r.latitude),
      m.meridionalCurvatureRadius(r.latitude),
      m.transverseCurvatureRadius(r.latitude),
      m.normalCurvatureRadius(r.latitude, 37)
    ];
    actual.forEach((v, j) => check(v, r.metrics[j], 5e-14 * Math.max(1, Math.abs(r.metrics[j]))));
    kinds.forEach((kind, j) => {
      check(m.latitudeToAuxiliary(r.latitude, kind), r.auxiliary[j] ?? Infinity, 2e-11);
      if (r.auxiliary[j] !== null)
        check(m.latitudeFromAuxiliary(r.auxiliary[j]!, kind), r.latitude, 2e-11);
    });
    finish(String(i), 'independent integrals');
  }
  for (const [i, r] of reference.edges.entries()) {
    const g = new EllipsoidGeodesic({semiMajorAxis: r.a, semiMinorAxis: r.b});
    const [a, b, c, d] = r.point,
      v = g.inverse(a, b, c, d, {area: true}).S12!;
    const expected = 'independentArea' in r ? [r.independentArea!] : r.expected;
    for (const e of expected)
      check(
        v,
        e!,
        Math.abs(e!) < 1e-8 * r.a ** 2
          ? Math.max(1e-28 * r.a ** 2, Math.abs(e!) * 2e-8)
          : 5e-14 * r.a ** 2
      );
    finish(String(i), 'edge area', Math.max(...r.expected.map(e => Math.abs(v - e!) / r.a ** 2)));
  }
  for (const [i, r] of reference.polygons.entries()) {
    const p = new GeodesicPolygon({semiMajorAxis: r.a, semiMinorAxis: r.b}, {polyline: r.polyline});
    for (const o of r.ops) {
      if (o[0] === 0) p.addPoint(o[1], o[2]);
      else p.addEdge(o[1], o[2]);
    }
    const v = p.compute({reverse: r.reverse, unsigned: r.unsigned});
    for (const e of [r.expected[1], r.expected[4]])
      check(v.perimeter, e!, 5e-14 * r.a * Math.max(1, v.number));
    if (!r.polyline)
      for (const e of 'independentArea' in r
        ? [r.independentArea!]
        : [r.expected[2]!, r.expected[5]!])
        check(
          v.area!,
          e,
          Math.abs(e) < 1e-8 * r.a ** 2
            ? Math.max(1e-27 * r.a ** 2, Math.abs(e) * 2e-8)
            : 5e-14 * r.a ** 2 * Math.max(1, v.number)
        );
    finish(
      String(i),
      'polygons',
      r.polyline
        ? undefined
        : Math.max(Math.abs(v.area! - r.expected[2]!), Math.abs(v.area! - r.expected[5]!)) /
            r.a ** 2
    );
  }
  for (const [i, r] of reference.directs.entries()) {
    const g = new EllipsoidGeodesic({semiMajorAxis: r.a, semiMinorAxis: r.b});
    const [a, b, c, d] = r.point,
      v = g.direct(a, b, c, d, {area: true}).S12!;
    const expected =
      'independentArea' in r
        ? [r.independentArea!]
        : 'exactDiagnostic' in r
          ? r.expected.slice(0, 1)
          : r.expected.slice(0, 2);
    for (const e of expected)
      check(
        v,
        e!,
        'independentArea' in r && Math.abs(a) < 89 ? Math.abs(e!) * 2e-8 : 5e-14 * r.a ** 2
      );
    const arc = g.arcDirect(a, b, c, r.expected[4]!, {area: true}).S12!;
    for (const e of r.expected.slice(2, 4)) check(arc, e!, 5e-14 * r.a ** 2);
    finish(
      String(i),
      'direct/arc area',
      Math.max(...r.expected.slice(0, 2).map(e => Math.abs(v - e!) / r.a ** 2))
    );
  }
  for (const [i, r] of reference.independent.sphere.entries()) {
    for (const a of [1e-30, 1, 6378137, 1e30]) {
      const p = new GeodesicPolygon({semiMajorAxis: a, semiMinorAxis: a});
      p.addPoint(0, 0)
        .addPoint(0, 'longitudeDelta' in r ? r.longitudeDelta : r.delta)
        .addPoint(r.delta, 0);
      const v = p.compute();
      check(v.area!, r.area * a * a, Math.max(1e-29 * a * a, r.area * a * a * 2e-8));
      check(v.perimeter, r.perimeter * a, 5e-14 * a);
    }
    finish(String(i), 'independent sphere');
  }
  return rows;
}
