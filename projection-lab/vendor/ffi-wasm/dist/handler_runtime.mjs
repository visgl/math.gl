// Copyright (c) 2026 Will Cohen
//
// Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
// See LICENSE for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
//
// Wraps a methods object into a ModuleHandler async factory. All methods of
// one handler run serially on one queue. A destroy starts only after every
// earlier call ends. The caller gets the real result, rejection included.
//
// busyMethods and destroyMethods pick the trace events of a method: BUSY-INC
// and BUSY-DEC, or DESTROY-FIRE and DESTROY-COMPLETE.
//
// `fingerprint` maps the init args to a string. A later init with a different
// string throws, because the handler keeps the module of the first init.
//
// Logging is off by default and costs one check per call. setLogConfig({level,
// categories}) turns it on. Levels: off, error, warn, info, debug, trace. A
// category is the lowercase tag prefix before the first '-' ('BUSY-INC' gives
// 'busy'). Events go to console.log. A worker gets its settings from
// initArgs.handlerRuntime {logLevel, logCategories}.

const LEVEL_RANK = { off: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };

// A null level means off. A null categories lets every category pass.
const logState = { level: null, categories: null };

const levelRank = () => LEVEL_RANK[logState.level] ?? 0;

const parseLevel = (lvl) => {
  if (lvl === null || lvl === undefined) return null;
  if (typeof lvl === 'string' && Object.hasOwn(LEVEL_RANK, lvl)) return lvl;
  throw new Error('setLogConfig: level must be one of ' + Object.keys(LEVEL_RANK).join(', ') + ' or null (got ' + String(lvl) + ')');
};

const parseCategories = (cats) => {
  if (cats === null || cats === undefined) return null;
  if (Array.isArray(cats) || cats instanceof Set) {
    return new Set(Array.from(cats, (c) => String(c).toLowerCase()));
  }
  throw new Error('setLogConfig: categories must be an array, Set, or null');
};

export const setLogConfig = (cfg) => {
  const input = cfg ?? { level: null, categories: null };
  if (typeof input !== 'object') {
    throw new Error('setLogConfig: cfg must be an object or null');
  }
  // Parse both fields before either write, so a throw changes nothing.
  const level = Object.hasOwn(input, 'level') ? parseLevel(input.level) : logState.level;
  const categories = Object.hasOwn(input, 'categories') ? parseCategories(input.categories) : logState.categories;
  logState.level = level;
  logState.categories = categories;
};

const categoryOf = (tag) => {
  const dash = tag.indexOf('-');
  return (dash > 0 ? tag.slice(0, dash) : tag).toLowerCase();
};

// Every event is debug level. Take one isEnabled() snapshot at the opening
// event of a start/end pair and pass it to dbgPaired for the closing event.
// The two events then emit together, even if setLogConfig changes during the
// call.
export const isEnabled = (tag) =>
  levelRank() >= LEVEL_RANK.debug
  && (logState.categories === null || logState.categories.has(categoryOf(tag)));

// Date.now(), because performance.now() has a different origin in each worker
// and cannot order events across workers.
const formatEvent = (tag, fields) => {
  let line = '[CLJ-NATIVE ts=' + Date.now() + ' ' + tag + ']';
  if (fields) {
    for (const k of Object.keys(fields)) {
      const v = fields[k];
      if (v !== undefined && v !== null) line += ' ' + k + '=' + v;
    }
  }
  return line;
};

const dbgEmit = (tag, fields) => console.log(formatEvent(tag, fields));

export const dbg = (tag, fields) => {
  if (isEnabled(tag)) dbgEmit(tag, fields);
};

export const dbgPaired = (enabled, tag, fields) => { if (enabled) dbgEmit(tag, fields); };

// A typed array, an ArrayBuffer or a Buffer has a numeric byteLength.
const byteLengthOf = (v) =>
  (v !== null && typeof v === 'object' && typeof v.byteLength === 'number') ? v.byteLength : null;

// A fingerprint over the named init-arg fields only. A typed array, an
// ArrayBuffer, a Buffer or a plain array counts by its length. Use it when the
// handler must ignore an init arg that can change while the loaded module
// stays the same. `prefix` labels the handler in the re-init error.
export const byteLengthFingerprint = (fields, prefix = null) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error('byteLengthFingerprint: fields must be a non-empty array of init-arg names');
  }
  return (initArgs) => {
    const args = initArgs ?? {};
    const parts = fields.map((k) => {
      const v = args[k];
      const n = byteLengthOf(v) ?? (Array.isArray(v) ? v.length : null);
      return k + ':' + (n === null ? String(v) : n);
    });
    return prefix ? prefix + '|' + parts.join('|') : parts.join('|');
  };
};

