// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightField} from './height-field';
import type {HeightFieldProps} from './types';

export type TerrainMixedVertexTile = {
  /** Origin in common finest-lattice coordinates, not tile indices. */
  column: number;
  row: number;
  /** Positive power-of-two sample spacing in common lattice units. */
  spacing: number;
  field: HeightFieldProps;
};

/** Prepare resampled one-node halos in a shared local Cartesian lattice.
 * Finest resident coverage owns shared samples; ties use address order. Resident
 * nodata never falls back to coarse data. Boundary values are canonicalized along
 * with interiors. Different stencil resolutions need not yield identical normals.
 */
export function createTerrainMixedVertexTileHalos(
  tiles: readonly TerrainMixedVertexTile[],
  options: {maxSamples?: number; maxTileTests?: number} = {}
): {
  tiles: {
    column: number;
    row: number;
    spacing: number;
    field: HeightFieldProps;
    statuses: Uint8Array;
  }[];
} {
  const maxSamples = options.maxSamples ?? 4_000_000,
    maxTests = options.maxTileTests ?? 10_000_000;
  if (![maxSamples, maxTests].every(v => Number.isSafeInteger(v) && v >= 0))
    throw new Error('Invalid mixed halo capacity');
  let count = 0;
  const addresses = new Set<string>();
  let frame: {origin: number[]; column: number[]; row: number[]; reference: string} | undefined;
  const sources = [...tiles]
    .sort((a, b) => a.spacing - b.spacing || a.column - b.column || a.row - b.row)
    .map(tile => {
      if (
        ![tile.column, tile.row, tile.spacing].every(Number.isSafeInteger) ||
        tile.spacing < 1 ||
        2 ** Math.round(Math.log2(tile.spacing)) !== tile.spacing
      )
        throw new Error('Invalid mixed halo lattice');
      const key = `${tile.spacing}/${tile.column}/${tile.row}`;
      if (addresses.has(key)) throw new Error('Duplicate mixed halo tile');
      addresses.add(key);
      count += (tile.field.width + 2) * (tile.field.height + 2);
      if (!Number.isSafeInteger(count) || count > maxSamples)
        throw new Error('Mixed halo sample capacity exceeded');
      const field = new HeightField(tile.field);
      if (field.registration !== 'vertex')
        throw new Error('Mixed halos require vertex registration');
      const column = field.columnStep.map(v => v / tile.spacing);
      const row = field.rowStep.map(v => v / tile.spacing);
      const origin = field.origin.map(
        (v, axis) => v - tile.column * column[axis] - tile.row * row[axis]
      );
      if (!origin.every(Number.isFinite)) throw new Error('Mixed halo coordinate overflow');
      if (
        frame &&
        (frame.reference !== field.heightReference ||
          column.some((v, i) => v !== frame!.column[i]) ||
          row.some((v, i) => v !== frame!.row[i]) ||
          origin.some(
            (v, i) =>
              Math.abs(v - frame!.origin[i]) >
              Math.min(
                16 * Number.EPSILON * Math.max(1, Math.abs(v), Math.abs(frame!.origin[i])),
                1e-9 * Math.max(Math.abs(column[i]), Math.abs(row[i]))
              )
          ))
      )
        throw new Error('Mixed halo frames or height references differ');
      frame ??= {origin, column, row, reference: field.heightReference};
      // Sample in lattice coordinates, avoiding world-coordinate roundoff.
      const sampler = new HeightField({
        ...tile.field,
        origin: [0, 0],
        columnStep: [1, 0],
        rowStep: [0, 1]
      });
      return {...tile, source: field, sampler};
    });
  // Bound the full lattice span so relative coordinates remain exact integers.
  for (const axis of ['column', 'row'] as const) {
    let min = Infinity,
      max = -Infinity;
    for (const tile of sources) {
      const size = axis === 'column' ? tile.source.width : tile.source.height;
      const low = tile[axis] - tile.spacing,
        high = tile[axis] + size * tile.spacing;
      if (![low, high].every(Number.isSafeInteger)) throw new Error('Mixed halo lattice overflow');
      min = Math.min(min, low);
      max = Math.max(max, high);
    }
    if (sources.length && !Number.isSafeInteger(max - min))
      throw new Error('Mixed halo lattice span overflow');
  }
  let tests = 0;
  return {
    tiles: sources.map(tile => {
      const source = tile.source,
        width = source.width + 2,
        height = source.height + 2;
      const heights = new Float64Array(width * height),
        validity = new Uint8Array(heights.length),
        statuses = new Uint8Array(heights.length);
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const gx = tile.column + (x - 1) * tile.spacing,
            gy = tile.row + (y - 1) * tile.spacing;
          if (![gx, gy].every(Number.isSafeInteger)) throw new Error('Mixed halo lattice overflow');
          for (const candidate of sources) {
            if (++tests > maxTests) throw new Error('Mixed halo tile-test budget exceeded');
            const cx = (gx - candidate.column) / candidate.spacing,
              cy = (gy - candidate.row) / candidate.spacing;
            const f = candidate.source;
            if (cx < 0 || cy < 0 || cx > f.width - 1 || cy > f.height - 1) continue;
            const value = candidate.sampler.sample(cx, cy, {interpolation: 'triangle'});
            if (value.status !== 0 && value.status !== 2)
              throw new Error('Mixed halo numeric sampling failure');
            const i = y * width + x;
            statuses[i] = value.status === 0 ? 2 : 1;
            if (value.status === 0) {
              heights[i] = value.height;
              validity[i] = 1;
            }
            break;
          }
        }
      const origin: [number, number] = [
        source.origin[0] - source.columnStep[0] - source.rowStep[0],
        source.origin[1] - source.columnStep[1] - source.rowStep[1]
      ];
      if (!origin.every(Number.isFinite)) throw new Error('Mixed halo coordinate overflow');
      return {
        column: tile.column,
        row: tile.row,
        spacing: tile.spacing,
        statuses,
        field: {
          ...tile.field,
          width,
          height,
          heights,
          validity,
          offset: 0,
          stride: width,
          origin,
          columnStep: [...source.columnStep],
          rowStep: [...source.rowStep]
        }
      };
    })
  };
}
