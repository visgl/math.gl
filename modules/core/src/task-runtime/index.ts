// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Public task execution entry; worker-utils remains the compatible worker transport entry. */
export * from '@math.gl/core/worker-utils';
export {runTask, runTaskInBatches} from './run-task';
export type {TaskDescriptor, TaskOptions, TaskExecution, MainThreadPolicy} from './run-task';
