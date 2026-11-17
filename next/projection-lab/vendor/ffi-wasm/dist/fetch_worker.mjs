// Copyright (c) 2026 Will Cohen
//
// Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
// See LICENSE for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
//
// Node worker thread that serves synchronous HTTP for a wasm library. Node has
// no synchronous HTTP, so the caller blocks on Atomics.wait while this worker
// runs an async fetch. A request is JSON {url, method, headers, body}.
//
// Three SharedArrayBuffers carry the traffic:
//   controlBuffer (8B,  Int32Array)  [0]=generation of the pending request, or 0
//                                    [1]=generation of the last response
//   metaBuffer    (16B, Int32Array)  [status, bodyLength, headersLength, flags]
//   dataBuffer    (NB,  Uint8Array)  request bytes out, response bytes in
// Bit 0 of metaBuffer[3] is OVERFLOW_FLAG: the response did not fit dataBuffer.
//
// Before it writes a response, the worker takes the request: a compareExchange
// of control[0] from its generation to 0. A caller that gave up took it back
// first, so the exchange fails and the worker drops the response.
//
// The timeout is an idle deadline, requestTimeoutMs, that each body chunk
// resets. A stall aborts the request with status 0.
//
// doFetch follows redirects, like the JVM and browser transports. fetch drops
// Authorization and Cookie on a cross-origin redirect but keeps a custom
// header. A decorator that must authenticate a cross-origin target therefore
// uses a custom header.
//
// decorateUrl in the init message names a module whose default (or `decorate`)
// export is (request) => request, or a Promise of one. It runs here, away from
// the blocked caller, and a token refresh can await. If the import fails or
// exports no function, the worker posts an error and never reports ready.

import { parentPort } from 'node:worker_threads';

const OVERFLOW_FLAG = 1;

let controlBuffer = null;
let dataBuffer = null;
let metaBuffer = null;
let decorate = null;
let requestTimeoutMs = 0;

parentPort.on('message', async (msg) => {
  if (msg.cmd === 'init') await handleInit(msg);
});

async function handleInit(msg) {
  controlBuffer = new Int32Array(msg.controlBuffer);
  dataBuffer = new Uint8Array(msg.dataBuffer);
  metaBuffer = new Int32Array(msg.metaBuffer);
  requestTimeoutMs = msg.requestTimeoutMs;
  if (msg.decorateUrl) {
    try {
      decorate = await importDecorator(msg.decorateUrl);
    } catch (err) {
      // Serving with no decorator would drop auth silently.
      parentPort.postMessage({ status: 'error', error: `decorate import failed: ${err.message}` });
      return;
    }
  }
  parentPort.postMessage({ status: 'ready' });
  serveRequests();
}

async function importDecorator(decorateUrl) {
  const mod = await import(decorateUrl);
  const fn = mod.default ?? mod.decorate ?? null;
  if (typeof fn !== 'function') {
    throw new Error(`module ${decorateUrl} exports no default/decorate function`);
  }
  return fn;
}

// waitAsync keeps the event loop running between requests, for the timers of
// the decorator. The host terminates the worker.
async function serveRequests() {
  for (;;) {
    const generation = Atomics.load(controlBuffer, 0);
    if (generation === 0) await Atomics.waitAsync(controlBuffer, 0, 0).value;
    else await handleRequest(generation);
  }
}

async function handleRequest(generation) {
  const controller = new AbortController();
  let timer = null;
  const restartIdleTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(new Error('request timeout')), requestTimeoutMs);
  };
  restartIdleTimer();
  try {
    const request = readRequest();
    // Skip a request that the caller already took back.
    if (Atomics.load(controlBuffer, 0) !== generation) return;
    const decorated = await applyDecorator(request, controller.signal);
    const response = await doFetch(decorated, controller.signal, restartIdleTimer);
    writeResponse(response, generation);
  } catch {
    // Status 0 releases the blocked caller.
    writeResponse({ status: 0, body: new Uint8Array(0), headersBytes: new Uint8Array(0) }, generation);
  } finally {
    clearTimeout(timer);
  }
}

// Request wire format: [jsonLength:4 LE][json utf8].
function readRequest() {
  const view = new DataView(dataBuffer.buffer);
  const jsonLength = view.getInt32(0, true);
  const jsonBytes = dataBuffer.slice(4, 4 + jsonLength);
  return JSON.parse(new TextDecoder().decode(jsonBytes));
}

// The decorator is user code that can hang. The race against the abort signal
// keeps a hang from blocking this worker and its caller forever.
function applyDecorator(request, signal) {
  if (!decorate) return request;
  return Promise.race([
    decorate(request),
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })),
  ]);
}

// Stops reading when the headers and the body so far pass the size of
// dataBuffer. A larger response is an overflow.
async function doFetch(request, signal, restartIdleTimer) {
  const { url, method = 'GET', headers = {}, body = null } = request;
  // fetch uppercases the method and then rejects a body on GET and HEAD.
  // Uppercase here to drop the body of a lowercase 'get' instead of failing.
  const m = String(method).toUpperCase();
  const init = { method: m, headers, redirect: 'follow', signal };
  if (body != null && m !== 'GET' && m !== 'HEAD') init.body = body;
  const res = await fetch(url, init);
  const headersBytes = new TextEncoder().encode(
    [...res.headers].map(([k, v]) => `${k}: ${v}`).join('\r\n'));
  const overflow = (size) => ({ status: res.status, size, overflow: true });
  let size = headersBytes.length;
  if (size > dataBuffer.length) {
    await res.body?.cancel();
    return overflow(size);
  }
  const chunks = [];
  for await (const chunk of res.body ?? []) {
    restartIdleTimer();
    size += chunk.length;
    if (size > dataBuffer.length) return overflow(size);
    chunks.push(chunk);
  }
  return { status: res.status, body: Buffer.concat(chunks), headersBytes };
}

// A request that the caller took back fails the exchange, and nothing is
// written. An overflow writes no body: a silent truncation would corrupt a
// large binary read.
function writeResponse(response, generation) {
  if (Atomics.compareExchange(controlBuffer, 0, generation, 0) !== generation) return;
  if (response.overflow) {
    console.error(
      `fetch_worker: a response of at least ${response.size}B does not fit the ` +
      `${dataBuffer.length}B transport buffer. Overflow flag set.`);
    Atomics.store(metaBuffer, 0, response.status);  // Upstream status, for diagnosis.
    Atomics.store(metaBuffer, 1, 0);
    Atomics.store(metaBuffer, 2, 0);
    Atomics.store(metaBuffer, 3, OVERFLOW_FLAG);
  } else {
    Atomics.store(metaBuffer, 0, response.status);
    Atomics.store(metaBuffer, 1, response.body.length);
    Atomics.store(metaBuffer, 2, response.headersBytes.length);
    Atomics.store(metaBuffer, 3, 0);
    dataBuffer.set(response.body, 0);
    dataBuffer.set(response.headersBytes, response.body.length);
  }
  Atomics.store(controlBuffer, 1, generation);
  Atomics.notify(controlBuffer, 1, 1);
}
