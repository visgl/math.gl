// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original adapter over math.gl subdivision and spheroid kernels. Motivation only: https://github.com/keplergl/kepler.gl/pull/3548 (closed, unmerged). No implementation copied.

import {spheroidToCartesian} from '@math.gl/core/spheroid';
import {
  subdivideTriangleMesh,
  type TriangleMesh,
  type SubdivideTriangleMeshOptions,
  type SubdividedTriangleMesh
} from './subdivide-triangle-mesh';

/** Preserve the refinement discriminant when removing the globe adapter's fixed transform. */
type GlobeSubdivisionOptions<Options> = Options extends unknown
  ? Omit<Options, 'transform' | 'targetSize'>
  : never;

/** Globe axes and either sampled-error or source-edge refinement options. */
export type SubdivideGlobeMeshOptions = GlobeSubdivisionOptions<SubdivideTriangleMeshOptions> & {
  /** Equatorial radius; default 6371000. */
  semiMajorAxis?: number;
  /** Polar radius; default semiMajorAxis. Positive and at most semiMajorAxis. */
  semiMinorAxis?: number;
};

/** Refine an already triangulated longitude/latitude(/height) mesh onto a globe.
 * Source angles are degrees, height and tolerance are in axis units. Output is
 * ECEF Cartesian (X longitude 0, Y longitude 90, Z north), not deck common space.
 * Unwrap longitudes/split seams first: each triangle must span at most 180 degrees.
 * Refinement preserves existing holes, winding, seam vertices and attribute
 * provenance; it does not triangulate or clip polygons. Error is sampled, not certified.
 */
export function subdivideGlobeMesh(
  mesh: TriangleMesh,
  options: SubdivideGlobeMeshOptions
): SubdividedTriangleMesh {
  const {semiMajorAxis = 6371000, semiMinorAxis = semiMajorAxis, size = 2, ...limits} = options;
  if (size !== 2 && size !== 3) throw new RangeError('Source size must be 2 or 3');
  if (
    !Number.isFinite(semiMajorAxis) ||
    !Number.isFinite(semiMinorAxis) ||
    semiMajorAxis <= 0 ||
    semiMinorAxis <= 0 ||
    semiMinorAxis > semiMajorAxis
  )
    throw new RangeError('Expected positive sphere/oblate axes');
  // Validate latitude and reject unsplit long edges rather than silently crossing the globe.
  for (let i = 1; i < mesh.positions.length; i += size)
    if (Math.abs(mesh.positions[i]) > 90) throw new RangeError('Latitude outside [-90, 90]');
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const longitudes = [0, 1, 2].map(j => mesh.positions[mesh.indices[i + j] * size]);
    if (Math.max(...longitudes) - Math.min(...longitudes) > 180)
      throw new RangeError('Unwrap longitude seams before globe subdivision');
  }
  const geometry = {
    semiMajorAxis,
    semiMinorAxis,
    eccentricitySquared: 1 - (semiMinorAxis / semiMajorAxis) ** 2
  };
  return subdivideTriangleMesh(mesh, {
    ...limits,
    size,
    targetSize: 3,
    transform(position) {
      const point = {
        x: (position[0] * Math.PI) / 180,
        y: (position[1] * Math.PI) / 180,
        z: size === 3 ? position[2] : 0
      };
      if (!spheroidToCartesian(point, geometry)) return null;
      return [point.x, point.y, point.z];
    }
  });
}
