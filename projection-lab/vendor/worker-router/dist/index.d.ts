/*
 * Copyright (c) 2026 Will Cohen
 *
 * Part of worker-router, under the Apache License v2.0 with LLVM Exceptions.
 * See LICENSE for license information.
 * SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
 *
 * Hand-written type declarations for the squint-compiled pool surface
 * shipped as dist/index.mjs. There is no `tsc` step in this package;
 * this file is the contract for TypeScript consumers and the authoritative
 * description of the public API.
 */

export type PoolRuntime = "browser" | "node";

export function detectRuntime(): PoolRuntime;

export interface HandlerSpec {
  /** Module specifier for the worker-side handler module. */
  module: string;
  /** Optional payload forwarded to the handler module's init/factory. */
  init?: unknown;
  /** Optional payload forwarded to the module's top-level destroy at shutdown. */
  destroy?: unknown;
}

export interface PoolOptions {
  /** Worker count, or "auto" to resolve from navigator.hardwareConcurrency. */
  size: number | "auto";
  /** URL of the worker bootstrap module (dist/worker-bootstrap.mjs). */
  bootstrap: string;
  /** Map of module-key -> HandlerSpec. At least one entry is required. */
  handlers: Record<string, HandlerSpec>;
  /**
   * How long create() waits for each worker's ready handshake before
   * rejecting. Load failures reject immediately regardless; this only
   * bounds a worker that hangs without erroring. Default 300000.
   */
  bootstrapTimeoutMs?: number;
  /**
   * How long terminate() waits for each worker's destroy phase before
   * giving up on that worker and proceeding. Default 5000.
   */
  shutdownTimeoutMs?: number;
  /**
   * Absolute URL for workers to import Comlink from. Overrides the
   * default page-side `import.meta.resolve("comlink")`; use when a
   * bundler mangles or drops import.meta.resolve.
   */
  comlinkUrl?: string;
}

export interface WorkerHandle {
  raw: unknown;
  endpoint: unknown;
  /** Node resolves with the worker's exit code; browsers with undefined. */
  terminate(): Promise<unknown>;
}

export function spawn(bootstrapUrl: string): Promise<WorkerHandle>;

export interface WorkerClaim {
  /** Pool index of the claimed worker. */
  index: number;
  /** Release the claim. Idempotent. */
  release(): void;
}

/**
 * The dispatching proxy returned by `pool.worker(i)` and `pool.any()`.
 * Property access returns a sub-proxy for the named module; further
 * access drills into the Comlink-exposed handler. Every invocation is
 * counted against the worker's in-flight load. Calls made through a
 * proxy after `pool.terminate()`, or routed to a worker that has died,
 * reject instead of dispatching.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DispatchingProxy = any;

export interface Pool {
  /** Number of workers in the pool (post-resolveSize). */
  readonly size: number;
  /** Detected runtime at pool creation. */
  readonly runtime: PoolRuntime;
  /** Set of module keys registered via PoolOptions.handlers. */
  readonly registeredModules: Set<string>;
  /** Dispatch to a specific worker by index. Throws if terminated or out of range. */
  worker(index: number): DispatchingProxy;
  /** Dispatch to the least-loaded worker (argmin of pending + claims). */
  any(): DispatchingProxy;
  /** Claim a worker for sticky, long-lived placement. Increments the worker's claim count. */
  claim(): WorkerClaim;
  /** Run per-worker destroys, then tear down the underlying workers. Idempotent. */
  terminate(): Promise<void>;
}

export const WorkerPool: {
  /** Spawn `opts.size` workers, await ready, return a Pool. */
  create(opts: PoolOptions): Promise<Pool>;
};
