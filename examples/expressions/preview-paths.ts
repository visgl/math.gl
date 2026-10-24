// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type LongitudeEdges = 'shortest' | 'supplied';

/** Cell boundaries can explicitly preserve supplied extents. Shortest-edge paths
 * are repeated per segment, keeping winding-track work linear in input size.
 * The canvas clips each segment at the visible [-180,180] map boundary.
 */
export function longitudeCopies(
  coordinates: readonly (readonly [number, number])[],
  edges: LongitudeEdges = 'shortest'
): [number, number][][] {
  if (!coordinates.length || !coordinates.every(p => p.every(Number.isFinite))) return [];
  if (edges === 'supplied') return [coordinates.map(([x, y]) => [x, y])];
  const normalize = (x: number): number => ((((x + 180) % 360) + 360) % 360) - 180;
  const copies: [number, number][][] = [];
  for (let i = 0; i < Math.max(1, coordinates.length - 1); i++) {
    const [x, y] = coordinates[i];
    const start = normalize(x);
    const next = coordinates[i + 1];
    const end = next ? normalize(next[0]) : start;
    const unwrapped = end + 360 * Math.round((start - end) / 360);
    const min = Math.min(start, unwrapped),
      max = Math.max(start, unwrapped);
    for (let k = Math.ceil((-180 - max) / 360); k <= Math.floor((180 - min) / 360); k++) {
      const segment: [number, number][] = [[start + 360 * k, y]];
      if (next) segment.push([unwrapped + 360 * k, next[1]]);
      copies.push(segment);
    }
  }
  return copies;
}
