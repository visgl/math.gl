// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {
  createSkyObserver,
  getSkyGlobePosition,
  skyDirectionToGlobe,
  getSkyGlobeRotation,
  getSkyLuminance,
  getMoonAppearance,
  SKY_GLOBE_EARTH_RADIUS
} from '../src';
import {getSkySnapshot, createSkyContext} from '../src/astronomy';
import {createSkyTime} from '../src/sky-time';
import {searchSkyVisibility, getSkyLighting} from '../src';
import {getScatteredMoonLuminance} from '../src';
import {getSkyHorizonAltitude} from '../src';
import {getPlanetVisibility} from '../src/planet-visibility';

const rad = (degrees: number) => (degrees * Math.PI) / 180;
const project = ([longitude, latitude, altitude]: number[]) => {
  const radius = SKY_GLOBE_EARTH_RADIUS + altitude;
  return [
    Math.sin(rad(longitude)) * Math.cos(rad(latitude)) * radius,
    -Math.cos(rad(longitude)) * Math.cos(rad(latitude)) * radius,
    Math.sin(rad(latitude)) * radius
  ];
};
test('globe rays survive LNGLAT projection at poles, dateline and both hemispheres', () => {
  for (const latitude of [-90, -45, 0, 45, 90])
    for (const longitude of [-180, 0, 90, 180, 540]) {
      const observer = createSkyObserver({latitude, longitude, elevation: 300});
      const origin = project([observer.longitude, observer.latitude, observer.elevation]);
      for (const direction of [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [0.3, -0.4, Math.sqrt(0.75)]
      ]) {
        const p = project(getSkyGlobePosition(direction, observer, 1e7));
        const ray = skyDirectionToGlobe(direction, observer);
        for (let i = 0; i < 3; i++) expect((p[i] - origin[i]) / 1e7).toBeCloseTo(ray[i], 10);
      }
      const m = getSkyGlobeRotation(observer);
      for (const offset of [0, 3, 6])
        expect(Math.hypot(...m.slice(offset, offset + 3))).toBeCloseTo(1, 12);
    }
});

test('twilight matches published Patat V-band fit at reference pressure', () => {
  for (const depression of [5, 10, 15]) {
    const luminance = getSkyLuminance(rad(-depression), Math.PI / 2, rad(90 + depression), {
      pressure: 743
    });
    const magnitude = 12.58 - 2.5 * Math.log10(luminance);
    expect(magnitude).toBeCloseTo(
      11.84 + 1.518 * (depression - 5) - 0.057 * (depression - 5) ** 2,
      10
    );
  }
});

test('Moon is visible at night and can be visible or invisible in daytime', () => {
  const quarter = {phaseAngle: Math.PI / 2, sunSeparation: Math.PI / 2};
  const night = getMoonAppearance(rad(50), rad(-25), quarter);
  const day = getMoonAppearance(rad(50), rad(30), quarter);
  const crescent = getMoonAppearance(rad(20), rad(30), {
    phaseAngle: rad(175),
    sunSeparation: rad(5)
  });
  expect(night.visible).toBe(true);
  expect(day.visible).toBe(true);
  expect(day.contrast).toBeLessThan(night.contrast);
  expect(day.illuminance).toEqual(night.illuminance);
  expect(crescent.visible).toBe(false);
  expect(crescent.fade).toBeLessThan(day.fade);
  expect(getMoonAppearance(rad(-5), rad(-25), quarter).fade).toBe(0);
  expect(getMoonAppearance(rad(50), rad(30), {...quarter, cloudCover: 1}).fade).toBeLessThan(
    day.fade
  );
  expect(getMoonAppearance(rad(50), rad(-25), {...quarter, phaseAngle: Math.PI}).illuminance).toBe(
    0
  );
});

test('snapshot aligns stars, body axes and globe directions', () => {
  const observer = createSkyObserver({latitude: 37.8, longitude: -122.4});
  const snapshot = getSkySnapshot(new Date('2024-01-01T00:00:00Z'), observer);
  for (const body of [snapshot.sun, snapshot.moon, ...snapshot.planets]) {
    expect(Math.hypot(...body.direction)).toBeCloseTo(1, 12);
    expect(body.globeDirection).toEqual(skyDirectionToGlobe(body.direction, observer));
  }
  expect(snapshot.moon.appearance.illuminance).toBeGreaterThanOrEqual(0);
  const m = snapshot.moon.rotation;
  for (const offset of [0, 3, 6])
    expect(Math.hypot(...m.slice(offset, offset + 3))).toBeCloseTo(1, 10);
  expect(snapshot.planets.find(body => body.name === 'Saturn')?.rings?.outerRadius).toBe(136780);
});

