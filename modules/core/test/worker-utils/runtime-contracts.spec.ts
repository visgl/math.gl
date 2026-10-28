// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, vi, test as baseTest} from 'vitest';
import {isBrowser} from '../../src/worker-utils/lib/env-utils/globals';
const test = baseTest.runIf(!isBrowser);
const assert = Object.assign((value: unknown) => expect(Boolean(value)).toBe(true), {
  equal: (actual: unknown, expected: unknown) => expect(actual).toBe(expected),
  notEqual: (actual: unknown, expected: unknown) => expect(actual).not.toBe(expected),
  deepEqual: (actual: unknown, expected: unknown) => expect(actual).toEqual(expected),
  throws: (fn: () => unknown, error: any) => expect(fn).toThrow(error),
  doesNotThrow: (fn: () => unknown) => expect(fn).not.toThrow(),
  rejects: (promise: Promise<unknown>, error: any) => expect(promise).rejects.toThrow(error)
});
import WorkerPool from '../../src/worker-utils/lib/worker-farm/worker-pool';
import {getInputByteLength} from '../../src/worker-utils/lib/worker-utils/get-input-byte-length';
import {
  getTransferListForWriter,
  getTransferList
} from '../../src/worker-utils/lib/worker-utils/get-transfer-list';
import {
  processOnWorker,
  processOnWorkerInBatches
} from '../../src/worker-utils/lib/worker-api/process-on-worker';
import WorkerFarm from '../../src/worker-utils/lib/worker-farm/worker-farm';
import {createWorkerResource} from '../../src/worker-utils/lib/worker-api/worker-resource';

const source = "require('worker_threads').parentPort.on('message', () => {});";
const tick = () => new Promise(resolve => setImmediate(resolve));
const start = (pool, bytes, priority = 0, signal: AbortSignal = undefined) =>
  pool.startJob('test', undefined, undefined, signal, {inputBytes: bytes, priority});

test('counts entire backing buffers once through cyclic maps, sets and views', () => {
  const buffer = new ArrayBuffer(64);
  const data: any = {a: new Uint8Array(buffer, 8, 1), b: new DataView(buffer)};
  data.self = new Map([[data, new Set([buffer])]]);
  assert.equal(getInputByteLength(data), 64);
  assert.deepEqual(getTransferList(data), [buffer]);
  if (typeof SharedArrayBuffer !== 'undefined') {
    const shared = new SharedArrayBuffer(8);
    assert.equal(getInputByteLength([shared, new Uint8Array(shared)]), 8);
    assert.deepEqual(getTransferList(shared), []);
  }
});

test('option sanitization preserves cycles, collections and buffer identities', () => {
  const buffer = new ArrayBuffer(8);
  const data: any = {buffer, view: new Uint8Array(buffer), fn() {}};
  data.map = new Map([[data, new Set([data])]]);
  const result: any = getTransferListForWriter(data);
  assert.notEqual(result, data);
  assert.equal(result.buffer, buffer);
  assert.equal(result.view, data.view);
  assert(result.map.get(result).has(result));
  assert.deepEqual(result.fn, {});
  assert.doesNotThrow(() => structuredClone(result));
});

test('in-flight budget gates dispatch and priorities are stable', async () => {
  const pool = new WorkerPool({source, maxConcurrency: 3, maxInFlightBytes: 10});
  try {
    const first = await start(pool, 10);
    const order = [];
    const low = start(pool, 6).then(job => {
      order.push('low');
      return job;
    });
    const high = start(pool, 6, 2).then(job => {
      order.push('high');
      return job;
    });
    const equal = start(pool, 6, 2).then(job => {
      order.push('equal');
      return job;
    });
    await tick();
    assert.deepEqual(order, []);
    first.done({});
    (await high).done({});
    (await equal).done({});
    (await low).done({});
    assert.deepEqual(order, ['high', 'equal', 'low']);
  } finally {
    pool.destroy();
  }
});

