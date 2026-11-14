// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  createSweepBox,
  queryTerrainPolytope,
  type TerrainPolytope,
  type TerrainPolytopeSweepResult
} from './sweep-polytope';
import type {TerrainSurface} from './surface';

type Point = readonly [number, number, number];
type Surface = Pick<TerrainSurface, 'copyData' | 'origin'>;

export type TerrainRigidMotion = {
  /** Pivot in the same Cartesian frame as the collider vertices. */
  pivot: Point;
  translation: Point;
  /** Quaternion [x,y,z,w] relative to the initial pose. The shortest arc is used. */
  rotation: readonly [number, number, number, number];
};

export type TerrainRotationalSweepResult =
  | {status: 'miss' | 'incomplete'; work: number}
  | (Extract<TerrainPolytopeSweepResult, {status: 'hit'}> & {lowerFraction: number});

/**
 * Sweep a convex hull along linear translation and shortest-arc rotation.
 * An expanded midpoint SAT can exclude an interval. An unexpanded pose supplies
 * a hit witness. Unresolved grazing or exhausted work yields incomplete.
 */
export function sweepTerrainRotatingPolytope(
  surface: Surface,
  collider: TerrainPolytope,
  {pivot, translation, rotation}: TerrainRigidMotion,
  {maxWork = 100_000, fractionTolerance = 1e-5}: {maxWork?: number; fractionTolerance?: number} = {}
): TerrainRotationalSweepResult {
  const norm = Math.hypot(...rotation);
  if (
    pivot.length !== 3 ||
    translation.length !== 3 ||
    rotation.length !== 4 ||
    !pivot.every(Number.isFinite) ||
    !translation.every(Number.isFinite) ||
    !(norm > 0 && Number.isFinite(norm)) ||
    !Number.isSafeInteger(maxWork) ||
    maxWork < 0 ||
    !(fractionTolerance >= Number.EPSILON && fractionTolerance <= 1)
  )
    throw new RangeError('Invalid terrain rigid motion');

  // Work in the surface frame before interpolating to preserve small offsets.
  const localPivot = pivot.map((v, i) => v - surface.origin[i]);
  const offsets = collider.vertices.map(v => v.map((x, i) => x - pivot[i]));
  const radius = offsets.reduce((r, v) => Math.max(r, Math.hypot(...v)), 0);
  const sign = rotation[3] < 0 ? -1 : 1;
  const vectorNorm = Math.hypot(rotation[0], rotation[1], rotation[2]);
  const angle = 2 * Math.atan2(vectorNorm, Math.abs(rotation[3]));
  const speed = Math.hypot(...translation) + angle * radius;
  if (!Number.isFinite(speed)) throw new RangeError('Terrain rigid motion overflow');

  const data = surface.copyData();
  if (angle === 0) {
    const result = queryTerrainPolytope(data, surface.origin, collider, translation, maxWork);
    return result.status === 'hit' ? {...result, lowerFraction: result.fraction} : result;
  }

  const [x, y, z] = rotation.slice(0, 3).map(v => (v / vectorNorm) * sign);
  const zero = [0, 0, 0] as const;
  let work = 0;
  const pose = (t: number): TerrainPolytope => {
    const sin = Math.sin(angle * t);
    const cos = Math.cos(angle * t);
    return {
      faces: collider.faces,
      vertices: offsets.map(([a, b, c]): Point => {
        const projection = (x * a + y * b + z * c) * (1 - cos);
        return [
          localPivot[0] + translation[0] * t + a * cos + (y * c - z * b) * sin + x * projection,
          localPivot[1] + translation[1] * t + b * cos + (z * a - x * c) * sin + y * projection,
          localPivot[2] + translation[2] * t + c * cos + (x * b - y * a) * sin + z * projection
        ];
      })
    };
  };
  const probe = (shape: TerrainPolytope, padding = 0) => {
    if (work >= maxWork) return {status: 'incomplete', work: 0} as const;
    work++;
    const result = queryTerrainPolytope(data, zero, shape, zero, maxWork - work, padding);
    work += result.work;
    return result;
  };
  const initial = probe(pose(0));
  if (initial.status === 'hit') return {...initial, lowerFraction: 0, work};
  if (initial.status === 'incomplete') return {status: 'incomplete', work};

  let clearUntil = 0;
  let witness: Extract<TerrainPolytopeSweepResult, {status: 'hit'}> | undefined;
  const pending: [number, number][] = [[0, 1]];
  while (pending.length) {
    if (witness && witness.fraction - clearUntil <= fractionTolerance)
      return {...witness, lowerFraction: clearUntil, work};
    const [lo, hi] = pending.pop()!;
    const mid = lo + (hi - lo) / 2;
    const shape = pose(mid);
    const padding = speed * Math.max(mid - lo, hi - mid);
    const expanded = probe(shape, padding + 8 * Number.EPSILON * (radius + padding));
    if (expanded.status === 'miss') {
      clearUntil = hi;
      continue;
    }
    if (expanded.status === 'incomplete') return {status: 'incomplete', work};
    const hit = probe(shape);
    if (hit.status === 'incomplete') return {status: 'incomplete', work};
    if (hit.status === 'hit') {
      witness = {...hit, fraction: mid};
      if (mid - clearUntil <= fractionTolerance)
        return {...witness, lowerFraction: clearUntil, work};
      pending.push([lo, mid]);
    } else if (hi - clearUntil <= fractionTolerance) {
      const end = witness?.fraction === hi ? witness : probe(pose(hi));
      if (end?.status === 'hit') return {...end, fraction: hi, lowerFraction: clearUntil, work};
      if (hi - lo <= fractionTolerance / 4) return {status: 'incomplete', work};
      pending.push([mid, hi], [lo, mid]);
    } else {
      if (mid === lo || mid === hi || hi - lo <= fractionTolerance / 4)
        return {status: 'incomplete', work};
      pending.push([mid, hi], [lo, mid]);
    }
  }
  return witness ? {...witness, lowerFraction: clearUntil, work} : {status: 'miss', work};
}

/** Rotational sweep of a box that starts axis-aligned. */
export function sweepTerrainRotatingBox(
  surface: Surface,
  center: Point,
  halfExtents: Point,
  motion: TerrainRigidMotion,
  options?: {maxWork?: number; fractionTolerance?: number}
): TerrainRotationalSweepResult {
  return sweepTerrainRotatingPolytope(
    surface,
    createSweepBox(center, halfExtents),
    motion,
    options
  );
}
