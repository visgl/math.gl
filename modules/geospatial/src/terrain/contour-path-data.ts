// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {TerrainContours} from './contours';

export type TerrainContourPaths = Pick<
  TerrainContours,
  'positions' | 'gridCoordinates' | 'levels' | 'origin' | 'heightReference'
> & {
  /** Packed vertex IDs, with offsets delimiting each path. Closed paths repeat their first ID. */
  indices: Uint32Array;
  offsets: Uint32Array;
  levelIndices: Uint32Array;
  closed: Uint8Array;
};
export type TerrainContourPathLimits = {
  maxVertices?: number;
  maxSegments?: number;
  maxPaths?: number;
  maxIndices?: number;
  maxLevels?: number;
};

export function contourPathLimits(
  options: TerrainContourPathLimits
): Required<TerrainContourPathLimits> {
  const limits = {
    maxVertices: options.maxVertices ?? 2_000_000,
    maxSegments: options.maxSegments ?? 1_000_000,
    maxPaths: options.maxPaths ?? 1_000_000,
    maxIndices: options.maxIndices ?? 2_000_000,
    maxLevels: options.maxLevels ?? 256
  };
  for (const value of Object.values(limits))
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xfffffffe)
      throw new Error('Invalid terrain contour path capacity');
  return limits;
}

export function validateContourData(
  data: Pick<
    TerrainContours,
    'positions' | 'gridCoordinates' | 'levels' | 'origin' | 'heightReference'
  >,
  limits: Required<TerrainContourPathLimits>
): number {
  if (
    !(data.positions instanceof Float64Array) ||
    data.positions.length % 3 ||
    data.positions.length / 3 > limits.maxVertices ||
    !data.positions.every(Number.isFinite)
  )
    throw new Error('Invalid terrain contour positions or capacity');
  const count = data.positions.length / 3;
  if (
    !(data.gridCoordinates instanceof Float64Array) ||
    data.gridCoordinates.length !== count * 2 ||
    !data.gridCoordinates.every(Number.isFinite)
  )
    throw new Error('Invalid terrain contour grid coordinates');
  if (!(data.levels instanceof Float64Array) || data.levels.length > limits.maxLevels)
    throw new Error('Invalid terrain contour levels or capacity');
  for (let i = 0; i < data.levels.length; i++)
    if (!Number.isFinite(data.levels[i]) || (i > 0 && data.levels[i] <= data.levels[i - 1]))
      throw new Error('Invalid terrain contour levels');
  if (
    data.origin.length !== 3 ||
    !Number.isFinite(data.origin[0]) ||
    !Number.isFinite(data.origin[1]) ||
    !Number.isFinite(data.origin[2]) ||
    typeof data.heightReference !== 'string'
  )
    throw new Error('Invalid terrain contour frame');
  return count;
}

export function validateContourVertex(
  data: Pick<TerrainContours, 'positions' | 'levels' | 'origin'>,
  vertex: number,
  level: number,
  assignments: Uint32Array
): void {
  if (vertex >= assignments.length || level >= data.levels.length)
    throw new Error('Terrain contour index out of range');
  if (assignments[vertex] !== 0xffffffff && assignments[vertex] !== level)
    throw new Error('Terrain contour vertex belongs to multiple levels');
  if (data.positions[vertex * 3 + 2] !== data.levels[level] - data.origin[2])
    throw new Error('Terrain contour vertex height does not match its level');
  assignments[vertex] = level;
}

export function copyContourData(
  data: Pick<
    TerrainContours,
    'positions' | 'gridCoordinates' | 'levels' | 'origin' | 'heightReference'
  >
) {
  return {
    positions: data.positions.slice(),
    gridCoordinates: data.gridCoordinates.slice(),
    levels: data.levels.slice(),
    origin: Object.freeze([...data.origin] as [number, number, number]),
    heightReference: data.heightReference
  };
}
