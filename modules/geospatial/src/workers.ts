// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Progress measures completed work within a phase, not elapsed time. */
export type WorkerProgress = {phase: string; completed: number; total?: number};
export type WorkerTaskOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: WorkerProgress) => void;
};
export type WorkerTaskContext = {
  report: (progress: WorkerProgress) => void;
  yieldTask: () => Promise<void>;
};
export type WorkerTaskHandler<Input = unknown> = (
  input: Input,
  context: WorkerTaskContext
) => unknown | Promise<unknown>;
export type WorkerTaskScope = {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown, transfer: Transferable[]) => void;
};

/** One job per fresh, exclusively owned worker. Abort terminates synchronous setup too.
 * Inputs are cloned; cancellation never detaches caller-owned ArrayBuffers.
 */
export function runWorkerTask<T>(
  createWorker: () => Worker,
  operation: string,
  input: unknown,
  {signal, onProgress}: WorkerTaskOptions = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    let worker: Worker;
    try {
      worker = createWorker();
    } catch (error) {
      reject(error);
      return;
    }
    let settled = false;
    const finish = (error: unknown, value?: T) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abort);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
      if (error !== undefined) reject(error);
      else resolve(value!);
    };
    const abort = () => finish(signal!.reason);
    worker.onmessage = ({data}) => {
      if (settled) return;
      if (data?.type === 'progress') {
        try {
          onProgress?.(data.progress);
        } catch (error) {
          finish(error);
        }
      } else if (data?.type === 'result') finish(undefined, data.result);
      else if (data?.type === 'error') {
        const error = new Error(data.message);
        error.name = data.name || 'Error';
        finish(error);
      } else finish(new Error('Invalid worker task response'));
    };
    worker.onerror = event => finish(new Error(event.message || 'Worker task failed'));
    worker.onmessageerror = () => finish(new Error('Unable to deserialize worker response'));
    signal?.addEventListener('abort', abort, {once: true});
    if (signal?.aborted) abort();
    else {
      try {
        worker.postMessage({operation, input});
      } catch (error) {
        finish(error);
      }
    }
  });
}

/** Install in an application-owned module worker; only result buffers are transferred. */
export function installWorkerTasks<Inputs extends Record<string, unknown>>(
  scope: WorkerTaskScope,
  handlers: Readonly<{[Key in keyof Inputs]: WorkerTaskHandler<Inputs[Key]>}>
): void {
  let started = false;
  scope.onmessage = async ({data}) => {
    if (started) return;
    started = true;
    try {
      if (!Object.prototype.hasOwnProperty.call(handlers, data.operation))
        throw new Error('Unknown worker operation');
      const result = await handlers[data.operation](data.input, {
        report: progress => scope.postMessage({type: 'progress', progress}, []),
        yieldTask: () => new Promise(resolve => setTimeout(resolve, 0))
      });
      scope.postMessage({type: 'result', result}, collectBuffers(result));
    } catch (error) {
      scope.postMessage(
        {
          type: 'error',
          name: error instanceof Error ? error.name : 'Error',
          message: error instanceof Error ? error.message : String(error)
        },
        []
      );
    }
  };
}

function collectBuffers(value: unknown): ArrayBuffer[] {
  const seen = new Set<unknown>();
  const buffers = new Set<ArrayBuffer>();
  const visit = (item: unknown): void => {
    if (!item || typeof item !== 'object' || seen.has(item)) return;
    seen.add(item);
    if (item instanceof ArrayBuffer) buffers.add(item);
    else if (ArrayBuffer.isView(item)) {
      if (item.buffer instanceof ArrayBuffer) buffers.add(item.buffer);
    } else if (item instanceof Map) {
      for (const [key, entry] of item) {
        visit(key);
        visit(entry);
      }
    } else if (item instanceof Set) {
      for (const entry of item) visit(entry);
    } else for (const entry of Object.values(item)) visit(entry);
  };
  visit(value);
  return [...buffers];
}
