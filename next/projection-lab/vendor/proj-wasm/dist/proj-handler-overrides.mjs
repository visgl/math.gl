// Copyright (c) 2024, 2025, 2026 Will Cohen
//
// Part of clj-proj, under the MIT License.
// See LICENSE for license information.
// SPDX-License-Identifier: MIT

/**
 * The hand-written half of the proj worker-router handler: the init body and
 * the methods. The generated proj-handler.mjs wraps them in clj-native's
 * makeHandler, which runs the calls of a worker one at a time. Module-level
 * state is per worker, because each worker imports its own copy.
 *
 * This file has no static import of ffi-wasm, because a module worker ignores
 * the page importmap. The generated handler gives the ffi-wasm/handler
 * namespace to methods(ffi) and to init as ctx.ffi.
 *
 * This file runs from two different directories. Read every shipped asset
 * with the [['.'], ['dist']] candidate list, and add new assets the same way.
 * A path built from __dirname alone works in one layout and fails in the
 * other.
 */

let ffi = null;
let module = null;
let contexts = new Map();
let nextContextId = 1;
let logCallbackPtr = null;
let logLevel = 0;

// The wasm build has no curl and no emscripten FETCH, so the network
// callbacks below are PROJ's only network transport.
let nextHandleId = 1;
const handles = new Map();

const PJ_LOG_ERROR = 1;
const PJ_LOG_DEBUG = 2;
const PJ_LOG_TRACE = 3;

// Node.js has no XMLHttpRequest. makeRangeRequest blocks on the http-bridge
// fetch worker instead.
async function installNodeXhrPolyfill() {
  if (!ffi.isNode || typeof globalThis.XMLHttpRequest !== 'undefined') return;
  const syncFetch = await ffi.createSyncFetch();
  await ffi.installXhrPolyfill({ syncFetch });
}

async function loadProjModule() {
  const { factory } = await ffi.loadEmscriptenModule(import.meta.url, {
    name: 'proj-emscripten.js',
    candidates: [['.'], ['dist']],
  });
  return factory();
}

function makeRangeRequest(url, offset, sizeToRead) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    try { xhr.responseType = 'arraybuffer'; } catch (_) {}
    if (offset != null && sizeToRead != null) {
      xhr.setRequestHeader('Range',
        `bytes=${offset}-${offset + sizeToRead - 1}`);
    }
    xhr.send();
    let body = new Uint8Array(0);
    if (xhr.response instanceof ArrayBuffer) {
      body = new Uint8Array(xhr.response);
    } else if (xhr.response instanceof Uint8Array) {
      body = xhr.response;
    } else if (typeof xhr.responseText === 'string' && xhr.responseText.length > 0) {
      body = new TextEncoder().encode(xhr.responseText);
    }
    const headers = {};
    const all = xhr.getAllResponseHeaders ? xhr.getAllResponseHeaders() : '';
    if (all) {
      for (const line of all.split(/\r\n|\n/)) {
        const idx = line.indexOf(':');
        if (idx > 0) {
          headers[line.slice(0, idx).trim().toLowerCase()] =
            line.slice(idx + 1).trim();
        }
      }
    }
    return { status: xhr.status, body, headers };
  } catch (e) {
    return { status: 0, body: new Uint8Array(0), headers: {}, error: e };
  }
}

function writeErrorString(errStrPtr, errMaxSize, msg) {
  if (!errStrPtr || errMaxSize <= 0) return;
  const bytes = new TextEncoder().encode(String(msg ?? ''));
  const n = Math.min(bytes.length, errMaxSize - 1);
  if (n > 0) module.HEAPU8.set(bytes.subarray(0, n), errStrPtr);
  module.HEAPU8[errStrPtr + n] = 0;
}

// Copies a range response into the wasm buffer. Returns the byte count, or
// null after it writes the error string.
function copyRange(response, bufferPtr, sizeToRead, errMaxSize, errStrPtr) {
  if (response.status !== 200 && response.status !== 206) {
    writeErrorString(errStrPtr, errMaxSize, response.error
      ? `Network error: ${response.error.message ?? response.error}`
      : `HTTP ${response.status}`);
    return null;
  }
  const bytesRead = Math.min(response.body.length, sizeToRead);
  if (bytesRead > 0) {
    module.HEAPU8.set(response.body.subarray(0, bytesRead), bufferPtr);
  }
  return bytesRead;
}

