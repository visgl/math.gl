// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import polygonClipping from 'polygon-clipping';
import {
  locatePointInPolygon,
  planarIntersects,
  pointOnSegment,
  segmentsMeet
} from './spatial-planar-intersects';
import {polygonSet} from './spatial-polygon-overlay';

/** XY position and ordered path. */
type Position = readonly number[];
/** Ordered vertices of a line component or ring. */
type Path = readonly Position[];
/** Endpoints of one planar segment. */
type Edge = readonly [Position, Position];
/** Point and multipoint geometry. */
type Points = Extract<WellKnownGeometry, {type: 'Point' | 'MultiPoint'}>;
/** Line and multiline geometry. */
type Lines = Extract<WellKnownGeometry, {type: 'LineString' | 'MultiLineString'}>;
/** Polygon and multipolygon geometry. */
type Area = Extract<WellKnownGeometry, {type: 'Polygon' | 'MultiPolygon'}>;

/** Narrows the geometry types containing only points. */
function isPointLike(geometry: WellKnownGeometry): geometry is Points {
  return geometry.type === 'Point' || geometry.type === 'MultiPoint';
}

/** Narrows line and multiline geometries. */
function isLinear(geometry: WellKnownGeometry): geometry is Lines {
  return geometry.type === 'LineString' || geometry.type === 'MultiLineString';
}

/** Narrows polygon and multipolygon geometries. */
function isAreal(geometry: WellKnownGeometry): geometry is Area {
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon';
}

/** Returns independent line components. */
function paths(geometry: Lines): readonly Path[] {
  return geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
}

