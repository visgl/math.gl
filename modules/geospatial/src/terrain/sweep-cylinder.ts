// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {sweepTerrainPolytope, type TerrainPolytopeSweepResult} from './sweep-polytope';
import type {TerrainSurface} from './surface';

type Point = readonly [number, number, number];

/**
 * Sweep a fixed +Z cylinder or conical frustum. Inscribed and circumscribed
 * polygonal bounds bracket contact. A hit reports the inner witness and a
 * conservative outer lower fraction. An outer-only contact is incomplete.
 */
export function sweepTerrainCylinder(
  surface: Pick<TerrainSurface, 'copyData' | 'origin'>,
  center: Point,
  height: number,
  radiusBottom: number,
  radiusTop: number,
  translation: Point,
  {sides = 16, maxWork = 100_000}: {sides?: number; maxWork?: number} = {}
): TerrainPolytopeSweepResult & {lowerFraction?: number} {
  if (
    center.length !== 3 ||
    !center.every(Number.isFinite) ||
    ![height, radiusBottom, radiusTop].every(value => Number.isFinite(value) && value > 0) ||
    !Number.isInteger(sides) ||
    sides < 3 ||
    sides > 128
  )
    throw new RangeError('Invalid terrain cylinder sweep');
  const faces: [number, number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const next = (i + 1) % sides;
    faces.push([i, next, next + sides], [i, next + sides, i + sides]);
    if (i > 0 && i < sides - 1) faces.push([0, i + 1, i], [sides, sides + i, sides + i + 1]);
  }
  const hull = (scale: number) => ({
    faces,
    vertices: Array.from({length: 2 * sides}, (_, i): Point => {
      const top = i >= sides;
      const angle = (2 * Math.PI * (i % sides)) / sides;
      const radius = (top ? radiusTop : radiusBottom) * scale;
      return [
        center[0] + radius * Math.cos(angle),
        center[1] + radius * Math.sin(angle),
        center[2] + (top ? height : -height) / 2
      ];
    })
  });
  const outer = sweepTerrainPolytope(surface, hull(1 / Math.cos(Math.PI / sides)), translation, {
    maxWork
  });
  if (outer.status !== 'hit') return outer;
  const inner = sweepTerrainPolytope(surface, hull(1), translation, {
    maxWork: maxWork - outer.work
  });
  const work = outer.work + inner.work;
  if (inner.status !== 'hit' || inner.fraction < outer.fraction)
    return {status: 'incomplete', work};
  // A polygonal witness does not establish the smooth cylinder's entry normal.
  return {...inner, normal: null, lowerFraction: outer.fraction, work};
}
