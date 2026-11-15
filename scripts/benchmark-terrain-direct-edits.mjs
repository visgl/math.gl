// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';
import {readSource, makeEvents, percentiles} from './benchmark-terrain-worker-batching.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'terrain-direct-'));
const variants = [];
// Warm each revision identically before measuring, independent of worker scheduling.
const repeats = Number(process.env.TERRAIN_DIRECT_REPEATS ?? 8);
assert.ok(Number.isInteger(repeats) && repeats >= 1 && repeats <= 16);
try {
  for (const ref of ['4f523e14', undefined]) {
    const path = join(dir, (ref ?? 'next') + '.mjs');
    await bundleRuntime(root, './modules/geospatial/src/terrain/index.ts', path, ref, 'node');
    variants.push({ref: ref ?? 'working-tree', api: await import(pathToFileURL(path))});
  }
  const results = [];
  for (const name of ['pacific', 'sierra-nodata']) {
    const {source} = readSource(name),
      events = makeEvents(source, 1);
    const sources = [source];
    for (const {edit} of events) {
      const next = sources.at(-1).slice();
      const i = next.findIndex(
        t =>
          t.column === edit.address.column &&
          t.row === edit.address.row &&
          t.spacing === edit.address.spacing
      );
      const old = next[i],
        heights = old.field.heights.slice();
      for (const {index, height} of edit.samples) heights[index] = height ?? NaN;
      next[i] = {...old, field: {...old.field, heights}};
      sources.push(next);
    }
    // Historical full rebuilds qualify every measured and warmup snapshot.
    const oracle = sources.map(s => variants[0].api.createTerrainMixedVertexTileHalos(s));
    for (let repeat = 0; repeat < repeats; repeat++)
      for (const v of repeat % 2 ? [...variants].reverse() : variants) {
        let state = null;
        const times = [];
        for (let pass = 0; pass < 2; pass++) {
          state = v.api.updateTerrainMixedVertexTileHalos(null, source);
          for (let i = 1; i < sources.length; i++) {
            const start = performance.now();
            state = v.api.updateTerrainMixedVertexTileHalos(state, sources[i]);
            if (pass) times.push(performance.now() - start);
            assert.deepEqual(state.tiles, oracle[i].tiles);
          }
        }
        results.push({name, ref: v.ref, repeat, ms: percentiles(times)});
      }
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  rmSync(dir, {recursive: true, force: true});
}
