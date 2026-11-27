// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  JulianDate,
  SOLAR_SYSTEM_BODIES,
  getApproximatePlanetPosition,
  getBodyFixedFrame,
  getBodyGravitationalParameter,
  getBodyRadii,
  getBodyRotationElements,
  getBodySubsolarPoint,
  getBodySunDirection
} from '../../src/celestial';
import type {ApproximatePlanet, SolarSystemBody} from '../../src/celestial';
import reference from './data/body-reference.json';

// Controls: modules/earth/scripts/celestial/generate-body-reference.py. CSPICE N0067 with the
// pinned NAIF pck00011.tpc (IAU WGCCRE 2015) and de440s.bsp, and an independent Python evaluation
// of the JPL approximate elements. The generator does not read or run this TypeScript code.
// Gates. The limit is binary64: W reaches 3e7 degrees (Jupiter in 2100), so its last bit is about
// 4e-9 degrees, and the mean longitude of Mercury reaches 7.5e6 degrees in 3000 BC.
const ANGLE_GATE = 1e-8; // degrees, α0, δ0, W and the subsolar point
const MATRIX_GATE = 1e-10; // rotation matrix elements
const RATE_GATE = 1e-14; // rotation matrix derivative elements, per second (largest is 3e-4)
const ELEMENTS_GATE = 1e-10; // au (15 m), the same JPL procedure evaluated in Python

const DEGREES = 180 / Math.PI;
const KM_PER_AU = 149597870.7;

/** A TT Julian date `days` days after J2000.0. */
function tt(days: number): JulianDate {
  return new JulianDate(2451545, days * 86400, 'TT');
}

/** The difference of two angles in degrees, reduced to [-180, 180). */
function angleDifference(a: number, b: number): number {
  return ((((a - b + 180) % 360) + 360) % 360) - 180;
}

function maximumDifference(a: readonly number[], b: readonly number[]): number {
  return Math.max(...a.map((value, i) => Math.abs(value - b[i])));
}

test('celestial#getBodyRotationElements matches CSPICE and pck00011 for every body', () => {
  expect(reference.rotation).toHaveLength(SOLAR_SYSTEM_BODIES.length * 9);
  for (const control of reference.rotation) {
    const elements = getBodyRotationElements(control.body as SolarSystemBody, tt(control.days));
    for (const angle of [elements.poleRightAscension, elements.primeMeridian]) {
      expect(angle >= 0 && angle < 360).toBe(true);
    }
    expect(Math.abs(elements.poleDeclination)).toBeLessThanOrEqual(90);
    const label = `${control.body} at ${control.days}`;
    // Within 0.001 degrees of the ICRF pole (the Earth near J2000.0), the Euler angles of the
    // control are ill-conditioned: δ0 comes from an arccosine near 1, and only α0 + W is defined.
    // The matrix test covers these dates with the full gate.
    const sum = elements.poleRightAscension + elements.primeMeridian;
    if (90 - Math.abs(control.poleDeclination) < 1e-3) {
      const controlSum = control.poleRightAscension + control.primeMeridian;
      expect(Math.abs(angleDifference(sum, controlSum)), label).toBeLessThanOrEqual(1e-6);
      expect(
        Math.abs(elements.poleDeclination - control.poleDeclination),
        label
      ).toBeLessThanOrEqual(1e-6);
      continue;
    }
    expect(Math.abs(elements.poleDeclination - control.poleDeclination), label).toBeLessThanOrEqual(
      ANGLE_GATE
    );
    expect(
      Math.abs(angleDifference(elements.poleRightAscension, control.poleRightAscension)),
      label
    ).toBeLessThanOrEqual(ANGLE_GATE);
    expect(
      Math.abs(angleDifference(elements.primeMeridian, control.primeMeridian)),
      label
    ).toBeLessThanOrEqual(ANGLE_GATE);
  }
});

test('celestial#getBodyFixedFrame matches the CSPICE rotation and its derivative', () => {
  for (const control of reference.rotation) {
    const frame = getBodyFixedFrame(control.body as SolarSystemBody, tt(control.days));
    const label = `${control.body} at ${control.days}`;
    expect(frame.from).toBe('ICRF');
    expect(frame.to).toBe(`IAU_${control.body.toUpperCase()}`);
    expect(maximumDifference(frame.rotation, control.rotation), label).toBeLessThanOrEqual(
      MATRIX_GATE
    );
    expect(maximumDifference(frame.rotationRate!, control.rotationRate), label).toBeLessThanOrEqual(
      RATE_GATE
    );
  }
});

