// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';

const quick = process.argv.includes('--quick');
const directory = mkdtempSync(join(tmpdir(), 'terrain-residency-sweep-'));
const p95 = times => [...times].sort((a, b) => a - b)[Math.ceil(times.length * 0.95) - 1];
const bytes = tile => tile.field.heights.byteLength + tile.field.validity.byteLength + tile.statuses.byteLength;
const key = tile => `${tile.spacing}/${tile.column}/${tile.row}`;

try {
  const output = join(directory, 'terrain.mjs');
  await bundleRuntime(fileURLToPath(new URL('../', import.meta.url)), './modules/geospatial/src/terrain/index.ts', output);
  const {createTerrainMixedVertexTileHalos, updateTerrainMixedVertexTileHalos} = await import(pathToFileURL(output));

  function replay(side, width, nodata, ratio, rounds) {
    function makeTile(column, row, spacing, edit = 0) {
      const heights = Float64Array.from({length: width * width}, (_, index) => {
        const x = column + (index % width) * spacing;
        const y = row + Math.floor(index / width) * spacing;
        return nodata && (x + 3 * y) % 23 === 0 ? NaN : Math.sin(x / 13) * 40 + Math.cos(y / 17) * 25 + edit;
      });
      return {column, row, spacing, field: {width, height: width, heights, registration: 'vertex',
        origin: [column, row], columnStep: [spacing, 0], rowStep: [0, spacing]}};
    }

    const stride = (width - 1) * ratio;
    const resident = Array.from({length: side * side}, (_, index) =>
      makeTile((index % side) * stride, Math.floor(index / side) * stride, ratio));
    let state = updateTerrainMixedVertexTileHalos(null, resident);
    const results = new Map();
    for (let round = 0; round <= rounds; round++) {
      const index = (round * 17) % (side * side);
      const {column, row} = resident[index];
      const fine = makeTile(column, row, 1);
      const events = [
        ['arrival', () => resident.push(fine)],
        ['edit', () => {resident[index] = makeTile(column, row, ratio, round + 1);}],
        ['eviction', () => resident.pop()]
      ];
      for (const [operation, apply] of events) {
        apply();
        const start = performance.now();
        const incremental = updateTerrainMixedVertexTileHalos(state, resident);
        const afterIncremental = performance.now();
        const full = createTerrainMixedVertexTileHalos(resident);
        const afterFull = performance.now();
        assert.deepEqual(incremental.tiles, full.tiles);
        if (round > 0) {
          const result = results.get(operation) ?? {incremental: [], full: [], rebuiltBytes: 0, fullBytes: 0, rebuiltTiles: 0};
          const rebuilt = new Set(incremental.rebuilt);
          result.incremental.push(afterIncremental - start);
          result.full.push(afterFull - afterIncremental);
          result.rebuiltBytes += incremental.tiles.filter(tile => rebuilt.has(key(tile))).reduce((n, tile) => n + bytes(tile), 0);
          result.fullBytes += full.tiles.reduce((n, tile) => n + bytes(tile), 0);
          result.rebuiltTiles += rebuilt.size;
          results.set(operation, result);
        }
        state = incremental;
      }
    }
    return [...results].map(([operation, result]) => ({
      operation, residentCoarseTiles: side * side, width, nodata, ratio, repetitions: rounds,
      incrementalP95Ms: p95(result.incremental), fullP95Ms: p95(result.full),
      rebuiltTiles: result.rebuiltTiles, rebuiltBytes: result.rebuiltBytes, fullBytes: result.fullBytes
    }));
  }

  const cases = quick ? [[2, 9, false, 2], [3, 9, true, 4]] :
    [2, 4, 8].flatMap(side => [17, 33].flatMap(width =>
      [false, true].flatMap(nodata => [2, 4].map(ratio => [side, width, nodata, ratio]))));
  console.log(JSON.stringify({
    runtime: process.version, platform: process.platform, architecture: process.arch,
    timingScope: 'Update only. One warm-up per event. Rebuilt bytes count output buffers, not internal copies.',
    results: cases.flatMap(args => replay(...args, quick ? 3 : 20)),
    processPeakRssKiB: process.resourceUsage().maxRSS
  }, null, 2));
} finally {
  rmSync(directory, {recursive: true, force: true});
}
