// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WorkerObject} from './types';
import {VERSION} from './lib/env-utils/version';
declare const __filename: string;

// TYPES
export type {
  LoadWorker,
  WorkerObject,
  WorkerOptions,
  WorkerProgress,
  WorkerJobMetrics,
  WorkerPoolStats,
  WorkerContext,
  WorkerJobContext,
  Process,
  ProcessInBatches,
  // Protocol
  WorkerMessage,
  WorkerMessageType,
  WorkerMessageData,
  WorkerMessagePayload
} from './types';

// GENERAL UTILS
export {assert} from './lib/env-utils/assert';
export {isBrowser, isWorker} from './lib/env-utils/globals';

// WORKER UTILS - TYPES
export {default as WorkerJob} from './lib/worker-farm/worker-job';
export {default as WorkerThread} from './lib/worker-farm/worker-thread';

// WORKER FARMS
export {default as WorkerFarm} from './lib/worker-farm/worker-farm';
export {default as WorkerPool} from './lib/worker-farm/worker-pool';
export {default as WorkerBody} from './lib/worker-farm/worker-body';

// PROCESS ON WORKER
export type {ProcessOnWorkerOptions} from './lib/worker-api/process-on-worker';
export type {PreloadWorkerOptions} from './lib/worker-api/process-on-worker';
export {
  processOnWorker,
  processOnWorkerInBatches,
  preloadWorker,
  canProcessOnWorker,
  canProcessOnWorkerInBatches
} from './lib/worker-api/process-on-worker';
export {createWorker} from './lib/worker-api/create-worker';

// WORKER UTILS - EXPORTS
export {getWorkerURL} from './lib/worker-api/get-worker-url';
export {validateWorkerVersion} from './lib/worker-api/validate-worker-version';
export {getTransferList, getTransferListForWriter} from './lib/worker-utils/get-transfer-list';

// LIBRARY UTILS
export {
  extractLoadLibraryOptions,
  getLibraryUrl,
  loadLibrary,
  type LoadLibraryOptions
} from './lib/library-utils/library-utils';

// PARSER UTILS
export {default as AsyncQueue} from './lib/async-queue/async-queue';

// WORKER OBJECTS

/** A null worker to test that worker processing is functional */
const path = typeof __filename === 'string' ? __filename.replace(/\\/g, '/') : '';
const moduleUrl = path
  ? `file://${path.startsWith('/') ? '' : '/'}${encodeURI(path).replace(/#/g, '%23').replace(/\?/g, '%3F')}`
  : import.meta.url;
export const NullWorker: WorkerObject = {
  id: 'null',
  name: 'null',
  module: 'core',
  packageName: '@math.gl/core',
  worker: new URL('./workers/null-worker.js', moduleUrl).href,
  loadWorker: () =>
    new Worker(new URL('./workers/null-worker.js', import.meta.url), {type: 'module'}),
  version: VERSION,
  options: {
    null: {}
  }
};

export type {WorkerAdmission, WorkerPoolProps} from './lib/worker-farm/worker-pool';
export {createWorkerResource, createResourceWorker} from './lib/worker-api/worker-resource';
export type {
  WorkerResource,
  WorkerResourceObject,
  ResourceRequest
} from './lib/worker-api/worker-resource';

export {
  getWorkerCapabilities,
  createSharedWorkerState,
  SharedWorkerState
} from './lib/worker-api/shared-state';
export type {WorkerCapabilities, SharedWorkerSnapshot} from './lib/worker-api/shared-state';
