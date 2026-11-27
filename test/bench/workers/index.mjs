// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {TaskRunner, preloadTasks} from '@math.gl/tasks';
import {readFile, writeFile} from 'node:fs/promises';
import {cpus} from 'node:os';
import {Worker} from 'node:worker_threads';
import {ProjectCoordinatesTask, PrepareMapTask} from '@math.gl/geospatial/tasks';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';

const quick = process.argv.includes('--quick');
const compare = process.argv.includes('--compare');
const output = process.argv.find(arg => arg.startsWith('--output='))?.slice(9);
const count = quick ? 100 : 1000;
const bufferBytes = quick ? 1024 * 1024 : 100 * 1024 * 1024;
const rows = quick ? 1000 : 1_000_000;
const report = {
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    logicalCpus: cpus().length,
    quick,
    timestamp: new Date().toISOString()
  },
  workloads: [],
  comparators: {}
};

async function measure(name, repeats, fn) {
  const times = [];
  const memoryBefore = process.memoryUsage();
  let peakSampledRss = memoryBefore.rss;
  const sampler = setInterval(() => {
    peakSampledRss = Math.max(peakSampledRss, process.memoryUsage().rss);
  }, 5);
  const cpuBefore = process.cpuUsage();
  try {
    for (let i = 0; i < repeats; i++) {
      const start = performance.now();
      await fn(i);
      times.push(performance.now() - start);
      peakSampledRss = Math.max(peakSampledRss, process.memoryUsage().rss);
    }
  } finally {
    clearInterval(sampler);
  }
  const sorted = [...times].sort((a, b) => a - b);
  const totalMs = times.reduce((sum, value) => sum + value, 0);
  const result = {
    name,
    repeats,
    coldMs: times[0],
    p50Ms: sorted[Math.floor(sorted.length * 0.5)],
    p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
    totalMs,
    operationsPerSecond: (repeats * 1000) / totalMs,
    warmMeanMs:
      times.length > 1 ? times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1) : null,
    sampledPeakRss: peakSampledRss,
    rssBefore: memoryBefore.rss,
    rssAfter: process.memoryUsage().rss,
    cpuMicros: process.cpuUsage(cpuBefore)
  };
  report.workloads.push(result);
  return result;
}

const runner = new TaskRunner({maxConcurrency: 2});
const echoTask = {
  id: 'echo',
  process: input => input,
  worker: {
    url: new URL('./echo.mjs', import.meta.url),
    capabilities: {atomic: true, streaming: false}
  }
};
let echo;
await measure('math.gl/echo-initialize', 1, async () => {
  echo = await runner.initializeTask(echoTask, {}, {execution: 'worker'});
});
try {
  await measure('math.gl/tiny-sequential-initialized', count, async () => {
    assert.deepEqual(await echo.runTask({value: 42}), {value: 42});
  });
  for (const inputOwnership of ['copy', 'transfer']) {
    await measure(`math.gl/${bufferBytes}-bytes-${inputOwnership}`, quick ? 2 : 5, async () => {
      const data = new Uint8Array(bufferBytes);
      data[0] = 17;
      const result = await echo.runTask({data}, {inputOwnership});
      assert.equal(result.data[0], 17);
      assert.equal(result.data.byteLength, bufferBytes);
      assert.equal(data.byteLength, inputOwnership === 'transfer' ? 0 : bufferBytes);
    });
  }
} finally {
  await echo.close();
}
await measure('math.gl/tiny-main-thread', count, async () => {
  assert.deepEqual(await runner.runTask(echoTask, {value: 42}, {execution: 'main-thread'}), {
    value: 42
  });
});
await measure('math.gl/tiny-main-thread-sync', count, () => {
  assert.deepEqual(runner.runTaskSync(echoTask, {value: 42}), {value: 42});
});
await measure('math.gl/tiny-automatic-cold', quick ? 3 : 10, async () => {
  assert.deepEqual(await runner.runTask(echoTask, {value: 42}), {value: 42});
});
await measure('math.gl/echo-preload', 1, () => preloadTasks([echoTask]));
await measure('math.gl/tiny-automatic-after-code-preload', count, async () => {
  assert.deepEqual(await runner.runTask(echoTask, {value: 42}), {value: 42});
});
await measure('math.gl/independent-batches', 1, async () => {
  let index = 0;
  for await (const {value} of runner.runTasks(echoTask, [{value: 1}, {value: 2}], {concurrency: 2}))
    assert.equal(value, ++index);
});
const raw = new Worker(
  "require('worker_threads').parentPort.on('message', value => require('worker_threads').parentPort.postMessage(value));",
  {eval: true}
);
try {
  await measure(
    'raw-worker/tiny-sequential',
    count,
    () =>
      new Promise((resolve, reject) => {
        raw.once('error', reject);
        raw.once('message', value => {
          raw.removeListener('error', reject);
          assert.equal(value, 42);
          resolve();
        });
        raw.postMessage(42);
      })
  );
} finally {
  await raw.terminate();
}
await measure('direct/tiny-sequential', count, async () => assert.equal(42, 42));
const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};
const coordinates = new Float64Array(rows * 2);
for (let i = 0; i < rows; i++) {
  coordinates[i * 2] = (i % 360) - 180;
  coordinates[i * 2 + 1] = (i % 160) - 80;
}
const expected = new FullProjectionEngine()
  .createProjection(projection)
  .projectFlatSync(coordinates.slice(), 2);
