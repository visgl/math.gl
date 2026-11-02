// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
/// <reference lib="es2021.promise" />

import {
  WorkerPool,
  getTransferList,
  processOnWorker,
  processOnWorkerInBatches,
  type WorkerObject,
  type ProcessOnWorkerOptions
} from '../worker-utils/index';
import {TaskRuntime, assertPayload, clonePayload, localContext} from './task-runtime';
import {runTaskSync} from './task-sync';
import {TaskOperationQueue} from './task-operation-queue';
import {TaskWorkerChannel} from './task-worker-channel';
import type {
  AnyTask,
  TaskInput,
  TaskOutput,
  TaskBatchInput,
  TaskBatchOutput,
  Initialization,
  TaskRunControls,
  TaskInitializeControls,
  TaskRunOptions,
  TaskBatchRunOptions,
  TaskRunsOptions,
  InitializedTaskOptions,
  InitializedTaskCallOptions,
  InitializedTaskBatchOptions,
  RequestArgs,
  TaskRunnerOptions,
  SynchronousTask,
  TaskSyncRunOptions
} from './task';

/** A state instance bound to one execution location, serialized unless explicitly opted in. */
export class InitializedTask<D extends AnyTask> {
  private runtime: TaskRuntime;
  private pool?: WorkerPool;
  private workerChannel?: TaskWorkerChannel;
  private channelInputs?: AsyncIterator<object>;
  private nextProgressId = 1;
  private progressCallbacks = new Map<number, TaskRunControls['onProgress']>();
  private streamProgress?: TaskRunControls['onProgress'];
  private descriptor?: WorkerObject;
  private readonly operationQueue: TaskOperationQueue;
  private closing?: Promise<void>;
  private closed = false;
  private finalized = false;
  private streams = new Set<() => Promise<void>>();
  private invalid = false;
  private readonly concurrent: boolean;
  private controller = new AbortController();

  /** @internal Use TaskRunner.initializeTask. */
  constructor(
    private task: D,
    private release: () => void,
    private readonly initializationControls: TaskInitializeControls
  ) {
    const controls = initializationControls;
    this.runtime = new TaskRuntime(task);
    const concurrency = controls.operationConcurrency ?? 1;
    const maximum = task.concurrency?.maxConcurrency ?? 1;
    if (
      !Number.isSafeInteger(maximum) ||
      maximum < 1 ||
      !Number.isSafeInteger(concurrency) ||
      concurrency < 1 ||
      concurrency > maximum
    ) {
      throw new RangeError('Task concurrency must be between 1 and the task maximum');
    }
    this.operationQueue = new TaskOperationQueue(concurrency);
    this.concurrent = concurrency > 1;
    const execution = controls.execution ?? 'auto';
    if (!['auto', 'main-thread', 'worker'].includes(execution))
      throw new TypeError('Invalid execution mode');
    if (execution === 'worker' && !task.worker) throw new Error('Task has no worker');
    if (execution !== 'main-thread' && task.worker) {
      const target = task.worker;
      if (Boolean(target.url) === Boolean(target.create))
        throw new Error('Supply exactly one worker URL or factory');
      if (this.concurrent || controls.onRequest || controls.onEvent) {
        this.workerChannel = new TaskWorkerChannel(task.id, target, {
          handleRequest: async (operation, payload, signal) => {
            if (operation === 'task:next-input') {
              if (!this.channelInputs) throw new Error('No active task stream');
              return this.channelInputs.next();
            }
            if (!controls.onRequest) throw new Error('No host request handler configured');
            const request = payload as {operation: string; payload: unknown};
            if (operation !== 'task:host-request') throw new Error('Unknown host request');
            return controls.onRequest(request.operation, request.payload, signal);
          },
          getResultTransferList: (value, request) =>
            (request as {outputOwnership?: string}).outputOwnership === 'transfer'
              ? getTransferList(value)
              : [],
          handleEvent: (operation, payload) => {
            if (operation === 'task:progress') {
              const event = payload as {
                id: number;
                progress: Parameters<NonNullable<TaskRunControls['onProgress']>>[0];
              };
              (this.progressCallbacks.get(event.id) ?? this.streamProgress)?.(event.progress);
            } else if (operation === 'task:host-event') {
              const event = payload as {operation: string; payload: unknown};
              controls.onEvent?.(event.operation, event.payload);
            }
          },
          onFailure: reason => {
            this.invalid = true;
            this.operationQueue.cancelPending(reason);
            this.controller.abort(reason);
          }
        });
        return;
      }
      this.pool = new WorkerPool({
        name: task.id,
        url: target.url?.toString(),
        loadWorker: target.create,
        workerType: 'module',
        maxConcurrency: 1,
        maxMobileConcurrency: 1
      });
      this.descriptor = {
        id: task.id,
        name: task.id,
        module: 'core',
        version: 'prototype',
        options: {},
        worker: target.url?.toString() ?? true,
        loadWorker: target.create,
        workerInBatches: target.capabilities.streaming
      };
    }
  }