// A wasm RuntimeError or an emscripten `Aborted(...)` error does not cross
// comlink RPC cleanly: structuredClone can fail, or the caller's await can
// stall. Returns a plain Error with `wasmTrap: true` and a `kind` for those,
// and any other error unchanged.
export const normalizeWasmError = (e) => {
  let kind;
  if (typeof WebAssembly !== 'undefined'
      && WebAssembly.RuntimeError
      && e instanceof WebAssembly.RuntimeError) {
    kind = 'wasm-runtime-error';
  } else if (e instanceof Error
             && typeof e.message === 'string'
             && e.message.startsWith('Aborted')) {
    kind = 'emscripten-abort';
  } else {
    return e;
  }
  const wrapped = new Error(e.message);
  wrapped.wasmTrap = true;
  wrapped.kind = kind;
  if (e.stack) wrapped.stack = e.stack;
  return wrapped;
};

export function makeHandler({
  init,
  fingerprint,
  methods,
  busyMethods = [],
  destroyMethods = [],
  label = null,
} = {}) {
  // If init calls ctx.attachEmscriptenModule(module), BUSY events carry
  // heap-bytes and brk.
  let emscriptenModule = null;
  const inspectHeap = () => {
    const m = emscriptenModule;
    if (!m || !m.HEAPU8) return null;
    const out = { 'heap-bytes': m.HEAPU8.length };
    if (typeof m._sbrk === 'function') {
      try { out.brk = m._sbrk(0); } catch { /* no brk */ }
    }
    return out;
  };
  if (!methods || typeof methods !== 'object' || Object.keys(methods).length === 0) {
    throw new Error('makeHandler: `methods` is required and must be a non-empty object');
  }
  for (const [kind, names] of [['busyMethod', busyMethods], ['destroyMethod', destroyMethods]]) {
    for (const name of names) {
      if (!Object.hasOwn(methods, name)) {
        throw new Error(`makeHandler: ${kind} '${name}' not present in methods`);
      }
    }
  }
  if (typeof fingerprint !== 'function') {
    throw new Error('makeHandler: `fingerprint` is required and must be a function of the init args');
  }
  const busy = new Set(busyMethods);
  const destroy = new Set(destroyMethods);
  // wrap() tests destroy first, and a name in both sets would lose its busy
  // events with no error.
  for (const name of busy) {
    if (destroy.has(name)) {
      throw new Error(`makeHandler: method '${name}' is in both busyMethods and destroyMethods`);
    }
  }

  let workerQueue = Promise.resolve();
  // The `id` on BUSY and DESTROY events, to pair start and end events.
  let callIdCounter = 0;
  // Set by __setWorkerSlot. A handler outside a pool keeps null and emits no
  // slot field.
  let slot = null;

  const wrap = (name, fn) => {
    const [enterEvent, exitEvent] = destroy.has(name) ? ['DESTROY-FIRE', 'DESTROY-COMPLETE']
      : busy.has(name) ? ['BUSY-INC', 'BUSY-DEC']
        : [null, null];
    // inspectHeap() calls into wasm, so only a busy event that is on calls it.
    const heapFields = busy.has(name) ? inspectHeap : () => null;
    return (...args) => {
      const next = workerQueue.then(async () => {
        // One snapshot, so the exit event always pairs with the enter event.
        const fields = enterEvent !== null && isEnabled(enterEvent)
          && { fn: name, 'c-fn': name === 'ccall' ? args[0] : null, label, slot, id: ++callIdCounter };
        if (fields) dbgEmit(enterEvent, { ...fields, ...heapFields() });
        try {
          return await fn(...args);
        } catch (e) {
          throw normalizeWasmError(e);
        } finally {
          if (fields) dbgEmit(exitEvent, { ...fields, ...heapFields() });
        }
      });
      workerQueue = next.catch(() => {});
      return next;
    };
  };

  let cachedFingerprint = null;
  let initPromise = null;

  const build = async (initArgs) => {
    if (typeof init === 'function') {
      await init(initArgs, { attachEmscriptenModule(m) { emscriptenModule = m; } });
    }
    const wrapped = {};
    for (const name of Object.keys(methods)) {
      wrapped[name] = wrap(name, methods[name]);
    }
    // Reserved name. The :handler-runtime broadcast of init-pool! calls it. It
    // bypasses wrap(), so it does not wait behind in-flight calls.
    wrapped.__setLogConfig = setLogConfig;
    // Reserved name. init-pool! calls it once per worker, and later events
    // carry `slot=N`. It records the slot while logging is off too.
    wrapped.__setWorkerSlot = (s) => { slot = s; };
    return wrapped;
  };

  // Roll back to let the caller retry with corrected args.
  const rollback = (e) => {
    cachedFingerprint = null;
    initPromise = null;
    throw e;
  };

  const factory = async (initArgs) => {
    // A worker is a separate JS context that a host setLogConfig cannot
    // reach.
    if (initArgs && initArgs.handlerRuntime) {
      const hr = initArgs.handlerRuntime;
      setLogConfig({ level: hr.logLevel, categories: hr.logCategories });
    }
    const print = fingerprint(initArgs);
    if (initPromise === null) {
      cachedFingerprint = print;
      // build is async, so an init that throws with no await still rejects,
      // and rollback runs after this assignment.
      initPromise = build(initArgs).catch(rollback);
    } else if (print !== cachedFingerprint) {
      throw new Error(
        `makeHandler: re-init with different args (cached fingerprint ${cachedFingerprint}, got ${print})`,
      );
    }
    return initPromise;
  };

  return factory;
}
