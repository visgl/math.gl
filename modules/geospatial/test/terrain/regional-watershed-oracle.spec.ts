// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField} from '../../src/terrain/height-field';
import {createTerrainRegionalWatersheds} from '../../src/terrain/regional-watersheds';
import pacific from './fixtures/pacific-streaming.json';
import sierra from './fixtures/sierra-nodata-streaming.json';

/** Enumerate face neighbors using explicit lattice coordinates. */
function* neighbors(index: number, width: number, height: number) {
  const x = index % width;
  const y = Math.floor(index / width);
  for (const [nx, ny] of [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1]
  ]) {
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) yield ny * width + nx;
  }
}

/** First elevation threshold connecting a cell to any confirmed outlet. */
function thresholdSpills(samples: Float64Array, outlets: number[], width: number, height: number) {
  const spills = new Float64Array(samples.length).fill(Infinity);
  const levels = [...new Set(samples.filter(Number.isFinite))].sort((a, b) => a - b);
  const visited = new Uint8Array(samples.length);
  for (const level of levels) {
    visited.fill(0);
    const queue = outlets.filter(i => samples[i] <= level);
    for (const outlet of queue) visited[outlet] = 1;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const cell = queue[cursor];
      spills[cell] = Math.min(spills[cell], level);
      for (const next of neighbors(cell, width, height)) {
        if (!visited[next] && samples[next] <= level) {
          visited[next] = 1;
          queue.push(next);
        }
      }
    }
  }
  return spills;
}

for (const [name, dem, sourceX, sourceY] of [
  ['Pacific', pacific, 96, 96],
  ['Sierra', sierra, 48, 80]
] as const) {
  test(name + ' tiled spill levels agree with independent threshold connectivity', () => {
    const width = 48;
    const height = 32;
    const size = 8;
    const samples = new Float64Array(width * height).fill(NaN);
    const tiles = [];
    for (let row = 0; row < height; row += size) {
      for (let column = 0; column < width; column += size) {
        // Leave an interior coverage gap, independently of source nodata.
        if (row === 8 && column === 16) continue;
        const values = Float64Array.from({length: size * size}, (_, i) => {
          const x = column + (i % size);
          const y = row + Math.floor(i / size);
          const value = dem.heights[(sourceY + y) * dem.width + sourceX + x] ?? NaN;
          samples[y * width + x] = value;
          return value;
        });
        tiles.push({
          column,
          row,
          field: new HeightField({
            width: size,
            height: size,
            origin: [column, row],
            registration: 'cell',
            heights: values
          })
        });
      }
    }
    const outlets = [samples.findIndex(Number.isFinite), samples.findLastIndex(Number.isFinite)];
    expect(outlets[0]).toBeGreaterThanOrEqual(0);
    expect(outlets[1]).toBeGreaterThan(outlets[0]);
    const oracle = thresholdSpills(samples, outlets, width, height);
    const result = createTerrainRegionalWatersheds(tiles.reverse(), {
      width,
      height,
      origin: [0, 0],
      outlets
    });
    const counts = new Uint32Array(samples.length);
    for (let cell = 0; cell < samples.length; cell++) {
      const actual = result.field.getHeight(cell % width, Math.floor(cell / width));
      if (!Number.isFinite(oracle[cell])) {
        expect(result.receiver[cell]).toBe(-2);
        expect(actual).toBe(Number.isFinite(samples[cell]) ? samples[cell] : undefined);
        continue;
      }
      expect(actual).toBe(oracle[cell]);
      let cursor = cell;
      let steps = 0;
      while (result.receiver[cursor] >= 0) {
        const next = result.receiver[cursor];
        expect([...neighbors(cursor, width, height)]).toContain(next);
        expect(oracle[next]).toBeLessThanOrEqual(oracle[cursor]);
        expect(++steps).toBeLessThan(samples.length);
        cursor = next;
      }
      expect(outlets).toContain(cursor);
      expect(result.terminal[cell]).toBe(cursor);
      counts[cursor]++;
    }
    for (const outlet of outlets) expect(result.contributingCells[outlet]).toBe(counts[outlet]);
  });
}