let resource;
await measure('math.gl/persistent-initialize', 1, async () => {
  resource = await runner.initializeTask(ProjectCoordinatesTask, {projection});
});
try {
  await measure(`math.gl/persistent-projection-${rows}`, quick ? 2 : 5, async () => {
    const result = await resource.runTask(
      {coordinates: coordinates.slice()},
      {inputOwnership: 'transfer'}
    );
    assert.deepEqual(result.coordinates, expected);
  });
} finally {
  await resource.close();
}
await measure(`math.gl/stateless-projection-${rows}`, quick ? 2 : 5, async () => {
  const result = await runner.runTask(
    ProjectCoordinatesTask,
    {projection, coordinates: coordinates.slice()},
    {inputOwnership: 'transfer'}
  );
  assert.deepEqual(result.coordinates, expected);
});
await measure(`direct/projection-${rows}`, quick ? 2 : 5, async () => {
  assert.deepEqual(
    new FullProjectionEngine().createProjection(projection).projectFlatSync(coordinates.slice(), 2),
    expected
  );
});
const maps = quick ? 5 : 100;
await measure(`math.gl/${maps}-concurrent-maps`, 1, async () => {
  const inputs = Array.from({length: maps}, (_, i) => ({
    description: {version: 1, id: `map-${i}`, definition: {type: 'mercator'}}
  }));
  let completed = 0;
  for await (const {map} of runner.runTasks(PrepareMapTask, inputs, {concurrency: 2})) {
    assert(map);
    completed++;
  }
  assert.equal(completed, maps);
});
await measure('math.gl/crash-recovery', quick ? 2 : 10, async () => {
  await assert.rejects(runner.runTask(echoTask, {crash: true}));
  assert.deepEqual(await runner.runTask(echoTask, {value: 7}), {value: 7});
});
await measure('math.gl/initialize-destroy', quick ? 3 : 50, async () => {
  const handle = await runner.initializeTask(echoTask, {});
  try {
    assert.deepEqual(await handle.runTask({value: 1}), {value: 1});
  } finally {
    await handle.close();
  }
});
await runner.close();

if (compare) {
  const {default: Piscina} = await import('piscina');
  const piscina = new Piscina({
    filename: new URL('./piscina.mjs', import.meta.url).pathname,
    minThreads: 1,
    maxThreads: 1
  });
  const {default: workerpool} = await import('workerpool');
  const workers = workerpool.pool(new URL('./workerpool.mjs', import.meta.url).pathname, {
    minWorkers: 1,
    maxWorkers: 1,
    workerType: 'thread'
  });
  const Comlink = await import('comlink');
  const {default: nodeEndpoint} = await import('comlink/dist/esm/node-adapter.mjs');
  const thread = new Worker(new URL('./comlink.mjs', import.meta.url));
  const rpc = Comlink.wrap(nodeEndpoint(thread));
  try {
    for (const [name, run] of [
      ['piscina', () => piscina.run(42)],
      ['workerpool', () => workers.exec('echo', [42])],
      ['comlink', () => rpc.echo(42)]
    ]) {
      report.comparators[name] = JSON.parse(
        await readFile(new URL(`./node_modules/${name}/package.json`, import.meta.url), 'utf8')
      ).version;
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
const json = `${JSON.stringify(report, null, 2)}\n`;
if (output) await writeFile(output, json);
process.stdout.write(json);
