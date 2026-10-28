// src/cljc/net/willcohen/native/pool.mjs
import * as squint_core from "squint-cljs/core.js";
import * as cp from "worker-router";
import * as resource from "resource-tracker";
import * as hrt from "./handler_runtime.mjs";
import * as string from "squint-cljs/src/squint/string.js";
import * as clojure_DOT_string from "squint-cljs/src/squint/string.js";
var dispatch_id_counter = squint_core.atom(0);
var sanitize_reason = function(msg) {
  const s_1 = squint_core.truth_(squint_core.string_QMARK_(msg)) ? msg : `${msg ?? ""}`;
  const one_line_2 = string.replace(s_1, /[\s=]+/, "_");
  if (squint_core.count(one_line_2) > 200) {
    return squint_core.subs(one_line_2, 0, 200);
  } else {
    return one_line_2;
  }
  ;
};
var worker_call = async function(pool, handler_key, method_name, args, worker_idx) {
  const target_1 = !(worker_idx == null) ? pool.worker(worker_idx) : pool.any();
  const handler_name_2 = `${handler_key ?? ""}`;
  const method_fn_3 = target_1[handler_name_2][method_name];
  const call_args_4 = squint_core.truth_(args) ? args : [];
  const queue_enabled_QMARK__5 = hrt.isEnabled("QUEUE-DISPATCH");
  const rpc_enabled_QMARK__6 = hrt.isEnabled("RPC-POST");
  const ev_7 = squint_core.truth_(squint_core.truth_(queue_enabled_QMARK__5) ? queue_enabled_QMARK__5 : rpc_enabled_QMARK__6) ? { "lib": handler_name_2, "fn": method_name, "c-fn": method_name === "ccall" ? call_args_4[0] : null, "worker": !(worker_idx == null) ? worker_idx : "auto", "disp-id": squint_core.swap_BANG_(dispatch_id_counter, squint_core.inc) } : null;
  hrt.dbgPaired(queue_enabled_QMARK__5, "QUEUE-DISPATCH", ev_7);
  hrt.dbgPaired(rpc_enabled_QMARK__6, "RPC-POST", ev_7);
  try {
    const result_8 = await method_fn_3.apply(null, call_args_4);
    hrt.dbgPaired(rpc_enabled_QMARK__6, "RPC-REPLY", ev_7);
    hrt.dbgPaired(queue_enabled_QMARK__5, "QUEUE-COMPLETE", ev_7);
    return result_8;
  } catch (e_9) {
    if (squint_core.truth_(ev_7)) {
      ev_7["failed"] = "true";
      ev_7["reason"] = sanitize_reason(await (async () => {
        const or_11_12 = await (async () => {
          const G__1_10 = e_9;
          if (G__1_10 == null) {
            return null;
          } else {
            return G__1_10.message;
          }
          ;
        })();
        if (squint_core.truth_(or_11_12)) {
          return or_11_12;
        } else {
          return `${e_9 ?? ""}`;
        }
        ;
      })());
    }
    ;
    hrt.dbgPaired(rpc_enabled_QMARK__6, "RPC-REPLY", ev_7);
    hrt.dbgPaired(queue_enabled_QMARK__5, "QUEUE-COMPLETE", ev_7);
    throw e_9;
  }
  ;
};
var broadcast_to_handlers_BANG_ = async function(pool, handler_keys, method_name, args_fn) {
  const n2_1 = pool.size;
  let w_2 = 0;
  for (; w_2 < n2_1; w_2++) {
    await (async () => {
      const target_3 = pool.worker(w_2);
      for (let G__4 of squint_core.iterable(handler_keys)) {
        const k_5 = G__4;
        try {
          const method_fn_6 = target_3[k_5][method_name];
          await method_fn_6.apply(null, args_fn(w_2));
        } catch (_e_7) {
        }
      }
      return null;
    })();
  }
  ;
  return null;
};
var log_config = function(opts) {
  const G__3_1 = opts;
  if (!(squint_core.get(opts, "categories") == null)) {
    return squint_core.update(G__3_1, "categories", squint_core.vec);
  } else {
    return G__3_1;
  }
  ;
};
var ffi_wasm_handler_url = new URL("./handler.mjs", import.meta.url).href;
var with_ffi_wasm_handler_url = function(handlers) {
  return squint_core.update_vals(handlers, (function add_url(spec) {
    return squint_core.assoc(spec, "init", squint_core.assoc(squint_core.get(spec, "init"), "ffiWasmHandlerUrl", ffi_wasm_handler_url));
  }));
};
var init_pool_BANG_ = async function(p__4) {
  const map___1_3 = p__4;
  const map___1_4 = squint_core.truth_(squint_core.sequential_QMARK_(map___1_3)) ? squint_core.truth_(squint_core.vector_QMARK_(map___1_3)) ? map___1_3 : squint_core.seq_to_map_for_destructuring(map___1_3) : map___1_3;
  const handlers_5 = squint_core.get(map___1_4, "handlers");
  const size_6 = squint_core.get(map___1_4, "size");
  const handler_runtime_7 = squint_core.get(map___1_4, "handler-runtime");
  const pool_8 = await cp.WorkerPool.create({ "size": squint_core.truth_(size_6) ? size_6 : "auto", "bootstrap": import.meta.resolve("worker-router/worker-bootstrap"), "handlers": with_ffi_wasm_handler_url(handlers_5) });
  const handler_keys_9 = squint_core.vec(Object.keys(handlers_5));
  if (!(handler_runtime_7 == null)) {
    await broadcast_to_handlers_BANG_(pool_8, handler_keys_9, "__setLogConfig", (function log_config_args(_w) {
      return [log_config(handler_runtime_7)];
    }));
  }
  ;
  await broadcast_to_handlers_BANG_(pool_8, handler_keys_9, "__setWorkerSlot", (function worker_slot_args(w) {
    return [w];
  }));
  return pool_8;
};
var pool_size = function(pool) {
  return pool.size;
};
var set_log_config_BANG_ = function(opts) {
  return hrt.setLogConfig(log_config(opts));
};
var claim = function(pool) {
  return pool.claim();
};
var DEFAULT_MIN_AGE_MS = 100;
var now_ms = function() {
  return Date.now();
};
var pending_disposes = /* @__PURE__ */ new Set();
var in_flight_by_parent = squint_core.atom({});
var drain_promises_by_parent = squint_core.atom({});
var await_parent_drain_BANG_ = function(parent) {
  if (squint_core.get(squint_core.deref(in_flight_by_parent), parent, 0) === 0) {
    return Promise.resolve(null);
  } else {
    return squint_core.get((() => {
      const or_1_2 = squint_core.get(squint_core.deref(drain_promises_by_parent), parent);
      if (squint_core.truth_(or_1_2)) {
        return or_1_2;
      } else {
        const resolve_fn_3 = squint_core.atom(null);
        const promise_4 = new Promise((function(resolve, _reject) {
          return squint_core.reset_BANG_(resolve_fn_3, resolve);
        }));
        const entry_5 = { "promise": promise_4, "resolve": squint_core.deref(resolve_fn_3) };
        squint_core.swap_BANG_(drain_promises_by_parent, squint_core.assoc, parent, entry_5);
        return entry_5;
      }
      ;
    })(), "promise");
  }
  ;
};
var capture_pending_dispose_BANG_ = function(result) {
  if (squint_core.truth_((() => {
    const c__23573__auto___1 = Promise;
    const x__23574__auto___2 = result;
    const ret__23575__auto___3 = x__23574__auto___2 instanceof c__23573__auto___1;
    return ret__23575__auto___3;
  })())) {
    pending_disposes.add(result);
    result.then((function(_) {
      return pending_disposes.delete(result);
    }), (function(_) {
      return null;
    }));
  }
  ;
  return result;
};
var flush_pending_disposes_BANG_ = function() {
  const pending_1 = Array.from(pending_disposes);
  pending_disposes.clear();
  return Promise.allSettled(pending_1);
};
var fire_and_capture_dispose_BANG_ = function(disposer_fn, context_info) {
  hrt.dbg("EXPLICIT-DISPOSE", squint_core.truth_(context_info) ? context_info : {});
  return capture_pending_dispose_BANG_(disposer_fn());
};
var library_contexts = squint_core.atom({});
var register_library_context_BANG_ = /* @__PURE__ */ (() => {
  let f5_1 = null;
  const impl8_2 = (function(library_key) {
    return register_library_context_BANG_(library_key, null);
  });
  const impl9_3 = (function(library_key, opts) {
    if (squint_core.truth_(squint_core.contains_QMARK_(squint_core.deref(library_contexts), library_key))) {
    } else {
      squint_core.swap_BANG_(library_contexts, squint_core.assoc, library_key, { "ctx-workers": squint_core.atom({}), "live-handles": squint_core.atom({}), "max-live-ctxs": null, "min-age-ms": DEFAULT_MIN_AGE_MS, "evicted": squint_core.atom(/* @__PURE__ */ new Set([])), "stats": squint_core.atom({ "evictions": 0, "blocks": 0 }) });
    }
    ;
    const map___4_6 = opts;
    const map___4_7 = squint_core.truth_(squint_core.sequential_QMARK_(map___4_6)) ? squint_core.truth_(squint_core.vector_QMARK_(map___4_6)) ? map___4_6 : squint_core.seq_to_map_for_destructuring(map___4_6) : map___4_6;
    const max_live_ctxs_8 = squint_core.get(map___4_7, "max-live-ctxs");
    const min_age_ms_9 = squint_core.get(map___4_7, "min-age-ms");
    if (!(max_live_ctxs_8 == null)) {
      squint_core.swap_BANG_(library_contexts, squint_core.assoc_in, [library_key, "max-live-ctxs"], max_live_ctxs_8);
    }
    ;
    if (!(min_age_ms_9 == null)) {
      squint_core.swap_BANG_(library_contexts, squint_core.assoc_in, [library_key, "min-age-ms"], min_age_ms_9);
    }
    ;
    return squint_core.get(squint_core.deref(library_contexts), library_key);
  });
  f5_1 = (function(...args6) {
    const self10_10 = this;
    const G__11_11 = args6.length;
    switch (G__11_11) {
      case 1:
        return impl8_2.call(self10_10, args6[0]);
        break;
      case 2:
        return impl9_3.call(self10_10, args6[0], args6[1]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args6.length ?? ""}`);
    }
    ;
  });
  return f5_1;
})();
var worker_idx_from_args = function(args) {
  const or_1_2 = squint_core.some((function worker_idx_of(arg) {
    if (squint_core.truth_(squint_core.object_QMARK_(arg))) {
      return arg.worker_idx;
    }
    ;
  }), args);
  if (squint_core.truth_(or_1_2)) {
    return or_1_2;
  } else {
    return 0;
  }
  ;
};
var assign_worker_for_context_BANG_ = function(pool, _library_key, opts) {
  const temp__23177__auto___1 = squint_core.get(opts, "worker");
  if (squint_core.truth_(temp__23177__auto___1)) {
    const explicit_2 = temp__23177__auto___1;
    const worker_count_3 = pool_size(pool);
    if (explicit_2 < 0 || explicit_2 >= worker_count_3) {
      throw new Error(`${"Worker index "}${explicit_2 ?? ""}${" out of range (max "}${worker_count_3 - 1}${")"}`);
    }
    ;
    return { "idx": explicit_2, "release": (function() {
      return null;
    }) };
  } else {
    const c_4 = claim(pool);
    return { "idx": c_4.index, "release": c_4.release };
  }
  ;
};
var release_on_gc_BANG_ = function(library_key, ctx_id, kind, worker, owner, on_release) {
  const fired_QMARK__1 = squint_core.atom(false);
  const release_2 = (function() {
    if (squint_core.truth_(squint_core.compare_and_set_BANG_(fired_QMARK__1, false, true))) {
      hrt.dbg("FR-CALLBACK", { "lib": `${library_key ?? ""}`, "ctx-id": ctx_id, "kind": kind, "worker": worker });
      return on_release();
    } else {
      return hrt.dbg("FR-CALLBACK-SUPPRESSED", { "lib": `${library_key ?? ""}`, "ctx-id": ctx_id, "kind": kind });
    }
    ;
  });
  resource.track(owner, { "tracktype": "gc", "disposefn": release_2 });
  hrt.dbg("FR-TRACK", { "lib": `${library_key ?? ""}`, "ctx-id": ctx_id, "kind": kind, "worker": worker });
  return release_2;
};
var track_context_BANG_ = function(library_key, ctx_id, worker_idx, release_fn, owner) {
  const ctx_workers_1 = squint_core.get(register_library_context_BANG_(library_key), "ctx-workers");
  const release_2 = release_on_gc_BANG_(library_key, ctx_id, "ctx", worker_idx, owner, (function() {
    squint_core.swap_BANG_(ctx_workers_1, squint_core.dissoc, ctx_id);
    return capture_pending_dispose_BANG_(release_fn());
  }));
  return squint_core.swap_BANG_(ctx_workers_1, squint_core.assoc, ctx_id, { "release": release_2 });
};
var untrack_context_BANG_ = function(library_key, ctx_id) {
  const temp__23241__auto___1 = squint_core.get(squint_core.deref(library_contexts), library_key);
  if (squint_core.truth_(temp__23241__auto___1)) {
    const entry_2 = temp__23241__auto___1;
    const temp__23241__auto___3 = squint_core.get(squint_core.get(squint_core.deref(squint_core.get(entry_2, "ctx-workers")), ctx_id), "release");
    if (squint_core.truth_(temp__23241__auto___3)) {
      const release_4 = temp__23241__auto___3;
      return release_4();
    }
    ;
  }
  ;
};
var reset_library_context_BANG_ = function(library_key) {
  const temp__23241__auto___1 = squint_core.get(squint_core.deref(library_contexts), library_key);
  if (squint_core.truth_(temp__23241__auto___1)) {
    const entry_2 = temp__23241__auto___1;
    for (let G__3 of squint_core.iterable([squint_core.get(entry_2, "ctx-workers"), squint_core.get(entry_2, "live-handles")])) {
      const a_4 = G__3;
      for (let G__5 of squint_core.iterable(squint_core.deref(a_4))) {
        const vec___6_9 = G__5;
        const __10 = squint_core.nth(vec___6_9, 0, null);
        const stored_11 = squint_core.nth(vec___6_9, 1, null);
        const temp__23241__auto___12 = squint_core.get(stored_11, "release");
        if (squint_core.truth_(temp__23241__auto___12)) {
          const release_13 = temp__23241__auto___12;
          release_13();
        }
      }
      ;
      squint_core.reset_BANG_(a_4, {});
    }
    ;
    return squint_core.reset_BANG_(squint_core.get(entry_2, "evicted"), /* @__PURE__ */ new Set([]));
  }
  ;
};
var dec_in_flight_BANG_ = function(parent_ctx_id) {
  const m_1 = squint_core.swap_BANG_(in_flight_by_parent, (function(m) {
    const c_2 = squint_core.get(m, parent_ctx_id, 0);
    if (c_2 <= 1) {
      return squint_core.dissoc(m, parent_ctx_id);
    } else {
      return squint_core.assoc(m, parent_ctx_id, c_2 - 1);
    }
    ;
  }));
  if (squint_core.get(m_1, parent_ctx_id, 0) === 0) {
    const temp__23241__auto___3 = squint_core.get(squint_core.deref(drain_promises_by_parent), parent_ctx_id);
    if (squint_core.truth_(temp__23241__auto___3)) {
      const entry_4 = temp__23241__auto___3;
      squint_core.swap_BANG_(drain_promises_by_parent, squint_core.dissoc, parent_ctx_id);
      return squint_core.get(entry_4, "resolve")(null);
    }
    ;
  }
  ;
};
var register_handle_BANG_ = /* @__PURE__ */ (() => {
  let f12_1 = null;
  const impl15_2 = (function(library_key, ctx_id, exec_unit_idx, release_fn, owner) {
    return register_handle_BANG_(library_key, ctx_id, exec_unit_idx, release_fn, owner, null);
  });
  const impl16_3 = (function(library_key, ctx_id, exec_unit_idx, release_fn, owner, parent_ctx_id) {
    const lib_4 = register_library_context_BANG_(library_key);
    const live_5 = squint_core.get(lib_4, "live-handles");
    const done_6 = (function() {
      if (!(parent_ctx_id == null)) {
        return dec_in_flight_BANG_(parent_ctx_id);
      }
      ;
    });
    const release_7 = release_on_gc_BANG_(library_key, ctx_id, "handle", exec_unit_idx, owner, (function() {
      squint_core.swap_BANG_(live_5, squint_core.dissoc, ctx_id);
      const p_8 = release_fn();
      return capture_pending_dispose_BANG_(squint_core.truth_((() => {
        const c__23573__auto___9 = Promise;
        const x__23574__auto___10 = p_8;
        const ret__23575__auto___11 = x__23574__auto___10 instanceof c__23573__auto___9;
        return ret__23575__auto___11;
      })()) ? p_8.finally(done_6) : (() => {
        done_6();
        return p_8;
      })());
    }));
    squint_core.swap_BANG_(live_5, squint_core.assoc, ctx_id, { "ctx-id": ctx_id, "owner": new WeakRef(owner), "release": release_7, "created-at": now_ms(), "touched-at": now_ms(), "refcount": 0 });
    squint_core.swap_BANG_(squint_core.get(lib_4, "evicted"), squint_core.disj, ctx_id);
    if (!(parent_ctx_id == null)) {
      squint_core.swap_BANG_(in_flight_by_parent, (function(m) {
        return squint_core.assoc(m, parent_ctx_id, squint_core.get(m, parent_ctx_id, 0) + 1);
      }));
    }
    ;
    return ctx_id;
  });
  f12_1 = (function(...args13) {
    const self17_12 = this;
    const G__18_13 = args13.length;
    switch (G__18_13) {
      case 5:
        return impl15_2.call(self17_12, args13[0], args13[1], args13[2], args13[3], args13[4]);
        break;
      case 6:
        return impl16_3.call(self17_12, args13[0], args13[1], args13[2], args13[3], args13[4], args13[5]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args13.length ?? ""}`);
    }
    ;
  });
  return f12_1;
})();
var dispose_handle_BANG_ = function(library_key, ctx_id) {
  const temp__23241__auto___1 = squint_core.get(squint_core.deref(library_contexts), library_key);
  if (squint_core.truth_(temp__23241__auto___1)) {
    const lib_2 = temp__23241__auto___1;
    const temp__23241__auto___3 = squint_core.get(squint_core.get(squint_core.deref(squint_core.get(lib_2, "live-handles")), ctx_id), "release");
    if (squint_core.truth_(temp__23241__auto___3)) {
      const release_4 = temp__23241__auto___3;
      return release_4();
    }
    ;
  }
  ;
};
var in_flight_count_for_parent = function(parent) {
  return squint_core.get(squint_core.deref(in_flight_by_parent), parent, 0);
};
var ref_handle_BANG_ = function(library_key, ctx_id) {
  const temp__23241__auto___1 = squint_core.get(squint_core.deref(library_contexts), library_key);
  if (squint_core.truth_(temp__23241__auto___1)) {
    const lib_2 = temp__23241__auto___1;
    return squint_core.swap_BANG_(squint_core.get(lib_2, "live-handles"), (function(m) {
      if (squint_core.truth_(squint_core.contains_QMARK_(m, ctx_id))) {
        return squint_core.assoc_in(squint_core.update_in(m, [ctx_id, "refcount"], squint_core.inc), [ctx_id, "touched-at"], now_ms());
      } else {
        return m;
      }
      ;
    }));
  }
  ;
};
var unref_handle_BANG_ = function(library_key, ctx_id) {
  const temp__23241__auto___1 = squint_core.get(squint_core.deref(library_contexts), library_key);
  if (squint_core.truth_(temp__23241__auto___1)) {
    const lib_2 = temp__23241__auto___1;
    return squint_core.swap_BANG_(squint_core.get(lib_2, "live-handles"), (function(m) {
      if (squint_core.truth_(squint_core.contains_QMARK_(m, ctx_id))) {
        return squint_core.update_in(m, [ctx_id, "refcount"], (function(rc) {
          return squint_core.max(0, rc - 1);
        }));
      } else {
        return m;
      }
      ;
    }));
  }
  ;
};
var entry_age_ms = function(e, now) {
  return now - squint_core.get(e, "created-at");
};
var entry_busy_QMARK_ = function(e) {
  return squint_core.get(e, "refcount") > 0;
};
var entry_evictable_QMARK_ = function(e, now, min_age_ms) {
  if (squint_core.not(entry_busy_QMARK_(e))) {
    return entry_age_ms(e, now) >= min_age_ms;
  } else {
    return false;
  }
  ;
};
var find_oldest_evictable = function(live, min_age_ms) {
  const now_1 = now_ms();
  const evictable_2 = squint_core.filter((function(e) {
    return entry_evictable_QMARK_(e, now_1, min_age_ms);
  }), squint_core.vals(live));
  if (squint_core.truth_(squint_core.seq(evictable_2))) {
    return squint_core.apply(squint_core.min_key, (function(e) {
      return squint_core.get(e, "touched-at");
    }), evictable_2);
  }
  ;
};
var evicted_QMARK_ = function(library_key, ctx_id) {
  return squint_core.boolean$((() => {
    const temp__23241__auto___1 = squint_core.get(squint_core.deref(library_contexts), library_key);
    if (squint_core.truth_(temp__23241__auto___1)) {
      const lib_2 = temp__23241__auto___1;
      return squint_core.contains_QMARK_(squint_core.deref(squint_core.get(lib_2, "evicted")), ctx_id);
    }
    ;
  })());
};
var evict_oldest_BANG_ = function(library_key) {
  const temp__23241__auto___1 = squint_core.get(squint_core.deref(library_contexts), library_key);
  if (squint_core.truth_(temp__23241__auto___1)) {
    const lib_2 = temp__23241__auto___1;
    const temp__23177__auto___3 = find_oldest_evictable(squint_core.deref(squint_core.get(lib_2, "live-handles")), squint_core.get(lib_2, "min-age-ms"));
    if (squint_core.truth_(temp__23177__auto___3)) {
      const entry_4 = temp__23177__auto___3;
      squint_core.swap_BANG_(squint_core.get(lib_2, "evicted"), squint_core.conj, squint_core.get(entry_4, "ctx-id"));
      squint_core.get(entry_4, "release")();
      return "evicted";
    } else {
      if (squint_core.truth_(squint_core.empty_QMARK_(squint_core.deref(squint_core.get(lib_2, "live-handles"))))) {
        return "empty";
      } else {
        return "none-evictable";
      }
    }
    ;
  }
  ;
};
var bounded_create_handle_BANG_ = function(library_key, create_fn) {
  const lib_1 = register_library_context_BANG_(library_key);
  const bound_2 = squint_core.get(lib_1, "max-live-ctxs");
  const live_3 = squint_core.count(squint_core.deref(squint_core.get(lib_1, "live-handles")));
  if (squint_core.truth_(squint_core.truth_(bound_2) ? live_3 >= bound_2 : bound_2)) {
    if ("evicted" === evict_oldest_BANG_(library_key)) {
      squint_core.swap_BANG_(squint_core.get(lib_1, "stats"), squint_core.update, "evictions", squint_core.inc);
    } else {
      squint_core.swap_BANG_(squint_core.get(lib_1, "stats"), squint_core.update, "blocks", squint_core.inc);
      throw squint_core.ex_info("live-handles at bound, no evictable entry", { "library": library_key, "live": live_3, "max": bound_2, "blocked": "bounded-blocked" });
    }
  }
  ;
  return create_fn();
};
var get_pool_detail = function(library_key) {
  const temp__23241__auto___1 = squint_core.get(squint_core.deref(library_contexts), library_key);
  if (squint_core.truth_(temp__23241__auto___1)) {
    const lib_2 = temp__23241__auto___1;
    const min_age_3 = squint_core.get(lib_2, "min-age-ms");
    const now_4 = now_ms();
    const live_5 = squint_core.vals(squint_core.deref(squint_core.get(lib_2, "live-handles")));
    const blocked_6 = squint_core.filterv((function(e) {
      return squint_core.not(entry_evictable_QMARK_(e, now_4, min_age_3));
    }), live_5);
    const busy_7 = squint_core.count(squint_core.filterv(entry_busy_QMARK_, blocked_6));
    return { "total": squint_core.count(live_5), "evictable": squint_core.count(live_5) - squint_core.count(blocked_6), "blocked_refcount": busy_7, "blocked_age_gate": squint_core.count(blocked_6) - busy_7, "sample": squint_core.mapv((function blocked_sample(e) {
      return { "ctx_id": `${squint_core.get(e, "ctx-id") ?? ""}`, "refcount": squint_core.get(e, "refcount"), "owner_alive": !(squint_core.get(e, "owner").deref() == null), "age_ms": entry_age_ms(e, now_4), "age_gated": entry_age_ms(e, now_4) < min_age_3 };
    }), squint_core.take(8, blocked_6)) };
  }
  ;
};
var get_pool_stats = function(library_key) {
  const temp__23241__auto___1 = squint_core.get(squint_core.deref(library_contexts), library_key);
  if (squint_core.truth_(temp__23241__auto___1)) {
    const lib_2 = temp__23241__auto___1;
    const s_3 = squint_core.deref(squint_core.get(lib_2, "stats"));
    return { "live": squint_core.count(squint_core.deref(squint_core.get(lib_2, "live-handles"))), "evictions": squint_core.get(s_3, "evictions"), "blocks": squint_core.get(s_3, "blocks"), "max_live_ctxs": squint_core.get(lib_2, "max-live-ctxs"), "min_age_ms": squint_core.get(lib_2, "min-age-ms") };
  }
  ;
};

