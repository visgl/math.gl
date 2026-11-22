// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownDimension, WellKnownGeometry} from '@math.gl/core/arrow';

/** Vertex coordinates in the input geometry's declared dimension. */
type Position = readonly number[];
/** Ordered coordinates for one independent route component. */
type Path = readonly Position[];
/** Dimensions with a semantic measure ordinate. */
type MeasuredDimension = 'xym' | 'xyzm';

/** Extracts the paths of a linear geometry without connecting multipart gaps. */
function pathsOf(geometry: WellKnownGeometry): readonly Path[] {
  if (geometry.type === 'LineString') return [geometry.coordinates];
  if (geometry.type === 'MultiLineString') return geometry.coordinates;
  throw new Error('Measured routes require a LineString or MultiLineString');
}

/** Returns the measure dimension or rejects unmeasured linework. */
export function measuredDimension(dimension: WellKnownDimension): MeasuredDimension {
  if (dimension === 'xym' || dimension === 'xyzm') return dimension;
  throw new Error('Input geometry requires a measure (M) ordinate');
}

/** Assigns measures by accumulated XY path length, retaining any Z ordinate. */
export function addMeasure(
  geometry: WellKnownGeometry,
  dimension: WellKnownDimension,
  start: number,
  end: number
): {geometry: WellKnownGeometry; dimension: MeasuredDimension} {
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('Expected finite measures');
  const paths = pathsOf(geometry);
  let total = 0;
  const distances = paths.map(path =>
    path.map((point, i) => {
      if (i > 0) {
        const previous = path[i - 1]!;
        total += Math.hypot(point[0]! - previous[0]!, point[1]! - previous[1]!);
      }
      return total;
    })
  );
  if (!Number.isFinite(total)) throw new Error('Expected finite route length');
  const spatialSize = dimension.includes('z') ? 3 : 2;
  const coordinates = paths.map((path, part) =>
    path.map((point, i) => {
      const fraction = total ? distances[part]![i]! / total : 0;
      return [...point.slice(0, spatialSize), (1 - fraction) * start + fraction * end];
    })
  );
  return {
    geometry:
      geometry.type === 'LineString'
        ? {type: 'LineString', coordinates: coordinates[0]!}
        : {type: 'MultiLineString', coordinates},
    dimension: spatialSize === 3 ? 'xyzm' : 'xym'
  };
}

/** Tests equality of every ordinate, including dimensions other than XY. */
function samePosition(a: Position, b: Position): boolean {
  return a.every((value, i) => value === b[i]);
}

/** Interpolates XY and optional Z while setting M exactly to the requested value. */
function atMeasure(a: Position, b: Position, index: number, measure: number): Position {
  const from = a[index]!;
  const to = b[index]!;
  if (from !== to) {
    if (measure === from) return a;
    if (measure === to) return b;
  }
  const span = to - from;
  const fraction =
    span === 0
      ? 0.5
      : Number.isFinite(span)
        ? (measure - from) / span
        : (measure / 2 - from / 2) / (to / 2 - from / 2);
  return a.map((value, i) => (i === index ? measure : (1 - fraction) * value + fraction * b[i]!));
}

/** Reads the measure ordinate and rejects invalid measured vertices. */
function measureAt(position: Position, index: number): number {
  const value = position[index]!;
  if (!Number.isFinite(value)) throw new Error('Expected finite route measures');
  return value;
}

/** Finds each matching location. Constant-measure segments contribute their midpoint. */
export function locateAlong(
  geometry: WellKnownGeometry,
  dimension: MeasuredDimension,
  measure: number
): WellKnownGeometry {
  if (!Number.isFinite(measure)) throw new Error('Expected a finite measure');
  const index = dimension.indexOf('m');
  const coordinates: Position[] = [];
  for (const path of pathsOf(geometry)) {
    let previousEndsAtVertex = false;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]!;
      const b = path[i]!;
      const from = measureAt(a, index);
      const to = measureAt(b, index);
      if (measure < Math.min(from, to) || measure > Math.max(from, to)) {
        previousEndsAtVertex = false;
        continue;
      }
      const startsAtVertex = from !== to && measure === from;
      if (!previousEndsAtVertex || !startsAtVertex) {
        coordinates.push(atMeasure(a, b, index, measure));
      }
      previousEndsAtVertex = from !== to && measure === to;
    }
  }
  return {type: 'MultiPoint', coordinates};
}

/** Appends a clipped point or line when a contiguous portion is complete. */
function appendPortion(parts: WellKnownGeometry[], path: Position[]): void {
  if (path.length === 1) parts.push({type: 'Point', coordinates: path[0]!});
  else if (path.length > 1) parts.push({type: 'LineString', coordinates: path});
}

/** Clips each component in measure space, preserving direction and disjoint visits. */
export function locateBetween(
  geometry: WellKnownGeometry,
  dimension: MeasuredDimension,
  start: number,
  end: number
): WellKnownGeometry {
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('Expected finite measures');
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  const index = dimension.indexOf('m');
  const parts: WellKnownGeometry[] = [];
  for (const path of pathsOf(geometry)) {
    let portion: Position[] = [];
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]!;
      const b = path[i]!;
      const from = measureAt(a, index);
      const to = measureAt(b, index);
      const begin = Math.max(low, Math.min(from, to));
      const finish = Math.min(high, Math.max(from, to));
      if (begin > finish) continue;
      const first = from === to ? a : atMeasure(a, b, index, from <= to ? begin : finish);
      const last = from === to ? b : atMeasure(a, b, index, from <= to ? finish : begin);
      if (!portion.length) portion.push(first);
      if (!samePosition(portion[portion.length - 1]!, last)) portion.push(last);
      if (to < low || to > high) {
        appendPortion(parts, portion);
        portion = [];
      }
    }
    appendPortion(parts, portion);
  }
  return parts.every(part => part.type === 'LineString')
    ? {type: 'MultiLineString', coordinates: parts.map(part => part.coordinates)}
    : {type: 'GeometryCollection', geometries: parts};
}
