// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Worker} from 'node:worker_threads';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';

const quick = process.argv.includes('--quick');
const directory = mkdtempSync(join(tmpdir(), 'terrain-residency-sweep-'));
const p95 = times => [...times].sort((a, b) => a - b)[Math.ceil(times.length * 0.95) - 1];
const bytes = tile => tile.field.heights.byteLength + tile.field.validity.byteLength + tile.statuses.byteLength;
const key = tile => `${tile.spacing}/${tile.column}/${tile.row}`;

function makeResidencyTile(width, nodata, column, row, spacing, edit = 0) {
      const heights = Float64Array.from({length: width * width}, (_, index) => {
        const x = column + (index % width) * spacing;
        const y = row + Math.floor(index / width) * spacing;
        return nodata && (x + 3 * y) % 23 === 0 ? NaN : Math.sin(x / 13) * 40 + Math.cos(y / 17) * 25 + edit;
      });
      return {column, row, spacing, field: {width, height: width, heights, registration: 'vertex',
        origin: [column, row], columnStep: [spacing, 0], rowStep: [0, spacing]}};
}

function makeRegion(side, width, nodata, ratio) {
  const stride = (width - 1) * ratio;
  return Array.from({length: side * side}, (_, index) =>
    makeResidencyTile(width, nodata, (index % side) * stride, Math.floor(index / side) * stride, ratio));
}

const workerBody = `
import {parentPort, workerData} from 'node:worker_threads';
const {createTerrainMixedVertexTileHalos} = await import(workerData);
parentPort.on('message', ({resident, ownership}) => {
  const start = performance.now();
  const tiles = createTerrainMixedVertexTileHalos(resident).tiles;
  const serviceMs = performance.now() - start;
  const buffers = ownership === 'transfer'
    ? [...new Set(tiles.flatMap(tile => [tile.field.heights.buffer, tile.field.validity.buffer, tile.statuses.buffer]))]
    : [];
  parentPort.postMessage({tiles, serviceMs}, buffers);
});
parentPort.postMessage({ready: true});
`;

function receive(worker) {
  return new Promise((resolve, reject) => {
    function cleanup() {
      worker.off('message', onMessage);
      worker.off('error', onError);
      worker.off('exit', onExit);
    }
    function onMessage(message) { cleanup(); resolve(message); }
    function onError(error) { cleanup(); reject(error); }
    function onExit(code) { onError(new Error("Benchmark worker exited with code " + code)); }
    worker.once('message', onMessage);
    worker.once('error', onError);
    worker.once('exit', onExit);
  });
}

async function measureWorkers(output, build, side, width, ownership, workerCount, jobs) {
  const region = makeRegion(side, width, true, 4);
  // Include fine coverage so the worker exercises the mixed-resolution path.
  region.push(makeResidencyTile(width, true, 0, 0, 1));
  const expected = build(region).tiles;
  const inputBytes = region.reduce((sum, tile) => sum + tile.field.heights.byteLength, 0);
  const outputBytes = expected.reduce((sum, tile) => sum + bytes(tile), 0);
  const payloads = Array.from({length: jobs}, () => structuredClone(region));
  const workerUrl = new URL('data:text/javascript,' + encodeURIComponent(workerBody));
  const workers = [];
  async function submit(worker, resident) {
    const response = receive(worker);
    const buffers = ownership === 'transfer' ? resident.map(tile => tile.field.heights.buffer) : [];
    worker.postMessage({resident, ownership}, buffers);
    return response;
  }
  try {
    const startup = performance.now();
    for (let index = 0; index < workerCount; index++) {
      workers.push(new Worker(workerUrl, {workerData: pathToFileURL(output).href}));
    }
    await Promise.all(workers.map(receive));
    const startupMs = performance.now() - startup;
    await Promise.all(workers.map(async worker => {
      assert.deepEqual((await submit(worker, structuredClone(region))).tiles, expected);
    }));
    const enqueued = performance.now();
    let next = 0;
    let finished = enqueued;
    const results = [];
    await Promise.all(workers.map(async worker => {
      for (;;) {
        const index = next++;
        if (index >= jobs) return;
        const dispatched = performance.now();
        const {tiles, serviceMs} = await submit(worker, payloads[index]);
        finished = performance.now();
        results.push({queueMs: dispatched - enqueued, roundTripMs: finished - dispatched,
          latencyMs: finished - enqueued, serviceMs, tiles});
      }
    }));
    for (const {tiles} of results) assert.deepEqual(tiles, expected);
    for (const payload of payloads) {
      assert.equal(payload.reduce((sum, tile) => sum + tile.field.heights.byteLength, 0),
        ownership === 'transfer' ? 0 : inputBytes);
    }
    return {
      residentCoarseTiles: side * side, width, ownership, workerCount, jobs,
      startupMs, inputBytes, outputBytes, jobsPerSecond: jobs * 1000 / (finished - enqueued),
      queueP95Ms: p95(results.map(result => result.queueMs)),
      roundTripP95Ms: p95(results.map(result => result.roundTripMs)),
      latencyP95Ms: p95(results.map(result => result.latencyMs)),
      serviceP95Ms: p95(results.map(result => result.serviceMs))
    };
  } finally {
    await Promise.all(workers.map(worker => worker.terminate()));
  }
}

try {
  const output = join(directory, 'terrain.mjs');
  await bundleRuntime(fileURLToPath(new URL('../', import.meta.url)), './modules/geospatial/src/terrain/index.ts', output);
  const {createTerrainMixedVertexTileHalos, updateTerrainMixedVertexTileHalos} = await import(pathToFileURL(output));

  function replay(side, width, nodata, ratio, rounds) {
    const resident = makeRegion(side, width, nodata, ratio);
    const makeTile = (column, row, spacing, edit) =>
      makeResidencyTile(width, nodata, column, row, spacing, edit);
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
  const results = cases.flatMap(args => replay(...args, quick ? 3 : 20));
  const workers = [];
  for (const [side, width] of quick ? [[2, 9]] : [[2, 17], [8, 33]]) {
    for (const workerCount of quick ? [1, 2] : [1, 2, 4]) {
      for (const ownership of ['copy', 'transfer']) {
        workers.push(await measureWorkers(output, createTerrainMixedVertexTileHalos,
          side, width, ownership, workerCount, quick ? 4 : 20));
      }
    }
  }
  console.log(JSON.stringify({
    runtime: process.version, platform: process.platform, architecture: process.arch,
    timingScope: 'Update only. One warm-up per event. Rebuilt bytes count output buffers, not internal copies.',
    results,
    workers,
    processPeakRssKiB: process.resourceUsage().maxRSS
  }, null, 2));
} finally {
  rmSync(directory, {recursive: true, force: true});
}