test('celestial#getBodyFixedFrame gives the body-fixed velocity of a point fixed in the ICRF', () => {
  // A point at rest in the ICRF on the equator of Mars moves west in the body-fixed frame at the
  // rotation speed: |v| = ω r, with ω from W' = 350.891982443297 degrees per day.
  const frame = getBodyFixedFrame('mars', tt(9792.5));
  const pole = frame.inverse().transformPosition([0, 0, 1]);
  const equator = frame.inverse().transformPosition([1, 0, 0]);
  expect(Math.hypot(...pole.map((value, i) => value - equator[i]))).toBeCloseTo(Math.SQRT2, 12);
  const {velocity} = frame.transformState({position: equator, velocity: [0, 0, 0]});
  const omega = (350.891982443297 * Math.PI) / 180 / 86400;
  expect(velocity[1]).toBeLessThan(0);
  expect(Math.abs(Math.hypot(...velocity) - omega) / omega).toBeLessThan(1e-5);
});

test('celestial#getBodySubsolarPoint matches CSPICE with DE440 Sun positions', () => {
  expect(reference.subsolar.length).toBeGreaterThan(30);
  for (const control of reference.subsolar) {
    const body = control.body as SolarSystemBody;
    const point = getBodySubsolarPoint(body, tt(control.days), control.sunPosition);
    const label = `${control.body} at ${control.days}`;
    expect(
      Math.abs(angleDifference(point.longitude, control.longitude)),
      label
    ).toBeLessThanOrEqual(ANGLE_GATE);
    expect(Math.abs(point.latitude - control.latitude), label).toBeLessThanOrEqual(ANGLE_GATE);
    // The direction does not depend on the unit or the length of the Sun position.
    const scaled = control.sunPosition.map(value => value / KM_PER_AU);
    const direction = getBodySunDirection(body, tt(control.days), scaled);
    expect(Math.hypot(...direction)).toBeCloseTo(1, 14);
  }
});

test('celestial#getApproximatePlanetPosition matches an independent evaluation of the JPL tables', () => {
  expect(reference.elements).toHaveLength(8 * 12);
  for (const control of reference.elements) {
    const planet = control.planet as ApproximatePlanet;
    const label = `${control.planet} at ${control.days}`;
    const equatorial = getApproximatePlanetPosition(planet, tt(control.days));
    const ecliptic = getApproximatePlanetPosition(planet, tt(control.days), {frame: 'ecliptic'});
    expect(maximumDifference(equatorial, control.equatorial), label).toBeLessThanOrEqual(
      ELEMENTS_GATE
    );
    expect(maximumDifference(ecliptic, control.ecliptic), label).toBeLessThanOrEqual(ELEMENTS_GATE);
  }
});

// Measured largest heliocentric errors of Table 1 against DE440, 1850 to 2050: longitude and
// latitude in arcseconds, distance in 1000 km. JPL calls its figures nominal, not largest; the
// measured values are above them for some planets (see the documentation).
const TABLE_1_ERROR_GATES: Record<ApproximatePlanet, readonly [number, number, number]> = {
  mercury: [30, 4, 2],
  venus: [30, 2, 7],
  'earth-moon-barycenter': [25, 7, 8],
  mars: [100, 4, 40],
  jupiter: [550, 12, 700],
  saturn: [800, 35, 3000],
  uranus: [130, 5, 1700],
  neptune: [65, 2, 1700]
};

test('celestial#getApproximatePlanetPosition stays inside the declared error gates against DE440', () => {
  const worst: Record<string, number[]> = {};
  for (const control of reference.ephemeris) {
    const planet = control.planet as ApproximatePlanet;
    const position = getApproximatePlanetPosition(planet, tt(control.days), {frame: 'ecliptic'});
    const truth = control.ecliptic;
    const longitude = (v: readonly number[]) => Math.atan2(v[1], v[0]) * DEGREES;
    const latitude = (v: readonly number[]) => Math.atan2(v[2], Math.hypot(v[0], v[1]));
    const errors = [
      Math.abs(angleDifference(longitude(position), longitude(truth))) * 3600,
      Math.abs(latitude(position) - latitude(truth)) * DEGREES * 3600,
      (Math.abs(Math.hypot(...position) - Math.hypot(...truth)) * KM_PER_AU) / 1000
    ];
    worst[planet] = (worst[planet] ?? [0, 0, 0]).map((value, i) => Math.max(value, errors[i]));
  }
  for (const [planet, gates] of Object.entries(TABLE_1_ERROR_GATES)) {
    const errors = worst[planet];
    gates.forEach((gate, i) => expect(errors[i], `${planet} error ${i}`).toBeLessThanOrEqual(gate));
  }
  // Control: the gates can fail. Mars a quarter of a year later is far outside them.
  const wrong = getApproximatePlanetPosition('mars', tt(9792.5 + 91), {frame: 'ecliptic'});
  const right = getApproximatePlanetPosition('mars', tt(9792.5), {frame: 'ecliptic'});
  expect((maximumDifference(wrong, right) * KM_PER_AU) / 1000).toBeGreaterThan(
    TABLE_1_ERROR_GATES.mars[2]
  );
});

