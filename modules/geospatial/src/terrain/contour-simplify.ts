// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  contourPathLimits,
  validateContourData,
  validateContourVertex,
  type TerrainContourPaths,
  type TerrainContourPathLimits
} from './contour-path-data';
export type {TerrainContourPaths} from './contour-path-data';
export type TerrainSimplifiedContourPaths = TerrainContourPaths & {
  /** Output vertex ID -> input vertex ID. Output buffers are compacted. */
  sourceVertexIndices: Uint32Array;
  maxDeviation: number;
  requestedMaxError: number;
  distanceTests: number;
};

/** Bounded iterative Ramer-Douglas-Peucker simplification in local metric XY.
 * Preserves path endpoints, shared vertices and three anchors per cycle. Does not preserve
 * polygon topology, nesting, nonintersection, or agreement with the terrain between vertices.
 */
export function simplifyTerrainContourPaths(
  paths: TerrainContourPaths,
  options: TerrainContourPathLimits & {maxError: number; maxDistanceTests?: number}
): TerrainSimplifiedContourPaths {
  const limits = contourPathLimits(options),
    count = validateContourData(paths, limits);
  const budget = options.maxDistanceTests ?? 10_000_000;
  if (
    !Number.isFinite(options.maxError) ||
    options.maxError < 0 ||
    !Number.isSafeInteger(budget) ||
    budget < 0
  )
    throw new Error('Invalid contour simplification error or work limit');
  if (
    !(paths.indices instanceof Uint32Array) ||
    paths.indices.length > limits.maxIndices ||
    !(paths.offsets instanceof Uint32Array) ||
    paths.offsets.length < 1 ||
    paths.offsets.length - 1 > limits.maxPaths ||
    paths.offsets[0] !== 0 ||
    paths.offsets[paths.offsets.length - 1] !== paths.indices.length
  )
    throw new Error('Invalid terrain contour path indices or offsets');
  const pathCount = paths.offsets.length - 1;
  if (
    paths.indices.length - pathCount > limits.maxSegments ||
    !(paths.levelIndices instanceof Uint32Array) ||
    paths.levelIndices.length !== pathCount ||
    !(paths.closed instanceof Uint8Array) ||
    paths.closed.length !== pathCount
  )
    throw new Error('Invalid terrain contour path metadata or segment capacity');
  const uses = new Uint32Array(count),
    assignments = new Uint32Array(count).fill(0xffffffff);
  for (let p = 0; p < pathCount; p++) {
    const start = paths.offsets[p],
      end = paths.offsets[p + 1],
      closed = paths.closed[p];
    if (
      end > paths.indices.length ||
      end < start ||
      closed > 1 ||
      end - start < (closed ? 4 : 2) ||
      Boolean(closed) !== (paths.indices[start] === paths.indices[end - 1])
    )
      throw new Error('Invalid terrain contour path closure');
    const seen = new Set<number>();
    for (let i = start; i < end; i++) {
      const vertex = paths.indices[i];
      validateContourVertex(paths, vertex, paths.levelIndices[p], assignments);
      if (i > start) {
        const previous = paths.indices[i - 1];
        if (
          paths.positions[3 * previous] === paths.positions[3 * vertex] &&
          paths.positions[3 * previous + 1] === paths.positions[3 * vertex + 1]
        )
          throw new Error('Degenerate terrain contour path edge');
      }
      if (closed && i === end - 1) continue;
      if (seen.has(vertex)) throw new Error('Repeated interior terrain contour path vertex');
      seen.add(vertex);
      uses[vertex]++;
    }
  }
  const keep = new Uint8Array(paths.indices.length);
  let distanceTests = 0,
    maxDeviation = 0;
  for (let p = 0; p < pathCount; p++) {
    const start = paths.offsets[p],
      end = paths.offsets[p + 1] - 1;
    keep[start] = keep[end] = 1;
    if (paths.closed[p]) {
      keep[start + Math.floor((end - start) / 3)] = 1;
      keep[start + Math.floor((2 * (end - start)) / 3)] = 1;
    }
    for (let i = start; i <= end; i++) if (uses[paths.indices[i]] > 1) keep[i] = 1;
    const stack: number[] = [];
    let previous = start;
    for (let i = start + 1; i <= end; i++)
      if (keep[i]) {
        stack.push(previous, i);
        previous = i;
      }
    while (stack.length) {
      const b = stack.pop()!,
        a = stack.pop()!;
      let farthest = -1,
        maximum = 0;
      for (let i = a + 1; i < b; i++) {
        if (distanceTests++ === budget)
          throw new Error('Terrain contour simplification work budget exceeded');
        const distance = pointSegmentDistance(
          paths.positions,
          paths.indices[i],
          paths.indices[a],
          paths.indices[b]
        );
        if (distance > maximum) {
          maximum = distance;
          farthest = i;
        }
      }
      const va = paths.indices[a],
        vb = paths.indices[b];
      const collapsed =
        paths.positions[3 * va] === paths.positions[3 * vb] &&
        paths.positions[3 * va + 1] === paths.positions[3 * vb + 1];
      if (maximum > options.maxError || (collapsed && farthest >= 0)) {
        keep[farthest] = 1;
        stack.push(a, farthest, farthest, b);
      } else maxDeviation = Math.max(maxDeviation, maximum);
    }
  }
  const selected = new Uint8Array(count);
  for (let i = 0; i < keep.length; i++) if (keep[i]) selected[paths.indices[i]] = 1;
  const vertices: number[] = [];
  for (let i = 0; i < count; i++) if (selected[i]) vertices.push(i);
  const mapping = new Uint32Array(count),
    positions = new Float64Array(vertices.length * 3),
    gridCoordinates = new Float64Array(vertices.length * 2);
  for (let i = 0; i < vertices.length; i++) {
    const source = vertices[i];
    mapping[source] = i;
    positions.set(paths.positions.subarray(3 * source, 3 * source + 3), 3 * i);
    gridCoordinates.set(paths.gridCoordinates.subarray(2 * source, 2 * source + 2), 2 * i);
  }
  const indices: number[] = [],
    offsets = [0];
  for (let p = 0; p < pathCount; p++) {
    for (let i = paths.offsets[p]; i < paths.offsets[p + 1]; i++)
      if (keep[i]) indices.push(mapping[paths.indices[i]]);
    offsets.push(indices.length);
  }
  return {
    positions,
    gridCoordinates,
    indices: Uint32Array.from(indices),
    offsets: Uint32Array.from(offsets),
    levelIndices: paths.levelIndices.slice(),
    closed: paths.closed.slice(),
    levels: paths.levels.slice(),
    origin: Object.freeze([...paths.origin] as [number, number, number]),
    heightReference: paths.heightReference,
    sourceVertexIndices: Uint32Array.from(vertices),
    requestedMaxError: options.maxError,
    maxDeviation,
    distanceTests
  };
}

function pointSegmentDistance(positions: Float64Array, p: number, a: number, b: number): number {
  const dx = positions[3 * b] - positions[3 * a],
    dy = positions[3 * b + 1] - positions[3 * a + 1];
  const px = positions[3 * p] - positions[3 * a],
    py = positions[3 * p + 1] - positions[3 * a + 1];
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || !Number.isFinite(px) || !Number.isFinite(py))
    throw new Error('Terrain contour distance arithmetic overflow');
  const projection = length ? px * (dx / length) + py * (dy / length) : 0;
  const t = length ? Math.max(0, Math.min(1, projection / length)) : 0;
  const distance = Math.hypot(px - dx * t, py - dy * t);
  if (!Number.isFinite(distance)) throw new Error('Terrain contour distance arithmetic overflow');
  return distance;
}
