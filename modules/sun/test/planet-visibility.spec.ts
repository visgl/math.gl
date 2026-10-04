// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {getPlanetSkyInfo, getPlanetVisibility, getPlanetVisibilityTimes} from '../src/planets';

const degrees = (angle: number) => (angle * Math.PI) / 180;

test('twilight appearance depends on brightness, altitude and observing conditions', () => {
  const venus = getPlanetVisibility(-4, degrees(30), degrees(-2), degrees(40));
  const saturn = getPlanetVisibility(1, degrees(30), degrees(-2), degrees(40));
  expect(venus.visible).toBe(true);
  expect(saturn.visible).toBe(false);
  expect(venus.fade).toBeGreaterThan(saturn.fade);
  expect(getPlanetVisibility(1, degrees(30), degrees(-9), degrees(40)).visible).toBe(true);
  expect(getPlanetVisibility(8, degrees(60), degrees(-30), degrees(90)).visible).toBe(false);
  expect(getPlanetVisibility(-4, degrees(3), degrees(-15), degrees(40)).visible).toBe(false);
  expect(getPlanetVisibility(-4, degrees(30), degrees(-15), degrees(3)).visible).toBe(false);
  expect(getPlanetVisibility(-4, degrees(30), degrees(5), degrees(40)).fade).toBe(0);
  const polluted = getPlanetVisibility(3, degrees(45), degrees(-30), degrees(90), {
    darkSkyLimitingMagnitude: 2
  });
  expect(polluted.visible).toBe(false);
  const darker = getPlanetVisibility(6.5, degrees(70), degrees(-30), degrees(90), {
    darkSkyLimitingMagnitude: 7
  });
  expect(darker.visible).toBe(true);
  expect(
    getPlanetVisibility(0, degrees(8), degrees(-7), degrees(40), {extinction: 1}).visible
  ).toBe(false);
});

test('planet positions include current visibility, while Galilean photometry remains unknown', () => {
  const bodies = getPlanetSkyInfo(new Date('2023-06-01T04:00:00Z'), 37.8, -122.4);
  for (const body of bodies) {
    if (body.parent) expect(body.visibility).toBeNull();
    else {
      expect(body.visibility).not.toBeNull();
      expect(Number.isFinite(body.visibility!.extinctedMagnitude)).toBe(true);
      expect(body.visibility!.fade).toBeGreaterThanOrEqual(0);
      expect(body.visibility!.fade).toBeLessThanOrEqual(1);
    }
  }
});

test('visibility windows bracket true heuristic transitions and separate them from rise/set', () => {
  const start = Date.parse('2023-06-01T00:00:00Z');
  const rows = getPlanetVisibilityTimes(start, 37.8, -122.4, {durationHours: 12});
  expect(rows).toHaveLength(7);
  const venus = rows.find(row => row.name === 'Venus')!;
  expect(venus.visibleAtStart).toBe(false);
  expect(venus.visibleIntervals.length).toBeGreaterThan(0);
  expect(venus.setTime).not.toBeNull();
  const window = venus.visibleIntervals[0];
  expect(window.startClipped).toBe(false);
  expect(window.endClipped).toBe(false);
  expect(window.end).toBeLessThan(venus.setTime!);
  const state = (time: number) =>
    getPlanetSkyInfo(time, 37.8, -122.4, {galileanMoons: false}).find(row => row.name === 'Venus')!
      .visibility!.visible;
  expect(state(window.start - 5000)).toBe(false);
  expect(state(window.start + 5000)).toBe(true);
  expect(state(window.end - 5000)).toBe(true);
  expect(state(window.end + 5000)).toBe(false);
  for (const row of rows)
    for (const interval of row.visibleIntervals) {
      expect(interval.start).toBeGreaterThanOrEqual(start);
      expect(interval.end).toBeLessThanOrEqual(start + 12 * 3600000);
      expect(interval.end).toBeGreaterThan(interval.start);
    }
  const neptune = rows.find(row => row.name === 'Neptune')!;
  expect(neptune.visibleIntervals).toEqual([]);
});

test('polar darkness supports clipped intervals and missing horizon events', () => {
  const start = Date.parse('2024-01-01T00:00:00Z');
  const rows = getPlanetVisibilityTimes(start, 90, 0, {
    durationHours: 0.5,
    darkSkyLimitingMagnitude: 10
  });
  const circumpolar = rows.find(row => row.visibleAtStart)!;
  expect(circumpolar).toBeDefined();
  expect(circumpolar.riseTime).toBeNull();
  expect(circumpolar.setTime).toBeNull();
  expect(circumpolar.visibleIntervals).toEqual([
    {start, end: start + 1800000, startClipped: true, endClipped: true}
  ]);
  const daylight = getPlanetVisibilityTimes(Date.parse('2024-06-21T00:00:00Z'), 90, 0, {
    durationHours: 0.5
  });
  expect(daylight.every(row => row.visibleIntervals.length === 0)).toBe(true);
});

test('visibility inputs and bounded event windows are validated', () => {
  for (const magnitude of [NaN, Infinity])
    expect(() => getPlanetVisibility(magnitude, 0, 0, 0)).toThrow(RangeError);
  expect(() => getPlanetVisibility(0, 2, 0, 0)).toThrow(RangeError);
  expect(() => getPlanetVisibility(0, 0, 0, -1)).toThrow(RangeError);
  expect(() => getPlanetVisibility(0, 0, 0, 0, {extinction: -1})).toThrow(RangeError);
  for (const durationHours of [0, -1, 73, NaN])
    expect(() => getPlanetVisibilityTimes(Date.now(), 0, 0, {durationHours})).toThrow(RangeError);
  expect(() => getPlanetVisibilityTimes(Date.parse('2100-12-31T23:59:00Z'), 0, 0)).toThrow(
    RangeError
  );
});
