// Copyright (c) 2026 Will Cohen
//
// Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
// See LICENSE for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
//
// HTTP transport for a wasm library whose C runtime issues blocking XHR, such
// as emscripten FETCH.
//
// createSyncFetch(opts) resolves to syncFetch(url, reqOpts), which returns
// {status, headers, bodyBytes}. On Node, syncFetch blocks on Atomics while a
// fetch_worker does the request. In a browser it is a synchronous XHR, and the
// caller must be in a Web Worker.
//
// Contracts:
//   - On Node, workerUrl defaults to the fetch_worker.mjs next to this module.
//   - On Node, createSyncFetch rejects if the worker cannot become ready, for
//     example when the decorator import fails. A later call reuses the
//     running worker and ignores its own workerUrl, dataBufferSize and
//     requestTimeoutMs.
//     It rejects when its decorateUrl differs, since one worker applies one
//     decorator.
//   - A response larger than dataBufferSize gives {status: 0, overflow: true}.
//   - A worker that stops answering gives status 0 after requestTimeoutMs plus
//     slack. A worker that ended gives status 0 at once, after this thread
//     handles its exit event.
//   - A response that the caller gave up on never answers the next request.
//
// The auth decorator runs in the fetch worker, never in the blocked caller.
// installXhrPolyfill sends a global synchronous XHR through syncFetch.

import { isNode } from './handler_env.mjs';

const CONTROL_BUFFER_SIZE = 8;
const META_BUFFER_SIZE = 16;
const DEFAULT_DATA_BUFFER_SIZE = 50 * 1024 * 1024;
const DEFAULT_REQUEST_TIMEOUT_MS = 35000;
// The caller waits past the worker's idle timeout, so a stall comes back as
// the worker's status 0.
const WAIT_SLACK_MS = 5000;
const WORKER_READY_TIMEOUT_MS = 10000;
// metaBuffer[3] bit 0: the response did not fit dataBuffer.
const OVERFLOW_FLAG = 1;

// One fetch worker per thread, shared and reference-counted, because one pool
// worker can load the handlers of several libraries. Each createSyncFetch on
// Node takes a reference, and shutdown() releases one.
let workerState = null;
let workerStart = null;
let refCount = 0;

function parseHeaders(str) {
  const headers = {};
  if (!str) return headers;
  for (const line of str.split(/\r\n|\n/)) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    }
  }
  return headers;
}

async function ensureWorker(opts) {
  const decorateUrl = opts.decorateUrl ? String(opts.decorateUrl) : null;
  let state = workerState;
  if (!state) {
    workerStart ??= startWorker(opts.workerUrl ?? new URL('./fetch_worker.mjs', import.meta.url),
                                decorateUrl, opts)
      .finally(() => { workerStart = null; });
    state = await workerStart;
  }
  if (state.decorateUrl !== decorateUrl) {
    throw new Error(`createSyncFetch: the fetch worker of this thread has decorateUrl ${state.decorateUrl}, not ${decorateUrl}`);
  }
  return state;
}

// A bundle that inlines this module must pass workerUrl, because the default
// resolves next to the bundle.
async function startWorker(workerUrl, decorateUrl, opts) {
  const { Worker } = await import('node:worker_threads');

  const dataBufferSize = opts.dataBufferSize ?? DEFAULT_DATA_BUFFER_SIZE;
  const requestTimeoutMs = opts.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

  const controlSAB = new SharedArrayBuffer(CONTROL_BUFFER_SIZE);
  const metaSAB = new SharedArrayBuffer(META_BUFFER_SIZE);
  const dataSAB = new SharedArrayBuffer(dataBufferSize);

  const worker = new Worker(workerUrl);
  // Before the ready listener: adding it refs the port again until init ends.
  worker.unref();
  await waitForWorkerReady(worker, {
    cmd: 'init',
    controlBuffer: controlSAB,
    metaBuffer: metaSAB,
    dataBuffer: dataSAB,
    decorateUrl,
    requestTimeoutMs,
  });

  const state = {
    worker,
    decorateUrl,
    control: new Int32Array(controlSAB),
    meta: new Int32Array(metaSAB),
    data: new Uint8Array(dataSAB),
    view: new DataView(dataSAB),
    // The slack is at most requestTimeoutMs, so a short timeout fails fast.
    waitTimeoutMs: requestTimeoutMs + Math.min(WAIT_SLACK_MS, requestTimeoutMs),
    generation: 0,
    dead: false,
  };
  // Without an error listener, an error in the worker, such as a decorator
  // rejection, throws in this thread.
  worker.on('error', (err) => console.error(`http-bridge: fetch worker error: ${err.message}`));
  // refCount stays, since each consumer of the dead worker still releases once.
  worker.on('exit', () => {
    state.dead = true;
    if (workerState === state) workerState = null;
  });
  workerState = state;
  return state;
}

