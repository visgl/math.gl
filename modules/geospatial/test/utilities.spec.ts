// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {
  parseAngle,
  formatAngle,
  parseGeographicCoordinates,
  formatGeographicCoordinates,
  formatMGRS,
  parseMGRS,
  projectGrid,
  unprojectGrid,
  transferGrid,
  parseMGRSZone,
  formatMGRSZone
} from '../src/coordinates';
import {TriaxialEllipsoid} from '../src/triaxial';
import {EllipsoidGeodesic} from '../src/ellipsoid-geodesic';
import {EllipsoidGeodesicExact} from '../src/geodesic-exact';
import {EllipsoidRhumb} from '../src/ellipsoid-rhumb';
import {GeodesicLineBuffer, RhumbLineBuffer} from '../src/geodesic-buffer';
import {qualifyUtilities} from './utilities-qualification';
for (const row of qualifyUtilities())
  test(`${row.mode} ${row.id}`, () => expect(row.passed, JSON.stringify(row)).toBe(true));
test('Angle text has strict units, carries, hemispheres and signed zero', () => {
  expect(parseAngle('12°30′40″N', 'latitude')).toBeCloseTo(12 + 30 / 60 + 40 / 3600, 12);
  expect(Object.is(parseAngle('0S', 'latitude'), -0)).toBe(true);
  expect(formatAngle(-0, {axis: 'longitude'})).toBe('0°00′00.000″W');
  expect(formatAngle(12 + 59 / 60 + 59.9999 / 3600, {precision: 3})).toBe('13°00′00.000″');
  const text = formatGeographicCoordinates(-12.5, 179.25, {precision: 3});
  expect(parseGeographicCoordinates(text)).toEqual({latitude: -12.5, longitude: 179.25});
  for (const text of [
    '12:60',
    '12:30:60',
    '12.5:30',
    '12:30.5:1',
    '12 30',
    '1e2',
    '-12S',
    'N12N',
    'NaN',
    'Infinity',
    '1+2',
    '90:00:01N'
  ])
    expect(() => parseAngle(text, 'latitude')).toThrow();
  expect(() => parseAngle('12E', 'latitude')).toThrow();
  expect(() => parseMGRS('31N')).toThrow();
  for (const point of [
    [90, 0],
    [-90, 0],
    [-80.000001, -180]
  ])
    expect(formatMGRS(point[0], point[1])).toMatch(/^(ZAH|BAN|BAA)/);
  expect(projectGrid(90, 0)).toEqual({zone: 0, north: true, easting: 2e6, northing: 2e6});
  expect(unprojectGrid({zone: 0, north: true, easting: 2e6, northing: 2e6}).latitude).toBe(90);
  const p = parseMGRS('31U DQ 48251 11932'),
    corner = parseMGRS('31UDQ4825111932', {center: false});
  expect(p.easting - corner.easting).toBe(0.5);
});
test('Surface sampling accepts original random streams, returns owned points and bounds failure', () => {
  const shape = new TriaxialEllipsoid({radii: [4, 2, 1]});
  let index = 0;
  const tape = [0.5, 0, 0.9, 0, 0, 0.9];
  expect(shape.sampleSurface(() => tape[index++])).toEqual([0, 0, -1]);
  const sphere = new TriaxialEllipsoid({radii: [2, 2, 2]});
  let draws = 0;
  expect(
    sphere
      .sampleSurface(() => {
        draws++;
        return 1 - Number.EPSILON;
      })
      .every(Number.isFinite)
  ).toBe(true);
  expect(draws).toBe(3);
  for (const value of [NaN, Infinity, -0.1, 1])
    expect(() => shape.sampleSurface(() => value)).toThrow();
  expect(() => shape.sampleSurface(() => 0.9)).toThrow(/work limit/);
  for (const radii of [
    [4e-60, 2e-60, 1e-60],
    [1e60, 5e59, 2.5e59]
  ]) {
    const s = new TriaxialEllipsoid({radii: radii as [number, number, number]}),
      p = s.sampleSurface(() => 0.1);
    expect(Math.abs(p.reduce((sum, x, i) => sum + (x / radii[i]) ** 2, 0) - 1)).toBeLessThan(2e-12);
  }
});
test('Packed line staging is atomic, alias-safe and snapshots metadata', () => {
  const axes = {semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179},
    g = new EllipsoidGeodesic(axes),
    r = new EllipsoidRhumb(axes);
  for (const [line, C] of [
    [g.line(20, 30, 40, {area: true}), GeodesicLineBuffer],
    [r.line(20, 30, 40, {area: true}), RhumbLineBuffer]
  ] as const) {
    const b = new C(line as never, 3, {area: true}),
      out = new Float64Array(3 * b.stride).fill(99),
      before = out.slice();
    expect(() => b.positions([0, NaN, 20], out)).toThrow();
    expect(out).toEqual(before);
    b.positions([0, 10, 20], out);
    const expected = out.slice();
    out.fill(99);
    out.set([0, 10, 20]);
    b.positions(out.subarray(0, 3), out);
    expect(out).toEqual(expected);
    expect(Object.isFrozen(b)).toBe(true);
    expect(Object.isFrozen(b.fields)).toBe(true);
    expect(() => b.positions([0, 1, 2, 3], out)).toThrow();
    expect(() => b.positions([0], new Float64Array(1))).toThrow();
  }
  const line = r.line(89, 0, 0),
    b = new RhumbLineBuffer(line, 2),
    out = new Float64Array(8).fill(123);
  expect(() => b.positions([0, 1e7], out)).toThrow();
  expect(out.every(v => v === 123)).toBe(true);
  const missingArea = new GeodesicLineBuffer(g.line(0, 0, 90), 1, {area: true});
  expect(() => missingArea.positions([1], new Float64Array(9))).toThrow();
  const exact = new EllipsoidGeodesicExact(axes).line(20, 30, 40, {area: true}),
    fallback = new GeodesicLineBuffer(exact, 1, {area: true});
  expect(fallback.positions([10], new Float64Array(9)).every(Number.isFinite)).toBe(true);
  const custom = {
    position: () => {
      throw new Error('snapshot failed');
    }
  };
  const buffer = new GeodesicLineBuffer(custom, 0);
  custom.position = () => ({}) as never;
  expect(buffer.positions([], new Float64Array(0)).length).toBe(0);
});
test('Packed sphere lines satisfy independent analytic distance and Jacobi identities', () => {
  const radius = 3,
    axes = {semiMajorAxis: radius, semiMinorAxis: radius},
    distances = [-6, 0, 6];
  const g = new GeodesicLineBuffer(new EllipsoidGeodesic(axes).line(0, 0, 90), 3);
  const r = new RhumbLineBuffer(new EllipsoidRhumb(axes).line(0, 0, 90), 3);
  const geo = g.positions(distances, new Float64Array(24)),
    rhumb = r.positions(distances, new Float64Array(12));
  for (let i = 0; i < 3; i++) {
    const angle = distances[i] / radius;
    expect(Math.abs(geo[i * 8])).toBeLessThan(2e-10);
    expect(Math.abs(rhumb[i * 4])).toBeLessThan(2e-10);
    expect(Math.abs(geo[i * 8 + 1] - (angle * 180) / Math.PI)).toBeLessThan(2e-10);
    expect(Math.abs(rhumb[i * 4 + 1] - (angle * 180) / Math.PI)).toBeLessThan(2e-10);
    expect(Math.abs(geo[i * 8 + 5] - radius * Math.sin(angle))).toBeLessThan(4e-13 * radius);
    expect(Math.abs(geo[i * 8 + 6] - Math.cos(angle))).toBeLessThan(4e-13);
    expect(Math.abs(geo[i * 8 + 7] - Math.cos(angle))).toBeLessThan(4e-13);
  }
});
test('Packed samplers snapshot methods and recover after reentrant failure', () => {
  const result = (distance: number) => ({
    lat1: 0,
    lon1: 0,
    azi1: 90,
    lat2: 0,
    lon2: 1,
    azi2: 90,
    s12: distance,
    a12: 1,
    m12: 1,
    M12: 1,
    M21: 1
  });
  const custom = {position: result},
    snapshot = new GeodesicLineBuffer(custom, 1);
  custom.position = () => {
    throw new Error('changed callback');
  };
  expect(snapshot.positions([1], new Float64Array(8))[3]).toBe(1);
  let first = true;
  let buffer: GeodesicLineBuffer;
  buffer = new GeodesicLineBuffer(
    {
      position: distance => {
        if (first) {
          first = false;
          buffer.positions([0], new Float64Array(8));
        }
        return result(distance);
      }
    },
    1
  );
  const out = new Float64Array(8).fill(123);
  expect(() => buffer.positions([1], out)).toThrow(/reentrant/);
  expect(out.every(v => v === 123)).toBe(true);
  expect(buffer.positions([1], out)[3]).toBe(1);
  if (typeof SharedArrayBuffer !== 'undefined')
    expect(() => buffer.positions([0], new Float64Array(new SharedArrayBuffer(64)))).toThrow();
});

