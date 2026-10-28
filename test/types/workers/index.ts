// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  processOnWorker,
  processOnWorkerInBatches,
  type WorkerObject
} from '@math.gl/core/worker-utils';
import {MapSetupWorker, projectBulkInWorker, setupMapInWorker} from '@math.gl/geospatial/workers';

declare const worker: WorkerObject<{count: number}, {value: number}, {precision: number}>;
const result: Promise<{value: number}> = processOnWorker(worker, {count: 2}, {precision: 2});
const batches: AsyncIterable<{value: number}> = processOnWorkerInBatches(worker, [{count: 2}], {
  precision: 2
});
// @ts-expect-error Batch input requires numeric counts.
processOnWorkerInBatches(worker, [{count: 'wrong'}]);
// @ts-expect-error Worker input requires a numeric count.
processOnWorker(worker, {count: 'wrong'});
// @ts-expect-error Processor precision is numeric.
processOnWorker(worker, {count: 2}, {precision: 'wrong'});
const projected: Promise<Float32Array> = projectBulkInWorker({
  projection: {to: 'EPSG:3857'},
  coordinates: new Float32Array(4)
});
const map = setupMapInWorker({version: 1, id: 'world', definition: {type: 'mercator'}});
const direct = processOnWorker(MapSetupWorker, {
  version: 1,
  id: 'world',
  definition: {type: 'mercator'}
});
void result;
void batches;
void projected;
void map;
void direct;

import {
  createWorkerResource,
  createResourceWorker,
  type WorkerResourceObject,
  type WorkerJobMetrics,
  WorkerPool
} from '@math.gl/core/worker-utils';
declare const resourceWorker: WorkerResourceObject<{initial: number}, {delta: number}, number>;
const resource = await createWorkerResource(resourceWorker, {initial: 1});
const resourceResult: Promise<number> = resource.run({delta: 2});
// @ts-expect-error Resource inputs retain their declared shape.
resource.run({delta: 'wrong'});
// @ts-expect-error Initialization is separately typed.
createWorkerResource(resourceWorker, {initial: 'wrong'});
createResourceWorker({
  initialize: (input: {initial: number}) => ({value: input.initial}),
  run: (state, input: {delta: number}, context) => {
    context.signal?.throwIfAborted();
    return state.value + input.delta;
  }
});
const pool = new WorkerPool({
  maxQueuedJobs: 8,
  maxQueuedBytes: 1024,
  onMetrics: (metrics: WorkerJobMetrics) => {
    void metrics.executionMs;
  }
});
const admission = await pool.reserve(16);
void processOnWorker(
  worker,
  {count: 1},
  {
    workerPool: pool,
    admission,
    priority: 1,
    cancellationMode: 'cooperative',
    inputOwnership: 'share'
  }
);
void resourceResult;

import {
  getWorkerCapabilities,
  createSharedWorkerState,
  type SharedWorkerSnapshot
} from '@math.gl/core/worker-utils';
const capabilities = getWorkerCapabilities();
const shared = createSharedWorkerState();
if (shared && capabilities.sharedMemory) {
  shared.setProgress(1, 10);
  const snapshot: SharedWorkerSnapshot = shared.snapshot;
  void snapshot.completed;
  void processOnWorker(
    worker,
    {count: 1},
    {sharedState: shared.buffer, cancellationMode: 'cooperative'}
  );
}

// @ts-expect-error Configure resource pool budgets at creation, not on an individual call.
resource.run({delta: 1}, {maxQueuedBytes: 1024});

import {runTask, runTaskInBatches, type TaskDescriptor} from '@math.gl/core/tasks';
declare const typedTask: TaskDescriptor<{count: number}, {value: number}, {precision: number}>;
const localResult: Promise<{value: number}> = runTask(
  typedTask,
  {count: 1},
  {
    mainThread: {maxSize: 10, getSize: input => input.count},
    precision: 2
  }
);
const adaptiveResults: AsyncIterable<{value: number}> = runTaskInBatches(typedTask, [{count: 2}], {
  mainThread: {maxSize: 10, getSize: input => input.count}
});
// @ts-expect-error Task inputs retain their declared shape.
runTask(typedTask, {count: 'wrong'});
// @ts-expect-error Operation options remain typed on both execution paths.
runTask(typedTask, {count: 1}, {precision: 'wrong'});
void localResult;
void adaptiveResults;
