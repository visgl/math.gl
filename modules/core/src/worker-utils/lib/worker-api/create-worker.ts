// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  WorkerProgress,
  WorkerMessageType,
  WorkerMessagePayload,
  WorkerContext,
  WorkerJobContext,
  Process,
  ProcessInBatches
} from '../../types';
import AsyncQueue from '../async-queue/async-queue';
import WorkerBody from '../worker-farm/worker-body';
// import {validateWorkerVersion} from './validate-worker-version';

/** Counter for jobs */
let requestId = 0;
let activeController: AbortController | null = null;
let activeInputBatches: AsyncQueue<any> | null = null;
let activeOutputAcknowledgements: AsyncQueue<void> | null = null;

export type ProcessOnMainThread = (
  data: any,
  options?: {[key: string]: any},
  jobContext?: WorkerJobContext
) => any;

/**
 * Set up a WebWorkerGlobalScope to talk with the main thread
 */
export async function createWorker(
  process: Process,
  processInBatches?: ProcessInBatches
): Promise<void> {
  if (!(await WorkerBody.inWorkerThread())) {
    return;
  }

  const context: WorkerContext = {
    process: processOnMainThread
  };

  // eslint-disable-next-line complexity
  WorkerBody.onmessage = async (type: WorkerMessageType, payload: WorkerMessagePayload) => {
    if (type === 'cancel') {
      activeController?.abort();
      activeInputBatches?.close();
      activeOutputAcknowledgements?.close();
      return;
    }
    const controller =
      type === 'process' || type === 'process-in-batches' ? new AbortController() : undefined;
    if (controller) activeController = controller;
    const startedAt = performance.now();
    const reporter =
      type === 'process' || type === 'process-in-batches' ? createProgressReporter() : undefined;
    const jobContext = {
      ...context,
      signal: controller?.signal,
      reportProgress: (progress: WorkerProgress) => {
        if (!controller?.signal.aborted) reporter?.report(progress);
      }
    };
    try {
      switch (type) {
        case 'preload':
          WorkerBody.postMessage('done', {});
          break;

        case 'process':
          if (!process) {
            throw new Error('Worker does not support atomic processing');
          }
          const result = await process(
            payload.input,
            payload.options || {},
            jobContext,
            payload.context || {}
          );
          controller?.signal.throwIfAborted();
          reporter?.finish();
          await WorkerBody.postMessage('done', {
            result,
            executionMs: performance.now() - startedAt
          });
          break;

        case 'process-in-batches':
          if (!processInBatches) {
            throw new Error('Worker does not support batched processing');
          }
          const inputBatches = new AsyncQueue<any>();
          const outputAcknowledgements = new AsyncQueue<void>();
          activeInputBatches = inputBatches;
          activeOutputAcknowledgements = outputAcknowledgements;
          try {
            const resultIterator = processInBatches(
              createDemandDrivenIterator(inputBatches),
              payload.options || {},
              jobContext,
              payload.context || {}
            );
            for await (const batch of resultIterator) {
              controller?.signal.throwIfAborted();
              await WorkerBody.postMessage('output-batch', {result: batch});
              await outputAcknowledgements.next();
            }
            controller?.signal.throwIfAborted();
            reporter?.finish();
            await WorkerBody.postMessage('done', {executionMs: performance.now() - startedAt});
          } finally {
            activeInputBatches = null;
            activeOutputAcknowledgements = null;
          }
          break;

        case 'input-batch':
          if (!activeInputBatches) {
            throw new Error('Worker has no active batched processing session');
          }
          activeInputBatches.push(payload.input);
          break;

        case 'input-done':
          if (!activeInputBatches) {
            throw new Error('Worker has no active batched processing session');
          }
          activeInputBatches.close();
          break;

        case 'output-ack':
          if (!activeOutputAcknowledgements) {
            throw new Error('Worker has no active batched processing session');
          }
          activeOutputAcknowledgements.push(undefined);
          break;

        default:
      }
    } catch (error) {
      reporter?.finish();
      const message = error instanceof Error ? error.message : '';
      await WorkerBody.postMessage('error', {error: message});
    } finally {
      if (controller && activeController === controller) activeController = null;
    }
  };
  await WorkerBody.postMessage('ready', {});
}

/** Requests exactly one input batch whenever the worker-side processor advances its iterator. */
async function* createDemandDrivenIterator(inputBatches: AsyncQueue<any>): AsyncIterable<any> {
  while (true) {
    await WorkerBody.postMessage('input-request', {});
    const nextBatch = await inputBatches.next();
    if (nextBatch.done) {
      return;
    }
    yield nextBatch.value;
  }
}

function processOnMainThread(arrayBuffer: ArrayBuffer, options = {}, jobContext = {}) {
  const signal = activeController?.signal;
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const id = requestId++;
    const cleanup = () => {
      signal?.removeEventListener('abort', abort);
      void WorkerBody.removeEventListener(onMessage);
    };
    const abort = () => {
      cleanup();
      reject(signal?.reason);
    };
    const onMessage = (type: string, payload: WorkerMessagePayload) => {
      if (payload.id !== id) return;
      if (type === 'done') {
        cleanup();
        resolve(payload.result);
      } else if (type === 'error') {
        cleanup();
        reject(payload.error);
      }
    };
    void WorkerBody.addEventListener(onMessage)
      .then(async () => {
        if (signal?.aborted) {
          abort();
          return;
        }
        signal?.addEventListener('abort', abort, {once: true});
        await WorkerBody.postMessage('process', {
          id,
          input: arrayBuffer,
          options,
          context: jobContext
        });
      })
      .catch(error => {
        cleanup();
        reject(error);
      });
  });
}

/** Coalesces same-phase reports per event-loop turn and flushes before settlement. */
function createProgressReporter() {
  let pending: WorkerProgress | undefined;
  let finished = false;
  let scheduled = false;
  /** Posts the latest pending measurement. */
  const flush = (): void => {
    scheduled = false;
    if (pending) {
      WorkerBody.postMessage('progress', {progress: pending});
      pending = undefined;
    }
  };
  return {
    /** Records progress while retaining phase transitions. */
    report(progress: WorkerProgress): void {
      if (finished) return;
      if (pending && pending.phase !== progress.phase) flush();
      pending = {...progress};
      if (!scheduled) {
        scheduled = true;
        setTimeout(flush, 0);
      }
    },
    /** Flushes final progress and suppresses reports from stale callbacks. */
    finish(): void {
      flush();
      finished = true;
    }
  };
}
