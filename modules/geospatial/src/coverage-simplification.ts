// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {BoxIndex} from '@math.gl/geometry/spatial-index';
import {orient2d} from 'robust-predicates';
import {distanceToPlanarSegment} from './spatial-planar';
import {pointOnSegment, segmentsMeet} from './spatial-planar-intersects';

/** Polygonal feature in the input coverage. */
type Area = Extract<WellKnownGeometry, {type: 'Polygon' | 'MultiPolygon'}>;
/** A planar coordinate. */
type Point = readonly number[];
/** One closed polygon ring without its repeated endpoint. */
type Ring = {
  /** Input feature row. */
  row: number;
  /** Vertices excluding the closing copy. */
  points: readonly Point[];
  /** Selected vertex positions to omit from this ring. */
  removed: Set<number>;
};
/** A ring vertex occurrence. */
type Occurrence = {
  /** Owning ring. */
  ring: Ring;
  /** Index in that ring. */
  index: number;
};
/** Two endpoints of a boundary segment. */
type Edge = readonly [Point, Point];
/** Candidate removal shared by two feature rings. */
type Candidate = {
  /** Shared vertex and its neighbors. */
  triangle: readonly [Point, Point, Point];
  /** Occurrences removed together. */
  pair: readonly [Occurrence, Occurrence];
};

/** Keys identical XY locations, including equivalent signed zeros. */
function key(point: Point): string {
  return `${point[0]}/${point[1]}`;
}

/** Compares the horizontal coordinates. */
function same(a: Point, b: Point): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Packs one two-dimensional extent for the box index. */
function bounds(points: readonly Point[]): [number, number, number, number] {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x!);
    y0 = Math.min(y0, y!);
    x1 = Math.max(x1, x!);
    y1 = Math.max(y1, y!);
  }
  return [x0, y0, x1, y1];
}

/** Finds segments and edits with overlapping envelopes. */
function search(index: BoxIndex, points: readonly Point[]): number[] {
  const [x0, y0, x1, y1] = bounds(points);
  return index.search([x0, y0], [x1, y1]);
}

/** Returns the signed orientation of a point relative to an edge. */
function side(a: Point, b: Point, c: Point): number {
  return Math.sign(orient2d(a[0]!, a[1]!, b[0]!, b[1]!, c[0]!, c[1]!));
}

/** Tests an endpoint inside a nondegenerate edit triangle. */
function strictlyInside(p: Point, [a, b, c]: Candidate['triangle']): boolean {
  const x = side(a, b, p);
  return x !== 0 && x === side(b, c, p) && x === side(c, a, p);
}

/** Detects segment contact beyond a shared endpoint. */
function conflicts([a, b]: Edge, [c, d]: Edge): boolean {
  if (!segmentsMeet(a, b, c, d)) return false;
  if (!(same(a, c) || same(a, d) || same(b, c) || same(b, d))) return true;
  return (
    (!same(a, c) && !same(a, d) && pointOnSegment(a, c, d)) ||
    (!same(b, c) && !same(b, d) && pointOnSegment(b, c, d)) ||
    (!same(c, a) && !same(c, b) && pointOnSegment(c, a, b)) ||
    (!same(d, a) && !same(d, b) && pointOnSegment(d, a, b)) ||
    (same(a, c) && same(b, d)) ||
    (same(a, d) && same(b, c))
  );
}

/** Rejects edges entering the swept triangle or touching a replacement chord. */
function obstructs(edge: Edge, triangle: Candidate['triangle']): boolean {
  const [a, b, c] = triangle;
  const [x, y] = edge;
  if ((same(x, b) && (same(y, a) || same(y, c))) || (same(y, b) && (same(x, a) || same(x, c))))
    return false;
  // A collinear edit sweeps no interior. Test the new chord and retain junctions.
  return (
    strictlyInside(x, triangle) ||
    strictlyInside(y, triangle) ||
    conflicts(edge, [a, b]) ||
    conflicts(edge, [b, c]) ||
    conflicts(edge, [a, c])
  );
}

