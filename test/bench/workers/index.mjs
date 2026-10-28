// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {cpus} from 'node:os';
import {Worker} from 'node:worker_threads';
import {WorkerPool, WorkerFarm, processOnWorker, createWorkerResource, NullWorker} from '@math.gl/core/worker-utils';
import {projectBulkInWorker, setupMapInWorker, MapSetupWorker} from '@math.gl/geospatial/workers';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';

const quick = process.argv.includes('--quick');
const compare = process.argv.includes('--compare');
const output = process.argv.find(arg => arg.startsWith('--output='))?.slice(9);
const count = quick ? 100 : 1000;
const bufferBytes = quick ? 1024 * 1024 : 100 * 1024 * 1024;
const rows = quick ? 1000 : 1_000_000;
const report = {environment: {node: process.version, platform: process.platform,
  arch: process.arch, cpu: cpus()[0]?.model, logicalCpus: cpus().length,
  quick, timestamp: new Date().toISOString()}, workloads: [], comparators: {}};

async function measure(name, repeats, fn) {
  const times = [];
  const memoryBefore = process.memoryUsage();
  let peakSampledRss = memoryBefore.rss;
  const sampler = setInterval(() => {peakSampledRss = Math.max(peakSampledRss, process.memoryUsage().rss);}, 5);
  const cpuBefore = process.cpuUsage();
  try {
    for (let i = 0; i < repeats; i++) {
      const start = performance.now();
      await fn(i);
      times.push(performance.now() - start);
      peakSampledRss = Math.max(peakSampledRss, process.memoryUsage().rss);
    }
  } finally {clearInterval(sampler);}
  const sorted = [...times].sort((a, b) => a - b);
  const totalMs = times.reduce((sum, value) => sum + value, 0);
  const result = {name, repeats, coldMs: times[0], p50Ms: sorted[Math.floor(sorted.length * .5)],
    p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))],
    totalMs, operationsPerSecond: repeats * 1000 / totalMs,
    warmMeanMs: times.length > 1 ? times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1) : null,
    sampledPeakRss: peakSampledRss, rssBefore: memoryBefore.rss, rssAfter: process.memoryUsage().rss,
    cpuMicros: process.cpuUsage(cpuBefore)};
  report.workloads.push(result);
  return result;
}

const echoPool = new WorkerPool({url: NullWorker.worker, maxConcurrency: 1});
try {
  await measure('math.gl/tiny-sequential', count, async () => {
    assert.equal(await processOnWorker(NullWorker, 42, {workerPool: echoPool}), 42);
  });
  for (const inputOwnership of ['copy', 'transfer']) {
    await measure(`math.gl/${bufferBytes}-bytes-${inputOwnership}`, quick ? 2 : 5, async () => {
      const data = new Uint8Array(bufferBytes);
      data[0] = 17;
      const result = await processOnWorker(NullWorker, data, {workerPool: echoPool, inputOwnership});
      assert.equal(result[0], 17);
      assert.equal(result.byteLength, bufferBytes);
      assert.equal(data.byteLength, inputOwnership === 'transfer' ? 0 : bufferBytes);
    });
  }
} finally {await echoPool.destroy();}

const raw = new Worker("require('worker_threads').parentPort.on('message', value => require('worker_threads').parentPort.postMessage(value));", {eval: true});
try {
  await measure('raw-worker/tiny-sequential', count, () => new Promise((resolve, reject) => {
    raw.once('error', reject);
    raw.once('message', value => {raw.removeListener('error', reject); assert.equal(value, 42); resolve();});
    raw.postMessage(42);
  }));
} finally {await raw.terminate();}
await measure('direct/tiny-sequential', count, async () => assert.equal(42, 42));

const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};
const coordinates = new Float64Array(rows * 2);
for (let i = 0; i < rows; i++) {coordinates[i * 2] = i % 360 - 180; coordinates[i * 2 + 1] = i % 160 - 80;}
const expected = new FullProjectionEngine().createProjection(projection).projectFlatSync(coordinates.slice(), 2);
const descriptor = {id: 'persistent-projection', name: 'Persistent projection', module: 'geospatial', version: 'latest', options: {},
  worker: new URL('./resource.mjs', import.meta.url).href};
let resource;
await measure('math.gl/persistent-initialize', 1, async () => {resource = await createWorkerResource(descriptor, projection);});
try {
  await measure(`math.gl/persistent-projection-${rows}`, quick ? 2 : 5, async () => {
    assert.deepEqual(await resource.run(coordinates.slice(), {inputOwnership: 'transfer'}), expected);
  });
} finally {await resource.destroy();}
await measure(`math.gl/stateless-projection-${rows}`, quick ? 2 : 5, async () => {
  assert.deepEqual(await projectBulkInWorker({projection, coordinates: coordinates.slice()}, {inputOwnership: 'transfer'}), expected);
});
await measure(`direct/projection-${rows}`, quick ? 2 : 5, async () => {
  assert.deepEqual(new FullProjectionEngine().createProjection(projection).projectFlatSync(coordinates.slice(), 2), expected);
});