  /** @internal */
  async initialize(input: object, controls: TaskRunControls): Promise<void> {
    try {
      assertPayload(input);
      await this.enqueue(() => this.invoke('initialize', input, {}, controls));
    } catch (error) {
      await this.terminate(error);
      throw error;
    }
  }

  runTask(
    input: TaskInput<D>,
    ...args: RequestArgs<InitializedTaskCallOptions<D>>
  ): Promise<TaskOutput<D>> {
    if (this.invalid)
      return Promise.reject(new Error('Initialized task is invalid; initialize a new instance'));
    if (this.closed) return Promise.reject(new Error('Initialized task is closed'));
    const timeout = args[0]?.timeout;
    if (
      timeout !== undefined &&
      (!Number.isSafeInteger(timeout) || timeout < 0 || timeout > 4294967295)
    ) {
      return Promise.reject(new RangeError('Invalid task timeout'));
    }
    const deadline = timeout === undefined ? undefined : AbortSignal.timeout(timeout);
    const signal =
      deadline && args[0]?.signal
        ? AbortSignal.any([deadline, args[0].signal])
        : (deadline ?? args[0]?.signal);
    const controls = {...args[0], signal};
    const mode = this.task.concurrency?.getSchedulingMode?.(input) ?? 'exclusive';
    return this.operationQueue.run(
      mode,
      async () => {
        this.checkCapability('atomic');
        const invalidate = () => {
          if (this.concurrent) {
            this.invalid = true;
            this.operationQueue.cancelPending(signal?.reason);
            this.controller.abort(signal?.reason);
          }
        };
        signal?.addEventListener('abort', invalidate, {once: true});
        try {
          if (signal?.aborted) invalidate();
          return await this.invoke('process', input, (args[0] as any)?.options ?? {}, controls);
        } finally {
          signal?.removeEventListener('abort', invalidate);
        }
      },
      signal
    ) as Promise<TaskOutput<D>>;
  }

  /** Independent calls sharing this instance, always serial and in input order. */
  async *runTasks(
    inputs: Iterable<TaskInput<D>> | AsyncIterable<TaskInput<D>>,
    ...args: RequestArgs<InitializedTaskOptions<D>>
  ): AsyncIterable<TaskOutput<D>> {
    yield* this.serialStream(async function* (self) {
      self.checkCapability('atomic');
      for await (const input of asAsync(inputs, self.controls(args[0]).signal)) {
        yield await self.invoke('process', input, (args[0] as any)?.options ?? {}, args[0]);
      }
    });
  }

