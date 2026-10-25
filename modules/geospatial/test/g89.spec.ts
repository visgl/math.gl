// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {EllipsoidGeodesicExact} from '@math.gl/geospatial/geodesic-exact';
import {EllipsoidGeodesic} from '@math.gl/geospatial/ellipsoid';
import {TriaxialEllipsoid} from '@math.gl/geospatial/triaxial';
import {ellipticIntegrals} from '../src/geodesic-exact/quadrature';
import {qualifyG89} from './g89-qualification';
import independent from './g89-independent.json';
for (const row of qualifyG89())
  test(`G8/G9 ${row.mode} ${row.id}`, () => expect(row.passed, JSON.stringify(row)).toBe(true));
for (const r of independent.quarters) {
  test(`Independent elliptic quarter ${r.axes}`, () => {
    const [a, b] = r.axes,
      e = new EllipsoidGeodesicExact({semiMajorAxis: a, semiMinorAxis: b});
    const p = e.line(0, 0, 0).arcPosition(90);
    expect(Math.abs(p.s12 - r.quarter) / a).toBeLessThan(4e-13);
    const end = e.direct(0, 0, 0, r.quarter);
    expect(Math.abs(end.lat2 - 90)).toBeLessThan(2e-10);
    const I = ellipticIntegrals((a / b) ** 2 - 1, (a / b) ** 2 - 1);
    expect(Math.abs(b * I.E(0, Math.PI / 2) - r.quarter) / a).toBeLessThan(4e-13);
  });
}
for (const axes of [
  [3, 2, 1],
  [4, 2, 1],
  [1, 1, 1]
])
  test(`Independent principal-plane trajectories ${axes}`, () => {
    const e = new TriaxialEllipsoid({radii: axes as [number, number, number]});
    for (const [i, j] of [
      [0, 1],
      [0, 2]
    ]) {
      const quarter = independent.quarters.find(
        r => r.axes[0] === axes[i] && r.axes[1] === axes[j]
      )!.quarter;
      const p = [0, 0, 0],
        v = [0, 0, 0];
      p[i] = axes[i];
      v[j] = 1;
      const state = e.direct(p, v, quarter);
      for (let k = 0; k < 3; k++) {
        expect(Math.abs(state.position[k] - (k === j ? axes[j] : 0)) / axes[0]).toBeLessThan(2e-12);
        expect(Math.abs(state.direction[k] - (k === i ? -1 : 0))).toBeLessThan(1e-11);
      }
    }
  });
