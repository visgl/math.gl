// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independent integral/sphere and pinned full GeographicLib C++ controls. No upstream test data copied.
import {expect, test} from 'vitest';
import {EllipsoidMetrics, type AuxiliaryLatitude} from '../../src/ellipsoid-metrics';
import {EllipsoidGeodesic} from '../../src/ellipsoid-geodesic';
import {GeodesicPolygon} from '../../src/geodesic-polygon';
import reference from './g34-reference.json';

const kinds: AuxiliaryLatitude[] = [
  'geocentric',
  'parametric',
  'rectifying',
  'authalic',
  'conformal',
  'isometric'
];
const axes = (a: number, b: number) => ({semiMajorAxis: a, semiMinorAxis: b});
const near = (actual: number, expected: number, budget: number) => {
  expect(Number.isFinite(actual)).toBe(true);
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(budget);
};
function metrics(m: EllipsoidMetrics, phi: number): number[] {
  return [
    m.surfaceArea,
    m.volume,
    m.quarterMeridian,
    m.meridianDistance(phi),
    m.meridionalCurvatureRadius(phi),
    m.transverseCurvatureRadius(phi),
    m.normalCurvatureRadius(phi, 37)
  ];
}
for (const [i, row] of reference.metrics.entries()) {
  test(`G3 native metrics and six latitude/inverse pairs ${i}`, () => {
    const m = new EllipsoidMetrics(axes(row.a, row.b));
    const actual = metrics(m, row.latitude);
    const scales = [row.a ** 2, row.a ** 3, row.a, row.a, row.a, row.a, row.a];
    actual.forEach((v, j) =>
      near(
        v,
        row.expected[j]!,
        5e-14 * scales[j] * Math.max(1, Math.abs(row.expected[j]! / scales[j]))
      )
    );
    kinds.forEach((kind, j) => {
      const result = m.latitudeToAuxiliary(row.latitude, kind);
      if (row.expected[7 + j] === null) expect(result).toBe(Math.sign(row.latitude) * Infinity);
      else near(result, row.expected[7 + j]!, 2e-11);
      near(m.latitudeFromAuxiliary(row.latitude, kind), row.expected[13 + j]!, 2e-11);
    });
  });
}
for (const [i, row] of reference.independent.metrics.entries()) {
  test(`G3 independent 80-digit integral control ${i}`, () => {
    const m = new EllipsoidMetrics(axes(1, row.ratio));
    metrics(m, row.latitude).forEach((v, j) =>
      near(v, row.metrics[j], 5e-14 * Math.max(1, Math.abs(row.metrics[j])))
    );
    kinds.forEach((kind, j) => {
      const expected = row.auxiliary[j];
      if (expected === null) expect(m.latitudeToAuxiliary(row.latitude, kind)).toBe(Infinity);
      else {
        near(m.latitudeToAuxiliary(row.latitude, kind), expected, 2e-11);
        near(m.latitudeFromAuxiliary(expected, kind), row.latitude, 2e-11);
      }
    });
  });
}
for (const [i, row] of reference.edges.entries()) {
  test(`G4 edge S12 series and Exact ${i}`, () => {
    const g = new EllipsoidGeodesic(axes(row.a, row.b));
    const [lat1, lon1, lat2, lon2] = row.point;
    const inverse = g.inverse(lat1, lon1, lat2, lon2, {area: true});
    const budget =
      Math.abs(row.expected[1]!) < 1e-8 * row.a ** 2
        ? Math.max(1e-28 * row.a ** 2, Math.abs(row.expected[1]!) * 2e-8)
        : 5e-14 * row.a ** 2;
    if ('independentArea' in row)
      near(inverse.S12!, row.independentArea!, Math.abs(row.independentArea!) * 2e-8);
    else for (const expected of row.expected) near(inverse.S12!, expected!, budget);
    // Preserve the default no-area contract and qualify all line entry paths.
    expect(g.inverse(lat1, lon1, lat2, lon2).S12).toBeUndefined();
    if (Math.abs(lat1) === 90 || Math.abs(lat2) === 90 || Math.abs(inverse.a12 - 180) < 1e-12)
      return;
    const line = g.line(lat1, lon1, inverse.azi1, {area: true});
    near(line.position(inverse.s12).S12!, inverse.S12!, 5e-14 * row.a ** 2);
    near(line.arcPosition(inverse.a12).S12!, inverse.S12!, 5e-14 * row.a ** 2);
    near(
      g.arcDirect(lat1, lon1, inverse.azi1, inverse.a12, {area: true}).S12!,
      inverse.S12!,
      5e-14 * row.a ** 2
    );
  });
}
for (const [i, row] of reference.polygons.entries()) {
  test(`G4 native polygon/polyline, winding, crossings and compensation ${i}`, () => {
    const p = new GeodesicPolygon(axes(row.a, row.b), {polyline: row.polyline});
    const options = {reverse: row.reverse, unsigned: row.unsigned};
    for (const op of row.ops) {
      const before = p.compute(options);
      const preview =
        op[0] === 0 ? p.testPoint(op[1], op[2], options) : p.testEdge(op[1], op[2], options);
      expect(p.compute(options)).toEqual(before);
      if (op[0] === 0) p.addPoint(op[1], op[2]);
      else p.addEdge(op[1], op[2]);
      expect(p.compute(options)).toEqual(preview);
    }
    const result = p.compute(options);
    expect(result.number).toBe(row.expected[0]);
    near(result.perimeter, row.expected[1]!, 5e-14 * row.a * Math.max(1, result.number));
    near(result.perimeter, row.expected[4]!, 5e-14 * row.a * Math.max(1, result.number));
    if (row.polyline) expect(result.area).toBeUndefined();
    else
      for (const expected of 'independentArea' in row
        ? [row.independentArea!]
        : [row.expected[2]!, row.expected[5]!]) {
        const budget =
          Math.abs(expected) < 1e-8 * row.a ** 2
            ? Math.max(1e-27 * row.a ** 2, Math.abs(expected) * 2e-8)
            : 5e-14 * row.a ** 2 * Math.max(1, result.number);
        near(result.area!, expected, budget);
      }
    expect(p.number).toBe(row.ops.length);
    p.clear();
    expect(p.compute()).toEqual(
      row.polyline ? {number: 0, perimeter: 0} : {number: 0, perimeter: 0, area: 0}
    );
  });
}
for (const row of reference.independent.sphere) {
  test(`G4 independent spherical excess at ${row.delta} degrees`, () => {
    for (const a of [1e-30, 1, 6378137, 1e30]) {
      const p = new GeodesicPolygon(axes(a, a));
      p.addPoint(0, 0)
        .addPoint(0, 'longitudeDelta' in row ? row.longitudeDelta : row.delta)
        .addPoint(row.delta, 0);
      const r = p.compute();
      near(r.area!, row.area * a * a, Math.max(1e-29 * a * a, row.area * a * a * 2e-8));
      near(r.perimeter, row.perimeter * a, 5e-14 * a);
      const reversed = new GeodesicPolygon(axes(a, a))
        .addPoint(row.delta, 0)
        .addPoint(0, 'longitudeDelta' in row ? row.longitudeDelta : row.delta)
        .addPoint(0, 0);
      near(
        reversed.compute().area!,
        -row.area * a * a,
        Math.max(1e-29 * a * a, row.area * a * a * 2e-8)
      );
    }
  });
}