// A rejection terminates the worker, so a later createSyncFetch starts clean.
function waitForWorkerReady(worker, initMsg) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => finish(new Error(
        `createSyncFetch: fetch worker did not become ready within ${WORKER_READY_TIMEOUT_MS}ms`)),
      WORKER_READY_TIMEOUT_MS);
    timer.unref?.();
    const onMessage = (msg) => {
      if (msg?.status === 'ready') finish();
      else if (msg?.status === 'error') {
        finish(new Error(`createSyncFetch: fetch worker failed to initialize: ${msg.error}`));
      }
    };
    const onError = (err) =>
      finish(new Error(`createSyncFetch: fetch worker error during init: ${err.message}`));
    const onExit = (code) =>
      finish(new Error(`createSyncFetch: fetch worker exited (code ${code}) during init`));
    // Removes every listener, so the first outcome is the only one.
    function finish(err) {
      clearTimeout(timer);
      worker.off('message', onMessage);
      worker.off('error', onError);
      worker.off('exit', onExit);
      if (!err) return resolve();
      worker.terminate();
      reject(err);
    }
    worker.on('message', onMessage);
    worker.on('error', onError);
    worker.on('exit', onExit);
    worker.postMessage(initMsg);
  });
}

function toRequest(url, reqOpts) {
  return {
    url,
    method: reqOpts.method || 'GET',
    headers: reqOpts.headers || {},
    body: reqOpts.body ?? null,
  };
}

const failedResponse = () => ({ status: 0, headers: {}, bodyBytes: new Uint8Array(0) });

// True if the worker answers `generation` before the deadline.
function responseArrived(control, generation, deadline) {
  for (;;) {
    const answered = Atomics.load(control, 1);
    if (answered === generation) return true;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return false;
    Atomics.wait(control, 1, answered, remaining);
  }
}

function nodeSyncFetch(state, url, reqOpts) {
  if (state.dead) return failedResponse();
  const { control, meta, data, view, waitTimeoutMs } = state;
  const request = toRequest(url, reqOpts);
  if (request.body != null && typeof request.body !== 'string') {
    throw new TypeError('http-bridge: on Node, a request body must be a string');
  }
  const jsonBytes = new TextEncoder().encode(JSON.stringify(request));
  view.setInt32(0, jsonBytes.length, true);
  data.set(jsonBytes, 4);

  // Skips 0, which marks no pending request.
  state.generation = (state.generation % 0x7fffffff) + 1;
  const { generation } = state;
  Atomics.store(control, 0, generation);
  Atomics.notify(control, 0, 1);

  // At the deadline, take the request back: a compareExchange of control[0]
  // from generation to 0. The worker makes the same exchange before it writes,
  // so when the worker took it first, its response is on the way.
  const answered = responseArrived(control, generation, Date.now() + waitTimeoutMs)
    || (Atomics.compareExchange(control, 0, generation, 0) !== generation
        && responseArrived(control, generation, Date.now() + WAIT_SLACK_MS));
  if (!answered) {
    console.error(
      `http-bridge: fetch worker did not answer within ${waitTimeoutMs}ms for ${url}. ` +
      'Returning status 0.');
    return failedResponse();
  }

  const flags = Atomics.load(meta, 3);
  const status = Atomics.load(meta, 0);
  if (flags & OVERFLOW_FLAG) {
    // `overflow` tells this apart from a network error.
    console.error(
      `http-bridge: the response for ${url} is larger than the ${data.length}-byte transport ` +
      `buffer. Upstream status ${status}. Returning status 0.`);
    return { ...failedResponse(), overflow: true };
  }

  const bodyLength = Atomics.load(meta, 1);
  const headersLength = Atomics.load(meta, 2);
  const bodyBytes = data.slice(0, bodyLength);
  const headersStr = new TextDecoder().decode(data.slice(bodyLength, bodyLength + headersLength));
  return { status, headers: parseHeaders(headersStr), bodyBytes };
}