  /** One processor invocation for the entire input iterable. */
  async *runTaskInBatches(
    inputs: Iterable<TaskBatchInput<D>> | AsyncIterable<TaskBatchInput<D>>,
    ...args: RequestArgs<InitializedTaskBatchOptions<D>>
  ): AsyncIterable<TaskBatchOutput<D>> {
    yield* this.serialStream(async function* (self) {
      self.checkCapability('streaming');
      const controls = self.controls(args[0]);
      const options = clonePayload((args[0] as any)?.options ?? {});
      async function* prepared() {
        for await (const input of asAsync(inputs, controls.signal)) {
          controls.signal?.throwIfAborted();
          assertNoTransferAlias(input, (args[0] as any)?.options ?? {}, controls.inputOwnership);
          yield clonePayload(input, controls.inputOwnership);
        }
      }
      let completed = false;
      try {
        if (self.workerChannel) {
          self.channelInputs = prepared()[Symbol.asyncIterator]();
          self.streamProgress = controls.onProgress;
          try {
            await self.invoke('stream-open', {}, options, controls);
            while (true) {
              const result = await self.invoke('stream-next', {}, {}, controls);
              if (result.done) break;
              yield result.value;
            }
          } finally {
            try {
              if (!self.invalid) await self.invoke('stream-close', {}, {}, controls);
            } finally {
              await self.channelInputs.return?.();
              self.channelInputs = undefined;
              self.streamProgress = undefined;
            }
          }
        } else if (self.pool) {
          await self.invoke('stream-options', {}, options, controls);
          yield* processOnWorkerInBatches(self.descriptor!, prepared(), {
            ...self.workerOptions(controls),
            inputOwnership: 'transfer',
            workerInBatches: true
          });
        } else {
          for await (const output of self.runtime.stream(
            prepared(),
            options,
            self.runtimeContext(controls)
          )) {
            controls.signal?.throwIfAborted();
            yield clonePayload(output, controls.outputOwnership ?? 'transfer');
          }
        }
        completed = true;
      } catch (error) {
        if (self.workerChannel) {
          self.invalid = true;
          self.operationQueue.cancelPending(error);
          self.controller.abort(error);
          await self.workerChannel.destroy(error);
        }
        if (self.pool) {
          self.invalid = true;
          await self.pool.destroy(error);
        }
        throw error;
      } finally {
        // Legacy stream cancellation may terminate the pinned worker. Never reuse
        // an incarnation after ending a worker stream without a success handshake.
        if (self.pool && !completed) self.invalid = true;
      }
    });
  }

  /** Lifecycle status of this initialized task. */
  get state(): 'ready' | 'closing' | 'closed' | 'invalid' {
    if (this.invalid) return 'invalid';
    if (this.finalized) return 'closed';
    return this.closed ? 'closing' : 'ready';
  }

  /** Drain accepted work, invoke destroy, and release execution capacity. */
  close(): Promise<void> {
    if (!this.closing) {
      this.closed = true;
      this.closing = (async () => {
        try {
          await this.operationQueue.close();
          if (!this.invalid) await this.invoke('destroy', {}, {});
          else if (!this.pool && !this.workerChannel) await this.runtime.destroy();
        } finally {
          try {
            await this.pool?.destroy();
            await this.workerChannel?.destroy();
          } finally {
            this.finalized = true;
            this.release();
          }
        }
      })();
    }
    return this.closing;
  }

  /** Abort work. Local JavaScript must settle before its state can be destroyed. */
  async terminate(reason: unknown = new Error('Task terminated')): Promise<void> {
    this.operationQueue.cancelPending(reason);
    this.controller.abort(reason);
    if (this.workerChannel) {
      this.invalid = true;
      await this.workerChannel.destroy(reason);
    }
    if (this.pool) {
      this.invalid = true;
      await this.pool.destroy(reason);
    }
    await Promise.allSettled([...this.streams].map(stop => stop()));
    await this.close();
  }

  private checkCapability(kind: 'atomic' | 'streaming'): void {
    if (
      this.pool || this.workerChannel
        ? !this.task.worker?.capabilities[kind]
        : !(kind === 'atomic' ? this.task.process : this.task.processInBatches)
    ) {
      throw new Error(`Task has no ${kind} processor for this execution route`);
    }
  }

