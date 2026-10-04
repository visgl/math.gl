// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {getPlanetSkyInfo} from '../src/planets';
import {PLANET_REFERENCE} from './data/planet-reference';

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const arcseconds = (angle: number) => (angle * 180 * 3600) / Math.PI;
function referenceDirection(reference: (typeof PLANET_REFERENCE)[number]): number[] {
  const ra = radians(reference.rightAscension);
  const dec = radians(reference.declination);
  return [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
}
function separation(a: number[], b: number[]): number {
  return Math.atan2(
    Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]),
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  );
}

test('planet sky agrees with independent JPL Horizons topocentric astrometric positions', () => {
  for (const date of ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z']) {
    const bodies = getPlanetSkyInfo(new Date(date), 37.8, -122.4);
    for (const reference of PLANET_REFERENCE.filter(row => row.date === date)) {
      const body = bodies.find(row => row.name === reference.name)!;
      expect(
        arcseconds(separation(body.equatorialDirection, referenceDirection(reference))),
        reference.name
      ).toBeLessThan(60);
      expect(
        Math.abs(body.distance / 149597870.7 - reference.distanceAU),
        reference.name
      ).toBeLessThan(0.001);
    }
    // Differential satellite offsets cancel the lower-accuracy planetary model.
    // A missing Jupiter-to-Earth light delay shifts fast-moving Io substantially.
    const referenceJupiter = referenceDirection(
      PLANET_REFERENCE.find(row => row.date === date && row.name === 'Jupiter')!
    );
    const jupiter = bodies.find(row => row.name === 'Jupiter')!;
    for (const body of bodies.filter(row => row.parent === 'Jupiter')) {
      const reference = referenceDirection(
        PLANET_REFERENCE.find(row => row.date === date && row.name === body.name)!
      );
      const actualOffset = body.equatorialDirection.map(
        (value, i) => value - jupiter.equatorialDirection[i]
      );
      const expectedOffset = reference.map((value, i) => value - referenceJupiter[i]);
      expect(
        arcseconds(Math.hypot(...actualOffset.map((value, i) => value - expectedOffset[i]))),
        body.name
      ).toBeLessThan(2);
    }
  }
});

test('planet sky provides finite rendering geometry, phases and explicit unavailable moon photometry', () => {
  const bodies = getPlanetSkyInfo(new Date('2024-01-01T00:00:00Z'), 37.8, -122.4);
  expect(bodies.map(row => row.name)).toEqual([
    'Mercury',
    'Venus',
    'Mars',
    'Jupiter',
    'Saturn',
    'Uranus',
    'Neptune',
    'Io',
    'Europa',
    'Ganymede',
    'Callisto'
  ]);
  for (const body of bodies) {
    for (const direction of [body.direction, body.equatorialDirection, body.sunDirection]) {
      expect(Math.hypot(...direction)).toBeCloseTo(1, 12);
    }
    expect(body.distance).toBeGreaterThan(1e7);
    expect(body.angularDiameter).toBeGreaterThan(0);
    expect(body.angularDiameter).toBeLessThan(0.001);
    expect(body.phaseAngle).toBeGreaterThanOrEqual(0);
    expect(body.phaseAngle).toBeLessThanOrEqual(Math.PI);
    expect(body.illuminatedFraction).toBeGreaterThanOrEqual(0);
    expect(body.illuminatedFraction).toBeLessThanOrEqual(1);
    expect(Math.sin(body.altitude)).toBeCloseTo(body.direction[2], 12);
    if (body.parent) {
      expect(body.magnitude).toBeNull();
      expect(Math.hypot(...body.jupiterOffset!)).toBeGreaterThan(3e5);
      expect(Math.hypot(...body.jupiterOffset!)).toBeLessThan(2e6);
    } else {
      expect(Number.isFinite(body.magnitude)).toBe(true);
      expect(body.jupiterOffset).toBeNull();
    }
  }
  const venus = bodies.find(row => row.name === 'Venus')!;
  expect(venus.magnitude).toBeLessThan(-3);
  expect(venus.illuminatedFraction).toBeGreaterThan(0.7);
  expect(venus.illuminatedFraction).toBeLessThan(0.9);
});

test('planet sky transforms outward directions consistently with location and Earth rotation', () => {
  const time = new Date('2024-01-01T00:00:00Z');
  const equator = getPlanetSkyInfo(time, 0, 0, {galileanMoons: false});
  const east = getPlanetSkyInfo(time, 0, 90, {galileanMoons: false});
  for (let i = 0; i < equator.length; i++) {
    expect(east[i].direction[0]).toBeCloseTo(-equator[i].direction[2], 4);
    expect(east[i].direction[2]).toBeCloseTo(equator[i].direction[0], 4);
    expect(east[i].direction[1]).toBeCloseTo(equator[i].direction[1], 4);
  }
  const later = getPlanetSkyInfo(time.getTime() + 6 * 3600000, 0, 0, {galileanMoons: false});
  const i = 3; // Jupiter barely moves against the stars in six hours.
  expect(separation(equator[i].direction, later[i].direction)).toBeGreaterThan(1);
  expect(separation(equator[i].equatorialDirection, later[i].equatorialDirection)).toBeLessThan(
    0.001
  );
  expect(getPlanetSkyInfo(time, 90, 0).every(body => body.direction.every(Number.isFinite))).toBe(
    true
  );
  expect(getPlanetSkyInfo(time, -90, 0).every(body => body.direction.every(Number.isFinite))).toBe(
    true
  );
});

test('Galilean moons traverse foreground, occulted and shadow configurations', () => {
  const configurations = new Set<string>();
  for (let hour = 0; hour < 96; hour += 2) {
    const bodies = getPlanetSkyInfo(Date.UTC(2024, 0, 1, hour), 0, 0);
    const jupiter = bodies[3];
    for (const moon of bodies.slice(7)) {
      if (moon.transiting) {
        configurations.add('transit');
        expect(moon.distance).toBeLessThan(jupiter.distance);
      }
      if (moon.occultation !== 'none') {
        configurations.add('occultation');
        expect(moon.distance).toBeGreaterThan(jupiter.distance);
        expect(moon.transiting).toBe(false);
      }
      if (moon.inJupiterShadow) configurations.add('shadow');
    }
  }
  expect(configurations).toEqual(new Set(['transit', 'occultation', 'shadow']));
});

test('planet sky validates observation inputs and preserves timestamp/longitude conventions', () => {
  const date = new Date('2024-01-01T00:00:00Z');
  expect(getPlanetSkyInfo(date, 0, 0)).toEqual(getPlanetSkyInfo(date.getTime(), 0, 360));
  for (const args of [
    [new Date(NaN), 0, 0],
    [Infinity, 0, 0],
    [date, 91, 0],
    [date, NaN, 0],
    [date, 0, Infinity],
    [new Date('1899-12-31T23:59:59Z'), 0, 0],
    [new Date('2101-01-01T00:00:00Z'), 0, 0]
  ] as [Date | number, number, number][])
    expect(() => getPlanetSkyInfo(...args)).toThrow(RangeError);
  for (const elevation of [NaN, -1001, 100001])
    expect(() => getPlanetSkyInfo(date, 0, 0, {elevation})).toThrow(RangeError);
  expect(() => getPlanetSkyInfo(date, 0, 0, {galileanMoons: 1 as unknown as boolean})).toThrow(
    RangeError
  );
  expect(getPlanetSkyInfo(date, 0, 0, {galileanMoons: false})).toHaveLength(7);
});