test('Independent sphere trajectory and signed distance', () => {
  const r = 3,
    e = new TriaxialEllipsoid({radii: [r, r, r]}),
    p = [r, 0, 0],
    v = [0, 0.6, 0.8];
  for (const s of [-4, -1, 0, 1, 5, 6 * Math.PI]) {
    const state = e.direct(p, v, s),
      angle = s / r;
    const position = [r * Math.cos(angle), r * 0.6 * Math.sin(angle), r * 0.8 * Math.sin(angle)];
    const direction = [-Math.sin(angle), 0.6 * Math.cos(angle), 0.8 * Math.cos(angle)];
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(state.position[i] - position[i]) / r).toBeLessThan(2e-12);
      expect(Math.abs(state.direction[i] - direction[i])).toBeLessThan(1e-11);
    }
  }
});
test('Joachimsthal integral is conserved without being enforced by the integrator', () => {
  const e = new TriaxialEllipsoid({radii: [4, 2, 1]}),
    p = e.toCartesian(35, 47),
    v = e.directionToCartesian(p, 63),
    q = [1 / 16, 1 / 4, 1];
  const integral = (p: readonly number[], v: readonly number[]) =>
    v.reduce((s, x, i) => s + q[i] * x * x, 0) * p.reduce((s, x, i) => s + q[i] ** 2 * x * x, 0);
  const initial = integral(p, v),
    line = e.line(p, v);
  for (const distance of [-20, -7, -1, 1, 8, 20]) {
    const end = line.position(distance);
    expect(Math.abs(integral(end.position, end.direction) / initial - 1)).toBeLessThan(2e-12);
  }
});
test('Coordinate inverses and geometric direction conventions use the native surface inputs', () => {
  const e = new TriaxialEllipsoid({radii: [3, 2, 1]});
  for (const system of ['geodetic', 'parametric', 'geocentric'] as const) {
    for (const lat of [-90, -40, 0, 50, 90]) {
      const p = e.toCartesian(lat, 70, system),
        actual = e.fromCartesian(p, system);
      expect(Math.abs(actual.latitude - lat)).toBeLessThan(1e-9);
      if (Math.abs(lat) !== 90) expect(Math.abs(actual.longitude - 70)).toBeLessThan(1e-9);
      else expect(actual.longitude).toBe(0);
      for (const bearing of [-120, 0, 47, 160])
        expect(
          Math.abs(e.directionFromCartesian(p, e.directionToCartesian(p, bearing)) - bearing)
        ).toBeLessThan(1e-9);
    }
  }
});
test('Immutable geometry and reusable lines own inputs, options and returned states', () => {
  const axes: [number, number, number] = [3, 2, 1],
    e = new TriaxialEllipsoid({radii: axes});
  axes[0] = 4;
  expect(e.radii[0]).toBe(3);
  expect(() => {
    (e.radii as number[])[0] = 7;
  }).toThrow();
  const p = e.toCartesian(30, 40),
    v = e.directionToCartesian(p, 50),
    line = e.line(p, v),
    reference = line.position(2);
  p.fill(0);
  v.fill(0);
  const state = line.position(2);
  state.position.fill(0);
  state.direction.fill(0);
  expect(line.position(2)).toEqual(reference);
  expect(line.position(-1).distance).toBe(-1);
  const options = {unrollLongitude: true},
    exact = new EllipsoidGeodesicExact({semiMajorAxis: 1, semiMinorAxis: 0.5}),
    l = exact.line(0, 0, 90, options);
  options.unrollLongitude = false;
  expect(l.arcPosition(720).lon2).toBeCloseTo(360, 10);
  expect(() => {
    (exact as unknown as {semiMinorAxis: number}).semiMinorAxis = 2;
  }).toThrow();
});
test('Explicit domains and invalid directions fail before producing an uncertain result', () => {
  for (const ratio of [0, 0.1, 5, Infinity, NaN])
    expect(() => new EllipsoidGeodesicExact({semiMajorAxis: 1, semiMinorAxis: ratio})).toThrow(
      RangeError
    );
  const exact = new EllipsoidGeodesicExact({semiMajorAxis: 1, semiMinorAxis: 2});
  expect(() => exact.direct(91, 0, 0, 1)).toThrow(RangeError);
  expect(() => exact.line(0, 0, 0).arcPosition(721)).toThrow(RangeError);
  expect(() => exact.direct(0, 0, 0, Infinity)).toThrow(RangeError);
  expect(() => exact.direct(0, 0, 0, 100)).toThrow(RangeError);
  const e = new TriaxialEllipsoid({radii: [3, 2, 1]});
  expect(() => new TriaxialEllipsoid({radii: [5, 2, 1]})).toThrow(RangeError);
  expect(() => e.fromCartesian([0, 0, 0])).toThrow(RangeError);
  expect(() => e.line([3, 0, 0], [1, 0, 0])).toThrow(RangeError);
  expect(() => e.line([3, 0, 0], [0, 0, 0])).toThrow(RangeError);
  expect(() => e.line([3, 0, 0], [0, 1, 0]).position(100)).toThrow(RangeError);
  const large = e.line(
    new Float64Array([3, 0, 0]),
    new Float64Array([0, Number.MAX_VALUE, Number.MAX_VALUE])
  );
  expect(large.position(0).direction.every(Number.isFinite)).toBe(true);
});
test('Exact instances do not change the existing series solver prototype', () => {
  const e = new EllipsoidGeodesic({semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179});
  const before = e.inverse(30, 40, -20, 140);
  new EllipsoidGeodesicExact({semiMajorAxis: 1, semiMinorAxis: 4}).inverse(30, 40, -20, 140);
  expect(e.inverse(30, 40, -20, 140)).toEqual(before);
});

test('Exact distance and arc sampling share the two-circuit domain, including large longitude labels', () => {
  for (const ratio of [0.25, 1, 4]) {
    const e = new EllipsoidGeodesicExact({semiMajorAxis: 1, semiMinorAxis: ratio});
    const l = e.line(35, 70, 40, {unrollLongitude: true});
    for (const arc of [-720, -180, 0, 180, 720]) {
      const a = l.arcPosition(arc),
        p = l.position(a.s12);
      expect(Math.abs(p.lat2 - a.lat2)).toBeLessThan(2e-10);
      expect(Math.abs(p.lon2 - a.lon2)).toBeLessThan(2e-10);
      expect(Math.abs(p.a12 - arc)).toBeLessThan(1e-9);
    }
    const r = e.inverse(30, 999990, -20, 1000000, {unrollLongitude: true});
    const p = e.direct(30, 999990, r.azi1, r.s12);
    expect(Math.abs(p.lat2 + 20)).toBeLessThan(2e-10);
    expect(Math.abs(p.lon2 - -80)).toBeLessThan(2e-10);
    const unsupported = {unrollLongitude: false, area: true};
    expect(() => e.direct(0, 0, 90, 1, unsupported)).toThrow(/area/);
  }
});
test('Triaxial Cartesian trajectories are equivariant under cyclic axis permutations', () => {
  const e = new TriaxialEllipsoid({radii: [4, 2, 1]}),
    p = e.toCartesian(35, 47),
    v = e.directionToCartesian(p, 63),
    reference = e.direct(p, v, 5);
  for (const order of [
    [2, 0, 1],
    [1, 2, 0]
  ]) {
    const t = new TriaxialEllipsoid({
      radii: order.map(i => e.radii[i]) as [number, number, number]
    });
    const state = t.direct(
      order.map(i => p[i]),
      order.map(i => v[i]),
      5
    );
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(state.position[i] - reference.position[order[i]]) / 4).toBeLessThan(2e-12);
      expect(Math.abs(state.direction[i] - reference.direction[order[i]])).toBeLessThan(1e-11);
    }
  }
});