  private controls(controls: TaskRunControls = {}): TaskRunControls {
    if (controls.outputOwnership && !['copy', 'transfer'].includes(controls.outputOwnership))
      throw new TypeError('Invalid output ownership');
    return {
      ...controls,
      signal: controls.signal
        ? AbortSignal.any([controls.signal, this.controller.signal])
        : this.controller.signal
    };
  }

  private workerOptions(controls: TaskRunControls): ProcessOnWorkerOptions {
    return {
      workerPool: this.pool,
      workerType: 'module',
      inputOwnership: controls.inputOwnership ?? 'copy',
      outputOwnership: controls.outputOwnership ?? 'transfer',
      signal: controls.signal,
      onProgress: controls.onProgress,
      cancellationMode: 'terminate'
    };
  }

  private async invoke(
    operation: string,
    input: any,
    options: object,
    controls: TaskRunControls = {}
  ): Promise<any> {
    if (this.invalid) throw new Error('Initialized task is invalid; initialize a new instance');
    const prepared = operation === 'destroy' ? {} : this.controls(controls);
    prepared.signal?.throwIfAborted();
    assertPayload(input);
    assertNoTransferAlias(input, options, prepared.inputOwnership);
    const copiedOptions = clonePayload(options);
    if (this.workerChannel) {
      const progressId = this.nextProgressId++;
      this.progressCallbacks.set(progressId, prepared.onProgress);
      const request = {
        input: clonePayload(input, prepared.inputOwnership),
        options: copiedOptions,
        outputOwnership: prepared.outputOwnership ?? 'transfer',
        progressId
      };
      try {
        return await this.workerChannel.channel.request(
          operation,
          request,
          prepared.signal,
          getTransferList(request)
        );
      } catch (reason) {
        this.invalid = true;
        this.operationQueue.cancelPending(reason);
        this.controller.abort(reason);
        await this.workerChannel.destroy(reason);
        throw reason;
      } finally {
        this.progressCallbacks.delete(progressId);
      }
    }
    if (this.pool) {
      try {
        return await processOnWorker(
          this.descriptor!,
          {operation, input: clonePayload(input, prepared.inputOwnership), options: copiedOptions},
          this.workerOptions({...prepared, inputOwnership: 'transfer'})
        );
      } catch (error) {
        // A transport error can indicate loss of pinned state. Conservatively
        // invalidate rather than silently starting a new worker incarnation.
        this.invalid = true;
        await this.pool.destroy(error);
        throw error;
      }
    }
    if (operation === 'destroy') return this.runtime.destroy();
    const copied = clonePayload(input, prepared.inputOwnership);
    const context = this.runtimeContext(prepared);
    if (operation === 'initialize') {
      const result = await this.runtime.initialize(copied, context);
      prepared.signal?.throwIfAborted();
      return result;
    }
    const result = await this.runtime.process(copied, copiedOptions, context);
    prepared.signal?.throwIfAborted();
    return clonePayload(result, prepared.outputOwnership ?? 'transfer');
  }

  private runtimeContext(prepared: TaskRunControls) {
    return {
      ...localContext(prepared),
      requestHost: async (
        operation: string,
        payload: object,
        controls: Pick<TaskRunControls, 'inputOwnership' | 'outputOwnership'> = {}
      ) => {
        const signal = prepared.signal ?? this.controller.signal;
        signal.throwIfAborted();
        const handler = this.initializationControls.onRequest;
        if (!handler) throw new Error('No host request handler configured');
        const result = await handler(
          operation,
          clonePayload(payload, controls.inputOwnership),
          signal
        );
        signal.throwIfAborted();
        return structuredClone(result, {
          transfer: controls.outputOwnership === 'transfer' ? getTransferList(result) : []
        });
      },
      emitHost: (operation: string, payload: object) =>
        this.initializationControls.onEvent?.(operation, structuredClone(payload))
    };
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    if (this.closed) return Promise.reject(new Error('Initialized task is closed'));
    return this.operationQueue.run('exclusive', operation);
  }

