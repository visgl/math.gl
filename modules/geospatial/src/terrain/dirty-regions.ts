// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {HeightField} from './height-field';
export type TerrainDirtyWindow = {
  minColumn: number;
  minRow: number;
  maxColumn: number;
  maxRow: number;
};
export function validateTerrainDirtyWindows(
  windows: readonly TerrainDirtyWindow[],
  width: number,
  height: number,
  maxWindows = 100_000
): void {
  if (windows.length > maxWindows) throw new Error('Terrain dirty window capacity exceeded');
  for (const w of windows)
    if (
      ![w.minColumn, w.minRow, w.maxColumn, w.maxRow].every(Number.isSafeInteger) ||
      w.minColumn < 0 ||
      w.minRow < 0 ||
      w.maxColumn >= width ||
      w.maxRow >= height ||
      w.minColumn > w.maxColumn ||
      w.minRow > w.maxRow
    )
      throw new Error('Invalid terrain dirty sample window');
}
export function sameTerrainFrame(a: HeightField, b: HeightField): boolean {
  return (
    a.width === b.width &&
    a.height === b.height &&
    a.registration === b.registration &&
    a.diagonal === b.diagonal &&
    a.heightReference === b.heightReference &&
    a.origin.every((v, i) => v === b.origin[i]) &&
    a.columnStep.every((v, i) => v === b.columnStep[i]) &&
    a.rowStep.every((v, i) => v === b.rowStep[i])
  );
}
export function terrainDirtyIndices(
  windows: readonly TerrainDirtyWindow[],
  width: number,
  height: number,
  expand: number,
  maxTests: number
): Set<number> {
  const ids = new Set<number>();
  let tests = 0;
  for (const w of windows)
    for (let y = Math.max(0, w.minRow - expand); y <= Math.min(height - 1, w.maxRow + expand); y++)
      for (
        let x = Math.max(0, w.minColumn - expand);
        x <= Math.min(width - 1, w.maxColumn + expand);
        x++
      ) {
        if (++tests > maxTests) throw new Error('Terrain dirty work budget exceeded');
        ids.add(y * width + x);
      }
  return ids;
}
