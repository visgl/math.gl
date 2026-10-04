// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original event-window search using the MIT Astronomy Engine API.
// https://github.com/cosinekitty/astronomy/tree/v2.1.19/source/js#searchriseset
import {Body, Observer, SearchRiseSet} from 'astronomy-engine';
import {getPlanetSkyInfo} from './planet-position';
import type {PlanetName, PlanetSkyBody, PlanetSkyOptions} from './planet-position';
import type {PlanetVisibilityOptions} from './planet-visibility';
import {validateRange} from './celestial';

export type PlanetVisibilityTimesOptions = PlanetVisibilityOptions & {
  horizon?: PlanetSkyOptions['horizon'];
  /** Sampling interval in seconds. Default 60; shorter catches narrower windows. */
  sampleSeconds?: number;
  /** Numerical transition bracket in seconds. Default 5. */
  transitionSeconds?: number;
  /** Window length in hours, greater than 0 and at most 72. Default 24. */
  durationHours?: number;
  /** Observer elevation above sea level in meters. Default 0. */
  elevation?: number;
};
export type PlanetVisibilityInterval = {
  /** Unix milliseconds, inclusive. */
  start: number;
  /** Unix milliseconds, exclusive. */
  end: number;
  /** Interval was already active at the requested window start. */
  startClipped: boolean;
  /** Interval continues beyond the requested window end. */
  endClipped: boolean;
};
export type PlanetVisibilityTimes = {
  name: PlanetName;
  /** Next conventional rise in the search window, Unix milliseconds; null if none. */
  riseTime: number | null;
  /** Next conventional set in the search window, Unix milliseconds; null if none. */
  setTime: number | null;
  /** Heuristic visibility at the beginning of the requested window. */
  visibleAtStart: boolean;
  /** Estimated detectability windows; empty when none were found. */
  visibleIntervals: PlanetVisibilityInterval[];
};

/**
 * Search upcoming rise/set events and approximate visibility intervals for seven planets.
 * Samples once per minute and refines detected transitions to a five-second bracket.
 * Very short/grazing visibility intervals between samples can be missed.
 */
export function getPlanetVisibilityTimes(
  timestamp: number | Date,
  latitude: number,
  longitude: number,
  options: PlanetVisibilityTimesOptions = {}
): PlanetVisibilityTimes[] {
  const {
    durationHours = 24,
    elevation = 0,
    horizon,
    sampleSeconds = 60,
    transitionSeconds = Math.min(5, sampleSeconds),
    ...visibility
  } = options;
  validateRange('Duration hours', durationHours, Number.MIN_VALUE, 72);
  validateRange('Sample seconds', sampleSeconds, 1, 3600);
  validateRange('Transition seconds', transitionSeconds, 0.001, sampleSeconds);
  if ((durationHours * 3600) / sampleSeconds > 100000)
    throw new RangeError('Search would exceed 100000 samples');
  const start = new Date(timestamp).getTime();
  const end = start + durationHours * 3600000;
  if (end <= start) throw new RangeError('Duration must advance the timestamp');
  const skyOptions = {elevation, horizon, galileanMoons: false, visibility};
  const first = getPlanetSkyInfo(start, latitude, longitude, skyOptions);
  // Validate the whole requested date range before starting the search.
  getPlanetSkyInfo(end, latitude, longitude, skyOptions);
  const observer = new Observer(latitude, longitude % 360, elevation);
  const result: PlanetVisibilityTimes[] = first.map(body => ({
    name: body.name as PlanetName,
    riseTime:
      SearchRiseSet(
        Body[body.name as PlanetName],
        observer,
        1,
        new Date(start),
        durationHours / 24
      )?.date.getTime() ?? null,
    setTime:
      SearchRiseSet(
        Body[body.name as PlanetName],
        observer,
        -1,
        new Date(start),
        durationHours / 24
      )?.date.getTime() ?? null,
    visibleAtStart: body.visibility!.visible,
    visibleIntervals: []
  }));
  const activeStarts = first.map(body => (body.visibility!.visible ? start : null));
  let previousTime = start;
  let previous = first;
  while (previousTime < end) {
    const time = Math.min(end, previousTime + sampleSeconds * 1000);
    const current = getPlanetSkyInfo(time, latitude, longitude, skyOptions);
    for (let i = 0; i < current.length; i++) {
      const before = previous[i].visibility!.visible;
      const after = current[i].visibility!.visible;
      if (before === after) continue;
      let lower = previousTime;
      let upper = time;
      // This brackets the predicate transition; it does not imply visibility-model accuracy.
      while (upper - lower > transitionSeconds * 1000) {
        const middle = (lower + upper) / 2;
        const state: PlanetSkyBody = getPlanetSkyInfo(middle, latitude, longitude, skyOptions)[i];
        if (state.visibility!.visible === before) lower = middle;
        else upper = middle;
      }
      const transition = (lower + upper) / 2;
      if (after) activeStarts[i] = transition;
      else {
        result[i].visibleIntervals.push({
          start: activeStarts[i]!,
          end: transition,
          startClipped: activeStarts[i] === start,
          endClipped: false
        });
        activeStarts[i] = null;
      }
    }
    previousTime = time;
    previous = current;
  }
  for (let i = 0; i < result.length; i++) {
    if (activeStarts[i] !== null)
      result[i].visibleIntervals.push({
        start: activeStarts[i]!,
        end,
        startClipped: activeStarts[i] === start,
        endClipped: true
      });
  }
  return result;
}
