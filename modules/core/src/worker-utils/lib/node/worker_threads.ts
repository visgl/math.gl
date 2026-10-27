// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Worker, parentPort as nodeParentPort} from 'worker_threads';

/** The runtime surface used by the worker farm, without Node-only public types. */
export type NodeWorkerType = {
  postMessage(value: unknown, transferList?: any[]): void;
  terminate(): unknown;
  on(event: string, listener: (...args: any[]) => void): unknown;
  ref(): unknown;
  unref(): unknown;
};
type ParentPort = {
  postMessage(value: unknown, transferList?: any[]): void;
  on(event: string, listener: (...args: any[]) => void): unknown;
  off(event: string, listener: (...args: any[]) => void): unknown;
};
export const parentPort: ParentPort | null = nodeParentPort as ParentPort | null;
export const NodeWorker: new (filename: string | URL, options?: any) => NodeWorkerType = Worker;
