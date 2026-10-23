// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {qualifyG56} from '../../projection/test/g56-entry';
import {EllipsoidRhumb, RhumbDomainError} from '../../src/ellipsoid-rhumb';
import {RhumbPolygon} from '../../src/rhumb-polygon';
import {GeodesicIntersections} from '../../src/geodesic-intersections';
const axes = {semiMajorAxis: 1, semiMinorAxis: 1};
for (const row of qualifyG56())
  test(`G5/G6 ${row.family} ${row.id}`, () => expect(row, row.error).toMatchObject({passed: true}));
test('Rhumb tiny meridian displacement is retained; exact cardinal parallels', () => {
  const r = new EllipsoidRhumb(axes);
  expect(r.direct(0, 0, 0, 1e-20).lat2).toBeCloseTo((1e-20 * 180) / Math.PI, 32);
  expect(r.direct(45, 0, 90, 0.1).lat2).toBe(45);
  expect(r.direct(45, 0, -90, -0.1).lat2).toBe(45);
  expect(r.inverse(0, 0, 1e-20, 0).s12).toBeCloseTo((1e-20 * Math.PI) / 180, 34);
});
test('Rhumb poles are explicit domain errors; line options are snapshotted', () => {
  const r = new EllipsoidRhumb(axes);
  expect(() => r.inverse(90, 0, 0, 0)).toThrow(RhumbDomainError);
  expect(() => r.direct(0, 0, 0, 2)).toThrow(RhumbDomainError);
  expect(() => r.direct(0, 0, 0, Math.PI / 2)).toThrow(RhumbDomainError);
  const options = {area: true, unrollLongitude: true};
  const line = r.line(0, 179, 90, options);
  options.area = false;
  options.unrollLongitude = false;
  expect(line.position(0.1).lon2).toBeGreaterThan(180);
  expect(line.position(0.1).S12).toBe(0);
  expect(r.inverse(0, 0, 1, 1).S12).toBeUndefined();
  for (const value of [NaN, Infinity]) expect(() => r.direct(0, 0, 0, value)).toThrow(RangeError);
  expect(() => r.inverse(0, 0, 1, 1, {longitudeTurns: 0.1})).toThrow(RangeError);
});
test('Rhumb polygon whole-turn area, previews and atomic first pole rejection', () => {
  const p = new RhumbPolygon(axes);
  expect(() => p.addPoint(90, 0)).toThrow(RhumbDomainError);
  expect(p.compute().number).toBe(0);
  p.addPoint(30, 0);
  const before = p.compute();
  const preview = p.testPoint(30, 0, {longitudeTurns: 1});
  expect(p.compute()).toEqual(before);
  p.addPoint(30, 0, {longitudeTurns: 1});
  expect(p.compute()).toEqual(preview);
  expect(p.compute().area).toBeCloseTo(Math.PI, 13);
  expect(p.compute().perimeter).toBeCloseTo(2 * Math.PI * Math.cos(Math.PI / 6), 13);
});
test('Analytic sphere all/closest/next intersections retain parameter circuits', () => {
  const g = new GeodesicIntersections(axes);
  const a = {latitude: 0, longitude: -30, azimuth: 90},
    b = {latitude: -20, longitude: 0, azimuth: 0};
  const result = g.closest(a, b, {maxDistance: 1});
  expect(result.complete).toBe(true);
  expect(result.intersection!.s).toBeCloseTo(Math.PI / 6, 14);
  expect(result.intersection!.t).toBeCloseTo(Math.PI / 9, 14);
  expect(g.all(a, b, {maxDistance: 4 * Math.PI}).intersections.length).toBeGreaterThan(8);
  const next = g.next(0, 0, 90, 0, 7);
  expect(next.intersection).toBeDefined();
  expect(Math.abs(next.intersection!.s) + Math.abs(next.intersection!.t)).toBeCloseTo(
    2 * Math.PI,
    13
  );
});
test('Segments distinguish crossing, overlap, near-line points and ambiguity', () => {
  for (const ratio of [1, 0.9966471893352525]) {
    const g = new GeodesicIntersections({semiMajorAxis: 1, semiMinorAxis: ratio});
    expect(g.segments([0, -20], [0, 20], [-20, 0], [20, 0]).status).toBe('intersection');
    expect(g.segments([0, -20], [0, 20], [0, 0], [0, 40]).status).toBe('overlap');
    expect(g.segments([0, -20], [0, 20], [0, 40], [0, 0]).status).toBe('overlap');
    expect(g.segments([1e-7, 0], [1e-7, 0], [0, -20], [0, 20]).status).toBe('disjoint');
    expect(g.segments([0, 0], [0, 0], [0, -20], [0, 20]).status).toBe('intersection');
    expect(g.segments([0, 0], [0, 180], [-20, 0], [20, 0]).status).toBe('ambiguous');
  }
});
test('Intersection bounds, coincidence and input validation are explicit', () => {
  const g = new GeodesicIntersections(axes),
    a = {latitude: 0, longitude: 0, azimuth: 90};
  const coincident = g.all(a, {...a, longitude: 90}, {maxDistance: 1});
  expect(coincident.coincidences).toEqual([]);
  expect(coincident.complete).toBe(false);
  const found = g.all(a, {...a, longitude: 90}, {maxDistance: 2});
  expect(found.coincidences).toHaveLength(1);
  const c = found.coincidences[0];
  expect(Math.abs(c.s) + Math.abs(c.t)).toBeLessThanOrEqual(2);
  expect(() => g.all(a, a, {maxDistance: Infinity})).toThrow(RangeError);
  expect(() => g.all({...a, latitude: 91}, a, {maxDistance: 1})).toThrow();
  expect(() => new GeodesicIntersections({semiMajorAxis: 1, semiMinorAxis: 0.5})).toThrow(
    RangeError
  );
});