test('queue overflow rejects before transfer; abort releases queued capacity', async () => {
  const pool = new WorkerPool({source, maxConcurrency: 1, maxQueuedBytes: 8, maxInFlightBytes: 16});
  try {
    const first = await start(pool, 16);
    const controller = new AbortController();
    const pending = start(pool, 8, 0, controller.signal);
    const rejected = assert.rejects(pending, /cancel/);
    await assert.rejects(start(pool, 1), /maxQueuedBytes/);
    controller.abort(new Error('cancel'));
    await rejected;
    const next = start(pool, 8);
    first.done({});
    (await next).done({});
  } finally {
    pool.destroy();
  }
});

test('oversized and invalid reservations reject without creating a worker', async () => {
  const pool = new WorkerPool({source, maxInFlightBytes: 8});
  try {
    await assert.rejects(start(pool, 9), /maxInFlightBytes/);
    await assert.rejects(start(pool, -1), /Invalid/);
    await assert.rejects(start(pool, 1, NaN), /Invalid/);
    assert.throws(() => pool.setProps({maxQueuedBytes: -1}), RangeError);
  } finally {
    pool.destroy();
  }
});

test('active cancellation releases reservations and replaces worker', async () => {
  const pool = new WorkerPool({source, maxConcurrency: 1, maxInFlightBytes: 8});
  try {
    const controller = new AbortController();
    const first = await start(pool, 8, 0, controller.signal);
    const rejected = assert.rejects(first.result, /cancel/);
    const next = start(pool, 8);
    controller.abort(new Error('cancel'));
    await rejected;
    const second = await next;
    assert.notEqual(second.workerThread, first.workerThread);
    second.done({});
  } finally {
    pool.destroy();
  }
});

test('destroy rejects queued jobs and remains idempotent', async () => {
  const pool = new WorkerPool({source, maxConcurrency: 1});
  const first = await start(pool, 8);
  const rejected = assert.rejects(first.result, /destroyed/);
  const queued = assert.rejects(start(pool, 8), /destroyed/);
  pool.destroy();
  pool.destroy();
  await Promise.all([rejected, queued]);
  await assert.rejects(start(pool, 0), /destroyed/);
});

test('public atomic API enforces buffer budgets before detachment', async () => {
  const worker = {id: 'budget', name: 'budget', module: 'core', version: 'latest', options: {}};
  const data = new Uint8Array(16);
  try {
    await assert.rejects(
      processOnWorker(worker, data, {source, maxInFlightBytes: 8}),
      /maxInFlightBytes/
    );
    assert.equal(data.byteLength, 16);
    const outputs = processOnWorkerInBatches(worker, [data], {source});
    await assert.rejects(outputs[Symbol.asyncIterator]().next(), /require inputBytes/);
  } finally {
    WorkerFarm.getWorkerFarm({maxInFlightBytes: Infinity, maxQueuedBytes: Infinity}).destroy();
  }
});

test('lowering a budget rejects oversized queued jobs instead of stranding them', async () => {
  const pool = new WorkerPool({source, maxConcurrency: 1, maxInFlightBytes: 16});
  try {
    const first = await start(pool, 16);
    const queued = assert.rejects(start(pool, 16), /maxInFlightBytes/);
    pool.setProps({maxInFlightBytes: 8});
    await queued;
    first.done({});
    (await start(pool, 8)).done({});
  } finally {
    pool.destroy();
  }
});

test('batch copy preserves metadata and oversized batches fail before transfer', async () => {
  const worker = {
    id: 'batch-budget',
    name: 'batch-budget',
    module: 'core',
    version: 'latest',
    options: {}
  };
  const batchSource = `
    const {parentPort} = require('worker_threads');
    parentPort.on('message', ({type}) => {
      if (type === 'process-in-batches') parentPort.postMessage({type: 'input-request', payload: {}});
      if (type === 'input-batch') parentPort.postMessage({type: 'done', payload: {}});
    });`;
  try {
    const metadata = new Uint8Array(4);
    const input = new Uint8Array(8);
    const options = {
      source: batchSource,
      maxInFlightBytes: 16,
      maxQueuedBytes: 16,
      inputBytes: 12,
      inputOwnership: 'copy' as const,
      metadata
    };
    for await (const _ of processOnWorkerInBatches(worker, [input], options)) {
    }
    assert.equal(metadata.byteLength, 4);
    assert.equal(input.byteLength, 8);
    const oversized = new Uint8Array(16);
    const iterator = processOnWorkerInBatches(worker, [oversized], {
      ...options,
      inputOwnership: 'transfer'
    });
    await assert.rejects(iterator[Symbol.asyncIterator]().next(), /exceeds reserved inputBytes/);
    assert.equal(oversized.byteLength, 16);
  } finally {
    WorkerFarm.getWorkerFarm({maxInFlightBytes: Infinity, maxQueuedBytes: Infinity}).destroy();
  }
});

