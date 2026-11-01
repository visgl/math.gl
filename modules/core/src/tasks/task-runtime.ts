// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createWorker, WorkerBody, getTransferList, type WorkerContext} from '../worker-utils/index';
import {preloadTaskCode} from './task-preload';
import type {AnyTask, TaskContext, TaskRunControls} from './task';

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

export function taskContext(state: any, context: WorkerContext = {}): TaskContext<any> {
  const signal = context.signal ?? new AbortController().signal;
  return {
    state,
    signal,
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

  async initialize(input: object, context: WorkerContext = {}): Promise<object> {
    if (this.initialized) throw new Error('Task is already initialized');
    assertPayload(input);
    await preloadTaskCode(this.task);
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

  async process(input: object, options: object, context: WorkerContext = {}): Promise<object> {
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
    context: WorkerContext = {}
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
