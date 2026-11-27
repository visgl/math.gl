// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainSurface} from './surface';

type Point = readonly [number, number, number];
export type TerrainPolytope = {
  /** Local Cartesian vertices in the same world frame as the sweep. */
  vertices: readonly Point[];
  /** Triangulated closed convex boundary. */
  faces: readonly (readonly [number, number, number])[];
};
type Triangle = readonly [Point, Point, Point];
const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Point, b: Point): Point => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const edges = ([a, b, c]: Triangle) => [sub(b, a), sub(c, b), sub(a, c)];

export type TerrainPolytopeSweepResult =
  | {status: 'miss' | 'incomplete'; work: number}
  | {status: 'hit'; fraction: number; triangleIndex: number; normal: Point | null; work: number};

/**
 * Sweep a closed convex polytope under translation against active terrain triangles.
 * Uses continuous separating-axis tests. The caller supplies a convex triangulated
 * boundary in a numerically well-conditioned Cartesian frame. Initial overlap has
 * no unique entry normal. Work counts tested axes across all active triangles.
 */
export function sweepTerrainPolytope(
  surface: Pick<TerrainSurface, 'copyData' | 'origin'>,
  collider: TerrainPolytope,
  translation: Point,
  {maxWork = 100_000}: {maxWork?: number} = {}
): TerrainPolytopeSweepResult {
  return queryTerrainPolytope(surface.copyData(), surface.origin, collider, translation, maxWork);
}

/** @internal Test a conservative projection expansion along each separating axis. */
export function queryTerrainPolytope(
  data: ReturnType<TerrainSurface['copyData']>,
  origin: Point,
  collider: TerrainPolytope,
  translation: Point,
  maxWork: number,
  padding = 0
): TerrainPolytopeSweepResult {
  if (
    !Number.isSafeInteger(maxWork) ||
    maxWork < 0 ||
    translation.length !== 3 ||
    !translation.every(Number.isFinite) ||
    collider.vertices.length < 4 ||
    collider.faces.length < 4 ||
    collider.vertices.some(point => point.length !== 3 || !point.every(Number.isFinite))
  )
    throw new RangeError('Invalid terrain polytope sweep');
  const vertices = collider.vertices.map(point => sub(point, origin));
  const normals: Point[] = [];
  const directions: Point[] = [];
  for (const face of collider.faces) {
    if (face.length !== 3 || face.some(i => !Number.isSafeInteger(i) || !vertices[i]))
      throw new RangeError('Invalid terrain polytope face');
    const side = edges([vertices[face[0]], vertices[face[1]], vertices[face[2]]]);
    const normal = cross(side[0], side[1]);
    if (!normal.every(Number.isFinite) || !normal.some(Boolean))
      throw new RangeError('Degenerate terrain polytope face');
    normals.push(normal);
    directions.push(...side);
  }
  return sweepTriangles(
    data,
    vertices,
    normals,
    directions,
    translation,
    maxWork,
    undefined,
    padding
  );
}

/** Sweep a two-sided triangle mesh under translation. A finite plane can be
 * represented by two coplanar triangles. Work is shared across moving faces. */
export function sweepTerrainTriangleMesh(
  surface: Pick<TerrainSurface, 'copyData' | 'origin'>,
  collider: TerrainPolytope,
  translation: Point,
  {maxWork = 100_000}: {maxWork?: number} = {}
): TerrainPolytopeSweepResult {
  if (
    !Number.isSafeInteger(maxWork) ||
    maxWork < 0 ||
    translation.length !== 3 ||
    !translation.every(Number.isFinite)
  )
    throw new RangeError('Invalid terrain triangle mesh sweep');
  const data = surface.copyData();
  let work = 0;
  let best: Extract<TerrainPolytopeSweepResult, {status: 'hit'}> | undefined;
  for (const face of collider.faces) {
    if (face.length !== 3) throw new RangeError('Invalid terrain sweep mesh face');
    const vertices = face.map(index => {
      const point = collider.vertices[index];
      if (
        !Number.isSafeInteger(index) ||
        !point ||
        point.length !== 3 ||
        !point.every(Number.isFinite)
      )
        throw new RangeError('Invalid terrain sweep mesh vertex');
      return sub(point, surface.origin);
    });
    const directions = edges(vertices as unknown as Triangle);
    const normal = cross(directions[0], directions[1]);
    if (!normal.every(Number.isFinite) || !normal.some(Boolean))
      throw new RangeError('Degenerate terrain sweep mesh face');
    const result = sweepTriangles(
      data,
      vertices,
      [normal],
      directions,
      translation,
      maxWork - work,
      normal
    );
    work += result.work;
    if (result.status === 'incomplete') return {status: 'incomplete', work};
    if (result.status === 'hit' && (!best || result.fraction < best.fraction)) best = result;
  }
  return best ? {...best, work} : {status: 'miss', work};
}

