// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {orient2d} from 'robust-predicates';

/** Ordered planar XY coordinates. */
type Path = readonly (readonly number[])[];

/** Nearest route coordinate, gap, and fraction of the total planar length. */
export type PolylineProjection = {
  /** Snapped XY coordinate in the route's coordinate system. */
  coordinate: readonly number[];
  /** Cartesian distance from the observation in coordinate units. */
  distance: number;
  /** Fraction in [0, 1] along the route, or zero for a zero-length route. */
  fraction: number;
};

/** Projects a point onto the nearest route segment, taking the first candidate on ties. */
export function projectPointToPolyline(
  path: Path,
  point: readonly number[]
): PolylineProjection | null {
  if (!path.length || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;
  const x = point[0]!;
  const y = point[1]!;
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