test('G3 units, limits, immutable snapshots and invalid contracts', () => {
  const m = new EllipsoidMetrics(axes(2, 2));
  expect(Object.isFrozen(m)).toBe(true);
  near(m.surfaceArea, 16 * Math.PI, 1e-13);
  near(m.volume, (32 * Math.PI) / 3, 1e-13);
  near(m.quarterMeridian, Math.PI, 1e-14);
  for (const kind of kinds) {
    expect(Object.is(m.latitudeToAuxiliary(-0, kind), -0)).toBe(true);
    expect(Object.is(m.latitudeFromAuxiliary(-0, kind), -0)).toBe(true);
    expect(m.latitudeFromAuxiliary(kind === 'isometric' ? -Infinity : -90, kind)).toBe(-90);
    expect(() => m.latitudeToAuxiliary(NaN, kind)).toThrow();
    expect(() => m.latitudeToAuxiliary(91, kind)).toThrow();
    expect(() => m.latitudeFromAuxiliary(NaN, kind)).toThrow();
  }
  expect(() => m.latitudeToAuxiliary(0, 'unknown' as AuxiliaryLatitude)).toThrow();
  expect(() => m.latitudeFromAuxiliary(0, 'unknown' as AuxiliaryLatitude)).toThrow();
  for (const bad of [
    axes(0, 1),
    axes(1, 0),
    axes(NaN, 1),
    axes(1, Infinity),
    axes(1, 0.49),
    axes(1, 2.01),
    axes(1e200, 1e200),
    axes(1e-200, 1e-200)
  ])
    expect(() => new EllipsoidMetrics(bad)).toThrow();
  expect(() => m.meridianDistance(91)).toThrow();
  expect(() => m.meridionalCurvatureRadius(Infinity)).toThrow();
  expect(() => m.transverseCurvatureRadius(NaN)).toThrow();
  expect(() => m.normalCurvatureRadius(0, Infinity)).toThrow();
  near(m.normalCurvatureRadius(0, 1e6), 2, 1e-14);
});