// src/cljc/net/willcohen/native/dispatch.mjs
import * as squint_core2 from "squint-cljs/core.js";
import * as hrt2 from "./handler_runtime.mjs";
import * as string2 from "squint-cljs/src/squint/string.js";
import * as clojure_DOT_string2 from "squint-cljs/src/squint/string.js";
var argtype__GT_ccall_type = function(t) {
  const G__1_1 = t;
  switch (G__1_1) {
    case "string":
      return "string";
      break;
    case "string?":
      return "string";
      break;
    default:
      return "number";
  }
  ;
};
var supported_types = /* @__PURE__ */ new Set(["int32", "float32", "float64", "string?", "int64", "size-t", "string", "void", "pointer", "pointer?"]);
var supported_types_msg = string2.join(" ", squint_core2.map((function(_PERCENT_1) {
  return `${":"}${squint_core2.name(_PERCENT_1)}`;
}), squint_core2.sort(supported_types)));
var validate_fn_def_BANG_ = function(fn_key, fn_def) {
  for (let G__1 of squint_core2.iterable(squint_core2.cons([":rettype", squint_core2.get(fn_def, "rettype")], squint_core2.get(fn_def, "argtypes")))) {
    const vec___2_5 = G__1;
    const arg_name_6 = squint_core2.nth(vec___2_5, 0, null);
    const t_7 = squint_core2.nth(vec___2_5, 1, null);
    if (squint_core2.truth_(squint_core2.contains_QMARK_(supported_types, t_7))) {
    } else {
      throw squint_core2.ex_info(`${"Unsupported type "}${t_7 ?? ""}${" for "}${arg_name_6 ?? ""}${" in fn-def "}${fn_key ?? ""}${". Supported: "}${supported_types_msg ?? ""}`, { "fn-key": fn_key, "arg": arg_name_6, "type": t_7 });
    }
  }
  return null;
};
var normalize_null_pointer = function(rettype, result) {
  if ((rettype === "pointer" || rettype === "pointer?") && 0 === result) {
    return null;
  } else {
    return result;
  }
  ;
};
var type_indexes = function(t, argtypes) {
  return squint_core2.set(squint_core2.keep_indexed((function(i, p__2) {
    const vec___1_4 = p__2;
    const __5 = squint_core2.nth(vec___1_4, 0, null);
    const at_6 = squint_core2.nth(vec___1_4, 1, null);
    if (squint_core2._EQ_(t, at_6)) {
      return i;
    }
    ;
  }), argtypes));
};
var fn_record = function(fn_key, fn_def) {
  return { "fn-key": fn_key, "c-name": squint_core2.name(fn_key), "fn-def": fn_def, "rettype": squint_core2.get(fn_def, "rettype"), "ccall-rettype": argtype__GT_ccall_type(squint_core2.get(fn_def, "rettype")), "ccall-argtypes": squint_core2.mapv((function(p__3) {
    const vec___1_4 = p__3;
    const __5 = squint_core2.nth(vec___1_4, 0, null);
    const t_6 = squint_core2.nth(vec___1_4, 1, null);
    return argtype__GT_ccall_type(t_6);
  }), squint_core2.get(fn_def, "argtypes")), "string?-indexes": type_indexes("string?", squint_core2.get(fn_def, "argtypes")), "int64-indexes": type_indexes("int64", squint_core2.get(fn_def, "argtypes")) };
};
var update_at_indexes = function(ix, f, args) {
  if (squint_core2.truth_(squint_core2.empty_QMARK_(ix))) {
    return args;
  } else {
    return squint_core2.vec(squint_core2.map_indexed((function(i, a) {
      if (squint_core2.truth_(squint_core2.contains_QMARK_(ix, i))) {
        return f(a);
      } else {
        return a;
      }
      ;
    }), args));
  }
  ;
};
var library = function(p__4) {
  const map___1_3 = p__4;
  const map___1_4 = squint_core2.truth_(squint_core2.sequential_QMARK_(map___1_3)) ? squint_core2.truth_(squint_core2.vector_QMARK_(map___1_3)) ? map___1_3 : squint_core2.seq_to_map_for_destructuring(map___1_3) : map___1_3;
  const key_5 = squint_core2.get(map___1_4, "key");
  const fndefs_6 = squint_core2.get(map___1_4, "fndefs");
  const impl_atom_7 = squint_core2.get(map___1_4, "impl-atom");
  const ffi_impl_ns_8 = squint_core2.get(map___1_4, "ffi-impl-ns");
  const hooks_9 = squint_core2.get(map___1_4, "hooks");
  return { "key": key_5, "impl-atom": impl_atom_7, "ffi-impl-ns": ffi_impl_ns_8, "hooks": squint_core2.truth_(hooks_9) ? hooks_9 : {}, "fns": squint_core2.reduce_kv((function(m, k, v) {
    validate_fn_def_BANG_(k, v);
    return squint_core2.assoc(m, k, fn_record(k, v));
  }), {}, fndefs_6) };
};
var check_result = async function(lib, fn_key, fn_def, opts, result) {
  const temp__23177__auto___1 = squint_core2.get(squint_core2.get(lib, "hooks"), "result-check");
  if (squint_core2.truth_(temp__23177__auto___1)) {
    const f_2 = temp__23177__auto___1;
    return await f_2(lib, fn_key, fn_def, opts, result);
  } else {
    return result;
  }
  ;
};
var convert_arg_cljs = function(arg) {
  if (squint_core2.truth_((() => {
    const and_1_2 = squint_core2.map_QMARK_(arg);
    if (squint_core2.truth_(and_1_2)) {
      return squint_core2.get(arg, "ptr");
    } else {
      return and_1_2;
    }
    ;
  })())) {
    return squint_core2.get(arg, "ptr");
  } else {
    if (arg == null) {
      return 0;
    } else {
      if ("else") {
        return arg;
      } else {
        return null;
      }
    }
  }
  ;
};
var int64_args__GT_bigint = function(rec, args) {
  return update_at_indexes(squint_core2.get(rec, "int64-indexes"), BigInt, args);
};
var ctx_ids = function(args) {
  return squint_core2.vec(squint_core2.keep((function(a) {
    if (squint_core2.truth_((() => {
      const and_1_2 = squint_core2.object_QMARK_(a);
      if (squint_core2.truth_(and_1_2)) {
        return !(a.ctx_id == null);
      } else {
        return and_1_2;
      }
      ;
    })())) {
      return a.ctx_id;
    }
    ;
  }), args));
};
var check_not_evicted_BANG_ = function(library_key, ids) {
  for (let G__1 of squint_core2.iterable(ids)) {
    const cid_2 = G__1;
    if (squint_core2.truth_(evicted_QMARK_(library_key, cid_2))) {
      throw squint_core2.ex_info(`${"context "}${cid_2 ?? ""}${" was evicted (LRU); recreate it"}`, { "library-key": library_key, "ctx-id": cid_2, "evicted": true });
    }
  }
  return null;
};
var ccall_args = function(rec, args, extras) {
  const extra_1 = squint_core2.js_obj();
  for (let G__2 of squint_core2.iterable(extras)) {
    const vec___3_6 = G__2;
    const k_7 = squint_core2.nth(vec___3_6, 0, null);
    const v_8 = squint_core2.nth(vec___3_6, 1, null);
    if (!(v_8 == null)) {
      extra_1[`${k_7 ?? ""}`] = v_8;
    }
  }
  ;
  return [squint_core2.get(rec, "c-name"), `${squint_core2.get(rec, "ccall-rettype") ?? ""}`, squint_core2.mapv(squint_core2.str, squint_core2.get(rec, "ccall-argtypes")), args, extra_1];
};
var isolate = async function(lib, rec, args, worker_idx, pool_ref) {
  if (squint_core2.truth_(squint_core2.get(squint_core2.get(rec, "fn-def"), "isolate-context?"))) {
    const temp__23241__auto___1 = squint_core2.get(squint_core2.get(lib, "hooks"), "context-isolator");
    if (squint_core2.truth_(temp__23241__auto___1)) {
      const iso_2 = temp__23241__auto___1;
      hrt2.dbg("ISOLATE-FIRE", { "lib": `${squint_core2.get(lib, "key") ?? ""}`, "c-fn": squint_core2.get(rec, "c-name"), "worker": worker_idx });
      return await iso_2({ "fn-key": squint_core2.get(rec, "fn-key"), "fn-def": squint_core2.get(rec, "fn-def"), "args": args, "worker-idx": worker_idx, "library-key": squint_core2.get(lib, "key"), "library": lib, "pool": pool_ref });
    }
    ;
  }
  ;
};
var call_cljs = async function(lib, rec, args, opts) {
  const library_key_1 = squint_core2.get(lib, "key");
  const hooks_2 = squint_core2.get(lib, "hooks");
  const pool_ref_3 = squint_core2.get(opts, "pool");
  const force_idx_4 = squint_core2.get(opts, "force-worker-idx");
  const worker_idx_5 = !(force_idx_4 == null) ? force_idx_4 : worker_idx_from_args(args);
  const ids_6 = ctx_ids(args);
  hrt2.dbg("DISPATCH-RESOLVE", { "lib": `${library_key_1 ?? ""}`, "c-fn": squint_core2.get(rec, "c-name"), "force-idx": force_idx_4, "worker-idx": worker_idx_5, "primary-handle": squint_core2.get(opts, "primary-handle") });
  check_not_evicted_BANG_(library_key_1, ids_6);
  for (let G__7 of squint_core2.iterable(ids_6)) {
    const cid_8 = G__7;
    ref_handle_BANG_(library_key_1, cid_8);
  }
  ;
  try {
    const map___9_11 = await (async () => {
      const temp__23177__auto___12 = squint_core2.get(hooks_2, "extras-builder");
      if (squint_core2.truth_(temp__23177__auto___12)) {
        const b_13 = temp__23177__auto___12;
        return b_13(squint_core2.get(rec, "fn-def"), args);
      } else {
        return { "args": args };
      }
      ;
    })();
    const map___9_14 = squint_core2.truth_(squint_core2.sequential_QMARK_(map___9_11)) ? squint_core2.truth_(squint_core2.vector_QMARK_(map___9_11)) ? map___9_11 : squint_core2.seq_to_map_for_destructuring(map___9_11) : map___9_11;
    const built_15 = squint_core2.get(map___9_14, "args");
    const extras_16 = squint_core2.get(map___9_14, "extras");
    const on_result_17 = squint_core2.get(map___9_14, "on-result");
    const isolated_18 = await isolate(lib, rec, squint_core2.truth_(built_15) ? built_15 : args, worker_idx_5, pool_ref_3);
    const call_args_19 = int64_args__GT_bigint(rec, squint_core2.mapv(convert_arg_cljs, squint_core2.get(isolated_18, "args", squint_core2.truth_(built_15) ? built_15 : args)));
    const raw_20 = await worker_call(pool_ref_3, library_key_1, "ccall", ccall_args(rec, call_args_19, extras_16), worker_idx_5);
    const result_21 = normalize_null_pointer(squint_core2.get(rec, "rettype"), (squint_core2.truth_(on_result_17) ? on_result_17 : squint_core2.identity)(raw_20));
    const temp__23177__auto___22 = squint_core2.get(hooks_2, "result-wrapper");
    if (squint_core2.truth_(temp__23177__auto___22)) {
      const wrap_23 = temp__23177__auto___22;
      return wrap_23({ "rettype": squint_core2.get(rec, "rettype"), "result": result_21, "fn-def": squint_core2.get(rec, "fn-def"), "args": args, "worker-idx": worker_idx_5, "platform": "cljs", "isolator-result": isolated_18 });
    } else {
      return result_21;
    }
    ;
  } catch (e_24) {
    throw hrt2.normalizeWasmError(e_24);
  } finally {
    for (let G__25 of squint_core2.iterable(ids_6)) {
      const cid_26 = G__25;
      unref_handle_BANG_(library_key_1, cid_26);
    }
  }
  ;
};
var call_BANG_ = /* @__PURE__ */ (() => {
  const impl10_1 = (async function(lib, fn_key, args, p__11) {
    const vec___2_5 = p__11;
    const opts_6 = squint_core2.nth(vec___2_5, 0, null);
    const rec_7 = squint_core2.get_in(lib, ["fns", fn_key]);
    if (squint_core2.truth_(rec_7)) {
    } else {
      throw squint_core2.ex_info("Unknown fn-key for library", { "fn-key": fn_key, "library": squint_core2.get(lib, "key") });
    }
    ;
    return await call_cljs(lib, rec_7, args, opts_6);
  });
  const f5 = (function(arg6, arg7, arg8, ...rest9) {
    const self__23348__auto___8 = this;
    return impl10_1.call(self__23348__auto___8, arg6, arg7, arg8, rest9.length === 0 ? null : rest9);
  });
  f5["squint$lang$variadic"] = impl10_1;
  return f5;
})();

