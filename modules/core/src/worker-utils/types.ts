// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {SharedWorkerState} from './lib/worker-api/shared-state';

/** Progress measured independently within a named phase. */
export type WorkerProgress = {
  /** Operation being measured. */
  phase: string;
  /** Work completed in this phase. */
  completed: number;
  /** Expected work, when known. */
  total?: number;
  /** Measurement unit, such as bytes, rows, or tasks. */
  unit: string;
};

/** One settled worker lease. Times are milliseconds; postMessageMs is synchronous serialization/transfer. */
export type WorkerJobMetrics = {
  name: string;
  outcome: 'completed' | 'failed' | 'cancelled';
  queueWaitMs: number;
  durationMs: number;
  workerCreationMs: number;
  /** Runtime ready handshake latency; absent for legacy custom workers. */
  workerStartupMs?: number;
  postMessageMs: number;
  /** Processor time reported by createWorker; absent for legacy workers. */
  executionMs?: number;
  inputBytes: number;
};

export type WorkerPoolStats = {
  queuedJobs: number;
  activeJobs: number;
  queuedBytes: number;
  inFlightBytes: number;
  peakQueuedBytes: number;
  peakInFlightBytes: number;
  pendingAdmissions: number;
  reservations: number;
  workersCreated: number;
  workerRestarts: number;
  completed: number;
  failed: number;
  cancelled: number;
};

/** Shared worker execution options. */
export type WorkerOptions = {
  /** Copy input or transfer its backing buffers; transfer preserves the loaders.gl default. */
  inputOwnership?: 'copy' | 'transfer' | 'share';
  /** Shared control buffer, or false to disable automatic cooperative shared control. */
  sharedState?: SharedArrayBuffer | false;
  /** Hard termination is the compatibility default. Cooperative mode requires createWorker support. */
  cancellationMode?: 'terminate' | 'cooperative';
  /** Grace period before hard termination; defaults to 1000 ms. */
  cancellationTimeout?: number;
  /** Cancels queued or running work. */
  signal?: AbortSignal;
  /** Receives phase progress. Throwing aborts the job with that error. */
  onProgress?: (progress: WorkerProgress) => void;
  // Worker farm options
  CDN?: string | null;
  worker?: boolean;
  /** Declares batch-protocol support for a custom worker, or disables batch offloading. */
  workerInBatches?: boolean;
  /** Per-pool input byte budgets. Queue overflow rejects before input transfer. */
  maxQueuedJobs?: number;
  maxPendingAdmissions?: number;
  priorityAgingMs?: number;
  onMetrics?: (metrics: WorkerJobMetrics) => void;
  performanceMarks?: boolean;
  maxQueuedBytes?: number;
  maxInFlightBytes?: number;
  /** Larger values start first; equal priorities preserve submission order. */
  priority?: number;
  /** Reserved input bytes for a batch session; bounds each batch's retained buffers. */
  inputBytes?: number;
  maxConcurrency?: number;
  maxMobileConcurrency?: number;
  reuseWorkers?: boolean;
  _workerType?: string;
  workerUrl?: string;
  /** Browser worker script type for URL or source targets. Defaults to classic. */
  workerType?: 'classic' | 'module';
  [key: string]: any; // TODO
};

/**
 * Creates a fresh browser Worker instance for a worker descriptor.
 *
 * Returning `null` delegates to the existing URL-based worker resolution. This lets packages
 * expose bundler-resolved module workers without removing classic worker or CDN support.
 */
export type LoadWorker = () => Worker | null;

export type WorkerContext = {
  /** Worker-side signal; long CPU loops must yield and check it to cooperate. */
  signal?: AbortSignal;
  sharedState?: SharedWorkerState;
  /** Checks the message signal and atomic shared cancellation, including inside synchronous loops. */
  throwIfAborted?: () => void;
  /** Reports progress from the active worker job. */
  reportProgress?: (progress: WorkerProgress) => void;
  process?: Process;
  processInBatches?: ProcessInBatches;
};

/** Serializable context sent with a single worker job. */
export type WorkerJobContext = {
  [key: string]: any;
};

export type Process<Input = any, Output = any, Options extends object = {[key: string]: any}> = (
  data: Input,
  options?: Options,
  context?: WorkerContext,
  jobContext?: WorkerJobContext
) => Output | Promise<Output>;

export type ProcessInBatches<
  Input = any,
  Output = any,
  Options extends object = {[key: string]: any}
> = (
  iterator: AsyncIterable<Input> | Iterable<Input>,
  options?: Options,
  context?: WorkerContext,
  jobContext?: WorkerJobContext
) => AsyncIterable<Output>;

/**
 * A worker description object
 */
export type WorkerObject<
  Input = any,
  Output = any,
  Options extends object = {[key: string]: any}
> = {
  id: string;
  name: string;
  module: string;
  /** npm package containing worker artifacts; omitted preserves the loaders.gl URL convention. */
  packageName?: string;
  version: string;
  worker?: string | boolean;
  /** Whether the built-in worker accepts stateful batch requests. */
  workerInBatches?: boolean;
  /** Browser worker filename when it differs from the worker id. */
  workerFile?: string;
  /** Creates a built-in browser worker, typically using `type: 'module'`. */
  loadWorker?: LoadWorker;
  /** Optional Node.js-specific worker filename (for example a `.cjs` asset). */
  workerNode?: string;
  /** Repository-relative source path for a Node test worker after package grouping. */
  workerSourceNode?: string;
  options: {[key: string]: any};
  deprecatedOptions?: object;

  process?: Process<Input, Output, Options>;
  processInBatches?: ProcessInBatches<Input, Output, Options>;
};

/*
  PROTOCOL

  Main thread                                     worker
               => process-in-batches

               <= input-request
               => input-batch
               <= output-batch
               => output-ack
                  ... // repeat

              => input-done
              <= done

                 // or

              <= error
 */
export type WorkerMessageType =
  | 'ready'
  | 'cancel'
  | 'progress'
  | 'preload'
  | 'process'
  | 'done'
  | 'error'
  | 'process-in-batches'
  | 'input-request'
  | 'input-batch'
  | 'input-done'
  | 'output-batch'
  | 'output-ack';

export type WorkerMessagePayload = {
  /** Phase progress from the worker. */
  progress?: WorkerProgress;
  executionMs?: number;
  id?: number;
  options?: {[key: string]: any};
  context?: WorkerJobContext;
  input?: any; // Transferable;
  result?: any; // Transferable
  error?: string;
  errorName?: string;
};

export type WorkerMessageData = {
  source: 'loaders.gl';
  type: WorkerMessageType;
  payload: WorkerMessagePayload;
};

export type WorkerMessage = {
  type: string;
  data: WorkerMessageData;
};
