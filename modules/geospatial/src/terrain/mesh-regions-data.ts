// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightField} from './height-field';
import {
  validateTerrainDirtyWindows,
  sameTerrainFrame,
  type TerrainDirtyWindow
} from './dirty-regions';
export type TerrainMeshRegions<T> = {
  field: HeightField;
  cellsPerRegion: number;
  configuration: string;
  regions: {column: number; row: number; field: HeightField; data: T}[];
  rebuilt: Uint32Array;
};
/** Internal independent chunk updater. Buffers in untouched regions remain shared. */
export function updateMeshRegions<T>(
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
  const cache = new Map(previous?.regions.map(r => [`${r.column},${r.row}`, r]));
  for (let row = 0; row < field.height - 1; row += cells)
    for (let column = 0; column < field.width - 1; column += cells) {
      const width = Math.min(cells, field.width - 1 - column) + 1,
        height = Math.min(cells, field.height - 1 - row) + 1;
      count += width * height;
      if (!Number.isSafeInteger(count) || count > limit)
        throw new Error('Terrain mesh region sample capacity exceeded');
      let affected = !reusable;
      for (const w of dirty) {
        if (++tests > budget) throw new Error('Terrain mesh region work budget exceeded');
        if (
          w.minColumn <= column + width - 1 &&
          w.maxColumn >= column &&
          w.minRow <= row + height - 1 &&
          w.maxRow >= row
        )
          affected = true;
      }
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
          field.origin[0] + column * field.columnStep[0] + row * field.rowStep[0],
          field.origin[1] + column * field.columnStep[1] + row * field.rowStep[1]
        ],
        columnStep: field.columnStep,
        rowStep: field.rowStep,
        registration: field.registration,
        diagonal: field.diagonal,
        heightReference: field.heightReference
      });
      rebuilt.push(regions.length);
      regions.push({column, row, field: source, data: create(source)});
    }
  return {field, cellsPerRegion: cells, configuration, regions, rebuilt: Uint32Array.from(rebuilt)};
}
