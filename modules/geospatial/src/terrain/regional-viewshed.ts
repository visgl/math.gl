// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {compareTerrainSlopes} from './profile-slope';
import {TerrainSampleStatus, type TerrainSample} from './types';

/** Classification at each target grid node. */
export const TerrainRegionalViewStatus = {
  VISIBLE: 0,
  BLOCKED: 1,
  UNKNOWN: 2,
  MISSING_TARGET: 3,
  OBSERVER: 4
} as const;

/** Axis-aligned target grid in a local Cartesian or observer-centered distance frame. */
export type TerrainViewshedGrid = {
  /** Number of target columns. */
  width: number;
  /** Number of target rows. */
  height: number;
  /** Coordinates of the first target in meters. */
  origin: readonly [number, number];
  /** Positive spacings in meters. */
  spacing: readonly [number, number];
};

/** Observer geometry and sampling limits. */
export type TerrainRegionalViewshedOptions = {
  /** Observer XY and absolute eye elevation, in meters. */
  observer: readonly [number, number, number];
  /** Maximum spacing of sampled stations on each ray, in meters. */
  sampleStep: number;
  /** Height above terrain at each target, in meters. Defaults to zero. */
  targetOffset?: number;
  /** Spherical radius in meters. Distances from the observer are surface arc lengths. */
  radius?: number;
  /** Maximum target grid size. Defaults to 100,000. */
  maxTargets?: number;
  /** Total callback invocations allowed, including observer and targets. Defaults to 4,000,000. */
  maxSamples?: number;
};

/** Row-major viewshed and coverage diagnostics. */
export type TerrainRegionalViewshed = {
  /** View statuses from TerrainRegionalViewStatus. */
  statuses: Uint8Array;
  /** Target sample statuses from TerrainSampleStatus. */
  targetStatuses: Uint8Array;
  /** One when every sampled station including both endpoints was valid, otherwise zero. */
  sampledCoverage: Uint8Array;
  /** Total elevation callback invocations. */
  samples: number;
};

/**
 * Classify a regional raster of target nodes along sampled radial profiles.
 * A known obstruction (including grazing) blocks even when other stations are missing.
 * Missing support otherwise gives UNKNOWN. Results describe sampled stations only.
 * Without a radius, XY and elevation use a local flat metric frame. With a radius,
 * radial distance is spherical arc length and elevations are radial offsets from that sphere.
 */
export function createTerrainRegionalViewshed(
  grid: TerrainViewshedGrid,
  sample: (x: number, y: number) => Pick<TerrainSample, 'height' | 'status'>,
  options: TerrainRegionalViewshedOptions
): TerrainRegionalViewshed {
  const {width, height, origin, spacing} = grid;
  const {
    observer,
    sampleStep,
    radius,
    targetOffset = 0,
    maxTargets = 100_000,
    maxSamples = 4_000_000
  } = options;
  const count = width * height;
  if (
    ![width, height, count, maxTargets, maxSamples].every(Number.isSafeInteger) ||
    width < 1 ||
    height < 1 ||
    count > maxTargets ||
    maxSamples < 1 ||
    origin.length !== 2 ||
    spacing.length !== 2 ||
    observer.length !== 3 ||
    ![...origin, ...spacing, ...observer, sampleStep, targetOffset].every(Number.isFinite) ||
    spacing.some(value => value <= 0) ||
    sampleStep <= 0 ||
    targetOffset < 0 ||
    (radius !== undefined && (!Number.isFinite(radius) || radius <= 0 || observer[2] <= -radius))
  )
    throw new RangeError('Invalid regional viewshed grid or options');

  const statuses = new Uint8Array(count);
  const targetStatuses = new Uint8Array(count);
  const sampledCoverage = new Uint8Array(count);
  let samples = 0;
  /** Read one station, preserving the source coverage reason. */
  function read(x: number, y: number) {
    if (samples >= maxSamples) throw new RangeError('Regional viewshed sample budget exceeded');
    samples++;
    const result = sample(x, y);
    if (
      !Number.isInteger(result.status) ||
      result.status < 0 ||
      result.status > TerrainSampleStatus.NOT_RESIDENT ||
      (result.status === TerrainSampleStatus.VALID &&
        (!Number.isFinite(result.height) || (radius !== undefined && result.height <= -radius)))
    )
      throw new RangeError('Invalid regional viewshed sample');
    return result;
  }

  /** Express an elevation in the observer tangent frame without subtracting large radii. */
  function sight(distance: number, elevation: number): readonly [number, number] {
    let rise = elevation - observer[2];
    let run = distance;
    if (radius !== undefined) {
      const theta = distance / radius;
      const radial = radius + elevation;
      const halfSine = Math.sin(theta / 2);
      rise -= radial * (2 * halfSine * halfSine);
      run = radial * Math.sin(theta);
    }
    if (!Number.isFinite(rise) || !Number.isFinite(run) || run <= 0)
      throw new RangeError('Regional viewshed sight calculation overflow');
    return [rise, run];
  }

  const observerSample = {...read(observer[0], observer[1])};
  const observerValid = observerSample.status === TerrainSampleStatus.VALID;
  for (let i = 0; i < count; i++) {
    const x = origin[0] + (i % width) * spacing[0];
    const y = origin[1] + Math.floor(i / width) * spacing[1];
    const dx = x - observer[0];
    const dy = y - observer[1];
    const distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance) || (radius !== undefined && distance / radius >= Math.PI))
      throw new RangeError('Regional viewshed distance outside supported range');
    const target = distance === 0 ? observerSample : read(x, y);
    targetStatuses[i] = target.status;
    if (target.status !== TerrainSampleStatus.VALID) {
      statuses[i] = TerrainRegionalViewStatus.MISSING_TARGET;
      continue;
    }
    if (distance === 0) {
      statuses[i] = TerrainRegionalViewStatus.OBSERVER;
      sampledCoverage[i] = 1;
      continue;
    }
    const [targetRise, targetRun] = sight(distance, target.height + targetOffset);
    const segments = Math.max(1, Math.ceil(distance / sampleStep));
    if (!Number.isSafeInteger(segments) || segments - 1 > maxSamples - samples)
      throw new RangeError('Regional viewshed sample budget exceeded');
    let complete = observerValid;
    let blocked = observerValid && observerSample.height > observer[2];
    for (let j = 1; j < segments; j++) {
      const fraction = j / segments;
      const station = read(observer[0] + dx * fraction, observer[1] + dy * fraction);
      if (station.status !== TerrainSampleStatus.VALID) {
        complete = false;
      } else if (!blocked) {
        const [rise, run] = sight(distance * fraction, station.height);
        blocked = compareTerrainSlopes(rise, run, targetRise, targetRun) >= 0;
      }
    }
    sampledCoverage[i] = complete ? 1 : 0;
    statuses[i] = blocked
      ? TerrainRegionalViewStatus.BLOCKED
      : complete
        ? TerrainRegionalViewStatus.VISIBLE
        : TerrainRegionalViewStatus.UNKNOWN;
  }
  return {statuses, targetStatuses, sampledCoverage, samples};
}
