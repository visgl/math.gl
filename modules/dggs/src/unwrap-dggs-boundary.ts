// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Copy a cell boundary, unwrapping longitudes across the antimeridian.
 * @param boundary Open or closed longitude/latitude pairs in degrees.
 * @param referenceLongitude Optional longitude near which to place the first vertex.
 * @returns Fresh pairs with each longitude nearest the preceding longitude. Exact
 * 180-degree ties retain their direction. Latitudes and vertex order are preserved.
 * @remarks Explicit boundaries spanning at least 360 degrees and closed rings with
 * net longitude winding are copied unchanged. Polar cells need additional topology
 * handling. This helper neither splits polygons nor calculates geodesic edges.
 */
export function unwrapDGGSBoundary(
  boundary: ReadonlyArray<readonly [number, number]>,
  referenceLongitude?: number
): [number, number][] {
  const result: [number, number][] = boundary.map(([longitude, latitude]) => [longitude, latitude]);
  if (result.length === 0) {
    return result;
  }

  let west = Infinity;
  let east = -Infinity;
  for (const [longitude] of boundary) {
    west = Math.min(west, longitude);
    east = Math.max(east, longitude);
  }
  if (east - west >= 360) {
    return result;
  }

  let previous = referenceLongitude ?? result[0][0];
  for (const point of result) {
    const delta = point[0] - previous;
    if (delta > 180) {
      point[0] -= 360 * Math.ceil((delta - 180) / 360);
    } else if (delta < -180) {
      point[0] += 360 * Math.ceil((-delta - 180) / 360);
    }
    previous = point[0];
  }

  const first = boundary[0];
  const last = boundary[boundary.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    if (Math.abs(result[result.length - 1][0] - result[0][0]) > 180) {
      return boundary.map(([longitude, latitude]) => [longitude, latitude]);
    }
    result[result.length - 1] = [...result[0]];
  }
  return result;
}