  private async *serialStream<T>(operation: (self: this) => AsyncIterable<T>): AsyncIterable<T> {
    if (this.closed) throw new Error('Initialized task is closed');
    let acquire!: () => void;
    const acquired = new Promise<void>(resolve => {
      acquire = resolve;
    });
    let release!: () => void;
    const held = new Promise<void>(resolve => {
      release = resolve;
    });
    const lease = this.operationQueue.run('exclusive', async () => {
      acquire();
      await held;
    });
    await Promise.race([acquired, lease]);
    if (this.controller.signal.aborted) {
      release();
      throw this.controller.signal.reason;
    }
    const iterator = operation(this)[Symbol.asyncIterator]();
    let stopping: Promise<void> | undefined;
    const stop = () => {
      stopping ??= (async () => {
        try {
          await iterator.return?.();
        } finally {
          this.streams.delete(stop);
          release();
        }
      })();
      return stopping;
    };
    this.streams.add(stop);
    try {
      while (true) {
        this.controller.signal.throwIfAborted();
        const next = await iterator.next();
        if (next.done) return;
        yield next.value;
      }
    } finally {
      await stop();
    }
  }
}

/**
 * Owns execution capacity and task lifetimes. No shared singleton or task registry.
 * This experimental prototype deliberately exposes only implemented controls.
 */
export class TaskRunner {
  private maxConcurrency: number;
  private active = new Set<InitializedTask<any>>();
  private count = 0;
  private waiters: Array<{
    resolve: () => void;
    reject: (error: unknown) => void;
  }> = [];
  private closed = false;
  private closing?: Promise<void>;
  private initializing = new Set<Promise<unknown>>();
  private iterations = new Set<AbortController>();

  constructor(options: TaskRunnerOptions = {}) {
    this.maxConcurrency = options.maxConcurrency ?? 1;
    if (!Number.isSafeInteger(this.maxConcurrency) || this.maxConcurrency < 1)
      throw new RangeError('maxConcurrency must be a positive safe integer');
  }

  /** Execute synchronous hooks immediately on the calling thread, without queueing. */
  runTaskSync<D extends AnyTask>(
    task: D & SynchronousTask<D>,
    input: TaskInput<D>,
    ...args: RequestArgs<TaskSyncRunOptions<D>>
  ): TaskOutput<D> {
    if (this.closed) throw new Error('Task runner is closed');
    if (this.count >= this.maxConcurrency)
      throw new Error('Task runner has no synchronous capacity');
    this.count++;
    try {
      return runTaskSync(task, input, args[0]);
    } finally {
      const waiter = this.waiters.shift();
      if (waiter) waiter.resolve();
      else this.count--;
    }
  }

  initializeTask<D extends AnyTask>(
    task: D,
    initialization: Initialization<D>,
    controls: TaskInitializeControls = {}
  ): Promise<InitializedTask<D>> {
    const pending = this.open(task, initialization, controls);
    this.initializing.add(pending);
    void pending.then(
      () => this.initializing.delete(pending),
      () => this.initializing.delete(pending)
    );
    return pending;
  }

  async runTask<D extends AnyTask>(
    task: D,
    input: TaskInput<D>,
    ...args: RequestArgs<TaskRunOptions<D>>
  ): Promise<TaskOutput<D>> {
    const request = (args[0] as any) ?? {};
    const handle = await this.initializeTask(task, request.initialization ?? {}, {
      ...request,
      inputOwnership: request.initializationOwnership ?? 'copy'
    });
    return finish(handle, () => handle.runTask(input, request));
  }

