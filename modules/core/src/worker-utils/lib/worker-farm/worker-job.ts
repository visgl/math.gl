// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WorkerMessageType, WorkerMessagePayload} from '../../types';
import WorkerThread from './worker-thread';
import type {SharedWorkerState} from '../worker-api/shared-state';

/**
 * Represents one Job handled by a WorkerPool or WorkerFarm
 */
export default class WorkerJob {
  readonly name: string;
  readonly workerThread: WorkerThread;
  isRunning: boolean = true;
  isCancelled = false;
  sharedState?: SharedWorkerState;
  failed = false;
  postMessageMs = 0;
  executionMs?: number;
  /** Settles only when the worker can be reused, even after cooperative cancellation. */
  readonly completion: Promise<void>;
  private complete: () => void = () => {};
  private cancellationTimer?: ReturnType<typeof setTimeout>;
  /** Promise that resolves when Job is done */
  readonly result: Promise<any>;

  private _resolve: (value: any) => void = () => {};
  private _reject: (reason?: any) => void = () => {};

  constructor(jobName: string, workerThread: WorkerThread) {
    this.name = jobName;
    this.workerThread = workerThread;
    this.completion = new Promise(resolve => {
      this.complete = resolve;
    });
    this.result = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  /**
   * Send a message to the job's worker thread
   * @param data any data structure, ideally consisting mostly of transferrable objects
   */
  postMessage(
    type: WorkerMessageType,
    payload: WorkerMessagePayload,
    transferList?: Transferable[]
  ): void {
    if (!this.isRunning || this.isCancelled) return;
    const startedAt = performance.now();
    try {
      this.workerThread.postMessage(
        {
          source: 'loaders.gl', // Lets worker ignore unrelated messages
          type,
          payload
        },
        transferList
      );
    } finally {
      this.postMessageMs += performance.now() - startedAt;
    }
  }

  /**
   * Call to resolve the `result` Promise with the supplied value
   */
  done(value: any): void {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    this.executionMs = value?.executionMs;
    clearTimeout(this.cancellationTimer);
    this.complete();
    if (!this.isCancelled) this._resolve(value);
  }

  /**
   * Call to reject the `result` Promise with the supplied error
   */
  error(error: unknown): void {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    this.failed = true;
    if (this.sharedState?.snapshot.cancelled) this.isCancelled = true;
    clearTimeout(this.cancellationTimer);
    this.complete();
    this._reject(error);
  }

  /** Reject immediately, but keep the lease until acknowledgement or hard-cancel timeout. */
  cancel(reason?: unknown, timeout = 1000): void {
    if (!this.isRunning || this.isCancelled) return;
    if (!Number.isFinite(timeout) || timeout < 0) {
      this.abort(new RangeError('cancellationTimeout must be finite and nonnegative'));
      return;
    }
    this.isCancelled = true;
    this.sharedState?.cancel();
    this._reject(
      arguments.length ? reason : createAbortError(`Worker job "${this.name}" was cancelled`)
    );
    try {
      this.workerThread.postMessage({source: 'loaders.gl', type: 'cancel', payload: {}}, []);
      this.cancellationTimer = setTimeout(() => this.abort(reason), timeout);
    } catch (error) {
      this.abort(error);
    }
  }

  /**
   * Terminates the worker executing this job and rejects its result.
   * @param reason Abort reason supplied by the caller, or a cross-runtime `AbortError`.
   */
  abort(reason?: unknown): void {
    if (!this.isRunning) {
      return;
    }
    this.isCancelled = true;
    this.sharedState?.cancel();
    this.workerThread.destroy();
    this.error(
      arguments.length ? reason : createAbortError(`Worker job "${this.name}" was aborted`)
    );
  }
}

/** Creates an abort error without requiring the DOMException global. */
function createAbortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}
