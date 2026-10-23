// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import reference from './g6-reference.json';
import {qualifyG6} from '../../projection/test/g6-entry';
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
  const r = reference.native[55],
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
