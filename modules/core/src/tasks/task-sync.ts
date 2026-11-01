// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getTransferList} from '../worker-utils/index';
import {assertPayload, clonePayload, taskContext, localContext} from './task-runtime';
import type {AnyTask, TaskInput, TaskOutput, TaskSyncRunOptions} from './task';

/** Internal synchronous lifecycle; never creates a worker or waits for capacity. */
export function runTaskSync<D extends AnyTask>(
  task: D,
  input: TaskInput<D>,
  request: TaskSyncRunOptions<D> = {} as TaskSyncRunOptions<D>
): TaskOutput<D> {
  if ('execution' in request) throw new TypeError('runTaskSync always runs on the calling thread');
  if (!task.process) throw new TypeError('Task has no atomic processor');
  for (const hook of [task.initialize, task.process, task.destroy]) {
    if (hook && Object.prototype.toString.call(hook) === '[object AsyncFunction]')
      throw new TypeError('runTaskSync requires synchronous lifecycle hooks');
  }
  if (request.outputOwnership && !['copy', 'transfer'].includes(request.outputOwnership))
    throw new TypeError('Invalid output ownership');
  const context = taskContext(undefined, localContext(request));
  context.throwIfAborted();
  const options = request.options ?? {};
  if (request.inputOwnership === 'transfer') {
    const metadata = new Set(getTransferList(options));
    if (getTransferList(input).some(buffer => metadata.has(buffer)))
      throw new Error('Transferred input aliases reusable options; use inputOwnership: copy');
  }
  const copiedOptions = clonePayload(options);
  const initialization = clonePayload(request.initialization ?? {});
  let initialized = false;
  let failure: unknown;
  let failed = false;
  let output: TaskOutput<D> | undefined;
  try {
    const state = task.initialize?.(initialization, context);
    if (isThenable(state)) {
      // Invalid JS callers can hide promises behind ordinary functions. Observe the
      // rejection and release a late state rather than leaking it after throwing.
      void Promise.resolve(state)
        .then(value => task.destroy?.(value))
        .catch(() => {});
      throw new TypeError('runTaskSync initialize returned a promise');
    }
    context.state = state;
    initialized = true;
    context.throwIfAborted();
    const copiedInput = clonePayload(input, request.inputOwnership);
    const result = task.process(copiedInput, copiedOptions, context);
    if (isThenable(result)) {
      // Wait for invalid asynchronous processing before destroying its state.
      initialized = false;
      void Promise.resolve(result)
        .catch(() => {})
        .then(() => {
          if (task.initialize) return task.destroy?.(context.state);
        })
        .catch(() => {});
      throw new TypeError('runTaskSync process returned a promise');
    }
    assertPayload(result);
    context.throwIfAborted();
    output = clonePayload(result, request.outputOwnership ?? 'transfer');
  } catch (error) {
    failed = true;
    failure = error;
  } finally {
    if (initialized && task.initialize) {
      try {
        const cleanup = task.destroy?.(context.state);
        if (isThenable(cleanup)) {
          void Promise.resolve(cleanup).catch(() => {});
          throw new TypeError('runTaskSync destroy returned a promise');
        }
      } catch (error) {
        if (failed)
          throw new AggregateError([failure, error], 'Task processing and destruction failed');
        throw error;
      }
    }
  }
  if (failed) throw failure;
  return output!;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return Boolean(
    value &&
      (typeof value === 'object' || typeof value === 'function') &&
      typeof (value as {then?: unknown}).then === 'function'
  );
}
