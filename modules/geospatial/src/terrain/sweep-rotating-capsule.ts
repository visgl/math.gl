// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {sweepTerrainCapsule, type TerrainCapsuleSweepResult} from './sweep-capsule';
import type {TerrainRigidMotion} from './sweep-rotation';
import type {TerrainSphereSweepOptions} from './sweep-sphere';
import type {TerrainSegmentHit, TerrainSurface} from './surface';

/** Cartesian point in the terrain surface frame. */
type Point = readonly [number, number, number];

/**
 * Bracket first contact for a capsule under linear pivot translation and shortest-arc
 * rotation. Coincident axis endpoints describe a sphere, including an off-pivot
 * sphere whose center follows a curved path. Unresolved tangency returns incomplete.
 * The witness is an axis/triangle pair within the radius at the upper fraction.
 */
export function sweepTerrainRotatingCapsule(
  surface: Pick<TerrainSurface, 'nearestSegmentQuery'>,
  start: Point,
  end: Point,
  radius: number,
  {pivot, translation, rotation}: TerrainRigidMotion,
  {maxWork = 100_000, fractionTolerance = 1e-5}: TerrainSphereSweepOptions = {}
): TerrainCapsuleSweepResult {
  const norm = Math.hypot(...rotation);
  if (
    ![start, end, pivot, translation].every(p => p.length === 3 && p.every(Number.isFinite)) ||
    rotation.length !== 4 ||
    !(norm > 0 && Number.isFinite(norm)) ||
    !Number.isFinite(radius) ||
    radius < 0 ||
    !Number.isSafeInteger(maxWork) ||
    maxWork < 0 ||
    !(fractionTolerance >= Number.EPSILON && fractionTolerance <= 1)
  )
    throw new RangeError('Invalid terrain capsule rigid motion');

  const sign = rotation[3] < 0 ? -1 : 1;
  const axisLength = Math.hypot(rotation[0], rotation[1], rotation[2]);
  const angle = 2 * Math.atan2(axisLength, Math.abs(rotation[3]));
  if (angle === 0) {
    return sweepTerrainCapsule(surface, start, end, translation, radius, {
      maxWork,
      fractionTolerance
    });
  }
  const x = (rotation[0] / axisLength) * sign;
  const y = (rotation[1] / axisLength) * sign;
  const z = (rotation[2] / axisLength) * sign;
  const offsets = [start, end].map(p => p.map((v, i) => v - pivot[i]));
  // A segment is a convex combination of its endpoints. The capsule's spherical
  // dilation is rotation invariant, so only the axis motion contributes here.
  const reach = Math.max(...offsets.map(p => Math.hypot(...p)));
  const speed = Math.hypot(...translation) + angle * reach;
  const scale = Math.max(Math.hypot(...pivot), reach, speed, radius);
  if (!Number.isFinite(scale)) throw new RangeError('Terrain capsule rigid motion overflow');

  let work = 0;
  /** Query the axis at an exact pose, charging both the probe and index work. */
  function probe(t: number) {
    if (work >= maxWork) return null;
    work++;
    const sin = Math.sin(angle * t);
    const cos = Math.cos(angle * t);
    const [a, b] =
      t === 0
        ? [start, end]
        : offsets.map(([u, v, w]): Point => {
            const d = (x * u + y * v + z * w) * (1 - cos);
            const pos: Point = [
              pivot[0] + (translation[0] * t + u * cos + (y * w - z * v) * sin + x * d),
              pivot[1] + (translation[1] * t + v * cos + (z * u - x * w) * sin + y * d),
              pivot[2] + (translation[2] * t + w * cos + (x * v - y * u) * sin + z * d)
            ];
            if (!pos.every(Number.isFinite)) throw new RangeError('Terrain capsule pose overflow');
            return pos;
          });
    const query = surface.nearestSegmentQuery(a, b, {maxWork: maxWork - work});
    work += query.work;
    return query;
  }

  const initial = probe(0);
  if (initial?.result && initial.result.distance <= radius)
    return {status: 'hit', fraction: 0, lowerFraction: 0, work, contact: initial.result};
  if (!initial?.complete) return {status: 'incomplete', work};
  if (!initial.result || speed === 0) return {status: 'miss', work};

  let clearUntil = 0;
  let witness: {fraction: number; contact: TerrainSegmentHit} | undefined;
  const pending: [number, number][] = [[0, 1]];
  while (pending.length) {
    if (witness && witness.fraction - clearUntil <= fractionTolerance)
      return {status: 'hit', lowerFraction: clearUntil, work, ...witness};
    const [lo, hi] = pending.pop()!;
    const mid = lo + (hi - lo) / 2;
    const query = probe(mid);
    const contact = query?.result;
    if (contact && contact.distance <= radius) {
      witness = {fraction: mid, contact};
      if (mid - clearUntil <= fractionTolerance)
        return {status: 'hit', lowerFraction: clearUntil, work, ...witness};
      if (mid === lo || mid === hi) return {status: 'incomplete', work};
      pending.push([lo, mid]);
      continue;
    }
    if (!query?.complete) return {status: 'incomplete', work};
    const travel = speed * Math.max(mid - lo, hi - mid);
    const allowance = 16 * Number.EPSILON * Math.max(scale, contact?.distance ?? 0);
    if (!contact || contact.distance - radius > travel + allowance) {
      clearUntil = hi;
      continue;
    }
    if (hi - clearUntil <= fractionTolerance) {
      const final = witness?.fraction === hi ? witness.contact : probe(hi)?.result;
      if (final && final.distance <= radius)
        return {status: 'hit', fraction: hi, lowerFraction: clearUntil, work, contact: final};
    }
    if (mid === lo || mid === hi || hi - lo <= fractionTolerance / 4)
      return {status: 'incomplete', work};
    pending.push([mid, hi], [lo, mid]);
  }
  return witness
    ? {status: 'hit', lowerFraction: clearUntil, work, ...witness}
    : {status: 'miss', work};
}

/** Sweep a sphere whose center may orbit an offset rigid-motion pivot. */
export function sweepTerrainRotatingSphere(
  surface: Pick<TerrainSurface, 'nearestSegmentQuery'>,
  center: Point,
  radius: number,
  motion: TerrainRigidMotion,
  options?: TerrainSphereSweepOptions
): TerrainCapsuleSweepResult {
  return sweepTerrainRotatingCapsule(surface, center, center, radius, motion, options);
}
