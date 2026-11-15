// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir, cpus, loadavg} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';
import {readSource, makeEvents, verify, percentiles} from './benchmark-terrain-worker-batching.mjs';
import {arrivalTrace, encode, decode} from './terrain-browser/replay.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'terrain-browser-'));
const repeats = Number(process.env.TERRAIN_REPEATS ?? 4);
assert.ok(Number.isInteger(repeats) && repeats >= 1 && repeats <= 10);
const frameWorkMs = Number(process.env.TERRAIN_FRAME_WORK_MS ?? 3);
assert.ok(Number.isFinite(frameWorkMs) && frameWorkMs >= 0 && frameWorkMs <= 10);
let browser;
let server;
const results = [];
const initialLoad = loadavg();
try {
  for (const [name, entry, platform] of [
    ['tasks', 'tasks/src/index.ts', 'browser'],
    ['task', 'geospatial/src/tasks/terrain-residency.ts', 'browser'],
    ['terrain', 'geospatial/src/terrain/index.ts', 'node']
  ])
    await bundleRuntime(
      root,
      'modules/' + entry,
      join(directory, name + '.mjs'),
      undefined,
      platform
    );
  writeFileSync(
    join(directory, 'replay.mjs'),
    readFileSync(new URL('./terrain-browser/replay.mjs', import.meta.url))
  );
  writeFileSync(
    join(directory, 'worker.mjs'),
    `
import {initializeTaskWorker} from './tasks.mjs';
import {TerrainResidencyTask} from './task.mjs';
initializeTaskWorker({...TerrainResidencyTask, async process(...args) {
  const entered = performance.timeOrigin + performance.now();
  const result = await TerrainResidencyTask.process(...args);
  return {...result, benchmark: {entered, exited: performance.timeOrigin + performance.now()}};
}});
`
  );
  const {createTerrainMixedVertexTileHalos: rebuild} = await import(
    pathToFileURL(join(directory, 'terrain.mjs'))
  );
  server = createServer((request, response) => {
    const name = request.url.slice(1);
    if (name === '') {
      response.end('<!doctype html><title>Terrain browser worker qualification</title>');
      return;
    }
    if (!['tasks.mjs', 'task.mjs', 'worker.mjs', 'replay.mjs'].includes(name)) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', 'text/javascript');
    response.end(readFileSync(join(directory, name)));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH});
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const browserVersion = browser.version();
  for (const name of ['pacific', 'sierra-nodata']) {
    const {source, sha256} = readSource(name);
    // Build an independent oracle for every edit prefix once, outside all browser timings.
    const edits = makeEvents(source, 1);
    const key = tile => `${tile.spacing}/${tile.column}/${tile.row}`;
    const inputs = new Map(source.map(tile => [key(tile), tile]));
    const oracle = [rebuild(source)];
    const oracleTimes = [];
    for (const {edit} of edits) {
      const tile = inputs.get(key(edit.address));
      const heights = tile.field.heights.slice();
      for (const sample of edit.samples) heights[sample.index] = sample.height ?? NaN;
      inputs.set(key(tile), {...tile, field: {...tile.field, heights}});
      const start = performance.now();
      oracle.push(rebuild([...inputs.values()]));
      oracleTimes.push(performance.now() - start);
    }
    for (const scenario of ['brush', 'streaming']) {
      const events = arrivalTrace(edits, scenario);
      const variants = ['copy', 'transfer'].flatMap(ownership =>
        ['single', 'opportunistic', 'bounded-wait'].map(policy => ({ownership, policy}))
      );
      for (let repeat = 0; repeat < repeats; repeat++) {
        // Rotate order and reverse alternating blocks to avoid always running one policy first.
        const order = variants.map((_, i) => variants[(i + repeat) % variants.length]);
        if (repeat % 2) order.reverse();
        for (const {ownership, policy} of order) {
          const raw = await page.evaluate(
            async ({input, ownership, policy, frameWorkMs}) => {
              const {TaskRunner} = await import('/tasks.mjs');
              const {TerrainResidencyTask} = await import('/task.mjs');
              const {decode, encode, replayBrowser} = await import('/replay.mjs');
              const {source, events} = decode(input);
              const runner = new TaskRunner();
              const task = {
                ...TerrainResidencyTask,
                worker: {
                  url: new URL('/worker.mjs', location.href),
                  capabilities: {atomic: true, streaming: false}
                }
              };
              let handle;
              try {
                handle = await runner.initializeTask(task, {}, {execution: 'worker'});
                const edits = source.map(tile => ({type: 'upsert', tile}));
                await handle.runTask({revision: 0, edits}, {outputOwnership: ownership});
                await handle.runTask(
                  {revision: 1, edits: events.slice(0, 16).map(e => e.edit)},
                  {outputOwnership: ownership}
                );
                await handle.runTask({revision: 2, edits}, {outputOwnership: ownership});
                const seed = await handle.runTask({type: 'snapshot'}, {outputOwnership: ownership});
                const result = await replayBrowser(handle, events, ownership, policy, frameWorkMs);
                return encode({seed, ...result});
              } finally {
                try {
                  await handle?.close();
                } finally {
                  await runner.close();
                }
              }
            },
            {input: encode({source, events}), ownership, policy, frameWorkMs}
          );
          const {seed, commits, epoch} = decode(raw);
          delete seed.benchmark;
          // Full rebuilds and bridge serialization occur after all measured acknowledgments.
          assert.deepEqual(
            commits.flatMap(c => c.batch.map(e => e.edit)),
            edits.map(e => e.edit)
          );
          let prefix = 0;
          const boundaries = [0, ...commits.map(c => (prefix += c.batch.length))];
          let oracleCursor = 0;
          verify(source, seed, commits, () => oracle[boundaries[oracleCursor++]]);
          assert.equal(oracleCursor, boundaries.length);
          assert.ok(commits.every(c => c.batch.length <= (policy === 'single' ? 1 : 8)));
          const samples = commits.flatMap(({batch, sentMs, ackMs, delta}) =>
            batch.map(event => ({
              scheduledMs: event.arrivalMs,
              observedMs: event.observedMs,
              sentMs,
              ackMs,
              arrivalDelayMs: event.observedMs - event.arrivalMs,
              queueMs: sentMs - event.observedMs,
              inboundMs: delta.benchmark.entered - epoch - sentMs,
              workerMs: delta.benchmark.exited - delta.benchmark.entered,
              outboundMs: epoch + ackMs - delta.benchmark.exited,
              editToAckMs: ackMs - event.arrivalMs,
              observedToAckMs: ackMs - event.observedMs
            }))
          );
          assert.equal(samples.length, events.length);
          for (const sample of samples)
            for (const value of Object.values(sample)) assert.ok(Number.isFinite(value));
          const metrics = Object.fromEntries(
            [
              'arrivalDelayMs',
              'queueMs',
              'inboundMs',
              'workerMs',
              'outboundMs',
              'editToAckMs',
              'observedToAckMs'
            ].map(k => [k, percentiles(samples.map(s => s[k]))])
          );
          results.push({
            name,
            sha256,
            residentTiles: source.length,
            scenario,
            repeat,
            ownership,
            policy,
            commits: commits.length,
            outputBufferBytes: commits.reduce(
              (sum, c) =>
                sum +
                c.delta.tiles.reduce(
                  (bytes, tile) =>
                    bytes +
                    tile.field.heights.byteLength +
                    tile.field.validity.byteLength +
                    tile.statuses.byteLength,
                  0
                ),
              0
            ),
            traceSha256: createHash('sha256')
              .update(JSON.stringify(encode(events)))
              .digest('hex'),
            metrics,
            oraclePrefixRebuildMs: percentiles(oracleTimes),
            stages: Object.fromEntries(
              Object.keys(commits[0].delta.timings).map(k => [
                k,
                percentiles(commits.map(c => c.delta.timings[k]))
              ])
            ),
            samples
          });
          console.error(
            `${name} ${scenario} ${repeat} ${ownership} ${policy}: p99=${metrics.editToAckMs.p99.toFixed(3)}ms; parity passed`
          );
        }
      }
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        revision: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
        browserVersion,
        node: process.version,
        cpu: cpus()[0].model,
        logicalCpus: cpus().length,
        initialLoad,
        finalLoad: loadavg(),
        frameWorkMs,
        harnessSha256: createHash('sha256')
          .update(readFileSync(fileURLToPath(import.meta.url)))
          .update(readFileSync(new URL('./terrain-browser/replay.mjs', import.meta.url)))
          .digest('hex'),
        workload:
          'Synthetic 60 Hz brush strokes and clustered streaming updates, with pauses; not captured user sessions.',
        bundleSha256: createHash('sha256')
          .update(readFileSync(join(directory, 'tasks.mjs')))
          .update(readFileSync(join(directory, 'task.mjs')))
          .digest('hex'),
        results
      },
      null,
      2
    )
  );
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  rmSync(directory, {recursive: true, force: true});
}