// An i64 offset arrives as a BigInt. A grid-file offset is far inside 2^53.
function netOpen(_ctx, urlPtr, offset, sizeToRead, bufferPtr, outSizePtr, errMaxSize, errStrPtr) {
  try {
    const url = module.UTF8ToString(urlPtr);
    const response = makeRangeRequest(url, Number(offset), sizeToRead);
    const bytesRead = copyRange(response, bufferPtr, sizeToRead, errMaxSize, errStrPtr);
    if (bytesRead === null) return 0;
    if (outSizePtr) module.setValue(outSizePtr, bytesRead, 'i32');
    const id = nextHandleId++;
    handles.set(id, { url, headers: response.headers });
    return id;
  } catch (e) {
    writeErrorString(errStrPtr, errMaxSize, e?.message ?? String(e));
    return 0;
  }
}

// PROJ reads a header string after get_header returns. The strings of a
// handle live until its close, as the strings of PROJ's own callbacks do.
export function headerValuePtr(mod, entry, name) {
  const value = entry?.headers?.[name.toLowerCase()];
  if (!value) return 0;
  const ptr = mod.stringToNewUTF8(value);
  (entry.headerPtrs ??= []).push(ptr);
  return ptr;
}

export function releaseHandleStrings(mod, entry) {
  for (const ptr of entry?.headerPtrs ?? []) mod._free(ptr);
  if (entry) entry.headerPtrs = [];
}

function netClose(_ctx, handle) {
  releaseHandleStrings(module, handles.get(handle));
  handles.delete(handle);
}

function netGetHeader(_ctx, handle, namePtr) {
  return headerValuePtr(module, handles.get(handle), module.UTF8ToString(namePtr));
}

function netReadRange(_ctx, handle, offset, sizeToRead, bufferPtr, errMaxSize, errStrPtr) {
  try {
    const entry = handles.get(handle);
    if (!entry) {
      writeErrorString(errStrPtr, errMaxSize, 'Invalid handle');
      return 0;
    }
    const response = makeRangeRequest(entry.url, Number(offset), sizeToRead);
    const bytesRead = copyRange(response, bufferPtr, sizeToRead, errMaxSize, errStrPtr);
    if (bytesRead === null) return 0;
    entry.headers = response.headers;
    return bytesRead;
  } catch (e) {
    writeErrorString(errStrPtr, errMaxSize, e?.message ?? String(e));
    return 0;
  }
}

// Signatures are PROJ's own callback types under wasm32, where pointers and
// size_t are i32 and `unsigned long long offset` is i64 (j).
let netCallbackPtrs = null;

function networkCallbackPointers() {
  // One set per module, not per context: each addFunction call grows the
  // wasm function table, and context_create runs per context.
  if (netCallbackPtrs) return netCallbackPtrs;
  netCallbackPtrs = {
    open: module.addFunction(netOpen, 'iiijiiiiii'),
    close: module.addFunction(netClose, 'viii'),
    getHeader: module.addFunction(netGetHeader, 'iiiii'),
    readRange: module.addFunction(netReadRange, 'iiijiiiii'),
  };
  return netCallbackPtrs;
}

function readStringArray(mod, listPtr) {
  const strings = [];
  let offset = 0;
  while (true) {
    const strPtr = mod.getValue(listPtr + offset * 4, '*');
    if (strPtr === 0) break;
    strings.push(mod.UTF8ToString(strPtr));
    offset++;
  }
  return strings;
}

// A NULL string reads as null.
function readField(mod, addr, type) {
  switch (type) {
    case 'string': {
      const strPtr = mod.getValue(addr, '*');
      return strPtr ? mod.UTF8ToString(strPtr) : null;
    }
    case 'int': return mod.getValue(addr, 'i32');
    case 'boolean': return mod.getValue(addr, 'i32') !== 0;
    case 'double': return mod.getValue(addr, 'double');
  }
}

function readOutParams(mod, outParamAllocs) {
  return Object.fromEntries(outParamAllocs.map(({ ptr, size, field }) => [field.key,
    field.type === 'double-array'
      ? Array.from({ length: size / 8 }, (_, j) => mod.getValue(ptr + j * 8, 'double'))
      : readField(mod, ptr, field.type)]));
}

function freeOutParams(mod, outParamAllocs) {
  for (const { ptr } of outParamAllocs) mod._free(ptr);
}

function readStructList(mod, listPtr, count, structFields) {
  return Array.from({ length: count }, (_, i) => {
    const s = mod.getValue(listPtr + i * 4, '*');
    return Object.fromEntries(
      structFields.map(({ key, type, offset }) => [key, readField(mod, s + offset, type)]));
  });
}

// A NULL-terminated char** of `strings` in one block: the pointer slots,
// then the strings. The caller frees the block.
function allocStringArray(mod, strings) {
  const encoded = strings.map((s) => new TextEncoder().encode(String(s)));
  const slots = 4 * (encoded.length + 1);
  const base = mod._malloc(slots + encoded.reduce((n, b) => n + b.length + 1, 0));
  let at = base + slots;
  encoded.forEach((bytes, i) => {
    mod.HEAPU8.set(bytes, at);
    mod.HEAPU8[at + bytes.length] = 0;
    mod.setValue(base + 4 * i, at, '*');
    at += bytes.length + 1;
  });
  mod.setValue(base + 4 * encoded.length, 0, '*');
  return base;
}