/** Reads the cyclic neighbor on either side of a ring vertex. */
function neighbor({ring, index}: Occurrence, delta: number): Point {
  return ring.points[(index + delta + ring.points.length) % ring.points.length]!;
}

/** Finds a shared degree-two boundary vertex eligible for one edit. */
function candidate(owners: Occurrence[], tolerance: number): Candidate | undefined {
  if (owners.length !== 2) return undefined;
  const [left, right] = owners as [Occurrence, Occurrence];
  if (
    left.ring.row === right.ring.row ||
    left.ring.points.length <= 3 ||
    right.ring.points.length <= 3
  )
    return undefined;
  const a = neighbor(left, -1);
  const b = neighbor(left, 0);
  const c = neighbor(left, 1);
  const x = neighbor(right, -1);
  const y = neighbor(right, 1);
  if (same(a, c) || !((same(a, x) && same(c, y)) || (same(a, y) && same(c, x)))) return undefined;
  if (!(distanceToPlanarSegment(b, a, c) <= tolerance)) return undefined;
  return {triangle: [a, b, c], pair: [left, right]};
}

/** Simplifies matched shared boundaries in a valid, edge-matched planar coverage. */
export function simplifyCoverage(
  rows: readonly (Area | null)[],
  tolerance: number,
  signal?: AbortSignal
): readonly (Area | null)[] {
  if (!tolerance) return rows;
  const occurrences = new Map<string, Occurrence[]>();
  const boundaries: Edge[] = [];
  const shapes = rows.map((geometry, row) => {
    signal?.throwIfAborted();
    if (!geometry) return null;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map(polygon =>
      polygon.map(closed => {
        if (closed.length < 4 || !same(closed[0]!, closed[closed.length - 1]!))
          throw new Error('ST_CoverageSimplify requires closed polygon rings');
        const points = closed.slice(0, -1);
        const ring: Ring = {row, points, removed: new Set()};
        points.forEach((point, index) => {
          if (!Number.isFinite(point[0]) || !Number.isFinite(point[1]))
            throw new Error('ST_CoverageSimplify requires finite coordinates');
          const id = key(point);
          const previous = occurrences.get(id);
          const owner = {ring, index};
          if (previous) previous.push(owner);
          else occurrences.set(id, [owner]);
          boundaries.push([point, points[(index + 1) % points.length]!]);
        });
        return ring;
      })
    );
  });
  const candidates = [...occurrences.values()].flatMap(owners => {
    const edit = candidate(owners, tolerance);
    return edit ? [edit] : [];
  });
  if (!candidates.length) return rows;

  const original = new BoxIndex({dimension: 2, bounds: boundaries.flatMap(bounds)});
  const edits = new BoxIndex({
    dimension: 2,
    bounds: candidates.flatMap(edit => bounds(edit.triangle))
  });
  const accepted = new Set<number>();
  const protectedVertices = new Set<string>();
  candidates.forEach(({triangle, pair}, index) => {
    signal?.throwIfAborted();
    const [a, b, c] = triangle;
    if (
      protectedVertices.has(key(b)) ||
      pair.some(({ring}) => ring.points.length - ring.removed.size <= 3)
    )
      return;
    if (search(original, triangle).some(hit => obstructs(boundaries[hit]!, triangle))) return;
    // Keep swept regions disjoint so simultaneous edits cannot create a crossing.
    if (search(edits, triangle).some(hit => accepted.has(hit))) return;
    accepted.add(index);
    protectedVertices.add(key(a));
    protectedVertices.add(key(c));
    for (const {ring, index: position} of pair) ring.removed.add(position);
  });

  if (!accepted.size) return rows;
  return shapes.map((shape, row) => {
    const geometry = rows[row];
    if (!geometry || !shape) return null;
    const coordinates = shape.map(polygon =>
      polygon.map(({points, removed}) => {
        const path = points.filter((_, index) => !removed.has(index));
        return [...path, path[0]!];
      })
    );
    return geometry.type === 'Polygon'
      ? {type: 'Polygon', coordinates: coordinates[0]!}
      : {type: 'MultiPolygon', coordinates};
  });
}