test('sky input validation', () => {
  expect(() => createSkyObserver({latitude: 91, longitude: 0})).toThrow(RangeError);
  const observer = createSkyObserver({latitude: 0, longitude: 0});
  expect(() => getSkyGlobePosition([0, 0, 0], observer, 1e7)).toThrow(RangeError);
  expect(() => getSkyGlobePosition([0, 0, 1], observer, 0)).toThrow(RangeError);
  expect(() => getSkyLuminance(0, 0, 0, {cloudCover: 2})).toThrow(RangeError);
});
test('terrain horizon wraps continuously and masks Moon contrast', () => {
  const profile = [
    {azimuth: -Math.PI / 2, altitude: rad(10)},
    {azimuth: Math.PI / 2, altitude: rad(30)}
  ];
  expect(getSkyHorizonAltitude(0, profile)).toBeCloseTo(rad(20), 12);
  expect(getSkyHorizonAltitude(2 * Math.PI, profile)).toBeCloseTo(rad(20), 12);
  expect(
    getMoonAppearance(rad(15), rad(-20), {
      phaseAngle: 0,
      sunSeparation: Math.PI,
      horizonAltitude: getSkyHorizonAltitude(0, profile)
    }).fade
  ).toBe(0);
  expect(() =>
    getSkyHorizonAltitude(0, [
      {azimuth: 0, altitude: 0},
      {azimuth: 2 * Math.PI, altitude: 0}
    ])
  ).toThrow(RangeError);
});
test('contrast model supports daylight Venus and fades under moonlight and clouds', () => {
  const clear = getPlanetVisibility(-4.5, rad(60), rad(20), rad(90), {model: 'contrast'});
  expect(clear.visible).toBe(true);
  expect(
    getPlanetVisibility(-4.5, rad(60), rad(20), rad(90), {
      model: 'contrast',
      atmosphere: {cloudCover: 1}
    }).visible
  ).toBe(false);
  const dark = getPlanetVisibility(4, rad(60), rad(-25), rad(90), {model: 'contrast'});
  const moonlit = getPlanetVisibility(4, rad(60), rad(-25), rad(90), {
    model: 'contrast',
    additionalSkyLuminance: 0.01
  });
  expect(moonlit.limitingMagnitude).toBeLessThan(dark.limitingMagnitude);
});
test('scattered moonlight matches the published zenith example to table rounding', () => {
  const nanoLamberts =
    getScatteredMoonLuminance(Math.PI / 2, rad(30), Math.PI / 2, rad(60), {extinction: 0.172}) *
    Math.PI *
    1e5;
  expect(Math.abs(nanoLamberts - 99)).toBeLessThan(2);
  expect(getScatteredMoonLuminance(0, rad(-1), Math.PI / 2, rad(60))).toBe(0);
});

test('context caches batches, bounds memory and prevents caller mutation', () => {
  const observer = createSkyObserver({latitude: 0, longitude: 0});
  const context = createSkyContext(observer, {cacheSize: 1, galileanMoons: false});
  const date = new Date('2024-01-01T00:00:00Z');
  const snapshots = context.getSnapshots([date, date]);
  expect(context.getStatistics()).toEqual({calculations: 1, cachedSnapshots: 1});
  snapshots[0].moon.direction[0] = 99;
  expect(context.getSnapshot(date).moon.direction[0]).not.toBe(99);
  context.getSnapshot(date.getTime() + 1000);
  expect(context.getStatistics().cachedSnapshots).toBe(1);
  context.clearCache();
  expect(context.getStatistics().cachedSnapshots).toBe(0);
});

test('explicit UT1/TT survives light-travel shifts and changes the sky independently', () => {
  const date = new Date('2024-01-01T00:00:00Z');
  const time = createSkyTime(date, {ut1MinusUtc: 0.2, ttMinusUtc: 69.184});
  const shifted = time.AddDays(-0.04);
  expect(shifted.tt - shifted.ut).toBeCloseTo((69.184 - 0.2) / 86400, 10);
  const observer = createSkyObserver({latitude: 30, longitude: 40});
  const a = getSkySnapshot(date, observer, {timeScales: {ttMinusUtc: 69.184}});
  const b = getSkySnapshot(date, observer, {timeScales: {ut1MinusUtc: 1, ttMinusUtc: 69.184}});
  expect(a.moon.direction).not.toEqual(b.moon.direction);
  expect(a.timestamp).toEqual(b.timestamp);
});

test('visibility search catches short intervals and refines to requested tolerance', () => {
  const result = searchSkyVisibility(0, 300000, t => t >= 123456 && t < 136789, {
    sampleSeconds: 5,
    transitionSeconds: 0.1
  });
  expect(result.intervals).toHaveLength(1);
  expect(Math.abs(result.intervals[0].start - 123456)).toBeLessThan(100);
  expect(Math.abs(result.intervals[0].end - 136789)).toBeLessThan(100);
  expect(searchSkyVisibility(0, 1000, () => true).intervals[0]).toEqual({
    start: 0,
    end: 1000,
    startClipped: true,
    endClipped: true
  });
});

test('photometric skylight is continuous at twilight joins and solar disk setting', () => {
  const options = {moonPhaseAngle: 0, moonSunSeparation: Math.PI};
  for (const altitude of [-18, -15, -5, -0.255, 0]) {
    const a = getSkyLighting(rad(altitude - 1e-5), rad(-10), options);
    const b = getSkyLighting(rad(altitude + 1e-5), rad(-10), options);
    expect(
      Math.abs(a.diffuseSkyIlluminance - b.diffuseSkyIlluminance) / b.diffuseSkyIlluminance
    ).toBeLessThan(0.001);
    expect(a.sun.illuminance).toBeGreaterThanOrEqual(0);
  }
  expect(getSkyLuminance(0, 0, 0, {pressure: 0})).toBe(0.0002);
});