  async *runTasks<D extends AnyTask>(
    task: D,
    inputs: Iterable<TaskInput<D>> | AsyncIterable<TaskInput<D>>,
    ...args: RequestArgs<TaskRunsOptions<D>>
  ): AsyncIterable<TaskOutput<D>> {
    const request = (args[0] as any) ?? {};
    if (this.closed) throw new Error('Task runner is closed');
    if (request.initializationOwnership === 'transfer')
      throw new TypeError('runTasks initialization is a reusable template; use copy or share');
    const concurrency = request.concurrency ?? 1;
    if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > this.maxConcurrency)
      throw new RangeError('concurrency must be between 1 and maxConcurrency');
    const handles: InitializedTask<D>[] = [];
    const busy = new Set<InitializedTask<D>>();
    const pending: Array<
      Promise<{
        kind: 'result';
        handle: InitializedTask<D>;
        value?: TaskOutput<D>;
        error?: unknown;
        failed?: boolean;
      }>
    > = [];
    const controller = new AbortController();
    this.iterations.add(controller);
    const signal = request.signal
      ? AbortSignal.any([request.signal, controller.signal])
      : controller.signal;
    const iterator = asAsync(inputs, signal)[Symbol.asyncIterator]();
    let finished = false;
    let reading: Promise<{kind: 'input'; next: IteratorResult<TaskInput<D>>}> | undefined;
    try {
      while (!finished || pending.length) {
        signal.throwIfAborted();
        if (!finished && !reading && pending.length < concurrency) {
          reading = iterator.next().then(next => ({kind: 'input' as const, next}));
        }
        const event = await Promise.race([
          ...(pending.length ? [pending[0]!] : []),
          ...(reading ? [reading] : [])
        ]);
        if (event.kind === 'result') {
          pending.shift();
          busy.delete(event.handle);
          if (event.failed) throw event.error;
          yield event.value!;
          continue;
        }
        reading = undefined;
        if (event.next.done) {
          finished = true;
          continue;
        }
        let handle = handles.find(candidate => !busy.has(candidate));
        // Check capacity immediately before opening: open reserves it synchronously.
        // Never wait for an extra slot while already holding one.
        if (!handle && (handles.length === 0 || this.count < this.maxConcurrency)) {
          handle = await this.initializeTask(
            task,
            clonePayload(request.initialization ?? {}, request.initializationOwnership),
            {
              ...request,
              signal,
              inputOwnership: request.initializationOwnership ?? 'copy'
            }
          );
          handles.push(handle);
        }
        if (!handle) {
          const result = await pending.shift()!;
          busy.delete(result.handle);
          if (result.failed) throw result.error;
          yield result.value!;
          handle = result.handle;
        }
        busy.add(handle);
        const current = handle;
        pending.push(
          handle.runTask(event.next.value, {...request, signal}).then(
            value => ({kind: 'result' as const, handle: current, value}),
            error => ({kind: 'result' as const, handle: current, failed: true, error})
          )
        );
      }
    } finally {
      this.iterations.delete(controller);
      controller.abort(new Error('Task iteration closed'));
      try {
        if (reading) await reading.catch(() => {});
        if (!finished) await iterator.return?.();
      } finally {
        await Promise.all(pending);
        await Promise.all(handles.map(handle => handle.close()));
      }
    }
  }

  async *runTaskInBatches<D extends AnyTask>(
    task: D,
    inputs: Iterable<TaskBatchInput<D>> | AsyncIterable<TaskBatchInput<D>>,
    ...args: RequestArgs<TaskBatchRunOptions<D>>
  ): AsyncIterable<TaskBatchOutput<D>> {
    const request = (args[0] as any) ?? {};
    const handle = await this.initializeTask(task, request.initialization ?? {}, {
      ...request,
      inputOwnership: request.initializationOwnership ?? 'copy'
    });
    try {
      yield* handle.runTaskInBatches(inputs, request);
    } finally {
      await handle.close();
    }
  }

  /** Close owned handles and workers. Finish or return active iterators first. */
  close(): Promise<void> {
    if (!this.closing) {
      this.closed = true;
      for (const waiter of this.waiters.splice(0))
        waiter.reject(new Error('Task runner is closed'));
      this.closing = (async () => {
        await Promise.allSettled(this.initializing);
        const results = await Promise.allSettled([...this.active].map(handle => handle.close()));
        const failure = results.find(result => result.status === 'rejected');
        if (failure?.status === 'rejected') throw failure.reason;
      })();
    }
    return this.closing;
  }

  async terminate(reason: unknown = new Error('Task runner terminated')): Promise<void> {
    for (const controller of this.iterations) controller.abort(reason);
    const closing = this.close();
    await Promise.allSettled([...this.active].map(handle => handle.terminate(reason)));
    await closing;
  }

  private async open<D extends AnyTask>(
    task: D,
    initialization: object,
    controls: TaskInitializeControls
  ): Promise<InitializedTask<D>> {
    if (this.closed) throw new Error('Task runner is closed');
    controls.signal?.throwIfAborted();
    if (this.count >= this.maxConcurrency) {
      await new Promise<void>((resolve, reject) => {
        const waiter = {
          resolve: () => {
            cleanup();
            resolve();
          },
          reject: (error: unknown) => {
            cleanup();
            reject(error);
          }
        };
        const abort = () => {
          this.waiters = this.waiters.filter(item => item !== waiter);
          waiter.reject(controls.signal?.reason);
        };
        const cleanup = () => controls.signal?.removeEventListener('abort', abort);
        this.waiters.push(waiter);
        controls.signal?.addEventListener('abort', abort, {once: true});
        if (controls.signal?.aborted) abort();
      });
    } else this.count++;
    let handle: InitializedTask<D> | undefined;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      if (handle) this.active.delete(handle);
      const waiter = this.waiters.shift();
      if (waiter) waiter.resolve();
      else this.count--;
    };
    try {
      if (this.closed) throw new Error('Task runner is closed');
      handle = new InitializedTask(task, release, controls);
      this.active.add(handle);
      await handle.initialize(initialization, controls);
      return handle;
    } catch (error) {
      release();
      throw error;
    }
  }
}

