/*
 * Copyright (c) 2026 Will Cohen
 *
 * Part of worker-router, under the Apache License v2.0 with LLVM Exceptions.
 * See LICENSE for license information.
 * SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
 */

// src/cljc/pool.mjs
import * as squint_core from "squint-cljs/core.js";
import * as Comlink from "comlink";
var DEFAULT_SIZE_FALLBACK = 4;
var DEFAULT_BOOTSTRAP_TIMEOUT_MS = 3e5;
var DEFAULT_SHUTDOWN_TIMEOUT_MS = 5e3;
var WORKER_ROUTER_COORDINATOR_KEY = "__worker_router__";
var PROBE_KEYS = /* @__PURE__ */ new Set(["then", "toJSON", "valueOf", "toString", "constructor"]);
var detect_runtime = function() {
  const mp_1 = globalThis.process;
  if (squint_core.truth_((() => {
    const and__23694__auto___2 = mp_1;
    if (squint_core.truth_(and__23694__auto___2)) {
      const and__23694__auto___3 = mp_1.versions;
      if (squint_core.truth_(and__23694__auto___3)) {
        return squint_core.string_QMARK_(mp_1.versions.node);
      } else {
        return and__23694__auto___3;
      }
      ;
    } else {
      return and__23694__auto___2;
    }
    ;
  })())) {
    return "node";
  } else {
    return "browser";
  }
  ;
};
var detectRuntime = function() {
  return detect_runtime();
};
var resolve_size = function(size) {
  if (size === "auto") {
    const hc_1 = (() => {
      const G__1_2 = globalThis;
      const G__1_3 = G__1_2 == null ? null : G__1_2.navigator;
      if (G__1_3 == null) {
        return null;
      } else {
        return G__1_3.hardwareConcurrency;
      }
      ;
    })();
    if (squint_core.truth_((() => {
      const and__23694__auto___4 = squint_core.number_QMARK_(hc_1);
      if (squint_core.truth_(and__23694__auto___4)) {
        return hc_1 > 0;
      } else {
        return and__23694__auto___4;
      }
      ;
    })())) {
      return hc_1;
    } else {
      return DEFAULT_SIZE_FALLBACK;
    }
    ;
  } else {
    return size;
  }
  ;
};
var browser_worker_url = function(bootstrap_url) {
  const u_1 = new URL(bootstrap_url, location.href);
  if (squint_core._EQ_(u_1.origin, location.origin)) {
    return { "url": bootstrap_url, "blob": false };
  } else {
    return { "url": URL.createObjectURL(new Blob([`${"import "}${JSON.stringify(u_1.href) ?? ""}${";"}`], { "type": "text/javascript" })), "blob": true };
  }
  ;
};
var spawn = async function(bootstrap_url) {
  if (detect_runtime() === "node") {
    const wt_1 = await import("node:worker_threads");
    const NW_2 = wt_1.Worker;
    const ne_mod_3 = await import("comlink/dist/esm/node-adapter.mjs");
    const ne_4 = ne_mod_3.default;
    const raw_5 = new NW_2(new URL(bootstrap_url));
    const endpoint_6 = ne_4(raw_5);
    return { "raw": raw_5, "endpoint": endpoint_6, "terminate": (function() {
      return raw_5.terminate();
    }) };
  } else {
    const shim_7 = browser_worker_url(bootstrap_url);
    const raw_8 = new Worker(shim_7.url, { "type": "module" });
    return { "raw": raw_8, "endpoint": raw_8, "terminate": (async function terminate() {
      raw_8.terminate();
      if (squint_core.truth_(shim_7.blob)) {
        URL.revokeObjectURL(shim_7.url);
      }
      ;
      return null;
    }) };
  }
  ;
};
var await_ready = async function(handle, timeout_ms) {
  const raw_1 = handle.raw;
  const timeout_id_2 = squint_core.volatile_BANG_(null);
  const cleanup_3 = squint_core.volatile_BANG_((function() {
    return null;
  }));
  const timer_4 = new Promise((function(_, reject) {
    const tid_5 = setTimeout((function() {
      return reject(new Error("worker-router: bootstrap timeout"));
    }), timeout_ms);
    squint_core.vreset_BANG_(timeout_id_2, tid_5);
    if (squint_core.truth_((() => {
      const and__23694__auto___6 = tid_5;
      if (squint_core.truth_(and__23694__auto___6)) {
        return tid_5.unref;
      } else {
        return and__23694__auto___6;
      }
      ;
    })())) {
      return tid_5.unref();
    }
    ;
  }));
  const ready_7 = new Promise((function(resolve, reject) {
    const on_msg_8 = (function(t, message) {
      if (t === "worker-router/ready") {
        return resolve();
      } else {
        if (t === "worker-router/error") {
          return reject(new Error(`${"worker-router: worker bootstrap failed: "}${message ?? ""}`));
        } else {
          return null;
        }
      }
      ;
    });
    if (squint_core.truth_((() => {
      const and__23694__auto___9 = raw_1.on;
      if (squint_core.truth_(and__23694__auto___9)) {
        return raw_1.removeListener;
      } else {
        return and__23694__auto___9;
      }
      ;
    })())) {
      const msg_listener_10 = (function(m) {
        return on_msg_8((() => {
          const G__2_11 = m;
          if (G__2_11 == null) {
            return null;
          } else {
            return G__2_11.type;
          }
          ;
        })(), (() => {
          const G__3_12 = m;
          if (G__3_12 == null) {
            return null;
          } else {
            return G__3_12.message;
          }
          ;
        })());
      });
      const err_listener_13 = (function(err) {
        return reject(err);
      });
      const exit_listener_14 = (function(code) {
        return reject(new Error(`${"worker-router: worker exited during bootstrap (code "}${code ?? ""}${")"}`));
      });
      squint_core.vreset_BANG_(cleanup_3, (function() {
        raw_1.removeListener("message", msg_listener_10);
        raw_1.removeListener("error", err_listener_13);
        return raw_1.removeListener("exit", exit_listener_14);
      }));
      raw_1.on("message", msg_listener_10);
      raw_1.on("error", err_listener_13);
      return raw_1.on("exit", exit_listener_14);
    } else {
      if (squint_core.truth_(raw_1.addEventListener)) {
        const msg_listener_15 = (function(ev) {
          return on_msg_8((() => {
            const G__4_16 = ev;
            const G__4_17 = G__4_16 == null ? null : G__4_16.data;
            if (G__4_17 == null) {
              return null;
            } else {
              return G__4_17.type;
            }
            ;
          })(), (() => {
            const G__5_18 = ev;
            const G__5_19 = G__5_18 == null ? null : G__5_18.data;
            if (G__5_19 == null) {
              return null;
            } else {
              return G__5_19.message;
            }
            ;
          })());
        });
        const err_listener_20 = (function(ev) {
          return reject(new Error(`${"worker-router: worker error during bootstrap: "}${(() => {
            const or__23663__auto___21 = ev.message;
            if (squint_core.truth_(or__23663__auto___21)) {
              return or__23663__auto___21;
            } else {
              return "unknown";
            }
            ;
          })() ?? ""}`));
        });
        squint_core.vreset_BANG_(cleanup_3, (function() {
          raw_1.removeEventListener("message", msg_listener_15);
          return raw_1.removeEventListener("error", err_listener_20);
        }));
        raw_1.addEventListener("message", msg_listener_15);
        return raw_1.addEventListener("error", err_listener_20);
      } else {
        return null;
      }
    }
    ;
  }));
  try {
    return await Promise.race([ready_7, timer_4]);
  } finally {
    squint_core.deref(cleanup_3)();
    const temp__23298__auto___22 = squint_core.deref(timeout_id_2);
    if (squint_core.truth_(temp__23298__auto___22)) {
      const tid_23 = temp__23298__auto___22;
      clearTimeout(tid_23);
    }
  }
  ;
};
var count_call = function(worker, invoke) {
  if (squint_core.truth_(worker.terminated)) {
    return Promise.reject(new Error("worker-router: pool terminated"));
  } else {
    if (squint_core.truth_(worker.dead)) {
      return Promise.reject(new Error(`${"worker-router: worker "}${worker.index ?? ""}${" is dead"}`));
    } else {
      if ("else") {
        worker.pending = worker.pending + 1;
        const p_1 = (() => {
          try {
            return Promise.resolve(invoke());
          } catch (e_2) {
            return Promise.reject(e_2);
          }
        })();
        const raced_3 = Promise.race([p_1, worker.signal]);
        raced_3.finally((function() {
          return worker.pending = worker.pending - 1;
        })).catch((function(_) {
          return null;
        }));
        return raced_3;
      } else {
        return null;
      }
    }
  }
  ;
};
var wrap_for_counting = function(worker, inner) {
  if (inner == null) {
    return inner;
  } else {
    if (squint_core.truth_((() => {
      const or__23663__auto___1 = squint_core.fn_QMARK_(inner);
      if (squint_core.truth_(or__23663__auto___1)) {
        return or__23663__auto___1;
      } else {
        return squint_core.not(squint_core.number_QMARK_(inner)) && (squint_core.not(squint_core.string_QMARK_(inner)) && squint_core.not(squint_core.boolean_QMARK_(inner)));
      }
      ;
    })())) {
      return new Proxy(inner, { "get": (function(target, prop, receiver) {
        if (squint_core.truth_(squint_core.string_QMARK_(prop))) {
          return wrap_for_counting(worker, Reflect.get(target, prop, receiver));
        } else {
          return Reflect.get(target, prop, receiver);
        }
        ;
      }), "apply": (function(target, this_arg, args) {
        return count_call(worker, (function() {
          return Reflect.apply(target, this_arg, args);
        }));
      }) });
    } else {
      if ("else") {
        return inner;
      } else {
        return null;
      }
    }
  }
  ;
};
var pick_least_loaded = function(all_records) {
  const alive_1 = all_records.filter((function(r) {
    return squint_core.not(r.dead);
  }));
  const records_arr_2 = alive_1.length > 0 ? alive_1 : all_records;
  const n_3 = records_arr_2.length;
  const w0_4 = records_arr_2[0];
  let i_5 = 1;
  let best_6 = w0_4;
  let best_load_7 = w0_4.pending + w0_4.claims;
  while (true) {
    if (i_5 < n_3) {
      const w_8 = records_arr_2[i_5];
      const load_9 = w_8.pending + w_8.claims;
      if (load_9 < best_load_7) {
        let G__10 = i_5 + 1;
        let G__11 = w_8;
        let G__12 = load_9;
        i_5 = G__10;
        best_6 = G__11;
        best_load_7 = G__12;
        continue;
      } else {
        let G__13 = i_5 + 1;
        let G__14 = best_6;
        let G__15 = best_load_7;
        i_5 = G__13;
        best_6 = G__14;
        best_load_7 = G__15;
        continue;
      }
      ;
    } else {
      return best_6;
    }
    ;
    ;
    break;
  }
  ;
};
var dispatching_proxy = function(worker, registered_modules) {
  return new Proxy({}, { "get": (function(target, key, receiver) {
    if (squint_core.not(squint_core.string_QMARK_(key))) {
      return void 0;
    } else {
      if (squint_core.truth_(PROBE_KEYS.has(key))) {
        return Reflect.get(target, key, receiver);
      } else {
        if (squint_core.not(registered_modules.has(key))) {
          throw new Error(`${'worker-router: unknown module key "'}${key ?? ""}${'"'}`);
        } else {
          if ("else") {
            const inner_1 = worker.proxy[key];
            return wrap_for_counting(worker, inner_1);
          } else {
            return null;
          }
        }
      }
    }
    ;
  }) });
};
var any_proxy = function(records_arr, registered_modules, path) {
  return new Proxy((function() {
    return null;
  }), { "get": (function(target, key, receiver) {
    if (squint_core.not(squint_core.string_QMARK_(key))) {
      return void 0;
    } else {
      if (squint_core.truth_(PROBE_KEYS.has(key))) {
        return Reflect.get(target, key, receiver);
      } else {
        if ("else") {
          if (squint_core.truth_(path.length === 0 && squint_core.not(registered_modules.has(key)))) {
            throw new Error(`${'worker-router: unknown module key "'}${key ?? ""}${'"'}`);
          }
          ;
          return any_proxy(records_arr, registered_modules, path.concat([key]));
        } else {
          return null;
        }
      }
    }
    ;
  }), "apply": (function(_target, _this, args) {
    if (path.length === 0) {
      throw new Error("worker-router: any() proxy invoked before selecting a module method");
    }
    ;
    const worker_1 = pick_least_loaded(records_arr);
    const last_idx_2 = path.length - 1;
    const parent_3 = path.slice(0, last_idx_2).reduce((function(o, k) {
      return o[k];
    }), worker_1.proxy);
    const f_4 = parent_3[path[last_idx_2]];
    return count_call(worker_1, (function() {
      return Reflect.apply(f_4, parent_3, args);
    }));
  }) });
};
var resolve_within = function(p, ms) {
  return new Promise((function(resolve, reject) {
    const tid_1 = setTimeout((function() {
      return resolve(void 0);
    }), ms);
    if (squint_core.truth_((() => {
      const and__23694__auto___2 = tid_1;
      if (squint_core.truth_(and__23694__auto___2)) {
        return tid_1.unref;
      } else {
        return and__23694__auto___2;
      }
      ;
    })())) {
      tid_1.unref();
    }
    ;
    return Promise.resolve(p).then((function(v) {
      clearTimeout(tid_1);
      return resolve(v);
    }), (function(e) {
      clearTimeout(tid_1);
      return reject(e);
    }));
  }));
};
var watch_liveness = function(record) {
  const raw_1 = record.handle.raw;
  const mark_2 = (function() {
    record.dead = true;
    return record.signalReject(new Error(`${"worker-router: worker "}${record.index ?? ""}${" died"}`));
  });
  if (squint_core.truth_((() => {
    const and__23694__auto___3 = raw_1.on;
    if (squint_core.truth_(and__23694__auto___3)) {
      return raw_1.removeListener;
    } else {
      return and__23694__auto___3;
    }
    ;
  })())) {
    raw_1.on("error", (function(err) {
      mark_2();
      return console.error("worker-router: worker", record.index, "error:", err);
    }));
    return raw_1.on("exit", (function(code) {
      mark_2();
      if (squint_core.truth_(squint_core.not(record.terminated) && (() => {
        const and__23694__auto___4 = squint_core.number_QMARK_(code);
        if (squint_core.truth_(and__23694__auto___4)) {
          return !(code === 0);
        } else {
          return and__23694__auto___4;
        }
        ;
      })())) {
        return console.error("worker-router: worker", record.index, "exited unexpectedly (code", code, ")");
      }
      ;
    }));
  } else {
    if (squint_core.truth_(raw_1.addEventListener)) {
      return raw_1.addEventListener("error", (function(ev) {
        mark_2();
        return console.error("worker-router: worker", record.index, "error:", (() => {
          const or__23663__auto___5 = ev.message;
          if (squint_core.truth_(or__23663__auto___5)) {
            return or__23663__auto___5;
          } else {
            return ev;
          }
          ;
        })());
      }));
    } else {
      return null;
    }
  }
  ;
};
var create_pool = async function(opts) {
  const handlers_1 = opts.handlers;
  const keys_arr_2 = Object.keys(handlers_1);
  const size_3 = resolve_size(opts.size);
  if (keys_arr_2.length === 0) {
    throw new Error("worker-router: at least one handler must be registered");
  }
  ;
  if (opts.size == null) {
    throw new Error("worker-router: size is required");
  }
  ;
  if (squint_core.truth_(await (async () => {
    const or__23663__auto___4 = squint_core.not(Number.isInteger(size_3));
    if (or__23663__auto___4) {
      return or__23663__auto___4;
    } else {
      return size_3 < 1;
    }
    ;
  })())) {
    throw new Error(`${"worker-router: size must be a positive integer, got "}${size_3 ?? ""}`);
  }
  ;
  const runtime_5 = detect_runtime();
  const bootstrap_6 = opts.bootstrap;
  const bootstrap_timeout_7 = await (async () => {
    const or__23663__auto___8 = opts.bootstrapTimeoutMs;
    if (squint_core.truth_(or__23663__auto___8)) {
      return or__23663__auto___8;
    } else {
      return DEFAULT_BOOTSTRAP_TIMEOUT_MS;
    }
    ;
  })();
  const shutdown_timeout_9 = await (async () => {
    const or__23663__auto___10 = opts.shutdownTimeoutMs;
    if (squint_core.truth_(or__23663__auto___10)) {
      return or__23663__auto___10;
    } else {
      return DEFAULT_SHUTDOWN_TIMEOUT_MS;
    }
    ;
  })();
  const comlink_url_11 = await (async () => {
    const or__23663__auto___12 = opts.comlinkUrl;
    if (squint_core.truth_(or__23663__auto___12)) {
      return or__23663__auto___12;
    } else {
      return import.meta.resolve("comlink");
    }
    ;
  })();
  const bootstrap_msg_13 = { "type": "worker-router/bootstrap", "handlers": handlers_1, "comlinkUrl": comlink_url_11 };
  const spawn_promises_14 = Array.from({ "length": size_3 }, (function(_, _i) {
    return spawn(bootstrap_6);
  }));
  const spawn_settled_15 = await Promise.allSettled(spawn_promises_14);
  const rejected_16 = spawn_settled_15.filter((function(s) {
    return s.status === "rejected";
  }));
  const handles_17 = spawn_settled_15.filter((function(s) {
    return s.status === "fulfilled";
  })).map((function(s) {
    return s.value;
  }));
  if (rejected_16.length > 0) {
    await Promise.allSettled(handles_17.map((function(h) {
      return h.terminate();
    })));
    throw rejected_16[0].reason;
  }
  ;
  const records_arr_18 = handles_17.map((function(handle, idx) {
    const reject_box_19 = squint_core.volatile_BANG_(null);
    const signal_20 = new Promise((function(_, reject) {
      return squint_core.vreset_BANG_(reject_box_19, reject);
    }));
    signal_20.catch((function(_) {
      return null;
    }));
    return { "dead": false, "index": idx, "pending": 0, "claims": 0, "proxy": Comlink.wrap(handle.endpoint), "terminated": false, "handle": handle, "signal": signal_20, "signalReject": squint_core.deref(reject_box_19) };
  }));
  records_arr_18.forEach((function(r) {
    return watch_liveness(r);
  }));
  try {
    for (let G__21 of squint_core.iterable(handles_17)) {
      const h_22 = G__21;
      h_22.raw.postMessage(bootstrap_msg_13);
    }
    ;
    await Promise.all(handles_17.map((function(h) {
      return await_ready(h, bootstrap_timeout_7);
    })));
  } catch (err_23) {
    await Promise.allSettled(handles_17.map((function(h) {
      return h.terminate();
    })));
    throw err_23;
  }
  ;
  const registered_modules_24 = new Set(keys_arr_2);
  const terminate_promise_25 = squint_core.volatile_BANG_(null);
  const assert_live_26 = (function() {
    if (squint_core.truth_(squint_core.deref(terminate_promise_25))) {
      throw new Error("worker-router: pool terminated");
    }
    ;
  });
  return { "size": size_3, "runtime": runtime_5, "registeredModules": registered_modules_24, "worker": (function(index) {
    assert_live_26();
    if (squint_core.truth_((() => {
      const or__23663__auto___27 = squint_core.not(Number.isInteger(index));
      if (or__23663__auto___27) {
        return or__23663__auto___27;
      } else {
        const or__23663__auto___28 = index < 0;
        if (or__23663__auto___28) {
          return or__23663__auto___28;
        } else {
          return index >= size_3;
        }
        ;
      }
      ;
    })())) {
      throw new RangeError(`${"worker-router: worker index "}${index ?? ""}${" out of range [0, "}${size_3 ?? ""}${")"}`);
    }
    ;
    return dispatching_proxy(records_arr_18[index], registered_modules_24);
  }), "any": (function() {
    assert_live_26();
    return any_proxy(records_arr_18, registered_modules_24, []);
  }), "claim": (function() {
    assert_live_26();
    const worker_29 = pick_least_loaded(records_arr_18);
    worker_29.claims = worker_29.claims + 1;
    const released_30 = squint_core.volatile_BANG_(false);
    const release_31 = (function() {
      if (squint_core.truth_(squint_core.deref(released_30))) {
        return null;
      } else {
        squint_core.vreset_BANG_(released_30, true);
        return worker_29.claims = worker_29.claims - 1;
      }
      ;
    });
    return { "index": worker_29.index, "release": release_31 };
  }), "terminate": (function() {
    if (squint_core.deref(terminate_promise_25) == null) {
      records_arr_18.forEach((function(r) {
        r.terminated = true;
        return r.signalReject(new Error("worker-router: pool terminated"));
      }));
      squint_core.vreset_BANG_(terminate_promise_25, Promise.allSettled(records_arr_18.map((function(r) {
        if (squint_core.truth_(r.dead)) {
          return Promise.resolve();
        } else {
          const coord_32 = r.proxy[WORKER_ROUTER_COORDINATOR_KEY];
          if (squint_core.truth_((() => {
            const and__23694__auto___33 = coord_32;
            if (squint_core.truth_(and__23694__auto___33)) {
              return squint_core.fn_QMARK_(coord_32.shutdown);
            } else {
              return and__23694__auto___33;
            }
            ;
          })())) {
            return resolve_within(coord_32.shutdown(), shutdown_timeout_9);
          } else {
            return Promise.resolve();
          }
          ;
        }
        ;
      }))).then((function(_) {
        return Promise.allSettled(records_arr_18.map((function(r) {
          return r.handle.terminate();
        })));
      })).then((function(_) {
        return void 0;
      })));
    }
    ;
    return squint_core.deref(terminate_promise_25);
  }) };
};
var WorkerPool = { "create": create_pool };
export {
  WorkerPool,
  detectRuntime,
  spawn
};
