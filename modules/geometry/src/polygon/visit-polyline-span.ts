// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/**
 * Visits an XY polyline span in either direction. Segment indices identify the
 * first vertex of each boundary segment. Fractions are in [0, 1].
 * The visitor receives a vertex index for intermediate vertices.
 * Coordinate access and output storage are supplied by the caller.
 */
export function visitPolylineSpan(
  read: (vertex: number, ordinate: 0 | 1) => number,
  firstSegment: number,
  firstFraction: number,
  lastSegment: number,
  lastFraction: number,
  visit: (x: number, y: number, vertex?: number) => void,
  reverse = false
): void {
  /** Emits an interpolated endpoint without allocating a coordinate tuple. */
  function endpoint(segment: number, fraction: number): void {
    if (fraction === 0 || fraction === 1) {
      const vertex = segment + fraction;
      visit(read(vertex, 0), read(vertex, 1));
      return;
    }
    const x = read(segment, 0);
    const y = read(segment, 1);
    visit(
      (1 - fraction) * x + fraction * read(segment + 1, 0),
      (1 - fraction) * y + fraction * read(segment + 1, 1)
    );
  }

  if (reverse) {
    endpoint(lastSegment, lastFraction);
    for (let vertex = lastSegment; vertex > firstSegment; vertex--) {
      visit(read(vertex, 0), read(vertex, 1), vertex);
    }
    endpoint(firstSegment, firstFraction);
  } else {
    endpoint(firstSegment, firstFraction);
    for (let vertex = firstSegment + 1; vertex <= lastSegment; vertex++) {
      visit(read(vertex, 0), read(vertex, 1), vertex);
    }
    endpoint(lastSegment, lastFraction);
  }
}
