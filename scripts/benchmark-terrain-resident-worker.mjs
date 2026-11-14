// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'resident-terrain-'));
const key = tile => `${tile.spacing}/${tile.column}/${tile.row}`;
const bytes = tiles => tiles.reduce((sum, tile) => sum + tile.field.heights.byteLength +
  tile.field.validity.byteLength + tile.statuses.byteLength, 0);
const p95 = times => [...times].sort((a, b) => a - b)[Math.ceil(times.length * 0.95) - 1];

try {
  const entries = ['geospatial/src/terrain/index.ts', 'tasks/src/index.ts',
    'geospatial/src/tasks/terrain-residency.ts', 'geospatial/src/tasks/terrain-residency-worker.ts'];
  const modules = [];
  for (const [i, entry] of entries.entries()) {
    const output = join(directory, i + '.mjs');
    await bundleRuntime(root, './modules/' + entry, output);
    modules.push(pathToFileURL(output));
  }
  const {createTerrainMixedVertexTileHalos} = await import(modules[0]);
  const {TaskRunner} = await import(modules[1]);
  const {TerrainResidencyTask} = await import(modules[2]);
  const task = {...TerrainResidencyTask, worker: {url: modules[3], capabilities: {atomic: true, streaming: false}}};
  const runner = new TaskRunner();
  const results = [];
  try {
    for (const name of ['pacific', 'sierra-nodata']) {
      const fixtures = new URL('../modules/geospatial/test/terrain/fixtures/', import.meta.url);
      const dem = JSON.parse(readFileSync(new URL(name + '-streaming.json', fixtures)));
      assert.equal(createHash('sha256').update(readFileSync(new URL(name.split('-')[0] + '.tif', fixtures))).digest('hex'), dem.sha256);
      const width = 9;
      function makeTile(column, row, spacing) {
        return {column, row, spacing, field: {width, height: width, origin: [column, row],
          columnStep: [spacing, 0], rowStep: [0, spacing], heightReference: dem.heightReference,
          heights: Float64Array.from({length: width * width}, (_, i) =>
            dem.heights[(row + Math.floor(i / width) * spacing) * dem.width + column + (i % width) * spacing] ?? NaN)}};
      }
      for (const outputOwnership of ['copy', 'transfer']) {
        const handle = await runner.initializeTask(task, {}, {execution: 'worker'});
        try {
          const source = Array.from({length: 64}, (_, i) => makeTile((i % 8) * 32, Math.floor(i / 8) * 32, 4));
          source.push(...Array.from({length: 16}, (_, i) => makeTile(96 + (i % 4) * 8, 96 + Math.floor(i / 4) * 8, 1)));
          let {revision, tiles} = await handle.runTask({revision: 0, edits: source.map(tile => ({type: 'upsert', tile}))}, {outputOwnership});
          const current = new Map(tiles.map(tile => [key(tile), tile]));
          let changedBytes = 0, fullBytes = 0, changedTiles = 0;
          const workerTimes = [], fullTimes = [];
          for (let step = 0; step < 45; step++) {
            const slot = (step * 17) % source.length;
            const old = source[slot];
            const index = step % 3 === 0 ? 80 : 40;
            const value = old.field.heights[index];
            const height = step % 7 === 0 ? null : Number.isFinite(value) ? value + 1 : 0;
            const heights = old.field.heights.slice();
            heights[index] = height ?? NaN;
            source[slot] = {...old, field: {...old.field, heights}};
            const edit = {type: 'samples', address: {column: old.column, row: old.row, spacing: old.spacing},
              samples: [{index, height}]};
            const start = performance.now();
            const delta = await handle.runTask({revision, edits: [edit]}, {outputOwnership});
            const workerMs = performance.now() - start;
            assert.equal(delta.revision, revision + 1);
            revision = delta.revision;
            const fullStart = performance.now();
            const full = createTerrainMixedVertexTileHalos(source).tiles;
            const fullMs = performance.now() - fullStart;
            const changed = full.filter(tile => {
              const before = current.get(key(tile));
              const equal = (a, b) => a.every((value, i) => Object.is(value, b[i]));
              return !equal(tile.field.heights, before.field.heights) ||
                !equal(tile.field.validity, before.field.validity) || !equal(tile.statuses, before.statuses);
            });
            assert.deepEqual(delta.tiles, changed);
            assert.deepEqual(delta.removed, []);
            for (const tile of delta.tiles) current.set(key(tile), tile);
            assert.deepEqual(full.map(tile => current.get(key(tile))), full);
            if (step >= 5) {
              workerTimes.push(workerMs);
              fullTimes.push(fullMs);
              changedBytes += bytes(delta.tiles);
              fullBytes += bytes(full);
              changedTiles += delta.tiles.length;
            }
          }
          results.push({name, sha256: dem.sha256, outputOwnership, events: 40, changedTiles,
            changedBytes, fullBytes, workerP95Ms: p95(workerTimes), directFullP95Ms: p95(fullTimes)});
        } finally {
          await handle.close();
        }
      }
    }
  } finally {
    await runner.close();
  }
  console.log(JSON.stringify({node: process.version, platform: process.platform, arch: process.arch,
    processPeakRssKiB: process.resourceUsage().maxRSS, results}, null, 2));
} finally {
  rmSync(directory, {recursive: true, force: true});
}