const runtime = {
  id: 'runtime',
  name: 'runtime',
  module: 'core',
  version: 'latest',
  options: {},
  worker: new URL('./fixtures/runtime-worker.mjs', import.meta.url).href
};

test('cooperative cancellation drains before reuse and preserves worker-local state', async () => {
  const pool = new WorkerPool({url: runtime.worker, maxConcurrency: 1});
  const controller = new AbortController();
  try {
    const result = processOnWorker(
      runtime,
      {mode: 'cooperate'},
      {
        workerPool: pool,
        signal: controller.signal,
        cancellationMode: 'cooperative',
        onProgress: () => controller.abort(new Error('stop'))
      }
    );
    await assert.rejects(result, /stop/);
    assert.equal(await processOnWorker(runtime, {mode: 'count'}, {workerPool: pool}), 2);
    assert.equal(pool.stats.workersCreated, 1);
    assert.equal(pool.stats.cancelled, 1);
  } finally {
    pool.destroy();
  }
});

test('cooperative timeout terminates a processor that does not acknowledge', async () => {
  const pool = new WorkerPool({url: runtime.worker, maxConcurrency: 1});
  const controller = new AbortController();
  try {
    await assert.rejects(
      processOnWorker(
        runtime,
        {mode: 'ignore'},
        {
          workerPool: pool,
          signal: controller.signal,
          cancellationMode: 'cooperative',
          cancellationTimeout: 5,
          onProgress: () => controller.abort(new Error('stop'))
        }
      ),
      /stop/
    );
    assert.equal(await processOnWorker(runtime, {mode: 'count'}, {workerPool: pool}), 1);
    assert.equal(pool.stats.workerRestarts, 1);
  } finally {
    pool.destroy();
  }
});

test('admission waits atomically, aborts and bounds pending metadata', async () => {
  const pool = new WorkerPool({
    source,
    maxQueuedBytes: 8,
    maxQueuedJobs: 1,
    maxPendingAdmissions: 1
  });
  try {
    const reservation = await pool.reserve(8);
    const controller = new AbortController();
    const wait = pool.reserve(8, {signal: controller.signal});
    const rejected = assert.rejects(wait, /stop/);
    await assert.rejects(pool.reserve(1), /admission queue/);
    controller.abort(new Error('stop'));
    await rejected;
    const next = pool.reserve(8);
    reservation.release();
    const admitted = await next;
    const job = await pool.startJob('reserved', undefined, undefined, undefined, {
      inputBytes: 8,
      admission: admitted
    });
    await assert.rejects(
      pool.startJob('again', undefined, undefined, undefined, {inputBytes: 8, admission: admitted}),
      /consumed/
    );
    job.done({});
    await job.completion;
    await tick();
    assert.equal(pool.stats.reservations, 0);
    assert.equal(pool.stats.queuedBytes, 0);
  } finally {
    pool.destroy();
  }
});

test('metrics hooks cannot break settlement and snapshots drain to zero', async () => {
  const measured = [];
  const pool = new WorkerPool({
    url: runtime.worker,
    maxConcurrency: 1,
    onMetrics: metrics => {
      measured.push(metrics);
      throw new Error('diagnostic');
    },
    onDebug: () => {
      throw new Error('diagnostic');
    }
  });
  try {
    assert.equal(await processOnWorker(runtime, 42, {workerPool: pool}), 42);
    await tick();
    assert.equal(measured.length, 1);
    assert.equal(measured[0].outcome, 'completed');
    assert(measured[0].executionMs >= 0);
    assert(measured[0].postMessageMs >= 0);
    assert.equal(pool.stats.activeJobs, 0);
    assert.equal(pool.stats.inFlightBytes, 0);
    assert.equal(pool.stats.completed, 1);
  } finally {
    pool.destroy();
  }
});