/** Returns independent areal components with their interior rings. */
function polygons(geometry: Area): readonly (readonly Path[])[] {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

/** Compares planar coordinates without imposing a distance tolerance. */
function samePoint(a: Position, b: Position): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/** Keys an XY location, including equivalent positive and negative zero. */
function pointKey(point: Position): string {
  return `${point[0]}/${point[1]}`;
}

/** Iterates nonzero segments and implicitly closes rings. */
function* edges(components: readonly Path[], closed = false): Generator<Edge> {
  for (const path of components) {
    for (let i = closed ? 0 : 1; i < path.length; i++) {
      const a = path[i ? i - 1 : path.length - 1]!;
      const b = path[i]!;
      if (!samePoint(a, b)) yield [a, b];
    }
  }
}

/** Computes the line boundary using odd endpoint incidence across all components. */
function lineBoundary(components: readonly Path[]): ReadonlyMap<string, Position> {
  const boundary = new Map<string, Position>();
  for (const component of components) {
    if (!component.length) continue;
    for (const point of [component[0]!, component[component.length - 1]!]) {
      const key = pointKey(point);
      if (!boundary.delete(key)) boundary.set(key, point);
    }
  }
  return boundary;
}

/** Finds shared endpoints, including an endpoint lying in the other segment's interior. */
export function endpointContacts(a: Edge, b: Edge): Position[] {
  const contacts: Position[] = [];
  for (const [endpoints, other] of [
    [a, b],
    [b, a]
  ] as const) {
    for (const point of endpoints) {
      if (pointOnSegment(point, ...other) && !contacts.some(value => samePoint(value, point)))
        contacts.push(point);
    }
  }
  return contacts;
}

/** Tests whether any odd endpoint is also on both segments of a proper crossing. */
function hasBoundaryCrossing(boundary: ReadonlyMap<string, Position>, a: Edge, b: Edge): boolean {
  for (const point of boundary.values()) {
    if (pointOnSegment(point, ...a) && pointOnSegment(point, ...b)) return true;
  }
  return false;
}

/** Detects line interior overlap, accounting for the whole multiline boundary. */
function lineInteriorsMeet(a: Lines, b: Lines): boolean {
  const aPaths = paths(a);
  const bPaths = paths(b);
  const aBoundary = lineBoundary(aPaths);
  const bBoundary = lineBoundary(bPaths);
  const bEdges = [...edges(bPaths)];
  for (const left of edges(aPaths)) {
    for (const right of bEdges) {
      if (!segmentsMeet(...left, ...right)) continue;
      const contacts = endpointContacts(left, right);
      if (contacts.length > 1) return true;
      if (contacts.length) {
        const key = pointKey(contacts[0]!);
        if (!aBoundary.has(key) && !bBoundary.has(key)) return true;
      } else if (
        !hasBoundaryCrossing(aBoundary, left, right) &&
        !hasBoundaryCrossing(bBoundary, left, right)
      ) {
        return true;
      }
    }
  }
  return false;
}

/** Tests a point against the interior of any areal component. */
function insideArea(point: Position, areas: readonly (readonly Path[])[]): boolean {
  return areas.some(rings => locatePointInPolygon(point, rings) === 1);
}

/** Finds a segment parameter on its axis with the least relative rounding error. */
export function parameter(point: Position, [a, b]: Edge): number {
  const dx = b[0]! - a[0]!;
  const dy = b[1]! - a[1]!;
  return Math.abs(dx) >= Math.abs(dy) ? (point[0]! - a[0]!) / dx : (point[1]! - a[1]!) / dy;
}

/** Tests intervals between area boundary contacts, excluding coincident boundary segments. */
function segmentEntersArea(
  edge: Edge,
  boundaries: readonly Edge[],
  areas: readonly (readonly Path[])[]
): boolean {
  const [a, b] = edge;
  if (insideArea(a, areas) || insideArea(b, areas)) return true;
  const cuts = new Set([0, 1]);
  const coincident: [number, number][] = [];
  for (const boundary of boundaries) {
    if (!segmentsMeet(...edge, ...boundary)) continue;
    const contacts = endpointContacts(edge, boundary).map(point => parameter(point, edge));
    if (!contacts.length) return true;
    for (const contact of contacts) cuts.add(contact);
    if (contacts.length === 2) coincident.push([Math.min(...contacts), Math.max(...contacts)]);
  }
  const sorted = [...cuts].sort((left, right) => left - right);
  for (let i = 1; i < sorted.length; i++) {
    const from = sorted[i - 1]!;
    const to = sorted[i]!;
    if (coincident.some(([start, end]) => start <= from && to <= end)) continue;
    const t = (from + to) / 2;
    if (insideArea([(1 - t) * a[0]! + t * b[0]!, (1 - t) * a[1]! + t * b[1]!], areas)) return true;
  }
  return false;
}

/** Finds any line segment that enters an areal interior. */
function lineEntersArea(line: Lines, area: Area): boolean {
  const areas = polygons(area);
  const boundaries = [...edges(areas.flat(), true)];
  for (const edge of edges(paths(line))) {
    if (segmentEntersArea(edge, boundaries, areas)) return true;
  }
  return false;
}

/** Checks point locations against the other geometry's interior. */
function pointsMeetInterior(points: Points, other: Lines | Area): boolean {
  const positions = points.type === 'Point' ? [points.coordinates] : points.coordinates;
  if (isAreal(other)) {
    const areas = polygons(other);
    return positions.some(
      point => Number.isFinite(point[0]) && Number.isFinite(point[1]) && insideArea(point, areas)
    );
  }
  const linePaths = paths(other);
  const boundary = lineBoundary(linePaths);
  const segments = [...edges(linePaths)];
  return positions.some(
    point => !boundary.has(pointKey(point)) && segments.some(edge => pointOnSegment(point, ...edge))
  );
}

/** Reports any geometric contact without intersection between the two interiors. */
export function planarTouches(a: WellKnownGeometry, b: WellKnownGeometry): boolean {
  if (
    (!isPointLike(a) && !isLinear(a) && !isAreal(a)) ||
    (!isPointLike(b) && !isLinear(b) && !isAreal(b))
  )
    throw new Error('ST_Touches requires point, line or polygon geometry');
  if (isPointLike(a) && isPointLike(b)) return false;
  if (!planarIntersects(a, b)) return false;
  if (isPointLike(a) && !isPointLike(b)) return !pointsMeetInterior(a, b);
  if (isPointLike(b) && !isPointLike(a)) return !pointsMeetInterior(b, a);
  if (isLinear(a) && isLinear(b)) return !lineInteriorsMeet(a, b);
  if (isLinear(a) && isAreal(b)) return !lineEntersArea(a, b);
  if (isAreal(a) && isLinear(b)) return !lineEntersArea(b, a);
  return !polygonClipping.intersection(polygonSet(a), polygonSet(b)).length;
}
