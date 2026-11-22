// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {orient2d} from 'robust-predicates';

/** Ordered planar XY coordinates of a route. */

type Path = readonly (readonly number[])[];

/** Measures planar distance along the route at each vertex. */
function cumulativeDistances(path: Path): number[] {
  const distances = [0];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!,
      b = path[i]!;
    distances.push(distances[i - 1]! + Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!));
  }
  return distances;
}

/** Returns a route coordinate at an absolute distance, skipping zero-length segments. */
function coordinateAt(path: Path, distances: number[], target: number): readonly number[] {
  for (let i = 0; i < path.length; i++) {
    if (target === distances[i]) return path[i]!;
    if (target < distances[i]!) {
      const t = (target - distances[i - 1]!) / (distances[i]! - distances[i - 1]!);
      const a = path[i - 1]!,
        b = path[i]!;
      return [(1 - t) * a[0]! + t * b[0]!, (1 - t) * a[1]! + t * b[1]!];
    }
  }
  return path[path.length - 1]!;
}

/** Cuts a route at two fractions of its planar length, preserving intermediate vertices. */
export function lineSubstring(
  line: WellKnownGeometry,
  start: number,
  end: number
): WellKnownGeometry | null {
  if (!(start >= 0 && end <= 1 && start <= end))
    throw new Error('Expected ordered route fractions in [0, 1]');
  if (line.type !== 'LineString' || !line.coordinates.length) return null;
  const path = line.coordinates;
  const distances = cumulativeDistances(path);
  const total = distances[distances.length - 1]!;
  const from = start * total,
    to = end * total;
  const first = coordinateAt(path, distances, from);
  if (from === to) return {type: 'Point', coordinates: first};
  const coordinates = [first];
  for (let i = 1; i < path.length - 1; i++) {
    if (distances[i]! > from && distances[i]! < to && distances[i] !== distances[i - 1])
      coordinates.push(path[i]!);
  }
  coordinates.push(coordinateAt(path, distances, to));
  return {type: 'LineString', coordinates};
}

/** Nearest route coordinate, gap, and fraction of the total planar length. */
type LineProjection = {
  coordinate: readonly number[];
  distance: number;
  fraction: number;
};

/** Projects a point onto the nearest route segment, taking the first candidate on ties. */
export function projectPointToLine(
  line: WellKnownGeometry,
  point: WellKnownGeometry
): LineProjection | null {
  if (
    line.type !== 'LineString' ||
    !line.coordinates.length ||
    point.type !== 'Point' ||
    !Number.isFinite(point.coordinates[0]) ||
    !Number.isFinite(point.coordinates[1])
  )
    return null;
  const path = line.coordinates;
  const x = point.coordinates[0]!;
  const y = point.coordinates[1]!;
  let coordinate = path[0]!;
  let nearest = Math.hypot(x - coordinate[0]!, y - coordinate[1]!);
  let total = 0;
  let position = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const dx = b[0]! - a[0]!;
    const dy = b[1]! - a[1]!;
    const length = Math.hypot(dx, dy);
    if (!length) continue;
    const ux = dx / length;
    const uy = dy / length;
    const along = Math.max(0, Math.min(length, (x - a[0]!) * ux + (y - a[1]!) * uy));
    let px = along === length ? b[0]! : a[0]! + along * ux;
    let py = along === length ? b[1]! : a[1]! + along * uy;
    if (along > 0 && along < length && orient2d(a[0]!, a[1]!, b[0]!, b[1]!, x, y) === 0) {
      px = x;
      py = y;
    }
    const distance = Math.hypot(x - px, y - py);
    if (distance < nearest) {
      nearest = distance;
      coordinate = [px, py];
      position = total + along;
    }
    total += length;
  }
  return {coordinate, distance: nearest, fraction: total ? position / total : 0};
}

/** Returns the fraction of the route length at the projected point. */
export function lineLocatePoint(line: WellKnownGeometry, point: WellKnownGeometry): number | null {
  return projectPointToLine(line, point)?.fraction ?? null;
}
