// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import reference from './g6-reference.json';
import {qualifyG6} from '../../projection/test/g6-entry';
import {EllipsoidGeodesic} from '../../src/ellipsoid-geodesic';
import {GeodesicIntersections} from '../../src/geodesic-intersections';
for (const row of qualifyG6())
  test(`G6 ${row.family} ${row.id}`, () => expect(row, row.error).toMatchObject({passed: true}));
test('Default closest and next searches cover the global profile', () => {
  const g = new GeodesicIntersections({semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179});
  const a = {latitude: 20, longitude: 30, azimuth: 37},
    b = {latitude: -40, longitude: 120, azimuth: -81};
  const closest = g.closest(a, b);
  expect(closest.complete).toBe(true);
  expect(closest.intersection).toBeDefined();
  const next = g.next(0, 0, 90, 90);
  expect(next.complete).toBe(true);
  expect(next.intersection?.coincidence).toBe(1);
  const small = g.closest(a, b, {maxDistance: 1});
  expect(small.complete).toBe(true);
  expect(small.intersection).toBeUndefined();
});
test('Coincidence is a complete continuum report rather than an arbitrary isolated root', () => {
  const g = new GeodesicIntersections({semiMajorAxis: 1, semiMinorAxis: 1.01}),
    a = {latitude: 0, longitude: 0, azimuth: 90};
  const result = g.all(a, a, {maxDistance: 10});
  expect(result.complete).toBe(true);
  expect(result.intersections).toEqual([]);
  expect(result.coincidences).toHaveLength(3);
  const closest = g.closest(a, a);
  expect(closest.intersection?.coincidence).toBe(1);
  expect(closest.intersection?.s).toBeCloseTo(0, 14);
});
test('An unrepresentable parameter prevents a false completeness certificate', () => {
  const a = 1e308,
    g = new GeodesicIntersections({semiMajorAxis: a, semiMinorAxis: a});
  const result = g.all(
    {latitude: 0, longitude: 0, azimuth: 90},
    {latitude: -60, longitude: 108, azimuth: 0},
    {maxDistance: a, origin: [a, a]}
  );
  expect(result.complete).toBe(false);
  expect(result.failedSeeds).toBeGreaterThan(0);
  expect(result.intersections.every(p => Number.isFinite(p.s) && Number.isFinite(p.t))).toBe(true);
});

test('Complete search includes closed boundaries and distinguishes an empty smaller ball', () => {
  const r = reference.independent.find(r => r.mode === 'meridians' && r.a === 1 && r.b === 1.01)!;
  const q = Math.min(...r.expected!.map(p => Math.abs(p[0])));
  const g = new GeodesicIntersections({semiMajorAxis: 1, semiMinorAxis: 1.01});
  const a = {latitude: 0, longitude: 0, azimuth: 0},
    b = {latitude: 0, longitude: 67, azimuth: 0};
  for (const [radius, count] of [
    [2 * q - 1e-8, 0],
    [2 * q, 2],
    [2 * q + 1e-8, 2]
  ]) {
    const result = g.all(a, b, {maxDistance: radius});
    expect(result.complete).toBe(true);
    expect(result.intersections).toHaveLength(count);
  }
});
test('Global ranking handles competing roots from near-antipodal starts', () => {
  const r = reference.native.find(
      r =>
        r.a === 1 &&
        r.b === 0.9966471893352525 &&
        'construction' in r &&
        r.construction?.[3] === 37.0001
    )!,
    p = r.pathsGenerated!.map(([latitude, longitude, azimuth]) => ({latitude, longitude, azimuth}));
  const g = new GeodesicIntersections({semiMajorAxis: r.a, semiMinorAxis: r.b});
  const closest = g.closest(p[0], p[1]);
  expect(closest.complete).toBe(true);
  expect(Math.abs(closest.intersection!.s) + Math.abs(closest.intersection!.t)).toBeLessThan(
    3.1 * r.a
  );
  const result = g.all(p[0], p[1], {maxDistance: 10 * r.a});
  expect(result.complete).toBe(true);
  expect(result.intersections).toHaveLength(12);
  expect(result.attemptedSeeds).toBeLessThanOrEqual(2125);
});

