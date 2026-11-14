// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainCapsuleContact, TerrainSurface} from './surface';

type Point = readonly [number, number, number];

export type TerrainSphereSweepOptions = {
  /** Maximum width of the returned impact interval, in units of motion fraction. */
  fractionTolerance?: number;
  /** Total spatial index work across all probes. */
  maxWork?: number;
};

export type TerrainSphereSweepResult =
  | {status: 'miss' | 'incomplete'; work: number}
  | {
      status: 'hit';
      work: number;
      fraction: number;
      lowerFraction: number;
      contact: TerrainCapsuleContact;
    };

/**
 * Find the first impact of a translating sphere against the two-sided terrain sheet.
 * Bisection tests entire motion prefixes, so a brief or grazing contact can be
 * found even when neither endpoint intersects. The returned contact is a witness
 * inside the impact interval. An exhausted work budget returns 'incomplete'.
 */
export function sweepTerrainSphere(
  surface: Pick<TerrainSurface, 'intersectCapsule'>,
  start: Point,
  end: Point,
  radius: number,
  {fractionTolerance = 1e-6, maxWork = 100_000}: TerrainSphereSweepOptions = {}
): TerrainSphereSweepResult {
  if (
    !(fractionTolerance >= Number.EPSILON && fractionTolerance <= 1) ||
    !Number.isSafeInteger(maxWork) ||
    maxWork < 0
  )
    throw new RangeError('Invalid terrain sphere sweep limits');
  const delta = end.map((value, axis) => value - start[axis]);
  if (
    start.length !== 3 ||
    end.length !== 3 ||
    !start.every(Number.isFinite) ||
    !end.every(Number.isFinite) ||
    !delta.every(Number.isFinite) ||
    !Number.isFinite(radius) ||
    radius < 0
  )
    throw new RangeError('Invalid terrain sphere sweep motion or radius');
  let work = 0;
  let lower = 0;
  let upper = 1;
  const prefix = (fraction: number) => {
    const endPoint: Point =
      fraction === 0
        ? start
        : fraction === 1
          ? end
          : [
              start[0] + delta[0] * fraction,
              start[1] + delta[1] * fraction,
              start[2] + delta[2] * fraction
            ];
    const query = surface.intersectCapsule(start, endPoint, radius, {
      maxWork: maxWork - work,
      maxContacts: 1
    });
    work += query.work;
    return query;
  };

  const initial = prefix(0);
  if (initial.result[0])
    return {status: 'hit', fraction: 0, lowerFraction: 0, contact: initial.result[0], work};
  if (!initial.complete) return {status: 'incomplete', work};

  const full = prefix(1);
  let contact = full.result[0];
  if (!contact) return {status: full.complete ? 'miss' : 'incomplete', work};

  while (upper - lower > fractionTolerance) {
    const middle = (lower + upper) / 2;
    const query = prefix(middle);
    if (query.result[0]) {
      upper = middle;
      contact = query.result[0];
    } else if (query.complete) {
      lower = middle;
    } else {
      return {status: 'incomplete', work};
    }
  }
  return {status: 'hit', fraction: upper, lowerFraction: lower, contact, work};
}
