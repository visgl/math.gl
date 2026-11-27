// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';

export type TerrainCellWindow = {
  /** Inclusive integer cell indices, not sample indices or world coordinates. */
  minColumn: number;
  minRow: number;
  maxColumn: number;
  maxRow: number;
};
export type TerrainHeightBounds = {
  /** Bounds of every valid source corner of the requested cells; undefined if all are missing. */
  heightRange: readonly [number, number] | undefined;
  cellCount: number;
  /** Cells with at least one valid source corner. This does not certify a complete interpolant. */
  populatedCellCount: number;
  /** Cells with all four source corners valid. */
  completeCellCount: number;
};
export type TerrainBoundsLevel = {
  width: number;
  height: number;
  /** Maximum width/height in base cells covered by one node; outer nodes may be smaller. */
  blockSize: number;
  /** Finite zero placeholders where populatedCellCounts is zero. */
  minimums: Float64Array;
  maximums: Float64Array;
  populatedCellCounts: Uint32Array;
  completeCellCounts: Uint32Array;
};

/** Conservative source-corner min/max hierarchy. Unlike filtered mipmaps, this retains extrema. */
export class HeightFieldMinMax {
  readonly width: number;
  readonly height: number;
  readonly levelCount: number;
  private readonly levels: TerrainBoundsLevel[] = [];

  constructor(field: HeightField) {
    this.width = field.width - 1;
    this.height = field.height - 1;
    if (this.width * this.height > 0xffffffff)
      throw new Error('Terrain bounds exceed uint32 cell capacity');
    const base = createLevel(this.width, this.height, 1);
    for (let row = 0; row < this.height; row++)
      for (let column = 0; column < this.width; column++) {
        const index = row * this.width + column;
        let min = Infinity,
          max = -Infinity,
          count = 0;
        for (const [x, y] of [
          [column, row],
          [column + 1, row],
          [column, row + 1],
          [column + 1, row + 1]
        ]) {
          const value = field.getHeight(x, y);
          if (value === undefined) continue;
          min = Math.min(min, value);
          max = Math.max(max, value);
          count++;
        }
        if (count) {
          base.minimums[index] = min;
          base.maximums[index] = max;
          base.populatedCellCounts[index] = 1;
        }
        if (count === 4) base.completeCellCounts[index] = 1;
      }
    this.levels.push(base);
    let previous = base;
    while (previous.width > 1 || previous.height > 1) {
      const next = createLevel(
        Math.ceil(previous.width / 2),
        Math.ceil(previous.height / 2),
        previous.blockSize * 2
      );
      for (let row = 0; row < next.height; row++)
        for (let column = 0; column < next.width; column++) {
          const index = row * next.width + column;
          let min = Infinity,
            max = -Infinity;
          for (let y = row * 2; y < Math.min(row * 2 + 2, previous.height); y++)
            for (let x = column * 2; x < Math.min(column * 2 + 2, previous.width); x++) {
              const child = y * previous.width + x;
              if (previous.populatedCellCounts[child]) {
                min = Math.min(min, previous.minimums[child]);
                max = Math.max(max, previous.maximums[child]);
              }
              next.populatedCellCounts[index] += previous.populatedCellCounts[child];
              next.completeCellCounts[index] += previous.completeCellCounts[child];
            }
          if (next.populatedCellCounts[index]) {
            next.minimums[index] = min;
            next.maximums[index] = max;
          }
        }
      this.levels.push(next);
      previous = next;
    }
    this.levelCount = this.levels.length;
  }

  /** Exact rectangular aggregation through fully covered hierarchy nodes; no clipping or truncation. */
  query(
    window: TerrainCellWindow = {
      minColumn: 0,
      minRow: 0,
      maxColumn: this.width - 1,
      maxRow: this.height - 1
    }
  ): TerrainHeightBounds {
    const {minColumn, minRow, maxColumn, maxRow} = window;
    if (
      ![minColumn, minRow, maxColumn, maxRow].every(Number.isInteger) ||
      minColumn < 0 ||
      minRow < 0 ||
      maxColumn >= this.width ||
      maxRow >= this.height ||
      minColumn > maxColumn ||
      minRow > maxRow
    )
      throw new Error('Invalid terrain cell window');
    let min = Infinity,
      max = -Infinity,
      populated = 0,
      complete = 0;
    const stack: Array<[number, number, number]> = [[this.levelCount - 1, 0, 0]];
    while (stack.length) {
      const [levelIndex, column, row] = stack.pop()!;
      const level = this.levels[levelIndex];
      const left = column * level.blockSize,
        bottom = row * level.blockSize;
      const right = Math.min(left + level.blockSize, this.width) - 1;
      const top = Math.min(bottom + level.blockSize, this.height) - 1;
      if (left > maxColumn || bottom > maxRow || right < minColumn || top < minRow) continue;
      const index = row * level.width + column;
      if (left >= minColumn && bottom >= minRow && right <= maxColumn && top <= maxRow) {
        if (level.populatedCellCounts[index]) {
          min = Math.min(min, level.minimums[index]);
          max = Math.max(max, level.maximums[index]);
        }
        populated += level.populatedCellCounts[index];
        complete += level.completeCellCounts[index];
      } else {
        const child = this.levels[levelIndex - 1];
        for (let y = row * 2; y < Math.min(row * 2 + 2, child.height); y++)
          for (let x = column * 2; x < Math.min(column * 2 + 2, child.width); x++)
            stack.push([levelIndex - 1, x, y]);
      }
    }
    return {
      heightRange: populated ? [min, max] : undefined,
      cellCount: (maxColumn - minColumn + 1) * (maxRow - minRow + 1),
      populatedCellCount: populated,
      completeCellCount: complete
    };
  }

  /** Detached hierarchy arrays, suitable for inspection, transfer or a separate device adapter. */
  copyLevel(index: number): TerrainBoundsLevel {
    if (!Number.isInteger(index) || index < 0 || index >= this.levelCount)
      throw new Error('Invalid terrain hierarchy level');
    const level = this.levels[index];
    return {
      ...level,
      minimums: level.minimums.slice(),
      maximums: level.maximums.slice(),
      populatedCellCounts: level.populatedCellCounts.slice(),
      completeCellCounts: level.completeCellCounts.slice()
    };
  }
}

function createLevel(width: number, height: number, blockSize: number): TerrainBoundsLevel {
  const count = width * height;
  return {
    width,
    height,
    blockSize,
    minimums: new Float64Array(count),
    maximums: new Float64Array(count),
    populatedCellCounts: new Uint32Array(count),
    completeCellCounts: new Uint32Array(count)
  };
}
