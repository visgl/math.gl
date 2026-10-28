// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TriangleMesh} from './subdivide-triangle-mesh';

/** A convex target-plane component, without a repeated closing point. Either winding is accepted. */
export type MeshClipRegion = readonly (readonly [number, number])[];
/** Clipping of a prepared, finite target-space mesh. Regions must have disjoint interiors. */
export type ClipTriangleMeshOptions = {
  regions: readonly MeshClipRegion[];
  /** Position components; clipping uses the first two and interpolates the third. Default 2. */
  size?: 2 | 3;
  /** Shift already-unwrapped triangles into a canonical periodic interval before clipping.
   * Does not infer which side of a seam source edges follow. Split/unwrap before calling.
   */
  periodic?: {axis: 0 | 1; minimum: number; period: number};
  /** Maximum emitted vertices, including duplicated region/seam vertices. Default 65536. */
  maxVertices?: number;
  /** Maximum emitted triangles. Default 131072. */
  maxTriangles?: number;
  /** Maximum triangle/copy/region intersection attempts. Default 1000000. */
  maxIntersections?: number;
};
/** Clipped mesh with original-vertex provenance for interpolatePackedAttributes. */
export type ClippedTriangleMesh = {
  positions: Float64Array;
  indices: Uint32Array;
  sourceVertexIndices: Uint32Array;
  sourceVertexWeights: Float64Array;
  sourceTriangleIndices: Uint32Array;
  /** Integer target-axis period shift for each output triangle; zero without periodic clipping. */
  periodicCopies: Int32Array;
};
type Vertex = {position: number[]; weights: number[]};

/** Intersect indexed triangles with a union of convex target-plane regions.
 * Concave domains and holes must first be decomposed into disjoint convex regions (e.g. earcut
 * triangles). This is planar clipping, not spherical topology repair or projection unwrapping.
 * Winding and original-triangle attribution survive clipping; coincident vertices are never
 * welded. Work/output limit exhaustion throws rather than returning silently incomplete geometry.
 */
