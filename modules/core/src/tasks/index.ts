// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Public task execution entry; worker-utils remains the compatible worker transport entry. */
export * from '@math.gl/core/worker-utils';
export {runTask, runTaskInBatches} from './run-task';
export type {TaskDescriptor, TaskOptions, TaskExecution, MainThreadPolicy} from './run-task';

// Experimental TaskRunner prototype; legacy exports above retain their semantics.
export {TaskRunner, InitializedTask} from './task-runner';
export {initializeTaskWorker} from './task-runtime';
export type {
  Task,
  TaskTypes,
  TaskContext,
  TaskInitializationContext,
  TaskProgress,
  TaskWorker,
  TaskRunControls,
  TaskRunOptions,
  TaskRunsOptions,
  TaskRunnerOptions
} from './task';
