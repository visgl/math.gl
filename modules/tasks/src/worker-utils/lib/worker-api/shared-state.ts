// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import WorkerThread from '../worker-farm/worker-thread';
import {isBrowser} from '../env-utils/globals';

export type WorkerCapabilities = {
  workers: boolean;
  sharedMemory: boolean;
  crossOriginIsolated: boolean | undefined;
  sharedMemoryUnavailableReason?: 'cross-origin-isolation' | 'unsupported' | 'blocked';
};

/** Probe the actual realm; browser sharing requires COOP/COEP isolation (Node does not). */
export function getWorkerCapabilities(): WorkerCapabilities {
  const isolated =
    typeof globalThis.crossOriginIsolated === 'boolean'
      ? globalThis.crossOriginIsolated
      : undefined;
  const capabilities: WorkerCapabilities = {
    workers: WorkerThread.isSupported(),
    sharedMemory: false,
    crossOriginIsolated: isolated
  };
  if (isBrowser && isolated !== true) {
    capabilities.sharedMemoryUnavailableReason = 'cross-origin-isolation';
  } else if (
    typeof SharedArrayBuffer === 'undefined' ||
    typeof Atomics === 'undefined' ||
    typeof structuredClone !== 'function'
  ) {
    capabilities.sharedMemoryUnavailableReason = 'unsupported';
  } else {
    try {
      const buffer = new SharedArrayBuffer(4);
      const cloned = structuredClone(buffer);
      Atomics.store(new Int32Array(buffer), 0, 17);
      capabilities.sharedMemory = Atomics.load(new Int32Array(cloned), 0) === 17;
      if (!capabilities.sharedMemory) capabilities.sharedMemoryUnavailableReason = 'blocked';
    } catch {
      capabilities.sharedMemoryUnavailableReason = 'blocked';
    }
  }
  return capabilities;
}

export type SharedWorkerSnapshot = {
  cancelled: boolean;
  completed: number;
  /** -1 means unknown. */
  total: number;
  revision: number;
};

/** Same-version, single-job atomic control state. Each field is atomic; snapshots are not transactions. */
export class SharedWorkerState {
  readonly buffer: SharedArrayBuffer;
  private values: Int32Array;

  constructor(buffer: SharedArrayBuffer) {
    if (
      typeof SharedArrayBuffer === 'undefined' ||
      !(buffer instanceof SharedArrayBuffer) ||
      buffer.byteLength !== 16
    )
      throw new Error('Expected a 16-byte shared worker control buffer');
    this.buffer = buffer;
    this.values = new Int32Array(buffer);
  }

  get snapshot(): SharedWorkerSnapshot {
    return {
      cancelled: Atomics.load(this.values, 0) !== 0,
      completed: Atomics.load(this.values, 1),
      total: Atomics.load(this.values, 2),
      revision: Atomics.load(this.values, 3)
    };
  }

  cancel(): void {
    Atomics.store(this.values, 0, 1);
    Atomics.add(this.values, 3, 1);
    Atomics.notify(this.values, 0);
  }

  throwIfCancelled(): void {
    if (Atomics.load(this.values, 0) !== 0) {
      const error = new Error('Shared worker task was cancelled');
      error.name = 'AbortError';
      throw error;
    }
  }

  /** Integer counters for application-defined work; messages still carry phase names and units. */
  setProgress(completed: number, total = -1): void {
    if (
      !Number.isInteger(completed) ||
      completed < 0 ||
      completed > 0x7fffffff ||
      !Number.isInteger(total) ||
      total < -1 ||
      total > 0x7fffffff
    ) {
      throw new RangeError('Shared progress requires nonnegative int32 counts (or total -1)');
    }
    Atomics.store(this.values, 1, completed);
    Atomics.store(this.values, 2, total);
    Atomics.add(this.values, 3, 1);
  }
}

/** Returns null when unavailable, leaving message-based cancellation/progress usable. */
export function createSharedWorkerState(): SharedWorkerState | null {
  if (!getWorkerCapabilities().sharedMemory) return null;
  const state = new SharedWorkerState(new SharedArrayBuffer(16));
  state.setProgress(0);
  return state;
}

/** Caller-side setup: opt into shared control automatically for cooperative jobs when available. */
export function prepareSharedState<
  T extends {cancellationMode?: string; sharedState?: SharedArrayBuffer | false}
>(options: T): T {
  if (options.sharedState === undefined && options.cancellationMode === 'cooperative') {
    const state = createSharedWorkerState();
    return state ? {...options, sharedState: state.buffer} : options;
  }
  if (options.sharedState) {
    if (!getWorkerCapabilities().sharedMemory)
      throw new Error('Shared worker memory is unavailable');
    new SharedWorkerState(options.sharedState).throwIfCancelled();
  }
  return options;
}