test('Shifted spherical continua retain the analytic global minimum', () => {
  for (const a of [1, 6378137]) {
    const axes = {semiMajorAxis: a, semiMinorAxis: a};
    const geod = new EllipsoidGeodesic(axes);
    const start = {latitude: 20, longitude: 30, azimuth: 37};
    const shift = 3.2 * a;
    const q = geod.line(20, 30, 37).position(shift);
    const origin: [number, number] = [0.3 * a, -0.2 * a];
    for (const direction of [-1, 1] as const) {
      const g = new GeodesicIntersections(axes);
      const result = g.closest(
        start,
        {latitude: q.lat2, longitude: q.lon2, azimuth: q.azi2 + (direction === -1 ? 180 : 0)},
        {origin}
      );
      const p = result.intersection!;
      expect(result.complete).toBe(true);
      expect(p.coincidence).toBe(direction);
      // s - direction*t = shift mod 2*pi*a, independently of native Closest.
      const expected = Math.min(
        ...[-2, -1, 0, 1, 2].map(k =>
          Math.abs(shift + k * 2 * Math.PI * a - origin[0] + direction * origin[1])
        )
      );
      expect(
        Math.abs(Math.abs(p.s - origin[0]) + Math.abs(p.t - origin[1]) - expected)
      ).toBeLessThan(5e-14 * a);
    }
  }
});

test('Qualification rejects duplicate crossings and continuum branches', () => {
  const original = GeodesicIntersections.prototype.all;
  for (const field of ['intersections', 'coincidences'] as const) {
    const spy = vi.spyOn(GeodesicIntersections.prototype, 'all').mockImplementation(function (
      ...args
    ) {
      const report = original.apply(this, args);
      if (report[field].length > 1) report[field][1] = {...report[field][0]} as never;
      return report;
    });
    try {
      const rows = qualifyG6();
      expect(rows.some(r => r.family === 'native global all/closest' && !r.passed)).toBe(true);
      if (field === 'intersections')
        expect(
          rows.some(r => r.family === 'independent meridian lattice/conjugates' && !r.passed)
        ).toBe(true);
    } finally {
      spy.mockRestore();
    }
  }
});

test('Qualification rejects incorrect overlap interval endpoints', () => {
  const original = GeodesicIntersections.prototype.segments;
  for (const field of ['intervalA', 'intervalB'] as const) {
    const spy = vi.spyOn(GeodesicIntersections.prototype, 'segments').mockImplementation(function (
      ...args
    ) {
      const report = original.apply(this, args);
      if (report.status === 'overlap') report[field][0] += 0.01;
      return report;
    });
    try {
      expect(qualifyG6().some(r => r.family === 'native complete segments' && !r.passed)).toBe(
        true
      );
    } finally {
      spy.mockRestore();
    }
  }
});

test('Global defaults retain normalized bounds for very large axes', () => {
  for (const ratio of [0.99, 1, 1.01]) {
    const a = 1e308;
    const g = new GeodesicIntersections({semiMajorAxis: a, semiMinorAxis: a * ratio});
    const p = {latitude: 0, longitude: 0, azimuth: 90};
    const result = g.closest(p, {...p, azimuth: 0});
    expect(result.intersection!.s).toBe(0);
    expect(result.intersection!.t).toBe(0);
    expect(result.complete).toBe(false);
    expect(result.failedSeeds).toBeGreaterThan(0);
    const next = g.next(0, 0, 90, 0);
    expect(next.complete).toBe(false);
    const coincident = g.closest(p, p),
      coincidentNext = g.next(0, 0, 90, 90);
    expect(coincident.intersection!.s).toBe(0);
    expect(coincident.intersection!.t).toBe(0);
    expect(coincident.complete).toBe(false);
    expect(coincidentNext.complete).toBe(false);
    for (const r of [result, next, coincident, coincidentNext]) {
      expect(r.intersections.every(p => Number.isFinite(p.s) && Number.isFinite(p.t))).toBe(true);
      expect(r.coincidences.every(p => Number.isFinite(p.s) && Number.isFinite(p.t))).toBe(true);
    }
    expect(() => g.closest(p, p, {maxDistance: Infinity})).toThrow(RangeError);
    expect(() => g.next(0, 0, 90, 0, Infinity)).toThrow(RangeError);
  }
});

test('Qualification rejects physically valid but incorrectly ranked coincident answers', () => {
  for (const method of ['closest', 'next'] as const) {
    const original = GeodesicIntersections.prototype[method];
    const spy = vi.spyOn(GeodesicIntersections.prototype, method).mockImplementation(function (
      ...args: any[]
    ) {
      const report = (original as Function).apply(this, args);
      const p = report.intersection;
      if (p?.coincidence) {
        const shift = 0.001 * (this as any).a;
        // Move along the same physical continuum; residual and flag still pass.
        p.s += shift;
        p.t += p.coincidence * shift;
      }
      return report;
    });
    try {
      expect(
        qualifyG6().some(
          r =>
            r.family ===
              (method === 'closest'
                ? 'native global all/closest'
                : 'native global next/conjugates') && !r.passed
        )
      ).toBe(true);
    } finally {
      spy.mockRestore();
    }
  }
});
