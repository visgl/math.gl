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

export type TerrainMixedContourTile = {
  contours: TerrainContours;
  /** Tile minimum in the common finest lattice; integer coordinates. */
  column: number;
  row: number;
  width: number;
  height: number;
  /** Positive power-of-two spacing in the common lattice. */
  spacing: number;
};
export type TerrainMixedContourWeldOptions = TerrainContourPathLimits & {
  maxTiles?: number;
  maxBoundaryTests?: number;
  maxPositionDifference?: number;
};

/** Weld contour graphs from nonoverlapping vertex tiles in a shared affine lattice.
 * Subdivides coincident axis-aligned boundary segments at finer boundary vertices.
 * Only exact lattice intersections at the same level are joined. Differing source
 * surfaces remain open; callers must reconcile elevations before contouring.
 * Coordinates must retain their fractional precision in the common lattice.
 */
export function weldTerrainMixedContourTiles(
  tiles: readonly TerrainMixedContourTile[],
  options: TerrainMixedContourWeldOptions = {}
): TerrainContours {
  const limits = contourPathLimits(options);
  const maxTiles = options.maxTiles ?? 4096;
  const budget = options.maxBoundaryTests ?? 10_000_000;
  const tolerance = options.maxPositionDifference ?? 0;
  if (
    !Number.isSafeInteger(maxTiles) ||
    maxTiles < 1 ||
    !tiles.length ||
    tiles.length > maxTiles ||
    !Number.isSafeInteger(budget) ||
    budget < 0 ||
    !Number.isFinite(tolerance) ||
    tolerance < 0
  )
    throw new Error('Invalid mixed contour capacity or tolerance');
  let tests = 0;
  const charge = () => {
    if (++tests > budget) throw new Error('Mixed contour boundary-test budget exceeded');
  };
  const sorted = [...tiles].sort(
    (a, b) => a.column - b.column || a.row - b.row || a.spacing - b.spacing
  );
  const bounds = sorted.map(t => {
    if (
      ![t.column, t.row, t.width, t.height, t.spacing].every(Number.isSafeInteger) ||
      t.width < 2 ||
      t.height < 2 ||
      t.spacing < 1 ||
      2 ** Math.round(Math.log2(t.spacing)) !== t.spacing
    )
      throw new Error('Invalid mixed contour tile lattice');
    const x1 = t.column + (t.width - 1) * t.spacing,
      y1 = t.row + (t.height - 1) * t.spacing;
    if (
      ![(t.width - 1) * t.spacing, (t.height - 1) * t.spacing, x1, y1].every(Number.isSafeInteger)
    )
      throw new Error('Mixed contour lattice overflow');
    return [t.column, t.row, x1, y1];
  });
  for (let i = 0; i < bounds.length; i++)
    for (let j = 0; j < i; j++) {
      charge();
      const a = bounds[i],
        b = bounds[j];
      if (
        Math.max(a[0], b[0]) < Math.min(a[2], b[2]) &&
        Math.max(a[1], b[1]) < Math.min(a[3], b[3])
      )
        throw new Error('Mixed contour tile interiors overlap');
    }
  const first = sorted[0].contours,
    origin: [number, number, number] = [...first.origin];
  const positions: number[] = [],
    grid: number[] = [],
    vertexLevels: number[] = [];
  const roundedBoundary = new Map<string, string>();
  const boundary = new Set<number>(),
    shared = new Map<string, number>();
  const edges: {a: number; b: number; level: number; tile: number; seam: boolean}[] = [];
  let inputVertices = 0,
    inputSegments = 0;
  for (let ti = 0; ti < sorted.length; ti++) {
    const tile = sorted[ti],
      data = tile.contours;
    const count = validateContourData(data, limits);
    inputVertices += count;
    if (inputVertices > limits.maxVertices)
      throw new Error('Mixed contour input vertex capacity exceeded');
    if (
      data.heightReference !== first.heightReference ||
      data.levels.length !== first.levels.length ||
      !data.levels.every((v, i) => v === first.levels[i])
    )
      throw new Error('Mixed contour levels or height reference differ');
    if (
      !(data.segments instanceof Uint32Array) ||
      data.segments.length % 2 ||
      !(data.levelIndices instanceof Uint32Array) ||
      data.levelIndices.length !== data.segments.length / 2
    )
      throw new Error('Invalid mixed contour segments');
    inputSegments += data.levelIndices.length;
    if (inputSegments > limits.maxSegments)
      throw new Error('Mixed contour input segment capacity exceeded');
    const assigned = new Uint32Array(count).fill(0xffffffff),
      remap = new Map<number, number>();
    const local = new Set<string>();
    const vertex = (v: number, level: number) => {
      validateContourVertex(data, v, level, assigned);
      const existing = remap.get(v);
      if (existing !== undefined) return existing;
      const x = data.gridCoordinates[2 * v],
        y = data.gridCoordinates[2 * v + 1];
      if (x < 0 || x > tile.width - 1 || y < 0 || y > tile.height - 1)
        throw new Error('Mixed contour vertex outside tile');
      const sx = x * tile.spacing,
        sy = y * tile.spacing;
      const gx = tile.column + sx,
        gy = tile.row + sy;
      // Reject coordinates whose local fraction cannot survive common-frame rebasing.
      if (
        Math.abs(gx - tile.column - sx) > 8 * Number.EPSILON * Math.max(1, Math.abs(sx)) ||
        Math.abs(gy - tile.row - sy) > 8 * Number.EPSILON * Math.max(1, Math.abs(sy))
      )
        throw new Error('Mixed contour lattice loses precision');
      const px = data.positions[3 * v] + (data.origin[0] - origin[0]),
        py = data.positions[3 * v + 1] + (data.origin[1] - origin[1]);
      const pz = data.levels[level] - origin[2];
      if (![gx, gy, px, py, pz].every(Number.isFinite))
        throw new Error('Mixed contour frame overflow');
      const onEdge = x === 0 || y === 0 || x === tile.width - 1 || y === tile.height - 1;
      const xi = Math.floor(sx),
        yi = Math.floor(sy);
      const key = `${level}/${tile.column + xi}/${sx - xi}/${tile.row + yi}/${sy - yi}`;
      if (onEdge) {
        const rounded = `${level}/${gx}/${gy}`;
        const identity = roundedBoundary.get(rounded);
        if (identity !== undefined && identity !== key)
          throw new Error('Mixed contour lattice loses precision');
        roundedBoundary.set(rounded, key);
      }
      if (onEdge && local.has(key)) throw new Error('Duplicate mixed contour boundary vertex');
      if (onEdge) local.add(key);
      let id = onEdge ? shared.get(key) : undefined;
      if (id !== undefined) {
        if (Math.hypot(px - positions[3 * id], py - positions[3 * id + 1]) > tolerance)
          throw new Error('Mixed contour boundary positions disagree');
      } else {
        id = positions.length / 3;
        if (id >= limits.maxVertices) throw new Error('Mixed contour vertex capacity exceeded');
        positions.push(px, py, pz);
        grid.push(gx, gy);
        vertexLevels.push(level);
        if (onEdge) {
          shared.set(key, id);
          boundary.add(id);
        }
      }
      remap.set(v, id);
      return id;
    };
    const localEdges = new Set<string>();
    for (let i = 0; i < data.levelIndices.length; i++) {
      const level = data.levelIndices[i],
        a = vertex(data.segments[2 * i], level),
        b = vertex(data.segments[2 * i + 1], level);
      if (
        a === b ||
        (positions[3 * a] === positions[3 * b] && positions[3 * a + 1] === positions[3 * b + 1])
      )
        throw new Error('Degenerate mixed contour segment');
      const key = a < b ? `${a}/${b}` : `${b}/${a}`;
      if (localEdges.has(key)) throw new Error('Duplicate mixed contour segment');
      localEdges.add(key);
      const box = bounds[ti];
      const seam =
        (grid[2 * a] === grid[2 * b] && (grid[2 * a] === box[0] || grid[2 * a] === box[2])) ||
        (grid[2 * a + 1] === grid[2 * b + 1] &&
          (grid[2 * a + 1] === box[1] || grid[2 * a + 1] === box[3]));
      edges.push({a, b, level, tile: ti, seam});
    }
  }
  const segments: number[] = [],
    levels: number[] = [],
    emitted = new Map<string, number>();
  for (const edge of edges) {
    const {a, b, level} = edge;
    const axis = grid[2 * a] === grid[2 * b] ? 1 : 0;
    const start = grid[2 * a + axis],
      end = grid[2 * b + axis];
    const cuts = [a, b];
    if (edge.seam)
      for (const v of boundary) {
        charge();
        const value = grid[2 * v + axis];
        if (
          vertexLevels[v] !== level ||
          grid[2 * v + 1 - axis] !== grid[2 * a + 1 - axis] ||
          value <= Math.min(start, end) ||
          value >= Math.max(start, end)
        )
          continue;
        const f = (value - start) / (end - start);
        const px = positions[3 * a] + f * (positions[3 * b] - positions[3 * a]);
        const py = positions[3 * a + 1] + f * (positions[3 * b + 1] - positions[3 * a + 1]);
        if (Math.hypot(px - positions[3 * v], py - positions[3 * v + 1]) > tolerance)
          throw new Error('Mixed contour boundary positions disagree');
        cuts.push(v);
      }
    cuts.sort((u, v) => grid[2 * u + axis] - grid[2 * v + axis]);
    for (let i = 1; i < cuts.length; i++) {
      const u = cuts[i - 1],
        v = cuts[i],
        key = u < v ? `${u}/${v}` : `${v}/${u}`;
      const prior = emitted.get(key);
      if (prior !== undefined) {
        if (prior === edge.tile) throw new Error('Overlapping mixed contour segments within tile');
        continue;
      }
      if (levels.length >= limits.maxSegments)
        throw new Error('Mixed contour output segment capacity exceeded');
      emitted.set(key, edge.tile);
      segments.push(u, v);
      levels.push(level);
    }
  }
  return {
    positions: Float64Array.from(positions),
    gridCoordinates: Float64Array.from(grid),
    segments: Uint32Array.from(segments),
    levelIndices: Uint32Array.from(levels),
    levels: first.levels.slice(),
    origin,
    heightReference: first.heightReference
  };
}