const maps = quick ? 5 : 100;
const mapPool = new WorkerPool({url: MapSetupWorker.worker, maxConcurrency: 2, maxQueuedJobs: 4,
  maxQueuedBytes: 1024, maxInFlightBytes: 1024, maxPendingAdmissions: maps});
try {
  let cancelled = 0;
  await measure(`math.gl/${maps}-concurrent-maps`, 1, async () => {
    await Promise.all(Array.from({length: maps}, async (_, i) => {
      const controller = new AbortController();
      const timer = i % 3 === 0 ? setTimeout(() => controller.abort(), 5) : undefined;
      let admission;
      try {
        admission = await mapPool.reserve(0, {signal: controller.signal});
        await setupMapInWorker({version: 1, id: `map-${i}`, definition: {type: 'mercator'}},
          {workerPool: mapPool, admission, signal: controller.signal});
      } catch (error) {if (controller.signal.aborted) cancelled++; else throw error;}
      finally {clearTimeout(timer); admission?.release();}
    }));
  });
  report.mapPool = {...mapPool.stats, cancelledRequests: cancelled};
} finally {await mapPool.destroy();}

const crashDescriptor = {...NullWorker, worker: new URL('../../../modules/core/test/worker-utils/fixtures/runtime-worker.mjs', import.meta.url).href};
const crashPool = new WorkerPool({url: crashDescriptor.worker, maxConcurrency: 1});
try {
  await measure('math.gl/crash-recovery', quick ? 2 : 10, async () => {
    await assert.rejects(processOnWorker(crashDescriptor, {mode: 'crash'}, {workerPool: crashPool}));
    assert.equal(await processOnWorker(crashDescriptor, 7, {workerPool: crashPool}), 7);
  });
} finally {await crashPool.destroy();}
await measure('math.gl/initialize-destroy', quick ? 3 : 50, async () => {
  const pool = new WorkerPool({url: NullWorker.worker, maxConcurrency: 1});
  try {await processOnWorker(NullWorker, 1, {workerPool: pool});}
  finally {await pool.destroy();}
  assert.equal(pool.stats.activeJobs, 0);
});

if (compare) {
  const {default: Piscina} = await import('piscina');
  const piscina = new Piscina({filename: new URL('./piscina.mjs', import.meta.url).pathname, minThreads: 1, maxThreads: 1});
  const {default: workerpool} = await import('workerpool');
  const workers = workerpool.pool(new URL('./workerpool.mjs', import.meta.url).pathname, {minWorkers: 1, maxWorkers: 1, workerType: 'thread'});
  const Comlink = await import('comlink');
  const {default: nodeEndpoint} = await import('comlink/dist/esm/node-adapter.mjs');
  const thread = new Worker(new URL('./comlink.mjs', import.meta.url));
  const rpc = Comlink.wrap(nodeEndpoint(thread));
  try {
    for (const [name, run] of [['piscina', () => piscina.run(42)], ['workerpool', () => workers.exec('echo', [42])], ['comlink', () => rpc.echo(42)]]) {
      report.comparators[name] = JSON.parse(await readFile(new URL(`./node_modules/${name}/package.json`, import.meta.url), 'utf8')).version;
      await measure(`${name}/tiny-sequential`, count, async () => assert.equal(await run(), 42));
    }
    for (const [name, run] of [
      ['piscina', data => piscina.run(data, {transferList: [data.buffer]})],
      ['workerpool', data => workers.exec('echo', [data], {transfer: [data.buffer]})],
      ['comlink', data => rpc.echo(Comlink.transfer(data, [data.buffer]))]
    ]) {
      await measure(`${name}/${bufferBytes}-bytes-transfer-roundtrip`, quick ? 2 : 5, async () => {
        const input = new Uint8Array(bufferBytes);
        input[0] = 17;
        const result = await run(input);
        assert.equal(input.byteLength, 0);
        assert.equal(result[0], 17);
        assert.equal(result.byteLength, bufferBytes);
      });
    }
  } finally {
    rpc[Comlink.releaseProxy]();
    await Promise.all([piscina.destroy(), workers.terminate(), thread.terminate()]);
  }
}
await WorkerFarm.getWorkerFarm().destroy();
const json = `${JSON.stringify(report, null, 2)}\n`;
if (output) await writeFile(output, json);
process.stdout.write(json);
