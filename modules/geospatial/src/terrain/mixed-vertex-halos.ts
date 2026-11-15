// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createTerrainBoxIndex} from './box-index';
import {HeightField} from './height-field';
import {sampleTerrainTriangleHeight} from './sample-triangle-height';
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
  return buildMixedVertexTileHalos(tiles, options);
}

/** Internal preparation shared only by immutable incremental snapshots. */
export type MixedHaloPreparation = {
  tiles: WeakMap<TerrainMixedVertexTile, ReturnType<typeof prepareMixedHaloTile>>;
  layout?: {keys: string[]; query: ReturnType<typeof createTerrainBoxIndex>};
};

/** Internal selective builder; all source metadata and total capacity are validated. */
export function buildMixedVertexTileHalos(
  tiles: readonly TerrainMixedVertexTile[],
  options: {maxSamples?: number; maxTileTests?: number} = {},
  targets?: ReadonlySet<string>,
  preparation?: MixedHaloPreparation
): ReturnType<typeof createTerrainMixedVertexTileHalos> {
  const maxSamples = options.maxSamples ?? 4_000_000,
    maxTests = options.maxTileTests ?? 10_000_000;
  if (![maxSamples, maxTests].every(v => Number.isSafeInteger(v) && v >= 0))
    throw new Error('Invalid mixed halo capacity');
  let count = 0;
  let previousKey: string | undefined;
  let frame:
    | {origin: number[]; column: number[]; row: number[]; reference: string; scale: number[]}
    | undefined;
  const sources = [...tiles]
    .sort((a, b) => a.spacing - b.spacing || a.column - b.column || a.row - b.row)
    .map(tile => {
      count += (tile.field.width + 2) * (tile.field.height + 2);
      if (!Number.isSafeInteger(count) || count > maxSamples)
        throw new Error('Mixed halo sample capacity exceeded');
      let prepared = preparation?.tiles.get(tile);
      if (!prepared) {
        prepared = prepareMixedHaloTile(tile);
        preparation?.tiles.set(tile, prepared);
      }
      const {
        key,
        source: field,
        columnStep: column,
        rowStep: row,
        frameOrigin: origin,
        scale
      } = prepared;
      // Address sorting makes duplicate tiles adjacent; no per-build Set is needed.
      if (previousKey === key) throw new Error('Duplicate mixed halo tile');
      previousKey = key;
      if (frame) {
        if (frame.reference !== field.heightReference)
          throw new Error('Mixed halo frames or height references differ');
        for (let i = 0; i < 2; i++) {
          if (
            column[i] !== frame.column[i] ||
            row[i] !== frame.row[i] ||
            (origin[i] !== frame.origin[i] &&
              Math.abs(origin[i] - frame.origin[i]) >
                Math.min(
                  16 * Number.EPSILON * Math.max(scale[i], frame.scale[i]),
                  1e-9 * Math.max(Math.abs(column[i]), Math.abs(row[i]))
                ))
          )
            throw new Error('Mixed halo frames or height references differ');
        }
      }
      frame ??= {origin, column, row, reference: field.heightReference, scale};
      return prepared;
    });
  // Bound the full lattice span so relative coordinates remain exact integers.
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < sources.length; i++) {
    const {haloBounds} = sources[i];
    minX = Math.min(minX, haloBounds.minX);
    minY = Math.min(minY, haloBounds.minY);
    maxX = Math.max(maxX, haloBounds.maxX);
    maxY = Math.max(maxY, haloBounds.maxY);
  }
  if (sources.length && (!Number.isSafeInteger(maxX - minX) || !Number.isSafeInteger(maxY - minY)))
    throw new Error('Mixed halo lattice span overflow');
  if (targets && targets.size === 0) return {tiles: []};
  let index: ReturnType<typeof createTerrainBoxIndex> | undefined;
  if (sources.length > 8) {
    const cached = preparation?.layout;
    if (
      cached &&
      sources.length === cached.keys.length &&
      sources.every((tile, i) => tile.layoutKey === cached.keys[i])
    ) {
      index = cached.query;
    } else {
      index = createTerrainBoxIndex(
        sources.map(tile => ({
          minX: tile.column,
          minY: tile.row,
          maxX: tile.column + (tile.source.width - 1) * tile.spacing,
          maxY: tile.row + (tile.source.height - 1) * tile.spacing
        }))
      );
      if (preparation)
        preparation.layout = {keys: sources.map(tile => tile.layoutKey), query: index};
    }
  }
  let tests = 0;
  const charge = () => {
    if (++tests > maxTests) throw new Error('Mixed halo tile-test budget exceeded');
  };
  return {
    tiles: sources
      .filter(tile => !targets || targets.has(tile.key))
      .map(tile => {
        const source = tile.source,
          width = source.width + 2,
          height = source.height + 2;
        const heights = new Float64Array(width * height),
          validity = new Uint8Array(heights.length),
          statuses = new Uint8Array(heights.length);
        const candidates = index?.(tile.haloBounds, charge).map(id => sources[id]) ?? sources;
        for (let y = 0; y < height; y++)
          for (let x = 0; x < width; x++) {
            const gx = tile.column + (x - 1) * tile.spacing,
              gy = tile.row + (y - 1) * tile.spacing;
            if (!Number.isSafeInteger(gx) || !Number.isSafeInteger(gy))
              throw new Error('Mixed halo lattice overflow');
            for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
              const candidate = candidates[candidateIndex];
              charge();
              const cx = (gx - candidate.column) / candidate.spacing,
                cy = (gy - candidate.row) / candidate.spacing;
              const f = candidate.source;
              if (cx < 0 || cy < 0 || cx > f.width - 1 || cy > f.height - 1) continue;
              const value = sampleTerrainTriangleHeight(f, cx, cy);
              const i = y * width + x;
              statuses[i] = value === undefined ? 1 : 2;
              if (value !== undefined) {
                heights[i] = value;
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

/** Prepare immutable geometry and normalized data once per source descriptor. */
function prepareMixedHaloTile(tile: TerrainMixedVertexTile) {
  const {column, row, spacing} = tile;
  if (
    ![column, row, spacing].every(Number.isSafeInteger) ||
    spacing < 1 ||
    2 ** Math.round(Math.log2(spacing)) !== spacing
  )
    throw new Error('Invalid mixed halo lattice');
  const source = new HeightField(tile.field);
  if (source.registration !== 'vertex') throw new Error('Mixed halos require vertex registration');
  const columnStep = source.columnStep.map(v => v / spacing);
  const rowStep = source.rowStep.map(v => v / spacing);
  const frameOrigin = source.origin.map((v, i) => v - column * columnStep[i] - row * rowStep[i]);
  const scale = source.origin.map((v, i) =>
    Math.max(1, Math.abs(v), Math.abs(column * columnStep[i]), Math.abs(row * rowStep[i]))
  );
  if (!frameOrigin.every(Number.isFinite)) throw new Error('Mixed halo coordinate overflow');
  const minX = column - spacing,
    minY = row - spacing;
  const maxX = column + source.width * spacing,
    maxY = row + source.height * spacing;
  if (![minX, minY, maxX, maxY].every(Number.isSafeInteger))
    throw new Error('Mixed halo lattice overflow');
  const key = `${spacing}/${column}/${row}`;
  return {
    ...tile,
    source,
    columnStep,
    rowStep,
    frameOrigin,
    scale,
    key,
    layoutKey: `${key}/${source.width}/${source.height}`,
    haloBounds: {minX, minY, maxX, maxY}
  };
}
