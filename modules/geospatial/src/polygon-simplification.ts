// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {orient2d} from 'robust-predicates';
import {simplifyLine} from './line-simplification';
import {planarBounds} from './spatial-planar';
import {planarIntersects, segmentsMeet} from './spatial-planar-intersects';

/** One planar vertex. */
type Position = readonly number[];
/** Vertices of a closed ring, including its repeated endpoint. */
type Ring = readonly Position[];
/** One component with a shell followed by its holes. */
type Polygon = readonly Ring[];
/** Axis-aligned XY bounds. */
type Bounded = {
  /** Minimum X and Y followed by maximum X and Y. */
  bounds: readonly number[];
};
/** An indexed ring segment for the intersection sweep. */
type Edge = Bounded & {
  /** First endpoint. */
  a: Position;
  /** Second endpoint. */
  b: Position;
  /** Identity of the containing ring. */
  ring: Ring;
  /** Index of the first endpoint in that ring. */
  index: number;
};

/** Estimates the active interval count relative to the extent of the sweep. */
function intervalDensity(items: readonly Bounded[], axis: number): number {
  let minimum = Infinity;
  let maximum = -Infinity;
  let length = 0;
  for (const {bounds} of items) {
    const low = bounds[axis]!;
    const high = bounds[axis + 2]!;
    minimum = Math.min(minimum, low);
    maximum = Math.max(maximum, high);
    length += high - low;
  }
  return maximum > minimum ? length / (maximum - minimum) : Infinity;
}

/** Visits overlapping bounding boxes along the axis with fewer expected candidates. */
function anyOverlap<T extends Bounded>(items: T[], reject: (a: T, b: T) => boolean): boolean {
  const axis = intervalDensity(items, 0) > intervalDensity(items, 1) ? 1 : 0;
  const other = 1 - axis;
  items.sort((a, b) => a.bounds[axis]! - b.bounds[axis]!);
  for (let i = 0; i < items.length; i++) {
    const a = items[i]!;
    for (let j = i + 1; j < items.length && items[j]!.bounds[axis]! <= a.bounds[axis + 2]!; j++) {
      const b = items[j]!;
      if (
        b.bounds[other]! <= a.bounds[other + 2]! &&
        a.bounds[other]! <= b.bounds[other + 2]! &&
        reject(a, b)
      )
        return true;
    }
  }
  return false;
}

/** Compares two XY positions. */
function samePoint(a: Position, b: Position): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Computes translated signed area for the winding and collapse check. */
function signedArea(ring: Ring): number {
  const [x, y] = ring[0]!;
  let area = 0;
  for (let i = 1; i + 1 < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[i + 1]!;
    area += (a[0]! - x!) * (b[1]! - y!) - (a[1]! - y!) * (b[0]! - x!);
  }
  return area;
}

/** Rejects invalid, self-touching, or mutually touching boundaries conservatively. */
function separatedBoundaries(rings: readonly Ring[]): boolean {
  const edges: Edge[] = [];
  for (const ring of rings) {
    const size = ring.length - 1;
    if (size < 3 || !samePoint(ring[0]!, ring[size]!)) return false;
    for (let i = 0; i < size; i++) {
      const a = ring[i]!;
      const b = ring[i + 1]!;
      const c = ring[(i + 2) % size]!;
      if (!Number.isFinite(a[0]) || !Number.isFinite(a[1]) || samePoint(a, b)) return false;
      if (
        orient2d(a[0]!, a[1]!, b[0]!, b[1]!, c[0]!, c[1]!) === 0 &&
        (a[0]! - b[0]!) * (c[0]! - b[0]!) + (a[1]! - b[1]!) * (c[1]! - b[1]!) > 0
      )
        return false;
      edges.push({
        a,
        b,
        ring,
        index: i,
        bounds: [
          Math.min(a[0]!, b[0]!),
          Math.min(a[1]!, b[1]!),
          Math.max(a[0]!, b[0]!),
          Math.max(a[1]!, b[1]!)
        ]
      });
    }
  }
  return !anyOverlap(edges, (a, b) => {
    if (a.ring === b.ring) {
      const gap = Math.abs(a.index - b.index);
      if (gap === 1 || gap === a.ring.length - 2) return false;
    }
    return segmentsMeet(a.a, a.b, b.a, b.b);
  });
}

/** Checks containment of one ring by another after ruling out boundary contact. */
function contains(outer: Ring, inner: Ring): boolean {
  return planarIntersects(
    {type: 'Polygon', coordinates: [outer]},
    {type: 'Point', coordinates: inner[0]!}
  );
}

/** Checks that all shell, hole, and island containment relationships remain the same. */
function preservesNesting(before: Ring[], after: Ring[]): boolean {
  const rings = before.map((original, index) => ({
    original,
    simplified: after[index]!,
    bounds: planarBounds({type: 'LineString', coordinates: original})!
  }));
  return !anyOverlap(
    rings,
    (a, b) =>
      contains(a.original, b.original) !== contains(a.simplified, b.simplified) ||
      contains(b.original, a.original) !== contains(b.simplified, a.simplified)
  );
}

/** Keeps the original ring if simplification would collapse it or reverse its winding. */
function simplifyRing(ring: Ring, tolerance: number): Ring {
  const reduced = simplifyLine(ring, tolerance);
  if (reduced.length < 4 || reduced.length === ring.length) return ring;
  const before = signedArea(ring);
  const after = signedArea(reduced);
  return Number.isFinite(before) &&
    Number.isFinite(after) &&
    after &&
    Math.sign(before) === Math.sign(after)
    ? reduced
    : ring;
}

/** Simplifies closed rings only when boundary and nesting checks prove topology is preserved. */
export function simplifyPolygonTopology(
  geometry: Extract<WellKnownGeometry, {type: 'Polygon' | 'MultiPolygon'}>,
  tolerance: number
): typeof geometry {
  if (!Number.isFinite(tolerance) || tolerance < 0)
    throw new Error('Expected a finite nonnegative tolerance');
  if (!tolerance) return geometry;
  const polygons: readonly Polygon[] =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const before = polygons.flat();
  const reduced = polygons.map(polygon => polygon.map(ring => simplifyRing(ring, tolerance)));
  const after = reduced.flat();
  if (before.every((ring, index) => ring === after[index])) return geometry;
  if (
    !separatedBoundaries(before) ||
    !separatedBoundaries(after) ||
    !preservesNesting(before, after)
  )
    return geometry;
  return geometry.type === 'Polygon'
    ? {type: 'Polygon', coordinates: reduced[0]!}
    : {type: 'MultiPolygon', coordinates: reduced};
}