function sweepTriangles(
  data: ReturnType<TerrainSurface['copyData']>,
  vertices: readonly Point[],
  normals: readonly Point[],
  directions: readonly Point[],
  translation: Point,
  maxWork: number,
  movingTriangleNormal?: Point,
  padding = 0
): TerrainPolytopeSweepResult {
  let work = 0;
  let best: Extract<TerrainPolytopeSweepResult, {status: 'hit'}> | undefined;
  const vertex = (index: number): Point => {
    const i = 3 * data.indices[index];
    return [data.positions[i], data.positions[i + 1], data.positions[i + 2]];
  };
  for (let i = 0; i < data.triangleValidity.length; i++) {
    if (!data.triangleValidity[i]) continue;
    const triangle: Triangle = [vertex(3 * i), vertex(3 * i + 1), vertex(3 * i + 2)];
    const sides = edges(triangle);
    let enter = 0;
    let exit = best?.fraction ?? 1;
    let normal: Point | null = null;
    function* axes() {
      const terrainNormal = cross(sides[0], sides[1]);
      yield terrainNormal;
      if (movingTriangleNormal) {
        for (const side of sides) yield cross(terrainNormal, side);
        for (const direction of directions) yield cross(movingTriangleNormal, direction);
      }
      yield* normals;
      for (const side of sides) for (const direction of directions) yield cross(side, direction);
    }
    for (const axis of axes()) {
      if (work >= maxWork) return {status: 'incomplete', work};
      work++;
      const length = Math.hypot(...axis);
      if (length === 0) continue;
      const unit: Point = [axis[0] / length, axis[1] / length, axis[2] / length];
      const low = Math.min(...triangle.map(point => dot(point, unit)));
      const high = Math.max(...triangle.map(point => dot(point, unit)));
      let min = Infinity;
      let max = -Infinity;
      for (const point of vertices) {
        const projection = dot(point, unit);
        min = Math.min(min, projection);
        max = Math.max(max, projection);
      }
      min -= padding;
      max += padding;
      const speed = dot(translation, unit);
      if (![low, high, min, max, speed, length].every(Number.isFinite))
        throw new RangeError('Terrain polytope projection overflow');
      if (speed === 0) {
        if (min > high || max < low) exit = -1;
      } else {
        const first = (low - max) / speed;
        const last = (high - min) / speed;
        const entry = Math.min(first, last);
        if (entry > enter) {
          enter = entry;
          normal = speed < 0 ? unit : [-unit[0], -unit[1], -unit[2]];
        }
        exit = Math.min(exit, Math.max(first, last));
      }
      if (enter > exit) break;
    }
    if (enter <= exit && (!best || enter < best.fraction)) {
      best = {status: 'hit', fraction: enter, triangleIndex: i, normal, work};
      if (enter === 0) break;
    }
  }
  return best ? {...best, work} : {status: 'miss', work};
}

/** Sweep an axis-aligned box with positive half extents. */
export function sweepTerrainBox(
  surface: Pick<TerrainSurface, 'copyData' | 'origin'>,
  center: Point,
  halfExtents: Point,
  translation: Point,
  options?: {maxWork?: number}
): TerrainPolytopeSweepResult {
  return sweepTerrainPolytope(surface, createSweepBox(center, halfExtents), translation, options);
}

/** @internal */
export function createSweepBox(center: Point, halfExtents: Point): TerrainPolytope {
  if (halfExtents.length !== 3 || halfExtents.some(value => !(value > 0)))
    throw new RangeError('Terrain box half extents must be positive');
  const vertices = Array.from(
    {length: 8},
    (_, i): Point => [
      center[0] + (i & 1 ? 1 : -1) * halfExtents[0],
      center[1] + (i & 2 ? 1 : -1) * halfExtents[1],
      center[2] + (i & 4 ? 1 : -1) * halfExtents[2]
    ]
  );
  return {
    vertices,
    faces: [
      [0, 1, 3],
      [0, 3, 2],
      [4, 6, 7],
      [4, 7, 5],
      [0, 4, 5],
      [0, 5, 1],
      [2, 3, 7],
      [2, 7, 6],
      [0, 2, 6],
      [0, 6, 4],
      [1, 5, 7],
      [1, 7, 3]
    ]
  };
}