function readCoordDataAndFree(mod, coordAllocations) {
  const coordData = [];
  for (const alloc of coordAllocations) {
    coordData.push(
      mod.HEAPF64.slice(alloc.heapOffset, alloc.heapOffset + alloc.numFloats),
    );
    mod._free(alloc.mallocPtr);
  }
  return coordData;
}

// Allocates what the call needs in the wasm heap, and points `args` at it in
// place. decodeCallResult and readCoordDataAndFree free it.
function prepareCallArgs(mod, args, opts) {
  const { projReturns, coordArrays, stringArrays, outFields, structParamsCreate } = opts;

  const stringArrayPtrs = (stringArrays ?? []).map(({ argIdx, strings }) => {
    const ptr = allocStringArray(mod, strings);
    args[argIdx] = ptr;
    return ptr;
  });

  const coordAllocations = coordArrays?.length ? coordArrays.map((ca) => {
    const mallocPtr = mod._malloc(ca.numFloats * 8);
    const heapOffset = mallocPtr / 8;
    mod.HEAPF64.set(ca.data, heapOffset);
    args[ca.argIdx] = mallocPtr;
    return { mallocPtr, heapOffset, numFloats: ca.numFloats };
  }) : null;

  const outParamAllocs = projReturns === 'out-params' && outFields ? outFields.map((field) => {
    const size = field.type === 'double-array'
      ? args[field.countArgIdx] * 8
      : (field.type === 'double' ? 8 : 4);
    const ptr = mod._malloc(size);
    args[field.argIdx] = ptr;
    return { ptr, size, field };
  }) : null;

  let paramsPtrLocal = null;
  if (projReturns === 'struct-list') {
    const countPtr = mod._malloc(4);
    mod.setValue(countPtr, 0, 'i32');
    args[args.length - 1] = countPtr;
    if (structParamsCreate) {
      paramsPtrLocal = mod.ccall(structParamsCreate, 'number', [], []);
      args[args.length - 2] = paramsPtrLocal;
    }
  }

  return { coordAllocations, stringArrayPtrs, outParamAllocs, paramsPtrLocal };
}

// Turns the raw ccall return into the value the caller gets, and releases
// every allocation the call made. `args` still carries the out-param and
// struct-list pointers the prologue appended.
export function decodeCallResult(mod, rawResult, opts) {
  const { projReturns, args, outParamAllocs, paramsPtrLocal,
    structParamsDestroy, structDestroyFn, structFields } = opts;

  if (projReturns === 'owned-string') {
    if (rawResult === 0) return null;
    const str = mod.UTF8ToString(rawResult);
    mod.ccall('proj_string_destroy', null, ['number'], [rawResult]);
    return str;
  }

  if (projReturns === 'string-list' && rawResult !== 0) {
    const strings = readStringArray(mod, rawResult);
    mod.ccall('proj_string_list_destroy', null, ['number'], [rawResult]);
    return strings;
  }

  if (projReturns === 'struct-list') {
    const countPtr = args[args.length - 1];
    let entries = [];
    if (rawResult !== 0) {
      const count = mod.getValue(countPtr, 'i32');
      entries = readStructList(mod, rawResult, count, structFields);
      mod.ccall(structDestroyFn, null, ['number'], [rawResult]);
    }
    if (paramsPtrLocal && structParamsDestroy) {
      mod.ccall(structParamsDestroy, null, ['number'], [paramsPtrLocal]);
    }
    mod._free(countPtr);
    return entries;
  }

  if (projReturns === 'out-params' && outParamAllocs) {
    const fields = rawResult === 0 ? null : readOutParams(mod, outParamAllocs);
    freeOutParams(mod, outParamAllocs);
    return fields;
  }

  return rawResult;
}

// PROJ reads proj.ini and grid files only from its search paths, and does
// not look in the dir of the database. init stages proj.ini in /proj.
function setSearchPaths(ctx, paths) {
  const block = allocStringArray(module, paths);
  try {
    module.ccall('proj_context_set_search_paths', null,
      ['number', 'number', 'number'], [ctx, paths.length, block]);
  } finally {
    module._free(block);
  }
}

// PROJ keeps errno after a failure, and proj_log_error sets a new code only
// when errno is 0. PROJ exports one reset, proj_errno_reset of a PJ, so a
// no-op PJ takes the context first. The worker does it in the ccall, so no
// other call can run between the reset and the call. proj.cljc does the same
// on the JVM.
let errnoPj = 0;

