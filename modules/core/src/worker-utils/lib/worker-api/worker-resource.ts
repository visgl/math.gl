// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WorkerObject, WorkerContext, WorkerOptions} from '../../types';
import WorkerPool from '../worker-farm/worker-pool';
import type WorkerThread from '../worker-farm/worker-thread';
import {getWorkerName} from './get-worker-url';
import {getWorkerPoolTarget, validateSharedInput} from './process-on-worker';
import {getTransferListForWriter} from '../worker-utils/get-transfer-list';
import {getInputByteLength} from '../worker-utils/get-input-byte-length';
import {createWorker} from './create-worker';

export type ResourceRequest<Init, Input> =
  | {operation: 'initialize'; input: Init}
  | {operation: 'run'; input: Input}
  | {operation: 'dispose'};
export type WorkerResourceObject<Init, Input, Output> = WorkerObject<
  ResourceRequest<Init, Input>,
  {value?: Output}
>;
export type WorkerResource<Input, Output> = {
  run(input: Input, options?: WorkerOptions): Promise<Output>;
  /** Stops accepting calls, drains submitted work, disposes state, then terminates the worker. */
  destroy(options?: {timeout?: number}): Promise<void>;
  readonly stats: WorkerPool['stats'];
};

/** Installs a typed stateful processor. State never crosses the structured-clone boundary. */
export function createResourceWorker<State, Init, Input, Output>(handlers: {
  initialize: (input: Init, context: WorkerContext) => State | Promise<State>;
  run: (state: State, input: Input, context: WorkerContext) => Output | Promise<Output>;
  dispose?: (state: State) => void | Promise<void>;
}): Promise<void> {
  let initialized = false;
  let state: State;
  return createWorker(async (request: ResourceRequest<Init, Input>, _options, context) => {
    if (request.operation === 'initialize') {
      if (initialized) throw new Error('Worker resource is already initialized');
      state = await handlers.initialize(request.input, context);
      initialized = true;
      return {};
    }
    if (!initialized) throw new Error('Worker resource is not initialized');
    if (request.operation === 'dispose') {
      initialized = false;
      await handlers.dispose?.(state);
      state = undefined;
      return {};
    }
    return {value: await handlers.run(state, request.input, context)};
  });
}

/** Creates a resource pinned to one worker incarnation; crashes and hard aborts invalidate it. */
export async function createWorkerResource<Init, Input, Output>(
  worker: WorkerResourceObject<Init, Input, Output>,
  initialization: Init,
  options: WorkerOptions = {}
): Promise<WorkerResource<Input, Output>> {
  const pool = new WorkerPool({
    maxQueuedJobs: 32,
    ...options,
    ...getWorkerPoolTarget(worker, options, getWorkerName(worker)),
    maxConcurrency: 1,
    maxMobileConcurrency: 1,
    reuseWorkers: true
  });
  let incarnation: WorkerThread | undefined;
  let closed = false;
  let disposal: Promise<void> | undefined;
  const pending = new Set<Promise<unknown>>();
  const invoke = async (request: ResourceRequest<Init, Input>, callOptions: WorkerOptions) => {
    if (incarnation?.terminated)
      throw new Error('Worker resource was invalidated; create a new resource');
    const {signal, onProgress, onMetrics, ...serializable} = {...options, ...callOptions};
    validateSharedInput(serializable, [request, serializable]);
    const job = await pool.startJob(
      worker.name,
      (active, type, payload) => {
        if (type === 'done') active.done(payload);
        else if (type === 'error') active.error(new Error(payload.error));
        else if (type === 'progress' && !active.isCancelled) {
          try {
            onProgress?.(payload.progress);
          } catch (error) {
            active.abort(error);
          }
        }
      },
      undefined,
      signal,
      {
        inputBytes: getInputByteLength([request, serializable]),
        priority: callOptions.priority,
        cancellationMode: callOptions.cancellationMode ?? options.cancellationMode,
        cancellationTimeout: callOptions.cancellationTimeout ?? options.cancellationTimeout
      }
    );
    if (incarnation && incarnation !== job.workerThread) {
      const error = new Error('Worker resource was invalidated; create a new resource');
      job.error(error);
      pool.destroy(error);
      throw error;
    }
    incarnation = job.workerThread;
    try {
      job.postMessage(
        'process',
        {input: request, options: getTransferListForWriter(serializable)},
        serializable.inputOwnership === 'copy' || serializable.inputOwnership === 'share'
          ? []
          : undefined
      );
      return (await job.result).result as {value?: Output};
    } catch (error) {
      if (!job.isCancelled && job.isRunning) job.abort(error);
      throw error;
    }
  };
  try {
    await invoke({operation: 'initialize', input: initialization}, options);
  } catch (error) {
    pool.destroy(error);
    throw error;
  }
  return {
    get stats() {
      return pool.stats;
    },
    run(input, callOptions = {}) {
      if (closed) return Promise.reject(new Error('Worker resource was destroyed'));
      const result = invoke({operation: 'run', input}, callOptions).then(
        response => response.value as Output
      );
      pending.add(result);
      void result.then(
        () => pending.delete(result),
        () => pending.delete(result)
      );
      return result;
    },
    destroy(destroyOptions = {}) {
      if (disposal) return disposal;
      const timeout = destroyOptions.timeout ?? 1000;
      if (!Number.isFinite(timeout) || timeout < 0) {
        return Promise.reject(
          new RangeError('Resource destroy timeout must be finite and nonnegative')
        );
      }
      closed = true;
      disposal = (async () => {
        let timedOut = false;
        const timeoutError = new Error('Worker resource destruction timed out');
        const timer = setTimeout(() => {
          timedOut = true;
          void pool.destroy(timeoutError);
        }, timeout);
        try {
          await Promise.allSettled([...pending]);
          if (!incarnation?.terminated)
            await invoke({operation: 'dispose'}, {signal: undefined, onProgress: undefined});
          if (timedOut) throw timeoutError;
        } finally {
          clearTimeout(timer);
          await pool.destroy();
        }
      })();
      return disposal;
    }
  };
}