test('Representable near-pole parallels and zero-distance paths retain latitude', () => {
  for (const ratio of [0.5, 0.9966471893352525, 1, 2]) {
    const r = new EllipsoidRhumb({semiMajorAxis: 1, semiMinorAxis: ratio});
    for (const lat of [90 - 2 ** -46, -90 + 2 ** -46]) {
      expect(r.direct(lat, 0, 90, 1e-17).lat2).toBe(lat);
      expect(r.direct(lat, 0, 37, 0).lat2).toBe(lat);
      expect(Number.isFinite(r.inverse(lat, 0, lat, 90, {area: true}).S12)).toBe(true);
    }
  }
});
test('Independent rotated spherical crossings satisfy both great-circle planes', () => {
  const g = new GeodesicIntersections(axes);
  const rad = Math.PI / 180;
  const vector = (lat: number, lon: number) => [
    Math.cos(lat * rad) * Math.cos(lon * rad),
    Math.cos(lat * rad) * Math.sin(lon * rad),
    Math.sin(lat * rad)
  ];
  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
  const normal = (lat: number, lon: number, azi: number) => {
    const p = vector(lat, lon),
      north = [
        -Math.sin(lat * rad) * Math.cos(lon * rad),
        -Math.sin(lat * rad) * Math.sin(lon * rad),
        Math.cos(lat * rad)
      ],
      east = [-Math.sin(lon * rad), Math.cos(lon * rad), 0];
    const t = north.map((v, i) => v * Math.cos(azi * rad) + east[i] * Math.sin(azi * rad));
    return [p[1] * t[2] - p[2] * t[1], p[2] * t[0] - p[0] * t[2], p[0] * t[1] - p[1] * t[0]];
  };
  for (const a of [
    [23, 45, 37],
    [-60, 179, 123],
    [89, 15, -80]
  ]) {
    const b = [-35, -100, 70],
      paths = [a, b].map(([latitude, longitude, azimuth]) => ({latitude, longitude, azimuth}));
    const result = g.all(paths[0], paths[1], {maxDistance: 7});
    expect(result.complete).toBe(true);
    expect(result.intersections.length).toBeGreaterThan(1);
    for (const p of result.intersections) {
      const v = vector(p.latitude, p.longitude);
      for (const path of [a, b])
        expect(Math.abs(dot(v, normal(path[0], path[1], path[2])))).toBeLessThan(5e-14);
    }
  }
});

test('Rhumb polygon winding and insertion failures preserve compensated state', () => {
  for (const turns of [-4, -3, -2, -1, 1, 2, 3, 4]) {
    const p = new RhumbPolygon(axes).addPoint(30, -1080);
    const preview = p.testPoint(30, -1080, {longitudeTurns: turns});
    p.addPoint(30, -1080, {longitudeTurns: turns});
    expect(p.compute()).toEqual(preview);
    let area = (turns * Math.PI) % (4 * Math.PI);
    if (area > 2 * Math.PI) area -= 4 * Math.PI;
    if (area <= -2 * Math.PI) area += 4 * Math.PI;
    // At an exact half/full ellipsoid boundary, rounding can select either
    // equivalent representative. Compare modulo the full surface area.
    const difference = p.compute().area! - area;
    const error = difference - Math.round(difference / (4 * Math.PI)) * 4 * Math.PI;
    expect(Math.abs(error)).toBeLessThan(5e-14);
    const state = p.compute();
    expect(() => p.addPoint(45, 0, {longitudeTurns: 0.5})).toThrow(RangeError);
    expect(() => p.testPoint(90, 0)).toThrow(RhumbDomainError);
    expect(() => p.addEdge(0, 10)).toThrow(RhumbDomainError);
    expect(p.compute()).toEqual(state);
  }
  const p = new RhumbPolygon(axes, {polyline: true}).addPoint(0, 0).addEdge(90, 0.1);
  expect(p.compute().area).toBeUndefined();
  expect(p.compute().perimeter).toBeCloseTo(0.1, 15);
  expect(p.clear().compute()).toEqual({number: 0, perimeter: 0});
  expect(() => new RhumbPolygon(axes).testPoint(0, 0, {longitudeTurns: NaN})).toThrow(RangeError);
});

