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

export type TerrainContourTile = {column: number; row: number; contours: TerrainContours};
export type TerrainContourTileWeldOptions = TerrainContourPathLimits & {
  /** Number of vertices in each vertex-registered tile. */
  width: number;
  height: number;
  /** Maximum world-frame XY disagreement for a matching lattice point. Default zero. */
  maxPositionDifference?: number;
  maxTiles?: number;
};

/** Weld coincident contour vertices on same-level vertex-tile boundaries.
 * Tiles share an integer lattice and identical contour levels and height reference.
 * Boundary identity uses exact global grid coordinates, not a spatial tolerance.
 * Missing tiles or missing source triangles remain open; no segments are invented.
 * The output grid coordinates are global lattice coordinates, and its origin is
 * taken from the lexicographically first tile. Equivalent inputs are order independent.
 */
export function weldTerrainContourTiles(
  tiles: readonly TerrainContourTile[],
  options: TerrainContourTileWeldOptions
): TerrainContours {
  const {width, height} = options;
  const limits = contourPathLimits(options);
  const tolerance = options.maxPositionDifference ?? 0;
  const maxTiles = options.maxTiles ?? 4096;
  if (
    !Number.isSafeInteger(width) ||
    width < 2 ||
    !Number.isSafeInteger(height) ||
    height < 2 ||
    !Number.isFinite(tolerance) ||
    tolerance < 0 ||
    !Number.isSafeInteger(maxTiles) ||
    maxTiles < 1 ||
    tiles.length > maxTiles ||
    !tiles.length
  )
    throw new Error('Invalid terrain contour tile dimensions or tolerance');
  const sorted = [...tiles].sort((a, b) => a.column - b.column || a.row - b.row);
  const first = sorted[0].contours;
  const origin: [number, number, number] = [...first.origin];
  const levels = first.levels.slice();
  const positions: number[] = [],
    grid: number[] = [],
    segments: number[] = [],
    levelIndices: number[] = [];
  const vertices = new Map<string, {id: number; tile: number}>();
  const edges = new Map<string, number>();
  const addresses = new Set<string>();
  let inputVertices = 0;
  let inputSegments = 0;
  for (let tileIndex = 0; tileIndex < sorted.length; tileIndex++) {
    const tile = sorted[tileIndex],
      data = tile.contours;
    const id = `${tile.column},${tile.row}`;
    if (!Number.isSafeInteger(tile.column) || !Number.isSafeInteger(tile.row) || addresses.has(id))
      throw new Error('Invalid or duplicate terrain contour tile address');
    addresses.add(id);
    const x0 = tile.column * (width - 1),
      y0 = tile.row * (height - 1);
    if (![x0, y0, x0 + width - 1, y0 + height - 1].every(Number.isSafeInteger))
      throw new Error('Terrain contour tile lattice overflow');
    const count = validateContourData(data, limits);
    inputVertices += count;
    if (inputVertices > limits.maxVertices)
      throw new Error('Terrain contour input vertex capacity exceeded');
    if (
      data.heightReference !== first.heightReference ||
      data.levels.length !== levels.length ||
      !data.levels.every((level, i) => level === levels[i])
    )
      throw new Error('Terrain contour tile levels or height reference differ');
    if (
      !(data.segments instanceof Uint32Array) ||
      data.segments.length % 2 ||
      !(data.levelIndices instanceof Uint32Array) ||
      data.levelIndices.length !== data.segments.length / 2 ||
      data.levelIndices.length > limits.maxSegments
    )
      throw new Error('Invalid terrain contour tile segments');
    inputSegments += data.levelIndices.length;
    if (inputSegments > limits.maxSegments)
      throw new Error('Terrain contour input segment capacity exceeded');
    const assigned = new Uint32Array(count).fill(0xffffffff);
    const remap = new Uint32Array(count).fill(0xffffffff);
    const localBoundary = new Set<string>();
    const mapVertex = (source: number, level: number): number => {
      validateContourVertex(data, source, level, assigned);
      if (remap[source] !== 0xffffffff) return remap[source];
      const x = data.gridCoordinates[2 * source],
        y = data.gridCoordinates[2 * source + 1];
      if (x < 0 || x > width - 1 || y < 0 || y > height - 1)
        throw new Error('Terrain contour vertex outside tile lattice');
      const gx = x0 + x,
        gy = y0 + y;
      if (
        !Number.isFinite(gx) ||
        !Number.isFinite(gy) ||
        (x % 1 !== 0 && Number.isInteger(gx)) ||
        (y % 1 !== 0 && Number.isInteger(gy))
      )
        throw new Error('Terrain contour tile lattice loses precision');
      const px = data.positions[3 * source] + (data.origin[0] - origin[0]);
      const py = data.positions[3 * source + 1] + (data.origin[1] - origin[1]);
      if (!Number.isFinite(px) || !Number.isFinite(py))
        throw new Error('Terrain contour frame overflow');
      const boundary = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      // Keep the integer lattice coordinate and local fractional remainder separate.
      // Adding a small fraction to a large tile offset can round distinct points
      // to the same binary64 global coordinate and must not weld them together.
      const xi = Math.floor(x),
        yi = Math.floor(y);
      const vertexKey = `${level}/${x0 + xi}/${x - xi}/${y0 + yi}/${y - yi}`;
      if (boundary) {
        if (localBoundary.has(vertexKey))
          throw new Error('Duplicate terrain contour boundary vertex');
        localBoundary.add(vertexKey);
      }
      const found = boundary ? vertices.get(vertexKey) : undefined;
      if (found) {
        if (found.tile === tileIndex) throw new Error('Duplicate terrain contour boundary vertex');
        const delta = Math.hypot(px - positions[3 * found.id], py - positions[3 * found.id + 1]);
        if (!Number.isFinite(delta) || delta > tolerance)
          throw new Error('Terrain contour boundary positions disagree');
        remap[source] = found.id;
        return found.id;
      }
      if (positions.length / 3 >= limits.maxVertices)
        throw new Error('Terrain contour vertex capacity exceeded');
      const output = positions.length / 3;
      const pz = levels[level] - origin[2];
      if (!Number.isFinite(pz)) throw new Error('Terrain contour frame overflow');
      positions.push(px, py, pz);
      grid.push(gx, gy);
      if (boundary) vertices.set(vertexKey, {id: output, tile: tileIndex});
      remap[source] = output;
      return output;
    };
    for (let i = 0; i < data.levelIndices.length; i++) {
      const level = data.levelIndices[i],
        a = mapVertex(data.segments[2 * i], level),
        b = mapVertex(data.segments[2 * i + 1], level);
      if (
        a === b ||
        (positions[3 * a] === positions[3 * b] && positions[3 * a + 1] === positions[3 * b + 1])
      )
        throw new Error('Degenerate terrain contour segment after rebasing');
      const edge = a < b ? `${a}/${b}` : `${b}/${a}`;
      const previous = edges.get(edge);
      if (previous !== undefined) {
        if (previous === tileIndex) throw new Error('Duplicate terrain contour segment');
        continue;
      }
      if (levelIndices.length >= limits.maxSegments)
        throw new Error('Terrain contour segment capacity exceeded');
      edges.set(edge, tileIndex);
      segments.push(a, b);
      levelIndices.push(level);
    }
  }
  return {
    positions: Float64Array.from(positions),
    gridCoordinates: Float64Array.from(grid),
    segments: Uint32Array.from(segments),
    levelIndices: Uint32Array.from(levelIndices),
    levels,
    origin,
    heightReference: first.heightReference
  };
}
