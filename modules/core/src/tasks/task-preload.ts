// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {WorkerPool, preloadWorker, type WorkerObject} from '../worker-utils/index';
import type {AnyTask, TaskPreloadOptions} from './task';

const pending = new WeakMap<AnyTask, Promise<void>>();
const loaded = new WeakSet<AnyTask>();

/** @internal One code-loading hook per definition in this JavaScript environment. */
export function preloadTaskCode(task: AnyTask): Promise<void> {
  if (!task.preload) return Promise.resolve();
  let promise = pending.get(task);
  if (!promise) {
    promise = Promise.resolve()
      .then(() => task.preload!())
      .then(() => {
        loaded.add(task);
      });
    pending.set(task, promise);
    void promise.catch(() => pending.delete(task));
  }
  return promise;
}

/** @internal Synchronous calls cannot start or await module loading. */
export function isTaskCodeLoaded(task: AnyTask): boolean {
  return !task.preload || loaded.has(task);
}

/**
 * Load code ahead of execution, without task state or a runner-owned worker pool.
 * Worker targets use a temporary worker to load their actual bundled dependency
 * graph, await preload/readiness, then terminate. Later workers use browser caches
 * where cache headers permit; worker startup and state initialization still occur.
 */
export async function preloadTasks(
  tasks: readonly AnyTask[],
  options: TaskPreloadOptions = {}
): Promise<void> {
  const execution = options.execution ?? 'auto';
  if (!['auto', 'main-thread', 'worker'].includes(execution))
    throw new TypeError('Invalid execution mode');
  options.signal?.throwIfAborted();
  // Sequential loading bounds temporary workers to one per invocation.
  for (const task of new Set(tasks)) {
    options.signal?.throwIfAborted();
    if (execution === 'worker' && !task.worker) throw new Error('Task has no worker');
    if (execution === 'main-thread' || !task.worker) {
      await withSignal(preloadTaskCode(task), options.signal);
      continue;
    }
    const target = task.worker;
    if (Boolean(target.url) === Boolean(target.create))
      throw new Error('Supply exactly one worker URL or factory');
    const pool = new WorkerPool({
      name: task.id,
      url: target.url?.toString(),
      loadWorker: target.create,
      workerType: 'module',
      maxConcurrency: 1,
      maxMobileConcurrency: 1
    });
    const descriptor: WorkerObject = {
      id: task.id,
      name: task.id,
      module: 'core',
      version: 'prototype',
      options: {},
      worker: target.url?.toString() ?? true,
      loadWorker: target.create,
      workerInBatches: target.capabilities.streaming
    };
    try {
      await preloadWorker(
        descriptor,
        {workerPool: pool, workerType: 'module', signal: options.signal},
        {count: 1}
      );
    } finally {
      await pool.destroy();
    }
  }
}

function withSignal<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return operation;
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort);
      reject(signal.reason);
    };
    signal.addEventListener('abort', abort, {once: true});
    if (signal.aborted) abort();
    operation.then(
      value => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      error => {
        signal.removeEventListener('abort', abort);
        reject(error);
      }
    );
  });
}