test('resource initialization persists, disposal is idempotent and crashes invalidate handles', async () => {
  const descriptor = {
    ...runtime,
    id: 'resource',
    name: 'resource',
    worker: new URL('./fixtures/resource-worker.mjs', import.meta.url).href
  };
  const disposed = new SharedArrayBuffer(4);
  const resource = await createWorkerResource(descriptor, {value: 10, disposed});
  assert.equal(await resource.run(2), 12);
  assert.equal(await resource.run(3), 15);
  await Promise.all([resource.destroy(), resource.destroy()]);
  assert.equal(Atomics.load(new Int32Array(disposed), 0), 1);
  await assert.rejects(resource.run(1), /destroyed/);
  const crashed = await createWorkerResource(descriptor, {value: 10});
  await assert.rejects(crashed.run('crash'), /exited/);
  await assert.rejects(crashed.run(1), /invalidated/);
  await crashed.destroy();
});

test('share ownership is explicit and rejects ordinary buffers before detachment', async () => {
  const pool = new WorkerPool({url: runtime.worker, maxConcurrency: 1});
  try {
    const ordinary = new Uint8Array(8);
    await assert.rejects(
      processOnWorker(runtime, ordinary, {workerPool: pool, inputOwnership: 'share'}),
      /SharedArrayBuffer/
    );
    assert.equal(ordinary.byteLength, 8);
    const shared = new Uint8Array(new SharedArrayBuffer(8));
    shared[0] = 7;
    const result = await processOnWorker(runtime, shared, {
      workerPool: pool,
      inputOwnership: 'share'
    });
    result[0] = 9;
    assert.equal(shared[0], 9);
  } finally {
    await pool.destroy();
  }
});

test('priority aging lets an older low-priority job precede newer traffic', async () => {
  const pool = new WorkerPool({source, maxConcurrency: 1, priorityAgingMs: 1});
  try {
    const first = await start(pool, 0);
    const order = [];
    const old = start(pool, 0, 0).then(job => {
      order.push('old');
      return job;
    });
    await new Promise(resolve => setTimeout(resolve, 20));
    const newer = start(pool, 0, 1).then(job => {
      order.push('newer');
      return job;
    });
    first.done({});
    (await old).done({});
    (await newer).done({});
    assert.deepEqual(order, ['old', 'newer']);
  } finally {
    await pool.destroy();
  }
});

test('destroy settles active and queued jobs and awaits worker termination', async () => {
  const pool = new WorkerPool({source, maxConcurrency: 1});
  const active = await start(pool, 8);
  const rejection = assert.rejects(active.result, /destroyed/);
  const waiting = assert.rejects(start(pool, 8), /destroyed/);
  await pool.destroy();
  await Promise.all([rejection, waiting]);
  assert.equal(active.workerThread.terminated, true);
  assert.equal(pool.stats.activeJobs, 0);
  assert.equal(pool.stats.inFlightBytes, 0);
});

test('resource teardown times out an unresponsive disposer and still terminates', async () => {
  const descriptor = {
    ...runtime,
    id: 'resource-timeout',
    name: 'resource timeout',
    worker: new URL('./fixtures/resource-worker.mjs', import.meta.url).href
  };
  const resource = await createWorkerResource(descriptor, {value: 0, hangDisposer: true});
  await assert.rejects(resource.destroy({timeout: 20}), /timed out/);
  assert.equal(resource.stats.activeJobs, 0);
  await assert.rejects(resource.run(1), /destroyed/);
});

test('destroy from a debug hook rejects the dequeued job instead of stranding it', async () => {
  let pool: WorkerPool;
  pool = new WorkerPool({
    source,
    onDebug: () => {
      void pool.destroy();
    }
  });
  await assert.rejects(start(pool, 8), /destroyed before job start/);
  await pool.destroy();
  assert.equal(pool.stats.inFlightBytes, 0);
});

import {
  getWorkerCapabilities,
  createSharedWorkerState,
  SharedWorkerState
} from '../../src/worker-utils/lib/worker-api/shared-state';

