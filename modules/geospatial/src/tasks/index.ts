// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {TaskWorker} from '@math.gl/core/tasks';
import {ProjectCoordinatesTask as projectionTask, PrepareMapTask as mapTask} from './definitions';
export type {ProjectCoordinatesTypes, PrepareMapTypes} from './definitions';
declare const __filename: string;

// Resolve compiled worker modules in both ESM and CommonJS package entries.
const isBrowser = !(globalThis as {process?: {versions?: {node?: string}}}).process?.versions?.node;
const path = typeof __filename === 'string' ? __filename.replace(/\\/g, '/') : '';
const moduleUrl = path
  ? `file://${path.startsWith('/') ? '' : '/'}${encodeURI(path).replace(/#/g, '%23').replace(/\?/g, '%3F')}`
  : import.meta.url;

/** Reproject coordinates with an automatic or explicitly retained worker. */
export const ProjectCoordinatesTask: typeof projectionTask & {worker: TaskWorker} = {
  ...projectionTask,
  worker: {
    ...(!isBrowser
      ? {url: /* @__PURE__ */ (() => new URL('./projection-worker.js', moduleUrl).href)()}
      : {
          create: () =>
            new Worker(new URL('./projection-worker.js', import.meta.url), {type: 'module'})
        }),
    capabilities: {atomic: true, streaming: true}
  }
};

/** Prepare a portable map snapshot in a worker. */
export const PrepareMapTask: typeof mapTask & {worker: TaskWorker} = {
  ...mapTask,
  worker: {
    ...(!isBrowser
      ? {url: /* @__PURE__ */ (() => new URL('./map-worker.js', moduleUrl).href)()}
      : {create: () => new Worker(new URL('./map-worker.js', import.meta.url), {type: 'module'})}),
    capabilities: {atomic: true, streaming: false}
  }
};
