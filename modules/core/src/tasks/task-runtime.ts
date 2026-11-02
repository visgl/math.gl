// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createWorker, WorkerBody, getTransferList, type WorkerContext} from '../worker-utils/index';
import {preloadTaskCode} from './task-preload';
import type {AnyTask, TaskContext, TaskRunControls} from './task';
import {TaskChannel, type TaskChannelMessage} from './task-channel';

/** Optional host services available to either execution backend. */
type RuntimeContext = WorkerContext & Partial<Pick<TaskContext, 'requestHost' | 'emitHost'>>;

/** Validate the record boundary for JavaScript callers as well as TypeScript. */
export function assertPayload(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError('Task payloads must be plain objects with named fields');
  }
}

export function clonePayload(value: any, ownership: 'copy' | 'transfer' | 'share' = 'copy'): any {
  assertPayload(value);
  if (!['copy', 'transfer', 'share'].includes(ownership))
    throw new TypeError('Invalid input ownership');
  const transfer = getTransferList(value);
  if (ownership === 'share' && transfer.length)
    throw new TypeError('Share requires shared storage');
  return structuredClone(value, {
    transfer: ownership === 'transfer' ? transfer : []
  });
}

export function taskContext(state: any, context: RuntimeContext = {}): TaskContext<any> {
  const signal = context.signal ?? new AbortController().signal;
  return {
    state,
    signal,
    requestHost: async (operation, payload, controls) => {
      signal.throwIfAborted();
      if (!context.requestHost) throw new Error('No host request handler configured');
      return context.requestHost(operation, payload, controls);
    },
    emitHost: (operation, payload) => {
      signal.throwIfAborted();
      context.emitHost?.(operation, payload);
    },
    throwIfAborted: () => {
      signal.throwIfAborted();
      context.throwIfAborted?.();
    },
    reportProgress: progress =>
      context.reportProgress?.({
        ...progress,
        phase: progress.phase ?? 'process',
        unit: progress.unit ?? 'items'
      })
  };
}

/** Shared lifecycle implementation used by both local and worker execution. */
export class TaskRuntime {
  private state: any;
  private initialized = false;
  constructor(private task: AnyTask) {}

  async initialize(input: object, context: RuntimeContext = {}): Promise<object> {
    if (this.initialized) throw new Error('Task is already initialized');
    assertPayload(input);
    await preloadTaskCode(this.task, context.signal);
    context.signal?.throwIfAborted();
    this.state = await this.task.initialize?.(input, taskContext(undefined, context));
    this.initialized = true;
    return {};
  }

  async destroy(): Promise<object> {
    if (this.initialized) {
      this.initialized = false;
      const state = this.state;
      this.state = undefined;
      if (this.task.initialize) await this.task.destroy?.(state);
    }
    return {};
  }

  async process(input: object, options: object, context: RuntimeContext = {}): Promise<object> {
    if (!this.initialized) throw new Error('Task is not initialized');
    if (!this.task.process) throw new Error('Task has no atomic processor');
    assertPayload(input);
    const result = await this.task.process(input, options, taskContext(this.state, context));
    assertPayload(result);
    return result;
  }

  async *stream(
    inputs: AsyncIterable<object>,
    options: object,
    context: RuntimeContext = {}
  ): AsyncIterable<object> {
    if (!this.initialized) throw new Error('Task is not initialized');
    if (!this.task.processInBatches) throw new Error('Task has no streaming processor');
    for await (const output of this.task.processInBatches(
      inputs,
      options,
      taskContext(this.state, context)
    )) {
      assertPayload(output);
      yield output;
    }
  }
}

/**
 * Install one task's protocol inside an existing worker and announce readiness.
 * Does not create a Worker, register an ID, or invoke the task's initialize hook.
 */
export async function initializeTaskWorker(task: AnyTask): Promise<void> {
  if (!(await WorkerBody.inWorkerThread()))
    throw new Error('initializeTaskWorker must run inside a worker');
  if (installed) throw new Error('A task is already installed in this worker');
  installed = true;
  const runtime = new TaskRuntime(task);
  let channelStream: AsyncIterator<object> | undefined;
  // The dedicated channel shares this runtime with the legacy serialized path.
  // An initialized task chooses one transport for its entire lifetime.
  const channel = new TaskChannel({
    getResultTransferList: (value, request) =>
      (request as {outputOwnership?: string}).outputOwnership === 'transfer'
        ? getTransferList(value)
        : [],
    send: (message, transfer) => {
      // Snapshot before WorkerBody awaits its platform port. This both preserves
      // notification values and detaches only the explicitly owned buffers.
      const snapshot = structuredClone(message, {transfer});
      void WorkerBody.postMessage('task-channel' as never, snapshot as never).catch(reason =>
        channel.fail(reason)
      );
    },
    handleRequest: async (operation, value, signal) => {
      const request = value as {
        input: object;
        options: object;
        outputOwnership?: 'copy' | 'transfer';
        progressId: number;
      };
      const context: RuntimeContext = {
        signal,
        reportProgress: progress =>
          channel.emit('task:progress', {id: request.progressId, progress}),
        requestHost: (operation, payload, controls = {}) => {
          const request = {
            operation,
            payload: clonePayload(payload, controls.inputOwnership),
            outputOwnership: controls.outputOwnership ?? 'copy'
          };
          return channel.request('task:host-request', request, signal, getTransferList(request));
        },
        emitHost: (operation, payload) => channel.emit('task:host-event', {operation, payload})
      };
      switch (operation) {
        case 'initialize':
          return runtime.initialize(request.input, context);
        case 'process':
          return runtime.process(request.input, request.options, context);
        case 'stream-open': {
          if (channelStream) throw new Error('A task stream is already open');
          async function* inputs() {
            while (true) {
              const result = (await channel.request(
                'task:next-input',
                {},
                signal
              )) as IteratorResult<object>;
              if (result.done) return;
              yield result.value;
            }
          }
          channelStream = runtime
            .stream(inputs(), request.options, context)
            [Symbol.asyncIterator]();
          return {};
        }
        case 'stream-next':
          if (!channelStream) throw new Error('No active task stream');
          return channelStream.next();
        case 'stream-close':
          try {
            await channelStream?.return?.();
          } finally {
            channelStream = undefined;
          }
          return {};
        case 'destroy':
          return runtime.destroy();
        default:
          throw new Error('Unknown task channel operation');
      }
    }
  });
  await WorkerBody.addEventListener((type, payload) => {
    if (type === ('task-channel' as never))
      channel.receive(payload as unknown as TaskChannelMessage);
  });
  let streamOptions: object = {};
  return createWorker(
    async (request, _options, context) => {
      switch (request.operation) {
        case 'initialize':
          return runtime.initialize(request.input, context);
        case 'destroy':
          return runtime.destroy();
        case 'stream-options':
          streamOptions = request.options;
          return {};
        case 'process':
          return runtime.process(request.input, request.options, context);
        default:
          throw new Error('Unknown task operation');
      }
    },
    async function* (inputs, _options, context) {
      async function* batches() {
        for await (const input of inputs) {
          assertPayload(input);
          yield input;
        }
      }
      try {
        yield* runtime.stream(batches(), streamOptions, context);
      } finally {
        streamOptions = {};
      }
    },
    () => preloadTaskCode(task)
  );
}
let installed = false;

export function localContext(controls: TaskRunControls): WorkerContext {
  return {
    signal: controls.signal,
    reportProgress: progress => controls.onProgress?.(progress)
  };
}
