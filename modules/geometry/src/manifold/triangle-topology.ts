// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Indexed triangles referencing a shared position array. */
export type IndexedTriangleTopology = {
  /** Three vertex indices for every triangle. */
  indices: ArrayLike<number>;
  /** Optional number of positions, used to reject out-of-range indices. */
  vertexCount?: number;
};

/** Topological edge diagnostics and opposite half-edge indices. */
export type TriangleTopologyAnalysis = {
  /** Opposite half-edge index, or -1 when no unambiguous opposite exists. */
  oppositeHalfEdges: Int32Array;
  /** Number of undirected edges referenced once. */
  boundaryEdgeCount: number;
  /** Number of undirected edges referenced more than twice. */
  nonManifoldEdgeCount: number;
  /** Number of edges whose two incident half-edges have identical directions. */
  inconsistentEdgeCount: number;
  /** Number of triangles with repeated vertex indices. */
  degenerateTriangleCount: number;
  /** Whether each directed triangle edge has exactly one oppositely directed partner. */
  closedOrientedManifold: boolean;
};

type HalfEdge = {index: number; start: number; end: number};

/**
 * Analyzes an indexed triangle mesh using index identity rather than position equality.
 * A half-edge index is the index-stream offset of its starting vertex; its end is the next
 * vertex in the same triangle. Disconnected closed shells are permitted. This verifies the
 * oriented edge condition, not self-intersections or vertex-link manifoldness.
 */
export function analyzeTriangleTopology(
  topology: IndexedTriangleTopology
): TriangleTopologyAnalysis {
  const {indices, vertexCount} = topology;
  if (
    indices.length % 3 !== 0 ||
    (vertexCount !== undefined && (!Number.isInteger(vertexCount) || vertexCount < 0))
  ) {
    throw new Error('Invalid indexed triangle topology');
  }
  const oppositeHalfEdges = new Int32Array(indices.length).fill(-1);
  const edges = new Map<string, HalfEdge[]>();
  let degenerateTriangleCount = 0;
  for (let offset = 0; offset < indices.length; offset += 3) {
    const triangle = [indices[offset], indices[offset + 1], indices[offset + 2]];
    if (
      triangle.some(
        index =>
          !Number.isInteger(index) ||
          index < 0 ||
          (vertexCount !== undefined && index >= vertexCount)
      )
    ) {
      throw new Error('Invalid triangle vertex index');
    }
    if (new Set(triangle).size !== 3) degenerateTriangleCount++;
    for (let corner = 0; corner < 3; corner++) {
      const start = triangle[corner];
      const end = triangle[(corner + 1) % 3];
      const key = `${Math.min(start, end)}:${Math.max(start, end)}`;
      const edge = {index: offset + corner, start, end};
      const incident = edges.get(key);
      if (incident) incident.push(edge);
      else edges.set(key, [edge]);
    }
  }
  let boundaryEdgeCount = 0;
  let nonManifoldEdgeCount = 0;
  let inconsistentEdgeCount = 0;
  for (const incident of edges.values()) {
    if (incident.length === 1) boundaryEdgeCount++;
    else if (incident.length > 2) nonManifoldEdgeCount++;
    else if (
      incident[0].start !== incident[1].end ||
      incident[0].end !== incident[1].start ||
      incident[0].start === incident[0].end
    )
      inconsistentEdgeCount++;
    else {
      oppositeHalfEdges[incident[0].index] = incident[1].index;
      oppositeHalfEdges[incident[1].index] = incident[0].index;
    }
  }
  return {
    oppositeHalfEdges,
    boundaryEdgeCount,
    nonManifoldEdgeCount,
    inconsistentEdgeCount,
    degenerateTriangleCount,
    closedOrientedManifold:
      indices.length > 0 &&
      boundaryEdgeCount === 0 &&
      nonManifoldEdgeCount === 0 &&
      inconsistentEdgeCount === 0 &&
      degenerateTriangleCount === 0
  };
}

/**
 * Copies an index stream and applies sparse replacements at index-stream offsets.
 * Replacement offsets must be strictly increasing and within the source stream.
 * This operation does not weld positions or infer topology from coincident vertices.
 */
export function applyTriangleIndexReplacements(
  indices: ArrayLike<number>,
  replacementOffsets: ArrayLike<number>,
  replacementValues: ArrayLike<number>
): Uint32Array {
  if (indices.length % 3 !== 0 || replacementOffsets.length !== replacementValues.length) {
    throw new Error('Invalid triangle index replacements');
  }
  const result = new Uint32Array(indices.length);
  for (let index = 0; index < indices.length; index++) {
    const value = indices[index];
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
      throw new Error('Invalid triangle index');
    result[index] = value;
  }
  let previousOffset = -1;
  for (let index = 0; index < replacementOffsets.length; index++) {
    const offset = replacementOffsets[index];
    const value = replacementValues[index];
    if (
      !Number.isInteger(offset) ||
      offset <= previousOffset ||
      offset >= result.length ||
      !Number.isInteger(value) ||
      value < 0 ||
      value > 0xffffffff
    ) {
      throw new Error('Invalid triangle index replacement');
    }
    result[offset] = value;
    previousOffset = offset;
  }
  return result;
}