// src/cljc/net/willcohen/native/platform_state.mjs
import * as squint_core3 from "squint-cljs/core.js";
var ffi_QMARK_ = function(impl_atom) {
  return "ffi" === squint_core3.deref(impl_atom);
};
var graal_QMARK_ = function(impl_atom) {
  return "graal" === squint_core3.deref(impl_atom);
};
var node_QMARK_ = function(impl_atom) {
  return "node" === squint_core3.deref(impl_atom);
};
var force_graal_BANG_ = function(impl_atom, force_atom) {
  squint_core3.reset_BANG_(force_atom, true);
  return squint_core3.reset_BANG_(impl_atom, null);
};
var force_ffi_BANG_ = function(impl_atom, force_atom) {
  squint_core3.reset_BANG_(force_atom, false);
  return squint_core3.reset_BANG_(impl_atom, null);
};
var toggle_graal_BANG_ = function(impl_atom, force_atom) {
  squint_core3.swap_BANG_(force_atom, squint_core3.not);
  return squint_core3.reset_BANG_(impl_atom, null);
};
var null_ptr_QMARK_ = function(p) {
  if (p == null) {
    return true;
  } else {
    const and_1_2 = squint_core3.number_QMARK_(p);
    if (squint_core3.truth_(and_1_2)) {
      return p === 0;
    } else {
      return and_1_2;
    }
    ;
  }
  ;
};

