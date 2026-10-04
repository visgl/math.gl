// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {
  STAR_CATALOG,
  STAR_CATALOG_INFO,
  getStarLayerData,
  getStarPosition,
  getStarPositions,
  getStarColor,
  getGalacticAcceleration,
  getGalacticPotential,
  integrateGalacticOrbit,
  createMilkyWayBackground
} from '../src/stars';
import {equatorialToGalactic, galacticToEquatorial, KMS_TO_PC_PER_YEAR} from '../src/star-galactic';
import {getStarfieldRotation, getSkyGlobePosition} from '../src';
import type {StarRecord} from '../src/stars';

const base: StarRecord = {
  id: 1,
  designation: 'test',
  epochYear: 2000,
  rightAscension: 0,
  declination: 0,
  magnitude: 1,
  colorIndex: null,
  properMotionRA: 0,
  properMotionDec: 0,
  parallax: null,
  radialVelocity: null,
  dynamicalParallax: false,
  radialVelocityFlags: ''
};
const closeVector = (a: readonly number[], b: readonly number[], digits = 10): void => {
  for (let i = 0; i < 3; i++) expect(a[i]).toBeCloseTo(b[i], digits);
};

test('stars: catalog size, immutable records, unique identifiers and provenance statistics', () => {
  expect(STAR_CATALOG).toHaveLength(7000);
  expect(new Set(STAR_CATALOG.map(s => s.id)).size).toBe(7000);
  expect(Object.isFrozen(STAR_CATALOG)).toBe(true);
  expect(STAR_CATALOG.every(Object.isFrozen)).toBe(true);
  expect(
    STAR_CATALOG.every(s => Number.isFinite(s.properMotionRA) && Number.isFinite(s.properMotionDec))
  ).toBe(true);
  expect(STAR_CATALOG.filter(s => s.parallax !== null && s.parallax > 0)).toHaveLength(
    STAR_CATALOG_INFO.positiveParallaxes
  );
  expect(
    STAR_CATALOG.filter(s => s.parallax !== null && s.parallax > 0 && s.radialVelocity !== null)
  ).toHaveLength(STAR_CATALOG_INFO.fullSpaceMotions);
  expect(STAR_CATALOG[6999].magnitude).toBe(6.3);
  for (let i = 1; i < STAR_CATALOG.length; i++) {
    const previous = STAR_CATALOG[i - 1],
      current = STAR_CATALOG[i];
    expect(current.magnitude >= previous.magnitude).toBe(true);
    if (current.magnitude === previous.magnitude) expect(current.id).toBeGreaterThan(previous.id);
  }
});

test('stars: Sirius and Polaris retain catalog units including projected RA motion', () => {
  const sirius = STAR_CATALOG.find(s => s.id === 2491)!;
  expect(sirius.magnitude).toBe(-1.46);
  expect(sirius.properMotionRA).toBe(-553);
  expect(sirius.properMotionDec).toBe(-1205);
  expect(sirius.parallax).toBe(375);
  expect(sirius.radialVelocity).toBe(-8);
  expect(sirius.radialVelocityFlags).toBe('SBO');
  expect((sirius.rightAscension * 180) / Math.PI).toBeCloseTo(101.2870833333, 7);
  expect((sirius.declination * 180) / Math.PI).toBeCloseTo(-16.7161111111, 7);
  expect(STAR_CATALOG.find(s => s.id === 424)!.properMotionRA).toBe(38);
});

test('stars: tangent motion crosses poles without dividing by cos(dec)', () => {
  const pole = {...base, declination: Math.PI / 2, properMotionRA: 1000};
  const result = getStarPosition(pole, 3000);
  closeVector(
    result.equatorialDirection,
    [0, Math.sin(Math.atan(Math.PI / 648)), Math.cos(Math.atan(Math.PI / 648))],
    10
  );
  expect(result.motionModel).toBe('angular');
  expect(result.distanceParsecs).toBeNull();
  expect(result.magnitude).toBe(base.magnitude);
});

test('stars: analytic perspective motion, inverse square dimming, missing radial velocity', () => {
  const star = {...base, parallax: 100, radialVelocity: 10};
  const result = getStarPosition(star, 1002000);
  const expectedDistance = 10 + 10 * KMS_TO_PC_PER_YEAR * 1e6;
  expect(result.distanceParsecs).toBeCloseTo(expectedDistance, 10);
  expect(result.magnitude).toBeCloseTo(1 + 5 * Math.log10(expectedDistance / 10), 10);
  expect(result.relativeFlux / getStarPosition(star, 2000).relativeFlux).toBeCloseTo(
    (10 / expectedDistance) ** 2,
    10
  );
  expect(result.motionModel).toBe('rectilinear');
  expect(result.radialVelocityAssumed).toBe(false);
  const missing = getStarPosition({...star, radialVelocity: null}, 1002000);
  expect(missing.radialVelocityAssumed).toBe(true);
  expect(missing.distanceParsecs).toBe(10);
});

