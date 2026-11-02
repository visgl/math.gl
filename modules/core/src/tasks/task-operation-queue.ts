// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Scheduling mode for work sharing a single task instance. */
export type TaskOperationMode = 'parallel' | 'exclusive';

type Entry = {
  mode: TaskOperationMode;
  start: () => void;
  cancel: (reason: unknown) => void;
};

/**
 * FIFO operation scheduler. Exclusive entries form barriers; parallel entries
 * overlap only up to the configured limit. This does not create worker threads.
 * @internal
 */
export class TaskOperationQueue {
  private readonly pending: Entry[] = [];
  private active = 0;
  private exclusive = false;
  private closed = false;
  private readonly idleWaiters = new Set<() => void>();

  constructor(private readonly maxConcurrency: number) {
    if (!Number.isSafeInteger(maxConcurrency) || maxConcurrency < 1) {
      throw new RangeError('maxConcurrency must be a positive safe integer');
    }
  }

  /** Queue an operation; aborting before it starts removes it without running it. */
  run<T>(mode: TaskOperationMode, operation: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (this.closed) return Promise.reject(new Error('Task operation queue is closed'));
    if (mode !== 'parallel' && mode !== 'exclusive')
      return Promise.reject(new TypeError('Invalid operation mode'));
    if (signal?.aborted) return Promise.reject(signal.reason);
    return new Promise<T>((resolve, reject) => {
      const onAbort = () => {
        const index = this.pending.indexOf(entry);
        if (index >= 0) {
          this.pending.splice(index, 1);
          entry.cancel(signal?.reason);
          this.pump();
        }
      };
      const entry: Entry = {
        mode,
        cancel: reason => {
          signal?.removeEventListener('abort', onAbort);
          reject(reason);
        },
        start: () => {
          signal?.removeEventListener('abort', onAbort);
          this.active++;
          if (mode === 'exclusive') this.exclusive = true;
          void Promise.resolve()
            .then(operation)
            .then(resolve, reject)
            .finally(() => {
              this.active--;
              if (mode === 'exclusive') this.exclusive = false;
              this.pump();
            });
        }
      };
      this.pending.push(entry);
      signal?.addEventListener('abort', onAbort, {once: true});
      if (signal?.aborted) onAbort();
      else this.pump();
    });
  }

  /** Stop accepting new work; accepted operations continue to completion. */
  close(): Promise<void> {
    this.closed = true;
    return this.whenIdle();
  }

  /** Wait until the queue has no running or waiting operations. */
  whenIdle(): Promise<void> {
    if (!this.active && !this.pending.length) return Promise.resolve();
    return new Promise(resolve => this.idleWaiters.add(resolve));
  }

  private pump(): void {
    while (!this.exclusive && this.pending.length && this.active < this.maxConcurrency) {
      const entry = this.pending[0];
      if (entry.mode === 'exclusive' && this.active) break;
      this.pending.shift();
      entry.start();
      if (entry.mode === 'exclusive') break;
    }
    if (!this.active && !this.pending.length) {
      for (const resolve of this.idleWaiters) resolve();
      this.idleWaiters.clear();
    }
  }
}
