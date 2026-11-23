// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {orient2d} from 'robust-predicates';

/** A vertex with planar X and Y ordinates. */
type Position = readonly number[];
/** Ordered vertices of a line or polygon ring. */
type Path = readonly Position[];

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
export function segmentsMeet(a: Position, b: Position, c: Position, d: Position): boolean {
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

/** Tests whether a point is on a segment, including either endpoint. */
export function pointOnSegment(point: Position, a: Position, b: Position): boolean {
  return inBounds(point, a, b) && side(a, b, point) === 0;
}

/** Finds shared endpoints, including an endpoint lying in the other segment's interior. */
export function endpointContacts(
  a: readonly [Position, Position],
  b: readonly [Position, Position]
): Position[] {
  const contacts: Position[] = [];
  for (const [endpoints, other] of [
    [a, b],
    [b, a]
  ] as const) {
    for (const point of endpoints) {
      if (
        pointOnSegment(point, ...other) &&
        !contacts.some(value => value[0] === point[0] && value[1] === point[1])
      )
        contacts.push(point);
    }
  }
  return contacts;
}

/** Classifies a point as outside (-1), on the boundary (0), or inside (1). */
export function locatePointInPolygon(point: Position, rings: readonly Path[]): -1 | 0 | 1 {
  let inside = false;
  for (const ring of rings) {
    if (
      anyEdge(ring, true, (a, b) => {
        const orientation = side(a, b, point);
        if (!orientation && inBounds(point, a, b)) return true;
        if (a[1]! > point[1]! !== b[1]! > point[1]! && orientation < 0 === b[1]! > a[1]!)
          inside = !inside;
        return false;
      })
    )
      return 0;
  }
  return inside ? 1 : -1;
}