test('G4 invalid insertion is atomic, previews own state, area conventions and reset', () => {
  const p = new GeodesicPolygon(axes(1, 1));
  expect(() => p.addEdge(0, 1)).toThrow();
  expect(() => p.testEdge(0, 1)).toThrow();
  p.addPoint(0, 0).addPoint(0, 90).addPoint(90, 0);
  const before = p.compute();
  for (const f of [
    () => p.addPoint(NaN, 0),
    () => p.addPoint(91, 0),
    () => p.addPoint(0, Infinity),
    () => p.addEdge(Infinity, 1),
    () => p.addEdge(0, NaN),
    () => p.testPoint(0, NaN)
  ]) {
    expect(f).toThrow();
    expect(p.compute()).toEqual(before);
  }
  near(before.area!, Math.PI / 2, 1e-14);
  near(p.compute({reverse: true, unsigned: true}).area!, 4 * Math.PI - Math.PI / 2, 1e-14);
  const preview = p.testPoint(10, 20);
  preview.area = 999;
  expect(p.compute()).toEqual(before);
  p.clear().addPoint(20, 30).addEdge(37, -0.2);
  expect(p.number).toBe(2);
  expect(() => new GeodesicPolygon(axes(1e200, 1e200))).toThrow();
});

for (const [i, row] of reference.directs.entries()) {
  test(`G4 direct/arc/line edge area, signed and multi-circuit ${i}`, () => {
    const g = new EllipsoidGeodesic(axes(row.a, row.b));
    const [lat, lon, azi, distance] = row.point;
    const r = g.direct(lat, lon, azi, distance, {area: true, unrollLongitude: true});
    const expected =
      'independentArea' in row
        ? [row.independentArea!]
        : 'exactDiagnostic' in row
          ? row.expected.slice(0, 1)
          : row.expected.slice(0, 2);
    for (const value of expected)
      near(
        r.S12!,
        value!,
        'independentArea' in row && Math.abs(row.point[0]) < 89
          ? Math.abs(value!) * 2e-8
          : 5e-14 * row.a ** 2
      );
    for (const value of row.expected.slice(2, 4))
      near(
        g.arcDirect(lat, lon, azi, row.expected[4]!, {area: true, unrollLongitude: true}).S12!,
        value!,
        5e-14 * row.a ** 2
      );
    const line = g.line(lat, lon, azi, {area: true, unrollLongitude: true});
    expect(line.position(distance)).toEqual(r);
    near(line.arcPosition(row.expected[4]!).S12!, row.expected[2]!, 5e-14 * row.a ** 2);
  });
}

test('G4 exact zero/complement boundary and finite arithmetic failures', () => {
  const p = new GeodesicPolygon(axes(6378137, 6356752.314245179));
  p.addPoint(0, 0).addPoint(0, 180).addPoint(0, 360);
  expect(p.compute().area).toBe(0);
  expect(p.compute({unsigned: true}).area).toBe(0);
  expect(p.compute({reverse: true, unsigned: true}).area).toBe(0);
  for (const polyline of [false, true]) {
    const small = new GeodesicPolygon(axes(1e-30, 1e-30), {polyline}).addPoint(0, 0);
    const before = small.compute();
    expect(() => small.addEdge(45, 1e308)).toThrow();
    expect(small.compute()).toEqual(before);
  }
});

test('G4 direct crossing parity is invariant under negative longitude winding', () => {
  const polygon = (shift: number) =>
    new GeodesicPolygon(axes(1, 1))
      .addPoint(0, -350 + shift)
      .addEdge(-90, (20 * Math.PI) / 180)
      .addPoint(10, -350 + shift)
      .compute();
  near(polygon(0).area!, polygon(360).area!, 5e-14);
});
