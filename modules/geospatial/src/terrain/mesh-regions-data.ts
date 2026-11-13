// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {TerrainGridMesh} from './mesh-data';
import {HeightField} from './height-field';
import {
  validateTerrainDirtyWindows,
  sameTerrainFrame,
  type TerrainDirtyWindow
} from './dirty-regions';
export type TerrainMeshRegions<T> = {
  field: HeightField;
  /** Common world reference; region fields and mesh buffers use this local frame. */
  origin: readonly [number, number, number];
  cellsPerRegion: number;
  configuration: string;
  regions: {column: number; row: number; field: HeightField; data: T}[];
  rebuilt: Uint32Array;
};
/** Internal independent chunk updater. Buffers in untouched regions remain shared. */
export function updateMeshRegions<T extends TerrainGridMesh | null>(
  previous: TerrainMeshRegions<T> | null,
  field: HeightField,
  dirty: readonly TerrainDirtyWindow[],
  options: {cellsPerRegion?: number; maxSamples?: number; maxTests?: number},
  configuration: string,
  create: (f: HeightField) => T
): TerrainMeshRegions<T> {
  const cells = options.cellsPerRegion ?? 32,
    limit = options.maxSamples ?? 4_000_000,
    budget = options.maxTests ?? 10_000_000;
  if (![cells, limit, budget].every(Number.isSafeInteger) || cells < 1 || limit < 0 || budget < 0)
    throw new Error('Invalid terrain mesh region capacity');
  validateTerrainDirtyWindows(dirty, field.width, field.height);
  let count = 0,
    tests = 0;
  const regions: TerrainMeshRegions<T>['regions'] = [],
    rebuilt: number[] = [];
  const reusable =
    previous &&
    sameTerrainFrame(previous.field, field) &&
    previous.cellsPerRegion === cells &&
    previous.configuration === configuration;
  const affectedRegions = new Set<number>();
  const columns = Math.ceil((field.width - 1) / cells);
  const rows = Math.ceil((field.height - 1) / cells);
  if (reusable) {
    for (const window of dirty) {
      // Shared sample rows and columns belong to both incident regions.
      const firstColumn = Math.max(0, Math.ceil(window.minColumn / cells) - 1);
      const firstRow = Math.max(0, Math.ceil(window.minRow / cells) - 1);
      const lastColumn = Math.min(columns - 1, Math.floor(window.maxColumn / cells));
      const lastRow = Math.min(rows - 1, Math.floor(window.maxRow / cells));
      for (let y = firstRow; y <= lastRow; y++) {
        for (let x = firstColumn; x <= lastColumn; x++) {
          if (++tests > budget) throw new Error('Terrain mesh region work budget exceeded');
          affectedRegions.add(y * columns + x);
        }
      }
    }
  }
  const cache = new Map(previous?.regions.map(r => [`${r.column},${r.row}`, r]));
  for (let row = 0; row < field.height - 1; row += cells)
    for (let column = 0; column < field.width - 1; column += cells) {
      const width = Math.min(cells, field.width - 1 - column) + 1,
        height = Math.min(cells, field.height - 1 - row) + 1;
      count += width * height;
      if (!Number.isSafeInteger(count) || count > limit)
        throw new Error('Terrain mesh region sample capacity exceeded');
      const affected = !reusable || affectedRegions.has((row / cells) * columns + column / cells);
      const old = cache.get(`${column},${row}`);
      if (!affected && old) {
        regions.push(old);
        continue;
      }
      const heights = Float64Array.from(
        {length: width * height},
        (_, i) => field.getHeight(column + (i % width), row + Math.floor(i / width)) ?? NaN
      );
      const source = new HeightField({
        width,
        height,
        heights,
        origin: [
          column * field.columnStep[0] + row * field.rowStep[0],
          column * field.columnStep[1] + row * field.rowStep[1]
        ],
        columnStep: field.columnStep,
        rowStep: field.rowStep,
        registration: field.registration,
        diagonal: field.diagonal,
        heightReference: field.heightReference
      });
      rebuilt.push(regions.length);
      let data = create(source);
      if (data) {
        const mesh = data;
        const positions = mesh.positions.map((value, i) => {
          const axis = i % 3;
          if (axis === 2) return value;
          const vertex = Math.floor(i / 3),
            shift = field.registration === 'cell' ? 0.5 : 0;
          const c = column + mesh.gridCoordinates[2 * vertex] + shift,
            r = row + mesh.gridCoordinates[2 * vertex + 1] + shift;
          const coordinate = c * field.columnStep[axis] + r * field.rowStep[axis];
          if (!Number.isFinite(coordinate)) throw new Error('Terrain region coordinate overflow');
          return coordinate;
        });
        data = {...mesh, origin: [0, 0, 0] as const, positions} as T;
      }
      regions.push({column, row, field: source, data});
    }
  return {
    field,
    origin: [field.origin[0], field.origin[1], 0],
    cellsPerRegion: cells,
    configuration,
    regions,
    rebuilt: Uint32Array.from(rebuilt)
  };
}