test('shared-memory capabilities probe actual atomic storage and shared cloning', () => {
  assert.equal(getWorkerCapabilities().sharedMemory, true);
  const state = createSharedWorkerState();
  const workerView = new SharedWorkerState(structuredClone(state.buffer));
  workerView.setProgress(3, 10);
  assert.equal(state.snapshot.completed, 3);
  assert.equal(state.snapshot.total, 10);
  state.cancel();
  assert.equal(workerView.snapshot.cancelled, true);
  assert.throws(() => workerView.throwIfCancelled(), /cancelled/);
  assert.throws(() => state.setProgress(0.5), RangeError);
  assert.throws(() => new SharedWorkerState(new SharedArrayBuffer(4)), /16-byte/);
});

test('shared cancellation interrupts a polling synchronous loop without a worker event-loop yield', async () => {
  const pool = new WorkerPool({url: runtime.worker, maxConcurrency: 1});
  const controller = new AbortController();
  const state = createSharedWorkerState();
  const timer = setInterval(() => {
    if (state.snapshot.completed === 1) controller.abort(new Error('stop shared loop'));
  }, 1);
  try {
    await assert.rejects(
      processOnWorker(
        runtime,
        {mode: 'shared-spin'},
        {
          workerPool: pool,
          sharedState: state.buffer,
          signal: controller.signal,
          cancellationMode: 'cooperative'
        }
      ),
      /stop shared loop/
    );
    assert.equal(await processOnWorker(runtime, {mode: 'count'}, {workerPool: pool}), 2);
    assert.equal(state.snapshot.cancelled, true);
    assert.equal(pool.stats.workersCreated, 1);
  } finally {
    clearInterval(timer);
    await pool.destroy();
  }
});

test('shared-memory probing falls back when unavailable or blocked', () => {
  vi.stubGlobal('SharedArrayBuffer', undefined);
  try {
    assert.equal(getWorkerCapabilities().sharedMemory, false);
    assert.equal(createSharedWorkerState(), null);
  } finally {
    vi.unstubAllGlobals();
  }
  vi.stubGlobal('structuredClone', () => {
    throw new Error('blocked');
  });
  try {
    assert.equal(getWorkerCapabilities().sharedMemoryUnavailableReason, 'blocked');
    assert.equal(createSharedWorkerState(), null);
  } finally {
    vi.unstubAllGlobals();
  }
});

test('an explicit shared cancellation flag preserves AbortError and releases the worker', async () => {
  const pool = new WorkerPool({url: runtime.worker, maxConcurrency: 1});
  const state = createSharedWorkerState();
  const timer = setInterval(() => {
    if (state.snapshot.completed === 1) state.cancel();
  }, 1);
  try {
    await expect(
      processOnWorker(
        runtime,
        {mode: 'shared-spin'},
        {workerPool: pool, sharedState: state.buffer, cancellationMode: 'cooperative'}
      )
    ).rejects.toMatchObject({name: 'AbortError'});
    assert.equal(await processOnWorker(runtime, {mode: 'count'}, {workerPool: pool}), 2);
    assert.equal(pool.stats.cancelled, 1);
    assert.equal(pool.stats.workersCreated, 1);
  } finally {
    clearInterval(timer);
    await pool.destroy();
  }
});

test('a persistent resource and main thread both update application-owned atomic state', async () => {
  const descriptor = {
    ...runtime,
    id: 'resource-shared',
    name: 'resource shared',
    worker: new URL('./fixtures/resource-worker.mjs', import.meta.url).href
  };
  const counter = new Int32Array(new SharedArrayBuffer(4));
  Atomics.store(counter, 0, 10);
  const resource = await createWorkerResource(
    descriptor,
    {value: 0, counter: counter.buffer},
    {inputOwnership: 'share'}
  );
  try {
    assert.equal(await resource.run(2), 2);
    assert.equal(Atomics.load(counter, 0), 12);
    Atomics.store(counter, 0, 20);
    assert.equal(await resource.run(3), 5);
    assert.equal(Atomics.load(counter, 0), 23);
  } finally {
    await resource.destroy();
  }
});