export function clipTriangleMesh(
  mesh: TriangleMesh,
  options: ClipTriangleMeshOptions
): ClippedTriangleMesh {
  const {
    size = 2,
    maxVertices = 65536,
    maxTriangles = 131072,
    maxIntersections = 1000000
  } = options;
  if (
    (size !== 2 && size !== 3) ||
    ![maxVertices, maxTriangles, maxIntersections].every(v => Number.isSafeInteger(v) && v >= 0) ||
    maxVertices > 0xffffffff ||
    maxTriangles > 0xffffffff ||
    mesh.positions.length % size ||
    mesh.indices.length % 3
  ) {
    throw new RangeError('Invalid mesh clipping dimensions or limits');
  }
  if (
    !Number.isSafeInteger(mesh.positions.length) ||
    mesh.positions.length < 0 ||
    !Number.isSafeInteger(mesh.indices.length) ||
    mesh.indices.length < 0 ||
    !Array.isArray(options.regions)
  )
    throw new RangeError('Invalid mesh storage');
  const source = Array.from(mesh.positions);
  if (!source.every(Number.isFinite))
    throw new RangeError('Clipping requires finite target positions');
  const inputIndices = Array.from(mesh.indices);
  if (!inputIndices.every(i => Number.isSafeInteger(i) && i >= 0 && i < source.length / size))
    throw new RangeError('Invalid mesh index');
  const regions = Array.from(options.regions, validateRegion);
  const period = options.periodic;
  if (period === null) throw new RangeError('Invalid clipping period');
  if (
    period &&
    ((period.axis !== 0 && period.axis !== 1) ||
      !Number.isFinite(period.minimum) ||
      !Number.isFinite(period.period) ||
      period.period <= 0 ||
      !Number.isFinite(period.minimum + period.period) ||
      period.minimum + period.period <= period.minimum)
  ) {
    throw new RangeError('Invalid clipping period');
  }
  if (
    period &&
    regions.some(r =>
      r.some(
        p => p[period.axis] < period.minimum || p[period.axis] > period.minimum + period.period
      )
    )
  ) {
    throw new RangeError('Clip regions must lie in the canonical period');
  }
  const positions: number[] = [],
    indices: number[] = [],
    sourceVertexIndices: number[] = [],
    sourceVertexWeights: number[] = [];
  const sourceTriangleIndices: number[] = [],
    periodicCopies: number[] = [];
  let intersections = 0;
  for (let triangle = 0; triangle < inputIndices.length / 3; triangle++) {
    const originalIndices = inputIndices.slice(triangle * 3, triangle * 3 + 3);
    const vertices = originalIndices.map((index, j) => ({
      position: source.slice(index * size, index * size + size),
      weights: [0, 1, 2].map(k => Number(k === j))
    }));
    let firstCopy = 0,
      lastCopy = 0;
    if (period) {
      const values = vertices.map(v => v.position[period.axis]);
      firstCopy = Math.ceil((period.minimum - Math.max(...values)) / period.period);
      lastCopy = Math.floor((period.minimum + period.period - Math.min(...values)) / period.period);
      if (
        !Number.isSafeInteger(firstCopy) ||
        !Number.isSafeInteger(lastCopy) ||
        firstCopy < -2147483648 ||
        lastCopy > 2147483647
      )
        throw new RangeError('Unrepresentable periodic copy');
    }
    if (regions.length === 0) continue;
    if ((lastCopy - firstCopy + 1) * regions.length > maxIntersections - intersections)
      throw new RangeError('Mesh clipping exceeded maxIntersections');
    for (let copy = firstCopy; copy <= lastCopy; copy++) {
      const shifted = vertices.map(v => ({
        weights: v.weights,
        position: v.position.map(
          (x, axis) => x + (period && axis === period.axis ? copy * period.period : 0)
        )
      }));
      if (shifted.some(v => !v.position.every(Number.isFinite)))
        throw new RangeError('Nonfinite periodic position');
      for (const region of regions) {
        intersections++;
        let polygon = shifted;
        for (let edge = 0; edge < region.length && polygon.length; edge++) {
          const a = region[edge],
            b = region[(edge + 1) % region.length];
          const clipped: Vertex[] = [];
          for (let i = 0; i < polygon.length; i++) {
            const p = polygon[i],
              q = polygon[(i + 1) % polygon.length];
            const dp = cross(a, b, p.position),
              dq = cross(a, b, q.position);
            if (dp >= 0) clipped.push(p);
            if (dp < 0 !== dq < 0) {
              // Scale distances to avoid overflow in the denominator.
              const scale = Math.max(Math.abs(dp), Math.abs(dq));
              const t = dp / scale / (dp / scale - dq / scale);
              clipped.push({
                position: p.position.map((x, j) => x * (1 - t) + q.position[j] * t),
                weights: p.weights.map((x, j) => x * (1 - t) + q.weights[j] * t)
              });
            }
          }
          polygon = clipped;
        }
        for (let j = 1; j + 1 < polygon.length; j++) {
          const face = [polygon[0], polygon[j], polygon[j + 1]];
          if (cross(face[0].position, face[1].position, face[2].position) === 0) continue;
          if (positions.length / size + 3 > maxVertices || indices.length / 3 + 1 > maxTriangles)
            throw new RangeError('Mesh clipping exceeded output limits');
          for (const vertex of face) {
            indices.push(positions.length / size);
            positions.push(...vertex.position);
            sourceVertexIndices.push(...originalIndices);
            sourceVertexWeights.push(...vertex.weights);
          }
          sourceTriangleIndices.push(triangle);
          periodicCopies.push(copy);
        }
      }
    }
  }
  return {
    positions: new Float64Array(positions),
    indices: new Uint32Array(indices),
    sourceVertexIndices: new Uint32Array(sourceVertexIndices),
    sourceVertexWeights: new Float64Array(sourceVertexWeights),
    sourceTriangleIndices: new Uint32Array(sourceTriangleIndices),
    periodicCopies: new Int32Array(periodicCopies)
  };
}

function cross(a: ArrayLike<number>, b: ArrayLike<number>, p: ArrayLike<number>): number {
  const result = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  if (!Number.isFinite(result)) throw new RangeError('Unrepresentable clipping arithmetic');
  return result;
}
function validateRegion(region: MeshClipRegion): MeshClipRegion {
  if (
    !Array.isArray(region) ||
    region.length < 3 ||
    region.length > 1024 ||
    Array.from(region).some(
      p => !Array.isArray(p) || p.length !== 2 || !Array.from(p).every(Number.isFinite)
    )
  )
    throw new RangeError('Invalid convex clipping region');
  let area = 0;
  for (let i = 1; i + 1 < region.length; i++) area += cross(region[0], region[i], region[i + 1]);
  if (!Number.isFinite(area) || area === 0) throw new RangeError('Degenerate clipping region');
  const result = area > 0 ? Array.from(region) : Array.from(region).reverse();
  for (let i = 0; i < result.length; i++) {
    const a = result[i],
      b = result[(i + 1) % result.length];
    if ((a[0] === b[0] && a[1] === b[1]) || result.some(p => cross(a, b, p) < 0))
      throw new RangeError('Clip region must be convex');
  }
  return result;
}
