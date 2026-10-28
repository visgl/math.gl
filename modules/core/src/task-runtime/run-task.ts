// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  processOnWorker,
  getTransferList,
  getTransferListForWriter,
  createSharedWorkerState,
  getWorkerCapabilities,
  SharedWorkerState,
  type WorkerObject,
  type WorkerContext,
  type WorkerJobContext,
  type ProcessOnWorkerOptions
} from '@math.gl/core/worker-utils';
import {getInputByteLength} from '../worker-utils/lib/worker-utils/get-input-byte-length';

export type TaskDescriptor<
  Input,
  Output,
  Options extends object = Record<string, any>
> = WorkerObject<Input, Output, Options>;

export type TaskExecution = 'auto' | 'main-thread' | 'worker';
/** Application-controlled cost bound; default size counts input backing-buffer bytes. */
export type MainThreadPolicy<Input> = {
  maxSize: number;
  /** Supply record/operation counts when buffer bytes do not describe computational cost. */
  getSize?: (input: Input) => number;
};
export type TaskOptions<Input> = ProcessOnWorkerOptions & {
  execution?: TaskExecution;
  mainThread?: MainThreadPolicy<Input>;
  /** Diagnostic routing event. Throwing does not change execution. */
  onExecution?: (execution: Exclude<TaskExecution, 'auto'>) => void;
};

/** Execute an atomic descriptor locally when explicitly eligible, otherwise on its worker. */
export async function runTask<Input, Output, Options extends object>(
  task: WorkerObject<Input, Output, Options>,
  input: Input,
  options: TaskOptions<Input> & Partial<Options> = {} as TaskOptions<Input> & Partial<Options>,
  context: WorkerContext = {},
  jobContext: WorkerJobContext = {}
): Promise<Output> {
  const {execution = 'auto', mainThread, onExecution, ...runtimeOptions} = options;
  const workerOptions = runtimeOptions as ProcessOnWorkerOptions & Partial<Options>;
  if (!['auto', 'main-thread', 'worker'].includes(execution))
    throw new Error('Invalid task execution mode');
  if (mainThread && (!Number.isFinite(mainThread.maxSize) || mainThread.maxSize < 0)) {
    throw new RangeError('mainThread.maxSize must be finite and nonnegative');
  }
  if (
    workerOptions.cancellationMode !== undefined &&
    !['terminate', 'cooperative'].includes(workerOptions.cancellationMode)
  ) {
    throw new Error('Invalid task cancellation mode');
  }
  if (
    workerOptions.cancellationTimeout !== undefined &&
    (!Number.isFinite(workerOptions.cancellationTimeout) || workerOptions.cancellationTimeout < 0)
  ) {
    throw new RangeError('cancellationTimeout must be finite and nonnegative');
  }
  if (workerOptions.signal?.aborted) throw workerOptions.signal.reason;
  let local = execution === 'main-thread';
  if (
    execution === 'auto' &&
    mainThread &&
    task.process &&
    !workerOptions.admission &&
    workerOptions.cancellationMode !== 'terminate'
  ) {
    const size = mainThread.getSize ? mainThread.getSize(input) : getInputByteLength(input);
    if (!Number.isFinite(size) || size < 0)
      throw new RangeError('Invalid main-thread size estimate');
    // Zero bytes alone is unknown cost (e.g. {iterations: 1e9}); a custom estimator may admit zero.
    local = (Boolean(mainThread.getSize) || size > 0) && size <= mainThread.maxSize;
  }
  if (local && !task.process) throw new Error('Task has no main-thread processor');
  if (local && (workerOptions.admission || workerOptions.cancellationMode === 'terminate')) {
    throw new Error(
      'Main-thread execution cannot consume worker admissions or guarantee hard termination'
    );
  }
  try {
    if (onExecution)
      void Promise.resolve(onExecution(local ? 'main-thread' : 'worker')).catch(() => undefined);
  } catch {
    /* Diagnostic only. */
  }
  if (!local) return processOnWorker(task, input, workerOptions, context, jobContext);
  return runLocally(task, input, workerOptions, context, jobContext);
}

/** Independent atomic batches, one at a time, in input order. No worker session/state is leased. */
export async function* runTaskInBatches<Input, Output, Options extends object>(
  task: WorkerObject<Input, Output, Options>,
  input: AsyncIterable<Input> | Iterable<Input>,
  options: TaskOptions<Input> & Partial<Options> = {} as TaskOptions<Input> & Partial<Options>,
  context: WorkerContext = {},
  jobContext: WorkerJobContext = {}
): AsyncIterable<Output> {
  if (options.admission)
    throw new Error('Adaptive batches cannot reuse a one-use worker admission');
  const iterator =
    Symbol.asyncIterator in input ? input[Symbol.asyncIterator]() : input[Symbol.iterator]();
  let finished = false;
  let deadline = performance.now() + 8;
  try {
    while (true) {
      options.signal?.throwIfAborted();
      if (performance.now() >= deadline) {
        await yieldToEventLoop(options.signal);
        deadline = performance.now() + 8;
      }
      const next = await nextWithSignal(iterator, options.signal);
      if (next.done) {
        finished = true;
        return;
      }
      // Options/context belong to the whole iterable, not to its first request.
      // Retain their caller-owned buffers while each independent input may be transferred.
      const request = reusableBatchRequest<Input, Options>(next.value, options, jobContext);
      yield await runTask<Input, Output, Options>(
        task,
        next.value,
        request.options,
        context,
        request.context
      );
    }
  } finally {
    if (!finished) {
      // Do not let a blocked producer prevent cancellation or consumer teardown.
      try {
        void Promise.resolve(iterator.return?.()).catch(() => undefined);
      } catch {
        /* Best effort. */
      }
    }
  }
}