test('celestial#getApproximatePlanetPosition uses Table 2 outside 1800 to 2050', () => {
  // The two tables differ at the boundary by less than their stated errors, but not by zero.
  const inside = getApproximatePlanetPosition('jupiter', tt(18263));
  const outside = getApproximatePlanetPosition('jupiter', tt(18263.000001));
  const step = maximumDifference(inside, outside) * KM_PER_AU;
  expect(step).toBeGreaterThan(1);
  expect(step).toBeLessThan(1000000);
});

test('celestial#body constants are the pinned IAU 2015 and DE440 values', () => {
  expect(getBodyRadii('moon')).toEqual({equatorialRadius: 1737400, polarRadius: 1737400});
  expect(getBodyRadii('mars')).toEqual({equatorialRadius: 3396190, polarRadius: 3376200});
  expect(getBodyRadii('earth')).toEqual({equatorialRadius: 6378136.6, polarRadius: 6356751.9});
  expect(getBodyRadii('mercury')).toEqual({equatorialRadius: 2440530, polarRadius: 2438260});
  expect(getBodyGravitationalParameter('earth')).toBeCloseTo(3.9860043550702266e14, 0);
  expect(getBodyGravitationalParameter('sun')).toBeCloseTo(1.3271244004127942e20, -6);
  // Every body has a value, and the radii are ordered.
  for (const body of SOLAR_SYSTEM_BODIES) {
    const {equatorialRadius, polarRadius} = getBodyRadii(body);
    expect(equatorialRadius).toBeGreaterThanOrEqual(polarRadius);
    expect(getBodyGravitationalParameter(body)).toBeGreaterThan(0);
  }
  expect(Object.isFrozen(SOLAR_SYSTEM_BODIES)).toBe(true);
});

test('celestial#body functions reject inputs outside their domain with RangeError', () => {
  const j2000 = tt(0);
  expect(() => getBodyRadii('pluto' as SolarSystemBody)).toThrow(RangeError);
  expect(() => getBodyRadii('toString' as SolarSystemBody)).toThrow(RangeError);
  expect(() => getBodyGravitationalParameter('io' as SolarSystemBody)).toThrow(RangeError);
  expect(() => getBodyRotationElements('mars', new JulianDate(2451545, 0, 'TAI'))).toThrow(
    RangeError
  );
  expect(() => getBodyRotationElements('mars', {} as JulianDate)).toThrow(RangeError);
  expect(() => getBodyRotationElements('mars', tt(-36524.001))).toThrow(RangeError);
  expect(() => getBodyRotationElements('mars', tt(36525.001))).toThrow(RangeError);
  expect(() => getBodyRotationElements('mars', tt(-36524))).not.toThrow();
  expect(() => getBodyFixedFrame('ceres' as SolarSystemBody, j2000)).toThrow(RangeError);
  expect(() => getBodySubsolarPoint('mars', j2000, [0, 0, 0])).toThrow(RangeError);
  expect(() => getBodySubsolarPoint('mars', j2000, [1, Number.NaN, 0])).toThrow(RangeError);
  expect(() => getBodySubsolarPoint('mars', j2000, [1, 0])).toThrow(RangeError);
  expect(() => getApproximatePlanetPosition('pluto' as ApproximatePlanet, j2000)).toThrow(
    RangeError
  );
  expect(() => getApproximatePlanetPosition('earth' as ApproximatePlanet, j2000)).toThrow(
    RangeError
  );
  expect(() =>
    getApproximatePlanetPosition('mars', j2000, {frame: 'galactic' as 'ecliptic'})
  ).toThrow(RangeError);
  expect(() => getApproximatePlanetPosition('mars', tt(-1825871.001))).toThrow(RangeError);
  expect(() => getApproximatePlanetPosition('mars', tt(365243.001))).toThrow(RangeError);
  expect(() => getApproximatePlanetPosition('mars', tt(365243))).not.toThrow();
});

test('planetary fits can be pinned across the automatic switch', () => {
  const epoch = new JulianDate(2451545 + 18263, 0, 'TT');
  const position = (seconds: number, model: 'auto' | 'short' | 'long') =>
    getApproximatePlanetPosition('saturn', epoch.addSeconds(seconds), {model});
  expect(position(0, 'auto')).toEqual(position(0, 'short'));
  expect(position(0, 'auto')).not.toEqual(position(0, 'long'));
  expect(position(1, 'auto')).toEqual(position(1, 'long'));
  expect(() => position(1, 'short')).toThrow(RangeError);
});
