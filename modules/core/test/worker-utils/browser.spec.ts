// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {afterEach, expect, test as baseTest} from 'vitest';
import {
  isBrowser,
  processOnWorker,
  processOnWorkerInBatches,
  WorkerFarm,
  type WorkerObject
} from '../../src/worker-utils';

const test = baseTest.runIf(isBrowser);
const worker: WorkerObject = {
  id: 'browser-worker-test',
  name: 'browser worker',
  module: 'test',
  version: 'latest',
  worker: true,
  options: {}
};
const source = `self.onmessage = ({data: {type, payload}}) => {
  const post = (type, payload) => self.postMessage({source:'loaders.gl', type, payload});
  if (type === 'process') {
    post('progress', {progress:{phase:'processing', completed:1, total:1, unit:'tasks'}});
    if (payload.input !== 'hang') post('done', {result:payload.input});
  } else if (type === 'process-in-batches' || type === 'output-ack') post('input-request', {});
  else if (type === 'input-batch') post('output-batch', {result:payload.input});
  else if (type === 'input-done') post('done', {});
};`;

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

test('browser workers report progress and preserve requested buffer ownership', async () => {
  for (const inputOwnership of ['copy', 'transfer'] as const) {
    const input = new Uint8Array([1, 2, 3]);
    const progress = [];
    const output = await processOnWorker(worker, input, {
      source,
      inputOwnership,
      onProgress: p => progress.push(p)
    });
    expect(output).toEqual(new Uint8Array([1, 2, 3]));
    expect(input.byteLength).toBe(inputOwnership === 'copy' ? 3 : 0);
    expect(progress).toEqual([{phase: 'processing', completed: 1, total: 1, unit: 'tasks'}]);
  }
});

test('browser batch worker retains copied input and streams output', async () => {
  const input = new Uint8Array([4, 5]);
  const output = [];
  for await (const batch of processOnWorkerInBatches(worker, [input], {
    source,
    inputOwnership: 'copy'
  }))
    output.push(batch);
  expect(output).toEqual([new Uint8Array([4, 5])]);
  expect(input.byteLength).toBe(2);
});

test('browser pool cancels queued and running jobs and replaces the worker', async () => {
  const running = new AbortController();
  const queued = new AbortController();
  let started;
  const ready = new Promise(resolve => {
    started = resolve;
  });
  const first = processOnWorker(worker, 'hang', {
    source,
    maxConcurrency: 1,
    signal: running.signal,
    onProgress: () => started()
  });
  await ready;
  const second = processOnWorker(worker, 'queued', {
    source,
    maxConcurrency: 1,
    signal: queued.signal
  });
  queued.abort('queued cancellation');
  await expect(second).rejects.toBe('queued cancellation');
  running.abort('running cancellation');
  await expect(first).rejects.toBe('running cancellation');
  await expect(processOnWorker(worker, 'replacement', {source, maxConcurrency: 1})).resolves.toBe(
    'replacement'
  );
});

test('throwing progress callbacks abort the browser worker', async () => {
  await expect(
    processOnWorker(worker, 'value', {
      source,
      onProgress: () => {
        throw new Error('progress failed');
      }
    })
  ).rejects.toThrow('progress failed');
});

test('module workers cooperate with cancellation and retain their incarnation', async () => {
  const {WorkerPool} = await import('../../src/worker-utils');
  const pool = new WorkerPool({
    maxConcurrency: 1,
    loadWorker: () =>
      new Worker(new URL('./fixtures/runtime-worker.mjs', import.meta.url), {type: 'module'})
  });
  const controller = new AbortController();
  try {
    await expect(
      processOnWorker(
        worker,
        {mode: 'cooperate'},
        {
          workerPool: pool,
          signal: controller.signal,
          cancellationMode: 'cooperative',
          onProgress: () => controller.abort(new Error('stop'))
        }
      )
    ).rejects.toThrow('stop');
    await expect(processOnWorker(worker, {mode: 'count'}, {workerPool: pool})).resolves.toBe(2);
    expect(pool.stats.workersCreated).toBe(1);
    expect(pool.stats.cancelled).toBe(1);
  } finally {
    await pool.destroy();
  }
});

test('browser resources initialize once and dispose deterministically', async () => {
  const {createWorkerResource} = await import('../../src/worker-utils');
  const resource = await createWorkerResource(
    {
      ...worker,
      loadWorker: () =>
        new Worker(new URL('./fixtures/resource-worker.mjs', import.meta.url), {type: 'module'})
    },
    {value: 10}
  );
  try {
    await expect(resource.run(2)).resolves.toBe(12);
    await expect(resource.run(3)).resolves.toBe(15);
  } finally {
    await resource.destroy();
  }
  await expect(resource.run(1)).rejects.toThrow('destroyed');
});
