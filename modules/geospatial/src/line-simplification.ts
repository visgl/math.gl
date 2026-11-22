// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';

/** One vertex in planar XY coordinates. */
type Position = readonly number[];
/** Ordered vertices in a single line component. */
type Path = readonly Position[];

/** Removes consecutive near-duplicates while retaining both line endpoints. */
function removeRepeated(path: Path, tolerance: number): Path {
  if (path.length <= 2) return path;
  const kept = [path[0]!];
  for (let i = 1; i < path.length; i++) {
    const current = path[i]!,
      last = kept[kept.length - 1]!;
    const close = Math.hypot(current[0]! - last[0]!, current[1]! - last[1]!) <= tolerance;
    if (i === path.length - 1) {
      if (close && kept.length > 1) kept.pop();
    } else if (close) continue;
    kept.push(current);
  }
  return kept;
}

/** Measures the distance to a finite segment, including its endpoints. */
function distanceToSegment(p: Position, a: Position, b: Position): number {
  const dx = b[0]! - a[0]!,
    dy = b[1]! - a[1]!;
  const length = Math.hypot(dx, dy);
  const px = p[0]! - a[0]!,
    py = p[1]! - a[1]!;
  const t = length
    ? Math.max(0, Math.min(1, (px * (dx / length) + py * (dy / length)) / length))
    : 0;
  return Math.hypot(px - t * dx, py - t * dy);
}

/** Iterative Douglas-Peucker simplification of a single planar line. */
export function simplifyLine(path: Path, tolerance: number): Path {
  if (!path.length) return path;
  const last = path.length - 1;
  const kept = new Uint8Array(path.length);
  kept[0] = kept[last] = 1;
  const spans = [0, last];
  while (spans.length) {
    const end = spans.pop()!,
      start = spans.pop()!;
    let split = start,
      maximum = tolerance;
    for (let i = start + 1; i < end; i++) {
      const distance = distanceToSegment(path[i]!, path[start]!, path[end]!);
      if (distance > maximum) {
        maximum = distance;
        split = i;
      }
    }
    if (split !== start) {
      kept[split] = 1;
      spans.push(start, split, split, end);
    }
  }
  const result = path.filter((_, i) => kept[i]);
  if (result.length === 2 && result[0]![0] === result[1]![0] && result[0]![1] === result[1]![1])
    return [];
  return result;
}

/** Reduces each route component independently using a planar coordinate tolerance. */
export function reduceLineVertices(
  geometry: WellKnownGeometry,
  tolerance: number,
  mode: 'simplify' | 'removeRepeated'
): WellKnownGeometry | null {
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new Error('Expected a finite nonnegative tolerance');
  if (
    (geometry.type === 'LineString' || geometry.type === 'MultiLineString') &&
    (!geometry.coordinates.length ||
      (geometry.type === 'MultiLineString' && geometry.coordinates.every(path => !path.length)))
  )
    return geometry;
  const reduce = mode === 'simplify' ? simplifyLine : removeRepeated;
  if (geometry.type === 'LineString') {
    const coordinates = reduce(geometry.coordinates, tolerance);
    return coordinates.length || mode === 'removeRepeated'
      ? {type: 'LineString', coordinates}
      : null;
  }
  if (geometry.type !== 'MultiLineString') throw new Error('Expected line geometry');
  const reduced = geometry.coordinates.map(path => reduce(path, tolerance));
  if (mode === 'removeRepeated') return {type: 'MultiLineString', coordinates: reduced};
  const coordinates = reduced.filter(path => path.length);
  return coordinates.length ? {type: 'MultiLineString', coordinates} : null;
}
