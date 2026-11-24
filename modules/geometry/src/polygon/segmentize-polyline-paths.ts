// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Ordered XY coordinates of a polyline. */
type Path = readonly (readonly number[])[];

/** Distance and interpolation on a single planar or ellipsoidal segment. */
export type PolylineSegment = {
  /** Length in the function's units. */
  length: number;
  /** Returns the position at a fraction of the segment's length. */
  interpolate: (fraction: number) => readonly number[];
};

/** Describes one segment for the densification kernel. */
export type PolylineSegmentFactory = (
  a: readonly number[],
  b: readonly number[]
) => PolylineSegment;

/** Splits paths into equal-length subsegments within the supplied length and growth limits. */
export function segmentizePolylinePaths(
  paths: readonly Path[],
  step: number,
  maxAddedVertices: number,
  segmentFor: PolylineSegmentFactory = planarPolylineSegment
): Path[] {
  if (!Number.isFinite(step) || step <= 0)
    throw new RangeError('Expected a finite positive maximum segment length');
  if (!Number.isSafeInteger(maxAddedVertices) || maxAddedVertices < 0)
    throw new RangeError('Expected a nonnegative integer vertex insertion limit');
  let added = 0;
  /** Densifies one component, sharing the insertion limit across all parts. */
  function segmentize(path: Path): Path {
    if (path.length < 2) return path;
    const coordinates: (readonly number[])[] = [path[0]!];
    for (let vertex = 1; vertex < path.length; vertex++) {
      const a = path[vertex - 1]!;
      const b = path[vertex]!;
      const segment = segmentFor(a, b);
      if (!Number.isFinite(segment.length) || segment.length < 0)
        throw new RangeError('Expected finite segment lengths');
      const parts = Math.max(Math.ceil(segment.length / step), 1);
      added += parts - 1;
      if (added > maxAddedVertices)
        throw new RangeError(
          'Polyline would add more than ' + maxAddedVertices.toLocaleString('en-US') + ' vertices'
        );
      for (let part = 1; part < parts; part++) coordinates.push(segment.interpolate(part / parts));
      coordinates.push(b);
    }
    return coordinates;
  }

  return paths.map(segmentize);
}

/** Measures a planar XY segment and interpolates in coordinate space. */
function planarPolylineSegment(a: readonly number[], b: readonly number[]): PolylineSegment {
  const dx = b[0]! - a[0]!;
  const dy = b[1]! - a[1]!;
  return {
    length: Math.hypot(dx, dy),
    interpolate: fraction => [a[0]! + fraction * dx, a[1]! + fraction * dy]
  };
}
