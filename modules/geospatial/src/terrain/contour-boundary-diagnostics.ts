// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainContours} from './contours';
import {
  contourPathLimits,
  validateContourData,
  validateContourVertex,
  type TerrainContourPathLimits
} from './contour-path-data';

export const TerrainContourBoundaryAxis = {COLUMN: 1, ROW: 2} as const;
export type TerrainContourBoundaryDiagnostics = {
  /** Boundary vertices with degree one (open) or greater than two (junction). */
  vertexIndices: Uint32Array;
  degrees: Uint32Array;
  levelIndices: Uint32Array;
  /** Bitmask of TerrainContourBoundaryAxis values; corners have both bits. */
  boundaryAxes: Uint8Array;
};

/** Inspect a welded contour graph at same-level tile lattice lines. An open
 * endpoint can indicate a dataset edge, missing tile, nodata or another break;
 * this function does not infer the cause or alter the graph.
 */
export function diagnoseTerrainContourBoundaries(
  contours: TerrainContours,
  options: TerrainContourPathLimits & {width: number; height: number}
): TerrainContourBoundaryDiagnostics {
  const {width, height} = options;
  if (!Number.isSafeInteger(width) || width < 2 || !Number.isSafeInteger(height) || height < 2)
    throw new Error('Invalid terrain contour boundary tile dimensions');
  const limits = contourPathLimits(options);
  const count = validateContourData(contours, limits);
  if (
    !(contours.segments instanceof Uint32Array) ||
    contours.segments.length % 2 ||
    !(contours.levelIndices instanceof Uint32Array) ||
    contours.levelIndices.length !== contours.segments.length / 2 ||
    contours.levelIndices.length > limits.maxSegments
  )
    throw new Error('Invalid terrain contour boundary segments or capacity');
  const degrees = new Uint32Array(count),
    assignments = new Uint32Array(count).fill(0xffffffff);
  const seen = new Set<string>();
  for (let i = 0; i < contours.levelIndices.length; i++) {
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
    if (seen.has(key)) throw new Error('Duplicate terrain contour segment');
    seen.add(key);
    degrees[a]++;
    degrees[b]++;
  }
  const vertices: number[] = [],
    resultDegrees: number[] = [],
    levels: number[] = [],
    axes: number[] = [];
  for (let i = 0; i < count; i++) {
    if (degrees[i] !== 1 && degrees[i] <= 2) continue;
    const x = contours.gridCoordinates[2 * i],
      y = contours.gridCoordinates[2 * i + 1];
    if (Math.abs(x) > Number.MAX_SAFE_INTEGER || Math.abs(y) > Number.MAX_SAFE_INTEGER)
      throw new Error('Terrain contour boundary lattice exceeds safe integer range');
    const axis =
      (Number.isSafeInteger(x) && x % (width - 1) === 0 ? TerrainContourBoundaryAxis.COLUMN : 0) |
      (Number.isSafeInteger(y) && y % (height - 1) === 0 ? TerrainContourBoundaryAxis.ROW : 0);
    if (!axis) continue;
    vertices.push(i);
    resultDegrees.push(degrees[i]);
    levels.push(assignments[i]);
    axes.push(axis);
  }
  return {
    vertexIndices: Uint32Array.from(vertices),
    degrees: Uint32Array.from(resultDegrees),
    levelIndices: Uint32Array.from(levels),
    boundaryAxes: Uint8Array.from(axes)
  };
}
