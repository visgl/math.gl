// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {afterEach, expect, test as baseTest} from 'vitest';
import {
  isBrowser,
  processOnWorker,
  processOnWorkerInBatches,
  WorkerFarm,
  getWorkerCapabilities,
  createSharedWorkerState,
  createWorker,
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

test('module worker URL overrides preserve compiled WASM options', async () => {
  const code = `export {}; self.onmessage = ({data}) => {
    if (data.type === 'process') self.postMessage({source: 'loaders.gl', type: 'done',
      payload: {result: data.payload.options.compiled instanceof WebAssembly.Module}});
  };`;
  const url = URL.createObjectURL(new Blob([code], {type: 'application/javascript'}));
  const compiled = new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
  try {
    await expect(
      processOnWorker(worker, null, {
        [worker.id]: {workerUrl: url},
        workerType: 'module',
        compiled
      })
    ).resolves.toBe(true);
  } finally {
    URL.revokeObjectURL(url);
  }
});

test('createWorker leaves the browser window message handler untouched', async () => {
  const original = window.onmessage;
  const handler = () => {};
  window.onmessage = handler;
  try {
    await createWorker(() => 'unexpected');
    expect(window.onmessage).toBe(handler);
  } finally {
    window.onmessage = original;
  }
});

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

test('browser capability detection follows isolation and retains the message fallback', () => {
  const capabilities = getWorkerCapabilities();
  if ((globalThis as any).__mathglSharedMemoryExpected)
    expect(capabilities.sharedMemory).toBe(true);
  if (!globalThis.crossOriginIsolated) {
    expect(capabilities.sharedMemory).toBe(false);
    expect(capabilities.sharedMemoryUnavailableReason).toBe('cross-origin-isolation');
    expect(createSharedWorkerState()).toBe(null);
  } else {
    expect(capabilities.sharedMemory).toBe(true);
  }
});

baseTest.runIf(isBrowser && getWorkerCapabilities().sharedMemory)(
  'isolated browser workers observe shared cancellation inside a synchronous polling loop',
  async () => {
    const {WorkerPool} = await import('../../src/worker-utils');
    const pool = new WorkerPool({
      maxConcurrency: 1,
      loadWorker: () =>
        new Worker(new URL('./fixtures/runtime-worker.mjs', import.meta.url), {type: 'module'})
    });
    const controller = new AbortController();
    const state = createSharedWorkerState();
    const timer = setInterval(() => {
      if (state.snapshot.completed === 1) controller.abort(new Error('stop shared loop'));
    }, 1);
    try {
      await expect(
        processOnWorker(
          worker,
          {mode: 'shared-spin'},
          {
            workerPool: pool,
            sharedState: state.buffer,
            signal: controller.signal,
            cancellationMode: 'cooperative'
          }
        )
      ).rejects.toThrow('stop shared loop');
      await expect(processOnWorker(worker, {mode: 'count'}, {workerPool: pool})).resolves.toBe(2);
      expect(pool.stats.workersCreated).toBe(1);
    } finally {
      clearInterval(timer);
      await pool.destroy();
    }
  }
);

test('browser cooperative cancellation before dispatch preserves the warm worker', async () => {
  const {WorkerPool} = await import('../../src/worker-utils');
  const pool = new WorkerPool({
    maxConcurrency: 1,
    loadWorker: () =>
      new Worker(new URL('./fixtures/runtime-worker.mjs', import.meta.url), {type: 'module'})
  });
  try {
    await expect(processOnWorker(worker, {mode: 'count'}, {workerPool: pool})).resolves.toBe(1);
    const controller = new AbortController();
    const result = processOnWorker(
      worker,
      {mode: 'ignore'},
      {
        workerPool: pool,
        signal: controller.signal,
        cancellationMode: 'cooperative',
        sharedState: false
      }
    );
    controller.abort(new Error('before dispatch'));
    await expect(result).rejects.toThrow('before dispatch');
    await expect(processOnWorker(worker, {mode: 'count'}, {workerPool: pool})).resolves.toBe(2);
    expect(pool.stats.workersCreated).toBe(1);
    expect(pool.stats.workerRestarts).toBe(0);
  } finally {
    await pool.destroy();
  }
});