// A synchronous XHR takes a responseType only in a Web Worker.
function browserSyncFetch(url, reqOpts) {
  const request = toRequest(url, reqOpts);
  const xhr = new XMLHttpRequest();
  xhr.open(request.method, request.url, false);
  xhr.responseType = 'arraybuffer';
  for (const [k, v] of Object.entries(request.headers)) xhr.setRequestHeader(k, v);
  xhr.send(request.body);
  return {
    status: xhr.status,
    headers: parseHeaders(xhr.getAllResponseHeaders()),
    bodyBytes: new Uint8Array(xhr.response ?? 0),
  };
}

export async function createSyncFetch(opts = {}) {
  if (isNode) {
    const state = await ensureWorker(opts);
    refCount++;
    return (url, reqOpts = {}) => nodeSyncFetch(state, url, reqOpts);
  }
  return (url, reqOpts = {}) => browserSyncFetch(url, reqOpts);
}

// emscripten's lazy files and FETCH open each XHR synchronously, so the
// polyfill has no async path.
function makeXhrClass(syncFetch) {
  return class XMLHttpRequest {
    constructor() {
      this.readyState = 0;
      this.status = 0;
      this.statusText = '';
      this.response = null;
      this.responseText = '';
      this.responseType = '';
      this.responseURL = '';
      this._method = 'GET';
      this._url = null;
      this._headers = {};
      this._responseHeaders = null;
    }

    open(method, url, async = true) {
      if (async) throw new Error('http-bridge: the XMLHttpRequest polyfill is synchronous only');
      this._method = method;
      this._url = url;
      this.readyState = 1;
    }

    setRequestHeader(name, value) {
      this._headers[name] = value;
    }

    getResponseHeader(name) {
      return this._responseHeaders?.[name.toLowerCase()] || null;
    }

    getAllResponseHeaders() {
      if (!this._responseHeaders) return '';
      return Object.entries(this._responseHeaders).map(([k, v]) => `${k}: ${v}\r\n`).join('');
    }

    send(body = null) {
      try {
        const response = syncFetch(this._url, { method: this._method, headers: this._headers, body });
        this.status = response.status;
        this.statusText = response.status >= 200 && response.status < 300 ? 'OK' : 'Error';
        this.responseURL = this._url;
        this.readyState = 4;
        this._responseHeaders = response.headers;
        this.response = response.bodyBytes.slice().buffer;
        this.onreadystatechange?.();
        this.onload?.();
      } catch (err) {
        this.status = 0;
        this.readyState = 4;
        this.onerror?.(err);
        this.onreadystatechange?.();
      }
    }

    abort() {
      this.readyState = 0;
    }
  };
}

export async function installXhrPolyfill(opts = {}) {
  if (!isNode || typeof globalThis.XMLHttpRequest !== 'undefined') return;
  globalThis.XMLHttpRequest = makeXhrClass(opts.syncFetch);
}

// Releases one consumer reference and terminates the worker at the last one.
// Returns true if this call terminated the worker. Call it once for each
// createSyncFetch: an extra call releases a reference of another consumer.
export async function shutdown() {
  refCount = Math.max(0, refCount - 1);
  if (refCount > 0 || !workerState) return false;
  const state = workerState;
  state.dead = true;
  workerState = null;
  await state.worker.terminate();
  return true;
}

// Stock releases for a handler whose init called createSyncFetch. Export
// moduleDestroy as the module's `destroy`; worker-router calls it once per worker.
export const shutdownMethod = async () => {
  await shutdown();
  return { ok: true };
};

export const moduleDestroy = shutdown;