async function finish<T>(handle: InitializedTask<any>, operation: () => Promise<T>): Promise<T> {
  let result: T;
  try {
    result = await operation();
  } catch (error) {
    try {
      await handle.close();
    } catch (cleanup) {
      throw new AggregateError([error, cleanup], 'Task processing and destruction failed');
    }
    throw error;
  }
  await handle.close();
  return result;
}

async function* asAsync<T>(
  inputs: Iterable<T> | AsyncIterable<T>,
  signal?: AbortSignal
): AsyncIterable<T> {
  const iterator =
    Symbol.asyncIterator in inputs ? inputs[Symbol.asyncIterator]() : inputs[Symbol.iterator]();
  let done = false;
  let blocked = false;
  try {
    while (true) {
      const next = await new Promise<IteratorResult<T>>((resolve, reject) => {
        const cleanup = () => signal?.removeEventListener('abort', abort);
        const abort = () => {
          cleanup();
          reject(signal?.reason);
        };
        signal?.addEventListener('abort', abort, {once: true});
        if (signal?.aborted) {
          abort();
          return;
        }
        try {
          blocked = true;
          Promise.resolve(iterator.next()).then(
            value => {
              blocked = false;
              cleanup();
              resolve(value);
            },
            error => {
              blocked = false;
              cleanup();
              reject(error);
            }
          );
        } catch (error) {
          blocked = false;
          cleanup();
          reject(error);
        }
      });
      if (next.done) {
        done = true;
        return;
      }
      yield next.value;
    }
  } finally {
    if (!done) {
      if (blocked) {
        try {
          void Promise.resolve(iterator.return?.()).catch(() => {});
        } catch {
          /* A blocked producer cannot be forced to settle. */
        }
      } else {
        await iterator.return?.();
      }
    }
  }
}

function assertNoTransferAlias(input: unknown, options: unknown, ownership?: string): void {
  if (ownership === 'transfer') {
    const metadata = new Set(getTransferList(options));
    if (getTransferList(input).some(buffer => metadata.has(buffer))) {
      throw new Error('Transferred input aliases reusable options; use inputOwnership: copy');
    }
  }
}