// src/cljc/net/willcohen/native/macros.mjs
import * as squint_core4 from "squint-cljs/core.js";
import * as string3 from "squint-cljs/src/squint/string.js";
import * as clojure_DOT_string3 from "squint-cljs/src/squint/string.js";
var c_name__GT_clj_name = function(c_fn_keyword) {
  return squint_core4.symbol(string3.replace(squint_core4.name(c_fn_keyword), "_", "-"));
};
var upper_char_QMARK_ = function(ch) {
  if (!squint_core4._EQ_(ch, string3.lower_case(ch))) {
    return squint_core4._EQ_(ch, string3.upper_case(ch));
  } else {
    return false;
  }
  ;
};
var lower_char_QMARK_ = function(ch) {
  if (!squint_core4._EQ_(ch, string3.upper_case(ch))) {
    return squint_core4._EQ_(ch, string3.lower_case(ch));
  } else {
    return false;
  }
  ;
};
var word_start_QMARK_ = function(s, i) {
  const prev_1 = squint_core4.subs(s, i - 1, i);
  const nxt_2 = i + 1 < squint_core4.count(s) ? squint_core4.subs(s, i + 1, i + 2) : null;
  if (squint_core4.not(upper_char_QMARK_(prev_1))) {
    return true;
  } else {
    if (!(nxt_2 == null)) {
      return lower_char_QMARK_(nxt_2);
    } else {
      return false;
    }
  }
  ;
};
var camel_name__GT_clj_name = function(c_fn_keyword) {
  const s_1 = squint_core4.name(c_fn_keyword);
  const n_2 = squint_core4.count(s_1);
  let i_3 = 0;
  let out_4 = "";
  let pending_sep_QMARK__5 = false;
  while (true) {
    if (i_3 >= n_2) {
      return squint_core4.symbol(out_4);
    } else {
      const ch_6 = squint_core4.subs(s_1, i_3, i_3 + 1);
      if (ch_6 === "_") {
        let G__7 = i_3 + 1;
        let G__8 = out_4;
        let G__9 = !squint_core4._EQ_(out_4, "");
        i_3 = G__7;
        out_4 = G__8;
        pending_sep_QMARK__5 = G__9;
        continue;
      } else {
        const sep_QMARK__10 = pending_sep_QMARK__5 ? pending_sep_QMARK__5 : !squint_core4._EQ_(out_4, "") && (() => {
          const and_11_12 = upper_char_QMARK_(ch_6);
          if (squint_core4.truth_(and_11_12)) {
            return word_start_QMARK_(s_1, i_3);
          } else {
            return and_11_12;
          }
          ;
        })();
        let G__13 = i_3 + 1;
        let G__14 = `${out_4 ?? ""}${(squint_core4.truth_(sep_QMARK__10) ? "-" : "") ?? ""}${string3.lower_case(ch_6) ?? ""}`;
        let G__15 = false;
        i_3 = G__13;
        out_4 = G__14;
        pending_sep_QMARK__5 = G__15;
        continue;
      }
      ;
    }
    ;
    ;
    break;
  }
  ;
};
var fn_def_arg_syms = function(fn_def) {
  return squint_core4.mapv((function(p__1) {
    const vec___1_4 = p__1;
    const arg_name_5 = squint_core4.nth(vec___1_4, 0, null);
    const __6 = squint_core4.nth(vec___1_4, 1, null);
    return squint_core4.symbol(squint_core4.name(arg_name_5));
  }), squint_core4.get(fn_def, "argtypes"));
};
var library_fns_form = function(fndefs, p__2) {
  const map___1_3 = p__2;
  const map___1_4 = squint_core4.truth_(squint_core4.sequential_QMARK_(map___1_3)) ? squint_core4.truth_(squint_core4.vector_QMARK_(map___1_3)) ? map___1_3 : squint_core4.seq_to_map_for_destructuring(map___1_3) : map___1_3;
  const name_fn_5 = squint_core4.get(map___1_4, "name-fn");
  const emit_fn_6 = squint_core4.get(map___1_4, "emit-fn");
  const alias_name_fn_7 = squint_core4.get(map___1_4, "alias-name-fn");
  const alias_emit_fn_8 = squint_core4.get(map___1_4, "alias-emit-fn");
  const walk_9 = (function(nf, ef) {
    if (squint_core4.truth_(squint_core4.truth_(nf) ? ef : nf)) {
      return squint_core4.keep((function(p__3) {
        const vec___10_13 = p__3;
        const fn_key_14 = squint_core4.nth(vec___10_13, 0, null);
        const fn_def_15 = squint_core4.nth(vec___10_13, 1, null);
        const temp__23241__auto___16 = nf(fn_key_14);
        if (squint_core4.truth_(temp__23241__auto___16)) {
          const fn_name_17 = temp__23241__auto___16;
          return ef(fn_name_17, fn_key_14, fn_def_15);
        }
        ;
      }), fndefs);
    }
    ;
  });
  return squint_core4.cons("do", squint_core4.concat(walk_9(name_fn_5, emit_fn_6), walk_9(alias_name_fn_7, alias_emit_fn_8)));
};
var underscore__GT_camelCase = function(s) {
  const parts_1 = s.split("_");
  return squint_core4.apply(squint_core4.str, squint_core4.first(parts_1), squint_core4.map((function(_PERCENT_1) {
    return `${_PERCENT_1.substring(0, 1).toUpperCase() ?? ""}${_PERCENT_1.substring(1) ?? ""}`;
  }), squint_core4.rest(parts_1)));
};

