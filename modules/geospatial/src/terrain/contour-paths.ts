// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainContours} from './contours';
import {
  contourPathLimits,
  validateContourData,
  validateContourVertex,
  copyContourData,
  type TerrainContourPaths,
  type TerrainContourPathLimits
} from './contour-path-data';
export type {TerrainContourPaths, TerrainContourPathLimits} from './contour-path-data';

/** Trace maximal degree-two chains. Branch vertices terminate paths; pure cycles close explicitly.
 * Connectivity is by vertex ID, never coordinate welding. Every input edge is emitted exactly once.
 */
export function stitchTerrainContours(
  contours: TerrainContours,
  options: TerrainContourPathLimits = {}
): TerrainContourPaths {
  const limits = contourPathLimits(options),
    count = validateContourData(contours, limits);
  if (
    !(contours.segments instanceof Uint32Array) ||
    contours.segments.length % 2 ||
    contours.segments.length > 0xfffffffe ||
    contours.segments.length / 2 > limits.maxSegments ||
    !(contours.levelIndices instanceof Uint32Array) ||
    contours.levelIndices.length !== contours.segments.length / 2
  )
    throw new Error('Invalid terrain contour segments or capacity');
  const edgeCount = contours.segments.length / 2,
    degrees = new Uint32Array(count),
    assignments = new Uint32Array(count).fill(0xffffffff),
    unique = new Set<string>();
  for (let i = 0; i < edgeCount; i++) {
    const a = contours.segments[2 * i],
      b = contours.segments[2 * i + 1],
      level = contours.levelIndices[i];
    validateContourVertex(contours, a, level, assignments);
    validateContourVertex(contours, b, level, assignments);
    if (
      a === b ||
      (contours.positions[3 * a] === contours.positions[3 * b] &&
        contours.positions[3 * a + 1] === contours.positions[3 * b + 1])
    )
      throw new Error('Degenerate terrain contour segment');
    const key = a < b ? `${a}/${b}` : `${b}/${a}`;
    if (unique.has(key)) throw new Error('Duplicate terrain contour segment');
    unique.add(key);
    degrees[a]++;
    degrees[b]++;
  }
  const starts = new Uint32Array(count + 1);
  for (let i = 0; i < count; i++) starts[i + 1] = starts[i] + degrees[i];
  const cursor = starts.slice(),
    adjacency = new Uint32Array(edgeCount * 2);
  for (let i = 0; i < edgeCount; i++)
    for (let j = 0; j < 2; j++) adjacency[cursor[contours.segments[2 * i + j]]++] = i;
  const visited = new Uint8Array(edgeCount),
    indices: number[] = [],
    offsets = [0],
    levels: number[] = [],
    closed: number[] = [];
  const append = (vertex: number): void => {
    if (indices.length >= limits.maxIndices)
      throw new Error('Terrain contour path index capacity exceeded');
    indices.push(vertex);
  };
  const trace = (start: number, firstEdge: number): void => {
    if (levels.length >= limits.maxPaths) throw new Error('Terrain contour path capacity exceeded');
    levels.push(assignments[start]);
    append(start);
    let vertex = start,
      edge = firstEdge;
    while (!visited[edge]) {
      visited[edge] = 1;
      const a = contours.segments[2 * edge],
        b = contours.segments[2 * edge + 1];
      vertex = vertex === a ? b : a;
      append(vertex);
      if (vertex === start || degrees[vertex] !== 2) break;
      const e0 = adjacency[starts[vertex]],
        e1 = adjacency[starts[vertex] + 1];
      edge = visited[e0] ? e1 : e0;
    }
    closed.push(vertex === start ? 1 : 0);
    offsets.push(indices.length);
  };
  for (let vertex = 0; vertex < count; vertex++)
    if (degrees[vertex] !== 2)
      for (let j = starts[vertex]; j < starts[vertex + 1]; j++)
        if (!visited[adjacency[j]]) trace(vertex, adjacency[j]);
  // Remaining components consist entirely of degree-two cycles.
  for (let vertex = 0; vertex < count; vertex++)
    for (let j = starts[vertex]; j < starts[vertex + 1]; j++)
      if (!visited[adjacency[j]]) trace(vertex, adjacency[j]);
  return {
    ...copyContourData(contours),
    indices: Uint32Array.from(indices),
    offsets: Uint32Array.from(offsets),
    levelIndices: Uint32Array.from(levels),
    closed: Uint8Array.from(closed)
  };
}