test('stars: present epoch, modern observer rotation and batch agreement', () => {
  const rotation = getStarfieldRotation(new Date('2026-10-04T00:00:00Z'), 37, -122);
  const stars = getStarPositions(2000, {rotation}, STAR_CATALOG.slice(0, 20));
  for (const result of stars) {
    expect(Math.hypot(...result.direction)).toBeCloseTo(1, 10);
    expect(result.rightAscension).toBeCloseTo(result.star.rightAscension, 10);
    expect(result.declination).toBeCloseTo(result.star.declination, 10);
    expect(result).toEqual(getStarPosition(result.star, 2000, {rotation}));
  }
  const rotated = getStarPosition(base, 2000, {rotation: [0, 1, 0, -1, 0, 0, 0, 0, 1]});
  closeVector(rotated.direction, [0, 1, 0]);
});

test('stars: Galactic coordinate transformation agrees with IAU J2000 axes', () => {
  closeVector(equatorialToGalactic([1, 0, 0]), [-0.0548755604, 0.4941094279, -0.867666149], 7);
  const vector = [0.3, -0.4, 0.8];
  closeVector(galacticToEquatorial(equatorialToGalactic(vector)), vector);
});

test('stars: Galactic acceleration is potential gradient and symmetric about disk', () => {
  const p = [-8000, 2000, 500];
  const a = getGalacticAcceleration(p);
  for (let i = 0; i < 3; i++) {
    const plus = [...p],
      minus = [...p];
    plus[i] += 0.01;
    minus[i] -= 0.01;
    expect(a[i]).toBeCloseTo(-(getGalacticPotential(plus) - getGalacticPotential(minus)) / 0.02, 5);
  }
  const mirrored = getGalacticAcceleration([-8000, 2000, -500]);
  closeVector(mirrored, [a[0], a[1], -a[2]]);
  closeVector(getGalacticAcceleration([0, 0, 0]), [0, 0, 0]);
});

test('stars: million-year Galactic orbit conserves energy, angular momentum and reverses', () => {
  const p = [-8000, 0, 20],
    v = [12, 310, 7];
  const energy = (position: number[], velocity: number[]): number =>
    velocity.reduce((sum, value) => sum + (value * value) / 2, 0) + getGalacticPotential(position);
  const orbit = integrateGalacticOrbit(p, v, 1e6);
  expect(
    Math.abs((energy(orbit.position, orbit.velocity) - energy(p, v)) / energy(p, v))
  ).toBeLessThan(1e-7);
  expect(orbit.position[0] * orbit.velocity[1] - orbit.position[1] * orbit.velocity[0]).toBeCloseTo(
    p[0] * v[1],
    7
  );
  const reversed = integrateGalacticOrbit(orbit.position, orbit.velocity, -1e6);
  closeVector(reversed.position, p, 8);
  closeVector(reversed.velocity, v, 9);
  const finer = integrateGalacticOrbit(p, v, 1e6, 5000);
  expect(Math.hypot(...finer.position.map((value, i) => value - orbit.position[i]))).toBeLessThan(
    0.001
  );
});

test('stars: Galactic source motion shares Solar motion and clearly labels angular fallback', () => {
  const sources = [STAR_CATALOG[0], {...base, parallax: -1}];
  const result = getStarPositions(1002000, {model: 'galactic'}, sources);
  expect(result[0].motionModel).toBe('galactic');
  expect(result[1].motionModel).toBe('angular');
  for (let i = 0; i < sources.length; i++)
    expect(result[i]).toEqual(getStarPosition(sources[i], 1002000, {model: 'galactic'}));
  closeVector(
    getStarPosition(STAR_CATALOG[0], 2000, {model: 'galactic'}).equatorialDirection,
    getStarPosition(STAR_CATALOG[0], 2000).equatorialDirection,
    10
  );
});

test('stars: all 7,000 directions remain finite at both million-year limits', () => {
  for (const year of [-9998000, 10002000]) {
    const positions = getStarPositions(year);
    expect(
      positions.every(p => p.direction.every(Number.isFinite) && Number.isFinite(p.magnitude))
    ).toBe(true);
  }
});

test('stars: colors trend blue to red and cannot mutate shared catalog colors', () => {
  const blue = getStarColor(-0.3),
    red = getStarColor(1.5);
  expect(blue[2]).toBeGreaterThan(blue[0]);
  expect(red[0]).toBeGreaterThan(red[2]);
  expect(Object.isFrozen(red)).toBe(true);
  expect(getStarColor(null)).toEqual([1, 1, 1]);
  expect(() => getStarColor(NaN)).toThrow(RangeError);
});

