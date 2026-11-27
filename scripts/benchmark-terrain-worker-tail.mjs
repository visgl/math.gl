// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir, loadavg, cpus} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';
import {
  readSource,
  makeEvents,
  replay,
  verify,
  percentiles
} from './benchmark-terrain-worker-batching.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'terrain-tail-'));
const repeats = Number(process.env.TERRAIN_TAIL_REPEATS ?? 4);
assert.ok(Number.isInteger(repeats) && repeats > 0 && repeats <= 10);
const refs = (process.env.TERRAIN_TAIL_REFS ?? 'aeb20e6e,4f523e14,working-tree').split(',');
const profile = process.env.TERRAIN_PROFILE === '1';
const results = [];
try {
  const runtimes = [];
  for (const [slot, ref] of refs.entries()) {
    const revision =
      ref === 'working-tree'
        ? undefined
        : execFileSync('git', ['rev-parse', '--verify', ref + '^{commit}'], {
            cwd: root,
            encoding: 'utf8'
          }).trim();
    const urls = [];
    const sourceHash = createHash('sha256');
    for (const [i, entry] of [
      'geospatial/src/terrain/index.ts',
      'tasks/src/index.ts',
      'geospatial/src/tasks/terrain-residency.ts'
    ].entries()) {
      const file = join(directory, `${slot}-${i}.mjs`);
      await bundleRuntime(root, './modules/' + entry, file, revision, 'node');
      sourceHash.update(readFileSync(file));
      urls.push(pathToFileURL(file).href);
    }
    // Instrument only the benchmark worker. No profiling code enters runtime exports.
    const worker = join(directory, `${slot}-worker.mjs`);
    writeFileSync(
      worker,
      `
import {initializeTaskWorker} from ${JSON.stringify(urls[1])};
import {TerrainResidencyTask} from ${JSON.stringify(urls[2])};
import {Session} from 'node:inspector/promises';
import {PerformanceObserver} from 'node:perf_hooks';
const session = new Session();
const gc = [];
const observer = new PerformanceObserver(list => {for (const entry of list.getEntries()) gc.push({start: entry.startTime, duration: entry.duration});});
observer.observe({entryTypes: ['gc']});
let heapPeak = 0, arrayBufferPeak = 0;
let transportTemplate;
const clock = () => performance.timeOrigin + performance.now();
await initializeTaskWorker({...TerrainResidencyTask, async process(input, options, context) {
  if (input.type === 'set-transport-template') {transportTemplate = input.template; return {};}
  if (input.type === 'transport-control') {
    const entered = clock();
    const result = structuredClone(transportTemplate);
    const exited = clock();
    return {...result, benchmarkTransport: {entered, exited}};
  }
  if (input.type === 'retained-memory') {
    transportTemplate = undefined;
    session.connect();
    await session.post('HeapProfiler.collectGarbage');
    session.disconnect();
    return process.memoryUsage();
  }
  if (input.type === 'begin-profile') {
    if (input.sample) {session.connect(); await session.post('HeapProfiler.collectGarbage'); await new Promise(resolve => setImmediate(resolve));}
    gc.length = 0;
    const before = process.memoryUsage();
    heapPeak = before.heapUsed; arrayBufferPeak = before.arrayBuffers;
    if (input.sample) {await session.post('Profiler.enable'); await session.post('Profiler.start'); await session.post('HeapProfiler.startSampling', {samplingInterval: 4096, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true});}
    return before;
  }
  if (input.type === 'end-profile') {
    await new Promise(resolve => setImmediate(resolve));
    const memory = process.memoryUsage();
    const result = {memory, heapPeak, arrayBufferPeak, gc};
    if (input.sample) {result.allocationProfile = (await session.post('HeapProfiler.stopSampling')).profile; result.cpuProfile = (await session.post('Profiler.stop')).profile; session.disconnect();}
    return result;
  }
  const entered = clock();
  const result = await TerrainResidencyTask.process(input, options, context);
  const exited = clock();
  // Memory observation is optional because it perturbs timing.
  if (${profile}) {const memory = process.memoryUsage(); heapPeak = Math.max(heapPeak, memory.heapUsed); arrayBufferPeak = Math.max(arrayBufferPeak, memory.arrayBuffers);}
  return {...result, benchmarkTransport: {entered, exited, workerStartMs: entered - performance.timeOrigin, workerEndMs: exited - performance.timeOrigin}};
}});
`
    );
    runtimes.push({
      ref,
      revision,
      sourceSha256: sourceHash.digest('hex'),
      terrain: await import(urls[0]),
      tasks: await import(urls[1]),
      task: {
        ...(await import(urls[2])).TerrainResidencyTask,
        worker: {url: pathToFileURL(worker), capabilities: {atomic: true, streaming: false}}
      }
    });
  }
  for (const name of (process.env.TERRAIN_DEMS ?? 'pacific,sierra-nodata').split(',')) {
    const {source, sha256} = readSource(name);
    // Rebuild every edit prefix once, independently of the incremental path. Keep
    // this main-thread oracle outside timing and reuse it across interleaved runs.
    const oracleSources = new Map(
      source.map(tile => [`${tile.spacing}/${tile.column}/${tile.row}`, tile])
    );
    const rebuild = runtimes[0].terrain.createTerrainMixedVertexTileHalos;
    const oracle = [rebuild(source)];
    const rebuildTimes = [];
    for (const {edit} of makeEvents(source, 1)) {
      const key = `${edit.address.spacing}/${edit.address.column}/${edit.address.row}`;
      const tile = oracleSources.get(key),
        heights = tile.field.heights.slice();
      for (const {index, height} of edit.samples) heights[index] = height ?? NaN;
      oracleSources.set(key, {...tile, field: {...tile.field, heights}});
      const start = performance.now();
      oracle.push(rebuild([...oracleSources.values()]));
      rebuildTimes.push(performance.now() - start);
    }
    for (const burstSize of (process.env.TERRAIN_BURSTS ?? '1,8').split(',').map(Number))
      for (const outputOwnership of ['copy', 'transfer']) {
        const events = makeEvents(source, burstSize);
        for (const config of [
          {policy: 'single', maxBatchSize: 1, maxWaitMs: 0},
          {policy: 'opportunistic', maxBatchSize: 8, maxWaitMs: 0},
          {policy: 'bounded-wait', maxBatchSize: 8, maxWaitMs: 2}
        ].filter(
          config => !process.env.TERRAIN_POLICY || config.policy === process.env.TERRAIN_POLICY
        )) {
          for (let repeat = 0; repeat < repeats; repeat++) {
            // Alternate complete trials; never run baseline and candidate concurrently.
            const order = repeat % 2 ? [...runtimes].reverse() : runtimes;
            for (const runtime of order) {
              const runner = new runtime.tasks.TaskRunner();
              const handle = await runner.initializeTask(
                runtime.task,
                {},
                {execution: 'worker'}
              );
              try {
                const upserts = source.map(tile => ({type: 'upsert', tile}));
                await handle.runTask({revision: 0, edits: upserts}, {outputOwnership});
                await handle.runTask(
                  {revision: 1, edits: events.slice(0, 16).map(event => event.edit)},
                  {outputOwnership}
                );
                await handle.runTask({revision: 2, edits: upserts}, {outputOwnership});
                const seed = await handle.runTask({type: 'snapshot'}, {outputOwnership});
                const memoryBefore = await handle.runTask({
                  type: 'begin-profile',
                  sample: profile
                });
                const wire = [];
                const measuredHandle = {
                  async runTask(input, options) {
                    const sent = performance.timeOrigin + performance.now();
                    const result = await handle.runTask(input, options);
                    const received = performance.timeOrigin + performance.now();
                    wire.push({
                      workerStartMs: result.benchmarkTransport.workerStartMs,
                      workerEndMs: result.benchmarkTransport.workerEndMs,
                      inboundMs: result.benchmarkTransport.entered - sent,
                      outboundMs: received - result.benchmarkTransport.exited
                    });
                    return result;
                  }
                };
                const loadBefore = loadavg();
                const commits = await replay(
                  measuredHandle,
                  events,
                  seed.revision,
                  outputOwnership,
                  config
                );
                const memoryAfter = await handle.runTask({
                  type: 'end-profile',
                  sample: profile
                });
                if (profile)
                  memoryAfter.retained = await handle.runTask({type: 'retained-memory'});
                // Match a representative reply payload while bypassing terrain work.
                // Clone time remains explicit; controls run outside the edit window.
                const template = [...commits].sort(
                  (a, b) => a.delta.tiles.length - b.delta.tiles.length
                )[Math.floor(commits.length / 2)].delta;
                await handle.runTask({type: 'set-transport-template', template});
                const controls = [];
                for (let i = 0; i < 32; i++) {
                  const sent = performance.timeOrigin + performance.now();
                  const result = await handle.runTask(
                    {type: 'transport-control'},
                    {outputOwnership}
                  );
                  const received = performance.timeOrigin + performance.now();
                  controls.push({
                    inboundMs: result.benchmarkTransport.entered - sent,
                    cloneMs:
                      result.benchmarkTransport.exited - result.benchmarkTransport.entered,
                    outboundMs: received - result.benchmarkTransport.exited,
                    requestMs: received - sent
                  });
                }
                const transportControl = {
                  tiles: template.tiles.length,
                  outputBytes: template.tiles.reduce(
                    (sum, tile) =>
                      sum +
                      tile.field.heights.byteLength +
                      tile.field.validity.byteLength +
                      tile.statuses.byteLength,
                    0
                  ),
                  stages: Object.fromEntries(
                    Object.keys(controls[0]).map(stage => [
                      stage,
                      percentiles(controls.map(sample => sample[stage]))
                    ])
                  )
                };
                // Full rebuilds and direct incremental measurements are outside worker timing.
                let verificationCall = -1,
                  verifiedPrefix = 0;
                const checked = verify(source, seed, commits, () => {
                  if (verificationCall >= 0)
                    verifiedPrefix += commits[verificationCall].batch.length;
                  verificationCall++;
                  return oracle[verifiedPrefix];
                });
                let direct = runtime.terrain.updateTerrainMixedVertexTileHalos(null, source);
                const resident = new Map(
                  source.map(tile => [`${tile.spacing}/${tile.column}/${tile.row}`, tile])
                );
                const directMs = [];
                let directPrefix = 0;
                for (const {batch} of commits) {
                  for (const {edit} of batch) {
                    const key = `${edit.address.spacing}/${edit.address.column}/${edit.address.row}`;
                    const tile = resident.get(key),
                      heights = tile.field.heights.slice();
                    for (const {index, height} of edit.samples) heights[index] = height ?? NaN;
                    resident.set(key, {...tile, field: {...tile.field, heights}});
                  }
                  const start = performance.now();
                  direct = runtime.terrain.updateTerrainMixedVertexTileHalos(direct, [
                    ...resident.values()
                  ]);
                  directMs.push(performance.now() - start);
                  directPrefix += batch.length;
                  assert.deepEqual(direct.tiles, oracle[directPrefix].tiles);
                }
                assert.deepEqual(direct.tiles, checked.final);
                const samples = commits.map(({batch, sentMs, ackMs, delta}, i) => ({
                  edits: batch.length,
                  queueMs: batch.map(event => sentMs - event.arrivalMs),
                  editToAckMs: batch.map(event => ackMs - event.arrivalMs),
                  requestMs: ackMs - sentMs,
                  ...wire[i],
                  ...delta.timings
                }));
                const stages = Object.fromEntries(
                  [
                    'requestMs',
                    'inboundMs',
                    'outboundMs',
                    ...Object.keys(commits[0].delta.timings)
                  ].map(stage => [stage, percentiles(samples.map(sample => sample[stage]))])
                );
                results.push({
                  name,
                  sha256,
                  ref: runtime.ref,
                  sourceSha256: runtime.sourceSha256,
                  loadBefore,
                  loadAfter: loadavg(),
                  revision: runtime.revision ?? 'working-tree',
                  repeat,
                  residentTiles: source.length,
                  burstSize,
                  outputOwnership,
                  ...config,
                  stages,
                  editToAckMs: percentiles(samples.flatMap(sample => sample.editToAckMs)),
                  queueMs: percentiles(samples.flatMap(sample => sample.queueMs)),
                  directIncrementalMs: percentiles(directMs),
                  directRebuildMs: percentiles(rebuildTimes),
                  transportControl,
                  memoryBefore,
                  memoryAfter,
                  samples
                });
                if (process.env.TERRAIN_CHECKPOINT)
                  writeFileSync(
                    process.env.TERRAIN_CHECKPOINT,
                    JSON.stringify({profile, results})
                  );
                process.stderr.write(
                  `${name} ${runtime.ref} ${outputOwnership} burst=${burstSize} ${config.policy} repeat=${repeat}: parity passed\n`
                );
              } finally {
                await handle.close();
                await runner.close();
              }
            }
          }
        }
      }
  }
  console.log(
    JSON.stringify(
      {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cpu: cpus()[0]?.model,
        logicalCpus: cpus().length,
        profile,
        notes:
          'Interleaved isolated workers. Inbound/outbound include scheduling and structured-clone/transfer; not pure wire time. GC/heap sampling runs are diagnostic, not latency evidence. Worker heap/ArrayBuffer peaks are sampled only in profile mode; RSS is process-wide and includes the retained main-thread oracle. Quantiles are per run, never differences of independent percentiles.',
        results
      },
      null,
      2
    )
  );
} finally {
  rmSync(directory, {recursive: true, force: true});
}