// src/cljc/net/willcohen/native/workload_pool.mjs
import * as squint_core5 from "squint-cljs/core.js";
var init_workload_pool_BANG_ = function(opts) {
  return { "pool": squint_core5.atom(null), "owned?": squint_core5.atom(false), "promise": squint_core5.atom(null), "stopping": squint_core5.atom(null), "handlers": squint_core5.atom([]), "opts": opts, "terminated?": squint_core5.atom(false) };
};
var replace_or_append_handler = function(entries, entry) {
  const k_1 = squint_core5.get(entry, "lib-key");
  if (squint_core5.truth_(squint_core5.some((function(e) {
    return squint_core5._EQ_(squint_core5.get(e, "lib-key"), k_1);
  }), entries))) {
    return squint_core5.mapv((function(e) {
      if (squint_core5._EQ_(squint_core5.get(e, "lib-key"), k_1)) {
        return entry;
      } else {
        return e;
      }
      ;
    }), entries);
  } else {
    return squint_core5.conj(squint_core5.vec(entries), entry);
  }
  ;
};
var register_handler_BANG_ = function(registry, workload, lib_key, spec) {
  const entry_1 = squint_core5.assoc(spec, "lib-key", lib_key);
  if (squint_core5.truth_((() => {
    const or_2_3 = squint_core5.get(entry_1, "module");
    if (squint_core5.truth_(or_2_3)) {
      return or_2_3;
    } else {
      return squint_core5.get(entry_1, "pre-terminate");
    }
    ;
  })())) {
  } else {
    throw squint_core5.ex_info(`${"workload-pool: a CLJS handler spec needs "}${":module or :pre-terminate (lib-key "}${lib_key ?? ""}${")"}`, { "lib-key": lib_key });
  }
  ;
  if (squint_core5.truth_((() => {
    const and_4_5 = squint_core5.get(entry_1, "module");
    if (squint_core5.truth_(and_4_5)) {
      return !(squint_core5.deref(squint_core5.get(registry, "promise")) == null);
    } else {
      return and_4_5;
    }
    ;
  })())) {
    throw squint_core5.ex_info(`${"workload-pool: the pool already "}${"exists; a spec with a :module must register "}${"before ensure-pool!/adopt-pool! (lib-key "}${lib_key ?? ""}${")"}`, { "lib-key": lib_key });
  }
  ;
  squint_core5.swap_BANG_(squint_core5.get(registry, "handlers"), replace_or_append_handler, entry_1);
  return registry;
};
var spawn_pool_BANG_ = async function(registry) {
  const entries_1 = squint_core5.deref(squint_core5.get(registry, "handlers"));
  const module_specs_2 = squint_core5.filterv((function(e) {
    return !(squint_core5.get(e, "module") == null);
  }), entries_1);
  if (squint_core5.count(module_specs_2) === 0) {
    throw squint_core5.ex_info(`${"workload-pool: no registered handler spec "}${"carries a :module; register-handler! before "}${"ensure-pool!"}`, { "registered": squint_core5.mapv("lib-key", entries_1) });
  }
  ;
  const handlers_3 = squint_core5.reduce((function(m, e) {
    return squint_core5.assoc(m, squint_core5.get(e, "lib-key"), { "module": squint_core5.get(e, "module"), "init": squint_core5.get(e, "args") });
  }), {}, module_specs_2);
  const opts_4 = squint_core5.get(registry, "opts");
  const p_5 = await init_pool_BANG_({ "handlers": handlers_3, "size": squint_core5.get(opts_4, "size"), "handler-runtime": squint_core5.get(opts_4, "handler-runtime") });
  squint_core5.reset_BANG_(squint_core5.get(registry, "pool"), p_5);
  squint_core5.reset_BANG_(squint_core5.get(registry, "owned?"), true);
  return p_5;
};
var ensure_pool_BANG_ = function(registry) {
  const temp__23177__auto___1 = squint_core5.deref(squint_core5.get(registry, "stopping"));
  if (squint_core5.truth_(temp__23177__auto___1)) {
    const stopping_2 = temp__23177__auto___1;
    return stopping_2.then((function(_) {
      return ensure_pool_BANG_(registry);
    }));
  } else {
    const or_3_4 = squint_core5.deref(squint_core5.get(registry, "promise"));
    if (squint_core5.truth_(or_3_4)) {
      return or_3_4;
    } else {
      const promise_5 = spawn_pool_BANG_(registry).catch((function(err) {
        squint_core5.reset_BANG_(squint_core5.get(registry, "promise"), null);
        throw err;
      }));
      squint_core5.reset_BANG_(squint_core5.get(registry, "terminated?"), false);
      squint_core5.reset_BANG_(squint_core5.get(registry, "promise"), promise_5);
      return promise_5;
    }
    ;
  }
  ;
};
var adopt_pool_BANG_ = function(registry, p) {
  if (!(squint_core5.deref(squint_core5.get(registry, "promise")) == null)) {
    throw squint_core5.ex_info(`${"workload-pool: a pool is already present or "}${"initializing; shutdown-pool! before "}${"adopt-pool!"}`, { "owned?": squint_core5.deref(squint_core5.get(registry, "owned?")) });
  }
  ;
  squint_core5.reset_BANG_(squint_core5.get(registry, "pool"), p);
  squint_core5.reset_BANG_(squint_core5.get(registry, "owned?"), false);
  squint_core5.reset_BANG_(squint_core5.get(registry, "terminated?"), false);
  squint_core5.reset_BANG_(squint_core5.get(registry, "promise"), Promise.resolve(p));
  return registry;
};
var current_pool = function(registry) {
  return squint_core5.deref(squint_core5.get(registry, "pool"));
};
var run_pre_terminate_hooks_BANG_ = async function(entries) {
  for (let G__1 of squint_core5.iterable(entries)) {
    const entry_2 = G__1;
    const hook_3 = squint_core5.get(entry_2, "pre-terminate");
    if (squint_core5.truth_(hook_3)) {
      try {
        await hook_3();
      } catch (e_4) {
        console.warn("workload-pool: pre-terminate failed for", `${squint_core5.get(entry_2, "lib-key") ?? ""}`, e_4);
      }
    }
  }
  return null;
};
var stop_pool_BANG_ = async function(registry) {
  const promise_1 = squint_core5.deref(squint_core5.get(registry, "promise"));
  const __2 = await Promise.allSettled([promise_1]);
  const p_3 = squint_core5.deref(squint_core5.get(registry, "pool"));
  const owned_QMARK__4 = squint_core5.deref(squint_core5.get(registry, "owned?"));
  const entries_5 = squint_core5.vec(squint_core5.reverse(squint_core5.deref(squint_core5.get(registry, "handlers"))));
  await run_pre_terminate_hooks_BANG_(entries_5);
  if (squint_core5.truth_(!(p_3 == null) && owned_QMARK__4)) {
    try {
      await p_3.terminate();
    } catch (e_6) {
      console.warn("workload-pool: pool terminate rejected", e_6);
    }
  }
  ;
  if (squint_core5.truth_(squint_core5.compare_and_set_BANG_(squint_core5.get(registry, "promise"), promise_1, null))) {
    squint_core5.reset_BANG_(squint_core5.get(registry, "pool"), null);
    squint_core5.reset_BANG_(squint_core5.get(registry, "owned?"), false);
  }
  ;
  squint_core5.reset_BANG_(squint_core5.get(registry, "stopping"), null);
  return registry;
};
var shutdown_pool_BANG_ = function(registry) {
  const or_1_2 = squint_core5.deref(squint_core5.get(registry, "stopping"));
  if (squint_core5.truth_(or_1_2)) {
    return or_1_2;
  } else {
    if (squint_core5.truth_(squint_core5.deref(squint_core5.get(registry, "terminated?")))) {
      return Promise.resolve(null);
    } else {
      squint_core5.reset_BANG_(squint_core5.get(registry, "terminated?"), true);
      const promise_3 = stop_pool_BANG_(registry);
      squint_core5.reset_BANG_(squint_core5.get(registry, "stopping"), promise_3);
      return promise_3;
    }
  }
  ;
};
var make_wiring_BANG_ = function() {
  return { "registry": squint_core5.atom(null), "promise": squint_core5.atom(null), "stopping": squint_core5.atom(null) };
};
var run_wiring_BANG_ = async function(wiring, opts) {
  const reg_1 = init_workload_pool_BANG_(squint_core5.get(opts, "registry-opts", {}));
  const register_BANG__2 = squint_core5.get(opts, "register!");
  const caller_pool_3 = squint_core5.get(opts, "pool");
  squint_core5.reset_BANG_(squint_core5.get(wiring, "registry"), reg_1);
  if (squint_core5.truth_(register_BANG__2)) {
    await register_BANG__2(reg_1);
  }
  ;
  if (!(caller_pool_3 == null)) {
    adopt_pool_BANG_(reg_1, caller_pool_3);
    return caller_pool_3;
  } else {
    return await ensure_pool_BANG_(reg_1);
  }
  ;
};
var ensure_wired_BANG_ = function(wiring, opts) {
  const temp__23177__auto___1 = squint_core5.deref(squint_core5.get(wiring, "stopping"));
  if (squint_core5.truth_(temp__23177__auto___1)) {
    const stopping_2 = temp__23177__auto___1;
    return stopping_2.then((function(_) {
      return ensure_wired_BANG_(wiring, opts);
    }));
  } else {
    const or_3_4 = squint_core5.deref(squint_core5.get(wiring, "promise"));
    if (squint_core5.truth_(or_3_4)) {
      return or_3_4;
    } else {
      const promise_5 = run_wiring_BANG_(wiring, opts).catch((function(err) {
        squint_core5.reset_BANG_(squint_core5.get(wiring, "registry"), null);
        squint_core5.reset_BANG_(squint_core5.get(wiring, "promise"), null);
        throw err;
      }));
      squint_core5.reset_BANG_(squint_core5.get(wiring, "promise"), promise_5);
      return promise_5;
    }
    ;
  }
  ;
};
var wiring_pool = function(wiring) {
  const temp__23177__auto___1 = squint_core5.deref(squint_core5.get(wiring, "registry"));
  if (squint_core5.truth_(temp__23177__auto___1)) {
    const reg_2 = temp__23177__auto___1;
    return current_pool(reg_2);
  } else {
    return null;
  }
  ;
};
var live_pool_QMARK_ = function(wiring, p) {
  if (!(p == null)) {
    return p === wiring_pool(wiring);
  } else {
    return false;
  }
  ;
};
var stop_wiring_BANG_ = async function(wiring) {
  await Promise.allSettled([squint_core5.deref(squint_core5.get(wiring, "promise"))]);
  const reg_1 = squint_core5.deref(squint_core5.get(wiring, "registry"));
  if (!(reg_1 == null)) {
    await shutdown_pool_BANG_(reg_1);
    squint_core5.reset_BANG_(squint_core5.get(wiring, "registry"), null);
    squint_core5.reset_BANG_(squint_core5.get(wiring, "promise"), null);
  }
  ;
  squint_core5.reset_BANG_(squint_core5.get(wiring, "stopping"), null);
  return reg_1;
};
var shutdown_wiring_BANG_ = function(wiring) {
  const or_1_2 = squint_core5.deref(squint_core5.get(wiring, "stopping"));
  if (squint_core5.truth_(or_1_2)) {
    return or_1_2;
  } else {
    const promise_3 = stop_wiring_BANG_(wiring);
    squint_core5.reset_BANG_(squint_core5.get(wiring, "stopping"), promise_3);
    return promise_3;
  }
  ;
};

