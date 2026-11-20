// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {orient2d} from 'robust-predicates';
import {planarBounds} from './planar';

/** One atomic planar geometry after collection expansion. */
type Primitive = Extract<WellKnownGeometry, {type: 'Point' | 'LineString' | 'Polygon'}>;
/** A vertex with planar X and Y ordinates. */
type Position = readonly number[];
/** Ordered vertices of a line or polygon ring. */
type Path = readonly Position[];

/** Expands multi-geometries and collections without joining disconnected paths. */
function* primitives(geometry: WellKnownGeometry): Generator<Primitive> {
  switch (geometry.type) {
    case 'MultiPoint':
      for (const coordinates of geometry.coordinates) yield {type: 'Point', coordinates};
      break;
    case 'MultiLineString':
      for (const coordinates of geometry.coordinates) yield {type: 'LineString', coordinates};
      break;
    case 'MultiPolygon':
      for (const coordinates of geometry.coordinates) yield {type: 'Polygon', coordinates};
      break;
    case 'GeometryCollection':
      for (const child of geometry.geometries) yield* primitives(child);
      break;
    default:
      yield geometry;
  }
}

/** Reports which side of an oriented edge contains the third point. */
function side(a: Position, b: Position, c: Position): number {
  return Math.sign(orient2d(a[0]!, a[1]!, b[0]!, b[1]!, c[0]!, c[1]!));
}

/** Tests inclusion in the closed bounds of an edge. */
function inBounds(p: Position, a: Position, b: Position): boolean {
  return (
    p[0]! >= Math.min(a[0]!, b[0]!) &&
    p[0]! <= Math.max(a[0]!, b[0]!) &&
    p[1]! >= Math.min(a[1]!, b[1]!) &&
    p[1]! <= Math.max(a[1]!, b[1]!)
  );
}

/** Detects proper crossings, coincident intervals and endpoint contact. */
function segmentsMeet(a: Position, b: Position, c: Position, d: Position): boolean {
  const cSide = side(a, b, c),
    dSide = side(a, b, d);
  const aSide = side(c, d, a),
    bSide = side(c, d, b);
  return (
    (cSide * dSide < 0 && aSide * bSide < 0) ||
    (!cSide && inBounds(c, a, b)) ||
    (!dSide && inBounds(d, a, b)) ||
    (!aSide && inBounds(a, c, d)) ||
    (!bSide && inBounds(b, c, d))
  );
}

/** Visits path edges until a match, including an implicit ring closure. */
function anyEdge(
  path: Path,
  closed: boolean,
  match: (a: Position, b: Position) => boolean
): boolean {
  for (let i = closed ? 0 : 1; i < path.length; i++) {
    if (match(path[i ? i - 1 : path.length - 1]!, path[i]!)) return true;
  }
  return false;
}

/** Uses even-odd crossings across shell and holes, including all boundary points. */
function meetsPoint(point: Position, geometry: Primitive): boolean {
  if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return false;
  if (geometry.type === 'Point')
    return point[0] === geometry.coordinates[0] && point[1] === geometry.coordinates[1];
  if (geometry.type === 'LineString')
    return anyEdge(
      geometry.coordinates,
      false,
      (a, b) => inBounds(point, a, b) && !side(a, b, point)
    );
  let inside = false;
  for (const ring of geometry.coordinates) {
    if (
      anyEdge(ring, true, (a, b) => {
        const orientation = side(a, b, point);
        if (!orientation && inBounds(point, a, b)) return true;
        if (a[1]! > point[1]! !== b[1]! > point[1]! && orientation < 0 === b[1]! > a[1]!)
          inside = !inside;
        return false;
      })
    )
      return true;
  }
  return inside;
}

/** Tests boundary intersection and full containment of individual components. */
function primitivesMeet(a: Primitive, b: Primitive): boolean {
  if (a.type === 'Point') return meetsPoint(a.coordinates, b);
  if (b.type === 'Point') return meetsPoint(b.coordinates, a);
  const pathsA = a.type === 'LineString' ? [a.coordinates] : a.coordinates;
  const pathsB = b.type === 'LineString' ? [b.coordinates] : b.coordinates;
  for (const path of pathsA) {
    if (b.type === 'Polygon' && path[0] && meetsPoint(path[0], b)) return true;
    if (
      anyEdge(path, a.type === 'Polygon', (p, q) =>
        pathsB.some(other =>
          anyEdge(other, b.type === 'Polygon', (r, s) => segmentsMeet(p, q, r, s))
        )
      )
    )
      return true;
  }
  return a.type === 'Polygon' && pathsB.some(path => Boolean(path[0] && meetsPoint(path[0], a)));
}

/** Tests planar intersection after rejecting empty and disjoint bounding boxes. */
export function planarIntersects(a: WellKnownGeometry, b: WellKnownGeometry): boolean {
  const x = planarBounds(a),
    y = planarBounds(b);
  if (!x || !y || x[2]! < y[0]! || x[0]! > y[2]! || x[3]! < y[1]! || x[1]! > y[3]!) return false;
  for (const left of primitives(a)) {
    for (const right of primitives(b)) if (primitivesMeet(left, right)) return true;
  }
  return false;
}
