// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {projectPointToPolyline, visitPolylineSpan} from '@math.gl/geometry/polygon';

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
  if (from === to) return {type: 'Point', coordinates: coordinateAt(path, distances, from)};
  const coordinates: number[][] = [];
  let startSegment = 0;
  while (distances[startSegment + 1]! <= from) startSegment++;
  let endSegment = startSegment;
  while (distances[endSegment + 1]! < to) endSegment++;
  visitPolylineSpan(
    (vertex, ordinate) => path[vertex]![ordinate]!,
    startSegment,
    (from - distances[startSegment]!) / (distances[startSegment + 1]! - distances[startSegment]!),
    endSegment,
    (to - distances[endSegment]!) / (distances[endSegment + 1]! - distances[endSegment]!),
    (x, y, vertex) => {
      if (vertex === undefined || distances[vertex] !== distances[vertex - 1])
        coordinates.push([x, y]);
    }
  );
  return {type: 'LineString', coordinates};
}

/** Projects a SQL point onto a planar route after checking geometry kinds. */
export function projectPointToLine(line: WellKnownGeometry, point: WellKnownGeometry) {
  return line.type === 'LineString' && point.type === 'Point'
    ? projectPointToPolyline(line.coordinates, point.coordinates)
    : null;
}

/** Returns the fraction of the route length at the projected point. */
export function lineLocatePoint(line: WellKnownGeometry, point: WellKnownGeometry): number | null {
  return projectPointToLine(line, point)?.fraction ?? null;
}