function resetErrno(ctx) {
  if (!errnoPj) {
    errnoPj = module.ccall('proj_create', 'number', ['number', 'string'], [0, '+proj=noop']);
  }
  module.ccall('proj_assign_context', null, ['number', 'number'], [errnoPj, ctx]);
  module.ccall('proj_errno_reset', 'number', ['number'], [errnoPj]);
}

export const methods = (ffiNs) => ({
  context_create: async (opts) => {
    const enableNetwork = (opts?.enableNetwork ?? true) ? 1 : 0;
    const ptr = module.ccall('proj_context_create', 'number', [], []);
    // Before the network turns on, which loads proj.ini.
    setSearchPaths(ptr, ['/proj', '/proj/grids']);
    module.ccall('proj_context_set_database_path', 'number',
      ['number', 'string'], [ptr, '/proj/proj.db']);
    module.ccall('proj_context_set_enable_network', 'number',
      ['number', 'number'], [ptr, enableNetwork]);
    if (enableNetwork) {
      const cb = networkCallbackPointers();
      module.ccall('proj_context_set_network_callbacks', 'number',
        ['number', 'number', 'number', 'number', 'number', 'number'],
        [ptr, cb.open, cb.close, cb.getHeader, cb.readRange, 0]);
    }
    module.ccall('proj_log_func', null,
      ['number', 'number', 'number'], [ptr, 0, logCallbackPtr]);
    module.ccall('proj_log_level', 'number',
      ['number', 'number'], [ptr, PJ_LOG_ERROR]);
    const ctxId = nextContextId++;
    contexts.set(ctxId, ptr);
    return { ctxId, ptr };
  },

  set_log_level: async (level) => {
    logLevel = level || 0;
    return { ok: true, level: logLevel };
  },

  context_destroy: async (ctxId) => {
    const ptr = contexts.get(ctxId);
    if (ptr) {
      module.ccall('proj_context_destroy', null, ['number'], [ptr]);
      contexts.delete(ctxId);
    }
    return { ok: true };
  },

  // With extra.errnoCheck, args[0] is the context: reset its errno, and
  // after a NULL or empty result give the errno of this call.
  ccall: async (fnName, returnType, argTypes, args, extra = {}) => {
    const { coordAllocations, stringArrayPtrs, outParamAllocs, paramsPtrLocal } =
      prepareCallArgs(module, args, extra);
    const ctx = extra.errnoCheck ? args[0] : null;
    if (ctx !== null) resetErrno(ctx);
    let rawResult;
    try {
      rawResult = module.ccall(fnName, returnType, argTypes, args);
    } finally {
      for (const ptr of stringArrayPtrs) module._free(ptr);
    }
    const errno = ctx !== null && (rawResult === 0 || rawResult === '' || rawResult == null)
      ? module.ccall('proj_context_errno', 'number', ['number'], [ctx])
      : 0;
    const coordData = coordAllocations
      ? readCoordDataAndFree(module, coordAllocations)
      : null;
    const value = decodeCallResult(module, rawResult,
      { ...extra, args, outParamAllocs, paramsPtrLocal });
    return coordAllocations || ctx !== null ? { result: value, coordData, errno } : value;
  },

  ...ffiNs.heapHelpers(() => module),

  read_string_array: async (ptr, _count) => readStringArray(module, ptr),
});

// worker-router calls this once for each worker at pool terminate, through
// the generated proj-handler.mjs. It releases the fetch worker that init took.
export function destroy() {
  return ffi?.moduleDestroy();
}

export async function init(initArgs, ctx) {
  ffi = ctx.ffi;
  const args = initArgs ?? {};
  if (!args.dbBytes) {
    throw new Error('proj-handler.create: missing required initArgs.dbBytes');
  }

  await installNodeXhrPolyfill();
  module = await loadProjModule();
  errnoPj = 0;
  ctx?.attachEmscriptenModule?.(module);

  const files = { 'proj.db': args.dbBytes };
  if (args.iniBytes) files['proj.ini'] = args.iniBytes;
  ffi.stageFiles(module, files, '/proj');

  logLevel = Number(args.logLevel ?? 0);

  logCallbackPtr = module.addFunction((_userData, level, msgPtr) => {
    const msg = module.UTF8ToString(msgPtr);
    const levelName = level === PJ_LOG_ERROR ? 'ERROR'
      : level === PJ_LOG_DEBUG ? 'DEBUG'
      : level === PJ_LOG_TRACE ? 'TRACE'
      : `L${level}`;
    if (level === PJ_LOG_ERROR || logLevel >= 2) {
      console.log(`[PROJ ${levelName}] ${msg}`);
    }
  }, 'viii');
}