async function runLocally<Input, Output, Options extends object>(
  task: WorkerObject<Input, Output, Options>,
  input: Input,
  options: ProcessOnWorkerOptions & Partial<Options>,
  context: WorkerContext,
  jobContext: WorkerJobContext
): Promise<Output> {
  if (
    options.inputOwnership !== undefined &&
    !['copy', 'transfer', 'share'].includes(options.inputOwnership)
  ) {
    throw new Error('Invalid task input ownership');
  }
  const state = options.sharedState
    ? new SharedWorkerState(options.sharedState)
    : options.sharedState !== false && options.cancellationMode === 'cooperative'
      ? createSharedWorkerState()
      : undefined;
  if (options.sharedState && !getWorkerCapabilities().sharedMemory)
    throw new Error('Shared worker memory is unavailable');
  state?.throwIfCancelled();
  const prepared = {...options, sharedState: state?.buffer ?? options.sharedState};
  const {signal, onProgress, onMetrics, workerPool, admission, ...processorOptions} = prepared;
  const envelope = {
    input,
    options: getTransferListForWriter(processorOptions),
    context: getTransferListForWriter(jobContext)
  };
  if (prepared.inputOwnership === 'share' && getTransferList(envelope).length) {
    throw new Error('Share ownership requires SharedArrayBuffer storage');
  }
  const copied = structuredClone(envelope, {
    transfer:
      options.inputOwnership === 'copy' || options.inputOwnership === 'share'
        ? []
        : getTransferList(envelope)
  });
  const controller = new AbortController();
  return new Promise<Output>((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    const abort = (reason: unknown) => {
      if (settled) return;
      settled = true;
      controller.abort(reason);
      state?.cancel();
      cleanup();
      reject(reason);
    };
    const onAbort = () => abort(signal?.reason);
    const throwIfAborted = () => {
      controller.signal.throwIfAborted();
      state?.throwIfCancelled();
    };
    const localContext: WorkerContext = {
      ...context,
      signal: controller.signal,
      sharedState: state,
      throwIfAborted,
      reportProgress: progress => {
        if (settled) return;
        try {
          throwIfAborted();
          onProgress?.(progress);
        } catch (error) {
          abort(error);
          throw error;
        }
      }
    };
    signal?.addEventListener('abort', onAbort, {once: true});
    if (signal?.aborted) {
      onAbort();
      return;
    }
    const finish = (value: Output) => {
      if (settled) return;
      try {
        throwIfAborted();
      } catch (error) {
        abort(error);
        return;
      }
      settled = true;
      cleanup();
      try {
        resolve(structuredClone(value, {transfer: getTransferList(value)}));
      } catch (error) {
        reject(error);
      }
    };
    try {
      throwIfAborted();
      const result = task.process!(
        copied.input,
        copied.options as Options,
        localContext,
        copied.context
      );
      void Promise.resolve(result).then(finish, error => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(error);
        }
      });
    } catch (error) {
      if (!settled) {
        settled = true;
        cleanup();
        reject(error);
      }
    }
  });
}

function nextWithSignal<T>(
  iterator: AsyncIterator<T> | Iterator<T>,
  signal?: AbortSignal
): Promise<IteratorResult<T>> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      cleanup();
      reject(signal?.reason);
    };
    const cleanup = () => signal?.removeEventListener('abort', abort);
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) {
      abort();
      return;
    }
    try {
      void Promise.resolve(iterator.next()).then(
        value => {
          cleanup();
          resolve(value);
        },
        error => {
          cleanup();
          reject(error);
        }
      );
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

/** Bound successive local batches without adding a scheduling hop to every small request. */
function yieldToEventLoop(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, 0);
    const abort = () => {
      clearTimeout(timer);
      cleanup();
      reject(signal?.reason);
    };
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) abort();
  });
}

/** Copy reusable metadata per request, preserving aliases within options/context. */
function reusableBatchRequest<Input, Options extends object>(
  input: Input,
  options: TaskOptions<Input> & Partial<Options>,
  jobContext: WorkerJobContext
): {options: TaskOptions<Input> & Partial<Options>; context: WorkerJobContext} {
  if (options.inputOwnership === 'copy' || options.inputOwnership === 'share') {
    return {options, context: jobContext};
  }
  const {
    signal,
    onProgress,
    onMetrics,
    onDebug,
    onExecution,
    workerPool,
    admission,
    execution,
    mainThread,
    sharedState,
    ...portable
  } = options;
  const metadata = {
    options: getTransferListForWriter(portable),
    context: getTransferListForWriter(jobContext)
  };
  const metadataTransfers = new Set(getTransferList(metadata));
  if (getTransferList(input).some(buffer => metadataTransfers.has(buffer))) {
    throw new Error(
      'Transferred batch input aliases reusable options/context; use inputOwnership: copy'
    );
  }
  const copied = structuredClone(metadata);
  return {options: {...options, ...copied.options}, context: copied.context};
}
