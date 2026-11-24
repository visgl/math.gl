// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import triangulate from 'cdt2d';

/**
 * Triangulates finite planar XY sites. Each triangle indexes the original input.
 * Coincident sites use the first input index. Collinear sites yield no triangles.
 * The diagonal chosen for cocircular sites and the order of triangles are unspecified.
 */
export function triangulateDelaunay(
  points: readonly (readonly [number, number])[]
): [number, number, number][] {
  const sites: [number, number][] = [];
  const sourceIndices: number[] = [];
  const seen = new Set<string>();
  for (const [index, [x, y]] of points.entries()) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new RangeError(`Expected finite XY coordinates at point ${index}`);
    }
    const key = `${x},${y}`;
    if (!seen.has(key)) {
      seen.add(key);
      sites.push([x, y]);
      sourceIndices.push(index);
    }
  }
  if (sites.length < 3) return [];
  return triangulate(sites, []).map(([a, b, c]) => [
    sourceIndices[a]!,
    sourceIndices[b]!,
    sourceIndices[c]!
  ]);
}