test('stars: procedural Milky Way is brighter near plane, shifts center with observer orbit', () => {
  const sky = createMilkyWayBackground();
  const plane = galacticToEquatorial([Math.cos(0.05), 0, Math.sin(0.05)]);
  expect(sky.sample(plane).intensity).toBeGreaterThan(sky.sample(sky.northDirection).intensity);
  expect(sky.sample(plane.map(v => v * 3))).toEqual(sky.sample(plane));
  expect(sky.sample(sky.centerDirection).intensity).toBeLessThan(sky.sample(plane).intensity);
  expect(createMilkyWayBackground(1002000).centerDirection).not.toEqual(sky.centerDirection);
  expect(() => sky.sample([0, 0, 0])).toThrow(RangeError);
});

test('stars: rejects invalid epochs, reflected matrices, malformed stars and unbounded integration', () => {
  for (const year of [NaN, Infinity, 10002001])
    expect(() => getStarPositions(year)).toThrow(RangeError);
  expect(() => getStarPosition({...base, declination: 2}, 2000)).toThrow(RangeError);
  expect(() => getStarPosition(base, 2000, {rotation: [-1, 0, 0, 0, 1, 0, 0, 0, 1]})).toThrow(
    RangeError
  );
  expect(() => getStarPosition(base, 2000, {rotation: [2, 0, 0, 0, 1, 0, 0, 0, 1]})).toThrow(
    RangeError
  );
  expect(() => integrateGalacticOrbit([1, 0, 0], [0, 1, 0], 1e7, 1)).toThrow(RangeError);
  expect(() =>
    getStarPosition({...base, epochYear: 2010, parallax: 10}, 2010, {model: 'galactic'})
  ).toThrow(RangeError);
});

test('stars: deck.gl adapter returns globe positions, byte colors and pixel radii without double rotation', () => {
  const observer = {latitude: 37.8, longitude: -122.4, elevation: 100};
  const timestamp = new Date('2026-10-04T00:00:00Z');
  const stars = getStarPositions(
    2000,
    {rotation: [0, 1, 0, -1, 0, 0, 0, 0, 1]},
    STAR_CATALOG.slice(0, 20)
  );
  const data = getStarLayerData(stars, {observer, timestamp});
  expect(data).toHaveLength(20);
  const rotation = getStarfieldRotation(timestamp, observer.latitude, observer.longitude);
  const local = getStarPositions(2000, {rotation}, STAR_CATALOG.slice(0, 20));
  for (let i = 0; i < data.length; i++) {
    closeVector(data[i].position, getSkyGlobePosition(local[i].direction, observer, 1e7), 7);
    expect(
      data[i].color.every(value => Number.isInteger(value) && value >= 0 && value <= 255)
    ).toBe(true);
    expect(data[i].radiusPixels).toBeGreaterThanOrEqual(0.5);
    expect(data[i].radiusPixels).toBeLessThanOrEqual(6);
  }
  expect(getStarLayerData(stars, {observer, rotation})).toEqual(data);
});

test('stars: deck.gl Cartesian, cutoff, horizon and subpixel brightness behavior', () => {
  const stars = getStarPositions(2000, {}, [
    base,
    {...base, id: 2, declination: -0.5, magnitude: 8}
  ]);
  const rotation = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const observer = {latitude: 0, longitude: 0, elevation: 0};
  const all = getStarLayerData(stars, {coordinates: 'local', observer, rotation, distance: 10});
  closeVector(all[0].position, [10, 0, 0]);
  expect(all[1].color[3]).toBeLessThan(all[0].color[3]);
  expect(
    getStarLayerData(stars, {coordinates: 'local', observer, rotation, clipHorizon: true})
  ).toHaveLength(1);
  expect(getStarLayerData(stars, {coordinates: 'equatorial', maximumMagnitude: 6})).toHaveLength(1);
  closeVector(
    getStarLayerData(stars, {coordinates: 'equatorial', distance: 1})[1].position,
    stars[1].equatorialDirection
  );
  expect(() => getStarLayerData(stars)).toThrow(RangeError);
  expect(() => getStarLayerData(stars, {coordinates: 'equatorial', clipHorizon: true})).toThrow(
    RangeError
  );
  expect(() =>
    getStarLayerData(stars, {observer, minimumRadiusPixels: 8, maximumRadiusPixels: 4})
  ).toThrow(RangeError);
});

test('stars: complete Galactic catalog is finite a million years before and after J2000', () => {
  for (const epoch of [-998000, 1002000]) {
    const stars = getStarPositions(epoch, {model: 'galactic'});
    expect(stars.filter(star => star.motionModel === 'galactic')).toHaveLength(2797);
    expect(stars.filter(star => star.motionModel === 'angular')).toHaveLength(4203);
    expect(
      stars.every(
        star =>
          star.equatorialDirection.every(Number.isFinite) &&
          Math.abs(Math.hypot(...star.equatorialDirection) - 1) < 1e-12 &&
          Number.isFinite(star.magnitude)
      )
    ).toBe(true);
  }
});