test('Scalar line callbacks still ignore Array.map indices and source arrays', () => {
  const axes = {semiMajorAxis: 3, semiMinorAxis: 3};
  for (const line of [
    new EllipsoidGeodesic(axes).line(0, 0, 90),
    new EllipsoidRhumb(axes).line(0, 0, 90)
  ]) {
    const distances = [0, 1, 2];
    expect(distances.map(line.position)).toEqual(distances.map(d => line.position(d)));
  }
});

test('Forced grid transfers retain hemisphere conventions and owned outputs', () => {
  const natural = projectGrid(60, 6),
    forced = projectGrid(60, 6, {zone: 31});
  expect(natural.zone).toBe(32);
  expect(forced.zone).toBe(31);
  const moved = transferGrid(natural, {zone: 31});
  expect(Math.abs(moved.easting - forced.easting)).toBeLessThan(5e-7);
  expect(Math.abs(moved.northing - forced.northing)).toBeLessThan(5e-7);
  const continued = projectGrid(-1, 3, {zone: 31, north: true, extended: true});
  expect(continued.northing).toBeLessThan(0);
  expect(() => unprojectGrid(continued)).toThrow();
  expect(unprojectGrid(continued, {extended: true}).latitude).toBeCloseTo(-1, 10);
  const original = {zone: 31, north: true, easting: 500000.125, northing: 0};
  const same = transferGrid(original);
  expect(same).toEqual(original);
  expect(same).not.toBe(original);
  const south = transferGrid(original, {north: false});
  expect(south).toEqual({...original, north: false, northing: 1e7});
  expect(transferGrid(south, {north: true})).toEqual(original);
  expect(() => transferGrid(projectGrid(90, 0), {north: false})).toThrow();
  for (const options of [{zone: -1}, {zone: 61}, {zone: 1.5}, {zone: NaN}, {north: 'N'}])
    expect(() => projectGrid(20, 30, options as never)).toThrow();
  expect(() => projectGrid(20, 30, {zone: 0, extended: true})).toThrow();
  expect(() => projectGrid(85, 30, {zone: 0, north: false, extended: true})).toThrow();
  expect(() => projectGrid(0, 100, {zone: 31, extended: true})).toThrow();
  for (const grid of [
    {zone: 31, north: true, easting: -1, northing: 0},
    {zone: 0, north: true, easting: 2e6, northing: 2800001},
    {zone: 31, north: true, easting: 500000, northing: 9600001}
  ])
    expect(() => unprojectGrid(grid, {extended: true})).toThrow();
});
test('MGRS sub-metre strings are cells; zone descriptors remain regions', () => {
  expect(formatMGRSZone(48.8582, 2.2945)).toBe('31U');
  expect(formatMGRSZone(90, 0)).toBe('Z');
  expect(formatMGRSZone(60, 6, {zone: 31})).toBe('31V');
  expect(parseMGRSZone(' 31 u ')).toEqual({zone: 31, north: true, band: 'U'});
  expect(parseMGRSZone('a')).toEqual({zone: 0, north: false, band: 'A'});
  for (const text of ['31UDQ', '00N', '61N', '31Z', 'N', 'INVALID', 'ZAH'])
    expect(() => parseMGRSZone(text)).toThrow();
  expect(() => parseMGRS('31U')).toThrow();
  for (let precision = 0; precision <= 11; precision++) {
    const text = formatMGRS(48.8582, 2.2945, precision);
    const center = parseMGRS(text),
      corner = parseMGRS(text, {center: false});
    expect(center.precision).toBe(precision);
    expect(center.resolution).toBe(10 ** (5 - precision));
    expect(Math.abs(center.easting - corner.easting - center.resolution / 2)).toBeLessThan(2e-9);
    expect(Math.abs(center.northing - corner.northing - center.resolution / 2)).toBeLessThan(2e-9);
    if (precision > 5) {
      const tail = text.slice(5),
        coarse = formatMGRS(48.8582, 2.2945, 5);
      expect(text.slice(0, 5) + tail.slice(0, 5) + tail.slice(precision, precision + 5)).toBe(
        coarse
      );
    }
  }
  expect(() => formatMGRS(0, 3, 12)).toThrow();
  expect(() => parseMGRS('31UDQ' + '0'.repeat(24))).toThrow();
  // Independent decimal integer arithmetic at the largest supported digit count.
  const fine = parseMGRS('31UDQ4825112345611932654321', {center: false});
  expect(fine.easting).toBeCloseTo(448251.123456, 8);
  expect(fine.northing).toBeCloseTo(5411932.654321, 8);
});
test('Angle text supports minutes, seconds and explicit longitude-first pairs', () => {
  expect(parseAngle('30′')).toBe(0.5);
  expect(parseAngle('30″W')).toBe(-1 / 120);
  expect(Object.is(parseAngle('0′S'), -0)).toBe(true);
  for (const text of ['60′', '60″', '-60′']) expect(() => parseAngle(text)).toThrow();
  expect(formatAngle(12 + 59.9999 / 60, {format: 'dm', precision: 3})).toBe('13°00.000′');
  const options = {format: 'dm', precision: 6, longitudeFirst: true} as const;
  const text = formatGeographicCoordinates(-12.5, 179.25, options);
  expect(text).toBe('179°15.000000′E, 12°30.000000′S');
  expect(parseGeographicCoordinates(text, options)).toEqual({latitude: -12.5, longitude: 179.25});
  expect(() => parseGeographicCoordinates(text)).toThrow();
});

test('Angle marker whitespace follows the documented grammar', () => {
  expect(parseAngle(' 12 ° 30 ′ 40 ″ N ', 'latitude')).toBeCloseTo(12 + 30 / 60 + 40 / 3600, 12);
  expect(parseAngle('12 : 30 : 40 N', 'latitude')).toBeCloseTo(12 + 30 / 60 + 40 / 3600, 12);
});
