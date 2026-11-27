// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {BoxIndex} from '@math.gl/geometry/spatial-index';
import {distanceToPlanarSegment, planarBounds} from './spatial-planar';
import {planarIntersects, segmentsMeet} from './spatial-planar-intersects';

/** One planar coordinate. */
type Position = readonly number[];
/** One polyline component. */
type Path = readonly Position[];
/** A segment and its two-dimensional bounds. */
type Segment = {
  /** First endpoint. */
  a: Position;
  /** Second endpoint. */
  b: Position;
  /** Minimum X and Y followed by maximum X and Y. */
  bounds: readonly [number, number, number, number];
};
/** 2D geometries with linear components. */
type Linear = Extract<WellKnownGeometry, {type: 'LineString' | 'MultiLineString'}>;
/** 2D geometries with polygonal components. */
type Areal = Extract<WellKnownGeometry, {type: 'Polygon' | 'MultiPolygon'}>;
/** A single point geometry. */
type Point = Extract<WellKnownGeometry, {type: 'Point'}>;

/** Candidate-pair cutoff above which a spatial index can avoid a full scan. */
const directPairLimit = 1024;

/** Tests a point against the filled area, hole boundaries, and exterior boundaries. */
export function pointWithinPolygonDistance(point: Point, polygon: Areal, radius: number): boolean {
  const [x, y] = point.coordinates;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const bounds = planarBounds(polygon);
  if (!bounds || !boxesWithin([x!, y!, x!, y!], bounds, radius)) return false;
  if (planarIntersects(point, polygon)) return true;
  if (radius === 0) return false;
  const areas = polygon.type === 'Polygon' ? [polygon.coordinates] : polygon.coordinates;
  for (const area of areas) {
    for (const ring of area) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i === 0 ? ring.length - 1 : i - 1]!;
        const b = ring[i]!;
        if (distanceToPlanarSegment(point.coordinates, a, b) <= radius) return true;
      }
    }
  }
  return false;
}

/** Keeps multiline components separate, including degenerate point-like segments. */
function lineSegments(geometry: Linear): Segment[] {
  const paths: readonly Path[] =
    geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
  const segments: Segment[] = [];
  for (const path of paths) {
    if (path.some(point => !Number.isFinite(point[0]) || !Number.isFinite(point[1])))
      throw new Error('ST_DWithin requires finite line coordinates');
    if (!path.length) continue;
    for (let i = 0; i < Math.max(1, path.length - 1); i++) {
      const a = path[i]!;
      const b = path[i + 1] ?? a;
      segments.push({
        a,
        b,
        bounds: [
          Math.min(a[0]!, b[0]!),
          Math.min(a[1]!, b[1]!),
          Math.max(a[0]!, b[0]!),
          Math.max(a[1]!, b[1]!)
        ]
      });
    }
  }
  return segments;
}

/** Uses the largest axis gap as a conservative lower bound on Euclidean distance. */
function boxesWithin(a: readonly number[], b: readonly number[], radius: number): boolean {
  return Math.max(a[0]! - b[2]!, b[0]! - a[2]!, a[1]! - b[3]!, b[1]! - a[3]!) <= radius;
}

/** Intersecting segments have zero gap; otherwise a closest pair includes an endpoint. */
function segmentsWithin(left: Segment, right: Segment, radius: number): boolean {
  if (!boxesWithin(left.bounds, right.bounds, radius)) return false;
  const {a, b} = left;
  const {a: c, b: d} = right;
  return (
    segmentsMeet(a, b, c, d) ||
    (radius > 0 &&
      (distanceToPlanarSegment(a, c, d) <= radius ||
        distanceToPlanarSegment(b, c, d) <= radius ||
        distanceToPlanarSegment(c, a, b) <= radius ||
        distanceToPlanarSegment(d, a, b) <= radius))
  );
}

/** Builds finite search bounds with enough padding to round outward. */
function expandBound(value: number, radius: number, direction: -1 | 1): number {
  const padding = Math.max(Math.abs(value), radius) * Number.EPSILON;
  return Math.max(
    -Number.MAX_VALUE,
    Math.min(Number.MAX_VALUE, value + direction * (radius + padding))
  );
}

/** Tests line pairs by exact segment refinement after rejecting distant bounds. */
export function linesWithinDistance(left: Linear, right: Linear, radius: number): boolean {
  const leftBounds = planarBounds(left);
  const rightBounds = planarBounds(right);
  if (!leftBounds || !rightBounds || !boxesWithin(leftBounds, rightBounds, radius)) return false;
  const a = lineSegments(left);
  const b = lineSegments(right);
  if (!a.length || !b.length) return false;
  if (radius === Infinity) return true;
  if (a.length * b.length <= directPairLimit || Math.min(a.length, b.length) < 8) {
    return a.some(segment => b.some(candidate => segmentsWithin(segment, candidate, radius)));
  }

  const [indexed, queries] = a.length <= b.length ? [a, b] : [b, a];
  const index = new BoxIndex({dimension: 2, bounds: indexed.flatMap(segment => segment.bounds)});
  for (const segment of queries) {
    const [x0, y0, x1, y1] = segment.bounds;
    const {result} = index.searchQuery(
      [expandBound(x0, radius, -1), expandBound(y0, radius, -1)],
      [expandBound(x1, radius, 1), expandBound(y1, radius, 1)],
      {filter: candidate => segmentsWithin(segment, indexed[candidate]!, radius), maxResults: 1}
    );
    if (result.length) return true;
  }
  return false;
}
