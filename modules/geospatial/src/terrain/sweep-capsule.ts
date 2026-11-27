// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainSegmentHit, TerrainSurface} from './surface';
import type {TerrainSphereSweepOptions} from './sweep-sphere';

type Point = readonly [number, number, number];

export type TerrainCapsuleSweepResult =
  | {status: 'miss' | 'incomplete'; work: number}
  | {
      status: 'hit';
      work: number;
      fraction: number;
      lowerFraction: number;
      contact: TerrainSegmentHit;
    };

/**
 * Bracket the first contact of a translating capsule against the active triangle sheet.
 * The axis direction and length stay fixed. Clearance changes by at most the distance
 * traveled. Intervals that cannot be separated within the tolerance return incomplete
 * when no contact witness is available, including unresolved tangencies.
 */
export function sweepTerrainCapsule(
  surface: Pick<TerrainSurface, 'nearestSegmentQuery'>,
  start: Point,
  end: Point,
  translation: Point,
  radius: number,
  {fractionTolerance = 1e-6, maxWork = 100_000}: TerrainSphereSweepOptions = {}
): TerrainCapsuleSweepResult {
  const speed = Math.hypot(...translation);
  if (
    ![start, end, translation].every(point => point.length === 3 && point.every(Number.isFinite)) ||
    !Number.isFinite(speed) ||
    !Number.isFinite(radius) ||
    radius < 0 ||
    !(fractionTolerance >= Number.EPSILON && fractionTolerance <= 1) ||
    !Number.isSafeInteger(maxWork) ||
    maxWork < 0
  )
    throw new RangeError('Invalid terrain capsule sweep');

  let work = 0;
  const probe = (fraction: number) => {
    if (work >= maxWork) return null;
    // Count the probe itself even if the index is empty.
    work++;
    const move = (point: Point): Point => [
      point[0] + translation[0] * fraction,
      point[1] + translation[1] * fraction,
      point[2] + translation[2] * fraction
    ];
    const query = surface.nearestSegmentQuery(move(start), move(end), {maxWork: maxWork - work});
    work += query.work;
    return query;
  };

  const initial = probe(0);
  if (initial?.result && initial.result.distance <= radius)
    return {status: 'hit', work, fraction: 0, lowerFraction: 0, contact: initial.result};
  if (!initial?.complete) return {status: 'incomplete', work};
  if (!initial.result || speed === 0) return {status: 'miss', work};

  let clearUntil = 0;
  let witness: {fraction: number; contact: TerrainSegmentHit} | undefined;
  const pending: [number, number][] = [[0, 1]];
  while (pending.length) {
    const [lower, upper] = pending.pop()!;
    if (witness && witness.fraction - clearUntil <= fractionTolerance)
      return {status: 'hit', work, lowerFraction: clearUntil, ...witness};
    const middle = lower + (upper - lower) / 2;
    const query = probe(middle);
    if (!query) return {status: 'incomplete', work};
    const hit = query.result;
    if (hit && hit.distance <= radius) {
      witness = {fraction: middle, contact: hit};
      if (middle - clearUntil <= fractionTolerance)
        return {status: 'hit', work, lowerFraction: clearUntil, ...witness};
      pending.push([lower, middle]);
      continue;
    }
    if (!query.complete) return {status: 'incomplete', work};
    const travel = speed * Math.max(middle - lower, upper - middle);
    const allowance = 8 * Number.EPSILON * Math.max(hit?.distance ?? 0, radius, travel);
    if (!hit || hit.distance - radius > travel + allowance) {
      clearUntil = upper;
      continue;
    }
    if (upper - lower <= fractionTolerance) {
      // Check the right endpoint for impacts at the end of motion.
      const final = probe(upper)?.result;
      if (final && final.distance <= radius && upper - clearUntil <= fractionTolerance)
        return {status: 'hit', work, fraction: upper, lowerFraction: clearUntil, contact: final};
      return {status: 'incomplete', work};
    }
    pending.push([middle, upper], [lower, middle]);
  }
  return witness
    ? {status: 'hit', work, lowerFraction: clearUntil, ...witness}
    : {status: 'miss', work};
}

/**
 * Bracket the impact of the convex hull of two endpoint spheres with potentially
 * different radii. Constant-radius inner and outer capsules bound the hull.
 */
export function sweepTerrainTaperedCapsule(
  surface: Pick<TerrainSurface, 'nearestSegmentQuery'>,
  start: Point,
  end: Point,
  translation: Point,
  radiusStart: number,
  radiusEnd: number,
  {maxWork = 100_000, fractionTolerance}: TerrainSphereSweepOptions = {}
): TerrainCapsuleSweepResult {
  if (![radiusStart, radiusEnd].every(radius => Number.isFinite(radius) && radius >= 0))
    throw new RangeError('Invalid terrain tapered capsule radii');
  const outer = sweepTerrainCapsule(
    surface,
    start,
    end,
    translation,
    Math.max(radiusStart, radiusEnd),
    {
      maxWork,
      fractionTolerance
    }
  );
  if (outer.status !== 'hit' || radiusStart === radiusEnd) return outer;
  const inner = sweepTerrainCapsule(
    surface,
    start,
    end,
    translation,
    Math.min(radiusStart, radiusEnd),
    {
      maxWork: maxWork - outer.work,
      fractionTolerance
    }
  );
  const work = outer.work + inner.work;
  return inner.status === 'hit' && outer.lowerFraction <= inner.fraction
    ? {...inner, lowerFraction: outer.lowerFraction, work}
    : {status: 'incomplete', work};
}