test('resource disposal does not inherit an already-cancelled initialization control buffer', async () => {
  const descriptor = {
    ...runtime,
    id: 'resource-dispose-control',
    name: 'resource dispose control',
    worker: new URL('./fixtures/resource-worker.mjs', import.meta.url).href
  };
  const state = createSharedWorkerState();
  const disposed = new SharedArrayBuffer(4);
  const resource = await createWorkerResource(
    descriptor,
    {value: 0, disposed},
    {
      sharedState: state.buffer,
      cancellationMode: 'cooperative'
    }
  );
  state.cancel();
  await resource.destroy();
  assert.equal(Atomics.load(new Int32Array(disposed), 0), 1);
});

test('cooperative cancellation before atomic dispatch immediately preserves the warm worker', async () => {
  const pool = new WorkerPool({url: runtime.worker, maxConcurrency: 1});
  try {
    assert.equal(await processOnWorker(runtime, {mode: 'count'}, {workerPool: pool}), 1);
    const controller = new AbortController();
    const result = processOnWorker(
      runtime,
      {mode: 'ignore'},
      {workerPool: pool, signal: controller.signal, cancellationMode: 'cooperative'}
    );
    controller.abort(new Error('before dispatch'));
    await assert.rejects(result, /before dispatch/);
    assert.equal(await processOnWorker(runtime, {mode: 'count'}, {workerPool: pool}), 2);
    assert.equal(pool.stats.workersCreated, 1);
    assert.equal(pool.stats.workerRestarts, 0);
  } finally {
    await pool.destroy();
  }
});

test('cooperative cancellation before batch dispatch releases its lease without replacement', async () => {
  const pool = new WorkerPool({url: runtime.worker, maxConcurrency: 1});
  try {
    assert.equal(await processOnWorker(runtime, {mode: 'count'}, {workerPool: pool}), 1);
    const controller = new AbortController();
    const batches = processOnWorkerInBatches(runtime, [1], {
      workerPool: pool,
      signal: controller.signal,
      cancellationMode: 'cooperative'
    });
    const next = batches[Symbol.asyncIterator]().next();
    controller.abort(new Error('before batch dispatch'));
    await assert.rejects(next, /before batch dispatch/);
    assert.equal(await processOnWorker(runtime, {mode: 'count'}, {workerPool: pool}), 2);
    assert.equal(pool.stats.workersCreated, 1);
  } finally {
    await pool.destroy();
  }
});

test('cooperative cancellation before resource dispatch preserves initialized state', async () => {
  const descriptor = {
    ...runtime,
    id: 'resource-pre-dispatch',
    name: 'resource pre-dispatch',
    worker: new URL('./fixtures/resource-worker.mjs', import.meta.url).href
  };
  const resource = await createWorkerResource(descriptor, {value: 10});
  try {
    const controller = new AbortController();
    const result = resource.run(100, {signal: controller.signal, cancellationMode: 'cooperative'});
    controller.abort(new Error('before resource dispatch'));
    await assert.rejects(result, /before resource dispatch/);
    assert.equal(await resource.run(2), 12);
    assert.equal(resource.stats.workersCreated, 1);
  } finally {
    await resource.destroy();
  }
});

test('resource runs do not inherit initialization signals or shared control buffers', async () => {
  const descriptor = {
    ...runtime,
    id: 'resource-controls',
    name: 'resource controls',
    worker: new URL('./fixtures/resource-worker.mjs', import.meta.url).href
  };
  const state = createSharedWorkerState();
  const initialization = new AbortController();
  const resource = await createWorkerResource(
    descriptor,
    {value: 10},
    {
      sharedState: state.buffer,
      signal: initialization.signal,
      cancellationMode: 'cooperative'
    }
  );
  try {
    initialization.abort(new Error('initialization has finished'));
    const controller = new AbortController();
    const result = resource.run(100, {signal: controller.signal});
    controller.abort(new Error('cancel this call'));
    await assert.rejects(result, /cancel this call/);
    assert.equal(state.snapshot.cancelled, false);
    state.cancel();
    assert.equal(await resource.run(2), 12);
    assert.equal(resource.stats.workersCreated, 1);
  } finally {
    await resource.destroy();
  }
});