// src/cljc/net/willcohen/native/ffi_wasm.mjs
export * from "./handler_runtime.mjs";
export * from "./handler_env.mjs";
export * from "./handler_fs.mjs";
export * from "./handler_heap.mjs";
export * from "./handler_paths.mjs";
export * from "./http_bridge.mjs";
export {
  adopt_pool_BANG_,
  argtype__GT_ccall_type,
  assign_worker_for_context_BANG_,
  await_parent_drain_BANG_,
  bounded_create_handle_BANG_,
  c_name__GT_clj_name,
  call_BANG_,
  camel_name__GT_clj_name,
  check_result,
  claim,
  current_pool,
  dispose_handle_BANG_,
  ensure_pool_BANG_,
  ensure_wired_BANG_,
  evict_oldest_BANG_,
  evicted_QMARK_,
  ffi_QMARK_,
  fire_and_capture_dispose_BANG_,
  flush_pending_disposes_BANG_,
  fn_def_arg_syms,
  force_ffi_BANG_,
  force_graal_BANG_,
  get_pool_detail,
  get_pool_stats,
  graal_QMARK_,
  in_flight_count_for_parent,
  init_pool_BANG_,
  init_workload_pool_BANG_,
  library,
  library_fns_form,
  live_pool_QMARK_,
  make_wiring_BANG_,
  node_QMARK_,
  normalize_null_pointer,
  null_ptr_QMARK_,
  pool_size,
  ref_handle_BANG_,
  register_handle_BANG_,
  register_handler_BANG_,
  register_library_context_BANG_,
  reset_library_context_BANG_,
  set_log_config_BANG_,
  shutdown_pool_BANG_,
  shutdown_wiring_BANG_,
  supported_types,
  toggle_graal_BANG_,
  track_context_BANG_,
  underscore__GT_camelCase,
  unref_handle_BANG_,
  untrack_context_BANG_,
  wiring_pool,
  worker_call,
  worker_idx_from_args
};