test('Polar intersections compare tangents in a common frame', () => {
  for (const ratio of [1, 0.9966471893352525]) {
    const g = new GeodesicIntersections({semiMajorAxis: 1, semiMinorAxis: ratio});
    for (const longitude of [30, 90, 150]) {
      const result = g.all(
        {latitude: 0, longitude: 0, azimuth: 0},
        {latitude: 0, longitude, azimuth: 0},
        {maxDistance: 4}
      );
      expect(result.intersections).toHaveLength(2);
      for (const p of result.intersections) {
        expect(Math.abs(p.latitude)).toBeCloseTo(90, 11);
        expect(p.crossingAngle).toBeCloseTo(Math.min(longitude, 180 - longitude), 11);
      }
    }
  }
});
test('Pole-relative meridian steps moving away from a pole stay representable', () => {
  for (const ratio of [0.5, 0.9966471893352525, 1, 2]) {
    const r = new EllipsoidRhumb({semiMajorAxis: 1, semiMinorAxis: ratio});
    for (const sign of [-1, 1]) {
      const latitude = sign * (90 - 2 ** -46),
        distance = -sign * 2e-16;
      const p = r.direct(latitude, 0, 0, distance);
      expect(Math.abs(p.lat2)).toBeLessThan(90);
      expect(sign * (p.lat2 - latitude)).toBeLessThanOrEqual(0);
      // Independent local pole limit M/a=1/r; error includes degree quantization.
      expect(Math.abs(((p.lat2 - latitude) * Math.PI) / 180 - distance * ratio)).toBeLessThan(
        4e-16
      );
      expect(r.line(latitude, 0, 0).position(distance)).toEqual(p);
    }
  }
});

test('Compensated rhumb dateline differences retain nanometre legs and signed ties', () => {
  const a = 6378137,
    r = new EllipsoidRhumb({semiMajorAxis: a, semiMinorAxis: a});
  const gap = 2 ** -45,
    expected = (a * gap * Math.PI) / 180;
  for (const [x, y, bearing] of [
    [180 - gap, -180, 90],
    [-180, 180 - gap, -90],
    [-180 + gap, 180, -90],
    [180, -180 + gap, 90]
  ]) {
    const p = r.inverse(0, x, 0, y, {area: true});
    expect(p.azi12).toBe(bearing);
    expect(p.s12).toBeCloseTo(expected, 22);
    expect(p.S12).toBe(0);
  }
  for (const [x, y, bearing] of [
    [0, 180, 90],
    [0, -180, -90],
    [360, 180, -90]
  ])
    expect(r.inverse(0, x, 0, y).azi12).toBe(bearing);
  const before = 2 ** -46;
  expect(r.inverse(0, before, 0, 180).azi12).toBe(90);
  expect(r.inverse(0, -before, 0, 180).azi12).toBe(-90);
});
test('Segment ambiguity follows shortest-path multiplicity on both shapes', () => {
  for (const ratio of [0.99, 1, 1.01]) {
    const g = new GeodesicIntersections({semiMajorAxis: 1, semiMinorAxis: ratio});
    for (const [start, end] of [
      [
        [10, 0],
        [-10, 180]
      ],
      [
        [0, 0],
        [0, 180]
      ],
      [
        [-10, 0],
        [10, -180]
      ]
    ] as const) {
      expect(g.segments(start, end, [0, 89], [0, 91]).status).toBe('ambiguous');
      expect(g.segments([0, 89], [0, 91], start, end).status).toBe('ambiguous');
    }
    // Reflected latitude alone does not imply multiple shortest routes.
    expect(g.segments([10, 0], [-10, 90], [0, 44], [0, 46]).status).toBe('intersection');
    // Opposite longitude alone does not imply multiple shortest routes either.
    expect(g.segments([80, 0], [80, 180], [85, 90], [89, 90]).status).not.toBe('ambiguous');
  }
});
