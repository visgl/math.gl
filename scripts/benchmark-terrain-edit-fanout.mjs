// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = execFileSync('git', ['rev-parse', process.argv[2] ?? 'origin/master'], {cwd: root, encoding: 'utf8'}).trim();
const directory = mkdtempSync(join(tmpdir(), 'terrain-edit-fanout-'));
const p95 = times => [...times].sort((a, b) => a - b)[Math.ceil(times.length * 0.95) - 1];
const bytes = tile => tile.field.heights.byteLength + tile.field.validity.byteLength + tile.statuses.byteLength;
const entry = './modules/geospatial/src/terrain/index.ts';

try {
  const apis = [];
  for (const [name, revision] of [['baseline', baseline], ['candidate', undefined]]) {
    const output = join(directory, name + '.mjs');
    await bundleRuntime(root, entry, output, revision);
    apis.push(await import(pathToFileURL(output)));
  }
  const results = [];
  for (const name of ['pacific', 'sierra-nodata']) {
    const fixtures = new URL('../modules/geospatial/test/terrain/fixtures/', import.meta.url);
    const dem = JSON.parse(readFileSync(new URL(name + '-streaming.json', fixtures)));
    const raw = readFileSync(new URL(name.split('-')[0] + '.tif', fixtures));
    assert.equal(createHash('sha256').update(raw).digest('hex'), dem.sha256);
    const width = 9;
    const tile = (column, row, spacing) => ({
      column, row, spacing,
      field: {
        width, height: width, origin: [column, row], columnStep: [spacing, 0],
        rowStep: [0, spacing], heightReference: dem.heightReference,
        heights: Float64Array.from({length: width * width}, (_, i) =>
          dem.heights[(row + Math.floor(i / width) * spacing) * dem.width + column + (i % width) * spacing] ?? NaN)
      }
    });
    for (const pattern of ['interior', 'corner', 'burst']) {
      const resident = Array.from({length: 64}, (_, i) => tile((i % 8) * 32, Math.floor(i / 8) * 32, 4));
      resident.push(...Array.from({length: 16}, (_, i) => tile(96 + (i % 4) * 8, 96 + Math.floor(i / 4) * 8, 1)));
      const states = apis.map(api => api.updateTerrainMixedVertexTileHalos(null, resident));
      const metrics = apis.map(() => ({times: [], rebuilt: 0, bytes: 0}));
      const fullTimes = [];
      for (let step = 0; step < 45; step++) {
        for (let n = 0; n < (pattern === 'burst' ? 4 : 1); n++) {
          const slot = (step * 17 + n * 11) % resident.length;
          const source = resident[slot];
          const heights = source.field.heights.slice();
          const i = pattern === 'corner' ? width * width - 1 : 4 * width + 4;
          heights[i] = Number.isFinite(heights[i]) ? heights[i] + 1 : 0;
          resident[slot] = {...source, field: {...source.field, heights}};
        }
        for (const i of step % 2 === 0 ? [0, 1] : [1, 0]) {
          const start = performance.now();
          states[i] = apis[i].updateTerrainMixedVertexTileHalos(states[i], resident);
          const elapsed = performance.now() - start;
          if (step >= 5) {
            const rebuilt = new Set(states[i].rebuilt);
            metrics[i].times.push(elapsed);
            metrics[i].rebuilt += rebuilt.size;
            metrics[i].bytes += states[i].tiles
              .filter(t => rebuilt.has(`${t.spacing}/${t.column}/${t.row}`))
              .reduce((sum, t) => sum + bytes(t), 0);
          }
        }
        const start = performance.now();
        const full = apis[0].createTerrainMixedVertexTileHalos(resident);
        const elapsed = performance.now() - start;
        if (step >= 5) fullTimes.push(elapsed);
        for (const state of states) assert.deepEqual(state.tiles, full.tiles);
      }
      const summarize = ({times, rebuilt, bytes}) => ({p95Ms: p95(times), rebuilt, bytes});
      results.push({name, pattern, demSha256: dem.sha256, events: 40,
        baseline: summarize(metrics[0]), candidate: summarize(metrics[1]), fullP95Ms: p95(fullTimes)});
    }
  }
  console.log(JSON.stringify({baseline, node: process.version, platform: process.platform,
    arch: process.arch, processPeakRssKiB: process.resourceUsage().maxRSS, results}, null, 2));
} finally {
  rmSync(directory, {recursive: true, force: true});
}
