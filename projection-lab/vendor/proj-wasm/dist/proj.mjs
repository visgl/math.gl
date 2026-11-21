var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// proj.mjs
import * as squint_core5 from "squint-cljs/core.js";
import * as string from "squint-cljs/src/squint/string.js";
import * as clojure_DOT_string from "squint-cljs/src/squint/string.js";
import * as nps from "ffi-wasm";
import * as pool3 from "ffi-wasm";
import * as dispatch2 from "ffi-wasm";
import { underscore__GT_camelCase as underscore__GT_camelCase2 } from "ffi-wasm";

// wasm.mjs
import * as squint_core2 from "squint-cljs/core.js";
import * as pool2 from "ffi-wasm";
import * as wp from "ffi-wasm";
import * as dispatch from "ffi-wasm";

// handler.mjs
import * as squint_core from "squint-cljs/core.js";

// proj-loader.mjs
async function loadProjResources() {
  const urls = ["proj.db", "proj.ini"].map((name2) => new URL(name2, import.meta.url));
  let bytes;
  if (typeof process !== "undefined" && process.versions?.node != null) {
    const fs = await import("fs");
    bytes = urls.map((url) => fs.readFileSync(url));
  } else {
    const resps = await Promise.all(urls.map((url) => fetch(url)));
    resps.forEach((resp, i) => {
      if (!resp.ok) {
        throw new Error(`proj-loader: fetch of ${urls[i].href} failed: HTTP ${resp.status}`);
      }
    });
    bytes = await Promise.all(resps.map(async (resp) => new Uint8Array(await resp.arrayBuffer())));
  }
  return { projDb: bytes[0], projIni: bytes[1] };
}
__name(loadProjResources, "loadProjResources");

// handler.mjs
import * as pool from "ffi-wasm";
var default_init_args = /* @__PURE__ */ __name(async function(opts) {
  const resources_1 = await loadProjResources();
  return squint_core.js_obj("dbBytes", resources_1.projDb, "iniBytes", resources_1.projIni, "logLevel", await (async () => {
    const or_2_3 = squint_core.get(opts, "log-level");
    if (squint_core.truth_(or_2_3)) {
      return or_2_3;
    } else {
      return 0;
    }
    ;
  })());
}, "default_init_args");
var pre_terminate_BANG_ = /* @__PURE__ */ __name(async function() {
  await pool.flush_pending_disposes_BANG_();
  pool.reset_library_context_BANG_("net.willcohen.proj");
  return null;
}, "pre_terminate_BANG_");
var spec = /* @__PURE__ */ (() => {
  let f1_1 = null;
  const impl4_2 = /* @__PURE__ */ __name(function() {
    return spec(null);
  }, "impl4_2");
  const impl5_3 = /* @__PURE__ */ __name(function(args) {
    return { "module": new URL("./proj-handler.mjs", import.meta.url).href, "args": args, "pre-terminate": pre_terminate_BANG_ };
  }, "impl5_3");
  f1_1 = /* @__PURE__ */ __name(function(...args2) {
    const self6_4 = this;
    const G__7_5 = args2.length;
    switch (G__7_5) {
      case 0:
        return impl4_2.call(self6_4);
        break;
      case 1:
        return impl5_3.call(self6_4, args2[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args2.length ?? ""}`);
    }
    ;
  }, "f1_1");
  return f1_1;
})();

// wasm.mjs
var p = squint_core2.atom(null);
var pool_wiring = wp.make_wiring_BANG_();
var pj_gen_counter = squint_core2.atom(0);
var current_pool = /* @__PURE__ */ __name(function() {
  return wp.wiring_pool(pool_wiring);
}, "current_pool");
pool2.register_library_context_BANG_("net.willcohen.proj", { "max-live-ctxs": 128, "min-age-ms": 100 });
var init_workers_BANG_ = /* @__PURE__ */ __name(async function(opts) {
  return await await (async () => {
    const map___1_3 = opts;
    const map___1_4 = squint_core2.truth_(squint_core2.sequential_QMARK_(map___1_3)) ? squint_core2.truth_(squint_core2.vector_QMARK_(map___1_3)) ? map___1_3 : squint_core2.seq_to_map_for_destructuring(map___1_3) : map___1_3;
    const caller_pool_5 = squint_core2.get(map___1_4, "pool");
    const workers_6 = squint_core2.get(map___1_4, "workers");
    const max_live_ctxs_7 = squint_core2.get(map___1_4, "max-live-ctxs");
    const min_age_ms_8 = squint_core2.get(map___1_4, "min-age-ms");
    const debug_level_9 = squint_core2.get(map___1_4, "debug-level");
    const debug_categories_10 = squint_core2.get(map___1_4, "debug-categories");
    const handler_rt_opt_11 = !(debug_level_9 == null) ? { "level": debug_level_9, "categories": debug_categories_10 } : null;
    const register_BANG__12 = /* @__PURE__ */ __name(async function register_proj_BANG_(reg) {
      if (squint_core2.truth_(handler_rt_opt_11)) {
        pool2.set_log_config_BANG_(handler_rt_opt_11);
      }
      ;
      pool2.register_library_context_BANG_("net.willcohen.proj", { "max-live-ctxs": max_live_ctxs_7, "min-age-ms": min_age_ms_8 });
      if (!(caller_pool_5 == null)) {
        return wp.register_handler_BANG_(reg, "compute", "net.willcohen.proj", { "pre-terminate": pre_terminate_BANG_ });
      } else {
        const init_args_13 = await default_init_args(opts);
        if (squint_core2.truth_(handler_rt_opt_11)) {
          init_args_13["handlerRuntime"] = squint_core2.js_obj("logLevel", debug_level_9, "logCategories", squint_core2.clj__GT_js(debug_categories_10));
        }
        ;
        return wp.register_handler_BANG_(reg, "compute", "net.willcohen.proj", spec(init_args_13));
      }
      ;
    }, "register_proj_BANG_");
    return wp.ensure_wired_BANG_(pool_wiring, !(caller_pool_5 == null) ? { "pool": caller_pool_5, "register!": register_BANG__12 } : { "registry-opts": await (async () => {
      const G__1_14 = { "size": squint_core2.truth_(workers_6) ? workers_6 : "auto" };
      if (squint_core2.truth_(handler_rt_opt_11)) {
        return { ...G__1_14, ["handler-runtime"]: handler_rt_opt_11 };
      } else {
        return G__1_14;
      }
      ;
    })(), "register!": register_BANG__12 });
  })();
}, "init_workers_BANG_");
var worker_call2 = /* @__PURE__ */ __name(async function(worker_idx, method, args) {
  return await pool2.worker_call(current_pool(), "net.willcohen.proj", method, args, worker_idx);
}, "worker_call");
var ctx_key = /* @__PURE__ */ __name(function(worker_idx, ctx_id) {
  return `${worker_idx ?? ""}${":"}${ctx_id ?? ""}`;
}, "ctx_key");
var DESTROY_GATE_MAX_ITERS = 16;
var destroy_context_BANG_ = /* @__PURE__ */ __name(async function(p3, worker_idx, ctx_id) {
  const parent_key_1 = ctx_key(worker_idx, ctx_id);
  let iters_2 = 0;
  while (true) {
    const remaining_3 = pool2.in_flight_count_for_parent(parent_key_1);
    if (remaining_3 > 0 && iters_2 < DESTROY_GATE_MAX_ITERS) {
      await pool2.await_parent_drain_BANG_(parent_key_1);
      let G__4 = iters_2 + 1;
      iters_2 = G__4;
      continue;
    }
    ;
    break;
  }
  ;
  return await pool2.worker_call(p3, "net.willcohen.proj", "context_destroy", [ctx_id], worker_idx);
}, "destroy_context_BANG_");
var live_pool_QMARK_2 = /* @__PURE__ */ __name(function(p3) {
  return wp.live_pool_QMARK_(pool_wiring, p3);
}, "live_pool_QMARK_");
var ignore_pool_terminated = /* @__PURE__ */ __name(function(err) {
  if (squint_core2.truth_(`${(squint_core2.truth_(err) ? err.message : err) ?? ""}`.includes("pool terminated"))) {
    return null;
  } else {
    throw err;
  }
  ;
}, "ignore_pool_terminated");
var get_worker_count = /* @__PURE__ */ __name(function() {
  const temp__23241__auto___1 = current_pool();
  if (squint_core2.truth_(temp__23241__auto___1)) {
    const p_2 = temp__23241__auto___1;
    return pool2.pool_size(p_2);
  }
  ;
}, "get_worker_count");
var shutdown_BANG_ = /* @__PURE__ */ __name(async function() {
  if (squint_core2.truth_(await wp.shutdown_wiring_BANG_(pool_wiring))) {
  } else {
    await pool2.flush_pending_disposes_BANG_();
  }
  ;
  return null;
}, "shutdown_BANG_");
var create_context_on_worker = /* @__PURE__ */ __name(function(opts) {
  const map___1_3 = pool2.assign_worker_for_context_BANG_(current_pool(), "net.willcohen.proj", opts);
  const map___1_4 = squint_core2.truth_(squint_core2.sequential_QMARK_(map___1_3)) ? squint_core2.truth_(squint_core2.vector_QMARK_(map___1_3)) ? map___1_3 : squint_core2.seq_to_map_for_destructuring(map___1_3) : map___1_3;
  const idx_5 = squint_core2.get(map___1_4, "idx");
  const release_6 = squint_core2.get(map___1_4, "release");
  return worker_call2(idx_5, "context_create", [{}]).then(function(result) {
    return { "ctx-id": result.ctxId, "ptr": result.ptr, "worker-idx": idx_5, "release": release_6 };
  }).catch(function(err) {
    release_6();
    throw err;
  });
}, "create_context_on_worker");
var track_context_BANG_2 = /* @__PURE__ */ __name(function(ctx_id, worker_idx, release_fn, owner) {
  return pool2.track_context_BANG_("net.willcohen.proj", ctx_key(worker_idx, ctx_id), worker_idx, release_fn, owner);
}, "track_context_BANG_");
var untrack_context_BANG_2 = /* @__PURE__ */ __name(function(worker_idx, ctx_id) {
  return pool2.untrack_context_BANG_("net.willcohen.proj", ctx_key(worker_idx, ctx_id));
}, "untrack_context_BANG_");
var init_proj = /* @__PURE__ */ (() => {
  let f2_1 = null;
  const impl5_2 = /* @__PURE__ */ __name(function() {
    return init_proj({});
  }, "impl5_2");
  const impl6_3 = /* @__PURE__ */ __name(function(opts) {
    return init_workers_BANG_(opts).catch(function(error) {
      console.error("PROJ worker init failed:", error);
      throw error;
    });
  }, "impl6_3");
  f2_1 = /* @__PURE__ */ __name(function(...args3) {
    const self7_4 = this;
    const G__8_5 = args3.length;
    switch (G__8_5) {
      case 0:
        return impl5_2.call(self7_4);
        break;
      case 1:
        return impl6_3.call(self7_4, args3[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args3.length ?? ""}`);
    }
    ;
  }, "f2_1");
  return f2_1;
})();
var ensure_proj_initialized_BANG_ = /* @__PURE__ */ __name(function() {
  if (current_pool() == null) {
    return init_proj();
  }
  ;
}, "ensure_proj_initialized_BANG_");
var kebab__GT_snake = /* @__PURE__ */ __name(function(x) {
  return `${x ?? ""}`.replace(new RegExp("-", "g"), "_");
}, "kebab__GT_snake");
var struct_list_extras = /* @__PURE__ */ __name(function(fn_def) {
  return { "structFields": squint_core2.mapv(function(p__9) {
    const vec___1_4 = p__9;
    const kw_5 = squint_core2.nth(vec___1_4, 0, null);
    const ftype_6 = squint_core2.nth(vec___1_4, 1, null);
    const wasm_offset_7 = squint_core2.nth(vec___1_4, 2, null);
    return { "key": kebab__GT_snake(kw_5), "type": `${ftype_6 ?? ""}`, "offset": wasm_offset_7 };
  }, squint_core2.get(fn_def, "struct-fields")), "structDestroyFn": squint_core2.get(fn_def, "struct-destroy-fn"), "structParamsCreate": squint_core2.get(fn_def, "struct-params-create"), "structParamsDestroy": squint_core2.get(fn_def, "struct-params-destroy") };
}, "struct_list_extras");
var out_params_extras = /* @__PURE__ */ __name(function(fn_def) {
  const arg_names_1 = squint_core2.mapv(function(_PERCENT_1) {
    return `${squint_core2.first(_PERCENT_1) ?? ""}`;
  }, squint_core2.get(fn_def, "argtypes"));
  const out_idxs_2 = squint_core2.vec(squint_core2.keep_indexed(function(i, arg_name) {
    if (squint_core2.truth_(arg_name.startsWith("out_"))) {
      return i;
    }
    ;
  }, arg_names_1));
  return { "outFields": squint_core2.vec(squint_core2.map_indexed(function(i, p__10) {
    const vec___3_6 = p__10;
    const field_name_7 = squint_core2.nth(vec___3_6, 0, null);
    const field_type_8 = squint_core2.nth(vec___3_6, 1, null);
    const __9 = squint_core2.nth(vec___3_6, 2, null);
    const count_arg_10 = squint_core2.nth(vec___3_6, 3, null);
    const G__11_11 = { "key": kebab__GT_snake(field_name_7), "type": `${field_type_8 ?? ""}`, "argIdx": squint_core2.nth(out_idxs_2, i) };
    if (field_type_8 === "double-array") {
      return { ...G__11_11, ["countArgIdx"]: arg_names_1.indexOf(`${count_arg_10 ?? ""}`) };
    } else {
      return G__11_11;
    }
    ;
  }, squint_core2.get(fn_def, "out-fields"))) };
}, "out_params_extras");
var errno_checked_QMARK_ = /* @__PURE__ */ __name(function(fn_def) {
  if (squint_core2.not(squint_core2.false_QMARK_(squint_core2.get(fn_def, "is-context-fn")))) {
    const and_1_2 = squint_core2.contains_QMARK_(/* @__PURE__ */ new Set(["ctx", "context"]), squint_core2.ffirst(squint_core2.get(fn_def, "argtypes")));
    if (squint_core2.truth_(and_1_2)) {
      return squint_core2.contains_QMARK_(/* @__PURE__ */ new Set(["pointer", "string"]), squint_core2.get(fn_def, "rettype"));
    } else {
      return and_1_2;
    }
    ;
  } else {
    return false;
  }
  ;
}, "errno_checked_QMARK_");
var call_errnos = /* @__PURE__ */ new WeakMap();
var take_call_errno_BANG_ = /* @__PURE__ */ __name(function(args) {
  const temp__23241__auto___1 = call_errnos.get(args);
  if (squint_core2.truth_(temp__23241__auto___1)) {
    const errno_2 = temp__23241__auto___1;
    call_errnos.delete(args);
    return errno_2;
  }
  ;
}, "take_call_errno_BANG_");
var worker_result_fn = /* @__PURE__ */ __name(function(coord_arrays, args) {
  return function(result) {
    const n12_1 = squint_core2.count(coord_arrays);
    let i_2 = 0;
    for (; i_2 < n12_1; i_2++) {
      squint_core2.nth(args, squint_core2.get(squint_core2.nth(coord_arrays, i_2), "argIdx")).buffer.set(result.coordData[i_2]);
    }
    ;
    const errno_3 = result.errno;
    if (squint_core2.truth_((() => {
      const and_4_5 = squint_core2.number_QMARK_(errno_3);
      if (squint_core2.truth_(and_4_5)) {
        return !(errno_3 === 0);
      } else {
        return and_4_5;
      }
      ;
    })())) {
      call_errnos.set(args, errno_3);
    }
    ;
    return result.result;
  };
}, "worker_result_fn");
var proj_extras_builder = /* @__PURE__ */ __name(function(fn_def, args) {
  const proj_returns_1 = squint_core2.get(fn_def, "proj-returns");
  const coord_arrays_2 = squint_core2.into([], squint_core2.keep_indexed(function(idx, arg) {
    if (squint_core2.truth_((() => {
      const and_3_4 = squint_core2.object_QMARK_(arg);
      if (squint_core2.truth_(and_3_4)) {
        return arg.type === "coord-array";
      } else {
        return and_3_4;
      }
      ;
    })())) {
      const data_5 = arg.buffer;
      const n_6 = arg.floatsNeeded;
      return { "argIdx": idx, "data": squint_core2._EQ_(data_5.length, n_6) ? data_5 : data_5.slice(0, n_6), "numFloats": n_6 };
    }
    ;
  }, args));
  const string_names_7 = squint_core2.into(/* @__PURE__ */ new Set([]), squint_core2.keep(function(p__13) {
    const vec___8_11 = p__13;
    const arg_name_12 = squint_core2.nth(vec___8_11, 0, null);
    const semantic_type_13 = squint_core2.nth(vec___8_11, 1, null);
    if ("string-array?" === semantic_type_13) {
      return arg_name_12;
    }
    ;
  }), squint_core2.get(fn_def, "argsemantics"));
  const string_ix_14 = squint_core2.into(/* @__PURE__ */ new Set([]), squint_core2.keep_indexed(function(i, p__14) {
    const vec___15_18 = p__14;
    const arg_name_19 = squint_core2.nth(vec___15_18, 0, null);
    if (squint_core2.truth_(squint_core2.contains_QMARK_(string_names_7, arg_name_19))) {
      return i;
    }
    ;
  }, squint_core2.get(fn_def, "argtypes")));
  const string_arrays_20 = squint_core2.into([], squint_core2.keep_indexed(function(idx, arg) {
    if (squint_core2.truth_((() => {
      const and_21_22 = squint_core2.contains_QMARK_(string_ix_14, idx);
      if (squint_core2.truth_(and_21_22)) {
        return squint_core2.array_QMARK_(arg);
      } else {
        return and_21_22;
      }
      ;
    })())) {
      return { "argIdx": idx, "strings": arg };
    }
    ;
  }), args);
  const moved_23 = squint_core2.into(/* @__PURE__ */ new Set([]), squint_core2.map("argIdx"), squint_core2.concat(coord_arrays_2, string_arrays_20));
  const errno_QMARK__24 = errno_checked_QMARK_(fn_def);
  const extras_25 = (() => {
    const G__15_26 = {};
    const G__15_27 = squint_core2.truth_(proj_returns_1) ? { ...G__15_26, ["projReturns"]: `${proj_returns_1 ?? ""}` } : G__15_26;
    const G__15_28 = proj_returns_1 === "struct-list" ? squint_core2.merge(G__15_27, struct_list_extras(fn_def)) : G__15_27;
    const G__15_29 = proj_returns_1 === "out-params" ? squint_core2.merge(G__15_28, out_params_extras(fn_def)) : G__15_28;
    const G__15_30 = squint_core2.truth_(squint_core2.seq(coord_arrays_2)) ? squint_core2.assoc(G__15_29, "coordArrays", coord_arrays_2) : G__15_29;
    const G__15_31 = squint_core2.truth_(squint_core2.seq(string_arrays_20)) ? squint_core2.assoc(G__15_30, "stringArrays", string_arrays_20) : G__15_30;
    if (squint_core2.truth_(errno_QMARK__24)) {
      return squint_core2.assoc(G__15_31, "errnoCheck", true);
    } else {
      return G__15_31;
    }
    ;
  })();
  return { "args": squint_core2.truth_(squint_core2.seq(moved_23)) ? squint_core2.into([], squint_core2.map_indexed(function(idx, arg) {
    if (squint_core2.truth_(squint_core2.contains_QMARK_(moved_23, idx))) {
      return 0;
    } else {
      return arg;
    }
    ;
  }, args)) : args, "extras": extras_25, "on-result": squint_core2.truth_((() => {
    const or_32_33 = squint_core2.seq(coord_arrays_2);
    if (squint_core2.truth_(or_32_33)) {
      return or_32_33;
    } else {
      return errno_QMARK__24;
    }
    ;
  })()) ? worker_result_fn(coord_arrays_2, args) : null };
}, "proj_extras_builder");
var unowned_clones = /* @__PURE__ */ new WeakMap();
var clone_release_fn = /* @__PURE__ */ __name(function(library2, call_pool, worker_idx, clone_ptr) {
  return function() {
    return pool2.fire_and_capture_dispose_BANG_(function() {
      return dispatch.call_BANG_(library2, "proj_context_destroy", [{ "worker_idx": worker_idx, "ptr": clone_ptr }], { "pool": call_pool, "force-worker-idx": worker_idx }).catch(ignore_pool_terminated);
    }, { "lib": "net.willcohen.proj", "kind": "ctx-clone", "worker": worker_idx });
  };
}, "clone_release_fn");
var release_unowned_clone_BANG_ = /* @__PURE__ */ __name(function(args) {
  const temp__23241__auto___1 = unowned_clones.get(args);
  if (squint_core2.truth_(temp__23241__auto___1)) {
    const release_2 = temp__23241__auto___1;
    unowned_clones.delete(args);
    return release_2();
  }
  ;
}, "release_unowned_clone_BANG_");
var proj_result_wrapper = /* @__PURE__ */ __name(function(p__16) {
  const map___1_3 = p__16;
  const map___1_4 = squint_core2.truth_(squint_core2.sequential_QMARK_(map___1_3)) ? squint_core2.truth_(squint_core2.vector_QMARK_(map___1_3)) ? map___1_3 : squint_core2.seq_to_map_for_destructuring(map___1_3) : map___1_3;
  const result_5 = squint_core2.get(map___1_4, "result");
  const fn_def_6 = squint_core2.get(map___1_4, "fn-def");
  const worker_idx_7 = squint_core2.get(map___1_4, "worker-idx");
  const args_8 = squint_core2.get(map___1_4, "args");
  const isolator_result_9 = squint_core2.get(map___1_4, "isolator-result");
  const proj_returns_10 = squint_core2.get(fn_def_6, "proj-returns");
  const wrapped_11 = result_5 == null || result_5 === 0 ? result_5 : proj_returns_10 === "pj" ? (() => {
    const first_arg_12 = squint_core2.first(args_8);
    const parent_ctx_id_13 = squint_core2.truth_((() => {
      const and_14_15 = squint_core2.object_QMARK_(first_arg_12);
      if (squint_core2.truth_(and_14_15)) {
        if (!(first_arg_12.ctx_id == null)) {
          return squint_core2.not(`${first_arg_12.ctx_id ?? ""}`.startsWith("pj-"));
        } else {
          return false;
        }
      } else {
        return and_14_15;
      }
      ;
    })()) ? first_arg_12.ctx_id : null;
    return { "ptr": result_5, "worker_idx": worker_idx_7, "type": "pj", "ctx_id": `pj-${result_5 ?? ""}-g${squint_core2.swap_BANG_(pj_gen_counter, squint_core2.inc) ?? ""}`, "parent_ctx_id": parent_ctx_id_13 };
  })() : squint_core2.truth_(squint_core2.contains_QMARK_(/* @__PURE__ */ new Set(["pj-list", "pj-operation-factory-context"]), proj_returns_10)) ? { "ptr": result_5, "worker_idx": worker_idx_7, "type": `${proj_returns_10 ?? ""}` } : "else" ? result_5 : null;
  if (squint_core2.truth_(isolator_result_9)) {
    unowned_clones.delete(args_8);
    if (squint_core2.truth_(squint_core2.object_QMARK_(wrapped_11))) {
      wrapped_11["_ephemeral_context_ptr"] = squint_core2.get(isolator_result_9, "ephemeral-ctx-ptr");
      wrapped_11["_ephemeral_context_worker_idx"] = worker_idx_7;
    } else {
      squint_core2.get(isolator_result_9, "release")();
    }
  }
  ;
  return wrapped_11;
}, "proj_result_wrapper");
var proj_context_isolator = /* @__PURE__ */ __name(async function(p__17) {
  const map___1_3 = p__17;
  const map___1_4 = squint_core2.truth_(squint_core2.sequential_QMARK_(map___1_3)) ? squint_core2.truth_(squint_core2.vector_QMARK_(map___1_3)) ? map___1_3 : squint_core2.seq_to_map_for_destructuring(map___1_3) : map___1_3;
  const args_5 = squint_core2.get(map___1_4, "args");
  const worker_idx_6 = squint_core2.get(map___1_4, "worker-idx");
  const pool_7 = squint_core2.get(map___1_4, "pool");
  const library_8 = squint_core2.get(map___1_4, "library");
  const consumer_ctx_9 = squint_core2.first(args_5);
  const clone_ptr_10 = await dispatch.call_BANG_(library_8, "proj_context_clone", [consumer_ctx_9], { "pool": pool_7, "force-worker-idx": worker_idx_6 });
  const release_11 = clone_release_fn(library_8, pool_7, worker_idx_6, clone_ptr_10);
  unowned_clones.set(args_5, release_11);
  return { "args": squint_core2.assoc(squint_core2.vec(args_5), 0, clone_ptr_10), "ephemeral-ctx-ptr": clone_ptr_10, "release": release_11 };
}, "proj_context_isolator");
var string_list_to_native_array = /* @__PURE__ */ __name(function(s_list) {
  return squint_core2.vec(s_list);
}, "string_list_to_native_array");

// fndefs.mjs
import * as squint_core3 from "squint-cljs/core.js";
var PROJ_VERSION_MAJOR = 9;
var PROJ_VERSION_MINOR = 9;
var PROJ_VERSION_PATCH = 0;
var PJ_CATEGORY_ELLIPSOID = 0;
var PJ_CATEGORY_PRIME_MERIDIAN = 1;
var PJ_CATEGORY_DATUM = 2;
var PJ_CATEGORY_CRS = 3;
var PJ_CATEGORY_COORDINATE_OPERATION = 4;
var PJ_CATEGORY_DATUM_ENSEMBLE = 5;
var PJ_FWD = 1;
var PJ_IDENT = 0;
var PJ_INV = -1;
var PJ_LOG_NONE = 0;
var PJ_LOG_ERROR = 1;
var PJ_LOG_DEBUG = 2;
var PJ_LOG_TRACE = 3;
var PJ_LOG_TELL = 4;
var PJ_LOG_DEBUG_MAJOR = 2;
var PJ_LOG_DEBUG_MINOR = 3;
var PROJ_ERR_INVALID_OP = 1024;
var PROJ_ERR_INVALID_OP_WRONG_SYNTAX = 1025;
var PROJ_ERR_INVALID_OP_MISSING_ARG = 1026;
var PROJ_ERR_INVALID_OP_ILLEGAL_ARG_VALUE = 1027;
var PROJ_ERR_INVALID_OP_MUTUALLY_EXCLUSIVE_ARGS = 1028;
var PROJ_ERR_INVALID_OP_FILE_NOT_FOUND_OR_INVALID = 1029;
var PROJ_ERR_COORD_TRANSFM = 2048;
var PROJ_ERR_COORD_TRANSFM_INVALID_COORD = 2049;
var PROJ_ERR_COORD_TRANSFM_OUTSIDE_PROJECTION_DOMAIN = 2050;
var PROJ_ERR_COORD_TRANSFM_NO_OPERATION = 2051;
var PROJ_ERR_COORD_TRANSFM_OUTSIDE_GRID = 2052;
var PROJ_ERR_COORD_TRANSFM_GRID_AT_NODATA = 2053;
var PROJ_ERR_COORD_TRANSFM_NO_CONVERGENCE = 2054;
var PROJ_ERR_COORD_TRANSFM_MISSING_TIME = 2055;
var PROJ_ERR_OTHER = 4096;
var PROJ_ERR_OTHER_API_MISUSE = 4097;
var PROJ_ERR_OTHER_NO_INVERSE_OP = 4098;
var PROJ_ERR_OTHER_NETWORK_ERROR = 4099;
var PJ_GUESSED_WKT2_2019 = 0;
var PJ_GUESSED_WKT2_2018 = 0;
var PJ_GUESSED_WKT2_2015 = 1;
var PJ_GUESSED_WKT1_GDAL = 2;
var PJ_GUESSED_WKT1_ESRI = 3;
var PJ_GUESSED_NOT_WKT = 4;
var PJ_TYPE_UNKNOWN = 0;
var PJ_TYPE_ELLIPSOID = 1;
var PJ_TYPE_PRIME_MERIDIAN = 2;
var PJ_TYPE_GEODETIC_REFERENCE_FRAME = 3;
var PJ_TYPE_DYNAMIC_GEODETIC_REFERENCE_FRAME = 4;
var PJ_TYPE_VERTICAL_REFERENCE_FRAME = 5;
var PJ_TYPE_DYNAMIC_VERTICAL_REFERENCE_FRAME = 6;
var PJ_TYPE_DATUM_ENSEMBLE = 7;
var PJ_TYPE_CRS = 8;
var PJ_TYPE_GEODETIC_CRS = 9;
var PJ_TYPE_GEOCENTRIC_CRS = 10;
var PJ_TYPE_GEOGRAPHIC_CRS = 11;
var PJ_TYPE_GEOGRAPHIC_2D_CRS = 12;
var PJ_TYPE_GEOGRAPHIC_3D_CRS = 13;
var PJ_TYPE_VERTICAL_CRS = 14;
var PJ_TYPE_PROJECTED_CRS = 15;
var PJ_TYPE_COMPOUND_CRS = 16;
var PJ_TYPE_TEMPORAL_CRS = 17;
var PJ_TYPE_ENGINEERING_CRS = 18;
var PJ_TYPE_BOUND_CRS = 19;
var PJ_TYPE_OTHER_CRS = 20;
var PJ_TYPE_CONVERSION = 21;
var PJ_TYPE_TRANSFORMATION = 22;
var PJ_TYPE_CONCATENATED_OPERATION = 23;
var PJ_TYPE_OTHER_COORDINATE_OPERATION = 24;
var PJ_TYPE_TEMPORAL_DATUM = 25;
var PJ_TYPE_ENGINEERING_DATUM = 26;
var PJ_TYPE_PARAMETRIC_DATUM = 27;
var PJ_TYPE_DERIVED_PROJECTED_CRS = 28;
var PJ_TYPE_COORDINATE_METADATA = 29;
var PJ_COMP_STRICT = 0;
var PJ_COMP_EQUIVALENT = 1;
var PJ_COMP_EQUIVALENT_EXCEPT_AXIS_ORDER_GEOGCRS = 2;
var PJ_WKT2_2015 = 0;
var PJ_WKT2_2015_SIMPLIFIED = 1;
var PJ_WKT2_2019 = 2;
var PJ_WKT2_2018 = 2;
var PJ_WKT2_2019_SIMPLIFIED = 3;
var PJ_WKT2_2018_SIMPLIFIED = 3;
var PJ_WKT1_GDAL = 4;
var PJ_WKT1_ESRI = 5;
var PJ_CRS_EXTENT_NONE = 0;
var PJ_CRS_EXTENT_BOTH = 1;
var PJ_CRS_EXTENT_INTERSECTION = 2;
var PJ_CRS_EXTENT_SMALLEST = 3;
var PROJ_GRID_AVAILABILITY_USED_FOR_SORTING = 0;
var PROJ_GRID_AVAILABILITY_DISCARD_OPERATION_IF_MISSING_GRID = 1;
var PROJ_GRID_AVAILABILITY_IGNORED = 2;
var PROJ_GRID_AVAILABILITY_KNOWN_AVAILABLE = 3;
var PJ_PROJ_5 = 0;
var PJ_PROJ_4 = 1;
var PROJ_SPATIAL_CRITERION_STRICT_CONTAINMENT = 0;
var PROJ_SPATIAL_CRITERION_PARTIAL_INTERSECTION = 1;
var PROJ_INTERMEDIATE_CRS_USE_ALWAYS = 0;
var PROJ_INTERMEDIATE_CRS_USE_IF_NO_DIRECT_TRANSFORMATION = 1;
var PROJ_INTERMEDIATE_CRS_USE_NEVER = 2;
var PJ_CS_TYPE_UNKNOWN = 0;
var PJ_CS_TYPE_CARTESIAN = 1;
var PJ_CS_TYPE_ELLIPSOIDAL = 2;
var PJ_CS_TYPE_VERTICAL = 3;
var PJ_CS_TYPE_SPHERICAL = 4;
var PJ_CS_TYPE_ORDINAL = 5;
var PJ_CS_TYPE_PARAMETRIC = 6;
var PJ_CS_TYPE_DATETIMETEMPORAL = 7;
var PJ_CS_TYPE_TEMPORALCOUNT = 8;
var PJ_CS_TYPE_TEMPORALMEASURE = 9;
var PJ_UT_ANGULAR = 0;
var PJ_UT_LINEAR = 1;
var PJ_UT_SCALE = 2;
var PJ_UT_TIME = 3;
var PJ_UT_PARAMETRIC = 4;
var PJ_CART2D_EASTING_NORTHING = 0;
var PJ_CART2D_NORTHING_EASTING = 1;
var PJ_CART2D_NORTH_POLE_EASTING_SOUTH_NORTHING_SOUTH = 2;
var PJ_CART2D_SOUTH_POLE_EASTING_NORTH_NORTHING_NORTH = 3;
var PJ_CART2D_WESTING_SOUTHING = 4;
var PJ_ELLPS2D_LONGITUDE_LATITUDE = 0;
var PJ_ELLPS2D_LATITUDE_LONGITUDE = 1;
var PJ_ELLPS3D_LONGITUDE_LATITUDE_HEIGHT = 0;
var PJ_ELLPS3D_LATITUDE_LONGITUDE_HEIGHT = 1;
var fndefs = { "proj_crs_create_bound_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["base_crs", "pointer"], ["hub_crs", "pointer"], ["transformation", "pointer"]], "proj-returns": "pj" }, "proj_context_create": { "rettype": "pointer", "argtypes": [], "proj-returns": "pj-context" }, "proj_get_crs_list_parameters_create": { "rettype": "pointer", "argtypes": [], "proj-returns": "pj-crs-list-parameters" }, "proj_is_deprecated": { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, "proj_create_from_name": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["searchedName", "string"], ["types", "pointer"], ["typesCount", "size-t"], ["approximateMatch", "int32"], ["limitResultCount", "size-t"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj-list" }, "proj_prime_meridian_get_parameters": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["longitude", "double"], ["unit-conv-factor", "double"], ["unit-name", "string"]], "argtypes": [["ctx", "pointer"], ["prime_meridian", "pointer"], ["out_longitude", "pointer"], ["out_unit_conv_factor", "pointer"], ["out_unit_name", "pointer"]] }, "proj_string_destroy": { "rettype": "void", "argtypes": [["str", "pointer"]] }, "proj_log_func": { "rettype": "void", "argtypes": [["context", "pointer"], ["app_data", "pointer?"], ["logf", "pointer"]] }, "proj_create_geocentric_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["ellps_name", "string"], ["semi_major_metre", "float64"], ["inv_flattening", "float64"], ["prime_meridian_name", "string"], ["prime_meridian_offset", "float64"], ["angular_units", "string"], ["angular_units_conv", "float64"], ["linear_units", "string"], ["linear_units_conv", "float64"]], "proj-returns": "pj" }, "proj_unit_list_destroy": { "rettype": "void", "argtypes": [["list", "pointer"]] }, "proj_assign_context": { "rettype": "void", "argtypes": [["pj", "pointer"], ["context", "pointer"]] }, "proj_crs_create_projected_3D_crs_from_2D": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["projected_2D_crs", "pointer"], ["geog_3D_crs", "pointer"]], "proj-returns": "pj" }, "proj_operation_factory_context_set_area_of_interest_name": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["area_name", "string"]] }, "proj_get_ellipsoid": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, "proj_coordoperation_get_grid_used": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["short-name", "string"], ["full-name", "string"], ["package-name", "string"], ["url", "string"], ["direct-download", "int"], ["open-license", "int"], ["available", "int"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["index", "int32"], ["out_short_name", "pointer"], ["out_full_name", "pointer"], ["out_package_name", "pointer"], ["out_url", "pointer"], ["out_direct_download", "pointer"], ["out_open_license", "pointer"], ["out_available", "pointer"]] }, "proj_crs_is_derived": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, "proj_int_list_destroy": { "rettype": "void", "argtypes": [["list", "pointer"]] }, "proj_crs_get_coordinate_system": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, "proj_context_set_database_path": { "rettype": "int32", "argtypes": [["context", "pointer"], ["db-path", "string"], ["aux-db-paths", "pointer?"], ["options", "pointer?"]] }, "proj_get_crs_info_list_from_database": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["params", "pointer"], ["out_result_count", "pointer"]], "proj-returns": "struct-list", "struct-def": "proj-crs-info", "struct-fields": [["auth-name", "string", 0], ["code", "string", 4], ["name", "string", 8], ["type", "int", 12], ["deprecated", "boolean", 16], ["bbox-valid", "boolean", 20], ["west-lon-degree", "double", 24], ["south-lat-degree", "double", 32], ["east-lon-degree", "double", 40], ["north-lat-degree", "double", 48], ["area-name", "string", 56], ["projection-method-name", "string", 60], ["celestial-body-name", "string", 64]], "struct-destroy-fn": "proj_crs_info_list_destroy", "struct-params-create": "proj_get_crs_list_parameters_create", "struct-params-destroy": "proj_get_crs_list_parameters_destroy" }, "proj_is_equivalent_to": { "rettype": "int32", "argtypes": [["obj", "pointer"], ["other", "pointer"], ["criterion", "int32"]] }, "proj_context_set_enable_network": { "rettype": "int32", "argtypes": [["context", "pointer"], ["enabled", "int32"]] }, "proj_crs_create_bound_vertical_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["vert_crs", "pointer"], ["hub_geographic_3D_crs", "pointer"], ["grid_name", "string"]], "proj-returns": "pj" }, "proj_operation_factory_context_set_crs_extent_use": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["use", "int32"]] }, "proj_create_geographic_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["ellps_name", "string"], ["semi_major_metre", "float64"], ["inv_flattening", "float64"], ["prime_meridian_name", "string"], ["prime_meridian_offset", "float64"], ["pm_angular_units", "string"], ["pm_units_conv", "float64"], ["ellipsoidal_cs", "pointer"]], "proj-returns": "pj" }, "proj_coordoperation_get_grid_used_count": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, "proj_list_get_count": { "rettype": "int32", "argtypes": [["result", "pointer"]] }, "proj_create_transformation": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["name", "string"], ["auth_name", "string"], ["code", "string"], ["source_crs", "pointer"], ["target_crs", "pointer"], ["interpolation_crs", "pointer"], ["method_name", "string"], ["method_auth_name", "string"], ["method_code", "string"], ["param_count", "int32"], ["params", "pointer"], ["accuracy", "float64"]], "proj-returns": "pj" }, "proj_coordoperation_get_accuracy": { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]] }, "proj_coordoperation_get_param": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["name", "string"], ["auth-name", "string"], ["code", "string"], ["value", "double"], ["value-string", "string"], ["unit-conv-factor", "double"], ["unit-name", "string"], ["unit-auth-name", "string"], ["unit-code", "string"], ["unit-category", "string"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["index", "int32"], ["out_name", "pointer"], ["out_auth_name", "pointer"], ["out_code", "pointer"], ["out_value", "pointer"], ["out_value_string", "pointer"], ["out_unit_conv_factor", "pointer"], ["out_unit_name", "pointer"], ["out_unit_auth_name", "pointer"], ["out_unit_code", "pointer"], ["out_unit_category", "pointer"]] }, "proj_create": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["definition", "string"]], "proj-returns": "pj" }, "proj_create_conversion": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["name", "string"], ["auth_name", "string"], ["code", "string"], ["method_name", "string"], ["method_auth_name", "string"], ["method_code", "string"], ["param_count", "int32"], ["params", "pointer"]], "proj-returns": "pj" }, "proj_get_type": { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, "proj_context_get_database_metadata": { "rettype": "string", "argtypes": [["context", "pointer"], ["key", "string"]] }, "proj_crs_alter_geodetic_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["new_geod_crs", "pointer"]], "proj-returns": "pj" }, "proj_concatoperation_get_step_count": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["concatoperation", "pointer"]] }, "proj_operation_factory_context_set_discard_superseded": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["discard", "int32"]] }, "proj_is_derived_crs": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, "proj_get_units_from_database": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["category", "string?"], ["allow_deprecated", "int32"], ["out_result_count", "pointer"]], "proj-returns": "struct-list", "struct-def": "proj-unit-info", "struct-fields": [["auth-name", "string", 0], ["code", "string", 4], ["name", "string", 8], ["category", "string", 12], ["conv-factor", "double", 16], ["proj-short-name", "string", 24], ["deprecated", "boolean", 28]], "struct-destroy-fn": "proj_unit_list_destroy" }, "proj_crs_get_coordoperation": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, "proj_coordoperation_has_ballpark_transformation": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, "proj_get_area_of_use": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["west-lon-degree", "double"], ["south-lat-degree", "double"], ["east-lon-degree", "double"], ["north-lat-degree", "double"], ["area-name", "string"]], "argtypes": [["context", "pointer"], ["obj", "pointer"], ["out_west_lon_degree", "pointer"], ["out_south_lat_degree", "pointer"], ["out_east_lon_degree", "pointer"], ["out_north_lat_degree", "pointer"], ["out_area_name", "pointer"]] }, "proj_context_errno_string": { "rettype": "string", "argtypes": [["context", "pointer"], ["err", "int32"]] }, "proj_get_insert_statements": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["session", "pointer"], ["object", "pointer"], ["authority", "string"], ["code", "string"], ["numeric_codes", "int32"], ["allowed_authorities", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "string-list" }, "proj_string_list_destroy": { "rettype": "void", "argtypes": [["list", "pointer"]] }, "proj_trans_array": { "rettype": "int32", "argtypes": [["p", "pointer"], ["direction", "int32"], ["n", "size-t"], ["coord", "pointer"]], "argsemantics": [["coord", "coord-array"], ["n", "coord-count"]] }, "proj_context_clone": { "rettype": "pointer", "argtypes": [["ctx", "pointer"]], "proj-returns": "pj-context", "is-context-fn": false }, "proj_is_equivalent_to_with_ctx": { "rettype": "int32", "argtypes": [["context", "pointer"], ["obj", "pointer"], ["other", "pointer"], ["criterion", "int32"]] }, "proj_operation_factory_context_set_allow_use_intermediate_crs": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["use", "int32"]] }, "proj_coordoperation_get_param_index": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["name", "string"]] }, "proj_context_get_database_structure": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "string-list" }, "proj_operation_factory_context_destroy": { "rettype": "void", "argtypes": [["ctx", "pointer"]], "is-context-fn": false }, "proj_get_celestial_body_list_from_database": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["out_result_count", "pointer"]], "proj-returns": "struct-list", "struct-def": "proj-celestial-body-info", "struct-fields": [["auth-name", "string", 0], ["name", "string", 4]], "struct-destroy-fn": "proj_celestial_body_list_destroy" }, "proj_celestial_body_list_destroy": { "rettype": "void", "argtypes": [["list", "pointer"]] }, "proj_create_compound_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["horiz_crs", "pointer"], ["vert_crs", "pointer"]], "proj-returns": "pj" }, "proj_coordoperation_get_towgs84_values": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["values", "double-array", "count-arg", "value_count"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["out_values", "pointer"], ["value_count", "int32"], ["emit_error_if_incompatible", "int32"]] }, "proj_get_remarks": { "rettype": "string", "argtypes": [["obj", "pointer"]] }, "proj_get_geoid_models_from_database": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["code", "string"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "string-list" }, "proj_crs_alter_cs_linear_unit": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["linear_units", "string"], ["linear_units_conv", "float64"], ["unit_auth_name", "string"], ["unit_code", "string"]], "proj-returns": "pj" }, "proj_uom_get_info_from_database": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["name", "string"], ["conv-factor", "double"], ["category", "string"]], "argtypes": [["context", "pointer"], ["auth_name", "string"], ["code", "string"], ["out_name", "pointer"], ["out_conv_factor", "pointer"], ["out_category", "pointer"]] }, "proj_normalize_for_visualization": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, "proj_crs_get_datum_ensemble": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, "proj_create_crs_to_crs": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["source_crs", "string"], ["target_crs", "string"], ["area", "pointer?"]], "argsemantics": [["area", "pj-area", "default", 0]], "proj-returns": "pj", "isolate-context?": true }, "proj_alter_name": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["name", "string"]], "proj-returns": "pj" }, "proj_coordinate_metadata_get_epoch": { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]] }, "proj_context_errno": { "rettype": "int32", "argtypes": [["context", "pointer"]] }, "proj_context_set_search_paths": { "rettype": "void", "argtypes": [["context", "pointer"], ["count_paths", "int32"], ["paths", "pointer?"]], "argsemantics": [["paths", "string-array?", "default", null]] }, "proj_trans_generic": { "rettype": "size-t", "argtypes": [["p", "pointer"], ["direction", "int32"], ["x", "pointer"], ["sx", "size-t"], ["nx", "size-t"], ["y", "pointer"], ["sy", "size-t"], ["ny", "size-t"], ["z", "pointer?"], ["sz", "size-t"], ["nz", "size-t"], ["t", "pointer?"], ["st", "size-t"], ["nt", "size-t"]] }, "proj_clone": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["p", "pointer"]], "proj-returns": "pj" }, "proj_coordoperation_create_inverse": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, "proj_crs_demote_to_2D": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_2D_name", "string"], ["crs_3D", "pointer"]], "proj-returns": "pj" }, "proj_create_cartesian_2D_cs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["unit_name", "string"], ["unit_conv_factor", "float64"]], "proj-returns": "pj" }, "proj_context_is_network_enabled": { "rettype": "int32", "argtypes": [["context", "pointer"]] }, "proj_get_scope": { "rettype": "string", "argtypes": [["obj", "pointer"]] }, "proj_destroy": { "rettype": "pointer", "argtypes": [["pj", "pointer"]] }, "proj_operation_factory_context_set_allow_ballpark_transformations": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["allow", "int32"]] }, "proj_crs_get_datum": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, "proj_operation_factory_context_set_area_of_interest": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["west_lon_degree", "float64"], ["south_lat_degree", "float64"], ["east_lon_degree", "float64"], ["north_lat_degree", "float64"]] }, "proj_create_cs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["axis_count", "int32"], ["axis", "pointer"]], "proj-returns": "pj" }, "proj_create_projected_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["geodetic_crs", "pointer"], ["conversion", "pointer"], ["coordinate_system", "pointer"]], "proj-returns": "pj" }, "proj_as_proj_string": { "rettype": "string", "argtypes": [["context", "pointer"], ["pj", "pointer"], ["type", "int32"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]] }, "proj_operation_factory_context_set_grid_availability_use": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["use", "int32"]] }, "proj_create_derived_geographic_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["base_geographic_crs", "pointer"], ["conversion", "pointer"], ["ellipsoidal_cs", "pointer"]], "proj-returns": "pj" }, "proj_create_crs_to_crs_from_pj": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["source_crs", "pointer"], ["target_crs", "pointer"], ["area", "pointer?"], ["options", "pointer?"]], "argsemantics": [["area", "pj-area", "default", 0], ["options", "string-array?", "default", null]], "proj-returns": "pj" }, "proj_coordoperation_get_method_info": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["method-name", "string"], ["method-auth-name", "string"], ["method-code", "string"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["out_method_name", "pointer"], ["out_method_auth_name", "pointer"], ["out_method_code", "pointer"]] }, "proj_get_source_crs": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["pj", "pointer"]], "proj-returns": "pj" }, "proj_ellipsoid_get_parameters": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["semi-major-metre", "double"], ["semi-minor-metre", "double"], ["is-semi-minor-computed", "int"], ["inv-flattening", "double"]], "argtypes": [["ctx", "pointer"], ["ellipsoid", "pointer"], ["out_semi_major_metre", "pointer"], ["out_semi_minor_metre", "pointer"], ["out_is_semi_minor_computed", "pointer"], ["out_inv_flattening", "pointer"]] }, "proj_context_destroy": { "rettype": "void", "argtypes": [["context", "pointer"]], "is-context-fn": false }, "proj_cs_get_axis_info": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["name", "string"], ["abbreviation", "string"], ["direction", "string"], ["unit-conv-factor", "double"], ["unit-name", "string"], ["unit-auth-name", "string"], ["unit-code", "string"]], "argtypes": [["ctx", "pointer"], ["cs", "pointer"], ["index", "int32"], ["out_name", "pointer"], ["out_abbrev", "pointer"], ["out_direction", "pointer"], ["out_unit_conv_factor", "pointer"], ["out_unit_name", "pointer"], ["out_unit_auth_name", "pointer"], ["out_unit_code", "pointer"]] }, "proj_query_geodetic_crs_from_datum": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_auth_name", "string"], ["datum_auth_name", "string"], ["datum_code", "string"], ["crs_type", "string"]], "proj-returns": "pj-list" }, "proj_coordoperation_requires_per_coordinate_input_time": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, "proj_create_ellipsoidal_2D_cs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["unit_name", "string"], ["unit_conv_factor", "float64"]], "proj-returns": "pj" }, "proj_create_from_database": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["code", "string"], ["category", "int32"], ["use-proj-alternative-grid-names", "int32"], ["options", "pointer?"]], "argsemantics": [["category", "int32", "default", PJ_CATEGORY_CRS], ["use-proj-alternative-grid-names", "boolean", "default", false], ["options", "string-array?", "default", null]], "proj-returns": "pj" }, "proj_alter_id": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["auth_name", "string"], ["code", "string"]], "proj-returns": "pj" }, "proj_crs_has_point_motion_operation": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, "proj_operation_factory_context_set_allowed_intermediate_crs": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["list_of_auth_name_codes", "pointer"]] }, "proj_crs_promote_to_3D": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_3D_name", "string"], ["crs_2D", "pointer"]], "proj-returns": "pj" }, "proj_get_prime_meridian": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, "proj_datum_ensemble_get_accuracy": { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["datum_ensemble", "pointer"]] }, "proj_get_authorities_from_database": { "rettype": "pointer", "argtypes": [["context", "pointer"]], "proj-returns": "string-list" }, "proj_get_scope_ex": { "rettype": "string", "argtypes": [["obj", "pointer"], ["domainIdx", "int32"]] }, "proj_get_target_crs": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["pj", "pointer"]], "proj-returns": "pj" }, "proj_get_area_of_use_ex": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["west-lon-degree", "double"], ["south-lat-degree", "double"], ["east-lon-degree", "double"], ["north-lat-degree", "double"], ["area-name", "string"]], "argtypes": [["context", "pointer"], ["obj", "pointer"], ["domainIdx", "int32"], ["out_west_lon_degree", "pointer"], ["out_south_lat_degree", "pointer"], ["out_east_lon_degree", "pointer"], ["out_north_lat_degree", "pointer"], ["out_area_name", "pointer"]] }, "proj_get_id_auth_name": { "rettype": "string", "argtypes": [["obj", "pointer"], ["index", "int32"]] }, "proj_coordinate_metadata_create": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"], ["epoch", "float64"]], "proj-returns": "pj" }, "proj_create_geocentric_crs_from_datum": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_or_datum_ensemble", "pointer"], ["linear_units", "string"], ["linear_units_conv", "float64"]], "proj-returns": "pj" }, "proj_crs_info_list_destroy": { "rettype": "void", "argtypes": [["list", "pointer"]] }, "proj_operation_factory_context_set_use_proj_alternative_grid_names": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["usePROJNames", "int32"]] }, "proj_context_get_database_path": { "rettype": "string", "argtypes": [["context", "pointer"]] }, "proj_context_set_network_callbacks": { "rettype": "int32", "argtypes": [["context", "pointer"], ["open_cbk", "pointer"], ["close_cbk", "pointer"], ["get_header_cbk", "pointer"], ["read_range_cbk", "pointer"], ["user_data", "pointer?"]] }, "proj_is_crs": { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, "proj_get_crs_list_parameters_destroy": { "rettype": "void", "argtypes": [["params", "pointer"]] }, "proj_context_guess_wkt_dialect": { "rettype": "int32", "argtypes": [["context", "pointer"], ["wkt", "string"]] }, "proj_create_operation_factory_context": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["authority", "string"]], "proj-returns": "pj-operation-factory-context" }, "proj_list_destroy": { "rettype": "void", "argtypes": [["result", "pointer"]] }, "proj_cs_get_type": { "rettype": "int32", "argtypes": [["context", "pointer"], ["cs", "pointer"]] }, "proj_as_wkt": { "rettype": "string", "argtypes": [["context", "pointer"], ["pj", "pointer"], ["type", "int32"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null], ["type", "int32", "default", PJ_WKT2_2019]] }, "proj_insert_object_session_create": { "rettype": "pointer", "argtypes": [["context", "pointer"]], "proj-returns": "pj-insert-session" }, "proj_convert_conversion_to_other_method": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["conversion", "pointer"], ["new_method_epsg_code", "int32"], ["new_method_name", "string"]], "proj-returns": "pj" }, "proj_operation_factory_context_set_desired_accuracy": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["accuracy", "float64"]] }, "proj_list_get": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["result", "pointer"], ["index", "int32"]], "proj-returns": "pj" }, "proj_create_geographic_crs_from_datum": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_or_datum_ensemble", "pointer"], ["ellipsoidal_cs", "pointer"]], "proj-returns": "pj" }, "proj_get_name": { "rettype": "string", "argtypes": [["obj", "pointer"]] }, "proj_crs_alter_parameters_linear_unit": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["linear_units", "string"], ["linear_units_conv", "float64"], ["unit_auth_name", "string"], ["unit_code", "string"], ["convert_to_new_unit", "int32"]], "proj-returns": "pj" }, "proj_coordoperation_is_instantiable": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, "proj_crs_alter_cs_angular_unit": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["angular_units", "string"], ["angular_units_conv", "float64"], ["unit_auth_name", "string"], ["unit_code", "string"]], "proj-returns": "pj" }, "proj_datum_ensemble_get_member_count": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["datum_ensemble", "pointer"]] }, "proj_context_get_user_writable_directory": { "rettype": "string", "argtypes": [["context", "pointer"], ["create", "int32"]] }, "proj_create_vertical_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["linear_units", "string"], ["linear_units_conv", "float64"]], "proj-returns": "pj" }, "proj_get_domain_count": { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, "proj_get_id_code": { "rettype": "string", "argtypes": [["obj", "pointer"], ["index", "int32"]] }, "proj_operation_factory_context_set_spatial_criterion": { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["criterion", "int32"]] }, "proj_create_ellipsoidal_3D_cs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["horizontal_angular_unit_name", "string"], ["horizontal_angular_unit_conv_factor", "float64"], ["vertical_linear_unit_name", "string"], ["vertical_linear_unit_conv_factor", "float64"]], "proj-returns": "pj" }, "proj_create_operations": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["source_crs", "pointer"], ["target_crs", "pointer"], ["operationContext", "pointer"]], "proj-returns": "pj-list" }, "proj_grid_get_info_from_database": { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["full-name", "string"], ["package-name", "string"], ["url", "string"], ["direct-download", "int"], ["open-license", "int"], ["available", "int"]], "argtypes": [["context", "pointer"], ["grid_name", "string"], ["out_full_name", "pointer"], ["out_package_name", "pointer"], ["out_url", "pointer"], ["out_direct_download", "pointer"], ["out_open_license", "pointer"], ["out_available", "pointer"]] }, "proj_dynamic_datum_get_frame_reference_epoch": { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["datum", "pointer"]] }, "proj_log_level": { "rettype": "int32", "argtypes": [["context", "pointer"], ["level", "int32"]] }, "proj_context_set_autoclose_database": { "rettype": "void", "argtypes": [["context", "pointer"], ["autoclose", "int32"]] }, "proj_create_vertical_crs_ex": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["datum_auth_name", "string"], ["datum_code", "string"], ["linear_units", "string"], ["linear_units_conv", "float64"], ["geoid_model_name", "string"], ["geoid_model_auth_name", "string"], ["geoid_model_code", "string"], ["geoid_geog_crs", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj" }, "proj_cs_get_axis_count": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["cs", "pointer"]] }, "proj_identify": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["obj", "pointer"], ["auth_name", "string"], ["options", "pointer?"], ["out_confidence", "pointer"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj-list" }, "proj_suggests_code_for": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["object", "pointer"], ["authority", "string"], ["numeric_code", "int32"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "owned-string" }, "proj_concatoperation_get_step": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["concatoperation", "pointer"], ["i_step", "int32"]], "proj-returns": "pj" }, "proj_datum_ensemble_get_member": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["datum_ensemble", "pointer"], ["member_index", "int32"]], "proj-returns": "pj" }, "proj_crs_get_datum_forced": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, "proj_crs_create_bound_crs_to_WGS84": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj" }, "proj_crs_get_sub_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"], ["index", "int32"]], "proj-returns": "pj" }, "proj_get_celestial_body_name": { "rettype": "string", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]] }, "proj_errno_reset": { "rettype": "int32", "argtypes": [["pj", "pointer"]] }, "proj_insert_object_session_destroy": { "rettype": "void", "argtypes": [["context", "pointer"], ["session", "pointer"]] }, "proj_create_engineering_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crsName", "string"]], "proj-returns": "pj" }, "proj_crs_get_geodetic_crs": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, "proj_create_from_wkt": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["wkt", "string"], ["options", "pointer?"], ["out_warnings", "pointer?"], ["out_grammar_errors", "pointer?"]], "proj-returns": "pj" }, "proj_crs_is_dynamic": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, "proj_crs_get_horizontal_datum": { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, "proj_get_codes_from_database": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["type", "int32", "default", PJ_TYPE_CRS], ["allow_deprecated", "int32", "default", 1]], "proj-returns": "string-list" }, "proj_as_projjson": { "rettype": "string", "argtypes": [["context", "pointer"], ["pj", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]] }, "proj_get_non_deprecated": { "rettype": "pointer", "argtypes": [["context", "pointer"], ["obj", "pointer"]], "proj-returns": "pj-list" }, "proj_coordoperation_get_param_count": { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] } };

// macros.mjs
import * as squint_core4 from "squint-cljs/core.js";
import * as nmac from "ffi-wasm";
import * as net_DOT_willcohen_DOT_native_DOT_macros from "ffi-wasm";
import { c_name__GT_clj_name, underscore__GT_camelCase } from "ffi-wasm";

// proj.mjs
import * as resource from "resource-tracker";
var implementation = squint_core5.atom(null);
var force_graal = squint_core5.atom(false);
var toggle_graal_BANG_2 = /* @__PURE__ */ __name(function() {
  return nps.toggle_graal_BANG_(implementation, force_graal);
}, "toggle_graal_BANG_");
var force_graal_BANG_2 = /* @__PURE__ */ __name(function() {
  return nps.force_graal_BANG_(implementation, force_graal);
}, "force_graal_BANG_");
var force_ffi_BANG_2 = /* @__PURE__ */ __name(function() {
  return nps.force_ffi_BANG_(implementation, force_graal);
}, "force_ffi_BANG_");
var ffi_QMARK_2 = /* @__PURE__ */ __name(function() {
  return nps.ffi_QMARK_(implementation);
}, "ffi_QMARK_");
var graal_QMARK_2 = /* @__PURE__ */ __name(function() {
  return nps.graal_QMARK_(implementation);
}, "graal_QMARK_");
var node_QMARK_2 = /* @__PURE__ */ __name(function() {
  return nps.node_QMARK_(implementation);
}, "node_QMARK_");
var p2 = p;
var alloc_coord_array = /* @__PURE__ */ __name(function(num_coords, _worker_idx) {
  const floats_needed_1 = num_coords * 4;
  return { "buffer": new Float64Array(floats_needed_1), "numCoords": num_coords, "floatsNeeded": floats_needed_1, "type": "coord-array" };
}, "alloc_coord_array");
var set_coord_array = /* @__PURE__ */ __name(function(coord_array2, allocated) {
  const buf_1 = allocated.buffer;
  if (squint_core5.truth_((() => {
    const and_2_3 = squint_core5.array_QMARK_(coord_array2);
    if (squint_core5.truth_(and_2_3)) {
      return squint_core5.every_QMARK_(squint_core5.number_QMARK_, coord_array2);
    } else {
      return and_2_3;
    }
    ;
  })())) {
    buf_1.set(coord_array2, 0);
  } else {
    if (squint_core5.truth_((() => {
      const and_4_5 = squint_core5.array_QMARK_(coord_array2);
      if (squint_core5.truth_(and_4_5)) {
        return squint_core5.array_QMARK_(coord_array2[0]);
      } else {
        return and_4_5;
      }
      ;
    })())) {
      let i_6 = 0;
      let off_7 = 0;
      while (true) {
        if (i_6 < coord_array2.length) {
          const inner_8 = coord_array2[i_6];
          const len_9 = inner_8.length;
          if (off_7 + len_9 > buf_1.length) {
            throw new RangeError("coords exceed coord-array capacity");
          }
          ;
          const n694_10 = len_9;
          let j_11 = 0;
          for (; j_11 < n694_10; j_11++) {
            buf_1[off_7 + j_11] = inner_8[j_11];
          }
          ;
          let G__12 = i_6 + 1;
          let G__13 = off_7 + len_9;
          i_6 = G__12;
          off_7 = G__13;
          continue;
        }
        ;
        break;
      }
    } else {
      if ("else") {
        buf_1.set(squint_core5.into_array(squint_core5.flatten(coord_array2)), 0);
      } else {
      }
    }
  }
  ;
  return allocated;
}, "set_coord_array");
var get_coord_array = /* @__PURE__ */ __name(function(allocated, idx) {
  const buf_1 = allocated.buffer;
  const offset_2 = idx * 4;
  return [buf_1[offset_2], buf_1[offset_2 + 1], buf_1[offset_2 + 2], buf_1[offset_2 + 3]];
}, "get_coord_array");
var init_BANG_ = /* @__PURE__ */ (() => {
  let f860_1 = null;
  const impl863_2 = /* @__PURE__ */ __name(function() {
    return init_BANG_(null);
  }, "impl863_2");
  const impl864_3 = /* @__PURE__ */ __name(function(opts) {
    const log_level_4 = squint_core5.get(opts, "log-level");
    if (squint_core5.truth_(log_level_4)) {
      console.log("Attempting to initialize PROJ library for ClojureScript...");
    }
    ;
    const runtime_5 = typeof process !== "undefined" && (typeof process !== "undefined" && typeof process.versions !== "undefined" && (typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined")) ? "node" : typeof window !== "undefined" ? "browser" : "else" ? "unknown" : null;
    if (squint_core5.truth_(log_level_4)) {
      console.log(`${"Detected runtime: "}${runtime_5 ?? ""}`);
    }
    ;
    return init_proj(opts).then(function(proj_module) {
      squint_core5.reset_BANG_(implementation, runtime_5);
      if (squint_core5.truth_(log_level_4)) {
        console.log(`${"PROJ initialized with "}${runtime_5 ?? ""}${" implementation"}`);
      }
      ;
      return proj_module;
    });
  }, "impl864_3");
  f860_1 = /* @__PURE__ */ __name(function(...args861) {
    const self865_6 = this;
    const G__1116_7 = args861.length;
    switch (G__1116_7) {
      case 0:
        return impl863_2.call(self865_6);
        break;
      case 1:
        return impl864_3.call(self865_6, args861[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args861.length ?? ""}`);
    }
    ;
  }, "f860_1");
  return f860_1;
})();
var shutdown_BANG_2 = /* @__PURE__ */ __name(function() {
  return shutdown_BANG_();
}, "shutdown_BANG_");
var flush_pending_disposes_BANG_4 = /* @__PURE__ */ __name(function() {
  return pool3.flush_pending_disposes_BANG_();
}, "flush_pending_disposes_BANG_");
var get_pool_detail2 = /* @__PURE__ */ __name(function() {
  return pool3.get_pool_detail("net.willcohen.proj");
}, "get_pool_detail");
var get_worker_count2 = /* @__PURE__ */ __name(function() {
  return get_worker_count();
}, "get_worker_count");
var pad_coords = /* @__PURE__ */ __name(function(width, coords) {
  if (squint_core5.truth_((() => {
    const and_1_2 = squint_core5.sequential_QMARK_(coords);
    if (squint_core5.truth_(and_1_2)) {
      return squint_core5.every_QMARK_(squint_core5.sequential_QMARK_, coords);
    } else {
      return and_1_2;
    }
    ;
  })())) {
    return squint_core5.mapv(function(coord) {
      const n_3 = squint_core5.count(coord);
      if (n_3 < width) {
        return squint_core5.into(squint_core5.vec(coord), squint_core5.repeat(width - n_3, 0));
      } else {
        return coord;
      }
      ;
    }, coords);
  } else {
    return coords;
  }
  ;
}, "pad_coords");
var set_coords_BANG_ = /* @__PURE__ */ __name(async function(ca, coords) {
  return await set_coord_array(pad_coords(4, coords), ca);
}, "set_coords_BANG_");
var get_coords = /* @__PURE__ */ __name(function(ca, idx) {
  return get_coord_array(ca, idx);
}, "get_coords");
var cs = /* @__PURE__ */ __name(function(context, f, args) {
  return squint_core5.apply(f, squint_core5.cons(context, args));
}, "cs");
var proj_type__GT_destroy_fn = { "pj": "proj_destroy", "pj-list": "proj_list_destroy", "string-list": "proj_string_list_destroy", "pj-context": "proj_context_destroy", "pj-crs-list-parameters": "proj_get_crs_list_parameters_destroy", "pj-insert-session": "proj_insert_object_session_destroy", "pj-operation-factory-context": "proj_operation_factory_context_destroy" };
var proj_error_codes = (() => {
  const G__1467_1 = {};
  G__1467_1[0] = "Success (no error)";
  G__1467_1[1024] = "PROJ_ERR_INVALID_OP - Invalid coordinate operation";
  G__1467_1[2048] = "PROJ_ERR_COORD_TRANSFM - Coordinate transformation error";
  G__1467_1[4096] = "PROJ_ERR_OTHER - Other error";
  G__1467_1[1025] = "PROJ_ERR_INVALID_OP_WRONG_SYNTAX - Invalid pipeline structure or missing +proj";
  G__1467_1[2049] = "PROJ_ERR_COORD_TRANSFM_INVALID_COORD - Invalid coordinate (for example, lat > 90\xB0)";
  G__1467_1[4097] = "PROJ_ERR_OTHER_API_MISUSE - API misuse";
  G__1467_1[1026] = "PROJ_ERR_INVALID_OP_MISSING_ARG - Missing required operation parameter";
  G__1467_1[2050] = "PROJ_ERR_COORD_TRANSFM_OUTSIDE_PROJECTION_DOMAIN - Outside projection domain";
  G__1467_1[4098] = "PROJ_ERR_OTHER_NO_INVERSE_OP - No inverse operation available";
  G__1467_1[1027] = "PROJ_ERR_INVALID_OP_ILLEGAL_ARG_VALUE - Illegal parameter value";
  G__1467_1[2051] = "PROJ_ERR_COORD_TRANSFM_NO_OPERATION - No operation found";
  G__1467_1[4099] = "PROJ_ERR_OTHER_NETWORK_ERROR - Network resource access failure";
  G__1467_1[1028] = "PROJ_ERR_INVALID_OP_MUTUALLY_EXCLUSIVE_ARGS - Mutually exclusive arguments";
  G__1467_1[2052] = "PROJ_ERR_COORD_TRANSFM_OUTSIDE_GRID - Point outside grid";
  G__1467_1[1029] = "PROJ_ERR_INVALID_OP_FILE_NOT_FOUND_OR_INVALID - File not found or invalid";
  G__1467_1[2053] = "PROJ_ERR_COORD_TRANSFM_GRID_AT_NODATA - Grid cell is nodata";
  G__1467_1[2054] = "PROJ_ERR_COORD_TRANSFM_NO_CONVERGENCE - Iterative convergence failed";
  G__1467_1[2055] = "PROJ_ERR_COORD_TRANSFM_MISSING_TIME - Operation requires time";
  return G__1467_1;
})();
var error_code__GT_string = /* @__PURE__ */ __name(function(code) {
  return squint_core5.get(proj_error_codes, code, `${"Unknown error code: "}${code ?? ""}`);
}, "error_code__GT_string");
var errno_error = /* @__PURE__ */ __name(function(fn_key, errno) {
  const msg_1 = `${"PROJ error "}${errno ?? ""}${" in "}${squint_core5.name(fn_key)}${": "}${error_code__GT_string(errno) ?? ""}`;
  return new Error(msg_1);
}, "errno_error");
var build_ctx_destroy_fn = /* @__PURE__ */ __name(function(ctx_pool, worker_idx, ctx_id) {
  const fired_QMARK__1 = squint_core5.atom(false);
  return /* @__PURE__ */ __name(function dispose_ctx_BANG_() {
    if (squint_core5.truth_((() => {
      const and_2_3 = live_pool_QMARK_2(ctx_pool);
      if (squint_core5.truth_(and_2_3)) {
        return squint_core5.compare_and_set_BANG_(fired_QMARK__1, false, true);
      } else {
        return and_2_3;
      }
      ;
    })())) {
      const p_4 = destroy_context_BANG_(ctx_pool, worker_idx, ctx_id).catch(ignore_pool_terminated);
      untrack_context_BANG_2(worker_idx, ctx_id);
      return p_4;
    }
    ;
  }, "dispose_ctx_BANG_");
}, "build_ctx_destroy_fn");
var attach_symbol_dispose_BANG_ = /* @__PURE__ */ __name(function(target, destroy_fn, kind, ctx_id, worker_idx) {
  return target[Symbol.dispose] = function() {
    const or_1_2 = kind === "pj" && pool3.dispose_handle_BANG_("net.willcohen.proj", ctx_id);
    if (squint_core5.truth_(or_1_2)) {
      return or_1_2;
    } else {
      return pool3.fire_and_capture_dispose_BANG_(destroy_fn, { "lib": "net.willcohen.proj", "kind": kind, "ctx-id": ctx_id, "worker": worker_idx });
    }
    ;
  };
}, "attach_symbol_dispose_BANG_");
var context_create_cljs = /* @__PURE__ */ __name(async function(opts) {
  ensure_initialized_BANG_();
  const ctx_pool_1 = current_pool();
  const ctx_result_2 = await create_context_on_worker(opts);
  const ctx_id_3 = squint_core5.get(ctx_result_2, "ctx-id");
  const worker_idx_4 = squint_core5.get(ctx_result_2, "worker-idx");
  const destroy_fn_5 = build_ctx_destroy_fn(ctx_pool_1, worker_idx_4, ctx_id_3);
  const ctx_obj_6 = { "ptr": squint_core5.get(ctx_result_2, "ptr"), "ctx_id": ctx_id_3, "worker_idx": worker_idx_4, "type": "proj-context" };
  track_context_BANG_2(ctx_id_3, worker_idx_4, squint_core5.get(ctx_result_2, "release"), ctx_obj_6);
  resource.track(ctx_obj_6, { "disposefn": destroy_fn_5, "tracktype": "auto" });
  attach_symbol_dispose_BANG_(ctx_obj_6, destroy_fn_5, "ctx", ctx_id_3, worker_idx_4);
  return ctx_obj_6;
}, "context_create_cljs");
var context_create = /* @__PURE__ */ (() => {
  const impl1950_1 = /* @__PURE__ */ __name(async function(args) {
    const opts_2 = squint_core5.truth_(squint_core5.map_QMARK_(squint_core5.first(args))) ? squint_core5.first(args) : {};
    return await context_create_cljs(opts_2);
  }, "impl1950_1");
  const f1948 = /* @__PURE__ */ __name(function(...rest1949) {
    const self__23348__auto___3 = this;
    return impl1950_1.call(self__23348__auto___3, rest1949.length === 0 ? null : rest1949);
  }, "f1948");
  f1948["squint$lang$variadic"] = impl1950_1;
  return f1948;
})();
var context_ptr = /* @__PURE__ */ __name(function(context) {
  return context.ptr;
}, "context_ptr");
var context_database_path = /* @__PURE__ */ __name(function(context) {
  return proj_context_get_database_path({ "context": context });
}, "context_database_path");
var is_context_QMARK_ = /* @__PURE__ */ __name(function(x) {
  if (squint_core5.truth_(x)) {
    const and_1_2 = x.ptr;
    if (squint_core5.truth_(and_1_2)) {
      return x.type === "proj-context";
    } else {
      return and_1_2;
    }
    ;
  } else {
    return x;
  }
  ;
}, "is_context_QMARK_");
var context_set_database_path = /* @__PURE__ */ (() => {
  let f2221_1 = null;
  const impl2224_2 = /* @__PURE__ */ __name(function(context) {
    return context_set_database_path(context, "/proj/proj.db");
  }, "impl2224_2");
  const impl2225_3 = /* @__PURE__ */ __name(function(context, db_path) {
    return context_set_database_path(context, db_path, null, null);
  }, "impl2225_3");
  const impl2226_4 = /* @__PURE__ */ __name(function(context, db_path, aux_db_paths, options) {
    const blank__GT_nil_5 = /* @__PURE__ */ __name(function(x) {
      if (squint_core5.truth_((() => {
        const and_6_7 = squint_core5.string_QMARK_(x);
        if (squint_core5.truth_(and_6_7)) {
          return string.blank_QMARK_(x);
        } else {
          return and_6_7;
        }
        ;
      })())) {
        return null;
      } else {
        return x;
      }
      ;
    }, "blank__GT_nil_5");
    return proj_context_set_database_path({ "context": context, "db-path": db_path, "aux-db-paths": blank__GT_nil_5(aux_db_paths), "options": blank__GT_nil_5(options) });
  }, "impl2226_4");
  f2221_1 = /* @__PURE__ */ __name(function(...args2222) {
    const self2227_8 = this;
    const G__2378_9 = args2222.length;
    switch (G__2378_9) {
      case 1:
        return impl2224_2.call(self2227_8, args2222[0]);
        break;
      case 2:
        return impl2225_3.call(self2227_8, args2222[0], args2222[1]);
        break;
      case 4:
        return impl2226_4.call(self2227_8, args2222[0], args2222[1], args2222[2], args2222[3]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args2222.length ?? ""}`);
    }
    ;
  }, "f2221_1");
  return f2221_1;
})();
var context_set_enable_network = /* @__PURE__ */ __name(function(context, enabled) {
  return proj_context_set_enable_network({ "context": context, "enabled": squint_core5.truth_(enabled) ? 1 : 0 });
}, "context_set_enable_network");
var coord_array = /* @__PURE__ */ (() => {
  let f2524_1 = null;
  const impl2527_2 = /* @__PURE__ */ __name(function(n) {
    return coord_array(n, 4);
  }, "impl2527_2");
  const impl2528_3 = /* @__PURE__ */ __name(function(n, dims) {
    return coord_array(n, dims, {});
  }, "impl2528_3");
  const impl2529_4 = /* @__PURE__ */ __name(function(n, _dims, _opts) {
    if (squint_core5.deref(implementation) == null) {
      init_BANG_();
    }
    ;
    return alloc_coord_array(n, 0);
  }, "impl2529_4");
  f2524_1 = /* @__PURE__ */ __name(function(...args2525) {
    const self2530_5 = this;
    const G__2626_6 = args2525.length;
    switch (G__2626_6) {
      case 1:
        return impl2527_2.call(self2530_5, args2525[0]);
        break;
      case 2:
        return impl2528_3.call(self2530_5, args2525[0], args2525[1]);
        break;
      case 3:
        return impl2529_4.call(self2530_5, args2525[0], args2525[1], args2525[2]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args2525.length ?? ""}`);
    }
    ;
  }, "f2524_1");
  return f2524_1;
})();
var coord__GT_coord_array = /* @__PURE__ */ __name(function(coord) {
  return set_coord_array(coord, coord_array(1));
}, "coord__GT_coord_array");
var is_c_context_fn_QMARK_ = /* @__PURE__ */ __name(function(_fn_key, fn_def) {
  if (squint_core5.truth_(squint_core5.contains_QMARK_(fn_def, "is-context-fn"))) {
    return squint_core5.get(fn_def, "is-context-fn");
  } else {
    return squint_core5.contains_QMARK_(/* @__PURE__ */ new Set(["context", "ctx"]), squint_core5.ffirst(squint_core5.get(fn_def, "argtypes")));
  }
  ;
}, "is_c_context_fn_QMARK_");
var dispatch_call = /* @__PURE__ */ __name(async function(fn_key, args, opts) {
  const result_1 = await dispatch2.call_BANG_(lib, fn_key, args, opts).catch(function(e) {
    release_unowned_clone_BANG_(args);
    throw e;
  });
  const temp__23241__auto___2 = take_call_errno_BANG_(args);
  if (squint_core5.truth_(temp__23241__auto___2)) {
    const errno_3 = temp__23241__auto___2;
    throw errno_error(fn_key, errno_3);
  }
  ;
  return result_1;
}, "dispatch_call");
var call_native = /* @__PURE__ */ (() => {
  let f2917_1 = null;
  const impl2920_2 = /* @__PURE__ */ __name(function(fn_key, args) {
    return call_native(fn_key, null, args, null);
  }, "impl2920_2");
  const impl2921_3 = /* @__PURE__ */ __name(function(fn_key, fn_def, args) {
    return call_native(fn_key, fn_def, args, null);
  }, "impl2921_3");
  const impl2922_4 = /* @__PURE__ */ __name(function(fn_key, _fn_def, args, force_worker_idx) {
    ensure_proj_initialized_BANG_();
    const pj_arg_5 = squint_core5.first(squint_core5.filter(function(a) {
      const and_6_7 = squint_core5.object_QMARK_(a);
      if (squint_core5.truth_(and_6_7)) {
        return "pj" === a.type;
      } else {
        return and_6_7;
      }
      ;
    }, args));
    const primary_handle_8 = squint_core5.truth_(pj_arg_5) ? pj_arg_5.ctx_id : null;
    return dispatch_call(fn_key, args, { "pool": current_pool(), "primary-handle": primary_handle_8, "force-worker-idx": force_worker_idx });
  }, "impl2922_4");
  f2917_1 = /* @__PURE__ */ __name(function(...args2918) {
    const self2923_9 = this;
    const G__3134_10 = args2918.length;
    switch (G__3134_10) {
      case 2:
        return impl2920_2.call(self2923_9, args2918[0], args2918[1]);
        break;
      case 3:
        return impl2921_3.call(self2923_9, args2918[0], args2918[1], args2918[2]);
        break;
      case 4:
        return impl2922_4.call(self2923_9, args2918[0], args2918[1], args2918[2], args2918[3]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args2918.length ?? ""}`);
    }
    ;
  }, "f2917_1");
  return f2917_1;
})();
var ensure_initialized_BANG_ = /* @__PURE__ */ __name(function() {
  if (squint_core5.deref(implementation) == null) {
    return console.warn("PROJ may not be initialized - ensure proj/init! was called");
  }
  ;
}, "ensure_initialized_BANG_");
var lookup_arg_val = /* @__PURE__ */ __name(function(opts, arg_name) {
  const underscore_1 = squint_core5.keyword(arg_name);
  const hyphenated_2 = squint_core5.keyword(string.replace(squint_core5.name(arg_name), "_", "-"));
  const context_alias_3 = (() => {
    const G__3335_4 = arg_name;
    switch (G__3335_4) {
      case "ctx":
        return "context";
        break;
      case "context":
        return "ctx";
        break;
    }
    ;
  })();
  const or_6_7 = squint_core5.get(opts, underscore_1);
  if (squint_core5.truth_(or_6_7)) {
    return or_6_7;
  } else {
    const or_8_9 = squint_core5.get(opts, hyphenated_2);
    if (squint_core5.truth_(or_8_9)) {
      return or_8_9;
    } else {
      if (squint_core5.truth_(context_alias_3)) {
        return squint_core5.get(opts, context_alias_3);
      }
    }
    ;
  }
  ;
}, "lookup_arg_val");
var resolve_default = /* @__PURE__ */ __name(function(default_val, arg_type) {
  if (squint_core5.truth_(arg_type === "int32" && squint_core5.boolean_QMARK_(default_val))) {
    if (squint_core5.truth_(default_val)) {
      return 1;
    } else {
      return 0;
    }
  } else {
    if ("else") {
      return default_val;
    } else {
      return null;
    }
  }
  ;
}, "resolve_default");
var coerce_arg = /* @__PURE__ */ __name(function(provided_val, arg_type, semantics_for_arg) {
  if (squint_core5.truth_(arg_type === "pointer" && (() => {
    const and_1_2 = squint_core5.map_QMARK_(provided_val);
    if (squint_core5.truth_(and_1_2)) {
      return squint_core5.contains_QMARK_(provided_val, "malloc");
    } else {
      return and_1_2;
    }
    ;
  })())) {
    return squint_core5.get(provided_val, "malloc");
  } else {
    if (squint_core5.truth_(!(provided_val == null) && (() => {
      const and_3_4 = squint_core5.sequential_QMARK_(provided_val);
      if (squint_core5.truth_(and_3_4)) {
        return "string-array?" === squint_core5.get(semantics_for_arg, "semantic-type");
      } else {
        return and_3_4;
      }
      ;
    })())) {
      return string_list_to_native_array(provided_val);
    } else {
      if (squint_core5.truth_(provided_val == null && squint_core5.get(/* @__PURE__ */ new Set(["pointer", "pointer?"]), arg_type))) {
        return 0;
      } else {
        if (provided_val == null && arg_type === "string") {
          return 0;
        } else {
          if ("else") {
            return provided_val;
          } else {
            return null;
          }
        }
      }
    }
  }
  ;
}, "coerce_arg");
var extract_args = /* @__PURE__ */ (() => {
  let f3781_1 = null;
  const impl3784_2 = /* @__PURE__ */ __name(function(fn_def, opts) {
    return extract_args(fn_def, opts, {});
  }, "impl3784_2");
  const impl3785_3 = /* @__PURE__ */ __name(function(fn_def, opts, p__3822) {
    const map___4_6 = p__3822;
    const map___4_7 = squint_core5.truth_(squint_core5.sequential_QMARK_(map___4_6)) ? squint_core5.truth_(squint_core5.vector_QMARK_(map___4_6)) ? map___4_6 : squint_core5.seq_to_map_for_destructuring(map___4_6) : map___4_6;
    const skip_first_QMARK__8 = squint_core5.get(map___4_7, "skip-first?", false);
    const argtypes_9 = squint_core5.truth_(skip_first_QMARK__8) ? squint_core5.rest(squint_core5.get(fn_def, "argtypes")) : squint_core5.get(fn_def, "argtypes");
    const argsemantics_map_10 = squint_core5.into({}, squint_core5.map(function(p__3943) {
      const vec___11_14 = p__3943;
      const seq___12_15 = squint_core5.seq(vec___11_14);
      const first___13_16 = squint_core5.first(seq___12_15);
      const seq___12_17 = squint_core5.next(seq___12_15);
      const arg_name_18 = first___13_16;
      const first___13_19 = squint_core5.first(seq___12_17);
      const seq___12_20 = squint_core5.next(seq___12_17);
      const semantic_type_21 = first___13_19;
      const rest_semantics_22 = seq___12_20;
      return [arg_name_18, squint_core5.apply(squint_core5.hash_map, "semantic-type", semantic_type_21, rest_semantics_22)];
    }, squint_core5.get(fn_def, "argsemantics")));
    return squint_core5.mapv(function(arg_spec) {
      const vec___23_26 = arg_spec;
      const seq___24_27 = squint_core5.seq(vec___23_26);
      const first___25_28 = squint_core5.first(seq___24_27);
      const seq___24_29 = squint_core5.next(seq___24_27);
      const arg_name_30 = first___25_28;
      const first___25_31 = squint_core5.first(seq___24_29);
      const seq___24_32 = squint_core5.next(seq___24_29);
      const arg_type_33 = first___25_31;
      const rest_spec_34 = seq___24_32;
      const arg_map_35 = squint_core5.truth_(squint_core5.seq(rest_spec_34)) ? squint_core5.apply(squint_core5.assoc, {}, rest_spec_34) : null;
      const semantics_for_arg_36 = squint_core5.get(argsemantics_map_10, arg_name_30);
      const default_val_37 = squint_core5.truth_(squint_core5.contains_QMARK_(arg_map_35, "default")) ? squint_core5.get(arg_map_35, "default") : squint_core5.get(semantics_for_arg_36, "default");
      const has_default_QMARK__38 = (() => {
        const or_39_40 = squint_core5.contains_QMARK_(arg_map_35, "default");
        if (squint_core5.truth_(or_39_40)) {
          return or_39_40;
        } else {
          return squint_core5.contains_QMARK_(semantics_for_arg_36, "default");
        }
        ;
      })();
      const is_context_arg_41 = squint_core5.contains_QMARK_(/* @__PURE__ */ new Set(["ctx", "context"]), arg_name_30);
      const provided_val_42 = lookup_arg_val(opts, arg_name_30);
      if (squint_core5.truth_(squint_core5.truth_(is_context_arg_41) ? !(provided_val_42 == null) && is_context_QMARK_(provided_val_42) : is_context_arg_41)) {
        return provided_val_42;
      } else {
        if (squint_core5.truth_(squint_core5.truth_(is_context_arg_41) ? provided_val_42 == null && squint_core5.not(has_default_QMARK__38) : is_context_arg_41)) {
          return 0;
        } else {
          if (squint_core5.truth_(provided_val_42 == null && has_default_QMARK__38)) {
            return resolve_default(default_val_37, arg_type_33);
          } else {
            if ("else") {
              return coerce_arg(provided_val_42, arg_type_33, semantics_for_arg_36);
            } else {
              return null;
            }
          }
        }
      }
      ;
    }, argtypes_9);
  }, "impl3785_3");
  f3781_1 = /* @__PURE__ */ __name(function(...args3782) {
    const self3786_43 = this;
    const G__4304_44 = args3782.length;
    switch (G__4304_44) {
      case 2:
        return impl3784_2.call(self3786_43, args3782[0], args3782[1]);
        break;
      case 3:
        return impl3785_3.call(self3786_43, args3782[0], args3782[1], args3782[2]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args3782.length ?? ""}`);
    }
    ;
  }, "f3781_1");
  return f3781_1;
})();
var build_pj_destroy_fn = /* @__PURE__ */ __name(function(pj_pool, worker_idx, ptr, destroy_fn_name, ephemeral_ctx_ptr, ephemeral_ctx_worker_idx) {
  const fired_QMARK__1 = squint_core5.atom(false);
  return /* @__PURE__ */ __name(async function dispose_BANG_() {
    if (squint_core5.truth_(await (async () => {
      const and_2_3 = live_pool_QMARK_2(pj_pool);
      if (squint_core5.truth_(and_2_3)) {
        return squint_core5.compare_and_set_BANG_(fired_QMARK__1, false, true);
      } else {
        return and_2_3;
      }
      ;
    })())) {
      const routing_4 = { "worker_idx": worker_idx, "ptr": ptr };
      await dispatch2.call_BANG_(lib, destroy_fn_name, [routing_4], { "pool": pj_pool, "force-worker-idx": worker_idx }).catch(ignore_pool_terminated);
      if (squint_core5.truth_(ephemeral_ctx_ptr)) {
        const ctx_routing_5 = { "worker_idx": ephemeral_ctx_worker_idx, "ptr": ephemeral_ctx_ptr };
        return await dispatch2.call_BANG_(lib, "proj_context_destroy", [ctx_routing_5], { "pool": pj_pool, "force-worker-idx": ephemeral_ctx_worker_idx }).catch(ignore_pool_terminated);
      }
      ;
    }
    ;
  }, "dispose_BANG_");
}, "build_pj_destroy_fn");
var register_pj_handle_BANG_ = /* @__PURE__ */ __name(function(result, destroy_fn, pj_ctx_id, worker_idx, parent_ctx_id) {
  try {
    return pool3.bounded_create_handle_BANG_("net.willcohen.proj", function() {
      const parent_key_1 = squint_core5.truth_(parent_ctx_id) ? ctx_key(worker_idx, parent_ctx_id) : null;
      return pool3.register_handle_BANG_("net.willcohen.proj", pj_ctx_id, worker_idx, destroy_fn, result, parent_key_1);
    });
  } catch (e_2) {
    if ("bounded-blocked" === (() => {
      const G__4645_3 = e_2;
      const G__4645_4 = G__4645_3 == null ? null : squint_core5.ex_data(G__4645_3);
      if (G__4645_4 == null) {
        return null;
      } else {
        return squint_core5.get(G__4645_4, "blocked");
      }
      ;
    })()) {
      try {
        pool3.fire_and_capture_dispose_BANG_(destroy_fn, { "lib": "net.willcohen.proj", "kind": "pj", "ctx-id": pj_ctx_id, "worker": worker_idx, "path": "bounded-blocked-cleanup" });
      } catch (__5) {
      }
    }
    ;
    throw e_2;
  }
  ;
}, "register_pj_handle_BANG_");
var track_pj_result_BANG_ = /* @__PURE__ */ __name(function(result, destroy_fn_name) {
  const worker_idx_1 = result.worker_idx;
  const ptr_2 = result.ptr;
  const pj_ctx_id_3 = result.ctx_id;
  const parent_ctx_id_4 = result.parent_ctx_id;
  const ephemeral_ctx_ptr_5 = result._ephemeral_context_ptr;
  const ephemeral_ctx_worker_idx_6 = result._ephemeral_context_worker_idx;
  const destroy_fn_7 = build_pj_destroy_fn(current_pool(), worker_idx_1, ptr_2, destroy_fn_name, ephemeral_ctx_ptr_5, ephemeral_ctx_worker_idx_6);
  register_pj_handle_BANG_(result, destroy_fn_7, pj_ctx_id_3, worker_idx_1, parent_ctx_id_4);
  attach_symbol_dispose_BANG_(result, destroy_fn_7, "pj", pj_ctx_id_3, worker_idx_1);
  return result;
}, "track_pj_result_BANG_");
var process_return_value_with_tracking = /* @__PURE__ */ __name(function(result, fn_def) {
  const proj_returns_1 = squint_core5.get(fn_def, "proj-returns");
  if ("owned-string" === proj_returns_1) {
    return result;
  } else {
    if ("string-list" === proj_returns_1) {
      return result;
    } else {
      if ("else") {
        const destroy_fn_name_2 = squint_core5.get(proj_type__GT_destroy_fn, proj_returns_1);
        if (squint_core5.truth_(squint_core5.truth_(destroy_fn_name_2) ? result : destroy_fn_name_2)) {
          if (squint_core5.truth_((() => {
            const and_3_4 = squint_core5.object_QMARK_(result);
            if (squint_core5.truth_(and_3_4)) {
              return result.ctx_id;
            } else {
              return and_3_4;
            }
            ;
          })())) {
            return track_pj_result_BANG_(result, destroy_fn_name_2);
          } else {
            return result;
          }
        } else {
          return result;
        }
        ;
      } else {
        return null;
      }
    }
  }
  ;
}, "process_return_value_with_tracking");
var call_checked = /* @__PURE__ */ __name(function(fn_key, fn_def, args) {
  return call_native(fn_key, fn_def, args);
}, "call_checked");
var dispatch_context_fn = /* @__PURE__ */ __name(function(fn_key, fn_def, context_atom, remaining_args) {
  return cs(context_atom, /* @__PURE__ */ (() => {
    const impl5029_1 = /* @__PURE__ */ __name(function(ctx, args) {
      return call_checked(fn_key, fn_def, squint_core5.vec(squint_core5.cons(ctx, args)));
    }, "impl5029_1");
    const f5026 = /* @__PURE__ */ __name(function(arg5027, ...rest5028) {
      const self__23348__auto___2 = this;
      return impl5029_1.call(self__23348__auto___2, arg5027, rest5028.length === 0 ? null : rest5028);
    }, "f5026");
    f5026["squint$lang$variadic"] = impl5029_1;
    return f5026;
  })(), remaining_args);
}, "dispatch_context_fn");
var first_arg_kw = /* @__PURE__ */ __name(function(fn_def) {
  return squint_core5.ffirst(squint_core5.get(fn_def, "argtypes"));
}, "first_arg_kw");
var resolve_ctx_from_opts = /* @__PURE__ */ __name(function(fn_def, opts) {
  const fa_1 = first_arg_kw(fn_def);
  if (squint_core5.truth_(squint_core5.get(/* @__PURE__ */ new Set(["ctx", "context"]), fa_1))) {
    return lookup_arg_val(opts, fa_1);
  }
  ;
}, "resolve_ctx_from_opts");
var should_use_context_dispatch_QMARK_ = /* @__PURE__ */ __name(function(fn_key, fn_def, opts) {
  const and_1_2 = is_c_context_fn_QMARK_(fn_key, fn_def);
  if (squint_core5.truth_(and_1_2)) {
    return is_context_QMARK_(resolve_ctx_from_opts(fn_def, opts));
  } else {
    return and_1_2;
  }
  ;
}, "should_use_context_dispatch_QMARK_");
var get_remaining_args = /* @__PURE__ */ __name(function(opts, fn_def) {
  const first_arg_name_1 = first_arg_kw(fn_def);
  return extract_args(fn_def, squint_core5.dissoc(squint_core5.dissoc(opts, first_arg_name_1), first_arg_name_1 === "ctx" ? "context" : "ctx"), { "skip-first?": true });
}, "get_remaining_args");
var needs_auto_context_QMARK_ = /* @__PURE__ */ __name(function(fn_key, fn_def, opts) {
  const and_1_2 = is_c_context_fn_QMARK_(fn_key, fn_def);
  if (squint_core5.truth_(and_1_2)) {
    return resolve_ctx_from_opts(fn_def, opts) == null;
  } else {
    return and_1_2;
  }
  ;
}, "needs_auto_context_QMARK_");
var context_from_pj_args = /* @__PURE__ */ __name(function(fn_def, opts) {
  return squint_core5.some(function(p__5375) {
    const vec___1_4 = p__5375;
    const arg_spec_5 = squint_core5.nth(vec___1_4, 0, null);
    const __6 = squint_core5.nth(vec___1_4, 1, null);
    const v_7 = squint_core5.get(opts, arg_spec_5);
    if (squint_core5.truth_((() => {
      const and_8_9 = squint_core5.object_QMARK_(v_7);
      if (squint_core5.truth_(and_8_9)) {
        return !(v_7._proj_context == null);
      } else {
        return and_8_9;
      }
      ;
    })())) {
      return v_7._proj_context;
    }
    ;
  }, squint_core5.rest(squint_core5.get(fn_def, "argtypes")));
}, "context_from_pj_args");
var attach_context_to_result = /* @__PURE__ */ __name(function(result, ctx) {
  if (squint_core5.truth_(result)) {
    if (squint_core5.truth_(squint_core5.object_QMARK_(result))) {
      result["_proj_context"] = ctx;
    }
    ;
    return result;
  }
  ;
}, "attach_context_to_result");
var destroy_temporaries_BANG_ = /* @__PURE__ */ __name(async function(temps) {
  for (let G__1 of squint_core5.iterable(temps)) {
    const pj_2 = G__1;
    if (squint_core5.truth_(squint_core5.object_QMARK_(pj_2))) {
      await build_pj_destroy_fn(current_pool(), pj_2.worker_idx, pj_2.ptr, "proj_destroy", pj_2._ephemeral_context_ptr, pj_2._ephemeral_context_worker_idx)();
    }
  }
  return null;
}, "destroy_temporaries_BANG_");
var reconcile_cross_worker_args_BANG_ = /* @__PURE__ */ __name(async function(fn_def, opts) {
  const worker_count_1 = get_worker_count();
  if (worker_count_1 == null || worker_count_1 <= 1) {
    return [opts, null];
  } else {
    const pj_args_2 = squint_core5.into([], squint_core5.keep(function(p__5786) {
      const vec___3_6 = p__5786;
      const arg_spec_7 = squint_core5.nth(vec___3_6, 0, null);
      const __8 = squint_core5.nth(vec___3_6, 1, null);
      const arg_name_9 = `${arg_spec_7 ?? ""}`;
      const v_10 = squint_core5.get(opts, arg_spec_7);
      if (squint_core5.truth_((() => {
        const and_11_12 = squint_core5.object_QMARK_(v_10);
        if (squint_core5.truth_(and_11_12)) {
          if (v_10.type === "pj") {
            return true;
          } else {
            return v_10.type === "proj-context";
          }
        } else {
          return and_11_12;
        }
        ;
      })())) {
        return { "arg-name": arg_name_9, "value": v_10, "worker-idx": v_10.worker_idx, "type": v_10.type };
      }
      ;
    }), squint_core5.get(fn_def, "argtypes"));
    const worker_indices_13 = squint_core5.into(/* @__PURE__ */ new Set([]), squint_core5.map("worker-idx"), pj_args_2);
    if (squint_core5.count(worker_indices_13) <= 1) {
      return [opts, null];
    } else {
      const target_worker_14 = squint_core5.get(squint_core5.first(squint_core5.filter(function(_PERCENT_1) {
        return squint_core5.get(_PERCENT_1, "type") === "pj";
      }, pj_args_2)), "value").worker_idx;
      const desc_15 = `${"proj-wasm: PJ args are on different workers ("}${string.join(", ", squint_core5.map(function(_PERCENT_1) {
        return `${squint_core5.get(_PERCENT_1, "arg-name") ?? ""}${" on worker "}${squint_core5.get(_PERCENT_1, "worker-idx") ?? ""}`;
      }, pj_args_2)) ?? ""}${"). Recreating on worker "}${target_worker_14 ?? ""}${". For better performance, use an explicit context."}`;
      const opts_16 = Object.assign({}, opts);
      const temps_17 = [];
      console.warn(desc_15);
      const target_ctx_18 = await (async () => {
        const or_26_27 = squint_core5.some(function(p__6122) {
          const map___19_21 = p__6122;
          const map___19_22 = squint_core5.truth_(squint_core5.sequential_QMARK_(map___19_21)) ? squint_core5.truth_(squint_core5.vector_QMARK_(map___19_21)) ? map___19_21 : squint_core5.seq_to_map_for_destructuring(map___19_21) : map___19_21;
          const value_23 = squint_core5.get(map___19_22, "value");
          const worker_idx_24 = squint_core5.get(map___19_22, "worker-idx");
          const type_25 = squint_core5.get(map___19_22, "type");
          if (squint_core5._EQ_(worker_idx_24, target_worker_14) && type_25 === "pj") {
            return value_23._proj_context;
          }
          ;
        }, pj_args_2);
        if (squint_core5.truth_(or_26_27)) {
          return or_26_27;
        } else {
          return await context_create({ "worker": target_worker_14 });
        }
        ;
      })();
      try {
        for (let G__28 of squint_core5.iterable(pj_args_2)) {
          const map___29_31 = G__28;
          const map___29_32 = squint_core5.truth_(squint_core5.sequential_QMARK_(map___29_31)) ? squint_core5.truth_(squint_core5.vector_QMARK_(map___29_31)) ? map___29_31 : squint_core5.seq_to_map_for_destructuring(map___29_31) : map___29_31;
          const arg_name_33 = squint_core5.get(map___29_32, "arg-name");
          const value_34 = squint_core5.get(map___29_32, "value");
          const worker_idx_35 = squint_core5.get(map___29_32, "worker-idx");
          const type_36 = squint_core5.get(map___29_32, "type");
          if (!squint_core5._EQ_(worker_idx_35, target_worker_14) && type_36 === "pj") {
            const src_ctx_37 = await (async () => {
              const or_38_39 = value_34._proj_context;
              if (squint_core5.truth_(or_38_39)) {
                return or_38_39;
              } else {
                return await context_create({ "worker": worker_idx_35 });
              }
              ;
            })();
            const projjson_40 = await call_native("proj_as_projjson", [src_ctx_37, value_34, 0]);
            if (projjson_40 == null || squint_core5._EQ_(projjson_40, "")) {
              throw new Error(`${"Cannot reconcile "}${arg_name_33 ?? ""}${" across workers: PROJJSON export failed. Use an explicit context."}`);
            }
            ;
            const identity_op_41 = await call_native("proj_create_crs_to_crs", null, [target_ctx_18, projjson_40, projjson_40, 0], target_worker_14);
            const __42 = temps_17.push(identity_op_41);
            const new_pj_43 = await call_native("proj_get_source_crs", null, [target_ctx_18, identity_op_41], target_worker_14);
            temps_17.push(new_pj_43);
            new_pj_43["_proj_context"] = target_ctx_18;
            opts_16[arg_name_33] = new_pj_43;
          }
          ;
          if (!squint_core5._EQ_(worker_idx_35, target_worker_14) && type_36 === "proj-context") {
            opts_16[arg_name_33] = target_ctx_18;
          }
        }
      } catch (e_44) {
        await destroy_temporaries_BANG_(temps_17);
        throw e_44;
      }
      ;
      return [opts_16, temps_17];
    }
    ;
  }
  ;
}, "reconcile_cross_worker_args_BANG_");
var camel_keys = /* @__PURE__ */ __name(function(obj) {
  const out_1 = {};
  Object.keys(obj).forEach(function(k) {
    return out_1[underscore__GT_camelCase2(k)] = obj[k];
  });
  return out_1;
}, "camel_keys");
var convert_js_result_keys = /* @__PURE__ */ __name(function(result, key_casing) {
  if (!(key_casing === "camel")) {
    return result;
  } else {
    if (squint_core5.truth_(squint_core5.array_QMARK_(result))) {
      return result.map(camel_keys);
    } else {
      if (squint_core5.truth_(result)) {
        return camel_keys(result);
      } else {
        return null;
      }
    }
  }
  ;
}, "convert_js_result_keys");
var dispatch_out_data = /* @__PURE__ */ __name(async function(fn_key, fn_def, opts, key_casing) {
  const args_1 = extract_args(fn_def, opts);
  return convert_js_result_keys(await call_native(fn_key, fn_def, args_1), key_casing);
}, "dispatch_out_data");
var destroy_fn_keys = squint_core5.set(squint_core5.map(squint_core5.keyword, squint_core5.vals(proj_type__GT_destroy_fn)));
var tracked_release = /* @__PURE__ */ __name(function(fn_key, fn_def, opts) {
  if (squint_core5.truth_(squint_core5.contains_QMARK_(destroy_fn_keys, fn_key))) {
    const v_1 = lookup_arg_val(opts, squint_core5.ffirst(squint_core5.get(fn_def, "argtypes")));
    if (squint_core5.truth_(squint_core5.object_QMARK_(v_1))) {
      const dispose_2 = v_1[Symbol.dispose];
      if (squint_core5.truth_(squint_core5.fn_QMARK_(dispose_2))) {
        return dispose_2;
      }
      ;
    }
    ;
  }
  ;
}, "tracked_release");
var dispatch_by_return_type = /* @__PURE__ */ __name(async function(fn_key, fn_def, opts, key_casing) {
  const proj_returns_1 = squint_core5.get(fn_def, "proj-returns");
  const G__7038_2 = proj_returns_1;
  switch (G__7038_2) {
    case "struct-list":
      return await dispatch_out_data(fn_key, fn_def, opts, key_casing);
      break;
    case "out-params":
      return await dispatch_out_data(fn_key, fn_def, opts, key_casing);
      break;
    default:
      const ctx_for_result_4 = "pj" === proj_returns_1 ? resolve_ctx_from_opts(fn_def, opts) : null;
      const result_5 = squint_core5.truth_(should_use_context_dispatch_QMARK_(fn_key, fn_def, opts)) ? await dispatch_context_fn(fn_key, fn_def, resolve_ctx_from_opts(fn_def, opts), get_remaining_args(opts, fn_def)) : await call_checked(fn_key, fn_def, extract_args(fn_def, opts));
      const result_6 = squint_core5.truth_(ctx_for_result_4) ? attach_context_to_result(result_5, ctx_for_result_4) : result_5;
      return process_return_value_with_tracking(result_6, fn_def);
  }
  ;
}, "dispatch_by_return_type");
var dispatch_proj_fn = /* @__PURE__ */ (() => {
  const impl7154_1 = /* @__PURE__ */ __name(async function(fn_key, fn_def, opts, p__7180) {
    const vec___2_5 = p__7180;
    const key_casing_6 = squint_core5.nth(vec___2_5, 0, null);
    ensure_initialized_BANG_();
    const temp__23177__auto___7 = tracked_release(fn_key, fn_def, opts);
    if (squint_core5.truth_(temp__23177__auto___7)) {
      const release_BANG__8 = temp__23177__auto___7;
      release_BANG__8();
      return null;
    } else {
      const opts_9 = squint_core5.truth_(needs_auto_context_QMARK_(fn_key, fn_def, opts)) ? await (async () => {
        const ctx_10 = await (async () => {
          const or_11_12 = context_from_pj_args(fn_def, opts);
          if (squint_core5.truth_(or_11_12)) {
            return or_11_12;
          } else {
            return await context_create({});
          }
          ;
        })();
        return squint_core5.assoc(opts, "context", ctx_10);
      })() : opts;
      const vec___13_16 = await reconcile_cross_worker_args_BANG_(fn_def, opts_9);
      const opts_17 = squint_core5.nth(vec___13_16, 0, null);
      const temps_18 = squint_core5.nth(vec___13_16, 1, null);
      try {
        return await dispatch_by_return_type(fn_key, fn_def, opts_17, key_casing_6);
      } finally {
        if (squint_core5.truth_(temps_18)) {
          await destroy_temporaries_BANG_(temps_18);
        }
      }
      ;
    }
    ;
  }, "impl7154_1");
  const f7149 = /* @__PURE__ */ __name(function(arg7150, arg7151, arg7152, ...rest7153) {
    const self__23348__auto___19 = this;
    return impl7154_1.call(self__23348__auto___19, arg7150, arg7151, arg7152, rest7153.length === 0 ? null : rest7153);
  }, "f7149");
  f7149["squint$lang$variadic"] = impl7154_1;
  return f7149;
})();
var lib = dispatch2.library({ "key": "net.willcohen.proj", "fndefs": fndefs, "impl-atom": implementation, "ffi-impl-ns": "net.willcohen.proj.impl.native", "hooks": { "extras-builder": proj_extras_builder, "result-wrapper": proj_result_wrapper, "context-isolator": proj_context_isolator } });
var proj_crs_create_bound_crs = /* @__PURE__ */ (() => {
  let f7466_1 = null;
  const impl7469_2 = /* @__PURE__ */ __name(function() {
    return proj_crs_create_bound_crs({});
  }, "impl7469_2");
  const impl7470_3 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_create_bound_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["base_crs", "pointer"], ["hub_crs", "pointer"], ["transformation", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl7470_3");
  f7466_1 = /* @__PURE__ */ __name(function(...args7467) {
    const self7471_4 = this;
    const G__7542_5 = args7467.length;
    switch (G__7542_5) {
      case 0:
        return impl7469_2.call(self7471_4);
        break;
      case 1:
        return impl7470_3.call(self7471_4, args7467[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args7467.length ?? ""}`);
    }
    ;
  }, "f7466_1");
  return f7466_1;
})();
var proj_context_create = /* @__PURE__ */ (() => {
  let f7623_7 = null;
  const impl7626_8 = /* @__PURE__ */ __name(function() {
    return proj_context_create({});
  }, "impl7626_8");
  const impl7627_9 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_create", { "rettype": "pointer", "argtypes": [], "proj-returns": "pj-context" }, opts__209__auto__);
  }, "impl7627_9");
  f7623_7 = /* @__PURE__ */ __name(function(...args7624) {
    const self7628_10 = this;
    const G__7699_11 = args7624.length;
    switch (G__7699_11) {
      case 0:
        return impl7626_8.call(self7628_10);
        break;
      case 1:
        return impl7627_9.call(self7628_10, args7624[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args7624.length ?? ""}`);
    }
    ;
  }, "f7623_7");
  return f7623_7;
})();
var proj_get_crs_list_parameters_create = /* @__PURE__ */ (() => {
  let f7780_13 = null;
  const impl7783_14 = /* @__PURE__ */ __name(function() {
    return proj_get_crs_list_parameters_create({});
  }, "impl7783_14");
  const impl7784_15 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_crs_list_parameters_create", { "rettype": "pointer", "argtypes": [], "proj-returns": "pj-crs-list-parameters" }, opts__209__auto__);
  }, "impl7784_15");
  f7780_13 = /* @__PURE__ */ __name(function(...args7781) {
    const self7785_16 = this;
    const G__7856_17 = args7781.length;
    switch (G__7856_17) {
      case 0:
        return impl7783_14.call(self7785_16);
        break;
      case 1:
        return impl7784_15.call(self7785_16, args7781[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args7781.length ?? ""}`);
    }
    ;
  }, "f7780_13");
  return f7780_13;
})();
var proj_is_deprecated = /* @__PURE__ */ (() => {
  let f7937_19 = null;
  const impl7940_20 = /* @__PURE__ */ __name(function() {
    return proj_is_deprecated({});
  }, "impl7940_20");
  const impl7941_21 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_is_deprecated", { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, opts__209__auto__);
  }, "impl7941_21");
  f7937_19 = /* @__PURE__ */ __name(function(...args7938) {
    const self7942_22 = this;
    const G__8013_23 = args7938.length;
    switch (G__8013_23) {
      case 0:
        return impl7940_20.call(self7942_22);
        break;
      case 1:
        return impl7941_21.call(self7942_22, args7938[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args7938.length ?? ""}`);
    }
    ;
  }, "f7937_19");
  return f7937_19;
})();
var proj_create_from_name = /* @__PURE__ */ (() => {
  let f8094_25 = null;
  const impl8097_26 = /* @__PURE__ */ __name(function() {
    return proj_create_from_name({});
  }, "impl8097_26");
  const impl8098_27 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_from_name", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["searchedName", "string"], ["types", "pointer"], ["typesCount", "size-t"], ["approximateMatch", "int32"], ["limitResultCount", "size-t"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj-list" }, opts__209__auto__);
  }, "impl8098_27");
  f8094_25 = /* @__PURE__ */ __name(function(...args8095) {
    const self8099_28 = this;
    const G__8170_29 = args8095.length;
    switch (G__8170_29) {
      case 0:
        return impl8097_26.call(self8099_28);
        break;
      case 1:
        return impl8098_27.call(self8099_28, args8095[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args8095.length ?? ""}`);
    }
    ;
  }, "f8094_25");
  return f8094_25;
})();
var proj_prime_meridian_get_parameters = /* @__PURE__ */ (() => {
  let f8251_31 = null;
  const impl8254_32 = /* @__PURE__ */ __name(function() {
    return proj_prime_meridian_get_parameters({});
  }, "impl8254_32");
  const impl8255_33 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_prime_meridian_get_parameters", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["longitude", "double"], ["unit-conv-factor", "double"], ["unit-name", "string"]], "argtypes": [["ctx", "pointer"], ["prime_meridian", "pointer"], ["out_longitude", "pointer"], ["out_unit_conv_factor", "pointer"], ["out_unit_name", "pointer"]] }, opts__209__auto__);
  }, "impl8255_33");
  f8251_31 = /* @__PURE__ */ __name(function(...args8252) {
    const self8256_34 = this;
    const G__8327_35 = args8252.length;
    switch (G__8327_35) {
      case 0:
        return impl8254_32.call(self8256_34);
        break;
      case 1:
        return impl8255_33.call(self8256_34, args8252[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args8252.length ?? ""}`);
    }
    ;
  }, "f8251_31");
  return f8251_31;
})();
var proj_string_destroy = /* @__PURE__ */ (() => {
  let f8408_37 = null;
  const impl8411_38 = /* @__PURE__ */ __name(function() {
    return proj_string_destroy({});
  }, "impl8411_38");
  const impl8412_39 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_string_destroy", { "rettype": "void", "argtypes": [["str", "pointer"]] }, opts__209__auto__);
  }, "impl8412_39");
  f8408_37 = /* @__PURE__ */ __name(function(...args8409) {
    const self8413_40 = this;
    const G__8484_41 = args8409.length;
    switch (G__8484_41) {
      case 0:
        return impl8411_38.call(self8413_40);
        break;
      case 1:
        return impl8412_39.call(self8413_40, args8409[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args8409.length ?? ""}`);
    }
    ;
  }, "f8408_37");
  return f8408_37;
})();
var proj_log_func = /* @__PURE__ */ (() => {
  let f8565_43 = null;
  const impl8568_44 = /* @__PURE__ */ __name(function() {
    return proj_log_func({});
  }, "impl8568_44");
  const impl8569_45 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_log_func", { "rettype": "void", "argtypes": [["context", "pointer"], ["app_data", "pointer?"], ["logf", "pointer"]] }, opts__209__auto__);
  }, "impl8569_45");
  f8565_43 = /* @__PURE__ */ __name(function(...args8566) {
    const self8570_46 = this;
    const G__8641_47 = args8566.length;
    switch (G__8641_47) {
      case 0:
        return impl8568_44.call(self8570_46);
        break;
      case 1:
        return impl8569_45.call(self8570_46, args8566[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args8566.length ?? ""}`);
    }
    ;
  }, "f8565_43");
  return f8565_43;
})();
var proj_create_geocentric_crs = /* @__PURE__ */ (() => {
  let f8722_49 = null;
  const impl8725_50 = /* @__PURE__ */ __name(function() {
    return proj_create_geocentric_crs({});
  }, "impl8725_50");
  const impl8726_51 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_geocentric_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["ellps_name", "string"], ["semi_major_metre", "float64"], ["inv_flattening", "float64"], ["prime_meridian_name", "string"], ["prime_meridian_offset", "float64"], ["angular_units", "string"], ["angular_units_conv", "float64"], ["linear_units", "string"], ["linear_units_conv", "float64"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl8726_51");
  f8722_49 = /* @__PURE__ */ __name(function(...args8723) {
    const self8727_52 = this;
    const G__8798_53 = args8723.length;
    switch (G__8798_53) {
      case 0:
        return impl8725_50.call(self8727_52);
        break;
      case 1:
        return impl8726_51.call(self8727_52, args8723[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args8723.length ?? ""}`);
    }
    ;
  }, "f8722_49");
  return f8722_49;
})();
var proj_unit_list_destroy = /* @__PURE__ */ (() => {
  let f8879_55 = null;
  const impl8882_56 = /* @__PURE__ */ __name(function() {
    return proj_unit_list_destroy({});
  }, "impl8882_56");
  const impl8883_57 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_unit_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__209__auto__);
  }, "impl8883_57");
  f8879_55 = /* @__PURE__ */ __name(function(...args8880) {
    const self8884_58 = this;
    const G__8955_59 = args8880.length;
    switch (G__8955_59) {
      case 0:
        return impl8882_56.call(self8884_58);
        break;
      case 1:
        return impl8883_57.call(self8884_58, args8880[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args8880.length ?? ""}`);
    }
    ;
  }, "f8879_55");
  return f8879_55;
})();
var proj_assign_context = /* @__PURE__ */ (() => {
  let f9036_61 = null;
  const impl9039_62 = /* @__PURE__ */ __name(function() {
    return proj_assign_context({});
  }, "impl9039_62");
  const impl9040_63 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_assign_context", { "rettype": "void", "argtypes": [["pj", "pointer"], ["context", "pointer"]] }, opts__209__auto__);
  }, "impl9040_63");
  f9036_61 = /* @__PURE__ */ __name(function(...args9037) {
    const self9041_64 = this;
    const G__9112_65 = args9037.length;
    switch (G__9112_65) {
      case 0:
        return impl9039_62.call(self9041_64);
        break;
      case 1:
        return impl9040_63.call(self9041_64, args9037[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args9037.length ?? ""}`);
    }
    ;
  }, "f9036_61");
  return f9036_61;
})();
var proj_crs_create_projected_3D_crs_from_2D = /* @__PURE__ */ (() => {
  let f9193_67 = null;
  const impl9196_68 = /* @__PURE__ */ __name(function() {
    return proj_crs_create_projected_3D_crs_from_2D({});
  }, "impl9196_68");
  const impl9197_69 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_create_projected_3D_crs_from_2D", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["projected_2D_crs", "pointer"], ["geog_3D_crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl9197_69");
  f9193_67 = /* @__PURE__ */ __name(function(...args9194) {
    const self9198_70 = this;
    const G__9269_71 = args9194.length;
    switch (G__9269_71) {
      case 0:
        return impl9196_68.call(self9198_70);
        break;
      case 1:
        return impl9197_69.call(self9198_70, args9194[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args9194.length ?? ""}`);
    }
    ;
  }, "f9193_67");
  return f9193_67;
})();
var proj_operation_factory_context_set_area_of_interest_name = /* @__PURE__ */ (() => {
  let f9350_73 = null;
  const impl9353_74 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_area_of_interest_name({});
  }, "impl9353_74");
  const impl9354_75 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_area_of_interest_name", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["area_name", "string"]] }, opts__209__auto__);
  }, "impl9354_75");
  f9350_73 = /* @__PURE__ */ __name(function(...args9351) {
    const self9355_76 = this;
    const G__9426_77 = args9351.length;
    switch (G__9426_77) {
      case 0:
        return impl9353_74.call(self9355_76);
        break;
      case 1:
        return impl9354_75.call(self9355_76, args9351[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args9351.length ?? ""}`);
    }
    ;
  }, "f9350_73");
  return f9350_73;
})();
var proj_get_ellipsoid = /* @__PURE__ */ (() => {
  let f9507_79 = null;
  const impl9510_80 = /* @__PURE__ */ __name(function() {
    return proj_get_ellipsoid({});
  }, "impl9510_80");
  const impl9511_81 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_ellipsoid", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl9511_81");
  f9507_79 = /* @__PURE__ */ __name(function(...args9508) {
    const self9512_82 = this;
    const G__9583_83 = args9508.length;
    switch (G__9583_83) {
      case 0:
        return impl9510_80.call(self9512_82);
        break;
      case 1:
        return impl9511_81.call(self9512_82, args9508[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args9508.length ?? ""}`);
    }
    ;
  }, "f9507_79");
  return f9507_79;
})();
var proj_coordoperation_get_grid_used = /* @__PURE__ */ (() => {
  let f9664_85 = null;
  const impl9667_86 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_get_grid_used({});
  }, "impl9667_86");
  const impl9668_87 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_grid_used", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["short-name", "string"], ["full-name", "string"], ["package-name", "string"], ["url", "string"], ["direct-download", "int"], ["open-license", "int"], ["available", "int"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["index", "int32"], ["out_short_name", "pointer"], ["out_full_name", "pointer"], ["out_package_name", "pointer"], ["out_url", "pointer"], ["out_direct_download", "pointer"], ["out_open_license", "pointer"], ["out_available", "pointer"]] }, opts__209__auto__);
  }, "impl9668_87");
  f9664_85 = /* @__PURE__ */ __name(function(...args9665) {
    const self9669_88 = this;
    const G__9740_89 = args9665.length;
    switch (G__9740_89) {
      case 0:
        return impl9667_86.call(self9669_88);
        break;
      case 1:
        return impl9668_87.call(self9669_88, args9665[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args9665.length ?? ""}`);
    }
    ;
  }, "f9664_85");
  return f9664_85;
})();
var proj_crs_is_derived = /* @__PURE__ */ (() => {
  let f9821_91 = null;
  const impl9824_92 = /* @__PURE__ */ __name(function() {
    return proj_crs_is_derived({});
  }, "impl9824_92");
  const impl9825_93 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_is_derived", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, opts__209__auto__);
  }, "impl9825_93");
  f9821_91 = /* @__PURE__ */ __name(function(...args9822) {
    const self9826_94 = this;
    const G__9897_95 = args9822.length;
    switch (G__9897_95) {
      case 0:
        return impl9824_92.call(self9826_94);
        break;
      case 1:
        return impl9825_93.call(self9826_94, args9822[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args9822.length ?? ""}`);
    }
    ;
  }, "f9821_91");
  return f9821_91;
})();
var proj_int_list_destroy = /* @__PURE__ */ (() => {
  let f9978_97 = null;
  const impl9981_98 = /* @__PURE__ */ __name(function() {
    return proj_int_list_destroy({});
  }, "impl9981_98");
  const impl9982_99 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_int_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__209__auto__);
  }, "impl9982_99");
  f9978_97 = /* @__PURE__ */ __name(function(...args9979) {
    const self9983_100 = this;
    const G__10054_101 = args9979.length;
    switch (G__10054_101) {
      case 0:
        return impl9981_98.call(self9983_100);
        break;
      case 1:
        return impl9982_99.call(self9983_100, args9979[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args9979.length ?? ""}`);
    }
    ;
  }, "f9978_97");
  return f9978_97;
})();
var proj_crs_get_coordinate_system = /* @__PURE__ */ (() => {
  let f10135_103 = null;
  const impl10138_104 = /* @__PURE__ */ __name(function() {
    return proj_crs_get_coordinate_system({});
  }, "impl10138_104");
  const impl10139_105 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_get_coordinate_system", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl10139_105");
  f10135_103 = /* @__PURE__ */ __name(function(...args10136) {
    const self10140_106 = this;
    const G__10211_107 = args10136.length;
    switch (G__10211_107) {
      case 0:
        return impl10138_104.call(self10140_106);
        break;
      case 1:
        return impl10139_105.call(self10140_106, args10136[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args10136.length ?? ""}`);
    }
    ;
  }, "f10135_103");
  return f10135_103;
})();
var proj_context_set_database_path = /* @__PURE__ */ (() => {
  let f10292_109 = null;
  const impl10295_110 = /* @__PURE__ */ __name(function() {
    return proj_context_set_database_path({});
  }, "impl10295_110");
  const impl10296_111 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_set_database_path", { "rettype": "int32", "argtypes": [["context", "pointer"], ["db-path", "string"], ["aux-db-paths", "pointer?"], ["options", "pointer?"]] }, opts__209__auto__);
  }, "impl10296_111");
  f10292_109 = /* @__PURE__ */ __name(function(...args10293) {
    const self10297_112 = this;
    const G__10368_113 = args10293.length;
    switch (G__10368_113) {
      case 0:
        return impl10295_110.call(self10297_112);
        break;
      case 1:
        return impl10296_111.call(self10297_112, args10293[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args10293.length ?? ""}`);
    }
    ;
  }, "f10292_109");
  return f10292_109;
})();
var proj_get_crs_info_list_from_database = /* @__PURE__ */ (() => {
  let f10449_115 = null;
  const impl10452_116 = /* @__PURE__ */ __name(function() {
    return proj_get_crs_info_list_from_database({});
  }, "impl10452_116");
  const impl10453_117 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_crs_info_list_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["params", "pointer"], ["out_result_count", "pointer"]], "proj-returns": "struct-list", "struct-def": "proj-crs-info", "struct-fields": [["auth-name", "string", 0], ["code", "string", 4], ["name", "string", 8], ["type", "int", 12], ["deprecated", "boolean", 16], ["bbox-valid", "boolean", 20], ["west-lon-degree", "double", 24], ["south-lat-degree", "double", 32], ["east-lon-degree", "double", 40], ["north-lat-degree", "double", 48], ["area-name", "string", 56], ["projection-method-name", "string", 60], ["celestial-body-name", "string", 64]], "struct-destroy-fn": "proj_crs_info_list_destroy", "struct-params-create": "proj_get_crs_list_parameters_create", "struct-params-destroy": "proj_get_crs_list_parameters_destroy" }, opts__209__auto__);
  }, "impl10453_117");
  f10449_115 = /* @__PURE__ */ __name(function(...args10450) {
    const self10454_118 = this;
    const G__10525_119 = args10450.length;
    switch (G__10525_119) {
      case 0:
        return impl10452_116.call(self10454_118);
        break;
      case 1:
        return impl10453_117.call(self10454_118, args10450[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args10450.length ?? ""}`);
    }
    ;
  }, "f10449_115");
  return f10449_115;
})();
var proj_is_equivalent_to = /* @__PURE__ */ (() => {
  let f10606_121 = null;
  const impl10609_122 = /* @__PURE__ */ __name(function() {
    return proj_is_equivalent_to({});
  }, "impl10609_122");
  const impl10610_123 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_is_equivalent_to", { "rettype": "int32", "argtypes": [["obj", "pointer"], ["other", "pointer"], ["criterion", "int32"]] }, opts__209__auto__);
  }, "impl10610_123");
  f10606_121 = /* @__PURE__ */ __name(function(...args10607) {
    const self10611_124 = this;
    const G__10682_125 = args10607.length;
    switch (G__10682_125) {
      case 0:
        return impl10609_122.call(self10611_124);
        break;
      case 1:
        return impl10610_123.call(self10611_124, args10607[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args10607.length ?? ""}`);
    }
    ;
  }, "f10606_121");
  return f10606_121;
})();
var proj_context_set_enable_network = /* @__PURE__ */ (() => {
  let f10763_127 = null;
  const impl10766_128 = /* @__PURE__ */ __name(function() {
    return proj_context_set_enable_network({});
  }, "impl10766_128");
  const impl10767_129 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_set_enable_network", { "rettype": "int32", "argtypes": [["context", "pointer"], ["enabled", "int32"]] }, opts__209__auto__);
  }, "impl10767_129");
  f10763_127 = /* @__PURE__ */ __name(function(...args10764) {
    const self10768_130 = this;
    const G__10839_131 = args10764.length;
    switch (G__10839_131) {
      case 0:
        return impl10766_128.call(self10768_130);
        break;
      case 1:
        return impl10767_129.call(self10768_130, args10764[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args10764.length ?? ""}`);
    }
    ;
  }, "f10763_127");
  return f10763_127;
})();
var proj_crs_create_bound_vertical_crs = /* @__PURE__ */ (() => {
  let f10920_133 = null;
  const impl10923_134 = /* @__PURE__ */ __name(function() {
    return proj_crs_create_bound_vertical_crs({});
  }, "impl10923_134");
  const impl10924_135 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_create_bound_vertical_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["vert_crs", "pointer"], ["hub_geographic_3D_crs", "pointer"], ["grid_name", "string"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl10924_135");
  f10920_133 = /* @__PURE__ */ __name(function(...args10921) {
    const self10925_136 = this;
    const G__10996_137 = args10921.length;
    switch (G__10996_137) {
      case 0:
        return impl10923_134.call(self10925_136);
        break;
      case 1:
        return impl10924_135.call(self10925_136, args10921[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args10921.length ?? ""}`);
    }
    ;
  }, "f10920_133");
  return f10920_133;
})();
var proj_operation_factory_context_set_crs_extent_use = /* @__PURE__ */ (() => {
  let f11077_139 = null;
  const impl11080_140 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_crs_extent_use({});
  }, "impl11080_140");
  const impl11081_141 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_crs_extent_use", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["use", "int32"]] }, opts__209__auto__);
  }, "impl11081_141");
  f11077_139 = /* @__PURE__ */ __name(function(...args11078) {
    const self11082_142 = this;
    const G__11153_143 = args11078.length;
    switch (G__11153_143) {
      case 0:
        return impl11080_140.call(self11082_142);
        break;
      case 1:
        return impl11081_141.call(self11082_142, args11078[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args11078.length ?? ""}`);
    }
    ;
  }, "f11077_139");
  return f11077_139;
})();
var proj_create_geographic_crs = /* @__PURE__ */ (() => {
  let f11234_145 = null;
  const impl11237_146 = /* @__PURE__ */ __name(function() {
    return proj_create_geographic_crs({});
  }, "impl11237_146");
  const impl11238_147 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_geographic_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["ellps_name", "string"], ["semi_major_metre", "float64"], ["inv_flattening", "float64"], ["prime_meridian_name", "string"], ["prime_meridian_offset", "float64"], ["pm_angular_units", "string"], ["pm_units_conv", "float64"], ["ellipsoidal_cs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl11238_147");
  f11234_145 = /* @__PURE__ */ __name(function(...args11235) {
    const self11239_148 = this;
    const G__11310_149 = args11235.length;
    switch (G__11310_149) {
      case 0:
        return impl11237_146.call(self11239_148);
        break;
      case 1:
        return impl11238_147.call(self11239_148, args11235[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args11235.length ?? ""}`);
    }
    ;
  }, "f11234_145");
  return f11234_145;
})();
var proj_coordoperation_get_grid_used_count = /* @__PURE__ */ (() => {
  let f11391_151 = null;
  const impl11394_152 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_get_grid_used_count({});
  }, "impl11394_152");
  const impl11395_153 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_grid_used_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__209__auto__);
  }, "impl11395_153");
  f11391_151 = /* @__PURE__ */ __name(function(...args11392) {
    const self11396_154 = this;
    const G__11467_155 = args11392.length;
    switch (G__11467_155) {
      case 0:
        return impl11394_152.call(self11396_154);
        break;
      case 1:
        return impl11395_153.call(self11396_154, args11392[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args11392.length ?? ""}`);
    }
    ;
  }, "f11391_151");
  return f11391_151;
})();
var proj_list_get_count = /* @__PURE__ */ (() => {
  let f11548_157 = null;
  const impl11551_158 = /* @__PURE__ */ __name(function() {
    return proj_list_get_count({});
  }, "impl11551_158");
  const impl11552_159 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_list_get_count", { "rettype": "int32", "argtypes": [["result", "pointer"]] }, opts__209__auto__);
  }, "impl11552_159");
  f11548_157 = /* @__PURE__ */ __name(function(...args11549) {
    const self11553_160 = this;
    const G__11624_161 = args11549.length;
    switch (G__11624_161) {
      case 0:
        return impl11551_158.call(self11553_160);
        break;
      case 1:
        return impl11552_159.call(self11553_160, args11549[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args11549.length ?? ""}`);
    }
    ;
  }, "f11548_157");
  return f11548_157;
})();
var proj_create_transformation = /* @__PURE__ */ (() => {
  let f11705_163 = null;
  const impl11708_164 = /* @__PURE__ */ __name(function() {
    return proj_create_transformation({});
  }, "impl11708_164");
  const impl11709_165 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_transformation", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["name", "string"], ["auth_name", "string"], ["code", "string"], ["source_crs", "pointer"], ["target_crs", "pointer"], ["interpolation_crs", "pointer"], ["method_name", "string"], ["method_auth_name", "string"], ["method_code", "string"], ["param_count", "int32"], ["params", "pointer"], ["accuracy", "float64"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl11709_165");
  f11705_163 = /* @__PURE__ */ __name(function(...args11706) {
    const self11710_166 = this;
    const G__11781_167 = args11706.length;
    switch (G__11781_167) {
      case 0:
        return impl11708_164.call(self11710_166);
        break;
      case 1:
        return impl11709_165.call(self11710_166, args11706[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args11706.length ?? ""}`);
    }
    ;
  }, "f11705_163");
  return f11705_163;
})();
var proj_coordoperation_get_accuracy = /* @__PURE__ */ (() => {
  let f11862_169 = null;
  const impl11865_170 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_get_accuracy({});
  }, "impl11865_170");
  const impl11866_171 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_accuracy", { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]] }, opts__209__auto__);
  }, "impl11866_171");
  f11862_169 = /* @__PURE__ */ __name(function(...args11863) {
    const self11867_172 = this;
    const G__11938_173 = args11863.length;
    switch (G__11938_173) {
      case 0:
        return impl11865_170.call(self11867_172);
        break;
      case 1:
        return impl11866_171.call(self11867_172, args11863[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args11863.length ?? ""}`);
    }
    ;
  }, "f11862_169");
  return f11862_169;
})();
var proj_coordoperation_get_param = /* @__PURE__ */ (() => {
  let f12019_175 = null;
  const impl12022_176 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_get_param({});
  }, "impl12022_176");
  const impl12023_177 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_param", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["name", "string"], ["auth-name", "string"], ["code", "string"], ["value", "double"], ["value-string", "string"], ["unit-conv-factor", "double"], ["unit-name", "string"], ["unit-auth-name", "string"], ["unit-code", "string"], ["unit-category", "string"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["index", "int32"], ["out_name", "pointer"], ["out_auth_name", "pointer"], ["out_code", "pointer"], ["out_value", "pointer"], ["out_value_string", "pointer"], ["out_unit_conv_factor", "pointer"], ["out_unit_name", "pointer"], ["out_unit_auth_name", "pointer"], ["out_unit_code", "pointer"], ["out_unit_category", "pointer"]] }, opts__209__auto__);
  }, "impl12023_177");
  f12019_175 = /* @__PURE__ */ __name(function(...args12020) {
    const self12024_178 = this;
    const G__12095_179 = args12020.length;
    switch (G__12095_179) {
      case 0:
        return impl12022_176.call(self12024_178);
        break;
      case 1:
        return impl12023_177.call(self12024_178, args12020[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args12020.length ?? ""}`);
    }
    ;
  }, "f12019_175");
  return f12019_175;
})();
var proj_create = /* @__PURE__ */ (() => {
  let f12176_181 = null;
  const impl12179_182 = /* @__PURE__ */ __name(function() {
    return proj_create({});
  }, "impl12179_182");
  const impl12180_183 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["definition", "string"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl12180_183");
  f12176_181 = /* @__PURE__ */ __name(function(...args12177) {
    const self12181_184 = this;
    const G__12252_185 = args12177.length;
    switch (G__12252_185) {
      case 0:
        return impl12179_182.call(self12181_184);
        break;
      case 1:
        return impl12180_183.call(self12181_184, args12177[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args12177.length ?? ""}`);
    }
    ;
  }, "f12176_181");
  return f12176_181;
})();
var proj_create_conversion = /* @__PURE__ */ (() => {
  let f12333_187 = null;
  const impl12336_188 = /* @__PURE__ */ __name(function() {
    return proj_create_conversion({});
  }, "impl12336_188");
  const impl12337_189 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_conversion", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["name", "string"], ["auth_name", "string"], ["code", "string"], ["method_name", "string"], ["method_auth_name", "string"], ["method_code", "string"], ["param_count", "int32"], ["params", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl12337_189");
  f12333_187 = /* @__PURE__ */ __name(function(...args12334) {
    const self12338_190 = this;
    const G__12409_191 = args12334.length;
    switch (G__12409_191) {
      case 0:
        return impl12336_188.call(self12338_190);
        break;
      case 1:
        return impl12337_189.call(self12338_190, args12334[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args12334.length ?? ""}`);
    }
    ;
  }, "f12333_187");
  return f12333_187;
})();
var proj_get_type = /* @__PURE__ */ (() => {
  let f12490_193 = null;
  const impl12493_194 = /* @__PURE__ */ __name(function() {
    return proj_get_type({});
  }, "impl12493_194");
  const impl12494_195 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_type", { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, opts__209__auto__);
  }, "impl12494_195");
  f12490_193 = /* @__PURE__ */ __name(function(...args12491) {
    const self12495_196 = this;
    const G__12566_197 = args12491.length;
    switch (G__12566_197) {
      case 0:
        return impl12493_194.call(self12495_196);
        break;
      case 1:
        return impl12494_195.call(self12495_196, args12491[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args12491.length ?? ""}`);
    }
    ;
  }, "f12490_193");
  return f12490_193;
})();
var proj_context_get_database_metadata = /* @__PURE__ */ (() => {
  let f12647_199 = null;
  const impl12650_200 = /* @__PURE__ */ __name(function() {
    return proj_context_get_database_metadata({});
  }, "impl12650_200");
  const impl12651_201 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_get_database_metadata", { "rettype": "string", "argtypes": [["context", "pointer"], ["key", "string"]] }, opts__209__auto__);
  }, "impl12651_201");
  f12647_199 = /* @__PURE__ */ __name(function(...args12648) {
    const self12652_202 = this;
    const G__12723_203 = args12648.length;
    switch (G__12723_203) {
      case 0:
        return impl12650_200.call(self12652_202);
        break;
      case 1:
        return impl12651_201.call(self12652_202, args12648[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args12648.length ?? ""}`);
    }
    ;
  }, "f12647_199");
  return f12647_199;
})();
var proj_crs_alter_geodetic_crs = /* @__PURE__ */ (() => {
  let f12804_205 = null;
  const impl12807_206 = /* @__PURE__ */ __name(function() {
    return proj_crs_alter_geodetic_crs({});
  }, "impl12807_206");
  const impl12808_207 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_alter_geodetic_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["new_geod_crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl12808_207");
  f12804_205 = /* @__PURE__ */ __name(function(...args12805) {
    const self12809_208 = this;
    const G__12880_209 = args12805.length;
    switch (G__12880_209) {
      case 0:
        return impl12807_206.call(self12809_208);
        break;
      case 1:
        return impl12808_207.call(self12809_208, args12805[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args12805.length ?? ""}`);
    }
    ;
  }, "f12804_205");
  return f12804_205;
})();
var proj_concatoperation_get_step_count = /* @__PURE__ */ (() => {
  let f12961_211 = null;
  const impl12964_212 = /* @__PURE__ */ __name(function() {
    return proj_concatoperation_get_step_count({});
  }, "impl12964_212");
  const impl12965_213 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_concatoperation_get_step_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["concatoperation", "pointer"]] }, opts__209__auto__);
  }, "impl12965_213");
  f12961_211 = /* @__PURE__ */ __name(function(...args12962) {
    const self12966_214 = this;
    const G__13037_215 = args12962.length;
    switch (G__13037_215) {
      case 0:
        return impl12964_212.call(self12966_214);
        break;
      case 1:
        return impl12965_213.call(self12966_214, args12962[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args12962.length ?? ""}`);
    }
    ;
  }, "f12961_211");
  return f12961_211;
})();
var proj_operation_factory_context_set_discard_superseded = /* @__PURE__ */ (() => {
  let f13118_217 = null;
  const impl13121_218 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_discard_superseded({});
  }, "impl13121_218");
  const impl13122_219 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_discard_superseded", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["discard", "int32"]] }, opts__209__auto__);
  }, "impl13122_219");
  f13118_217 = /* @__PURE__ */ __name(function(...args13119) {
    const self13123_220 = this;
    const G__13194_221 = args13119.length;
    switch (G__13194_221) {
      case 0:
        return impl13121_218.call(self13123_220);
        break;
      case 1:
        return impl13122_219.call(self13123_220, args13119[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args13119.length ?? ""}`);
    }
    ;
  }, "f13118_217");
  return f13118_217;
})();
var proj_is_derived_crs = /* @__PURE__ */ (() => {
  let f13275_223 = null;
  const impl13278_224 = /* @__PURE__ */ __name(function() {
    return proj_is_derived_crs({});
  }, "impl13278_224");
  const impl13279_225 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_is_derived_crs", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, opts__209__auto__);
  }, "impl13279_225");
  f13275_223 = /* @__PURE__ */ __name(function(...args13276) {
    const self13280_226 = this;
    const G__13351_227 = args13276.length;
    switch (G__13351_227) {
      case 0:
        return impl13278_224.call(self13280_226);
        break;
      case 1:
        return impl13279_225.call(self13280_226, args13276[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args13276.length ?? ""}`);
    }
    ;
  }, "f13275_223");
  return f13275_223;
})();
var proj_get_units_from_database = /* @__PURE__ */ (() => {
  let f13432_229 = null;
  const impl13435_230 = /* @__PURE__ */ __name(function() {
    return proj_get_units_from_database({});
  }, "impl13435_230");
  const impl13436_231 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_units_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["category", "string?"], ["allow_deprecated", "int32"], ["out_result_count", "pointer"]], "proj-returns": "struct-list", "struct-def": "proj-unit-info", "struct-fields": [["auth-name", "string", 0], ["code", "string", 4], ["name", "string", 8], ["category", "string", 12], ["conv-factor", "double", 16], ["proj-short-name", "string", 24], ["deprecated", "boolean", 28]], "struct-destroy-fn": "proj_unit_list_destroy" }, opts__209__auto__);
  }, "impl13436_231");
  f13432_229 = /* @__PURE__ */ __name(function(...args13433) {
    const self13437_232 = this;
    const G__13508_233 = args13433.length;
    switch (G__13508_233) {
      case 0:
        return impl13435_230.call(self13437_232);
        break;
      case 1:
        return impl13436_231.call(self13437_232, args13433[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args13433.length ?? ""}`);
    }
    ;
  }, "f13432_229");
  return f13432_229;
})();
var proj_crs_get_coordoperation = /* @__PURE__ */ (() => {
  let f13589_235 = null;
  const impl13592_236 = /* @__PURE__ */ __name(function() {
    return proj_crs_get_coordoperation({});
  }, "impl13592_236");
  const impl13593_237 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_get_coordoperation", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl13593_237");
  f13589_235 = /* @__PURE__ */ __name(function(...args13590) {
    const self13594_238 = this;
    const G__13665_239 = args13590.length;
    switch (G__13665_239) {
      case 0:
        return impl13592_236.call(self13594_238);
        break;
      case 1:
        return impl13593_237.call(self13594_238, args13590[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args13590.length ?? ""}`);
    }
    ;
  }, "f13589_235");
  return f13589_235;
})();
var proj_coordoperation_has_ballpark_transformation = /* @__PURE__ */ (() => {
  let f13746_241 = null;
  const impl13749_242 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_has_ballpark_transformation({});
  }, "impl13749_242");
  const impl13750_243 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_has_ballpark_transformation", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__209__auto__);
  }, "impl13750_243");
  f13746_241 = /* @__PURE__ */ __name(function(...args13747) {
    const self13751_244 = this;
    const G__13822_245 = args13747.length;
    switch (G__13822_245) {
      case 0:
        return impl13749_242.call(self13751_244);
        break;
      case 1:
        return impl13750_243.call(self13751_244, args13747[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args13747.length ?? ""}`);
    }
    ;
  }, "f13746_241");
  return f13746_241;
})();
var proj_get_area_of_use = /* @__PURE__ */ (() => {
  let f13903_247 = null;
  const impl13906_248 = /* @__PURE__ */ __name(function() {
    return proj_get_area_of_use({});
  }, "impl13906_248");
  const impl13907_249 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_area_of_use", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["west-lon-degree", "double"], ["south-lat-degree", "double"], ["east-lon-degree", "double"], ["north-lat-degree", "double"], ["area-name", "string"]], "argtypes": [["context", "pointer"], ["obj", "pointer"], ["out_west_lon_degree", "pointer"], ["out_south_lat_degree", "pointer"], ["out_east_lon_degree", "pointer"], ["out_north_lat_degree", "pointer"], ["out_area_name", "pointer"]] }, opts__209__auto__);
  }, "impl13907_249");
  f13903_247 = /* @__PURE__ */ __name(function(...args13904) {
    const self13908_250 = this;
    const G__13979_251 = args13904.length;
    switch (G__13979_251) {
      case 0:
        return impl13906_248.call(self13908_250);
        break;
      case 1:
        return impl13907_249.call(self13908_250, args13904[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args13904.length ?? ""}`);
    }
    ;
  }, "f13903_247");
  return f13903_247;
})();
var proj_context_errno_string = /* @__PURE__ */ (() => {
  let f14060_253 = null;
  const impl14063_254 = /* @__PURE__ */ __name(function() {
    return proj_context_errno_string({});
  }, "impl14063_254");
  const impl14064_255 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_errno_string", { "rettype": "string", "argtypes": [["context", "pointer"], ["err", "int32"]] }, opts__209__auto__);
  }, "impl14064_255");
  f14060_253 = /* @__PURE__ */ __name(function(...args14061) {
    const self14065_256 = this;
    const G__14136_257 = args14061.length;
    switch (G__14136_257) {
      case 0:
        return impl14063_254.call(self14065_256);
        break;
      case 1:
        return impl14064_255.call(self14065_256, args14061[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args14061.length ?? ""}`);
    }
    ;
  }, "f14060_253");
  return f14060_253;
})();
var proj_get_insert_statements = /* @__PURE__ */ (() => {
  let f14217_259 = null;
  const impl14220_260 = /* @__PURE__ */ __name(function() {
    return proj_get_insert_statements({});
  }, "impl14220_260");
  const impl14221_261 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_insert_statements", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["session", "pointer"], ["object", "pointer"], ["authority", "string"], ["code", "string"], ["numeric_codes", "int32"], ["allowed_authorities", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "string-list" }, opts__209__auto__);
  }, "impl14221_261");
  f14217_259 = /* @__PURE__ */ __name(function(...args14218) {
    const self14222_262 = this;
    const G__14293_263 = args14218.length;
    switch (G__14293_263) {
      case 0:
        return impl14220_260.call(self14222_262);
        break;
      case 1:
        return impl14221_261.call(self14222_262, args14218[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args14218.length ?? ""}`);
    }
    ;
  }, "f14217_259");
  return f14217_259;
})();
var proj_string_list_destroy = /* @__PURE__ */ (() => {
  let f14374_265 = null;
  const impl14377_266 = /* @__PURE__ */ __name(function() {
    return proj_string_list_destroy({});
  }, "impl14377_266");
  const impl14378_267 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_string_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__209__auto__);
  }, "impl14378_267");
  f14374_265 = /* @__PURE__ */ __name(function(...args14375) {
    const self14379_268 = this;
    const G__14450_269 = args14375.length;
    switch (G__14450_269) {
      case 0:
        return impl14377_266.call(self14379_268);
        break;
      case 1:
        return impl14378_267.call(self14379_268, args14375[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args14375.length ?? ""}`);
    }
    ;
  }, "f14374_265");
  return f14374_265;
})();
var proj_trans_array = /* @__PURE__ */ (() => {
  let f14531_271 = null;
  const impl14534_272 = /* @__PURE__ */ __name(function() {
    return proj_trans_array({});
  }, "impl14534_272");
  const impl14535_273 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_trans_array", { "rettype": "int32", "argtypes": [["p", "pointer"], ["direction", "int32"], ["n", "size-t"], ["coord", "pointer"]], "argsemantics": [["coord", "coord-array"], ["n", "coord-count"]] }, opts__209__auto__);
  }, "impl14535_273");
  f14531_271 = /* @__PURE__ */ __name(function(...args14532) {
    const self14536_274 = this;
    const G__14607_275 = args14532.length;
    switch (G__14607_275) {
      case 0:
        return impl14534_272.call(self14536_274);
        break;
      case 1:
        return impl14535_273.call(self14536_274, args14532[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args14532.length ?? ""}`);
    }
    ;
  }, "f14531_271");
  return f14531_271;
})();
var proj_context_clone = /* @__PURE__ */ (() => {
  let f14688_277 = null;
  const impl14691_278 = /* @__PURE__ */ __name(function() {
    return proj_context_clone({});
  }, "impl14691_278");
  const impl14692_279 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_clone", { "rettype": "pointer", "argtypes": [["ctx", "pointer"]], "proj-returns": "pj-context", "is-context-fn": false }, opts__209__auto__);
  }, "impl14692_279");
  f14688_277 = /* @__PURE__ */ __name(function(...args14689) {
    const self14693_280 = this;
    const G__14764_281 = args14689.length;
    switch (G__14764_281) {
      case 0:
        return impl14691_278.call(self14693_280);
        break;
      case 1:
        return impl14692_279.call(self14693_280, args14689[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args14689.length ?? ""}`);
    }
    ;
  }, "f14688_277");
  return f14688_277;
})();
var proj_is_equivalent_to_with_ctx = /* @__PURE__ */ (() => {
  let f14845_283 = null;
  const impl14848_284 = /* @__PURE__ */ __name(function() {
    return proj_is_equivalent_to_with_ctx({});
  }, "impl14848_284");
  const impl14849_285 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_is_equivalent_to_with_ctx", { "rettype": "int32", "argtypes": [["context", "pointer"], ["obj", "pointer"], ["other", "pointer"], ["criterion", "int32"]] }, opts__209__auto__);
  }, "impl14849_285");
  f14845_283 = /* @__PURE__ */ __name(function(...args14846) {
    const self14850_286 = this;
    const G__14921_287 = args14846.length;
    switch (G__14921_287) {
      case 0:
        return impl14848_284.call(self14850_286);
        break;
      case 1:
        return impl14849_285.call(self14850_286, args14846[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args14846.length ?? ""}`);
    }
    ;
  }, "f14845_283");
  return f14845_283;
})();
var proj_operation_factory_context_set_allow_use_intermediate_crs = /* @__PURE__ */ (() => {
  let f15002_289 = null;
  const impl15005_290 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_allow_use_intermediate_crs({});
  }, "impl15005_290");
  const impl15006_291 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_allow_use_intermediate_crs", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["use", "int32"]] }, opts__209__auto__);
  }, "impl15006_291");
  f15002_289 = /* @__PURE__ */ __name(function(...args15003) {
    const self15007_292 = this;
    const G__15078_293 = args15003.length;
    switch (G__15078_293) {
      case 0:
        return impl15005_290.call(self15007_292);
        break;
      case 1:
        return impl15006_291.call(self15007_292, args15003[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args15003.length ?? ""}`);
    }
    ;
  }, "f15002_289");
  return f15002_289;
})();
var proj_coordoperation_get_param_index = /* @__PURE__ */ (() => {
  let f15159_295 = null;
  const impl15162_296 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_get_param_index({});
  }, "impl15162_296");
  const impl15163_297 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_param_index", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["name", "string"]] }, opts__209__auto__);
  }, "impl15163_297");
  f15159_295 = /* @__PURE__ */ __name(function(...args15160) {
    const self15164_298 = this;
    const G__15235_299 = args15160.length;
    switch (G__15235_299) {
      case 0:
        return impl15162_296.call(self15164_298);
        break;
      case 1:
        return impl15163_297.call(self15164_298, args15160[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args15160.length ?? ""}`);
    }
    ;
  }, "f15159_295");
  return f15159_295;
})();
var proj_context_get_database_structure = /* @__PURE__ */ (() => {
  let f15316_301 = null;
  const impl15319_302 = /* @__PURE__ */ __name(function() {
    return proj_context_get_database_structure({});
  }, "impl15319_302");
  const impl15320_303 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_get_database_structure", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "string-list" }, opts__209__auto__);
  }, "impl15320_303");
  f15316_301 = /* @__PURE__ */ __name(function(...args15317) {
    const self15321_304 = this;
    const G__15392_305 = args15317.length;
    switch (G__15392_305) {
      case 0:
        return impl15319_302.call(self15321_304);
        break;
      case 1:
        return impl15320_303.call(self15321_304, args15317[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args15317.length ?? ""}`);
    }
    ;
  }, "f15316_301");
  return f15316_301;
})();
var proj_operation_factory_context_destroy = /* @__PURE__ */ (() => {
  let f15473_307 = null;
  const impl15476_308 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_destroy({});
  }, "impl15476_308");
  const impl15477_309 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_destroy", { "rettype": "void", "argtypes": [["ctx", "pointer"]], "is-context-fn": false }, opts__209__auto__);
  }, "impl15477_309");
  f15473_307 = /* @__PURE__ */ __name(function(...args15474) {
    const self15478_310 = this;
    const G__15549_311 = args15474.length;
    switch (G__15549_311) {
      case 0:
        return impl15476_308.call(self15478_310);
        break;
      case 1:
        return impl15477_309.call(self15478_310, args15474[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args15474.length ?? ""}`);
    }
    ;
  }, "f15473_307");
  return f15473_307;
})();
var proj_get_celestial_body_list_from_database = /* @__PURE__ */ (() => {
  let f15630_313 = null;
  const impl15633_314 = /* @__PURE__ */ __name(function() {
    return proj_get_celestial_body_list_from_database({});
  }, "impl15633_314");
  const impl15634_315 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_celestial_body_list_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["out_result_count", "pointer"]], "proj-returns": "struct-list", "struct-def": "proj-celestial-body-info", "struct-fields": [["auth-name", "string", 0], ["name", "string", 4]], "struct-destroy-fn": "proj_celestial_body_list_destroy" }, opts__209__auto__);
  }, "impl15634_315");
  f15630_313 = /* @__PURE__ */ __name(function(...args15631) {
    const self15635_316 = this;
    const G__15706_317 = args15631.length;
    switch (G__15706_317) {
      case 0:
        return impl15633_314.call(self15635_316);
        break;
      case 1:
        return impl15634_315.call(self15635_316, args15631[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args15631.length ?? ""}`);
    }
    ;
  }, "f15630_313");
  return f15630_313;
})();
var proj_celestial_body_list_destroy = /* @__PURE__ */ (() => {
  let f15787_319 = null;
  const impl15790_320 = /* @__PURE__ */ __name(function() {
    return proj_celestial_body_list_destroy({});
  }, "impl15790_320");
  const impl15791_321 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_celestial_body_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__209__auto__);
  }, "impl15791_321");
  f15787_319 = /* @__PURE__ */ __name(function(...args15788) {
    const self15792_322 = this;
    const G__15863_323 = args15788.length;
    switch (G__15863_323) {
      case 0:
        return impl15790_320.call(self15792_322);
        break;
      case 1:
        return impl15791_321.call(self15792_322, args15788[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args15788.length ?? ""}`);
    }
    ;
  }, "f15787_319");
  return f15787_319;
})();
var proj_create_compound_crs = /* @__PURE__ */ (() => {
  let f15944_325 = null;
  const impl15947_326 = /* @__PURE__ */ __name(function() {
    return proj_create_compound_crs({});
  }, "impl15947_326");
  const impl15948_327 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_compound_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["horiz_crs", "pointer"], ["vert_crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl15948_327");
  f15944_325 = /* @__PURE__ */ __name(function(...args15945) {
    const self15949_328 = this;
    const G__16020_329 = args15945.length;
    switch (G__16020_329) {
      case 0:
        return impl15947_326.call(self15949_328);
        break;
      case 1:
        return impl15948_327.call(self15949_328, args15945[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args15945.length ?? ""}`);
    }
    ;
  }, "f15944_325");
  return f15944_325;
})();
var proj_coordoperation_get_towgs84_values = /* @__PURE__ */ (() => {
  let f16101_331 = null;
  const impl16104_332 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_get_towgs84_values({});
  }, "impl16104_332");
  const impl16105_333 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_towgs84_values", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["values", "double-array", "count-arg", "value_count"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["out_values", "pointer"], ["value_count", "int32"], ["emit_error_if_incompatible", "int32"]] }, opts__209__auto__);
  }, "impl16105_333");
  f16101_331 = /* @__PURE__ */ __name(function(...args16102) {
    const self16106_334 = this;
    const G__16177_335 = args16102.length;
    switch (G__16177_335) {
      case 0:
        return impl16104_332.call(self16106_334);
        break;
      case 1:
        return impl16105_333.call(self16106_334, args16102[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args16102.length ?? ""}`);
    }
    ;
  }, "f16101_331");
  return f16101_331;
})();
var proj_get_remarks = /* @__PURE__ */ (() => {
  let f16258_337 = null;
  const impl16261_338 = /* @__PURE__ */ __name(function() {
    return proj_get_remarks({});
  }, "impl16261_338");
  const impl16262_339 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_remarks", { "rettype": "string", "argtypes": [["obj", "pointer"]] }, opts__209__auto__);
  }, "impl16262_339");
  f16258_337 = /* @__PURE__ */ __name(function(...args16259) {
    const self16263_340 = this;
    const G__16334_341 = args16259.length;
    switch (G__16334_341) {
      case 0:
        return impl16261_338.call(self16263_340);
        break;
      case 1:
        return impl16262_339.call(self16263_340, args16259[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args16259.length ?? ""}`);
    }
    ;
  }, "f16258_337");
  return f16258_337;
})();
var proj_get_geoid_models_from_database = /* @__PURE__ */ (() => {
  let f16415_343 = null;
  const impl16418_344 = /* @__PURE__ */ __name(function() {
    return proj_get_geoid_models_from_database({});
  }, "impl16418_344");
  const impl16419_345 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_geoid_models_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["code", "string"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "string-list" }, opts__209__auto__);
  }, "impl16419_345");
  f16415_343 = /* @__PURE__ */ __name(function(...args16416) {
    const self16420_346 = this;
    const G__16491_347 = args16416.length;
    switch (G__16491_347) {
      case 0:
        return impl16418_344.call(self16420_346);
        break;
      case 1:
        return impl16419_345.call(self16420_346, args16416[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args16416.length ?? ""}`);
    }
    ;
  }, "f16415_343");
  return f16415_343;
})();
var proj_crs_alter_cs_linear_unit = /* @__PURE__ */ (() => {
  let f16572_349 = null;
  const impl16575_350 = /* @__PURE__ */ __name(function() {
    return proj_crs_alter_cs_linear_unit({});
  }, "impl16575_350");
  const impl16576_351 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_alter_cs_linear_unit", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["linear_units", "string"], ["linear_units_conv", "float64"], ["unit_auth_name", "string"], ["unit_code", "string"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl16576_351");
  f16572_349 = /* @__PURE__ */ __name(function(...args16573) {
    const self16577_352 = this;
    const G__16648_353 = args16573.length;
    switch (G__16648_353) {
      case 0:
        return impl16575_350.call(self16577_352);
        break;
      case 1:
        return impl16576_351.call(self16577_352, args16573[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args16573.length ?? ""}`);
    }
    ;
  }, "f16572_349");
  return f16572_349;
})();
var proj_uom_get_info_from_database = /* @__PURE__ */ (() => {
  let f16729_355 = null;
  const impl16732_356 = /* @__PURE__ */ __name(function() {
    return proj_uom_get_info_from_database({});
  }, "impl16732_356");
  const impl16733_357 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_uom_get_info_from_database", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["name", "string"], ["conv-factor", "double"], ["category", "string"]], "argtypes": [["context", "pointer"], ["auth_name", "string"], ["code", "string"], ["out_name", "pointer"], ["out_conv_factor", "pointer"], ["out_category", "pointer"]] }, opts__209__auto__);
  }, "impl16733_357");
  f16729_355 = /* @__PURE__ */ __name(function(...args16730) {
    const self16734_358 = this;
    const G__16805_359 = args16730.length;
    switch (G__16805_359) {
      case 0:
        return impl16732_356.call(self16734_358);
        break;
      case 1:
        return impl16733_357.call(self16734_358, args16730[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args16730.length ?? ""}`);
    }
    ;
  }, "f16729_355");
  return f16729_355;
})();
var proj_normalize_for_visualization = /* @__PURE__ */ (() => {
  let f16886_361 = null;
  const impl16889_362 = /* @__PURE__ */ __name(function() {
    return proj_normalize_for_visualization({});
  }, "impl16889_362");
  const impl16890_363 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_normalize_for_visualization", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl16890_363");
  f16886_361 = /* @__PURE__ */ __name(function(...args16887) {
    const self16891_364 = this;
    const G__16962_365 = args16887.length;
    switch (G__16962_365) {
      case 0:
        return impl16889_362.call(self16891_364);
        break;
      case 1:
        return impl16890_363.call(self16891_364, args16887[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args16887.length ?? ""}`);
    }
    ;
  }, "f16886_361");
  return f16886_361;
})();
var proj_crs_get_datum_ensemble = /* @__PURE__ */ (() => {
  let f17043_367 = null;
  const impl17046_368 = /* @__PURE__ */ __name(function() {
    return proj_crs_get_datum_ensemble({});
  }, "impl17046_368");
  const impl17047_369 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_get_datum_ensemble", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl17047_369");
  f17043_367 = /* @__PURE__ */ __name(function(...args17044) {
    const self17048_370 = this;
    const G__17119_371 = args17044.length;
    switch (G__17119_371) {
      case 0:
        return impl17046_368.call(self17048_370);
        break;
      case 1:
        return impl17047_369.call(self17048_370, args17044[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args17044.length ?? ""}`);
    }
    ;
  }, "f17043_367");
  return f17043_367;
})();
var proj_create_crs_to_crs = /* @__PURE__ */ (() => {
  let f17200_373 = null;
  const impl17203_374 = /* @__PURE__ */ __name(function() {
    return proj_create_crs_to_crs({});
  }, "impl17203_374");
  const impl17204_375 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_crs_to_crs", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["source_crs", "string"], ["target_crs", "string"], ["area", "pointer?"]], "argsemantics": [["area", "pj-area", "default", 0]], "proj-returns": "pj", "isolate-context?": true }, opts__209__auto__);
  }, "impl17204_375");
  f17200_373 = /* @__PURE__ */ __name(function(...args17201) {
    const self17205_376 = this;
    const G__17276_377 = args17201.length;
    switch (G__17276_377) {
      case 0:
        return impl17203_374.call(self17205_376);
        break;
      case 1:
        return impl17204_375.call(self17205_376, args17201[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args17201.length ?? ""}`);
    }
    ;
  }, "f17200_373");
  return f17200_373;
})();
var proj_alter_name = /* @__PURE__ */ (() => {
  let f17357_379 = null;
  const impl17360_380 = /* @__PURE__ */ __name(function() {
    return proj_alter_name({});
  }, "impl17360_380");
  const impl17361_381 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_alter_name", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["name", "string"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl17361_381");
  f17357_379 = /* @__PURE__ */ __name(function(...args17358) {
    const self17362_382 = this;
    const G__17433_383 = args17358.length;
    switch (G__17433_383) {
      case 0:
        return impl17360_380.call(self17362_382);
        break;
      case 1:
        return impl17361_381.call(self17362_382, args17358[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args17358.length ?? ""}`);
    }
    ;
  }, "f17357_379");
  return f17357_379;
})();
var proj_coordinate_metadata_get_epoch = /* @__PURE__ */ (() => {
  let f17514_385 = null;
  const impl17517_386 = /* @__PURE__ */ __name(function() {
    return proj_coordinate_metadata_get_epoch({});
  }, "impl17517_386");
  const impl17518_387 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordinate_metadata_get_epoch", { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]] }, opts__209__auto__);
  }, "impl17518_387");
  f17514_385 = /* @__PURE__ */ __name(function(...args17515) {
    const self17519_388 = this;
    const G__17590_389 = args17515.length;
    switch (G__17590_389) {
      case 0:
        return impl17517_386.call(self17519_388);
        break;
      case 1:
        return impl17518_387.call(self17519_388, args17515[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args17515.length ?? ""}`);
    }
    ;
  }, "f17514_385");
  return f17514_385;
})();
var proj_context_errno = /* @__PURE__ */ (() => {
  let f17671_391 = null;
  const impl17674_392 = /* @__PURE__ */ __name(function() {
    return proj_context_errno({});
  }, "impl17674_392");
  const impl17675_393 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_errno", { "rettype": "int32", "argtypes": [["context", "pointer"]] }, opts__209__auto__);
  }, "impl17675_393");
  f17671_391 = /* @__PURE__ */ __name(function(...args17672) {
    const self17676_394 = this;
    const G__17747_395 = args17672.length;
    switch (G__17747_395) {
      case 0:
        return impl17674_392.call(self17676_394);
        break;
      case 1:
        return impl17675_393.call(self17676_394, args17672[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args17672.length ?? ""}`);
    }
    ;
  }, "f17671_391");
  return f17671_391;
})();
var proj_context_set_search_paths = /* @__PURE__ */ (() => {
  let f17828_397 = null;
  const impl17831_398 = /* @__PURE__ */ __name(function() {
    return proj_context_set_search_paths({});
  }, "impl17831_398");
  const impl17832_399 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_set_search_paths", { "rettype": "void", "argtypes": [["context", "pointer"], ["count_paths", "int32"], ["paths", "pointer?"]], "argsemantics": [["paths", "string-array?", "default", null]] }, opts__209__auto__);
  }, "impl17832_399");
  f17828_397 = /* @__PURE__ */ __name(function(...args17829) {
    const self17833_400 = this;
    const G__17904_401 = args17829.length;
    switch (G__17904_401) {
      case 0:
        return impl17831_398.call(self17833_400);
        break;
      case 1:
        return impl17832_399.call(self17833_400, args17829[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args17829.length ?? ""}`);
    }
    ;
  }, "f17828_397");
  return f17828_397;
})();
var proj_trans_generic = /* @__PURE__ */ (() => {
  let f17985_403 = null;
  const impl17988_404 = /* @__PURE__ */ __name(function() {
    return proj_trans_generic({});
  }, "impl17988_404");
  const impl17989_405 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_trans_generic", { "rettype": "size-t", "argtypes": [["p", "pointer"], ["direction", "int32"], ["x", "pointer"], ["sx", "size-t"], ["nx", "size-t"], ["y", "pointer"], ["sy", "size-t"], ["ny", "size-t"], ["z", "pointer?"], ["sz", "size-t"], ["nz", "size-t"], ["t", "pointer?"], ["st", "size-t"], ["nt", "size-t"]] }, opts__209__auto__);
  }, "impl17989_405");
  f17985_403 = /* @__PURE__ */ __name(function(...args17986) {
    const self17990_406 = this;
    const G__18061_407 = args17986.length;
    switch (G__18061_407) {
      case 0:
        return impl17988_404.call(self17990_406);
        break;
      case 1:
        return impl17989_405.call(self17990_406, args17986[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args17986.length ?? ""}`);
    }
    ;
  }, "f17985_403");
  return f17985_403;
})();
var proj_clone = /* @__PURE__ */ (() => {
  let f18142_409 = null;
  const impl18145_410 = /* @__PURE__ */ __name(function() {
    return proj_clone({});
  }, "impl18145_410");
  const impl18146_411 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_clone", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["p", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl18146_411");
  f18142_409 = /* @__PURE__ */ __name(function(...args18143) {
    const self18147_412 = this;
    const G__18218_413 = args18143.length;
    switch (G__18218_413) {
      case 0:
        return impl18145_410.call(self18147_412);
        break;
      case 1:
        return impl18146_411.call(self18147_412, args18143[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args18143.length ?? ""}`);
    }
    ;
  }, "f18142_409");
  return f18142_409;
})();
var proj_coordoperation_create_inverse = /* @__PURE__ */ (() => {
  let f18299_415 = null;
  const impl18302_416 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_create_inverse({});
  }, "impl18302_416");
  const impl18303_417 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_create_inverse", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl18303_417");
  f18299_415 = /* @__PURE__ */ __name(function(...args18300) {
    const self18304_418 = this;
    const G__18375_419 = args18300.length;
    switch (G__18375_419) {
      case 0:
        return impl18302_416.call(self18304_418);
        break;
      case 1:
        return impl18303_417.call(self18304_418, args18300[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args18300.length ?? ""}`);
    }
    ;
  }, "f18299_415");
  return f18299_415;
})();
var proj_crs_demote_to_2D = /* @__PURE__ */ (() => {
  let f18456_421 = null;
  const impl18459_422 = /* @__PURE__ */ __name(function() {
    return proj_crs_demote_to_2D({});
  }, "impl18459_422");
  const impl18460_423 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_demote_to_2D", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_2D_name", "string"], ["crs_3D", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl18460_423");
  f18456_421 = /* @__PURE__ */ __name(function(...args18457) {
    const self18461_424 = this;
    const G__18532_425 = args18457.length;
    switch (G__18532_425) {
      case 0:
        return impl18459_422.call(self18461_424);
        break;
      case 1:
        return impl18460_423.call(self18461_424, args18457[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args18457.length ?? ""}`);
    }
    ;
  }, "f18456_421");
  return f18456_421;
})();
var proj_create_cartesian_2D_cs = /* @__PURE__ */ (() => {
  let f18613_427 = null;
  const impl18616_428 = /* @__PURE__ */ __name(function() {
    return proj_create_cartesian_2D_cs({});
  }, "impl18616_428");
  const impl18617_429 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_cartesian_2D_cs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["unit_name", "string"], ["unit_conv_factor", "float64"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl18617_429");
  f18613_427 = /* @__PURE__ */ __name(function(...args18614) {
    const self18618_430 = this;
    const G__18689_431 = args18614.length;
    switch (G__18689_431) {
      case 0:
        return impl18616_428.call(self18618_430);
        break;
      case 1:
        return impl18617_429.call(self18618_430, args18614[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args18614.length ?? ""}`);
    }
    ;
  }, "f18613_427");
  return f18613_427;
})();
var proj_context_is_network_enabled = /* @__PURE__ */ (() => {
  let f18770_433 = null;
  const impl18773_434 = /* @__PURE__ */ __name(function() {
    return proj_context_is_network_enabled({});
  }, "impl18773_434");
  const impl18774_435 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_is_network_enabled", { "rettype": "int32", "argtypes": [["context", "pointer"]] }, opts__209__auto__);
  }, "impl18774_435");
  f18770_433 = /* @__PURE__ */ __name(function(...args18771) {
    const self18775_436 = this;
    const G__18846_437 = args18771.length;
    switch (G__18846_437) {
      case 0:
        return impl18773_434.call(self18775_436);
        break;
      case 1:
        return impl18774_435.call(self18775_436, args18771[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args18771.length ?? ""}`);
    }
    ;
  }, "f18770_433");
  return f18770_433;
})();
var proj_get_scope = /* @__PURE__ */ (() => {
  let f18927_439 = null;
  const impl18930_440 = /* @__PURE__ */ __name(function() {
    return proj_get_scope({});
  }, "impl18930_440");
  const impl18931_441 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_scope", { "rettype": "string", "argtypes": [["obj", "pointer"]] }, opts__209__auto__);
  }, "impl18931_441");
  f18927_439 = /* @__PURE__ */ __name(function(...args18928) {
    const self18932_442 = this;
    const G__19003_443 = args18928.length;
    switch (G__19003_443) {
      case 0:
        return impl18930_440.call(self18932_442);
        break;
      case 1:
        return impl18931_441.call(self18932_442, args18928[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args18928.length ?? ""}`);
    }
    ;
  }, "f18927_439");
  return f18927_439;
})();
var proj_destroy = /* @__PURE__ */ (() => {
  let f19084_445 = null;
  const impl19087_446 = /* @__PURE__ */ __name(function() {
    return proj_destroy({});
  }, "impl19087_446");
  const impl19088_447 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_destroy", { "rettype": "pointer", "argtypes": [["pj", "pointer"]] }, opts__209__auto__);
  }, "impl19088_447");
  f19084_445 = /* @__PURE__ */ __name(function(...args19085) {
    const self19089_448 = this;
    const G__19160_449 = args19085.length;
    switch (G__19160_449) {
      case 0:
        return impl19087_446.call(self19089_448);
        break;
      case 1:
        return impl19088_447.call(self19089_448, args19085[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args19085.length ?? ""}`);
    }
    ;
  }, "f19084_445");
  return f19084_445;
})();
var proj_operation_factory_context_set_allow_ballpark_transformations = /* @__PURE__ */ (() => {
  let f19241_451 = null;
  const impl19244_452 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_allow_ballpark_transformations({});
  }, "impl19244_452");
  const impl19245_453 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_allow_ballpark_transformations", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["allow", "int32"]] }, opts__209__auto__);
  }, "impl19245_453");
  f19241_451 = /* @__PURE__ */ __name(function(...args19242) {
    const self19246_454 = this;
    const G__19317_455 = args19242.length;
    switch (G__19317_455) {
      case 0:
        return impl19244_452.call(self19246_454);
        break;
      case 1:
        return impl19245_453.call(self19246_454, args19242[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args19242.length ?? ""}`);
    }
    ;
  }, "f19241_451");
  return f19241_451;
})();
var proj_crs_get_datum = /* @__PURE__ */ (() => {
  let f19398_457 = null;
  const impl19401_458 = /* @__PURE__ */ __name(function() {
    return proj_crs_get_datum({});
  }, "impl19401_458");
  const impl19402_459 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_get_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl19402_459");
  f19398_457 = /* @__PURE__ */ __name(function(...args19399) {
    const self19403_460 = this;
    const G__19474_461 = args19399.length;
    switch (G__19474_461) {
      case 0:
        return impl19401_458.call(self19403_460);
        break;
      case 1:
        return impl19402_459.call(self19403_460, args19399[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args19399.length ?? ""}`);
    }
    ;
  }, "f19398_457");
  return f19398_457;
})();
var proj_operation_factory_context_set_area_of_interest = /* @__PURE__ */ (() => {
  let f19555_463 = null;
  const impl19558_464 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_area_of_interest({});
  }, "impl19558_464");
  const impl19559_465 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_area_of_interest", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["west_lon_degree", "float64"], ["south_lat_degree", "float64"], ["east_lon_degree", "float64"], ["north_lat_degree", "float64"]] }, opts__209__auto__);
  }, "impl19559_465");
  f19555_463 = /* @__PURE__ */ __name(function(...args19556) {
    const self19560_466 = this;
    const G__19631_467 = args19556.length;
    switch (G__19631_467) {
      case 0:
        return impl19558_464.call(self19560_466);
        break;
      case 1:
        return impl19559_465.call(self19560_466, args19556[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args19556.length ?? ""}`);
    }
    ;
  }, "f19555_463");
  return f19555_463;
})();
var proj_create_cs = /* @__PURE__ */ (() => {
  let f19712_469 = null;
  const impl19715_470 = /* @__PURE__ */ __name(function() {
    return proj_create_cs({});
  }, "impl19715_470");
  const impl19716_471 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_cs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["axis_count", "int32"], ["axis", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl19716_471");
  f19712_469 = /* @__PURE__ */ __name(function(...args19713) {
    const self19717_472 = this;
    const G__19788_473 = args19713.length;
    switch (G__19788_473) {
      case 0:
        return impl19715_470.call(self19717_472);
        break;
      case 1:
        return impl19716_471.call(self19717_472, args19713[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args19713.length ?? ""}`);
    }
    ;
  }, "f19712_469");
  return f19712_469;
})();
var proj_create_projected_crs = /* @__PURE__ */ (() => {
  let f19869_475 = null;
  const impl19872_476 = /* @__PURE__ */ __name(function() {
    return proj_create_projected_crs({});
  }, "impl19872_476");
  const impl19873_477 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_projected_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["geodetic_crs", "pointer"], ["conversion", "pointer"], ["coordinate_system", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl19873_477");
  f19869_475 = /* @__PURE__ */ __name(function(...args19870) {
    const self19874_478 = this;
    const G__19945_479 = args19870.length;
    switch (G__19945_479) {
      case 0:
        return impl19872_476.call(self19874_478);
        break;
      case 1:
        return impl19873_477.call(self19874_478, args19870[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args19870.length ?? ""}`);
    }
    ;
  }, "f19869_475");
  return f19869_475;
})();
var proj_as_proj_string = /* @__PURE__ */ (() => {
  let f20026_481 = null;
  const impl20029_482 = /* @__PURE__ */ __name(function() {
    return proj_as_proj_string({});
  }, "impl20029_482");
  const impl20030_483 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_as_proj_string", { "rettype": "string", "argtypes": [["context", "pointer"], ["pj", "pointer"], ["type", "int32"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]] }, opts__209__auto__);
  }, "impl20030_483");
  f20026_481 = /* @__PURE__ */ __name(function(...args20027) {
    const self20031_484 = this;
    const G__20102_485 = args20027.length;
    switch (G__20102_485) {
      case 0:
        return impl20029_482.call(self20031_484);
        break;
      case 1:
        return impl20030_483.call(self20031_484, args20027[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args20027.length ?? ""}`);
    }
    ;
  }, "f20026_481");
  return f20026_481;
})();
var proj_operation_factory_context_set_grid_availability_use = /* @__PURE__ */ (() => {
  let f20183_487 = null;
  const impl20186_488 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_grid_availability_use({});
  }, "impl20186_488");
  const impl20187_489 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_grid_availability_use", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["use", "int32"]] }, opts__209__auto__);
  }, "impl20187_489");
  f20183_487 = /* @__PURE__ */ __name(function(...args20184) {
    const self20188_490 = this;
    const G__20259_491 = args20184.length;
    switch (G__20259_491) {
      case 0:
        return impl20186_488.call(self20188_490);
        break;
      case 1:
        return impl20187_489.call(self20188_490, args20184[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args20184.length ?? ""}`);
    }
    ;
  }, "f20183_487");
  return f20183_487;
})();
var proj_create_derived_geographic_crs = /* @__PURE__ */ (() => {
  let f20340_493 = null;
  const impl20343_494 = /* @__PURE__ */ __name(function() {
    return proj_create_derived_geographic_crs({});
  }, "impl20343_494");
  const impl20344_495 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_derived_geographic_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["base_geographic_crs", "pointer"], ["conversion", "pointer"], ["ellipsoidal_cs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl20344_495");
  f20340_493 = /* @__PURE__ */ __name(function(...args20341) {
    const self20345_496 = this;
    const G__20416_497 = args20341.length;
    switch (G__20416_497) {
      case 0:
        return impl20343_494.call(self20345_496);
        break;
      case 1:
        return impl20344_495.call(self20345_496, args20341[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args20341.length ?? ""}`);
    }
    ;
  }, "f20340_493");
  return f20340_493;
})();
var proj_create_crs_to_crs_from_pj = /* @__PURE__ */ (() => {
  let f20497_499 = null;
  const impl20500_500 = /* @__PURE__ */ __name(function() {
    return proj_create_crs_to_crs_from_pj({});
  }, "impl20500_500");
  const impl20501_501 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_crs_to_crs_from_pj", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["source_crs", "pointer"], ["target_crs", "pointer"], ["area", "pointer?"], ["options", "pointer?"]], "argsemantics": [["area", "pj-area", "default", 0], ["options", "string-array?", "default", null]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl20501_501");
  f20497_499 = /* @__PURE__ */ __name(function(...args20498) {
    const self20502_502 = this;
    const G__20573_503 = args20498.length;
    switch (G__20573_503) {
      case 0:
        return impl20500_500.call(self20502_502);
        break;
      case 1:
        return impl20501_501.call(self20502_502, args20498[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args20498.length ?? ""}`);
    }
    ;
  }, "f20497_499");
  return f20497_499;
})();
var proj_coordoperation_get_method_info = /* @__PURE__ */ (() => {
  let f20654_505 = null;
  const impl20657_506 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_get_method_info({});
  }, "impl20657_506");
  const impl20658_507 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_method_info", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["method-name", "string"], ["method-auth-name", "string"], ["method-code", "string"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["out_method_name", "pointer"], ["out_method_auth_name", "pointer"], ["out_method_code", "pointer"]] }, opts__209__auto__);
  }, "impl20658_507");
  f20654_505 = /* @__PURE__ */ __name(function(...args20655) {
    const self20659_508 = this;
    const G__20730_509 = args20655.length;
    switch (G__20730_509) {
      case 0:
        return impl20657_506.call(self20659_508);
        break;
      case 1:
        return impl20658_507.call(self20659_508, args20655[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args20655.length ?? ""}`);
    }
    ;
  }, "f20654_505");
  return f20654_505;
})();
var proj_get_source_crs = /* @__PURE__ */ (() => {
  let f20811_511 = null;
  const impl20814_512 = /* @__PURE__ */ __name(function() {
    return proj_get_source_crs({});
  }, "impl20814_512");
  const impl20815_513 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_source_crs", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["pj", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl20815_513");
  f20811_511 = /* @__PURE__ */ __name(function(...args20812) {
    const self20816_514 = this;
    const G__20887_515 = args20812.length;
    switch (G__20887_515) {
      case 0:
        return impl20814_512.call(self20816_514);
        break;
      case 1:
        return impl20815_513.call(self20816_514, args20812[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args20812.length ?? ""}`);
    }
    ;
  }, "f20811_511");
  return f20811_511;
})();
var proj_ellipsoid_get_parameters = /* @__PURE__ */ (() => {
  let f20968_517 = null;
  const impl20971_518 = /* @__PURE__ */ __name(function() {
    return proj_ellipsoid_get_parameters({});
  }, "impl20971_518");
  const impl20972_519 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_ellipsoid_get_parameters", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["semi-major-metre", "double"], ["semi-minor-metre", "double"], ["is-semi-minor-computed", "int"], ["inv-flattening", "double"]], "argtypes": [["ctx", "pointer"], ["ellipsoid", "pointer"], ["out_semi_major_metre", "pointer"], ["out_semi_minor_metre", "pointer"], ["out_is_semi_minor_computed", "pointer"], ["out_inv_flattening", "pointer"]] }, opts__209__auto__);
  }, "impl20972_519");
  f20968_517 = /* @__PURE__ */ __name(function(...args20969) {
    const self20973_520 = this;
    const G__21044_521 = args20969.length;
    switch (G__21044_521) {
      case 0:
        return impl20971_518.call(self20973_520);
        break;
      case 1:
        return impl20972_519.call(self20973_520, args20969[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args20969.length ?? ""}`);
    }
    ;
  }, "f20968_517");
  return f20968_517;
})();
var proj_context_destroy = /* @__PURE__ */ (() => {
  let f21125_523 = null;
  const impl21128_524 = /* @__PURE__ */ __name(function() {
    return proj_context_destroy({});
  }, "impl21128_524");
  const impl21129_525 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_destroy", { "rettype": "void", "argtypes": [["context", "pointer"]], "is-context-fn": false }, opts__209__auto__);
  }, "impl21129_525");
  f21125_523 = /* @__PURE__ */ __name(function(...args21126) {
    const self21130_526 = this;
    const G__21201_527 = args21126.length;
    switch (G__21201_527) {
      case 0:
        return impl21128_524.call(self21130_526);
        break;
      case 1:
        return impl21129_525.call(self21130_526, args21126[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args21126.length ?? ""}`);
    }
    ;
  }, "f21125_523");
  return f21125_523;
})();
var proj_cs_get_axis_info = /* @__PURE__ */ (() => {
  let f21282_529 = null;
  const impl21285_530 = /* @__PURE__ */ __name(function() {
    return proj_cs_get_axis_info({});
  }, "impl21285_530");
  const impl21286_531 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_cs_get_axis_info", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["name", "string"], ["abbreviation", "string"], ["direction", "string"], ["unit-conv-factor", "double"], ["unit-name", "string"], ["unit-auth-name", "string"], ["unit-code", "string"]], "argtypes": [["ctx", "pointer"], ["cs", "pointer"], ["index", "int32"], ["out_name", "pointer"], ["out_abbrev", "pointer"], ["out_direction", "pointer"], ["out_unit_conv_factor", "pointer"], ["out_unit_name", "pointer"], ["out_unit_auth_name", "pointer"], ["out_unit_code", "pointer"]] }, opts__209__auto__);
  }, "impl21286_531");
  f21282_529 = /* @__PURE__ */ __name(function(...args21283) {
    const self21287_532 = this;
    const G__21358_533 = args21283.length;
    switch (G__21358_533) {
      case 0:
        return impl21285_530.call(self21287_532);
        break;
      case 1:
        return impl21286_531.call(self21287_532, args21283[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args21283.length ?? ""}`);
    }
    ;
  }, "f21282_529");
  return f21282_529;
})();
var proj_query_geodetic_crs_from_datum = /* @__PURE__ */ (() => {
  let f21439_535 = null;
  const impl21442_536 = /* @__PURE__ */ __name(function() {
    return proj_query_geodetic_crs_from_datum({});
  }, "impl21442_536");
  const impl21443_537 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_query_geodetic_crs_from_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_auth_name", "string"], ["datum_auth_name", "string"], ["datum_code", "string"], ["crs_type", "string"]], "proj-returns": "pj-list" }, opts__209__auto__);
  }, "impl21443_537");
  f21439_535 = /* @__PURE__ */ __name(function(...args21440) {
    const self21444_538 = this;
    const G__21515_539 = args21440.length;
    switch (G__21515_539) {
      case 0:
        return impl21442_536.call(self21444_538);
        break;
      case 1:
        return impl21443_537.call(self21444_538, args21440[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args21440.length ?? ""}`);
    }
    ;
  }, "f21439_535");
  return f21439_535;
})();
var proj_coordoperation_requires_per_coordinate_input_time = /* @__PURE__ */ (() => {
  let f21596_541 = null;
  const impl21599_542 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_requires_per_coordinate_input_time({});
  }, "impl21599_542");
  const impl21600_543 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_requires_per_coordinate_input_time", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__209__auto__);
  }, "impl21600_543");
  f21596_541 = /* @__PURE__ */ __name(function(...args21597) {
    const self21601_544 = this;
    const G__21672_545 = args21597.length;
    switch (G__21672_545) {
      case 0:
        return impl21599_542.call(self21601_544);
        break;
      case 1:
        return impl21600_543.call(self21601_544, args21597[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args21597.length ?? ""}`);
    }
    ;
  }, "f21596_541");
  return f21596_541;
})();
var proj_create_ellipsoidal_2D_cs = /* @__PURE__ */ (() => {
  let f21753_547 = null;
  const impl21756_548 = /* @__PURE__ */ __name(function() {
    return proj_create_ellipsoidal_2D_cs({});
  }, "impl21756_548");
  const impl21757_549 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_ellipsoidal_2D_cs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["unit_name", "string"], ["unit_conv_factor", "float64"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl21757_549");
  f21753_547 = /* @__PURE__ */ __name(function(...args21754) {
    const self21758_550 = this;
    const G__21829_551 = args21754.length;
    switch (G__21829_551) {
      case 0:
        return impl21756_548.call(self21758_550);
        break;
      case 1:
        return impl21757_549.call(self21758_550, args21754[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args21754.length ?? ""}`);
    }
    ;
  }, "f21753_547");
  return f21753_547;
})();
var proj_create_from_database = /* @__PURE__ */ (() => {
  let f21910_553 = null;
  const impl21913_554 = /* @__PURE__ */ __name(function() {
    return proj_create_from_database({});
  }, "impl21913_554");
  const impl21914_555 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["code", "string"], ["category", "int32"], ["use-proj-alternative-grid-names", "int32"], ["options", "pointer?"]], "argsemantics": [["category", "int32", "default", 3], ["use-proj-alternative-grid-names", "boolean", "default", false], ["options", "string-array?", "default", null]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl21914_555");
  f21910_553 = /* @__PURE__ */ __name(function(...args21911) {
    const self21915_556 = this;
    const G__21986_557 = args21911.length;
    switch (G__21986_557) {
      case 0:
        return impl21913_554.call(self21915_556);
        break;
      case 1:
        return impl21914_555.call(self21915_556, args21911[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args21911.length ?? ""}`);
    }
    ;
  }, "f21910_553");
  return f21910_553;
})();
var proj_alter_id = /* @__PURE__ */ (() => {
  let f22067_559 = null;
  const impl22070_560 = /* @__PURE__ */ __name(function() {
    return proj_alter_id({});
  }, "impl22070_560");
  const impl22071_561 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_alter_id", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["auth_name", "string"], ["code", "string"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl22071_561");
  f22067_559 = /* @__PURE__ */ __name(function(...args22068) {
    const self22072_562 = this;
    const G__22143_563 = args22068.length;
    switch (G__22143_563) {
      case 0:
        return impl22070_560.call(self22072_562);
        break;
      case 1:
        return impl22071_561.call(self22072_562, args22068[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args22068.length ?? ""}`);
    }
    ;
  }, "f22067_559");
  return f22067_559;
})();
var proj_crs_has_point_motion_operation = /* @__PURE__ */ (() => {
  let f22224_565 = null;
  const impl22227_566 = /* @__PURE__ */ __name(function() {
    return proj_crs_has_point_motion_operation({});
  }, "impl22227_566");
  const impl22228_567 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_has_point_motion_operation", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, opts__209__auto__);
  }, "impl22228_567");
  f22224_565 = /* @__PURE__ */ __name(function(...args22225) {
    const self22229_568 = this;
    const G__22300_569 = args22225.length;
    switch (G__22300_569) {
      case 0:
        return impl22227_566.call(self22229_568);
        break;
      case 1:
        return impl22228_567.call(self22229_568, args22225[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args22225.length ?? ""}`);
    }
    ;
  }, "f22224_565");
  return f22224_565;
})();
var proj_operation_factory_context_set_allowed_intermediate_crs = /* @__PURE__ */ (() => {
  let f22381_571 = null;
  const impl22384_572 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_allowed_intermediate_crs({});
  }, "impl22384_572");
  const impl22385_573 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_allowed_intermediate_crs", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["list_of_auth_name_codes", "pointer"]] }, opts__209__auto__);
  }, "impl22385_573");
  f22381_571 = /* @__PURE__ */ __name(function(...args22382) {
    const self22386_574 = this;
    const G__22457_575 = args22382.length;
    switch (G__22457_575) {
      case 0:
        return impl22384_572.call(self22386_574);
        break;
      case 1:
        return impl22385_573.call(self22386_574, args22382[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args22382.length ?? ""}`);
    }
    ;
  }, "f22381_571");
  return f22381_571;
})();
var proj_crs_promote_to_3D = /* @__PURE__ */ (() => {
  let f22538_577 = null;
  const impl22541_578 = /* @__PURE__ */ __name(function() {
    return proj_crs_promote_to_3D({});
  }, "impl22541_578");
  const impl22542_579 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_promote_to_3D", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_3D_name", "string"], ["crs_2D", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl22542_579");
  f22538_577 = /* @__PURE__ */ __name(function(...args22539) {
    const self22543_580 = this;
    const G__22614_581 = args22539.length;
    switch (G__22614_581) {
      case 0:
        return impl22541_578.call(self22543_580);
        break;
      case 1:
        return impl22542_579.call(self22543_580, args22539[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args22539.length ?? ""}`);
    }
    ;
  }, "f22538_577");
  return f22538_577;
})();
var proj_get_prime_meridian = /* @__PURE__ */ (() => {
  let f22695_583 = null;
  const impl22698_584 = /* @__PURE__ */ __name(function() {
    return proj_get_prime_meridian({});
  }, "impl22698_584");
  const impl22699_585 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_prime_meridian", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl22699_585");
  f22695_583 = /* @__PURE__ */ __name(function(...args22696) {
    const self22700_586 = this;
    const G__22771_587 = args22696.length;
    switch (G__22771_587) {
      case 0:
        return impl22698_584.call(self22700_586);
        break;
      case 1:
        return impl22699_585.call(self22700_586, args22696[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args22696.length ?? ""}`);
    }
    ;
  }, "f22695_583");
  return f22695_583;
})();
var proj_datum_ensemble_get_accuracy = /* @__PURE__ */ (() => {
  let f22852_589 = null;
  const impl22855_590 = /* @__PURE__ */ __name(function() {
    return proj_datum_ensemble_get_accuracy({});
  }, "impl22855_590");
  const impl22856_591 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_datum_ensemble_get_accuracy", { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["datum_ensemble", "pointer"]] }, opts__209__auto__);
  }, "impl22856_591");
  f22852_589 = /* @__PURE__ */ __name(function(...args22853) {
    const self22857_592 = this;
    const G__22928_593 = args22853.length;
    switch (G__22928_593) {
      case 0:
        return impl22855_590.call(self22857_592);
        break;
      case 1:
        return impl22856_591.call(self22857_592, args22853[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args22853.length ?? ""}`);
    }
    ;
  }, "f22852_589");
  return f22852_589;
})();
var proj_get_authorities_from_database = /* @__PURE__ */ (() => {
  let f23009_595 = null;
  const impl23012_596 = /* @__PURE__ */ __name(function() {
    return proj_get_authorities_from_database({});
  }, "impl23012_596");
  const impl23013_597 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_authorities_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"]], "proj-returns": "string-list" }, opts__209__auto__);
  }, "impl23013_597");
  f23009_595 = /* @__PURE__ */ __name(function(...args23010) {
    const self23014_598 = this;
    const G__23085_599 = args23010.length;
    switch (G__23085_599) {
      case 0:
        return impl23012_596.call(self23014_598);
        break;
      case 1:
        return impl23013_597.call(self23014_598, args23010[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args23010.length ?? ""}`);
    }
    ;
  }, "f23009_595");
  return f23009_595;
})();
var proj_get_scope_ex = /* @__PURE__ */ (() => {
  let f23166_601 = null;
  const impl23169_602 = /* @__PURE__ */ __name(function() {
    return proj_get_scope_ex({});
  }, "impl23169_602");
  const impl23170_603 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_scope_ex", { "rettype": "string", "argtypes": [["obj", "pointer"], ["domainIdx", "int32"]] }, opts__209__auto__);
  }, "impl23170_603");
  f23166_601 = /* @__PURE__ */ __name(function(...args23167) {
    const self23171_604 = this;
    const G__23242_605 = args23167.length;
    switch (G__23242_605) {
      case 0:
        return impl23169_602.call(self23171_604);
        break;
      case 1:
        return impl23170_603.call(self23171_604, args23167[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args23167.length ?? ""}`);
    }
    ;
  }, "f23166_601");
  return f23166_601;
})();
var proj_get_target_crs = /* @__PURE__ */ (() => {
  let f23323_607 = null;
  const impl23326_608 = /* @__PURE__ */ __name(function() {
    return proj_get_target_crs({});
  }, "impl23326_608");
  const impl23327_609 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_target_crs", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["pj", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl23327_609");
  f23323_607 = /* @__PURE__ */ __name(function(...args23324) {
    const self23328_610 = this;
    const G__23399_611 = args23324.length;
    switch (G__23399_611) {
      case 0:
        return impl23326_608.call(self23328_610);
        break;
      case 1:
        return impl23327_609.call(self23328_610, args23324[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args23324.length ?? ""}`);
    }
    ;
  }, "f23323_607");
  return f23323_607;
})();
var proj_get_area_of_use_ex = /* @__PURE__ */ (() => {
  let f23480_613 = null;
  const impl23483_614 = /* @__PURE__ */ __name(function() {
    return proj_get_area_of_use_ex({});
  }, "impl23483_614");
  const impl23484_615 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_area_of_use_ex", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["west-lon-degree", "double"], ["south-lat-degree", "double"], ["east-lon-degree", "double"], ["north-lat-degree", "double"], ["area-name", "string"]], "argtypes": [["context", "pointer"], ["obj", "pointer"], ["domainIdx", "int32"], ["out_west_lon_degree", "pointer"], ["out_south_lat_degree", "pointer"], ["out_east_lon_degree", "pointer"], ["out_north_lat_degree", "pointer"], ["out_area_name", "pointer"]] }, opts__209__auto__);
  }, "impl23484_615");
  f23480_613 = /* @__PURE__ */ __name(function(...args23481) {
    const self23485_616 = this;
    const G__23556_617 = args23481.length;
    switch (G__23556_617) {
      case 0:
        return impl23483_614.call(self23485_616);
        break;
      case 1:
        return impl23484_615.call(self23485_616, args23481[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args23481.length ?? ""}`);
    }
    ;
  }, "f23480_613");
  return f23480_613;
})();
var proj_get_id_auth_name = /* @__PURE__ */ (() => {
  let f23637_619 = null;
  const impl23640_620 = /* @__PURE__ */ __name(function() {
    return proj_get_id_auth_name({});
  }, "impl23640_620");
  const impl23641_621 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_id_auth_name", { "rettype": "string", "argtypes": [["obj", "pointer"], ["index", "int32"]] }, opts__209__auto__);
  }, "impl23641_621");
  f23637_619 = /* @__PURE__ */ __name(function(...args23638) {
    const self23642_622 = this;
    const G__23713_623 = args23638.length;
    switch (G__23713_623) {
      case 0:
        return impl23640_620.call(self23642_622);
        break;
      case 1:
        return impl23641_621.call(self23642_622, args23638[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args23638.length ?? ""}`);
    }
    ;
  }, "f23637_619");
  return f23637_619;
})();
var proj_coordinate_metadata_create = /* @__PURE__ */ (() => {
  let f23794_625 = null;
  const impl23797_626 = /* @__PURE__ */ __name(function() {
    return proj_coordinate_metadata_create({});
  }, "impl23797_626");
  const impl23798_627 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordinate_metadata_create", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"], ["epoch", "float64"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl23798_627");
  f23794_625 = /* @__PURE__ */ __name(function(...args23795) {
    const self23799_628 = this;
    const G__23870_629 = args23795.length;
    switch (G__23870_629) {
      case 0:
        return impl23797_626.call(self23799_628);
        break;
      case 1:
        return impl23798_627.call(self23799_628, args23795[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args23795.length ?? ""}`);
    }
    ;
  }, "f23794_625");
  return f23794_625;
})();
var proj_create_geocentric_crs_from_datum = /* @__PURE__ */ (() => {
  let f23951_631 = null;
  const impl23954_632 = /* @__PURE__ */ __name(function() {
    return proj_create_geocentric_crs_from_datum({});
  }, "impl23954_632");
  const impl23955_633 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_geocentric_crs_from_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_or_datum_ensemble", "pointer"], ["linear_units", "string"], ["linear_units_conv", "float64"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl23955_633");
  f23951_631 = /* @__PURE__ */ __name(function(...args23952) {
    const self23956_634 = this;
    const G__24027_635 = args23952.length;
    switch (G__24027_635) {
      case 0:
        return impl23954_632.call(self23956_634);
        break;
      case 1:
        return impl23955_633.call(self23956_634, args23952[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args23952.length ?? ""}`);
    }
    ;
  }, "f23951_631");
  return f23951_631;
})();
var proj_crs_info_list_destroy = /* @__PURE__ */ (() => {
  let f24108_637 = null;
  const impl24111_638 = /* @__PURE__ */ __name(function() {
    return proj_crs_info_list_destroy({});
  }, "impl24111_638");
  const impl24112_639 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_info_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__209__auto__);
  }, "impl24112_639");
  f24108_637 = /* @__PURE__ */ __name(function(...args24109) {
    const self24113_640 = this;
    const G__24184_641 = args24109.length;
    switch (G__24184_641) {
      case 0:
        return impl24111_638.call(self24113_640);
        break;
      case 1:
        return impl24112_639.call(self24113_640, args24109[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args24109.length ?? ""}`);
    }
    ;
  }, "f24108_637");
  return f24108_637;
})();
var proj_operation_factory_context_set_use_proj_alternative_grid_names = /* @__PURE__ */ (() => {
  let f24265_643 = null;
  const impl24268_644 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_use_proj_alternative_grid_names({});
  }, "impl24268_644");
  const impl24269_645 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_use_proj_alternative_grid_names", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["usePROJNames", "int32"]] }, opts__209__auto__);
  }, "impl24269_645");
  f24265_643 = /* @__PURE__ */ __name(function(...args24266) {
    const self24270_646 = this;
    const G__24341_647 = args24266.length;
    switch (G__24341_647) {
      case 0:
        return impl24268_644.call(self24270_646);
        break;
      case 1:
        return impl24269_645.call(self24270_646, args24266[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args24266.length ?? ""}`);
    }
    ;
  }, "f24265_643");
  return f24265_643;
})();
var proj_context_get_database_path = /* @__PURE__ */ (() => {
  let f24422_649 = null;
  const impl24425_650 = /* @__PURE__ */ __name(function() {
    return proj_context_get_database_path({});
  }, "impl24425_650");
  const impl24426_651 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_get_database_path", { "rettype": "string", "argtypes": [["context", "pointer"]] }, opts__209__auto__);
  }, "impl24426_651");
  f24422_649 = /* @__PURE__ */ __name(function(...args24423) {
    const self24427_652 = this;
    const G__24498_653 = args24423.length;
    switch (G__24498_653) {
      case 0:
        return impl24425_650.call(self24427_652);
        break;
      case 1:
        return impl24426_651.call(self24427_652, args24423[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args24423.length ?? ""}`);
    }
    ;
  }, "f24422_649");
  return f24422_649;
})();
var proj_context_set_network_callbacks = /* @__PURE__ */ (() => {
  let f24579_655 = null;
  const impl24582_656 = /* @__PURE__ */ __name(function() {
    return proj_context_set_network_callbacks({});
  }, "impl24582_656");
  const impl24583_657 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_set_network_callbacks", { "rettype": "int32", "argtypes": [["context", "pointer"], ["open_cbk", "pointer"], ["close_cbk", "pointer"], ["get_header_cbk", "pointer"], ["read_range_cbk", "pointer"], ["user_data", "pointer?"]] }, opts__209__auto__);
  }, "impl24583_657");
  f24579_655 = /* @__PURE__ */ __name(function(...args24580) {
    const self24584_658 = this;
    const G__24655_659 = args24580.length;
    switch (G__24655_659) {
      case 0:
        return impl24582_656.call(self24584_658);
        break;
      case 1:
        return impl24583_657.call(self24584_658, args24580[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args24580.length ?? ""}`);
    }
    ;
  }, "f24579_655");
  return f24579_655;
})();
var proj_is_crs = /* @__PURE__ */ (() => {
  let f24736_661 = null;
  const impl24739_662 = /* @__PURE__ */ __name(function() {
    return proj_is_crs({});
  }, "impl24739_662");
  const impl24740_663 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_is_crs", { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, opts__209__auto__);
  }, "impl24740_663");
  f24736_661 = /* @__PURE__ */ __name(function(...args24737) {
    const self24741_664 = this;
    const G__24812_665 = args24737.length;
    switch (G__24812_665) {
      case 0:
        return impl24739_662.call(self24741_664);
        break;
      case 1:
        return impl24740_663.call(self24741_664, args24737[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args24737.length ?? ""}`);
    }
    ;
  }, "f24736_661");
  return f24736_661;
})();
var proj_get_crs_list_parameters_destroy = /* @__PURE__ */ (() => {
  let f24893_667 = null;
  const impl24896_668 = /* @__PURE__ */ __name(function() {
    return proj_get_crs_list_parameters_destroy({});
  }, "impl24896_668");
  const impl24897_669 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_crs_list_parameters_destroy", { "rettype": "void", "argtypes": [["params", "pointer"]] }, opts__209__auto__);
  }, "impl24897_669");
  f24893_667 = /* @__PURE__ */ __name(function(...args24894) {
    const self24898_670 = this;
    const G__24969_671 = args24894.length;
    switch (G__24969_671) {
      case 0:
        return impl24896_668.call(self24898_670);
        break;
      case 1:
        return impl24897_669.call(self24898_670, args24894[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args24894.length ?? ""}`);
    }
    ;
  }, "f24893_667");
  return f24893_667;
})();
var proj_context_guess_wkt_dialect = /* @__PURE__ */ (() => {
  let f25050_673 = null;
  const impl25053_674 = /* @__PURE__ */ __name(function() {
    return proj_context_guess_wkt_dialect({});
  }, "impl25053_674");
  const impl25054_675 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_guess_wkt_dialect", { "rettype": "int32", "argtypes": [["context", "pointer"], ["wkt", "string"]] }, opts__209__auto__);
  }, "impl25054_675");
  f25050_673 = /* @__PURE__ */ __name(function(...args25051) {
    const self25055_676 = this;
    const G__25126_677 = args25051.length;
    switch (G__25126_677) {
      case 0:
        return impl25053_674.call(self25055_676);
        break;
      case 1:
        return impl25054_675.call(self25055_676, args25051[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args25051.length ?? ""}`);
    }
    ;
  }, "f25050_673");
  return f25050_673;
})();
var proj_create_operation_factory_context = /* @__PURE__ */ (() => {
  let f25207_679 = null;
  const impl25210_680 = /* @__PURE__ */ __name(function() {
    return proj_create_operation_factory_context({});
  }, "impl25210_680");
  const impl25211_681 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_operation_factory_context", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["authority", "string"]], "proj-returns": "pj-operation-factory-context" }, opts__209__auto__);
  }, "impl25211_681");
  f25207_679 = /* @__PURE__ */ __name(function(...args25208) {
    const self25212_682 = this;
    const G__25283_683 = args25208.length;
    switch (G__25283_683) {
      case 0:
        return impl25210_680.call(self25212_682);
        break;
      case 1:
        return impl25211_681.call(self25212_682, args25208[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args25208.length ?? ""}`);
    }
    ;
  }, "f25207_679");
  return f25207_679;
})();
var proj_list_destroy = /* @__PURE__ */ (() => {
  let f25364_685 = null;
  const impl25367_686 = /* @__PURE__ */ __name(function() {
    return proj_list_destroy({});
  }, "impl25367_686");
  const impl25368_687 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_list_destroy", { "rettype": "void", "argtypes": [["result", "pointer"]] }, opts__209__auto__);
  }, "impl25368_687");
  f25364_685 = /* @__PURE__ */ __name(function(...args25365) {
    const self25369_688 = this;
    const G__25440_689 = args25365.length;
    switch (G__25440_689) {
      case 0:
        return impl25367_686.call(self25369_688);
        break;
      case 1:
        return impl25368_687.call(self25369_688, args25365[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args25365.length ?? ""}`);
    }
    ;
  }, "f25364_685");
  return f25364_685;
})();
var proj_cs_get_type = /* @__PURE__ */ (() => {
  let f25521_691 = null;
  const impl25524_692 = /* @__PURE__ */ __name(function() {
    return proj_cs_get_type({});
  }, "impl25524_692");
  const impl25525_693 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_cs_get_type", { "rettype": "int32", "argtypes": [["context", "pointer"], ["cs", "pointer"]] }, opts__209__auto__);
  }, "impl25525_693");
  f25521_691 = /* @__PURE__ */ __name(function(...args25522) {
    const self25526_694 = this;
    const G__25597_695 = args25522.length;
    switch (G__25597_695) {
      case 0:
        return impl25524_692.call(self25526_694);
        break;
      case 1:
        return impl25525_693.call(self25526_694, args25522[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args25522.length ?? ""}`);
    }
    ;
  }, "f25521_691");
  return f25521_691;
})();
var proj_as_wkt = /* @__PURE__ */ (() => {
  let f25678_697 = null;
  const impl25681_698 = /* @__PURE__ */ __name(function() {
    return proj_as_wkt({});
  }, "impl25681_698");
  const impl25682_699 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_as_wkt", { "rettype": "string", "argtypes": [["context", "pointer"], ["pj", "pointer"], ["type", "int32"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null], ["type", "int32", "default", 2]] }, opts__209__auto__);
  }, "impl25682_699");
  f25678_697 = /* @__PURE__ */ __name(function(...args25679) {
    const self25683_700 = this;
    const G__25754_701 = args25679.length;
    switch (G__25754_701) {
      case 0:
        return impl25681_698.call(self25683_700);
        break;
      case 1:
        return impl25682_699.call(self25683_700, args25679[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args25679.length ?? ""}`);
    }
    ;
  }, "f25678_697");
  return f25678_697;
})();
var proj_insert_object_session_create = /* @__PURE__ */ (() => {
  let f25835_703 = null;
  const impl25838_704 = /* @__PURE__ */ __name(function() {
    return proj_insert_object_session_create({});
  }, "impl25838_704");
  const impl25839_705 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_insert_object_session_create", { "rettype": "pointer", "argtypes": [["context", "pointer"]], "proj-returns": "pj-insert-session" }, opts__209__auto__);
  }, "impl25839_705");
  f25835_703 = /* @__PURE__ */ __name(function(...args25836) {
    const self25840_706 = this;
    const G__25911_707 = args25836.length;
    switch (G__25911_707) {
      case 0:
        return impl25838_704.call(self25840_706);
        break;
      case 1:
        return impl25839_705.call(self25840_706, args25836[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args25836.length ?? ""}`);
    }
    ;
  }, "f25835_703");
  return f25835_703;
})();
var proj_convert_conversion_to_other_method = /* @__PURE__ */ (() => {
  let f25992_709 = null;
  const impl25995_710 = /* @__PURE__ */ __name(function() {
    return proj_convert_conversion_to_other_method({});
  }, "impl25995_710");
  const impl25996_711 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_convert_conversion_to_other_method", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["conversion", "pointer"], ["new_method_epsg_code", "int32"], ["new_method_name", "string"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl25996_711");
  f25992_709 = /* @__PURE__ */ __name(function(...args25993) {
    const self25997_712 = this;
    const G__26068_713 = args25993.length;
    switch (G__26068_713) {
      case 0:
        return impl25995_710.call(self25997_712);
        break;
      case 1:
        return impl25996_711.call(self25997_712, args25993[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args25993.length ?? ""}`);
    }
    ;
  }, "f25992_709");
  return f25992_709;
})();
var proj_operation_factory_context_set_desired_accuracy = /* @__PURE__ */ (() => {
  let f26149_715 = null;
  const impl26152_716 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_desired_accuracy({});
  }, "impl26152_716");
  const impl26153_717 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_desired_accuracy", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["accuracy", "float64"]] }, opts__209__auto__);
  }, "impl26153_717");
  f26149_715 = /* @__PURE__ */ __name(function(...args26150) {
    const self26154_718 = this;
    const G__26225_719 = args26150.length;
    switch (G__26225_719) {
      case 0:
        return impl26152_716.call(self26154_718);
        break;
      case 1:
        return impl26153_717.call(self26154_718, args26150[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args26150.length ?? ""}`);
    }
    ;
  }, "f26149_715");
  return f26149_715;
})();
var proj_list_get = /* @__PURE__ */ (() => {
  let f26306_721 = null;
  const impl26309_722 = /* @__PURE__ */ __name(function() {
    return proj_list_get({});
  }, "impl26309_722");
  const impl26310_723 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_list_get", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["result", "pointer"], ["index", "int32"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl26310_723");
  f26306_721 = /* @__PURE__ */ __name(function(...args26307) {
    const self26311_724 = this;
    const G__26382_725 = args26307.length;
    switch (G__26382_725) {
      case 0:
        return impl26309_722.call(self26311_724);
        break;
      case 1:
        return impl26310_723.call(self26311_724, args26307[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args26307.length ?? ""}`);
    }
    ;
  }, "f26306_721");
  return f26306_721;
})();
var proj_create_geographic_crs_from_datum = /* @__PURE__ */ (() => {
  let f26463_727 = null;
  const impl26466_728 = /* @__PURE__ */ __name(function() {
    return proj_create_geographic_crs_from_datum({});
  }, "impl26466_728");
  const impl26467_729 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_geographic_crs_from_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_or_datum_ensemble", "pointer"], ["ellipsoidal_cs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl26467_729");
  f26463_727 = /* @__PURE__ */ __name(function(...args26464) {
    const self26468_730 = this;
    const G__26539_731 = args26464.length;
    switch (G__26539_731) {
      case 0:
        return impl26466_728.call(self26468_730);
        break;
      case 1:
        return impl26467_729.call(self26468_730, args26464[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args26464.length ?? ""}`);
    }
    ;
  }, "f26463_727");
  return f26463_727;
})();
var proj_get_name = /* @__PURE__ */ (() => {
  let f26620_733 = null;
  const impl26623_734 = /* @__PURE__ */ __name(function() {
    return proj_get_name({});
  }, "impl26623_734");
  const impl26624_735 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_name", { "rettype": "string", "argtypes": [["obj", "pointer"]] }, opts__209__auto__);
  }, "impl26624_735");
  f26620_733 = /* @__PURE__ */ __name(function(...args26621) {
    const self26625_736 = this;
    const G__26696_737 = args26621.length;
    switch (G__26696_737) {
      case 0:
        return impl26623_734.call(self26625_736);
        break;
      case 1:
        return impl26624_735.call(self26625_736, args26621[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args26621.length ?? ""}`);
    }
    ;
  }, "f26620_733");
  return f26620_733;
})();
var proj_crs_alter_parameters_linear_unit = /* @__PURE__ */ (() => {
  let f26777_739 = null;
  const impl26780_740 = /* @__PURE__ */ __name(function() {
    return proj_crs_alter_parameters_linear_unit({});
  }, "impl26780_740");
  const impl26781_741 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_alter_parameters_linear_unit", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["linear_units", "string"], ["linear_units_conv", "float64"], ["unit_auth_name", "string"], ["unit_code", "string"], ["convert_to_new_unit", "int32"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl26781_741");
  f26777_739 = /* @__PURE__ */ __name(function(...args26778) {
    const self26782_742 = this;
    const G__26853_743 = args26778.length;
    switch (G__26853_743) {
      case 0:
        return impl26780_740.call(self26782_742);
        break;
      case 1:
        return impl26781_741.call(self26782_742, args26778[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args26778.length ?? ""}`);
    }
    ;
  }, "f26777_739");
  return f26777_739;
})();
var proj_coordoperation_is_instantiable = /* @__PURE__ */ (() => {
  let f26934_745 = null;
  const impl26937_746 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_is_instantiable({});
  }, "impl26937_746");
  const impl26938_747 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_is_instantiable", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__209__auto__);
  }, "impl26938_747");
  f26934_745 = /* @__PURE__ */ __name(function(...args26935) {
    const self26939_748 = this;
    const G__27010_749 = args26935.length;
    switch (G__27010_749) {
      case 0:
        return impl26937_746.call(self26939_748);
        break;
      case 1:
        return impl26938_747.call(self26939_748, args26935[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args26935.length ?? ""}`);
    }
    ;
  }, "f26934_745");
  return f26934_745;
})();
var proj_crs_alter_cs_angular_unit = /* @__PURE__ */ (() => {
  let f27091_751 = null;
  const impl27094_752 = /* @__PURE__ */ __name(function() {
    return proj_crs_alter_cs_angular_unit({});
  }, "impl27094_752");
  const impl27095_753 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_alter_cs_angular_unit", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["angular_units", "string"], ["angular_units_conv", "float64"], ["unit_auth_name", "string"], ["unit_code", "string"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl27095_753");
  f27091_751 = /* @__PURE__ */ __name(function(...args27092) {
    const self27096_754 = this;
    const G__27167_755 = args27092.length;
    switch (G__27167_755) {
      case 0:
        return impl27094_752.call(self27096_754);
        break;
      case 1:
        return impl27095_753.call(self27096_754, args27092[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args27092.length ?? ""}`);
    }
    ;
  }, "f27091_751");
  return f27091_751;
})();
var proj_datum_ensemble_get_member_count = /* @__PURE__ */ (() => {
  let f27248_757 = null;
  const impl27251_758 = /* @__PURE__ */ __name(function() {
    return proj_datum_ensemble_get_member_count({});
  }, "impl27251_758");
  const impl27252_759 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_datum_ensemble_get_member_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["datum_ensemble", "pointer"]] }, opts__209__auto__);
  }, "impl27252_759");
  f27248_757 = /* @__PURE__ */ __name(function(...args27249) {
    const self27253_760 = this;
    const G__27324_761 = args27249.length;
    switch (G__27324_761) {
      case 0:
        return impl27251_758.call(self27253_760);
        break;
      case 1:
        return impl27252_759.call(self27253_760, args27249[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args27249.length ?? ""}`);
    }
    ;
  }, "f27248_757");
  return f27248_757;
})();
var proj_context_get_user_writable_directory = /* @__PURE__ */ (() => {
  let f27405_763 = null;
  const impl27408_764 = /* @__PURE__ */ __name(function() {
    return proj_context_get_user_writable_directory({});
  }, "impl27408_764");
  const impl27409_765 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_get_user_writable_directory", { "rettype": "string", "argtypes": [["context", "pointer"], ["create", "int32"]] }, opts__209__auto__);
  }, "impl27409_765");
  f27405_763 = /* @__PURE__ */ __name(function(...args27406) {
    const self27410_766 = this;
    const G__27481_767 = args27406.length;
    switch (G__27481_767) {
      case 0:
        return impl27408_764.call(self27410_766);
        break;
      case 1:
        return impl27409_765.call(self27410_766, args27406[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args27406.length ?? ""}`);
    }
    ;
  }, "f27405_763");
  return f27405_763;
})();
var proj_create_vertical_crs = /* @__PURE__ */ (() => {
  let f27562_769 = null;
  const impl27565_770 = /* @__PURE__ */ __name(function() {
    return proj_create_vertical_crs({});
  }, "impl27565_770");
  const impl27566_771 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_vertical_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["linear_units", "string"], ["linear_units_conv", "float64"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl27566_771");
  f27562_769 = /* @__PURE__ */ __name(function(...args27563) {
    const self27567_772 = this;
    const G__27638_773 = args27563.length;
    switch (G__27638_773) {
      case 0:
        return impl27565_770.call(self27567_772);
        break;
      case 1:
        return impl27566_771.call(self27567_772, args27563[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args27563.length ?? ""}`);
    }
    ;
  }, "f27562_769");
  return f27562_769;
})();
var proj_get_domain_count = /* @__PURE__ */ (() => {
  let f27719_775 = null;
  const impl27722_776 = /* @__PURE__ */ __name(function() {
    return proj_get_domain_count({});
  }, "impl27722_776");
  const impl27723_777 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_domain_count", { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, opts__209__auto__);
  }, "impl27723_777");
  f27719_775 = /* @__PURE__ */ __name(function(...args27720) {
    const self27724_778 = this;
    const G__27795_779 = args27720.length;
    switch (G__27795_779) {
      case 0:
        return impl27722_776.call(self27724_778);
        break;
      case 1:
        return impl27723_777.call(self27724_778, args27720[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args27720.length ?? ""}`);
    }
    ;
  }, "f27719_775");
  return f27719_775;
})();
var proj_get_id_code = /* @__PURE__ */ (() => {
  let f27876_781 = null;
  const impl27879_782 = /* @__PURE__ */ __name(function() {
    return proj_get_id_code({});
  }, "impl27879_782");
  const impl27880_783 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_id_code", { "rettype": "string", "argtypes": [["obj", "pointer"], ["index", "int32"]] }, opts__209__auto__);
  }, "impl27880_783");
  f27876_781 = /* @__PURE__ */ __name(function(...args27877) {
    const self27881_784 = this;
    const G__27952_785 = args27877.length;
    switch (G__27952_785) {
      case 0:
        return impl27879_782.call(self27881_784);
        break;
      case 1:
        return impl27880_783.call(self27881_784, args27877[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args27877.length ?? ""}`);
    }
    ;
  }, "f27876_781");
  return f27876_781;
})();
var proj_operation_factory_context_set_spatial_criterion = /* @__PURE__ */ (() => {
  let f28033_787 = null;
  const impl28036_788 = /* @__PURE__ */ __name(function() {
    return proj_operation_factory_context_set_spatial_criterion({});
  }, "impl28036_788");
  const impl28037_789 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_spatial_criterion", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["criterion", "int32"]] }, opts__209__auto__);
  }, "impl28037_789");
  f28033_787 = /* @__PURE__ */ __name(function(...args28034) {
    const self28038_790 = this;
    const G__28109_791 = args28034.length;
    switch (G__28109_791) {
      case 0:
        return impl28036_788.call(self28038_790);
        break;
      case 1:
        return impl28037_789.call(self28038_790, args28034[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args28034.length ?? ""}`);
    }
    ;
  }, "f28033_787");
  return f28033_787;
})();
var proj_create_ellipsoidal_3D_cs = /* @__PURE__ */ (() => {
  let f28190_793 = null;
  const impl28193_794 = /* @__PURE__ */ __name(function() {
    return proj_create_ellipsoidal_3D_cs({});
  }, "impl28193_794");
  const impl28194_795 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_ellipsoidal_3D_cs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["horizontal_angular_unit_name", "string"], ["horizontal_angular_unit_conv_factor", "float64"], ["vertical_linear_unit_name", "string"], ["vertical_linear_unit_conv_factor", "float64"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl28194_795");
  f28190_793 = /* @__PURE__ */ __name(function(...args28191) {
    const self28195_796 = this;
    const G__28266_797 = args28191.length;
    switch (G__28266_797) {
      case 0:
        return impl28193_794.call(self28195_796);
        break;
      case 1:
        return impl28194_795.call(self28195_796, args28191[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args28191.length ?? ""}`);
    }
    ;
  }, "f28190_793");
  return f28190_793;
})();
var proj_create_operations = /* @__PURE__ */ (() => {
  let f28347_799 = null;
  const impl28350_800 = /* @__PURE__ */ __name(function() {
    return proj_create_operations({});
  }, "impl28350_800");
  const impl28351_801 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_operations", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["source_crs", "pointer"], ["target_crs", "pointer"], ["operationContext", "pointer"]], "proj-returns": "pj-list" }, opts__209__auto__);
  }, "impl28351_801");
  f28347_799 = /* @__PURE__ */ __name(function(...args28348) {
    const self28352_802 = this;
    const G__28423_803 = args28348.length;
    switch (G__28423_803) {
      case 0:
        return impl28350_800.call(self28352_802);
        break;
      case 1:
        return impl28351_801.call(self28352_802, args28348[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args28348.length ?? ""}`);
    }
    ;
  }, "f28347_799");
  return f28347_799;
})();
var proj_grid_get_info_from_database = /* @__PURE__ */ (() => {
  let f28504_805 = null;
  const impl28507_806 = /* @__PURE__ */ __name(function() {
    return proj_grid_get_info_from_database({});
  }, "impl28507_806");
  const impl28508_807 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_grid_get_info_from_database", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["full-name", "string"], ["package-name", "string"], ["url", "string"], ["direct-download", "int"], ["open-license", "int"], ["available", "int"]], "argtypes": [["context", "pointer"], ["grid_name", "string"], ["out_full_name", "pointer"], ["out_package_name", "pointer"], ["out_url", "pointer"], ["out_direct_download", "pointer"], ["out_open_license", "pointer"], ["out_available", "pointer"]] }, opts__209__auto__);
  }, "impl28508_807");
  f28504_805 = /* @__PURE__ */ __name(function(...args28505) {
    const self28509_808 = this;
    const G__28580_809 = args28505.length;
    switch (G__28580_809) {
      case 0:
        return impl28507_806.call(self28509_808);
        break;
      case 1:
        return impl28508_807.call(self28509_808, args28505[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args28505.length ?? ""}`);
    }
    ;
  }, "f28504_805");
  return f28504_805;
})();
var proj_dynamic_datum_get_frame_reference_epoch = /* @__PURE__ */ (() => {
  let f28661_811 = null;
  const impl28664_812 = /* @__PURE__ */ __name(function() {
    return proj_dynamic_datum_get_frame_reference_epoch({});
  }, "impl28664_812");
  const impl28665_813 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_dynamic_datum_get_frame_reference_epoch", { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["datum", "pointer"]] }, opts__209__auto__);
  }, "impl28665_813");
  f28661_811 = /* @__PURE__ */ __name(function(...args28662) {
    const self28666_814 = this;
    const G__28737_815 = args28662.length;
    switch (G__28737_815) {
      case 0:
        return impl28664_812.call(self28666_814);
        break;
      case 1:
        return impl28665_813.call(self28666_814, args28662[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args28662.length ?? ""}`);
    }
    ;
  }, "f28661_811");
  return f28661_811;
})();
var proj_log_level = /* @__PURE__ */ (() => {
  let f28818_817 = null;
  const impl28821_818 = /* @__PURE__ */ __name(function() {
    return proj_log_level({});
  }, "impl28821_818");
  const impl28822_819 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_log_level", { "rettype": "int32", "argtypes": [["context", "pointer"], ["level", "int32"]] }, opts__209__auto__);
  }, "impl28822_819");
  f28818_817 = /* @__PURE__ */ __name(function(...args28819) {
    const self28823_820 = this;
    const G__28894_821 = args28819.length;
    switch (G__28894_821) {
      case 0:
        return impl28821_818.call(self28823_820);
        break;
      case 1:
        return impl28822_819.call(self28823_820, args28819[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args28819.length ?? ""}`);
    }
    ;
  }, "f28818_817");
  return f28818_817;
})();
var proj_context_set_autoclose_database = /* @__PURE__ */ (() => {
  let f28975_823 = null;
  const impl28978_824 = /* @__PURE__ */ __name(function() {
    return proj_context_set_autoclose_database({});
  }, "impl28978_824");
  const impl28979_825 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_context_set_autoclose_database", { "rettype": "void", "argtypes": [["context", "pointer"], ["autoclose", "int32"]] }, opts__209__auto__);
  }, "impl28979_825");
  f28975_823 = /* @__PURE__ */ __name(function(...args28976) {
    const self28980_826 = this;
    const G__29051_827 = args28976.length;
    switch (G__29051_827) {
      case 0:
        return impl28978_824.call(self28980_826);
        break;
      case 1:
        return impl28979_825.call(self28980_826, args28976[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args28976.length ?? ""}`);
    }
    ;
  }, "f28975_823");
  return f28975_823;
})();
var proj_create_vertical_crs_ex = /* @__PURE__ */ (() => {
  let f29132_829 = null;
  const impl29135_830 = /* @__PURE__ */ __name(function() {
    return proj_create_vertical_crs_ex({});
  }, "impl29135_830");
  const impl29136_831 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_vertical_crs_ex", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["datum_auth_name", "string"], ["datum_code", "string"], ["linear_units", "string"], ["linear_units_conv", "float64"], ["geoid_model_name", "string"], ["geoid_model_auth_name", "string"], ["geoid_model_code", "string"], ["geoid_geog_crs", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl29136_831");
  f29132_829 = /* @__PURE__ */ __name(function(...args29133) {
    const self29137_832 = this;
    const G__29208_833 = args29133.length;
    switch (G__29208_833) {
      case 0:
        return impl29135_830.call(self29137_832);
        break;
      case 1:
        return impl29136_831.call(self29137_832, args29133[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args29133.length ?? ""}`);
    }
    ;
  }, "f29132_829");
  return f29132_829;
})();
var proj_cs_get_axis_count = /* @__PURE__ */ (() => {
  let f29289_835 = null;
  const impl29292_836 = /* @__PURE__ */ __name(function() {
    return proj_cs_get_axis_count({});
  }, "impl29292_836");
  const impl29293_837 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_cs_get_axis_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["cs", "pointer"]] }, opts__209__auto__);
  }, "impl29293_837");
  f29289_835 = /* @__PURE__ */ __name(function(...args29290) {
    const self29294_838 = this;
    const G__29365_839 = args29290.length;
    switch (G__29365_839) {
      case 0:
        return impl29292_836.call(self29294_838);
        break;
      case 1:
        return impl29293_837.call(self29294_838, args29290[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args29290.length ?? ""}`);
    }
    ;
  }, "f29289_835");
  return f29289_835;
})();
var proj_identify = /* @__PURE__ */ (() => {
  let f29446_841 = null;
  const impl29449_842 = /* @__PURE__ */ __name(function() {
    return proj_identify({});
  }, "impl29449_842");
  const impl29450_843 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_identify", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["obj", "pointer"], ["auth_name", "string"], ["options", "pointer?"], ["out_confidence", "pointer"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj-list" }, opts__209__auto__);
  }, "impl29450_843");
  f29446_841 = /* @__PURE__ */ __name(function(...args29447) {
    const self29451_844 = this;
    const G__29522_845 = args29447.length;
    switch (G__29522_845) {
      case 0:
        return impl29449_842.call(self29451_844);
        break;
      case 1:
        return impl29450_843.call(self29451_844, args29447[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args29447.length ?? ""}`);
    }
    ;
  }, "f29446_841");
  return f29446_841;
})();
var proj_suggests_code_for = /* @__PURE__ */ (() => {
  let f29603_847 = null;
  const impl29606_848 = /* @__PURE__ */ __name(function() {
    return proj_suggests_code_for({});
  }, "impl29606_848");
  const impl29607_849 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_suggests_code_for", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["object", "pointer"], ["authority", "string"], ["numeric_code", "int32"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "owned-string" }, opts__209__auto__);
  }, "impl29607_849");
  f29603_847 = /* @__PURE__ */ __name(function(...args29604) {
    const self29608_850 = this;
    const G__29679_851 = args29604.length;
    switch (G__29679_851) {
      case 0:
        return impl29606_848.call(self29608_850);
        break;
      case 1:
        return impl29607_849.call(self29608_850, args29604[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args29604.length ?? ""}`);
    }
    ;
  }, "f29603_847");
  return f29603_847;
})();
var proj_concatoperation_get_step = /* @__PURE__ */ (() => {
  let f29760_853 = null;
  const impl29763_854 = /* @__PURE__ */ __name(function() {
    return proj_concatoperation_get_step({});
  }, "impl29763_854");
  const impl29764_855 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_concatoperation_get_step", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["concatoperation", "pointer"], ["i_step", "int32"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl29764_855");
  f29760_853 = /* @__PURE__ */ __name(function(...args29761) {
    const self29765_856 = this;
    const G__29836_857 = args29761.length;
    switch (G__29836_857) {
      case 0:
        return impl29763_854.call(self29765_856);
        break;
      case 1:
        return impl29764_855.call(self29765_856, args29761[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args29761.length ?? ""}`);
    }
    ;
  }, "f29760_853");
  return f29760_853;
})();
var proj_datum_ensemble_get_member = /* @__PURE__ */ (() => {
  let f29917_859 = null;
  const impl29920_860 = /* @__PURE__ */ __name(function() {
    return proj_datum_ensemble_get_member({});
  }, "impl29920_860");
  const impl29921_861 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_datum_ensemble_get_member", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["datum_ensemble", "pointer"], ["member_index", "int32"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl29921_861");
  f29917_859 = /* @__PURE__ */ __name(function(...args29918) {
    const self29922_862 = this;
    const G__29993_863 = args29918.length;
    switch (G__29993_863) {
      case 0:
        return impl29920_860.call(self29922_862);
        break;
      case 1:
        return impl29921_861.call(self29922_862, args29918[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args29918.length ?? ""}`);
    }
    ;
  }, "f29917_859");
  return f29917_859;
})();
var proj_crs_get_datum_forced = /* @__PURE__ */ (() => {
  let f30074_865 = null;
  const impl30077_866 = /* @__PURE__ */ __name(function() {
    return proj_crs_get_datum_forced({});
  }, "impl30077_866");
  const impl30078_867 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_get_datum_forced", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl30078_867");
  f30074_865 = /* @__PURE__ */ __name(function(...args30075) {
    const self30079_868 = this;
    const G__30150_869 = args30075.length;
    switch (G__30150_869) {
      case 0:
        return impl30077_866.call(self30079_868);
        break;
      case 1:
        return impl30078_867.call(self30079_868, args30075[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args30075.length ?? ""}`);
    }
    ;
  }, "f30074_865");
  return f30074_865;
})();
var proj_crs_create_bound_crs_to_WGS84 = /* @__PURE__ */ (() => {
  let f30231_871 = null;
  const impl30234_872 = /* @__PURE__ */ __name(function() {
    return proj_crs_create_bound_crs_to_WGS84({});
  }, "impl30234_872");
  const impl30235_873 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_create_bound_crs_to_WGS84", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl30235_873");
  f30231_871 = /* @__PURE__ */ __name(function(...args30232) {
    const self30236_874 = this;
    const G__30307_875 = args30232.length;
    switch (G__30307_875) {
      case 0:
        return impl30234_872.call(self30236_874);
        break;
      case 1:
        return impl30235_873.call(self30236_874, args30232[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args30232.length ?? ""}`);
    }
    ;
  }, "f30231_871");
  return f30231_871;
})();
var proj_crs_get_sub_crs = /* @__PURE__ */ (() => {
  let f30388_877 = null;
  const impl30391_878 = /* @__PURE__ */ __name(function() {
    return proj_crs_get_sub_crs({});
  }, "impl30391_878");
  const impl30392_879 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_get_sub_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"], ["index", "int32"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl30392_879");
  f30388_877 = /* @__PURE__ */ __name(function(...args30389) {
    const self30393_880 = this;
    const G__30464_881 = args30389.length;
    switch (G__30464_881) {
      case 0:
        return impl30391_878.call(self30393_880);
        break;
      case 1:
        return impl30392_879.call(self30393_880, args30389[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args30389.length ?? ""}`);
    }
    ;
  }, "f30388_877");
  return f30388_877;
})();
var proj_get_celestial_body_name = /* @__PURE__ */ (() => {
  let f30545_883 = null;
  const impl30548_884 = /* @__PURE__ */ __name(function() {
    return proj_get_celestial_body_name({});
  }, "impl30548_884");
  const impl30549_885 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_celestial_body_name", { "rettype": "string", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]] }, opts__209__auto__);
  }, "impl30549_885");
  f30545_883 = /* @__PURE__ */ __name(function(...args30546) {
    const self30550_886 = this;
    const G__30621_887 = args30546.length;
    switch (G__30621_887) {
      case 0:
        return impl30548_884.call(self30550_886);
        break;
      case 1:
        return impl30549_885.call(self30550_886, args30546[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args30546.length ?? ""}`);
    }
    ;
  }, "f30545_883");
  return f30545_883;
})();
var proj_errno_reset = /* @__PURE__ */ (() => {
  let f30702_889 = null;
  const impl30705_890 = /* @__PURE__ */ __name(function() {
    return proj_errno_reset({});
  }, "impl30705_890");
  const impl30706_891 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_errno_reset", { "rettype": "int32", "argtypes": [["pj", "pointer"]] }, opts__209__auto__);
  }, "impl30706_891");
  f30702_889 = /* @__PURE__ */ __name(function(...args30703) {
    const self30707_892 = this;
    const G__30778_893 = args30703.length;
    switch (G__30778_893) {
      case 0:
        return impl30705_890.call(self30707_892);
        break;
      case 1:
        return impl30706_891.call(self30707_892, args30703[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args30703.length ?? ""}`);
    }
    ;
  }, "f30702_889");
  return f30702_889;
})();
var proj_insert_object_session_destroy = /* @__PURE__ */ (() => {
  let f30859_895 = null;
  const impl30862_896 = /* @__PURE__ */ __name(function() {
    return proj_insert_object_session_destroy({});
  }, "impl30862_896");
  const impl30863_897 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_insert_object_session_destroy", { "rettype": "void", "argtypes": [["context", "pointer"], ["session", "pointer"]] }, opts__209__auto__);
  }, "impl30863_897");
  f30859_895 = /* @__PURE__ */ __name(function(...args30860) {
    const self30864_898 = this;
    const G__30935_899 = args30860.length;
    switch (G__30935_899) {
      case 0:
        return impl30862_896.call(self30864_898);
        break;
      case 1:
        return impl30863_897.call(self30864_898, args30860[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args30860.length ?? ""}`);
    }
    ;
  }, "f30859_895");
  return f30859_895;
})();
var proj_create_engineering_crs = /* @__PURE__ */ (() => {
  let f31016_901 = null;
  const impl31019_902 = /* @__PURE__ */ __name(function() {
    return proj_create_engineering_crs({});
  }, "impl31019_902");
  const impl31020_903 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_engineering_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crsName", "string"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl31020_903");
  f31016_901 = /* @__PURE__ */ __name(function(...args31017) {
    const self31021_904 = this;
    const G__31092_905 = args31017.length;
    switch (G__31092_905) {
      case 0:
        return impl31019_902.call(self31021_904);
        break;
      case 1:
        return impl31020_903.call(self31021_904, args31017[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args31017.length ?? ""}`);
    }
    ;
  }, "f31016_901");
  return f31016_901;
})();
var proj_crs_get_geodetic_crs = /* @__PURE__ */ (() => {
  let f31173_907 = null;
  const impl31176_908 = /* @__PURE__ */ __name(function() {
    return proj_crs_get_geodetic_crs({});
  }, "impl31176_908");
  const impl31177_909 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_get_geodetic_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl31177_909");
  f31173_907 = /* @__PURE__ */ __name(function(...args31174) {
    const self31178_910 = this;
    const G__31249_911 = args31174.length;
    switch (G__31249_911) {
      case 0:
        return impl31176_908.call(self31178_910);
        break;
      case 1:
        return impl31177_909.call(self31178_910, args31174[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args31174.length ?? ""}`);
    }
    ;
  }, "f31173_907");
  return f31173_907;
})();
var proj_create_from_wkt = /* @__PURE__ */ (() => {
  let f31330_913 = null;
  const impl31333_914 = /* @__PURE__ */ __name(function() {
    return proj_create_from_wkt({});
  }, "impl31333_914");
  const impl31334_915 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_create_from_wkt", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["wkt", "string"], ["options", "pointer?"], ["out_warnings", "pointer?"], ["out_grammar_errors", "pointer?"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl31334_915");
  f31330_913 = /* @__PURE__ */ __name(function(...args31331) {
    const self31335_916 = this;
    const G__31406_917 = args31331.length;
    switch (G__31406_917) {
      case 0:
        return impl31333_914.call(self31335_916);
        break;
      case 1:
        return impl31334_915.call(self31335_916, args31331[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args31331.length ?? ""}`);
    }
    ;
  }, "f31330_913");
  return f31330_913;
})();
var proj_crs_is_dynamic = /* @__PURE__ */ (() => {
  let f31487_919 = null;
  const impl31490_920 = /* @__PURE__ */ __name(function() {
    return proj_crs_is_dynamic({});
  }, "impl31490_920");
  const impl31491_921 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_is_dynamic", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, opts__209__auto__);
  }, "impl31491_921");
  f31487_919 = /* @__PURE__ */ __name(function(...args31488) {
    const self31492_922 = this;
    const G__31563_923 = args31488.length;
    switch (G__31563_923) {
      case 0:
        return impl31490_920.call(self31492_922);
        break;
      case 1:
        return impl31491_921.call(self31492_922, args31488[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args31488.length ?? ""}`);
    }
    ;
  }, "f31487_919");
  return f31487_919;
})();
var proj_crs_get_horizontal_datum = /* @__PURE__ */ (() => {
  let f31644_925 = null;
  const impl31647_926 = /* @__PURE__ */ __name(function() {
    return proj_crs_get_horizontal_datum({});
  }, "impl31647_926");
  const impl31648_927 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_crs_get_horizontal_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__209__auto__);
  }, "impl31648_927");
  f31644_925 = /* @__PURE__ */ __name(function(...args31645) {
    const self31649_928 = this;
    const G__31720_929 = args31645.length;
    switch (G__31720_929) {
      case 0:
        return impl31647_926.call(self31649_928);
        break;
      case 1:
        return impl31648_927.call(self31649_928, args31645[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args31645.length ?? ""}`);
    }
    ;
  }, "f31644_925");
  return f31644_925;
})();
var proj_get_codes_from_database = /* @__PURE__ */ (() => {
  let f31801_931 = null;
  const impl31804_932 = /* @__PURE__ */ __name(function() {
    return proj_get_codes_from_database({});
  }, "impl31804_932");
  const impl31805_933 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_codes_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["type", "int32", "default", 8], ["allow_deprecated", "int32", "default", 1]], "proj-returns": "string-list" }, opts__209__auto__);
  }, "impl31805_933");
  f31801_931 = /* @__PURE__ */ __name(function(...args31802) {
    const self31806_934 = this;
    const G__31877_935 = args31802.length;
    switch (G__31877_935) {
      case 0:
        return impl31804_932.call(self31806_934);
        break;
      case 1:
        return impl31805_933.call(self31806_934, args31802[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args31802.length ?? ""}`);
    }
    ;
  }, "f31801_931");
  return f31801_931;
})();
var proj_as_projjson = /* @__PURE__ */ (() => {
  let f31958_937 = null;
  const impl31961_938 = /* @__PURE__ */ __name(function() {
    return proj_as_projjson({});
  }, "impl31961_938");
  const impl31962_939 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_as_projjson", { "rettype": "string", "argtypes": [["context", "pointer"], ["pj", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]] }, opts__209__auto__);
  }, "impl31962_939");
  f31958_937 = /* @__PURE__ */ __name(function(...args31959) {
    const self31963_940 = this;
    const G__32034_941 = args31959.length;
    switch (G__32034_941) {
      case 0:
        return impl31961_938.call(self31963_940);
        break;
      case 1:
        return impl31962_939.call(self31963_940, args31959[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args31959.length ?? ""}`);
    }
    ;
  }, "f31958_937");
  return f31958_937;
})();
var proj_get_non_deprecated = /* @__PURE__ */ (() => {
  let f32115_943 = null;
  const impl32118_944 = /* @__PURE__ */ __name(function() {
    return proj_get_non_deprecated({});
  }, "impl32118_944");
  const impl32119_945 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_get_non_deprecated", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["obj", "pointer"]], "proj-returns": "pj-list" }, opts__209__auto__);
  }, "impl32119_945");
  f32115_943 = /* @__PURE__ */ __name(function(...args32116) {
    const self32120_946 = this;
    const G__32191_947 = args32116.length;
    switch (G__32191_947) {
      case 0:
        return impl32118_944.call(self32120_946);
        break;
      case 1:
        return impl32119_945.call(self32120_946, args32116[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args32116.length ?? ""}`);
    }
    ;
  }, "f32115_943");
  return f32115_943;
})();
var proj_coordoperation_get_param_count = /* @__PURE__ */ (() => {
  let f32272_949 = null;
  const impl32275_950 = /* @__PURE__ */ __name(function() {
    return proj_coordoperation_get_param_count({});
  }, "impl32275_950");
  const impl32276_951 = /* @__PURE__ */ __name(function(opts__209__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_param_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__209__auto__);
  }, "impl32276_951");
  f32272_949 = /* @__PURE__ */ __name(function(...args32273) {
    const self32277_952 = this;
    const G__32348_953 = args32273.length;
    switch (G__32348_953) {
      case 0:
        return impl32275_950.call(self32277_952);
        break;
      case 1:
        return impl32276_951.call(self32277_952, args32273[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args32273.length ?? ""}`);
    }
    ;
  }, "f32272_949");
  return f32272_949;
})();
var projCrsCreateBoundCrs = /* @__PURE__ */ (() => {
  let f32429_955 = null;
  const impl32432_956 = /* @__PURE__ */ __name(async function() {
    return projCrsCreateBoundCrs({});
  }, "impl32432_956");
  const impl32433_957 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_create_bound_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["base_crs", "pointer"], ["hub_crs", "pointer"], ["transformation", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl32433_957");
  f32429_955 = /* @__PURE__ */ __name(function(...args32430) {
    const self32434_958 = this;
    const G__32505_959 = args32430.length;
    switch (G__32505_959) {
      case 0:
        return impl32432_956.call(self32434_958);
        break;
      case 1:
        return impl32433_957.call(self32434_958, args32430[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args32430.length ?? ""}`);
    }
    ;
  }, "f32429_955");
  return f32429_955;
})();
var projContextCreate = /* @__PURE__ */ (() => {
  let f32586_961 = null;
  const impl32589_962 = /* @__PURE__ */ __name(async function() {
    return projContextCreate({});
  }, "impl32589_962");
  const impl32590_963 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_create", { "rettype": "pointer", "argtypes": [], "proj-returns": "pj-context" }, opts__210__auto__, "camel");
  }, "impl32590_963");
  f32586_961 = /* @__PURE__ */ __name(function(...args32587) {
    const self32591_964 = this;
    const G__32662_965 = args32587.length;
    switch (G__32662_965) {
      case 0:
        return impl32589_962.call(self32591_964);
        break;
      case 1:
        return impl32590_963.call(self32591_964, args32587[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args32587.length ?? ""}`);
    }
    ;
  }, "f32586_961");
  return f32586_961;
})();
var projGetCrsListParametersCreate = /* @__PURE__ */ (() => {
  let f32743_967 = null;
  const impl32746_968 = /* @__PURE__ */ __name(async function() {
    return projGetCrsListParametersCreate({});
  }, "impl32746_968");
  const impl32747_969 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_crs_list_parameters_create", { "rettype": "pointer", "argtypes": [], "proj-returns": "pj-crs-list-parameters" }, opts__210__auto__, "camel");
  }, "impl32747_969");
  f32743_967 = /* @__PURE__ */ __name(function(...args32744) {
    const self32748_970 = this;
    const G__32819_971 = args32744.length;
    switch (G__32819_971) {
      case 0:
        return impl32746_968.call(self32748_970);
        break;
      case 1:
        return impl32747_969.call(self32748_970, args32744[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args32744.length ?? ""}`);
    }
    ;
  }, "f32743_967");
  return f32743_967;
})();
var projIsDeprecated = /* @__PURE__ */ (() => {
  let f32900_973 = null;
  const impl32903_974 = /* @__PURE__ */ __name(async function() {
    return projIsDeprecated({});
  }, "impl32903_974");
  const impl32904_975 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_is_deprecated", { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl32904_975");
  f32900_973 = /* @__PURE__ */ __name(function(...args32901) {
    const self32905_976 = this;
    const G__32976_977 = args32901.length;
    switch (G__32976_977) {
      case 0:
        return impl32903_974.call(self32905_976);
        break;
      case 1:
        return impl32904_975.call(self32905_976, args32901[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args32901.length ?? ""}`);
    }
    ;
  }, "f32900_973");
  return f32900_973;
})();
var projCreateFromName = /* @__PURE__ */ (() => {
  let f33057_979 = null;
  const impl33060_980 = /* @__PURE__ */ __name(async function() {
    return projCreateFromName({});
  }, "impl33060_980");
  const impl33061_981 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_from_name", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["searchedName", "string"], ["types", "pointer"], ["typesCount", "size-t"], ["approximateMatch", "int32"], ["limitResultCount", "size-t"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj-list" }, opts__210__auto__, "camel");
  }, "impl33061_981");
  f33057_979 = /* @__PURE__ */ __name(function(...args33058) {
    const self33062_982 = this;
    const G__33133_983 = args33058.length;
    switch (G__33133_983) {
      case 0:
        return impl33060_980.call(self33062_982);
        break;
      case 1:
        return impl33061_981.call(self33062_982, args33058[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args33058.length ?? ""}`);
    }
    ;
  }, "f33057_979");
  return f33057_979;
})();
var projPrimeMeridianGetParameters = /* @__PURE__ */ (() => {
  let f33214_985 = null;
  const impl33217_986 = /* @__PURE__ */ __name(async function() {
    return projPrimeMeridianGetParameters({});
  }, "impl33217_986");
  const impl33218_987 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_prime_meridian_get_parameters", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["longitude", "double"], ["unit-conv-factor", "double"], ["unit-name", "string"]], "argtypes": [["ctx", "pointer"], ["prime_meridian", "pointer"], ["out_longitude", "pointer"], ["out_unit_conv_factor", "pointer"], ["out_unit_name", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl33218_987");
  f33214_985 = /* @__PURE__ */ __name(function(...args33215) {
    const self33219_988 = this;
    const G__33290_989 = args33215.length;
    switch (G__33290_989) {
      case 0:
        return impl33217_986.call(self33219_988);
        break;
      case 1:
        return impl33218_987.call(self33219_988, args33215[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args33215.length ?? ""}`);
    }
    ;
  }, "f33214_985");
  return f33214_985;
})();
var projStringDestroy = /* @__PURE__ */ (() => {
  let f33371_991 = null;
  const impl33374_992 = /* @__PURE__ */ __name(async function() {
    return projStringDestroy({});
  }, "impl33374_992");
  const impl33375_993 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_string_destroy", { "rettype": "void", "argtypes": [["str", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl33375_993");
  f33371_991 = /* @__PURE__ */ __name(function(...args33372) {
    const self33376_994 = this;
    const G__33447_995 = args33372.length;
    switch (G__33447_995) {
      case 0:
        return impl33374_992.call(self33376_994);
        break;
      case 1:
        return impl33375_993.call(self33376_994, args33372[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args33372.length ?? ""}`);
    }
    ;
  }, "f33371_991");
  return f33371_991;
})();
var projLogFunc = /* @__PURE__ */ (() => {
  let f33528_997 = null;
  const impl33531_998 = /* @__PURE__ */ __name(async function() {
    return projLogFunc({});
  }, "impl33531_998");
  const impl33532_999 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_log_func", { "rettype": "void", "argtypes": [["context", "pointer"], ["app_data", "pointer?"], ["logf", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl33532_999");
  f33528_997 = /* @__PURE__ */ __name(function(...args33529) {
    const self33533_1000 = this;
    const G__33604_1001 = args33529.length;
    switch (G__33604_1001) {
      case 0:
        return impl33531_998.call(self33533_1000);
        break;
      case 1:
        return impl33532_999.call(self33533_1000, args33529[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args33529.length ?? ""}`);
    }
    ;
  }, "f33528_997");
  return f33528_997;
})();
var projCreateGeocentricCrs = /* @__PURE__ */ (() => {
  let f33685_1003 = null;
  const impl33688_1004 = /* @__PURE__ */ __name(async function() {
    return projCreateGeocentricCrs({});
  }, "impl33688_1004");
  const impl33689_1005 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_geocentric_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["ellps_name", "string"], ["semi_major_metre", "float64"], ["inv_flattening", "float64"], ["prime_meridian_name", "string"], ["prime_meridian_offset", "float64"], ["angular_units", "string"], ["angular_units_conv", "float64"], ["linear_units", "string"], ["linear_units_conv", "float64"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl33689_1005");
  f33685_1003 = /* @__PURE__ */ __name(function(...args33686) {
    const self33690_1006 = this;
    const G__33761_1007 = args33686.length;
    switch (G__33761_1007) {
      case 0:
        return impl33688_1004.call(self33690_1006);
        break;
      case 1:
        return impl33689_1005.call(self33690_1006, args33686[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args33686.length ?? ""}`);
    }
    ;
  }, "f33685_1003");
  return f33685_1003;
})();
var projUnitListDestroy = /* @__PURE__ */ (() => {
  let f33842_1009 = null;
  const impl33845_1010 = /* @__PURE__ */ __name(async function() {
    return projUnitListDestroy({});
  }, "impl33845_1010");
  const impl33846_1011 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_unit_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl33846_1011");
  f33842_1009 = /* @__PURE__ */ __name(function(...args33843) {
    const self33847_1012 = this;
    const G__33918_1013 = args33843.length;
    switch (G__33918_1013) {
      case 0:
        return impl33845_1010.call(self33847_1012);
        break;
      case 1:
        return impl33846_1011.call(self33847_1012, args33843[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args33843.length ?? ""}`);
    }
    ;
  }, "f33842_1009");
  return f33842_1009;
})();
var projAssignContext = /* @__PURE__ */ (() => {
  let f33999_1015 = null;
  const impl34002_1016 = /* @__PURE__ */ __name(async function() {
    return projAssignContext({});
  }, "impl34002_1016");
  const impl34003_1017 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_assign_context", { "rettype": "void", "argtypes": [["pj", "pointer"], ["context", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl34003_1017");
  f33999_1015 = /* @__PURE__ */ __name(function(...args34000) {
    const self34004_1018 = this;
    const G__34075_1019 = args34000.length;
    switch (G__34075_1019) {
      case 0:
        return impl34002_1016.call(self34004_1018);
        break;
      case 1:
        return impl34003_1017.call(self34004_1018, args34000[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args34000.length ?? ""}`);
    }
    ;
  }, "f33999_1015");
  return f33999_1015;
})();
var projCrsCreateProjected3DCrsFrom2D = /* @__PURE__ */ (() => {
  let f34156_1021 = null;
  const impl34159_1022 = /* @__PURE__ */ __name(async function() {
    return projCrsCreateProjected3DCrsFrom2D({});
  }, "impl34159_1022");
  const impl34160_1023 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_create_projected_3D_crs_from_2D", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["projected_2D_crs", "pointer"], ["geog_3D_crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl34160_1023");
  f34156_1021 = /* @__PURE__ */ __name(function(...args34157) {
    const self34161_1024 = this;
    const G__34232_1025 = args34157.length;
    switch (G__34232_1025) {
      case 0:
        return impl34159_1022.call(self34161_1024);
        break;
      case 1:
        return impl34160_1023.call(self34161_1024, args34157[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args34157.length ?? ""}`);
    }
    ;
  }, "f34156_1021");
  return f34156_1021;
})();
var projOperationFactoryContextSetAreaOfInterestName = /* @__PURE__ */ (() => {
  let f34313_1027 = null;
  const impl34316_1028 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetAreaOfInterestName({});
  }, "impl34316_1028");
  const impl34317_1029 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_area_of_interest_name", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["area_name", "string"]] }, opts__210__auto__, "camel");
  }, "impl34317_1029");
  f34313_1027 = /* @__PURE__ */ __name(function(...args34314) {
    const self34318_1030 = this;
    const G__34389_1031 = args34314.length;
    switch (G__34389_1031) {
      case 0:
        return impl34316_1028.call(self34318_1030);
        break;
      case 1:
        return impl34317_1029.call(self34318_1030, args34314[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args34314.length ?? ""}`);
    }
    ;
  }, "f34313_1027");
  return f34313_1027;
})();
var projGetEllipsoid = /* @__PURE__ */ (() => {
  let f34470_1033 = null;
  const impl34473_1034 = /* @__PURE__ */ __name(async function() {
    return projGetEllipsoid({});
  }, "impl34473_1034");
  const impl34474_1035 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_ellipsoid", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl34474_1035");
  f34470_1033 = /* @__PURE__ */ __name(function(...args34471) {
    const self34475_1036 = this;
    const G__34546_1037 = args34471.length;
    switch (G__34546_1037) {
      case 0:
        return impl34473_1034.call(self34475_1036);
        break;
      case 1:
        return impl34474_1035.call(self34475_1036, args34471[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args34471.length ?? ""}`);
    }
    ;
  }, "f34470_1033");
  return f34470_1033;
})();
var projCoordoperationGetGridUsed = /* @__PURE__ */ (() => {
  let f34627_1039 = null;
  const impl34630_1040 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationGetGridUsed({});
  }, "impl34630_1040");
  const impl34631_1041 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_grid_used", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["short-name", "string"], ["full-name", "string"], ["package-name", "string"], ["url", "string"], ["direct-download", "int"], ["open-license", "int"], ["available", "int"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["index", "int32"], ["out_short_name", "pointer"], ["out_full_name", "pointer"], ["out_package_name", "pointer"], ["out_url", "pointer"], ["out_direct_download", "pointer"], ["out_open_license", "pointer"], ["out_available", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl34631_1041");
  f34627_1039 = /* @__PURE__ */ __name(function(...args34628) {
    const self34632_1042 = this;
    const G__34703_1043 = args34628.length;
    switch (G__34703_1043) {
      case 0:
        return impl34630_1040.call(self34632_1042);
        break;
      case 1:
        return impl34631_1041.call(self34632_1042, args34628[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args34628.length ?? ""}`);
    }
    ;
  }, "f34627_1039");
  return f34627_1039;
})();
var projCrsIsDerived = /* @__PURE__ */ (() => {
  let f34784_1045 = null;
  const impl34787_1046 = /* @__PURE__ */ __name(async function() {
    return projCrsIsDerived({});
  }, "impl34787_1046");
  const impl34788_1047 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_is_derived", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl34788_1047");
  f34784_1045 = /* @__PURE__ */ __name(function(...args34785) {
    const self34789_1048 = this;
    const G__34860_1049 = args34785.length;
    switch (G__34860_1049) {
      case 0:
        return impl34787_1046.call(self34789_1048);
        break;
      case 1:
        return impl34788_1047.call(self34789_1048, args34785[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args34785.length ?? ""}`);
    }
    ;
  }, "f34784_1045");
  return f34784_1045;
})();
var projIntListDestroy = /* @__PURE__ */ (() => {
  let f34941_1051 = null;
  const impl34944_1052 = /* @__PURE__ */ __name(async function() {
    return projIntListDestroy({});
  }, "impl34944_1052");
  const impl34945_1053 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_int_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl34945_1053");
  f34941_1051 = /* @__PURE__ */ __name(function(...args34942) {
    const self34946_1054 = this;
    const G__35017_1055 = args34942.length;
    switch (G__35017_1055) {
      case 0:
        return impl34944_1052.call(self34946_1054);
        break;
      case 1:
        return impl34945_1053.call(self34946_1054, args34942[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args34942.length ?? ""}`);
    }
    ;
  }, "f34941_1051");
  return f34941_1051;
})();
var projCrsGetCoordinateSystem = /* @__PURE__ */ (() => {
  let f35098_1057 = null;
  const impl35101_1058 = /* @__PURE__ */ __name(async function() {
    return projCrsGetCoordinateSystem({});
  }, "impl35101_1058");
  const impl35102_1059 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_get_coordinate_system", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl35102_1059");
  f35098_1057 = /* @__PURE__ */ __name(function(...args35099) {
    const self35103_1060 = this;
    const G__35174_1061 = args35099.length;
    switch (G__35174_1061) {
      case 0:
        return impl35101_1058.call(self35103_1060);
        break;
      case 1:
        return impl35102_1059.call(self35103_1060, args35099[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args35099.length ?? ""}`);
    }
    ;
  }, "f35098_1057");
  return f35098_1057;
})();
var projContextSetDatabasePath = /* @__PURE__ */ (() => {
  let f35255_1063 = null;
  const impl35258_1064 = /* @__PURE__ */ __name(async function() {
    return projContextSetDatabasePath({});
  }, "impl35258_1064");
  const impl35259_1065 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_set_database_path", { "rettype": "int32", "argtypes": [["context", "pointer"], ["db-path", "string"], ["aux-db-paths", "pointer?"], ["options", "pointer?"]] }, opts__210__auto__, "camel");
  }, "impl35259_1065");
  f35255_1063 = /* @__PURE__ */ __name(function(...args35256) {
    const self35260_1066 = this;
    const G__35331_1067 = args35256.length;
    switch (G__35331_1067) {
      case 0:
        return impl35258_1064.call(self35260_1066);
        break;
      case 1:
        return impl35259_1065.call(self35260_1066, args35256[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args35256.length ?? ""}`);
    }
    ;
  }, "f35255_1063");
  return f35255_1063;
})();
var projGetCrsInfoListFromDatabase = /* @__PURE__ */ (() => {
  let f35412_1069 = null;
  const impl35415_1070 = /* @__PURE__ */ __name(async function() {
    return projGetCrsInfoListFromDatabase({});
  }, "impl35415_1070");
  const impl35416_1071 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_crs_info_list_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["params", "pointer"], ["out_result_count", "pointer"]], "proj-returns": "struct-list", "struct-def": "proj-crs-info", "struct-fields": [["auth-name", "string", 0], ["code", "string", 4], ["name", "string", 8], ["type", "int", 12], ["deprecated", "boolean", 16], ["bbox-valid", "boolean", 20], ["west-lon-degree", "double", 24], ["south-lat-degree", "double", 32], ["east-lon-degree", "double", 40], ["north-lat-degree", "double", 48], ["area-name", "string", 56], ["projection-method-name", "string", 60], ["celestial-body-name", "string", 64]], "struct-destroy-fn": "proj_crs_info_list_destroy", "struct-params-create": "proj_get_crs_list_parameters_create", "struct-params-destroy": "proj_get_crs_list_parameters_destroy" }, opts__210__auto__, "camel");
  }, "impl35416_1071");
  f35412_1069 = /* @__PURE__ */ __name(function(...args35413) {
    const self35417_1072 = this;
    const G__35488_1073 = args35413.length;
    switch (G__35488_1073) {
      case 0:
        return impl35415_1070.call(self35417_1072);
        break;
      case 1:
        return impl35416_1071.call(self35417_1072, args35413[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args35413.length ?? ""}`);
    }
    ;
  }, "f35412_1069");
  return f35412_1069;
})();
var projIsEquivalentTo = /* @__PURE__ */ (() => {
  let f35569_1075 = null;
  const impl35572_1076 = /* @__PURE__ */ __name(async function() {
    return projIsEquivalentTo({});
  }, "impl35572_1076");
  const impl35573_1077 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_is_equivalent_to", { "rettype": "int32", "argtypes": [["obj", "pointer"], ["other", "pointer"], ["criterion", "int32"]] }, opts__210__auto__, "camel");
  }, "impl35573_1077");
  f35569_1075 = /* @__PURE__ */ __name(function(...args35570) {
    const self35574_1078 = this;
    const G__35645_1079 = args35570.length;
    switch (G__35645_1079) {
      case 0:
        return impl35572_1076.call(self35574_1078);
        break;
      case 1:
        return impl35573_1077.call(self35574_1078, args35570[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args35570.length ?? ""}`);
    }
    ;
  }, "f35569_1075");
  return f35569_1075;
})();
var projContextSetEnableNetwork = /* @__PURE__ */ (() => {
  let f35726_1081 = null;
  const impl35729_1082 = /* @__PURE__ */ __name(async function() {
    return projContextSetEnableNetwork({});
  }, "impl35729_1082");
  const impl35730_1083 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_set_enable_network", { "rettype": "int32", "argtypes": [["context", "pointer"], ["enabled", "int32"]] }, opts__210__auto__, "camel");
  }, "impl35730_1083");
  f35726_1081 = /* @__PURE__ */ __name(function(...args35727) {
    const self35731_1084 = this;
    const G__35802_1085 = args35727.length;
    switch (G__35802_1085) {
      case 0:
        return impl35729_1082.call(self35731_1084);
        break;
      case 1:
        return impl35730_1083.call(self35731_1084, args35727[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args35727.length ?? ""}`);
    }
    ;
  }, "f35726_1081");
  return f35726_1081;
})();
var projCrsCreateBoundVerticalCrs = /* @__PURE__ */ (() => {
  let f35883_1087 = null;
  const impl35886_1088 = /* @__PURE__ */ __name(async function() {
    return projCrsCreateBoundVerticalCrs({});
  }, "impl35886_1088");
  const impl35887_1089 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_create_bound_vertical_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["vert_crs", "pointer"], ["hub_geographic_3D_crs", "pointer"], ["grid_name", "string"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl35887_1089");
  f35883_1087 = /* @__PURE__ */ __name(function(...args35884) {
    const self35888_1090 = this;
    const G__35959_1091 = args35884.length;
    switch (G__35959_1091) {
      case 0:
        return impl35886_1088.call(self35888_1090);
        break;
      case 1:
        return impl35887_1089.call(self35888_1090, args35884[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args35884.length ?? ""}`);
    }
    ;
  }, "f35883_1087");
  return f35883_1087;
})();
var projOperationFactoryContextSetCrsExtentUse = /* @__PURE__ */ (() => {
  let f36040_1093 = null;
  const impl36043_1094 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetCrsExtentUse({});
  }, "impl36043_1094");
  const impl36044_1095 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_crs_extent_use", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["use", "int32"]] }, opts__210__auto__, "camel");
  }, "impl36044_1095");
  f36040_1093 = /* @__PURE__ */ __name(function(...args36041) {
    const self36045_1096 = this;
    const G__36116_1097 = args36041.length;
    switch (G__36116_1097) {
      case 0:
        return impl36043_1094.call(self36045_1096);
        break;
      case 1:
        return impl36044_1095.call(self36045_1096, args36041[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args36041.length ?? ""}`);
    }
    ;
  }, "f36040_1093");
  return f36040_1093;
})();
var projCreateGeographicCrs = /* @__PURE__ */ (() => {
  let f36197_1099 = null;
  const impl36200_1100 = /* @__PURE__ */ __name(async function() {
    return projCreateGeographicCrs({});
  }, "impl36200_1100");
  const impl36201_1101 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_geographic_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["ellps_name", "string"], ["semi_major_metre", "float64"], ["inv_flattening", "float64"], ["prime_meridian_name", "string"], ["prime_meridian_offset", "float64"], ["pm_angular_units", "string"], ["pm_units_conv", "float64"], ["ellipsoidal_cs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl36201_1101");
  f36197_1099 = /* @__PURE__ */ __name(function(...args36198) {
    const self36202_1102 = this;
    const G__36273_1103 = args36198.length;
    switch (G__36273_1103) {
      case 0:
        return impl36200_1100.call(self36202_1102);
        break;
      case 1:
        return impl36201_1101.call(self36202_1102, args36198[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args36198.length ?? ""}`);
    }
    ;
  }, "f36197_1099");
  return f36197_1099;
})();
var projCoordoperationGetGridUsedCount = /* @__PURE__ */ (() => {
  let f36354_1105 = null;
  const impl36357_1106 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationGetGridUsedCount({});
  }, "impl36357_1106");
  const impl36358_1107 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_grid_used_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl36358_1107");
  f36354_1105 = /* @__PURE__ */ __name(function(...args36355) {
    const self36359_1108 = this;
    const G__36430_1109 = args36355.length;
    switch (G__36430_1109) {
      case 0:
        return impl36357_1106.call(self36359_1108);
        break;
      case 1:
        return impl36358_1107.call(self36359_1108, args36355[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args36355.length ?? ""}`);
    }
    ;
  }, "f36354_1105");
  return f36354_1105;
})();
var projListGetCount = /* @__PURE__ */ (() => {
  let f36511_1111 = null;
  const impl36514_1112 = /* @__PURE__ */ __name(async function() {
    return projListGetCount({});
  }, "impl36514_1112");
  const impl36515_1113 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_list_get_count", { "rettype": "int32", "argtypes": [["result", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl36515_1113");
  f36511_1111 = /* @__PURE__ */ __name(function(...args36512) {
    const self36516_1114 = this;
    const G__36587_1115 = args36512.length;
    switch (G__36587_1115) {
      case 0:
        return impl36514_1112.call(self36516_1114);
        break;
      case 1:
        return impl36515_1113.call(self36516_1114, args36512[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args36512.length ?? ""}`);
    }
    ;
  }, "f36511_1111");
  return f36511_1111;
})();
var projCreateTransformation = /* @__PURE__ */ (() => {
  let f36668_1117 = null;
  const impl36671_1118 = /* @__PURE__ */ __name(async function() {
    return projCreateTransformation({});
  }, "impl36671_1118");
  const impl36672_1119 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_transformation", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["name", "string"], ["auth_name", "string"], ["code", "string"], ["source_crs", "pointer"], ["target_crs", "pointer"], ["interpolation_crs", "pointer"], ["method_name", "string"], ["method_auth_name", "string"], ["method_code", "string"], ["param_count", "int32"], ["params", "pointer"], ["accuracy", "float64"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl36672_1119");
  f36668_1117 = /* @__PURE__ */ __name(function(...args36669) {
    const self36673_1120 = this;
    const G__36744_1121 = args36669.length;
    switch (G__36744_1121) {
      case 0:
        return impl36671_1118.call(self36673_1120);
        break;
      case 1:
        return impl36672_1119.call(self36673_1120, args36669[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args36669.length ?? ""}`);
    }
    ;
  }, "f36668_1117");
  return f36668_1117;
})();
var projCoordoperationGetAccuracy = /* @__PURE__ */ (() => {
  let f36825_1123 = null;
  const impl36828_1124 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationGetAccuracy({});
  }, "impl36828_1124");
  const impl36829_1125 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_accuracy", { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl36829_1125");
  f36825_1123 = /* @__PURE__ */ __name(function(...args36826) {
    const self36830_1126 = this;
    const G__36901_1127 = args36826.length;
    switch (G__36901_1127) {
      case 0:
        return impl36828_1124.call(self36830_1126);
        break;
      case 1:
        return impl36829_1125.call(self36830_1126, args36826[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args36826.length ?? ""}`);
    }
    ;
  }, "f36825_1123");
  return f36825_1123;
})();
var projCoordoperationGetParam = /* @__PURE__ */ (() => {
  let f36982_1129 = null;
  const impl36985_1130 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationGetParam({});
  }, "impl36985_1130");
  const impl36986_1131 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_param", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["name", "string"], ["auth-name", "string"], ["code", "string"], ["value", "double"], ["value-string", "string"], ["unit-conv-factor", "double"], ["unit-name", "string"], ["unit-auth-name", "string"], ["unit-code", "string"], ["unit-category", "string"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["index", "int32"], ["out_name", "pointer"], ["out_auth_name", "pointer"], ["out_code", "pointer"], ["out_value", "pointer"], ["out_value_string", "pointer"], ["out_unit_conv_factor", "pointer"], ["out_unit_name", "pointer"], ["out_unit_auth_name", "pointer"], ["out_unit_code", "pointer"], ["out_unit_category", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl36986_1131");
  f36982_1129 = /* @__PURE__ */ __name(function(...args36983) {
    const self36987_1132 = this;
    const G__37058_1133 = args36983.length;
    switch (G__37058_1133) {
      case 0:
        return impl36985_1130.call(self36987_1132);
        break;
      case 1:
        return impl36986_1131.call(self36987_1132, args36983[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args36983.length ?? ""}`);
    }
    ;
  }, "f36982_1129");
  return f36982_1129;
})();
var projCreate = /* @__PURE__ */ (() => {
  let f37139_1135 = null;
  const impl37142_1136 = /* @__PURE__ */ __name(async function() {
    return projCreate({});
  }, "impl37142_1136");
  const impl37143_1137 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["definition", "string"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl37143_1137");
  f37139_1135 = /* @__PURE__ */ __name(function(...args37140) {
    const self37144_1138 = this;
    const G__37215_1139 = args37140.length;
    switch (G__37215_1139) {
      case 0:
        return impl37142_1136.call(self37144_1138);
        break;
      case 1:
        return impl37143_1137.call(self37144_1138, args37140[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args37140.length ?? ""}`);
    }
    ;
  }, "f37139_1135");
  return f37139_1135;
})();
var projCreateConversion = /* @__PURE__ */ (() => {
  let f37296_1141 = null;
  const impl37299_1142 = /* @__PURE__ */ __name(async function() {
    return projCreateConversion({});
  }, "impl37299_1142");
  const impl37300_1143 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_conversion", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["name", "string"], ["auth_name", "string"], ["code", "string"], ["method_name", "string"], ["method_auth_name", "string"], ["method_code", "string"], ["param_count", "int32"], ["params", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl37300_1143");
  f37296_1141 = /* @__PURE__ */ __name(function(...args37297) {
    const self37301_1144 = this;
    const G__37372_1145 = args37297.length;
    switch (G__37372_1145) {
      case 0:
        return impl37299_1142.call(self37301_1144);
        break;
      case 1:
        return impl37300_1143.call(self37301_1144, args37297[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args37297.length ?? ""}`);
    }
    ;
  }, "f37296_1141");
  return f37296_1141;
})();
var projGetType = /* @__PURE__ */ (() => {
  let f37453_1147 = null;
  const impl37456_1148 = /* @__PURE__ */ __name(async function() {
    return projGetType({});
  }, "impl37456_1148");
  const impl37457_1149 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_type", { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl37457_1149");
  f37453_1147 = /* @__PURE__ */ __name(function(...args37454) {
    const self37458_1150 = this;
    const G__37529_1151 = args37454.length;
    switch (G__37529_1151) {
      case 0:
        return impl37456_1148.call(self37458_1150);
        break;
      case 1:
        return impl37457_1149.call(self37458_1150, args37454[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args37454.length ?? ""}`);
    }
    ;
  }, "f37453_1147");
  return f37453_1147;
})();
var projContextGetDatabaseMetadata = /* @__PURE__ */ (() => {
  let f37610_1153 = null;
  const impl37613_1154 = /* @__PURE__ */ __name(async function() {
    return projContextGetDatabaseMetadata({});
  }, "impl37613_1154");
  const impl37614_1155 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_get_database_metadata", { "rettype": "string", "argtypes": [["context", "pointer"], ["key", "string"]] }, opts__210__auto__, "camel");
  }, "impl37614_1155");
  f37610_1153 = /* @__PURE__ */ __name(function(...args37611) {
    const self37615_1156 = this;
    const G__37686_1157 = args37611.length;
    switch (G__37686_1157) {
      case 0:
        return impl37613_1154.call(self37615_1156);
        break;
      case 1:
        return impl37614_1155.call(self37615_1156, args37611[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args37611.length ?? ""}`);
    }
    ;
  }, "f37610_1153");
  return f37610_1153;
})();
var projCrsAlterGeodeticCrs = /* @__PURE__ */ (() => {
  let f37767_1159 = null;
  const impl37770_1160 = /* @__PURE__ */ __name(async function() {
    return projCrsAlterGeodeticCrs({});
  }, "impl37770_1160");
  const impl37771_1161 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_alter_geodetic_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["new_geod_crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl37771_1161");
  f37767_1159 = /* @__PURE__ */ __name(function(...args37768) {
    const self37772_1162 = this;
    const G__37843_1163 = args37768.length;
    switch (G__37843_1163) {
      case 0:
        return impl37770_1160.call(self37772_1162);
        break;
      case 1:
        return impl37771_1161.call(self37772_1162, args37768[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args37768.length ?? ""}`);
    }
    ;
  }, "f37767_1159");
  return f37767_1159;
})();
var projConcatoperationGetStepCount = /* @__PURE__ */ (() => {
  let f37924_1165 = null;
  const impl37927_1166 = /* @__PURE__ */ __name(async function() {
    return projConcatoperationGetStepCount({});
  }, "impl37927_1166");
  const impl37928_1167 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_concatoperation_get_step_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["concatoperation", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl37928_1167");
  f37924_1165 = /* @__PURE__ */ __name(function(...args37925) {
    const self37929_1168 = this;
    const G__38000_1169 = args37925.length;
    switch (G__38000_1169) {
      case 0:
        return impl37927_1166.call(self37929_1168);
        break;
      case 1:
        return impl37928_1167.call(self37929_1168, args37925[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args37925.length ?? ""}`);
    }
    ;
  }, "f37924_1165");
  return f37924_1165;
})();
var projOperationFactoryContextSetDiscardSuperseded = /* @__PURE__ */ (() => {
  let f38081_1171 = null;
  const impl38084_1172 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetDiscardSuperseded({});
  }, "impl38084_1172");
  const impl38085_1173 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_discard_superseded", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["discard", "int32"]] }, opts__210__auto__, "camel");
  }, "impl38085_1173");
  f38081_1171 = /* @__PURE__ */ __name(function(...args38082) {
    const self38086_1174 = this;
    const G__38157_1175 = args38082.length;
    switch (G__38157_1175) {
      case 0:
        return impl38084_1172.call(self38086_1174);
        break;
      case 1:
        return impl38085_1173.call(self38086_1174, args38082[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args38082.length ?? ""}`);
    }
    ;
  }, "f38081_1171");
  return f38081_1171;
})();
var projIsDerivedCrs = /* @__PURE__ */ (() => {
  let f38238_1177 = null;
  const impl38241_1178 = /* @__PURE__ */ __name(async function() {
    return projIsDerivedCrs({});
  }, "impl38241_1178");
  const impl38242_1179 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_is_derived_crs", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl38242_1179");
  f38238_1177 = /* @__PURE__ */ __name(function(...args38239) {
    const self38243_1180 = this;
    const G__38314_1181 = args38239.length;
    switch (G__38314_1181) {
      case 0:
        return impl38241_1178.call(self38243_1180);
        break;
      case 1:
        return impl38242_1179.call(self38243_1180, args38239[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args38239.length ?? ""}`);
    }
    ;
  }, "f38238_1177");
  return f38238_1177;
})();
var projGetUnitsFromDatabase = /* @__PURE__ */ (() => {
  let f38395_1183 = null;
  const impl38398_1184 = /* @__PURE__ */ __name(async function() {
    return projGetUnitsFromDatabase({});
  }, "impl38398_1184");
  const impl38399_1185 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_units_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["category", "string?"], ["allow_deprecated", "int32"], ["out_result_count", "pointer"]], "proj-returns": "struct-list", "struct-def": "proj-unit-info", "struct-fields": [["auth-name", "string", 0], ["code", "string", 4], ["name", "string", 8], ["category", "string", 12], ["conv-factor", "double", 16], ["proj-short-name", "string", 24], ["deprecated", "boolean", 28]], "struct-destroy-fn": "proj_unit_list_destroy" }, opts__210__auto__, "camel");
  }, "impl38399_1185");
  f38395_1183 = /* @__PURE__ */ __name(function(...args38396) {
    const self38400_1186 = this;
    const G__38471_1187 = args38396.length;
    switch (G__38471_1187) {
      case 0:
        return impl38398_1184.call(self38400_1186);
        break;
      case 1:
        return impl38399_1185.call(self38400_1186, args38396[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args38396.length ?? ""}`);
    }
    ;
  }, "f38395_1183");
  return f38395_1183;
})();
var projCrsGetCoordoperation = /* @__PURE__ */ (() => {
  let f38552_1189 = null;
  const impl38555_1190 = /* @__PURE__ */ __name(async function() {
    return projCrsGetCoordoperation({});
  }, "impl38555_1190");
  const impl38556_1191 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_get_coordoperation", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl38556_1191");
  f38552_1189 = /* @__PURE__ */ __name(function(...args38553) {
    const self38557_1192 = this;
    const G__38628_1193 = args38553.length;
    switch (G__38628_1193) {
      case 0:
        return impl38555_1190.call(self38557_1192);
        break;
      case 1:
        return impl38556_1191.call(self38557_1192, args38553[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args38553.length ?? ""}`);
    }
    ;
  }, "f38552_1189");
  return f38552_1189;
})();
var projCoordoperationHasBallparkTransformation = /* @__PURE__ */ (() => {
  let f38709_1195 = null;
  const impl38712_1196 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationHasBallparkTransformation({});
  }, "impl38712_1196");
  const impl38713_1197 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_has_ballpark_transformation", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl38713_1197");
  f38709_1195 = /* @__PURE__ */ __name(function(...args38710) {
    const self38714_1198 = this;
    const G__38785_1199 = args38710.length;
    switch (G__38785_1199) {
      case 0:
        return impl38712_1196.call(self38714_1198);
        break;
      case 1:
        return impl38713_1197.call(self38714_1198, args38710[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args38710.length ?? ""}`);
    }
    ;
  }, "f38709_1195");
  return f38709_1195;
})();
var projGetAreaOfUse = /* @__PURE__ */ (() => {
  let f38866_1201 = null;
  const impl38869_1202 = /* @__PURE__ */ __name(async function() {
    return projGetAreaOfUse({});
  }, "impl38869_1202");
  const impl38870_1203 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_area_of_use", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["west-lon-degree", "double"], ["south-lat-degree", "double"], ["east-lon-degree", "double"], ["north-lat-degree", "double"], ["area-name", "string"]], "argtypes": [["context", "pointer"], ["obj", "pointer"], ["out_west_lon_degree", "pointer"], ["out_south_lat_degree", "pointer"], ["out_east_lon_degree", "pointer"], ["out_north_lat_degree", "pointer"], ["out_area_name", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl38870_1203");
  f38866_1201 = /* @__PURE__ */ __name(function(...args38867) {
    const self38871_1204 = this;
    const G__38942_1205 = args38867.length;
    switch (G__38942_1205) {
      case 0:
        return impl38869_1202.call(self38871_1204);
        break;
      case 1:
        return impl38870_1203.call(self38871_1204, args38867[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args38867.length ?? ""}`);
    }
    ;
  }, "f38866_1201");
  return f38866_1201;
})();
var projContextErrnoString = /* @__PURE__ */ (() => {
  let f39023_1207 = null;
  const impl39026_1208 = /* @__PURE__ */ __name(async function() {
    return projContextErrnoString({});
  }, "impl39026_1208");
  const impl39027_1209 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_errno_string", { "rettype": "string", "argtypes": [["context", "pointer"], ["err", "int32"]] }, opts__210__auto__, "camel");
  }, "impl39027_1209");
  f39023_1207 = /* @__PURE__ */ __name(function(...args39024) {
    const self39028_1210 = this;
    const G__39099_1211 = args39024.length;
    switch (G__39099_1211) {
      case 0:
        return impl39026_1208.call(self39028_1210);
        break;
      case 1:
        return impl39027_1209.call(self39028_1210, args39024[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args39024.length ?? ""}`);
    }
    ;
  }, "f39023_1207");
  return f39023_1207;
})();
var projGetInsertStatements = /* @__PURE__ */ (() => {
  let f39180_1213 = null;
  const impl39183_1214 = /* @__PURE__ */ __name(async function() {
    return projGetInsertStatements({});
  }, "impl39183_1214");
  const impl39184_1215 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_insert_statements", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["session", "pointer"], ["object", "pointer"], ["authority", "string"], ["code", "string"], ["numeric_codes", "int32"], ["allowed_authorities", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "string-list" }, opts__210__auto__, "camel");
  }, "impl39184_1215");
  f39180_1213 = /* @__PURE__ */ __name(function(...args39181) {
    const self39185_1216 = this;
    const G__39256_1217 = args39181.length;
    switch (G__39256_1217) {
      case 0:
        return impl39183_1214.call(self39185_1216);
        break;
      case 1:
        return impl39184_1215.call(self39185_1216, args39181[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args39181.length ?? ""}`);
    }
    ;
  }, "f39180_1213");
  return f39180_1213;
})();
var projStringListDestroy = /* @__PURE__ */ (() => {
  let f39337_1219 = null;
  const impl39340_1220 = /* @__PURE__ */ __name(async function() {
    return projStringListDestroy({});
  }, "impl39340_1220");
  const impl39341_1221 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_string_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl39341_1221");
  f39337_1219 = /* @__PURE__ */ __name(function(...args39338) {
    const self39342_1222 = this;
    const G__39413_1223 = args39338.length;
    switch (G__39413_1223) {
      case 0:
        return impl39340_1220.call(self39342_1222);
        break;
      case 1:
        return impl39341_1221.call(self39342_1222, args39338[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args39338.length ?? ""}`);
    }
    ;
  }, "f39337_1219");
  return f39337_1219;
})();
var projTransArray = /* @__PURE__ */ (() => {
  let f39494_1225 = null;
  const impl39497_1226 = /* @__PURE__ */ __name(async function() {
    return projTransArray({});
  }, "impl39497_1226");
  const impl39498_1227 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_trans_array", { "rettype": "int32", "argtypes": [["p", "pointer"], ["direction", "int32"], ["n", "size-t"], ["coord", "pointer"]], "argsemantics": [["coord", "coord-array"], ["n", "coord-count"]] }, opts__210__auto__, "camel");
  }, "impl39498_1227");
  f39494_1225 = /* @__PURE__ */ __name(function(...args39495) {
    const self39499_1228 = this;
    const G__39570_1229 = args39495.length;
    switch (G__39570_1229) {
      case 0:
        return impl39497_1226.call(self39499_1228);
        break;
      case 1:
        return impl39498_1227.call(self39499_1228, args39495[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args39495.length ?? ""}`);
    }
    ;
  }, "f39494_1225");
  return f39494_1225;
})();
var projContextClone = /* @__PURE__ */ (() => {
  let f39651_1231 = null;
  const impl39654_1232 = /* @__PURE__ */ __name(async function() {
    return projContextClone({});
  }, "impl39654_1232");
  const impl39655_1233 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_clone", { "rettype": "pointer", "argtypes": [["ctx", "pointer"]], "proj-returns": "pj-context", "is-context-fn": false }, opts__210__auto__, "camel");
  }, "impl39655_1233");
  f39651_1231 = /* @__PURE__ */ __name(function(...args39652) {
    const self39656_1234 = this;
    const G__39727_1235 = args39652.length;
    switch (G__39727_1235) {
      case 0:
        return impl39654_1232.call(self39656_1234);
        break;
      case 1:
        return impl39655_1233.call(self39656_1234, args39652[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args39652.length ?? ""}`);
    }
    ;
  }, "f39651_1231");
  return f39651_1231;
})();
var projIsEquivalentToWithCtx = /* @__PURE__ */ (() => {
  let f39808_1237 = null;
  const impl39811_1238 = /* @__PURE__ */ __name(async function() {
    return projIsEquivalentToWithCtx({});
  }, "impl39811_1238");
  const impl39812_1239 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_is_equivalent_to_with_ctx", { "rettype": "int32", "argtypes": [["context", "pointer"], ["obj", "pointer"], ["other", "pointer"], ["criterion", "int32"]] }, opts__210__auto__, "camel");
  }, "impl39812_1239");
  f39808_1237 = /* @__PURE__ */ __name(function(...args39809) {
    const self39813_1240 = this;
    const G__39884_1241 = args39809.length;
    switch (G__39884_1241) {
      case 0:
        return impl39811_1238.call(self39813_1240);
        break;
      case 1:
        return impl39812_1239.call(self39813_1240, args39809[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args39809.length ?? ""}`);
    }
    ;
  }, "f39808_1237");
  return f39808_1237;
})();
var projOperationFactoryContextSetAllowUseIntermediateCrs = /* @__PURE__ */ (() => {
  let f39965_1243 = null;
  const impl39968_1244 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetAllowUseIntermediateCrs({});
  }, "impl39968_1244");
  const impl39969_1245 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_allow_use_intermediate_crs", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["use", "int32"]] }, opts__210__auto__, "camel");
  }, "impl39969_1245");
  f39965_1243 = /* @__PURE__ */ __name(function(...args39966) {
    const self39970_1246 = this;
    const G__40041_1247 = args39966.length;
    switch (G__40041_1247) {
      case 0:
        return impl39968_1244.call(self39970_1246);
        break;
      case 1:
        return impl39969_1245.call(self39970_1246, args39966[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args39966.length ?? ""}`);
    }
    ;
  }, "f39965_1243");
  return f39965_1243;
})();
var projCoordoperationGetParamIndex = /* @__PURE__ */ (() => {
  let f40122_1249 = null;
  const impl40125_1250 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationGetParamIndex({});
  }, "impl40125_1250");
  const impl40126_1251 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_param_index", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["name", "string"]] }, opts__210__auto__, "camel");
  }, "impl40126_1251");
  f40122_1249 = /* @__PURE__ */ __name(function(...args40123) {
    const self40127_1252 = this;
    const G__40198_1253 = args40123.length;
    switch (G__40198_1253) {
      case 0:
        return impl40125_1250.call(self40127_1252);
        break;
      case 1:
        return impl40126_1251.call(self40127_1252, args40123[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args40123.length ?? ""}`);
    }
    ;
  }, "f40122_1249");
  return f40122_1249;
})();
var projContextGetDatabaseStructure = /* @__PURE__ */ (() => {
  let f40279_1255 = null;
  const impl40282_1256 = /* @__PURE__ */ __name(async function() {
    return projContextGetDatabaseStructure({});
  }, "impl40282_1256");
  const impl40283_1257 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_get_database_structure", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "string-list" }, opts__210__auto__, "camel");
  }, "impl40283_1257");
  f40279_1255 = /* @__PURE__ */ __name(function(...args40280) {
    const self40284_1258 = this;
    const G__40355_1259 = args40280.length;
    switch (G__40355_1259) {
      case 0:
        return impl40282_1256.call(self40284_1258);
        break;
      case 1:
        return impl40283_1257.call(self40284_1258, args40280[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args40280.length ?? ""}`);
    }
    ;
  }, "f40279_1255");
  return f40279_1255;
})();
var projOperationFactoryContextDestroy = /* @__PURE__ */ (() => {
  let f40436_1261 = null;
  const impl40439_1262 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextDestroy({});
  }, "impl40439_1262");
  const impl40440_1263 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_destroy", { "rettype": "void", "argtypes": [["ctx", "pointer"]], "is-context-fn": false }, opts__210__auto__, "camel");
  }, "impl40440_1263");
  f40436_1261 = /* @__PURE__ */ __name(function(...args40437) {
    const self40441_1264 = this;
    const G__40512_1265 = args40437.length;
    switch (G__40512_1265) {
      case 0:
        return impl40439_1262.call(self40441_1264);
        break;
      case 1:
        return impl40440_1263.call(self40441_1264, args40437[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args40437.length ?? ""}`);
    }
    ;
  }, "f40436_1261");
  return f40436_1261;
})();
var projGetCelestialBodyListFromDatabase = /* @__PURE__ */ (() => {
  let f40593_1267 = null;
  const impl40596_1268 = /* @__PURE__ */ __name(async function() {
    return projGetCelestialBodyListFromDatabase({});
  }, "impl40596_1268");
  const impl40597_1269 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_celestial_body_list_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["out_result_count", "pointer"]], "proj-returns": "struct-list", "struct-def": "proj-celestial-body-info", "struct-fields": [["auth-name", "string", 0], ["name", "string", 4]], "struct-destroy-fn": "proj_celestial_body_list_destroy" }, opts__210__auto__, "camel");
  }, "impl40597_1269");
  f40593_1267 = /* @__PURE__ */ __name(function(...args40594) {
    const self40598_1270 = this;
    const G__40669_1271 = args40594.length;
    switch (G__40669_1271) {
      case 0:
        return impl40596_1268.call(self40598_1270);
        break;
      case 1:
        return impl40597_1269.call(self40598_1270, args40594[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args40594.length ?? ""}`);
    }
    ;
  }, "f40593_1267");
  return f40593_1267;
})();
var projCelestialBodyListDestroy = /* @__PURE__ */ (() => {
  let f40750_1273 = null;
  const impl40753_1274 = /* @__PURE__ */ __name(async function() {
    return projCelestialBodyListDestroy({});
  }, "impl40753_1274");
  const impl40754_1275 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_celestial_body_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl40754_1275");
  f40750_1273 = /* @__PURE__ */ __name(function(...args40751) {
    const self40755_1276 = this;
    const G__40826_1277 = args40751.length;
    switch (G__40826_1277) {
      case 0:
        return impl40753_1274.call(self40755_1276);
        break;
      case 1:
        return impl40754_1275.call(self40755_1276, args40751[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args40751.length ?? ""}`);
    }
    ;
  }, "f40750_1273");
  return f40750_1273;
})();
var projCreateCompoundCrs = /* @__PURE__ */ (() => {
  let f40907_1279 = null;
  const impl40910_1280 = /* @__PURE__ */ __name(async function() {
    return projCreateCompoundCrs({});
  }, "impl40910_1280");
  const impl40911_1281 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_compound_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["horiz_crs", "pointer"], ["vert_crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl40911_1281");
  f40907_1279 = /* @__PURE__ */ __name(function(...args40908) {
    const self40912_1282 = this;
    const G__40983_1283 = args40908.length;
    switch (G__40983_1283) {
      case 0:
        return impl40910_1280.call(self40912_1282);
        break;
      case 1:
        return impl40911_1281.call(self40912_1282, args40908[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args40908.length ?? ""}`);
    }
    ;
  }, "f40907_1279");
  return f40907_1279;
})();
var projCoordoperationGetTowgs84Values = /* @__PURE__ */ (() => {
  let f41064_1285 = null;
  const impl41067_1286 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationGetTowgs84Values({});
  }, "impl41067_1286");
  const impl41068_1287 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_towgs84_values", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["values", "double-array", "count-arg", "value_count"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["out_values", "pointer"], ["value_count", "int32"], ["emit_error_if_incompatible", "int32"]] }, opts__210__auto__, "camel");
  }, "impl41068_1287");
  f41064_1285 = /* @__PURE__ */ __name(function(...args41065) {
    const self41069_1288 = this;
    const G__41140_1289 = args41065.length;
    switch (G__41140_1289) {
      case 0:
        return impl41067_1286.call(self41069_1288);
        break;
      case 1:
        return impl41068_1287.call(self41069_1288, args41065[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args41065.length ?? ""}`);
    }
    ;
  }, "f41064_1285");
  return f41064_1285;
})();
var projGetRemarks = /* @__PURE__ */ (() => {
  let f41221_1291 = null;
  const impl41224_1292 = /* @__PURE__ */ __name(async function() {
    return projGetRemarks({});
  }, "impl41224_1292");
  const impl41225_1293 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_remarks", { "rettype": "string", "argtypes": [["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl41225_1293");
  f41221_1291 = /* @__PURE__ */ __name(function(...args41222) {
    const self41226_1294 = this;
    const G__41297_1295 = args41222.length;
    switch (G__41297_1295) {
      case 0:
        return impl41224_1292.call(self41226_1294);
        break;
      case 1:
        return impl41225_1293.call(self41226_1294, args41222[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args41222.length ?? ""}`);
    }
    ;
  }, "f41221_1291");
  return f41221_1291;
})();
var projGetGeoidModelsFromDatabase = /* @__PURE__ */ (() => {
  let f41378_1297 = null;
  const impl41381_1298 = /* @__PURE__ */ __name(async function() {
    return projGetGeoidModelsFromDatabase({});
  }, "impl41381_1298");
  const impl41382_1299 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_geoid_models_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["code", "string"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "string-list" }, opts__210__auto__, "camel");
  }, "impl41382_1299");
  f41378_1297 = /* @__PURE__ */ __name(function(...args41379) {
    const self41383_1300 = this;
    const G__41454_1301 = args41379.length;
    switch (G__41454_1301) {
      case 0:
        return impl41381_1298.call(self41383_1300);
        break;
      case 1:
        return impl41382_1299.call(self41383_1300, args41379[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args41379.length ?? ""}`);
    }
    ;
  }, "f41378_1297");
  return f41378_1297;
})();
var projCrsAlterCsLinearUnit = /* @__PURE__ */ (() => {
  let f41535_1303 = null;
  const impl41538_1304 = /* @__PURE__ */ __name(async function() {
    return projCrsAlterCsLinearUnit({});
  }, "impl41538_1304");
  const impl41539_1305 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_alter_cs_linear_unit", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["linear_units", "string"], ["linear_units_conv", "float64"], ["unit_auth_name", "string"], ["unit_code", "string"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl41539_1305");
  f41535_1303 = /* @__PURE__ */ __name(function(...args41536) {
    const self41540_1306 = this;
    const G__41611_1307 = args41536.length;
    switch (G__41611_1307) {
      case 0:
        return impl41538_1304.call(self41540_1306);
        break;
      case 1:
        return impl41539_1305.call(self41540_1306, args41536[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args41536.length ?? ""}`);
    }
    ;
  }, "f41535_1303");
  return f41535_1303;
})();
var projUomGetInfoFromDatabase = /* @__PURE__ */ (() => {
  let f41692_1309 = null;
  const impl41695_1310 = /* @__PURE__ */ __name(async function() {
    return projUomGetInfoFromDatabase({});
  }, "impl41695_1310");
  const impl41696_1311 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_uom_get_info_from_database", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["name", "string"], ["conv-factor", "double"], ["category", "string"]], "argtypes": [["context", "pointer"], ["auth_name", "string"], ["code", "string"], ["out_name", "pointer"], ["out_conv_factor", "pointer"], ["out_category", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl41696_1311");
  f41692_1309 = /* @__PURE__ */ __name(function(...args41693) {
    const self41697_1312 = this;
    const G__41768_1313 = args41693.length;
    switch (G__41768_1313) {
      case 0:
        return impl41695_1310.call(self41697_1312);
        break;
      case 1:
        return impl41696_1311.call(self41697_1312, args41693[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args41693.length ?? ""}`);
    }
    ;
  }, "f41692_1309");
  return f41692_1309;
})();
var projNormalizeForVisualization = /* @__PURE__ */ (() => {
  let f41849_1315 = null;
  const impl41852_1316 = /* @__PURE__ */ __name(async function() {
    return projNormalizeForVisualization({});
  }, "impl41852_1316");
  const impl41853_1317 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_normalize_for_visualization", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl41853_1317");
  f41849_1315 = /* @__PURE__ */ __name(function(...args41850) {
    const self41854_1318 = this;
    const G__41925_1319 = args41850.length;
    switch (G__41925_1319) {
      case 0:
        return impl41852_1316.call(self41854_1318);
        break;
      case 1:
        return impl41853_1317.call(self41854_1318, args41850[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args41850.length ?? ""}`);
    }
    ;
  }, "f41849_1315");
  return f41849_1315;
})();
var projCrsGetDatumEnsemble = /* @__PURE__ */ (() => {
  let f42006_1321 = null;
  const impl42009_1322 = /* @__PURE__ */ __name(async function() {
    return projCrsGetDatumEnsemble({});
  }, "impl42009_1322");
  const impl42010_1323 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_get_datum_ensemble", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl42010_1323");
  f42006_1321 = /* @__PURE__ */ __name(function(...args42007) {
    const self42011_1324 = this;
    const G__42082_1325 = args42007.length;
    switch (G__42082_1325) {
      case 0:
        return impl42009_1322.call(self42011_1324);
        break;
      case 1:
        return impl42010_1323.call(self42011_1324, args42007[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args42007.length ?? ""}`);
    }
    ;
  }, "f42006_1321");
  return f42006_1321;
})();
var projCreateCrsToCrs = /* @__PURE__ */ (() => {
  let f42163_1327 = null;
  const impl42166_1328 = /* @__PURE__ */ __name(async function() {
    return projCreateCrsToCrs({});
  }, "impl42166_1328");
  const impl42167_1329 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_crs_to_crs", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["source_crs", "string"], ["target_crs", "string"], ["area", "pointer?"]], "argsemantics": [["area", "pj-area", "default", 0]], "proj-returns": "pj", "isolate-context?": true }, opts__210__auto__, "camel");
  }, "impl42167_1329");
  f42163_1327 = /* @__PURE__ */ __name(function(...args42164) {
    const self42168_1330 = this;
    const G__42239_1331 = args42164.length;
    switch (G__42239_1331) {
      case 0:
        return impl42166_1328.call(self42168_1330);
        break;
      case 1:
        return impl42167_1329.call(self42168_1330, args42164[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args42164.length ?? ""}`);
    }
    ;
  }, "f42163_1327");
  return f42163_1327;
})();
var projAlterName = /* @__PURE__ */ (() => {
  let f42320_1333 = null;
  const impl42323_1334 = /* @__PURE__ */ __name(async function() {
    return projAlterName({});
  }, "impl42323_1334");
  const impl42324_1335 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_alter_name", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["name", "string"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl42324_1335");
  f42320_1333 = /* @__PURE__ */ __name(function(...args42321) {
    const self42325_1336 = this;
    const G__42396_1337 = args42321.length;
    switch (G__42396_1337) {
      case 0:
        return impl42323_1334.call(self42325_1336);
        break;
      case 1:
        return impl42324_1335.call(self42325_1336, args42321[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args42321.length ?? ""}`);
    }
    ;
  }, "f42320_1333");
  return f42320_1333;
})();
var projCoordinateMetadataGetEpoch = /* @__PURE__ */ (() => {
  let f42477_1339 = null;
  const impl42480_1340 = /* @__PURE__ */ __name(async function() {
    return projCoordinateMetadataGetEpoch({});
  }, "impl42480_1340");
  const impl42481_1341 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordinate_metadata_get_epoch", { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl42481_1341");
  f42477_1339 = /* @__PURE__ */ __name(function(...args42478) {
    const self42482_1342 = this;
    const G__42553_1343 = args42478.length;
    switch (G__42553_1343) {
      case 0:
        return impl42480_1340.call(self42482_1342);
        break;
      case 1:
        return impl42481_1341.call(self42482_1342, args42478[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args42478.length ?? ""}`);
    }
    ;
  }, "f42477_1339");
  return f42477_1339;
})();
var projContextErrno = /* @__PURE__ */ (() => {
  let f42634_1345 = null;
  const impl42637_1346 = /* @__PURE__ */ __name(async function() {
    return projContextErrno({});
  }, "impl42637_1346");
  const impl42638_1347 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_errno", { "rettype": "int32", "argtypes": [["context", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl42638_1347");
  f42634_1345 = /* @__PURE__ */ __name(function(...args42635) {
    const self42639_1348 = this;
    const G__42710_1349 = args42635.length;
    switch (G__42710_1349) {
      case 0:
        return impl42637_1346.call(self42639_1348);
        break;
      case 1:
        return impl42638_1347.call(self42639_1348, args42635[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args42635.length ?? ""}`);
    }
    ;
  }, "f42634_1345");
  return f42634_1345;
})();
var projContextSetSearchPaths = /* @__PURE__ */ (() => {
  let f42791_1351 = null;
  const impl42794_1352 = /* @__PURE__ */ __name(async function() {
    return projContextSetSearchPaths({});
  }, "impl42794_1352");
  const impl42795_1353 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_set_search_paths", { "rettype": "void", "argtypes": [["context", "pointer"], ["count_paths", "int32"], ["paths", "pointer?"]], "argsemantics": [["paths", "string-array?", "default", null]] }, opts__210__auto__, "camel");
  }, "impl42795_1353");
  f42791_1351 = /* @__PURE__ */ __name(function(...args42792) {
    const self42796_1354 = this;
    const G__42867_1355 = args42792.length;
    switch (G__42867_1355) {
      case 0:
        return impl42794_1352.call(self42796_1354);
        break;
      case 1:
        return impl42795_1353.call(self42796_1354, args42792[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args42792.length ?? ""}`);
    }
    ;
  }, "f42791_1351");
  return f42791_1351;
})();
var projTransGeneric = /* @__PURE__ */ (() => {
  let f42948_1357 = null;
  const impl42951_1358 = /* @__PURE__ */ __name(async function() {
    return projTransGeneric({});
  }, "impl42951_1358");
  const impl42952_1359 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_trans_generic", { "rettype": "size-t", "argtypes": [["p", "pointer"], ["direction", "int32"], ["x", "pointer"], ["sx", "size-t"], ["nx", "size-t"], ["y", "pointer"], ["sy", "size-t"], ["ny", "size-t"], ["z", "pointer?"], ["sz", "size-t"], ["nz", "size-t"], ["t", "pointer?"], ["st", "size-t"], ["nt", "size-t"]] }, opts__210__auto__, "camel");
  }, "impl42952_1359");
  f42948_1357 = /* @__PURE__ */ __name(function(...args42949) {
    const self42953_1360 = this;
    const G__43024_1361 = args42949.length;
    switch (G__43024_1361) {
      case 0:
        return impl42951_1358.call(self42953_1360);
        break;
      case 1:
        return impl42952_1359.call(self42953_1360, args42949[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args42949.length ?? ""}`);
    }
    ;
  }, "f42948_1357");
  return f42948_1357;
})();
var projClone = /* @__PURE__ */ (() => {
  let f43105_1363 = null;
  const impl43108_1364 = /* @__PURE__ */ __name(async function() {
    return projClone({});
  }, "impl43108_1364");
  const impl43109_1365 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_clone", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["p", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl43109_1365");
  f43105_1363 = /* @__PURE__ */ __name(function(...args43106) {
    const self43110_1366 = this;
    const G__43181_1367 = args43106.length;
    switch (G__43181_1367) {
      case 0:
        return impl43108_1364.call(self43110_1366);
        break;
      case 1:
        return impl43109_1365.call(self43110_1366, args43106[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args43106.length ?? ""}`);
    }
    ;
  }, "f43105_1363");
  return f43105_1363;
})();
var projCoordoperationCreateInverse = /* @__PURE__ */ (() => {
  let f43262_1369 = null;
  const impl43265_1370 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationCreateInverse({});
  }, "impl43265_1370");
  const impl43266_1371 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_create_inverse", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl43266_1371");
  f43262_1369 = /* @__PURE__ */ __name(function(...args43263) {
    const self43267_1372 = this;
    const G__43338_1373 = args43263.length;
    switch (G__43338_1373) {
      case 0:
        return impl43265_1370.call(self43267_1372);
        break;
      case 1:
        return impl43266_1371.call(self43267_1372, args43263[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args43263.length ?? ""}`);
    }
    ;
  }, "f43262_1369");
  return f43262_1369;
})();
var projCrsDemoteTo2D = /* @__PURE__ */ (() => {
  let f43419_1375 = null;
  const impl43422_1376 = /* @__PURE__ */ __name(async function() {
    return projCrsDemoteTo2D({});
  }, "impl43422_1376");
  const impl43423_1377 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_demote_to_2D", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_2D_name", "string"], ["crs_3D", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl43423_1377");
  f43419_1375 = /* @__PURE__ */ __name(function(...args43420) {
    const self43424_1378 = this;
    const G__43495_1379 = args43420.length;
    switch (G__43495_1379) {
      case 0:
        return impl43422_1376.call(self43424_1378);
        break;
      case 1:
        return impl43423_1377.call(self43424_1378, args43420[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args43420.length ?? ""}`);
    }
    ;
  }, "f43419_1375");
  return f43419_1375;
})();
var projCreateCartesian2DCs = /* @__PURE__ */ (() => {
  let f43576_1381 = null;
  const impl43579_1382 = /* @__PURE__ */ __name(async function() {
    return projCreateCartesian2DCs({});
  }, "impl43579_1382");
  const impl43580_1383 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_cartesian_2D_cs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["unit_name", "string"], ["unit_conv_factor", "float64"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl43580_1383");
  f43576_1381 = /* @__PURE__ */ __name(function(...args43577) {
    const self43581_1384 = this;
    const G__43652_1385 = args43577.length;
    switch (G__43652_1385) {
      case 0:
        return impl43579_1382.call(self43581_1384);
        break;
      case 1:
        return impl43580_1383.call(self43581_1384, args43577[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args43577.length ?? ""}`);
    }
    ;
  }, "f43576_1381");
  return f43576_1381;
})();
var projContextIsNetworkEnabled = /* @__PURE__ */ (() => {
  let f43733_1387 = null;
  const impl43736_1388 = /* @__PURE__ */ __name(async function() {
    return projContextIsNetworkEnabled({});
  }, "impl43736_1388");
  const impl43737_1389 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_is_network_enabled", { "rettype": "int32", "argtypes": [["context", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl43737_1389");
  f43733_1387 = /* @__PURE__ */ __name(function(...args43734) {
    const self43738_1390 = this;
    const G__43809_1391 = args43734.length;
    switch (G__43809_1391) {
      case 0:
        return impl43736_1388.call(self43738_1390);
        break;
      case 1:
        return impl43737_1389.call(self43738_1390, args43734[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args43734.length ?? ""}`);
    }
    ;
  }, "f43733_1387");
  return f43733_1387;
})();
var projGetScope = /* @__PURE__ */ (() => {
  let f43890_1393 = null;
  const impl43893_1394 = /* @__PURE__ */ __name(async function() {
    return projGetScope({});
  }, "impl43893_1394");
  const impl43894_1395 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_scope", { "rettype": "string", "argtypes": [["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl43894_1395");
  f43890_1393 = /* @__PURE__ */ __name(function(...args43891) {
    const self43895_1396 = this;
    const G__43966_1397 = args43891.length;
    switch (G__43966_1397) {
      case 0:
        return impl43893_1394.call(self43895_1396);
        break;
      case 1:
        return impl43894_1395.call(self43895_1396, args43891[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args43891.length ?? ""}`);
    }
    ;
  }, "f43890_1393");
  return f43890_1393;
})();
var projDestroy = /* @__PURE__ */ (() => {
  let f44047_1399 = null;
  const impl44050_1400 = /* @__PURE__ */ __name(async function() {
    return projDestroy({});
  }, "impl44050_1400");
  const impl44051_1401 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_destroy", { "rettype": "pointer", "argtypes": [["pj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl44051_1401");
  f44047_1399 = /* @__PURE__ */ __name(function(...args44048) {
    const self44052_1402 = this;
    const G__44123_1403 = args44048.length;
    switch (G__44123_1403) {
      case 0:
        return impl44050_1400.call(self44052_1402);
        break;
      case 1:
        return impl44051_1401.call(self44052_1402, args44048[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args44048.length ?? ""}`);
    }
    ;
  }, "f44047_1399");
  return f44047_1399;
})();
var projOperationFactoryContextSetAllowBallparkTransformations = /* @__PURE__ */ (() => {
  let f44204_1405 = null;
  const impl44207_1406 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetAllowBallparkTransformations({});
  }, "impl44207_1406");
  const impl44208_1407 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_allow_ballpark_transformations", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["allow", "int32"]] }, opts__210__auto__, "camel");
  }, "impl44208_1407");
  f44204_1405 = /* @__PURE__ */ __name(function(...args44205) {
    const self44209_1408 = this;
    const G__44280_1409 = args44205.length;
    switch (G__44280_1409) {
      case 0:
        return impl44207_1406.call(self44209_1408);
        break;
      case 1:
        return impl44208_1407.call(self44209_1408, args44205[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args44205.length ?? ""}`);
    }
    ;
  }, "f44204_1405");
  return f44204_1405;
})();
var projCrsGetDatum = /* @__PURE__ */ (() => {
  let f44361_1411 = null;
  const impl44364_1412 = /* @__PURE__ */ __name(async function() {
    return projCrsGetDatum({});
  }, "impl44364_1412");
  const impl44365_1413 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_get_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl44365_1413");
  f44361_1411 = /* @__PURE__ */ __name(function(...args44362) {
    const self44366_1414 = this;
    const G__44437_1415 = args44362.length;
    switch (G__44437_1415) {
      case 0:
        return impl44364_1412.call(self44366_1414);
        break;
      case 1:
        return impl44365_1413.call(self44366_1414, args44362[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args44362.length ?? ""}`);
    }
    ;
  }, "f44361_1411");
  return f44361_1411;
})();
var projOperationFactoryContextSetAreaOfInterest = /* @__PURE__ */ (() => {
  let f44518_1417 = null;
  const impl44521_1418 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetAreaOfInterest({});
  }, "impl44521_1418");
  const impl44522_1419 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_area_of_interest", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["west_lon_degree", "float64"], ["south_lat_degree", "float64"], ["east_lon_degree", "float64"], ["north_lat_degree", "float64"]] }, opts__210__auto__, "camel");
  }, "impl44522_1419");
  f44518_1417 = /* @__PURE__ */ __name(function(...args44519) {
    const self44523_1420 = this;
    const G__44594_1421 = args44519.length;
    switch (G__44594_1421) {
      case 0:
        return impl44521_1418.call(self44523_1420);
        break;
      case 1:
        return impl44522_1419.call(self44523_1420, args44519[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args44519.length ?? ""}`);
    }
    ;
  }, "f44518_1417");
  return f44518_1417;
})();
var projCreateCs = /* @__PURE__ */ (() => {
  let f44675_1423 = null;
  const impl44678_1424 = /* @__PURE__ */ __name(async function() {
    return projCreateCs({});
  }, "impl44678_1424");
  const impl44679_1425 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_cs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["axis_count", "int32"], ["axis", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl44679_1425");
  f44675_1423 = /* @__PURE__ */ __name(function(...args44676) {
    const self44680_1426 = this;
    const G__44751_1427 = args44676.length;
    switch (G__44751_1427) {
      case 0:
        return impl44678_1424.call(self44680_1426);
        break;
      case 1:
        return impl44679_1425.call(self44680_1426, args44676[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args44676.length ?? ""}`);
    }
    ;
  }, "f44675_1423");
  return f44675_1423;
})();
var projCreateProjectedCrs = /* @__PURE__ */ (() => {
  let f44832_1429 = null;
  const impl44835_1430 = /* @__PURE__ */ __name(async function() {
    return projCreateProjectedCrs({});
  }, "impl44835_1430");
  const impl44836_1431 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_projected_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["geodetic_crs", "pointer"], ["conversion", "pointer"], ["coordinate_system", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl44836_1431");
  f44832_1429 = /* @__PURE__ */ __name(function(...args44833) {
    const self44837_1432 = this;
    const G__44908_1433 = args44833.length;
    switch (G__44908_1433) {
      case 0:
        return impl44835_1430.call(self44837_1432);
        break;
      case 1:
        return impl44836_1431.call(self44837_1432, args44833[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args44833.length ?? ""}`);
    }
    ;
  }, "f44832_1429");
  return f44832_1429;
})();
var projAsProjString = /* @__PURE__ */ (() => {
  let f44989_1435 = null;
  const impl44992_1436 = /* @__PURE__ */ __name(async function() {
    return projAsProjString({});
  }, "impl44992_1436");
  const impl44993_1437 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_as_proj_string", { "rettype": "string", "argtypes": [["context", "pointer"], ["pj", "pointer"], ["type", "int32"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]] }, opts__210__auto__, "camel");
  }, "impl44993_1437");
  f44989_1435 = /* @__PURE__ */ __name(function(...args44990) {
    const self44994_1438 = this;
    const G__45065_1439 = args44990.length;
    switch (G__45065_1439) {
      case 0:
        return impl44992_1436.call(self44994_1438);
        break;
      case 1:
        return impl44993_1437.call(self44994_1438, args44990[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args44990.length ?? ""}`);
    }
    ;
  }, "f44989_1435");
  return f44989_1435;
})();
var projOperationFactoryContextSetGridAvailabilityUse = /* @__PURE__ */ (() => {
  let f45146_1441 = null;
  const impl45149_1442 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetGridAvailabilityUse({});
  }, "impl45149_1442");
  const impl45150_1443 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_grid_availability_use", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["use", "int32"]] }, opts__210__auto__, "camel");
  }, "impl45150_1443");
  f45146_1441 = /* @__PURE__ */ __name(function(...args45147) {
    const self45151_1444 = this;
    const G__45222_1445 = args45147.length;
    switch (G__45222_1445) {
      case 0:
        return impl45149_1442.call(self45151_1444);
        break;
      case 1:
        return impl45150_1443.call(self45151_1444, args45147[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args45147.length ?? ""}`);
    }
    ;
  }, "f45146_1441");
  return f45146_1441;
})();
var projCreateDerivedGeographicCrs = /* @__PURE__ */ (() => {
  let f45303_1447 = null;
  const impl45306_1448 = /* @__PURE__ */ __name(async function() {
    return projCreateDerivedGeographicCrs({});
  }, "impl45306_1448");
  const impl45307_1449 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_derived_geographic_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["base_geographic_crs", "pointer"], ["conversion", "pointer"], ["ellipsoidal_cs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl45307_1449");
  f45303_1447 = /* @__PURE__ */ __name(function(...args45304) {
    const self45308_1450 = this;
    const G__45379_1451 = args45304.length;
    switch (G__45379_1451) {
      case 0:
        return impl45306_1448.call(self45308_1450);
        break;
      case 1:
        return impl45307_1449.call(self45308_1450, args45304[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args45304.length ?? ""}`);
    }
    ;
  }, "f45303_1447");
  return f45303_1447;
})();
var projCreateCrsToCrsFromPj = /* @__PURE__ */ (() => {
  let f45460_1453 = null;
  const impl45463_1454 = /* @__PURE__ */ __name(async function() {
    return projCreateCrsToCrsFromPj({});
  }, "impl45463_1454");
  const impl45464_1455 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_crs_to_crs_from_pj", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["source_crs", "pointer"], ["target_crs", "pointer"], ["area", "pointer?"], ["options", "pointer?"]], "argsemantics": [["area", "pj-area", "default", 0], ["options", "string-array?", "default", null]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl45464_1455");
  f45460_1453 = /* @__PURE__ */ __name(function(...args45461) {
    const self45465_1456 = this;
    const G__45536_1457 = args45461.length;
    switch (G__45536_1457) {
      case 0:
        return impl45463_1454.call(self45465_1456);
        break;
      case 1:
        return impl45464_1455.call(self45465_1456, args45461[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args45461.length ?? ""}`);
    }
    ;
  }, "f45460_1453");
  return f45460_1453;
})();
var projCoordoperationGetMethodInfo = /* @__PURE__ */ (() => {
  let f45617_1459 = null;
  const impl45620_1460 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationGetMethodInfo({});
  }, "impl45620_1460");
  const impl45621_1461 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_method_info", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["method-name", "string"], ["method-auth-name", "string"], ["method-code", "string"]], "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"], ["out_method_name", "pointer"], ["out_method_auth_name", "pointer"], ["out_method_code", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl45621_1461");
  f45617_1459 = /* @__PURE__ */ __name(function(...args45618) {
    const self45622_1462 = this;
    const G__45693_1463 = args45618.length;
    switch (G__45693_1463) {
      case 0:
        return impl45620_1460.call(self45622_1462);
        break;
      case 1:
        return impl45621_1461.call(self45622_1462, args45618[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args45618.length ?? ""}`);
    }
    ;
  }, "f45617_1459");
  return f45617_1459;
})();
var projGetSourceCrs = /* @__PURE__ */ (() => {
  let f45774_1465 = null;
  const impl45777_1466 = /* @__PURE__ */ __name(async function() {
    return projGetSourceCrs({});
  }, "impl45777_1466");
  const impl45778_1467 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_source_crs", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["pj", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl45778_1467");
  f45774_1465 = /* @__PURE__ */ __name(function(...args45775) {
    const self45779_1468 = this;
    const G__45850_1469 = args45775.length;
    switch (G__45850_1469) {
      case 0:
        return impl45777_1466.call(self45779_1468);
        break;
      case 1:
        return impl45778_1467.call(self45779_1468, args45775[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args45775.length ?? ""}`);
    }
    ;
  }, "f45774_1465");
  return f45774_1465;
})();
var projEllipsoidGetParameters = /* @__PURE__ */ (() => {
  let f45931_1471 = null;
  const impl45934_1472 = /* @__PURE__ */ __name(async function() {
    return projEllipsoidGetParameters({});
  }, "impl45934_1472");
  const impl45935_1473 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_ellipsoid_get_parameters", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["semi-major-metre", "double"], ["semi-minor-metre", "double"], ["is-semi-minor-computed", "int"], ["inv-flattening", "double"]], "argtypes": [["ctx", "pointer"], ["ellipsoid", "pointer"], ["out_semi_major_metre", "pointer"], ["out_semi_minor_metre", "pointer"], ["out_is_semi_minor_computed", "pointer"], ["out_inv_flattening", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl45935_1473");
  f45931_1471 = /* @__PURE__ */ __name(function(...args45932) {
    const self45936_1474 = this;
    const G__46007_1475 = args45932.length;
    switch (G__46007_1475) {
      case 0:
        return impl45934_1472.call(self45936_1474);
        break;
      case 1:
        return impl45935_1473.call(self45936_1474, args45932[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args45932.length ?? ""}`);
    }
    ;
  }, "f45931_1471");
  return f45931_1471;
})();
var projContextDestroy = /* @__PURE__ */ (() => {
  let f46088_1477 = null;
  const impl46091_1478 = /* @__PURE__ */ __name(async function() {
    return projContextDestroy({});
  }, "impl46091_1478");
  const impl46092_1479 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_destroy", { "rettype": "void", "argtypes": [["context", "pointer"]], "is-context-fn": false }, opts__210__auto__, "camel");
  }, "impl46092_1479");
  f46088_1477 = /* @__PURE__ */ __name(function(...args46089) {
    const self46093_1480 = this;
    const G__46164_1481 = args46089.length;
    switch (G__46164_1481) {
      case 0:
        return impl46091_1478.call(self46093_1480);
        break;
      case 1:
        return impl46092_1479.call(self46093_1480, args46089[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args46089.length ?? ""}`);
    }
    ;
  }, "f46088_1477");
  return f46088_1477;
})();
var projCsGetAxisInfo = /* @__PURE__ */ (() => {
  let f46245_1483 = null;
  const impl46248_1484 = /* @__PURE__ */ __name(async function() {
    return projCsGetAxisInfo({});
  }, "impl46248_1484");
  const impl46249_1485 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_cs_get_axis_info", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["name", "string"], ["abbreviation", "string"], ["direction", "string"], ["unit-conv-factor", "double"], ["unit-name", "string"], ["unit-auth-name", "string"], ["unit-code", "string"]], "argtypes": [["ctx", "pointer"], ["cs", "pointer"], ["index", "int32"], ["out_name", "pointer"], ["out_abbrev", "pointer"], ["out_direction", "pointer"], ["out_unit_conv_factor", "pointer"], ["out_unit_name", "pointer"], ["out_unit_auth_name", "pointer"], ["out_unit_code", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl46249_1485");
  f46245_1483 = /* @__PURE__ */ __name(function(...args46246) {
    const self46250_1486 = this;
    const G__46321_1487 = args46246.length;
    switch (G__46321_1487) {
      case 0:
        return impl46248_1484.call(self46250_1486);
        break;
      case 1:
        return impl46249_1485.call(self46250_1486, args46246[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args46246.length ?? ""}`);
    }
    ;
  }, "f46245_1483");
  return f46245_1483;
})();
var projQueryGeodeticCrsFromDatum = /* @__PURE__ */ (() => {
  let f46402_1489 = null;
  const impl46405_1490 = /* @__PURE__ */ __name(async function() {
    return projQueryGeodeticCrsFromDatum({});
  }, "impl46405_1490");
  const impl46406_1491 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_query_geodetic_crs_from_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_auth_name", "string"], ["datum_auth_name", "string"], ["datum_code", "string"], ["crs_type", "string"]], "proj-returns": "pj-list" }, opts__210__auto__, "camel");
  }, "impl46406_1491");
  f46402_1489 = /* @__PURE__ */ __name(function(...args46403) {
    const self46407_1492 = this;
    const G__46478_1493 = args46403.length;
    switch (G__46478_1493) {
      case 0:
        return impl46405_1490.call(self46407_1492);
        break;
      case 1:
        return impl46406_1491.call(self46407_1492, args46403[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args46403.length ?? ""}`);
    }
    ;
  }, "f46402_1489");
  return f46402_1489;
})();
var projCoordoperationRequiresPerCoordinateInputTime = /* @__PURE__ */ (() => {
  let f46559_1495 = null;
  const impl46562_1496 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationRequiresPerCoordinateInputTime({});
  }, "impl46562_1496");
  const impl46563_1497 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_requires_per_coordinate_input_time", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl46563_1497");
  f46559_1495 = /* @__PURE__ */ __name(function(...args46560) {
    const self46564_1498 = this;
    const G__46635_1499 = args46560.length;
    switch (G__46635_1499) {
      case 0:
        return impl46562_1496.call(self46564_1498);
        break;
      case 1:
        return impl46563_1497.call(self46564_1498, args46560[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args46560.length ?? ""}`);
    }
    ;
  }, "f46559_1495");
  return f46559_1495;
})();
var projCreateEllipsoidal2DCs = /* @__PURE__ */ (() => {
  let f46716_1501 = null;
  const impl46719_1502 = /* @__PURE__ */ __name(async function() {
    return projCreateEllipsoidal2DCs({});
  }, "impl46719_1502");
  const impl46720_1503 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_ellipsoidal_2D_cs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["unit_name", "string"], ["unit_conv_factor", "float64"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl46720_1503");
  f46716_1501 = /* @__PURE__ */ __name(function(...args46717) {
    const self46721_1504 = this;
    const G__46792_1505 = args46717.length;
    switch (G__46792_1505) {
      case 0:
        return impl46719_1502.call(self46721_1504);
        break;
      case 1:
        return impl46720_1503.call(self46721_1504, args46717[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args46717.length ?? ""}`);
    }
    ;
  }, "f46716_1501");
  return f46716_1501;
})();
var projCreateFromDatabase = /* @__PURE__ */ (() => {
  let f46873_1507 = null;
  const impl46876_1508 = /* @__PURE__ */ __name(async function() {
    return projCreateFromDatabase({});
  }, "impl46876_1508");
  const impl46877_1509 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["code", "string"], ["category", "int32"], ["use-proj-alternative-grid-names", "int32"], ["options", "pointer?"]], "argsemantics": [["category", "int32", "default", 3], ["use-proj-alternative-grid-names", "boolean", "default", false], ["options", "string-array?", "default", null]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl46877_1509");
  f46873_1507 = /* @__PURE__ */ __name(function(...args46874) {
    const self46878_1510 = this;
    const G__46949_1511 = args46874.length;
    switch (G__46949_1511) {
      case 0:
        return impl46876_1508.call(self46878_1510);
        break;
      case 1:
        return impl46877_1509.call(self46878_1510, args46874[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args46874.length ?? ""}`);
    }
    ;
  }, "f46873_1507");
  return f46873_1507;
})();
var projAlterId = /* @__PURE__ */ (() => {
  let f47030_1513 = null;
  const impl47033_1514 = /* @__PURE__ */ __name(async function() {
    return projAlterId({});
  }, "impl47033_1514");
  const impl47034_1515 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_alter_id", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["auth_name", "string"], ["code", "string"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl47034_1515");
  f47030_1513 = /* @__PURE__ */ __name(function(...args47031) {
    const self47035_1516 = this;
    const G__47106_1517 = args47031.length;
    switch (G__47106_1517) {
      case 0:
        return impl47033_1514.call(self47035_1516);
        break;
      case 1:
        return impl47034_1515.call(self47035_1516, args47031[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args47031.length ?? ""}`);
    }
    ;
  }, "f47030_1513");
  return f47030_1513;
})();
var projCrsHasPointMotionOperation = /* @__PURE__ */ (() => {
  let f47187_1519 = null;
  const impl47190_1520 = /* @__PURE__ */ __name(async function() {
    return projCrsHasPointMotionOperation({});
  }, "impl47190_1520");
  const impl47191_1521 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_has_point_motion_operation", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl47191_1521");
  f47187_1519 = /* @__PURE__ */ __name(function(...args47188) {
    const self47192_1522 = this;
    const G__47263_1523 = args47188.length;
    switch (G__47263_1523) {
      case 0:
        return impl47190_1520.call(self47192_1522);
        break;
      case 1:
        return impl47191_1521.call(self47192_1522, args47188[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args47188.length ?? ""}`);
    }
    ;
  }, "f47187_1519");
  return f47187_1519;
})();
var projOperationFactoryContextSetAllowedIntermediateCrs = /* @__PURE__ */ (() => {
  let f47344_1525 = null;
  const impl47347_1526 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetAllowedIntermediateCrs({});
  }, "impl47347_1526");
  const impl47348_1527 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_allowed_intermediate_crs", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["list_of_auth_name_codes", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl47348_1527");
  f47344_1525 = /* @__PURE__ */ __name(function(...args47345) {
    const self47349_1528 = this;
    const G__47420_1529 = args47345.length;
    switch (G__47420_1529) {
      case 0:
        return impl47347_1526.call(self47349_1528);
        break;
      case 1:
        return impl47348_1527.call(self47349_1528, args47345[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args47345.length ?? ""}`);
    }
    ;
  }, "f47344_1525");
  return f47344_1525;
})();
var projCrsPromoteTo3D = /* @__PURE__ */ (() => {
  let f47501_1531 = null;
  const impl47504_1532 = /* @__PURE__ */ __name(async function() {
    return projCrsPromoteTo3D({});
  }, "impl47504_1532");
  const impl47505_1533 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_promote_to_3D", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_3D_name", "string"], ["crs_2D", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl47505_1533");
  f47501_1531 = /* @__PURE__ */ __name(function(...args47502) {
    const self47506_1534 = this;
    const G__47577_1535 = args47502.length;
    switch (G__47577_1535) {
      case 0:
        return impl47504_1532.call(self47506_1534);
        break;
      case 1:
        return impl47505_1533.call(self47506_1534, args47502[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args47502.length ?? ""}`);
    }
    ;
  }, "f47501_1531");
  return f47501_1531;
})();
var projGetPrimeMeridian = /* @__PURE__ */ (() => {
  let f47658_1537 = null;
  const impl47661_1538 = /* @__PURE__ */ __name(async function() {
    return projGetPrimeMeridian({});
  }, "impl47661_1538");
  const impl47662_1539 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_prime_meridian", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl47662_1539");
  f47658_1537 = /* @__PURE__ */ __name(function(...args47659) {
    const self47663_1540 = this;
    const G__47734_1541 = args47659.length;
    switch (G__47734_1541) {
      case 0:
        return impl47661_1538.call(self47663_1540);
        break;
      case 1:
        return impl47662_1539.call(self47663_1540, args47659[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args47659.length ?? ""}`);
    }
    ;
  }, "f47658_1537");
  return f47658_1537;
})();
var projDatumEnsembleGetAccuracy = /* @__PURE__ */ (() => {
  let f47815_1543 = null;
  const impl47818_1544 = /* @__PURE__ */ __name(async function() {
    return projDatumEnsembleGetAccuracy({});
  }, "impl47818_1544");
  const impl47819_1545 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_datum_ensemble_get_accuracy", { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["datum_ensemble", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl47819_1545");
  f47815_1543 = /* @__PURE__ */ __name(function(...args47816) {
    const self47820_1546 = this;
    const G__47891_1547 = args47816.length;
    switch (G__47891_1547) {
      case 0:
        return impl47818_1544.call(self47820_1546);
        break;
      case 1:
        return impl47819_1545.call(self47820_1546, args47816[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args47816.length ?? ""}`);
    }
    ;
  }, "f47815_1543");
  return f47815_1543;
})();
var projGetAuthoritiesFromDatabase = /* @__PURE__ */ (() => {
  let f47972_1549 = null;
  const impl47975_1550 = /* @__PURE__ */ __name(async function() {
    return projGetAuthoritiesFromDatabase({});
  }, "impl47975_1550");
  const impl47976_1551 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_authorities_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"]], "proj-returns": "string-list" }, opts__210__auto__, "camel");
  }, "impl47976_1551");
  f47972_1549 = /* @__PURE__ */ __name(function(...args47973) {
    const self47977_1552 = this;
    const G__48048_1553 = args47973.length;
    switch (G__48048_1553) {
      case 0:
        return impl47975_1550.call(self47977_1552);
        break;
      case 1:
        return impl47976_1551.call(self47977_1552, args47973[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args47973.length ?? ""}`);
    }
    ;
  }, "f47972_1549");
  return f47972_1549;
})();
var projGetScopeEx = /* @__PURE__ */ (() => {
  let f48129_1555 = null;
  const impl48132_1556 = /* @__PURE__ */ __name(async function() {
    return projGetScopeEx({});
  }, "impl48132_1556");
  const impl48133_1557 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_scope_ex", { "rettype": "string", "argtypes": [["obj", "pointer"], ["domainIdx", "int32"]] }, opts__210__auto__, "camel");
  }, "impl48133_1557");
  f48129_1555 = /* @__PURE__ */ __name(function(...args48130) {
    const self48134_1558 = this;
    const G__48205_1559 = args48130.length;
    switch (G__48205_1559) {
      case 0:
        return impl48132_1556.call(self48134_1558);
        break;
      case 1:
        return impl48133_1557.call(self48134_1558, args48130[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args48130.length ?? ""}`);
    }
    ;
  }, "f48129_1555");
  return f48129_1555;
})();
var projGetTargetCrs = /* @__PURE__ */ (() => {
  let f48286_1561 = null;
  const impl48289_1562 = /* @__PURE__ */ __name(async function() {
    return projGetTargetCrs({});
  }, "impl48289_1562");
  const impl48290_1563 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_target_crs", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["pj", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl48290_1563");
  f48286_1561 = /* @__PURE__ */ __name(function(...args48287) {
    const self48291_1564 = this;
    const G__48362_1565 = args48287.length;
    switch (G__48362_1565) {
      case 0:
        return impl48289_1562.call(self48291_1564);
        break;
      case 1:
        return impl48290_1563.call(self48291_1564, args48287[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args48287.length ?? ""}`);
    }
    ;
  }, "f48286_1561");
  return f48286_1561;
})();
var projGetAreaOfUseEx = /* @__PURE__ */ (() => {
  let f48443_1567 = null;
  const impl48446_1568 = /* @__PURE__ */ __name(async function() {
    return projGetAreaOfUseEx({});
  }, "impl48446_1568");
  const impl48447_1569 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_area_of_use_ex", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["west-lon-degree", "double"], ["south-lat-degree", "double"], ["east-lon-degree", "double"], ["north-lat-degree", "double"], ["area-name", "string"]], "argtypes": [["context", "pointer"], ["obj", "pointer"], ["domainIdx", "int32"], ["out_west_lon_degree", "pointer"], ["out_south_lat_degree", "pointer"], ["out_east_lon_degree", "pointer"], ["out_north_lat_degree", "pointer"], ["out_area_name", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl48447_1569");
  f48443_1567 = /* @__PURE__ */ __name(function(...args48444) {
    const self48448_1570 = this;
    const G__48519_1571 = args48444.length;
    switch (G__48519_1571) {
      case 0:
        return impl48446_1568.call(self48448_1570);
        break;
      case 1:
        return impl48447_1569.call(self48448_1570, args48444[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args48444.length ?? ""}`);
    }
    ;
  }, "f48443_1567");
  return f48443_1567;
})();
var projGetIdAuthName = /* @__PURE__ */ (() => {
  let f48600_1573 = null;
  const impl48603_1574 = /* @__PURE__ */ __name(async function() {
    return projGetIdAuthName({});
  }, "impl48603_1574");
  const impl48604_1575 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_id_auth_name", { "rettype": "string", "argtypes": [["obj", "pointer"], ["index", "int32"]] }, opts__210__auto__, "camel");
  }, "impl48604_1575");
  f48600_1573 = /* @__PURE__ */ __name(function(...args48601) {
    const self48605_1576 = this;
    const G__48676_1577 = args48601.length;
    switch (G__48676_1577) {
      case 0:
        return impl48603_1574.call(self48605_1576);
        break;
      case 1:
        return impl48604_1575.call(self48605_1576, args48601[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args48601.length ?? ""}`);
    }
    ;
  }, "f48600_1573");
  return f48600_1573;
})();
var projCoordinateMetadataCreate = /* @__PURE__ */ (() => {
  let f48757_1579 = null;
  const impl48760_1580 = /* @__PURE__ */ __name(async function() {
    return projCoordinateMetadataCreate({});
  }, "impl48760_1580");
  const impl48761_1581 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordinate_metadata_create", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"], ["epoch", "float64"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl48761_1581");
  f48757_1579 = /* @__PURE__ */ __name(function(...args48758) {
    const self48762_1582 = this;
    const G__48833_1583 = args48758.length;
    switch (G__48833_1583) {
      case 0:
        return impl48760_1580.call(self48762_1582);
        break;
      case 1:
        return impl48761_1581.call(self48762_1582, args48758[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args48758.length ?? ""}`);
    }
    ;
  }, "f48757_1579");
  return f48757_1579;
})();
var projCreateGeocentricCrsFromDatum = /* @__PURE__ */ (() => {
  let f48914_1585 = null;
  const impl48917_1586 = /* @__PURE__ */ __name(async function() {
    return projCreateGeocentricCrsFromDatum({});
  }, "impl48917_1586");
  const impl48918_1587 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_geocentric_crs_from_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_or_datum_ensemble", "pointer"], ["linear_units", "string"], ["linear_units_conv", "float64"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl48918_1587");
  f48914_1585 = /* @__PURE__ */ __name(function(...args48915) {
    const self48919_1588 = this;
    const G__48990_1589 = args48915.length;
    switch (G__48990_1589) {
      case 0:
        return impl48917_1586.call(self48919_1588);
        break;
      case 1:
        return impl48918_1587.call(self48919_1588, args48915[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args48915.length ?? ""}`);
    }
    ;
  }, "f48914_1585");
  return f48914_1585;
})();
var projCrsInfoListDestroy = /* @__PURE__ */ (() => {
  let f49071_1591 = null;
  const impl49074_1592 = /* @__PURE__ */ __name(async function() {
    return projCrsInfoListDestroy({});
  }, "impl49074_1592");
  const impl49075_1593 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_info_list_destroy", { "rettype": "void", "argtypes": [["list", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl49075_1593");
  f49071_1591 = /* @__PURE__ */ __name(function(...args49072) {
    const self49076_1594 = this;
    const G__49147_1595 = args49072.length;
    switch (G__49147_1595) {
      case 0:
        return impl49074_1592.call(self49076_1594);
        break;
      case 1:
        return impl49075_1593.call(self49076_1594, args49072[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args49072.length ?? ""}`);
    }
    ;
  }, "f49071_1591");
  return f49071_1591;
})();
var projOperationFactoryContextSetUseProjAlternativeGridNames = /* @__PURE__ */ (() => {
  let f49228_1597 = null;
  const impl49231_1598 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetUseProjAlternativeGridNames({});
  }, "impl49231_1598");
  const impl49232_1599 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_use_proj_alternative_grid_names", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["usePROJNames", "int32"]] }, opts__210__auto__, "camel");
  }, "impl49232_1599");
  f49228_1597 = /* @__PURE__ */ __name(function(...args49229) {
    const self49233_1600 = this;
    const G__49304_1601 = args49229.length;
    switch (G__49304_1601) {
      case 0:
        return impl49231_1598.call(self49233_1600);
        break;
      case 1:
        return impl49232_1599.call(self49233_1600, args49229[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args49229.length ?? ""}`);
    }
    ;
  }, "f49228_1597");
  return f49228_1597;
})();
var projContextGetDatabasePath = /* @__PURE__ */ (() => {
  let f49385_1603 = null;
  const impl49388_1604 = /* @__PURE__ */ __name(async function() {
    return projContextGetDatabasePath({});
  }, "impl49388_1604");
  const impl49389_1605 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_get_database_path", { "rettype": "string", "argtypes": [["context", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl49389_1605");
  f49385_1603 = /* @__PURE__ */ __name(function(...args49386) {
    const self49390_1606 = this;
    const G__49461_1607 = args49386.length;
    switch (G__49461_1607) {
      case 0:
        return impl49388_1604.call(self49390_1606);
        break;
      case 1:
        return impl49389_1605.call(self49390_1606, args49386[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args49386.length ?? ""}`);
    }
    ;
  }, "f49385_1603");
  return f49385_1603;
})();
var projContextSetNetworkCallbacks = /* @__PURE__ */ (() => {
  let f49542_1609 = null;
  const impl49545_1610 = /* @__PURE__ */ __name(async function() {
    return projContextSetNetworkCallbacks({});
  }, "impl49545_1610");
  const impl49546_1611 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_set_network_callbacks", { "rettype": "int32", "argtypes": [["context", "pointer"], ["open_cbk", "pointer"], ["close_cbk", "pointer"], ["get_header_cbk", "pointer"], ["read_range_cbk", "pointer"], ["user_data", "pointer?"]] }, opts__210__auto__, "camel");
  }, "impl49546_1611");
  f49542_1609 = /* @__PURE__ */ __name(function(...args49543) {
    const self49547_1612 = this;
    const G__49618_1613 = args49543.length;
    switch (G__49618_1613) {
      case 0:
        return impl49545_1610.call(self49547_1612);
        break;
      case 1:
        return impl49546_1611.call(self49547_1612, args49543[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args49543.length ?? ""}`);
    }
    ;
  }, "f49542_1609");
  return f49542_1609;
})();
var projIsCrs = /* @__PURE__ */ (() => {
  let f49699_1615 = null;
  const impl49702_1616 = /* @__PURE__ */ __name(async function() {
    return projIsCrs({});
  }, "impl49702_1616");
  const impl49703_1617 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_is_crs", { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl49703_1617");
  f49699_1615 = /* @__PURE__ */ __name(function(...args49700) {
    const self49704_1618 = this;
    const G__49775_1619 = args49700.length;
    switch (G__49775_1619) {
      case 0:
        return impl49702_1616.call(self49704_1618);
        break;
      case 1:
        return impl49703_1617.call(self49704_1618, args49700[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args49700.length ?? ""}`);
    }
    ;
  }, "f49699_1615");
  return f49699_1615;
})();
var projGetCrsListParametersDestroy = /* @__PURE__ */ (() => {
  let f49856_1621 = null;
  const impl49859_1622 = /* @__PURE__ */ __name(async function() {
    return projGetCrsListParametersDestroy({});
  }, "impl49859_1622");
  const impl49860_1623 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_crs_list_parameters_destroy", { "rettype": "void", "argtypes": [["params", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl49860_1623");
  f49856_1621 = /* @__PURE__ */ __name(function(...args49857) {
    const self49861_1624 = this;
    const G__49932_1625 = args49857.length;
    switch (G__49932_1625) {
      case 0:
        return impl49859_1622.call(self49861_1624);
        break;
      case 1:
        return impl49860_1623.call(self49861_1624, args49857[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args49857.length ?? ""}`);
    }
    ;
  }, "f49856_1621");
  return f49856_1621;
})();
var projContextGuessWktDialect = /* @__PURE__ */ (() => {
  let f50013_1627 = null;
  const impl50016_1628 = /* @__PURE__ */ __name(async function() {
    return projContextGuessWktDialect({});
  }, "impl50016_1628");
  const impl50017_1629 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_guess_wkt_dialect", { "rettype": "int32", "argtypes": [["context", "pointer"], ["wkt", "string"]] }, opts__210__auto__, "camel");
  }, "impl50017_1629");
  f50013_1627 = /* @__PURE__ */ __name(function(...args50014) {
    const self50018_1630 = this;
    const G__50089_1631 = args50014.length;
    switch (G__50089_1631) {
      case 0:
        return impl50016_1628.call(self50018_1630);
        break;
      case 1:
        return impl50017_1629.call(self50018_1630, args50014[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args50014.length ?? ""}`);
    }
    ;
  }, "f50013_1627");
  return f50013_1627;
})();
var projCreateOperationFactoryContext = /* @__PURE__ */ (() => {
  let f50170_1633 = null;
  const impl50173_1634 = /* @__PURE__ */ __name(async function() {
    return projCreateOperationFactoryContext({});
  }, "impl50173_1634");
  const impl50174_1635 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_operation_factory_context", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["authority", "string"]], "proj-returns": "pj-operation-factory-context" }, opts__210__auto__, "camel");
  }, "impl50174_1635");
  f50170_1633 = /* @__PURE__ */ __name(function(...args50171) {
    const self50175_1636 = this;
    const G__50246_1637 = args50171.length;
    switch (G__50246_1637) {
      case 0:
        return impl50173_1634.call(self50175_1636);
        break;
      case 1:
        return impl50174_1635.call(self50175_1636, args50171[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args50171.length ?? ""}`);
    }
    ;
  }, "f50170_1633");
  return f50170_1633;
})();
var projListDestroy = /* @__PURE__ */ (() => {
  let f50327_1639 = null;
  const impl50330_1640 = /* @__PURE__ */ __name(async function() {
    return projListDestroy({});
  }, "impl50330_1640");
  const impl50331_1641 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_list_destroy", { "rettype": "void", "argtypes": [["result", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl50331_1641");
  f50327_1639 = /* @__PURE__ */ __name(function(...args50328) {
    const self50332_1642 = this;
    const G__50403_1643 = args50328.length;
    switch (G__50403_1643) {
      case 0:
        return impl50330_1640.call(self50332_1642);
        break;
      case 1:
        return impl50331_1641.call(self50332_1642, args50328[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args50328.length ?? ""}`);
    }
    ;
  }, "f50327_1639");
  return f50327_1639;
})();
var projCsGetType = /* @__PURE__ */ (() => {
  let f50484_1645 = null;
  const impl50487_1646 = /* @__PURE__ */ __name(async function() {
    return projCsGetType({});
  }, "impl50487_1646");
  const impl50488_1647 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_cs_get_type", { "rettype": "int32", "argtypes": [["context", "pointer"], ["cs", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl50488_1647");
  f50484_1645 = /* @__PURE__ */ __name(function(...args50485) {
    const self50489_1648 = this;
    const G__50560_1649 = args50485.length;
    switch (G__50560_1649) {
      case 0:
        return impl50487_1646.call(self50489_1648);
        break;
      case 1:
        return impl50488_1647.call(self50489_1648, args50485[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args50485.length ?? ""}`);
    }
    ;
  }, "f50484_1645");
  return f50484_1645;
})();
var projAsWkt = /* @__PURE__ */ (() => {
  let f50641_1651 = null;
  const impl50644_1652 = /* @__PURE__ */ __name(async function() {
    return projAsWkt({});
  }, "impl50644_1652");
  const impl50645_1653 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_as_wkt", { "rettype": "string", "argtypes": [["context", "pointer"], ["pj", "pointer"], ["type", "int32"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null], ["type", "int32", "default", 2]] }, opts__210__auto__, "camel");
  }, "impl50645_1653");
  f50641_1651 = /* @__PURE__ */ __name(function(...args50642) {
    const self50646_1654 = this;
    const G__50717_1655 = args50642.length;
    switch (G__50717_1655) {
      case 0:
        return impl50644_1652.call(self50646_1654);
        break;
      case 1:
        return impl50645_1653.call(self50646_1654, args50642[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args50642.length ?? ""}`);
    }
    ;
  }, "f50641_1651");
  return f50641_1651;
})();
var projInsertObjectSessionCreate = /* @__PURE__ */ (() => {
  let f50798_1657 = null;
  const impl50801_1658 = /* @__PURE__ */ __name(async function() {
    return projInsertObjectSessionCreate({});
  }, "impl50801_1658");
  const impl50802_1659 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_insert_object_session_create", { "rettype": "pointer", "argtypes": [["context", "pointer"]], "proj-returns": "pj-insert-session" }, opts__210__auto__, "camel");
  }, "impl50802_1659");
  f50798_1657 = /* @__PURE__ */ __name(function(...args50799) {
    const self50803_1660 = this;
    const G__50874_1661 = args50799.length;
    switch (G__50874_1661) {
      case 0:
        return impl50801_1658.call(self50803_1660);
        break;
      case 1:
        return impl50802_1659.call(self50803_1660, args50799[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args50799.length ?? ""}`);
    }
    ;
  }, "f50798_1657");
  return f50798_1657;
})();
var projConvertConversionToOtherMethod = /* @__PURE__ */ (() => {
  let f50955_1663 = null;
  const impl50958_1664 = /* @__PURE__ */ __name(async function() {
    return projConvertConversionToOtherMethod({});
  }, "impl50958_1664");
  const impl50959_1665 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_convert_conversion_to_other_method", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["conversion", "pointer"], ["new_method_epsg_code", "int32"], ["new_method_name", "string"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl50959_1665");
  f50955_1663 = /* @__PURE__ */ __name(function(...args50956) {
    const self50960_1666 = this;
    const G__51031_1667 = args50956.length;
    switch (G__51031_1667) {
      case 0:
        return impl50958_1664.call(self50960_1666);
        break;
      case 1:
        return impl50959_1665.call(self50960_1666, args50956[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args50956.length ?? ""}`);
    }
    ;
  }, "f50955_1663");
  return f50955_1663;
})();
var projOperationFactoryContextSetDesiredAccuracy = /* @__PURE__ */ (() => {
  let f51112_1669 = null;
  const impl51115_1670 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetDesiredAccuracy({});
  }, "impl51115_1670");
  const impl51116_1671 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_desired_accuracy", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["accuracy", "float64"]] }, opts__210__auto__, "camel");
  }, "impl51116_1671");
  f51112_1669 = /* @__PURE__ */ __name(function(...args51113) {
    const self51117_1672 = this;
    const G__51188_1673 = args51113.length;
    switch (G__51188_1673) {
      case 0:
        return impl51115_1670.call(self51117_1672);
        break;
      case 1:
        return impl51116_1671.call(self51117_1672, args51113[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args51113.length ?? ""}`);
    }
    ;
  }, "f51112_1669");
  return f51112_1669;
})();
var projListGet = /* @__PURE__ */ (() => {
  let f51269_1675 = null;
  const impl51272_1676 = /* @__PURE__ */ __name(async function() {
    return projListGet({});
  }, "impl51272_1676");
  const impl51273_1677 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_list_get", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["result", "pointer"], ["index", "int32"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl51273_1677");
  f51269_1675 = /* @__PURE__ */ __name(function(...args51270) {
    const self51274_1678 = this;
    const G__51345_1679 = args51270.length;
    switch (G__51345_1679) {
      case 0:
        return impl51272_1676.call(self51274_1678);
        break;
      case 1:
        return impl51273_1677.call(self51274_1678, args51270[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args51270.length ?? ""}`);
    }
    ;
  }, "f51269_1675");
  return f51269_1675;
})();
var projCreateGeographicCrsFromDatum = /* @__PURE__ */ (() => {
  let f51426_1681 = null;
  const impl51429_1682 = /* @__PURE__ */ __name(async function() {
    return projCreateGeographicCrsFromDatum({});
  }, "impl51429_1682");
  const impl51430_1683 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_geographic_crs_from_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_or_datum_ensemble", "pointer"], ["ellipsoidal_cs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl51430_1683");
  f51426_1681 = /* @__PURE__ */ __name(function(...args51427) {
    const self51431_1684 = this;
    const G__51502_1685 = args51427.length;
    switch (G__51502_1685) {
      case 0:
        return impl51429_1682.call(self51431_1684);
        break;
      case 1:
        return impl51430_1683.call(self51431_1684, args51427[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args51427.length ?? ""}`);
    }
    ;
  }, "f51426_1681");
  return f51426_1681;
})();
var projGetName = /* @__PURE__ */ (() => {
  let f51583_1687 = null;
  const impl51586_1688 = /* @__PURE__ */ __name(async function() {
    return projGetName({});
  }, "impl51586_1688");
  const impl51587_1689 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_name", { "rettype": "string", "argtypes": [["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl51587_1689");
  f51583_1687 = /* @__PURE__ */ __name(function(...args51584) {
    const self51588_1690 = this;
    const G__51659_1691 = args51584.length;
    switch (G__51659_1691) {
      case 0:
        return impl51586_1688.call(self51588_1690);
        break;
      case 1:
        return impl51587_1689.call(self51588_1690, args51584[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args51584.length ?? ""}`);
    }
    ;
  }, "f51583_1687");
  return f51583_1687;
})();
var projCrsAlterParametersLinearUnit = /* @__PURE__ */ (() => {
  let f51740_1693 = null;
  const impl51743_1694 = /* @__PURE__ */ __name(async function() {
    return projCrsAlterParametersLinearUnit({});
  }, "impl51743_1694");
  const impl51744_1695 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_alter_parameters_linear_unit", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["linear_units", "string"], ["linear_units_conv", "float64"], ["unit_auth_name", "string"], ["unit_code", "string"], ["convert_to_new_unit", "int32"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl51744_1695");
  f51740_1693 = /* @__PURE__ */ __name(function(...args51741) {
    const self51745_1696 = this;
    const G__51816_1697 = args51741.length;
    switch (G__51816_1697) {
      case 0:
        return impl51743_1694.call(self51745_1696);
        break;
      case 1:
        return impl51744_1695.call(self51745_1696, args51741[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args51741.length ?? ""}`);
    }
    ;
  }, "f51740_1693");
  return f51740_1693;
})();
var projCoordoperationIsInstantiable = /* @__PURE__ */ (() => {
  let f51897_1699 = null;
  const impl51900_1700 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationIsInstantiable({});
  }, "impl51900_1700");
  const impl51901_1701 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_is_instantiable", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl51901_1701");
  f51897_1699 = /* @__PURE__ */ __name(function(...args51898) {
    const self51902_1702 = this;
    const G__51973_1703 = args51898.length;
    switch (G__51973_1703) {
      case 0:
        return impl51900_1700.call(self51902_1702);
        break;
      case 1:
        return impl51901_1701.call(self51902_1702, args51898[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args51898.length ?? ""}`);
    }
    ;
  }, "f51897_1699");
  return f51897_1699;
})();
var projCrsAlterCsAngularUnit = /* @__PURE__ */ (() => {
  let f52054_1705 = null;
  const impl52057_1706 = /* @__PURE__ */ __name(async function() {
    return projCrsAlterCsAngularUnit({});
  }, "impl52057_1706");
  const impl52058_1707 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_alter_cs_angular_unit", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["obj", "pointer"], ["angular_units", "string"], ["angular_units_conv", "float64"], ["unit_auth_name", "string"], ["unit_code", "string"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl52058_1707");
  f52054_1705 = /* @__PURE__ */ __name(function(...args52055) {
    const self52059_1708 = this;
    const G__52130_1709 = args52055.length;
    switch (G__52130_1709) {
      case 0:
        return impl52057_1706.call(self52059_1708);
        break;
      case 1:
        return impl52058_1707.call(self52059_1708, args52055[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args52055.length ?? ""}`);
    }
    ;
  }, "f52054_1705");
  return f52054_1705;
})();
var projDatumEnsembleGetMemberCount = /* @__PURE__ */ (() => {
  let f52211_1711 = null;
  const impl52214_1712 = /* @__PURE__ */ __name(async function() {
    return projDatumEnsembleGetMemberCount({});
  }, "impl52214_1712");
  const impl52215_1713 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_datum_ensemble_get_member_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["datum_ensemble", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl52215_1713");
  f52211_1711 = /* @__PURE__ */ __name(function(...args52212) {
    const self52216_1714 = this;
    const G__52287_1715 = args52212.length;
    switch (G__52287_1715) {
      case 0:
        return impl52214_1712.call(self52216_1714);
        break;
      case 1:
        return impl52215_1713.call(self52216_1714, args52212[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args52212.length ?? ""}`);
    }
    ;
  }, "f52211_1711");
  return f52211_1711;
})();
var projContextGetUserWritableDirectory = /* @__PURE__ */ (() => {
  let f52368_1717 = null;
  const impl52371_1718 = /* @__PURE__ */ __name(async function() {
    return projContextGetUserWritableDirectory({});
  }, "impl52371_1718");
  const impl52372_1719 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_get_user_writable_directory", { "rettype": "string", "argtypes": [["context", "pointer"], ["create", "int32"]] }, opts__210__auto__, "camel");
  }, "impl52372_1719");
  f52368_1717 = /* @__PURE__ */ __name(function(...args52369) {
    const self52373_1720 = this;
    const G__52444_1721 = args52369.length;
    switch (G__52444_1721) {
      case 0:
        return impl52371_1718.call(self52373_1720);
        break;
      case 1:
        return impl52372_1719.call(self52373_1720, args52369[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args52369.length ?? ""}`);
    }
    ;
  }, "f52368_1717");
  return f52368_1717;
})();
var projCreateVerticalCrs = /* @__PURE__ */ (() => {
  let f52525_1723 = null;
  const impl52528_1724 = /* @__PURE__ */ __name(async function() {
    return projCreateVerticalCrs({});
  }, "impl52528_1724");
  const impl52529_1725 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_vertical_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["linear_units", "string"], ["linear_units_conv", "float64"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl52529_1725");
  f52525_1723 = /* @__PURE__ */ __name(function(...args52526) {
    const self52530_1726 = this;
    const G__52601_1727 = args52526.length;
    switch (G__52601_1727) {
      case 0:
        return impl52528_1724.call(self52530_1726);
        break;
      case 1:
        return impl52529_1725.call(self52530_1726, args52526[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args52526.length ?? ""}`);
    }
    ;
  }, "f52525_1723");
  return f52525_1723;
})();
var projGetDomainCount = /* @__PURE__ */ (() => {
  let f52682_1729 = null;
  const impl52685_1730 = /* @__PURE__ */ __name(async function() {
    return projGetDomainCount({});
  }, "impl52685_1730");
  const impl52686_1731 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_domain_count", { "rettype": "int32", "argtypes": [["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl52686_1731");
  f52682_1729 = /* @__PURE__ */ __name(function(...args52683) {
    const self52687_1732 = this;
    const G__52758_1733 = args52683.length;
    switch (G__52758_1733) {
      case 0:
        return impl52685_1730.call(self52687_1732);
        break;
      case 1:
        return impl52686_1731.call(self52687_1732, args52683[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args52683.length ?? ""}`);
    }
    ;
  }, "f52682_1729");
  return f52682_1729;
})();
var projGetIdCode = /* @__PURE__ */ (() => {
  let f52839_1735 = null;
  const impl52842_1736 = /* @__PURE__ */ __name(async function() {
    return projGetIdCode({});
  }, "impl52842_1736");
  const impl52843_1737 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_id_code", { "rettype": "string", "argtypes": [["obj", "pointer"], ["index", "int32"]] }, opts__210__auto__, "camel");
  }, "impl52843_1737");
  f52839_1735 = /* @__PURE__ */ __name(function(...args52840) {
    const self52844_1738 = this;
    const G__52915_1739 = args52840.length;
    switch (G__52915_1739) {
      case 0:
        return impl52842_1736.call(self52844_1738);
        break;
      case 1:
        return impl52843_1737.call(self52844_1738, args52840[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args52840.length ?? ""}`);
    }
    ;
  }, "f52839_1735");
  return f52839_1735;
})();
var projOperationFactoryContextSetSpatialCriterion = /* @__PURE__ */ (() => {
  let f52996_1741 = null;
  const impl52999_1742 = /* @__PURE__ */ __name(async function() {
    return projOperationFactoryContextSetSpatialCriterion({});
  }, "impl52999_1742");
  const impl53000_1743 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_operation_factory_context_set_spatial_criterion", { "rettype": "void", "argtypes": [["ctx", "pointer"], ["factory_ctx", "pointer"], ["criterion", "int32"]] }, opts__210__auto__, "camel");
  }, "impl53000_1743");
  f52996_1741 = /* @__PURE__ */ __name(function(...args52997) {
    const self53001_1744 = this;
    const G__53072_1745 = args52997.length;
    switch (G__53072_1745) {
      case 0:
        return impl52999_1742.call(self53001_1744);
        break;
      case 1:
        return impl53000_1743.call(self53001_1744, args52997[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args52997.length ?? ""}`);
    }
    ;
  }, "f52996_1741");
  return f52996_1741;
})();
var projCreateEllipsoidal3DCs = /* @__PURE__ */ (() => {
  let f53153_1747 = null;
  const impl53156_1748 = /* @__PURE__ */ __name(async function() {
    return projCreateEllipsoidal3DCs({});
  }, "impl53156_1748");
  const impl53157_1749 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_ellipsoidal_3D_cs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["type", "int32"], ["horizontal_angular_unit_name", "string"], ["horizontal_angular_unit_conv_factor", "float64"], ["vertical_linear_unit_name", "string"], ["vertical_linear_unit_conv_factor", "float64"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl53157_1749");
  f53153_1747 = /* @__PURE__ */ __name(function(...args53154) {
    const self53158_1750 = this;
    const G__53229_1751 = args53154.length;
    switch (G__53229_1751) {
      case 0:
        return impl53156_1748.call(self53158_1750);
        break;
      case 1:
        return impl53157_1749.call(self53158_1750, args53154[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args53154.length ?? ""}`);
    }
    ;
  }, "f53153_1747");
  return f53153_1747;
})();
var projCreateOperations = /* @__PURE__ */ (() => {
  let f53310_1753 = null;
  const impl53313_1754 = /* @__PURE__ */ __name(async function() {
    return projCreateOperations({});
  }, "impl53313_1754");
  const impl53314_1755 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_operations", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["source_crs", "pointer"], ["target_crs", "pointer"], ["operationContext", "pointer"]], "proj-returns": "pj-list" }, opts__210__auto__, "camel");
  }, "impl53314_1755");
  f53310_1753 = /* @__PURE__ */ __name(function(...args53311) {
    const self53315_1756 = this;
    const G__53386_1757 = args53311.length;
    switch (G__53386_1757) {
      case 0:
        return impl53313_1754.call(self53315_1756);
        break;
      case 1:
        return impl53314_1755.call(self53315_1756, args53311[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args53311.length ?? ""}`);
    }
    ;
  }, "f53310_1753");
  return f53310_1753;
})();
var projGridGetInfoFromDatabase = /* @__PURE__ */ (() => {
  let f53467_1759 = null;
  const impl53470_1760 = /* @__PURE__ */ __name(async function() {
    return projGridGetInfoFromDatabase({});
  }, "impl53470_1760");
  const impl53471_1761 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_grid_get_info_from_database", { "rettype": "int32", "proj-returns": "out-params", "out-fields": [["full-name", "string"], ["package-name", "string"], ["url", "string"], ["direct-download", "int"], ["open-license", "int"], ["available", "int"]], "argtypes": [["context", "pointer"], ["grid_name", "string"], ["out_full_name", "pointer"], ["out_package_name", "pointer"], ["out_url", "pointer"], ["out_direct_download", "pointer"], ["out_open_license", "pointer"], ["out_available", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl53471_1761");
  f53467_1759 = /* @__PURE__ */ __name(function(...args53468) {
    const self53472_1762 = this;
    const G__53543_1763 = args53468.length;
    switch (G__53543_1763) {
      case 0:
        return impl53470_1760.call(self53472_1762);
        break;
      case 1:
        return impl53471_1761.call(self53472_1762, args53468[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args53468.length ?? ""}`);
    }
    ;
  }, "f53467_1759");
  return f53467_1759;
})();
var projDynamicDatumGetFrameReferenceEpoch = /* @__PURE__ */ (() => {
  let f53624_1765 = null;
  const impl53627_1766 = /* @__PURE__ */ __name(async function() {
    return projDynamicDatumGetFrameReferenceEpoch({});
  }, "impl53627_1766");
  const impl53628_1767 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_dynamic_datum_get_frame_reference_epoch", { "rettype": "float64", "argtypes": [["ctx", "pointer"], ["datum", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl53628_1767");
  f53624_1765 = /* @__PURE__ */ __name(function(...args53625) {
    const self53629_1768 = this;
    const G__53700_1769 = args53625.length;
    switch (G__53700_1769) {
      case 0:
        return impl53627_1766.call(self53629_1768);
        break;
      case 1:
        return impl53628_1767.call(self53629_1768, args53625[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args53625.length ?? ""}`);
    }
    ;
  }, "f53624_1765");
  return f53624_1765;
})();
var projLogLevel = /* @__PURE__ */ (() => {
  let f53781_1771 = null;
  const impl53784_1772 = /* @__PURE__ */ __name(async function() {
    return projLogLevel({});
  }, "impl53784_1772");
  const impl53785_1773 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_log_level", { "rettype": "int32", "argtypes": [["context", "pointer"], ["level", "int32"]] }, opts__210__auto__, "camel");
  }, "impl53785_1773");
  f53781_1771 = /* @__PURE__ */ __name(function(...args53782) {
    const self53786_1774 = this;
    const G__53857_1775 = args53782.length;
    switch (G__53857_1775) {
      case 0:
        return impl53784_1772.call(self53786_1774);
        break;
      case 1:
        return impl53785_1773.call(self53786_1774, args53782[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args53782.length ?? ""}`);
    }
    ;
  }, "f53781_1771");
  return f53781_1771;
})();
var projContextSetAutocloseDatabase = /* @__PURE__ */ (() => {
  let f53938_1777 = null;
  const impl53941_1778 = /* @__PURE__ */ __name(async function() {
    return projContextSetAutocloseDatabase({});
  }, "impl53941_1778");
  const impl53942_1779 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_context_set_autoclose_database", { "rettype": "void", "argtypes": [["context", "pointer"], ["autoclose", "int32"]] }, opts__210__auto__, "camel");
  }, "impl53942_1779");
  f53938_1777 = /* @__PURE__ */ __name(function(...args53939) {
    const self53943_1780 = this;
    const G__54014_1781 = args53939.length;
    switch (G__54014_1781) {
      case 0:
        return impl53941_1778.call(self53943_1780);
        break;
      case 1:
        return impl53942_1779.call(self53943_1780, args53939[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args53939.length ?? ""}`);
    }
    ;
  }, "f53938_1777");
  return f53938_1777;
})();
var projCreateVerticalCrsEx = /* @__PURE__ */ (() => {
  let f54095_1783 = null;
  const impl54098_1784 = /* @__PURE__ */ __name(async function() {
    return projCreateVerticalCrsEx({});
  }, "impl54098_1784");
  const impl54099_1785 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_vertical_crs_ex", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs_name", "string"], ["datum_name", "string"], ["datum_auth_name", "string"], ["datum_code", "string"], ["linear_units", "string"], ["linear_units_conv", "float64"], ["geoid_model_name", "string"], ["geoid_model_auth_name", "string"], ["geoid_model_code", "string"], ["geoid_geog_crs", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl54099_1785");
  f54095_1783 = /* @__PURE__ */ __name(function(...args54096) {
    const self54100_1786 = this;
    const G__54171_1787 = args54096.length;
    switch (G__54171_1787) {
      case 0:
        return impl54098_1784.call(self54100_1786);
        break;
      case 1:
        return impl54099_1785.call(self54100_1786, args54096[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args54096.length ?? ""}`);
    }
    ;
  }, "f54095_1783");
  return f54095_1783;
})();
var projCsGetAxisCount = /* @__PURE__ */ (() => {
  let f54252_1789 = null;
  const impl54255_1790 = /* @__PURE__ */ __name(async function() {
    return projCsGetAxisCount({});
  }, "impl54255_1790");
  const impl54256_1791 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_cs_get_axis_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["cs", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl54256_1791");
  f54252_1789 = /* @__PURE__ */ __name(function(...args54253) {
    const self54257_1792 = this;
    const G__54328_1793 = args54253.length;
    switch (G__54328_1793) {
      case 0:
        return impl54255_1790.call(self54257_1792);
        break;
      case 1:
        return impl54256_1791.call(self54257_1792, args54253[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args54253.length ?? ""}`);
    }
    ;
  }, "f54252_1789");
  return f54252_1789;
})();
var projIdentify = /* @__PURE__ */ (() => {
  let f54409_1795 = null;
  const impl54412_1796 = /* @__PURE__ */ __name(async function() {
    return projIdentify({});
  }, "impl54412_1796");
  const impl54413_1797 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_identify", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["obj", "pointer"], ["auth_name", "string"], ["options", "pointer?"], ["out_confidence", "pointer"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj-list" }, opts__210__auto__, "camel");
  }, "impl54413_1797");
  f54409_1795 = /* @__PURE__ */ __name(function(...args54410) {
    const self54414_1798 = this;
    const G__54485_1799 = args54410.length;
    switch (G__54485_1799) {
      case 0:
        return impl54412_1796.call(self54414_1798);
        break;
      case 1:
        return impl54413_1797.call(self54414_1798, args54410[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args54410.length ?? ""}`);
    }
    ;
  }, "f54409_1795");
  return f54409_1795;
})();
var projSuggestsCodeFor = /* @__PURE__ */ (() => {
  let f54566_1801 = null;
  const impl54569_1802 = /* @__PURE__ */ __name(async function() {
    return projSuggestsCodeFor({});
  }, "impl54569_1802");
  const impl54570_1803 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_suggests_code_for", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["object", "pointer"], ["authority", "string"], ["numeric_code", "int32"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "owned-string" }, opts__210__auto__, "camel");
  }, "impl54570_1803");
  f54566_1801 = /* @__PURE__ */ __name(function(...args54567) {
    const self54571_1804 = this;
    const G__54642_1805 = args54567.length;
    switch (G__54642_1805) {
      case 0:
        return impl54569_1802.call(self54571_1804);
        break;
      case 1:
        return impl54570_1803.call(self54571_1804, args54567[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args54567.length ?? ""}`);
    }
    ;
  }, "f54566_1801");
  return f54566_1801;
})();
var projConcatoperationGetStep = /* @__PURE__ */ (() => {
  let f54723_1807 = null;
  const impl54726_1808 = /* @__PURE__ */ __name(async function() {
    return projConcatoperationGetStep({});
  }, "impl54726_1808");
  const impl54727_1809 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_concatoperation_get_step", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["concatoperation", "pointer"], ["i_step", "int32"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl54727_1809");
  f54723_1807 = /* @__PURE__ */ __name(function(...args54724) {
    const self54728_1810 = this;
    const G__54799_1811 = args54724.length;
    switch (G__54799_1811) {
      case 0:
        return impl54726_1808.call(self54728_1810);
        break;
      case 1:
        return impl54727_1809.call(self54728_1810, args54724[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args54724.length ?? ""}`);
    }
    ;
  }, "f54723_1807");
  return f54723_1807;
})();
var projDatumEnsembleGetMember = /* @__PURE__ */ (() => {
  let f54880_1813 = null;
  const impl54883_1814 = /* @__PURE__ */ __name(async function() {
    return projDatumEnsembleGetMember({});
  }, "impl54883_1814");
  const impl54884_1815 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_datum_ensemble_get_member", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["datum_ensemble", "pointer"], ["member_index", "int32"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl54884_1815");
  f54880_1813 = /* @__PURE__ */ __name(function(...args54881) {
    const self54885_1816 = this;
    const G__54956_1817 = args54881.length;
    switch (G__54956_1817) {
      case 0:
        return impl54883_1814.call(self54885_1816);
        break;
      case 1:
        return impl54884_1815.call(self54885_1816, args54881[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args54881.length ?? ""}`);
    }
    ;
  }, "f54880_1813");
  return f54880_1813;
})();
var projCrsGetDatumForced = /* @__PURE__ */ (() => {
  let f55037_1819 = null;
  const impl55040_1820 = /* @__PURE__ */ __name(async function() {
    return projCrsGetDatumForced({});
  }, "impl55040_1820");
  const impl55041_1821 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_get_datum_forced", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl55041_1821");
  f55037_1819 = /* @__PURE__ */ __name(function(...args55038) {
    const self55042_1822 = this;
    const G__55113_1823 = args55038.length;
    switch (G__55113_1823) {
      case 0:
        return impl55040_1820.call(self55042_1822);
        break;
      case 1:
        return impl55041_1821.call(self55042_1822, args55038[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args55038.length ?? ""}`);
    }
    ;
  }, "f55037_1819");
  return f55037_1819;
})();
var projCrsCreateBoundCrsToWGS84 = /* @__PURE__ */ (() => {
  let f55194_1825 = null;
  const impl55197_1826 = /* @__PURE__ */ __name(async function() {
    return projCrsCreateBoundCrsToWGS84({});
  }, "impl55197_1826");
  const impl55198_1827 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_create_bound_crs_to_WGS84", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl55198_1827");
  f55194_1825 = /* @__PURE__ */ __name(function(...args55195) {
    const self55199_1828 = this;
    const G__55270_1829 = args55195.length;
    switch (G__55270_1829) {
      case 0:
        return impl55197_1826.call(self55199_1828);
        break;
      case 1:
        return impl55198_1827.call(self55199_1828, args55195[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args55195.length ?? ""}`);
    }
    ;
  }, "f55194_1825");
  return f55194_1825;
})();
var projCrsGetSubCrs = /* @__PURE__ */ (() => {
  let f55351_1831 = null;
  const impl55354_1832 = /* @__PURE__ */ __name(async function() {
    return projCrsGetSubCrs({});
  }, "impl55354_1832");
  const impl55355_1833 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_get_sub_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"], ["index", "int32"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl55355_1833");
  f55351_1831 = /* @__PURE__ */ __name(function(...args55352) {
    const self55356_1834 = this;
    const G__55427_1835 = args55352.length;
    switch (G__55427_1835) {
      case 0:
        return impl55354_1832.call(self55356_1834);
        break;
      case 1:
        return impl55355_1833.call(self55356_1834, args55352[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args55352.length ?? ""}`);
    }
    ;
  }, "f55351_1831");
  return f55351_1831;
})();
var projGetCelestialBodyName = /* @__PURE__ */ (() => {
  let f55508_1837 = null;
  const impl55511_1838 = /* @__PURE__ */ __name(async function() {
    return projGetCelestialBodyName({});
  }, "impl55511_1838");
  const impl55512_1839 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_celestial_body_name", { "rettype": "string", "argtypes": [["ctx", "pointer"], ["obj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl55512_1839");
  f55508_1837 = /* @__PURE__ */ __name(function(...args55509) {
    const self55513_1840 = this;
    const G__55584_1841 = args55509.length;
    switch (G__55584_1841) {
      case 0:
        return impl55511_1838.call(self55513_1840);
        break;
      case 1:
        return impl55512_1839.call(self55513_1840, args55509[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args55509.length ?? ""}`);
    }
    ;
  }, "f55508_1837");
  return f55508_1837;
})();
var projErrnoReset = /* @__PURE__ */ (() => {
  let f55665_1843 = null;
  const impl55668_1844 = /* @__PURE__ */ __name(async function() {
    return projErrnoReset({});
  }, "impl55668_1844");
  const impl55669_1845 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_errno_reset", { "rettype": "int32", "argtypes": [["pj", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl55669_1845");
  f55665_1843 = /* @__PURE__ */ __name(function(...args55666) {
    const self55670_1846 = this;
    const G__55741_1847 = args55666.length;
    switch (G__55741_1847) {
      case 0:
        return impl55668_1844.call(self55670_1846);
        break;
      case 1:
        return impl55669_1845.call(self55670_1846, args55666[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args55666.length ?? ""}`);
    }
    ;
  }, "f55665_1843");
  return f55665_1843;
})();
var projInsertObjectSessionDestroy = /* @__PURE__ */ (() => {
  let f55822_1849 = null;
  const impl55825_1850 = /* @__PURE__ */ __name(async function() {
    return projInsertObjectSessionDestroy({});
  }, "impl55825_1850");
  const impl55826_1851 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_insert_object_session_destroy", { "rettype": "void", "argtypes": [["context", "pointer"], ["session", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl55826_1851");
  f55822_1849 = /* @__PURE__ */ __name(function(...args55823) {
    const self55827_1852 = this;
    const G__55898_1853 = args55823.length;
    switch (G__55898_1853) {
      case 0:
        return impl55825_1850.call(self55827_1852);
        break;
      case 1:
        return impl55826_1851.call(self55827_1852, args55823[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args55823.length ?? ""}`);
    }
    ;
  }, "f55822_1849");
  return f55822_1849;
})();
var projCreateEngineeringCrs = /* @__PURE__ */ (() => {
  let f55979_1855 = null;
  const impl55982_1856 = /* @__PURE__ */ __name(async function() {
    return projCreateEngineeringCrs({});
  }, "impl55982_1856");
  const impl55983_1857 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_engineering_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crsName", "string"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl55983_1857");
  f55979_1855 = /* @__PURE__ */ __name(function(...args55980) {
    const self55984_1858 = this;
    const G__56055_1859 = args55980.length;
    switch (G__56055_1859) {
      case 0:
        return impl55982_1856.call(self55984_1858);
        break;
      case 1:
        return impl55983_1857.call(self55984_1858, args55980[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args55980.length ?? ""}`);
    }
    ;
  }, "f55979_1855");
  return f55979_1855;
})();
var projCrsGetGeodeticCrs = /* @__PURE__ */ (() => {
  let f56136_1861 = null;
  const impl56139_1862 = /* @__PURE__ */ __name(async function() {
    return projCrsGetGeodeticCrs({});
  }, "impl56139_1862");
  const impl56140_1863 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_get_geodetic_crs", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl56140_1863");
  f56136_1861 = /* @__PURE__ */ __name(function(...args56137) {
    const self56141_1864 = this;
    const G__56212_1865 = args56137.length;
    switch (G__56212_1865) {
      case 0:
        return impl56139_1862.call(self56141_1864);
        break;
      case 1:
        return impl56140_1863.call(self56141_1864, args56137[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args56137.length ?? ""}`);
    }
    ;
  }, "f56136_1861");
  return f56136_1861;
})();
var projCreateFromWkt = /* @__PURE__ */ (() => {
  let f56293_1867 = null;
  const impl56296_1868 = /* @__PURE__ */ __name(async function() {
    return projCreateFromWkt({});
  }, "impl56296_1868");
  const impl56297_1869 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_create_from_wkt", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["wkt", "string"], ["options", "pointer?"], ["out_warnings", "pointer?"], ["out_grammar_errors", "pointer?"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl56297_1869");
  f56293_1867 = /* @__PURE__ */ __name(function(...args56294) {
    const self56298_1870 = this;
    const G__56369_1871 = args56294.length;
    switch (G__56369_1871) {
      case 0:
        return impl56296_1868.call(self56298_1870);
        break;
      case 1:
        return impl56297_1869.call(self56298_1870, args56294[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args56294.length ?? ""}`);
    }
    ;
  }, "f56293_1867");
  return f56293_1867;
})();
var projCrsIsDynamic = /* @__PURE__ */ (() => {
  let f56450_1873 = null;
  const impl56453_1874 = /* @__PURE__ */ __name(async function() {
    return projCrsIsDynamic({});
  }, "impl56453_1874");
  const impl56454_1875 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_is_dynamic", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl56454_1875");
  f56450_1873 = /* @__PURE__ */ __name(function(...args56451) {
    const self56455_1876 = this;
    const G__56526_1877 = args56451.length;
    switch (G__56526_1877) {
      case 0:
        return impl56453_1874.call(self56455_1876);
        break;
      case 1:
        return impl56454_1875.call(self56455_1876, args56451[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args56451.length ?? ""}`);
    }
    ;
  }, "f56450_1873");
  return f56450_1873;
})();
var projCrsGetHorizontalDatum = /* @__PURE__ */ (() => {
  let f56607_1879 = null;
  const impl56610_1880 = /* @__PURE__ */ __name(async function() {
    return projCrsGetHorizontalDatum({});
  }, "impl56610_1880");
  const impl56611_1881 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_crs_get_horizontal_datum", { "rettype": "pointer", "argtypes": [["ctx", "pointer"], ["crs", "pointer"]], "proj-returns": "pj" }, opts__210__auto__, "camel");
  }, "impl56611_1881");
  f56607_1879 = /* @__PURE__ */ __name(function(...args56608) {
    const self56612_1882 = this;
    const G__56683_1883 = args56608.length;
    switch (G__56683_1883) {
      case 0:
        return impl56610_1880.call(self56612_1882);
        break;
      case 1:
        return impl56611_1881.call(self56612_1882, args56608[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args56608.length ?? ""}`);
    }
    ;
  }, "f56607_1879");
  return f56607_1879;
})();
var projGetCodesFromDatabase = /* @__PURE__ */ (() => {
  let f56764_1885 = null;
  const impl56767_1886 = /* @__PURE__ */ __name(async function() {
    return projGetCodesFromDatabase({});
  }, "impl56767_1886");
  const impl56768_1887 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_codes_from_database", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["auth_name", "string"], ["type", "int32", "default", 8], ["allow_deprecated", "int32", "default", 1]], "proj-returns": "string-list" }, opts__210__auto__, "camel");
  }, "impl56768_1887");
  f56764_1885 = /* @__PURE__ */ __name(function(...args56765) {
    const self56769_1888 = this;
    const G__56840_1889 = args56765.length;
    switch (G__56840_1889) {
      case 0:
        return impl56767_1886.call(self56769_1888);
        break;
      case 1:
        return impl56768_1887.call(self56769_1888, args56765[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args56765.length ?? ""}`);
    }
    ;
  }, "f56764_1885");
  return f56764_1885;
})();
var projAsProjjson = /* @__PURE__ */ (() => {
  let f56921_1891 = null;
  const impl56924_1892 = /* @__PURE__ */ __name(async function() {
    return projAsProjjson({});
  }, "impl56924_1892");
  const impl56925_1893 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_as_projjson", { "rettype": "string", "argtypes": [["context", "pointer"], ["pj", "pointer"], ["options", "pointer?"]], "argsemantics": [["options", "string-array?", "default", null]] }, opts__210__auto__, "camel");
  }, "impl56925_1893");
  f56921_1891 = /* @__PURE__ */ __name(function(...args56922) {
    const self56926_1894 = this;
    const G__56997_1895 = args56922.length;
    switch (G__56997_1895) {
      case 0:
        return impl56924_1892.call(self56926_1894);
        break;
      case 1:
        return impl56925_1893.call(self56926_1894, args56922[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args56922.length ?? ""}`);
    }
    ;
  }, "f56921_1891");
  return f56921_1891;
})();
var projGetNonDeprecated = /* @__PURE__ */ (() => {
  let f57078_1897 = null;
  const impl57081_1898 = /* @__PURE__ */ __name(async function() {
    return projGetNonDeprecated({});
  }, "impl57081_1898");
  const impl57082_1899 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_get_non_deprecated", { "rettype": "pointer", "argtypes": [["context", "pointer"], ["obj", "pointer"]], "proj-returns": "pj-list" }, opts__210__auto__, "camel");
  }, "impl57082_1899");
  f57078_1897 = /* @__PURE__ */ __name(function(...args57079) {
    const self57083_1900 = this;
    const G__57154_1901 = args57079.length;
    switch (G__57154_1901) {
      case 0:
        return impl57081_1898.call(self57083_1900);
        break;
      case 1:
        return impl57082_1899.call(self57083_1900, args57079[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args57079.length ?? ""}`);
    }
    ;
  }, "f57078_1897");
  return f57078_1897;
})();
var projCoordoperationGetParamCount = /* @__PURE__ */ (() => {
  let f57235_1903 = null;
  const impl57238_1904 = /* @__PURE__ */ __name(async function() {
    return projCoordoperationGetParamCount({});
  }, "impl57238_1904");
  const impl57239_1905 = /* @__PURE__ */ __name(async function(opts__210__auto__) {
    return dispatch_proj_fn("proj_coordoperation_get_param_count", { "rettype": "int32", "argtypes": [["ctx", "pointer"], ["coordoperation", "pointer"]] }, opts__210__auto__, "camel");
  }, "impl57239_1905");
  f57235_1903 = /* @__PURE__ */ __name(function(...args57236) {
    const self57240_1906 = this;
    const G__57311_1907 = args57236.length;
    switch (G__57311_1907) {
      case 0:
        return impl57238_1904.call(self57240_1906);
        break;
      case 1:
        return impl57239_1905.call(self57240_1906, args57236[0]);
        break;
      default:
        throw new Error(`${"Invalid arity: "}${args57236.length ?? ""}`);
    }
    ;
  }, "f57235_1903");
  return f57235_1903;
})();
var transform_batch = /* @__PURE__ */ __name(function(source_crs, target_crs, coord_array2) {
  throw squint_core5.ex_info("transform-batch: CLJS surface not yet implemented. Worker-side dispatch uses proj/proj-trans-array directly through the worker-router handler.", { "source-crs": source_crs, "target-crs": target_crs, "coord-array": coord_array2 });
}, "transform_batch");
var init = init_BANG_;
var shutdown = shutdown_BANG_2;
var flushPendingDisposes = flush_pending_disposes_BANG_4;
var getPoolDetail = get_pool_detail2;
var setCoords = set_coords_BANG_;
var getCoords = get_coords;
var getWorkerCount = get_worker_count2;
var contextCreate = context_create;
var contextPtr = context_ptr;
var contextDatabasePath = context_database_path;
var contextSetDatabasePath = context_set_database_path;
var contextSetEnableNetwork = context_set_enable_network;
var isContext = is_context_QMARK_;
var coordArray = coord_array;
var coordToCoordArray = coord__GT_coord_array;
var allocCoordArray = alloc_coord_array;
var setCoordArray = set_coord_array;
var getCoordArray = get_coord_array;
var handler_spec = spec;
var handler_default_init_args = default_init_args;
var handlerSpec = handler_spec;
var handlerDefaultInitArgs = handler_default_init_args;
export {
  PJ_CART2D_EASTING_NORTHING,
  PJ_CART2D_NORTHING_EASTING,
  PJ_CART2D_NORTH_POLE_EASTING_SOUTH_NORTHING_SOUTH,
  PJ_CART2D_SOUTH_POLE_EASTING_NORTH_NORTHING_NORTH,
  PJ_CART2D_WESTING_SOUTHING,
  PJ_CATEGORY_COORDINATE_OPERATION,
  PJ_CATEGORY_CRS,
  PJ_CATEGORY_DATUM,
  PJ_CATEGORY_DATUM_ENSEMBLE,
  PJ_CATEGORY_ELLIPSOID,
  PJ_CATEGORY_PRIME_MERIDIAN,
  PJ_COMP_EQUIVALENT,
  PJ_COMP_EQUIVALENT_EXCEPT_AXIS_ORDER_GEOGCRS,
  PJ_COMP_STRICT,
  PJ_CRS_EXTENT_BOTH,
  PJ_CRS_EXTENT_INTERSECTION,
  PJ_CRS_EXTENT_NONE,
  PJ_CRS_EXTENT_SMALLEST,
  PJ_CS_TYPE_CARTESIAN,
  PJ_CS_TYPE_DATETIMETEMPORAL,
  PJ_CS_TYPE_ELLIPSOIDAL,
  PJ_CS_TYPE_ORDINAL,
  PJ_CS_TYPE_PARAMETRIC,
  PJ_CS_TYPE_SPHERICAL,
  PJ_CS_TYPE_TEMPORALCOUNT,
  PJ_CS_TYPE_TEMPORALMEASURE,
  PJ_CS_TYPE_UNKNOWN,
  PJ_CS_TYPE_VERTICAL,
  PJ_ELLPS2D_LATITUDE_LONGITUDE,
  PJ_ELLPS2D_LONGITUDE_LATITUDE,
  PJ_ELLPS3D_LATITUDE_LONGITUDE_HEIGHT,
  PJ_ELLPS3D_LONGITUDE_LATITUDE_HEIGHT,
  PJ_FWD,
  PJ_GUESSED_NOT_WKT,
  PJ_GUESSED_WKT1_ESRI,
  PJ_GUESSED_WKT1_GDAL,
  PJ_GUESSED_WKT2_2015,
  PJ_GUESSED_WKT2_2018,
  PJ_GUESSED_WKT2_2019,
  PJ_IDENT,
  PJ_INV,
  PJ_LOG_DEBUG,
  PJ_LOG_DEBUG_MAJOR,
  PJ_LOG_DEBUG_MINOR,
  PJ_LOG_ERROR,
  PJ_LOG_NONE,
  PJ_LOG_TELL,
  PJ_LOG_TRACE,
  PJ_PROJ_4,
  PJ_PROJ_5,
  PJ_TYPE_BOUND_CRS,
  PJ_TYPE_COMPOUND_CRS,
  PJ_TYPE_CONCATENATED_OPERATION,
  PJ_TYPE_CONVERSION,
  PJ_TYPE_COORDINATE_METADATA,
  PJ_TYPE_CRS,
  PJ_TYPE_DATUM_ENSEMBLE,
  PJ_TYPE_DERIVED_PROJECTED_CRS,
  PJ_TYPE_DYNAMIC_GEODETIC_REFERENCE_FRAME,
  PJ_TYPE_DYNAMIC_VERTICAL_REFERENCE_FRAME,
  PJ_TYPE_ELLIPSOID,
  PJ_TYPE_ENGINEERING_CRS,
  PJ_TYPE_ENGINEERING_DATUM,
  PJ_TYPE_GEOCENTRIC_CRS,
  PJ_TYPE_GEODETIC_CRS,
  PJ_TYPE_GEODETIC_REFERENCE_FRAME,
  PJ_TYPE_GEOGRAPHIC_2D_CRS,
  PJ_TYPE_GEOGRAPHIC_3D_CRS,
  PJ_TYPE_GEOGRAPHIC_CRS,
  PJ_TYPE_OTHER_COORDINATE_OPERATION,
  PJ_TYPE_OTHER_CRS,
  PJ_TYPE_PARAMETRIC_DATUM,
  PJ_TYPE_PRIME_MERIDIAN,
  PJ_TYPE_PROJECTED_CRS,
  PJ_TYPE_TEMPORAL_CRS,
  PJ_TYPE_TEMPORAL_DATUM,
  PJ_TYPE_TRANSFORMATION,
  PJ_TYPE_UNKNOWN,
  PJ_TYPE_VERTICAL_CRS,
  PJ_TYPE_VERTICAL_REFERENCE_FRAME,
  PJ_UT_ANGULAR,
  PJ_UT_LINEAR,
  PJ_UT_PARAMETRIC,
  PJ_UT_SCALE,
  PJ_UT_TIME,
  PJ_WKT1_ESRI,
  PJ_WKT1_GDAL,
  PJ_WKT2_2015,
  PJ_WKT2_2015_SIMPLIFIED,
  PJ_WKT2_2018,
  PJ_WKT2_2018_SIMPLIFIED,
  PJ_WKT2_2019,
  PJ_WKT2_2019_SIMPLIFIED,
  PROJ_ERR_COORD_TRANSFM,
  PROJ_ERR_COORD_TRANSFM_GRID_AT_NODATA,
  PROJ_ERR_COORD_TRANSFM_INVALID_COORD,
  PROJ_ERR_COORD_TRANSFM_MISSING_TIME,
  PROJ_ERR_COORD_TRANSFM_NO_CONVERGENCE,
  PROJ_ERR_COORD_TRANSFM_NO_OPERATION,
  PROJ_ERR_COORD_TRANSFM_OUTSIDE_GRID,
  PROJ_ERR_COORD_TRANSFM_OUTSIDE_PROJECTION_DOMAIN,
  PROJ_ERR_INVALID_OP,
  PROJ_ERR_INVALID_OP_FILE_NOT_FOUND_OR_INVALID,
  PROJ_ERR_INVALID_OP_ILLEGAL_ARG_VALUE,
  PROJ_ERR_INVALID_OP_MISSING_ARG,
  PROJ_ERR_INVALID_OP_MUTUALLY_EXCLUSIVE_ARGS,
  PROJ_ERR_INVALID_OP_WRONG_SYNTAX,
  PROJ_ERR_OTHER,
  PROJ_ERR_OTHER_API_MISUSE,
  PROJ_ERR_OTHER_NETWORK_ERROR,
  PROJ_ERR_OTHER_NO_INVERSE_OP,
  PROJ_GRID_AVAILABILITY_DISCARD_OPERATION_IF_MISSING_GRID,
  PROJ_GRID_AVAILABILITY_IGNORED,
  PROJ_GRID_AVAILABILITY_KNOWN_AVAILABLE,
  PROJ_GRID_AVAILABILITY_USED_FOR_SORTING,
  PROJ_INTERMEDIATE_CRS_USE_ALWAYS,
  PROJ_INTERMEDIATE_CRS_USE_IF_NO_DIRECT_TRANSFORMATION,
  PROJ_INTERMEDIATE_CRS_USE_NEVER,
  PROJ_SPATIAL_CRITERION_PARTIAL_INTERSECTION,
  PROJ_SPATIAL_CRITERION_STRICT_CONTAINMENT,
  PROJ_VERSION_MAJOR,
  PROJ_VERSION_MINOR,
  PROJ_VERSION_PATCH,
  allocCoordArray,
  alloc_coord_array,
  call_native,
  contextCreate,
  contextDatabasePath,
  contextPtr,
  contextSetDatabasePath,
  contextSetEnableNetwork,
  context_create,
  context_database_path,
  context_ptr,
  context_set_database_path,
  context_set_enable_network,
  coordArray,
  coordToCoordArray,
  coord__GT_coord_array,
  coord_array,
  cs,
  dispatch_call,
  dispatch_context_fn,
  dispatch_proj_fn,
  ensure_initialized_BANG_,
  error_code__GT_string,
  extract_args,
  ffi_QMARK_2 as ffi_QMARK_,
  flushPendingDisposes,
  flush_pending_disposes_BANG_4 as flush_pending_disposes_BANG_,
  fndefs,
  force_ffi_BANG_2 as force_ffi_BANG_,
  force_graal,
  force_graal_BANG_2 as force_graal_BANG_,
  getCoordArray,
  getCoords,
  getPoolDetail,
  getWorkerCount,
  get_coord_array,
  get_coords,
  get_pool_detail2 as get_pool_detail,
  get_remaining_args,
  get_worker_count2 as get_worker_count,
  graal_QMARK_2 as graal_QMARK_,
  handlerDefaultInitArgs,
  handlerSpec,
  handler_default_init_args,
  handler_spec,
  implementation,
  init,
  init_BANG_,
  isContext,
  is_c_context_fn_QMARK_,
  is_context_QMARK_,
  lib,
  node_QMARK_2 as node_QMARK_,
  p2 as p,
  process_return_value_with_tracking,
  projAlterId,
  projAlterName,
  projAsProjString,
  projAsProjjson,
  projAsWkt,
  projAssignContext,
  projCelestialBodyListDestroy,
  projClone,
  projConcatoperationGetStep,
  projConcatoperationGetStepCount,
  projContextClone,
  projContextCreate,
  projContextDestroy,
  projContextErrno,
  projContextErrnoString,
  projContextGetDatabaseMetadata,
  projContextGetDatabasePath,
  projContextGetDatabaseStructure,
  projContextGetUserWritableDirectory,
  projContextGuessWktDialect,
  projContextIsNetworkEnabled,
  projContextSetAutocloseDatabase,
  projContextSetDatabasePath,
  projContextSetEnableNetwork,
  projContextSetNetworkCallbacks,
  projContextSetSearchPaths,
  projConvertConversionToOtherMethod,
  projCoordinateMetadataCreate,
  projCoordinateMetadataGetEpoch,
  projCoordoperationCreateInverse,
  projCoordoperationGetAccuracy,
  projCoordoperationGetGridUsed,
  projCoordoperationGetGridUsedCount,
  projCoordoperationGetMethodInfo,
  projCoordoperationGetParam,
  projCoordoperationGetParamCount,
  projCoordoperationGetParamIndex,
  projCoordoperationGetTowgs84Values,
  projCoordoperationHasBallparkTransformation,
  projCoordoperationIsInstantiable,
  projCoordoperationRequiresPerCoordinateInputTime,
  projCreate,
  projCreateCartesian2DCs,
  projCreateCompoundCrs,
  projCreateConversion,
  projCreateCrsToCrs,
  projCreateCrsToCrsFromPj,
  projCreateCs,
  projCreateDerivedGeographicCrs,
  projCreateEllipsoidal2DCs,
  projCreateEllipsoidal3DCs,
  projCreateEngineeringCrs,
  projCreateFromDatabase,
  projCreateFromName,
  projCreateFromWkt,
  projCreateGeocentricCrs,
  projCreateGeocentricCrsFromDatum,
  projCreateGeographicCrs,
  projCreateGeographicCrsFromDatum,
  projCreateOperationFactoryContext,
  projCreateOperations,
  projCreateProjectedCrs,
  projCreateTransformation,
  projCreateVerticalCrs,
  projCreateVerticalCrsEx,
  projCrsAlterCsAngularUnit,
  projCrsAlterCsLinearUnit,
  projCrsAlterGeodeticCrs,
  projCrsAlterParametersLinearUnit,
  projCrsCreateBoundCrs,
  projCrsCreateBoundCrsToWGS84,
  projCrsCreateBoundVerticalCrs,
  projCrsCreateProjected3DCrsFrom2D,
  projCrsDemoteTo2D,
  projCrsGetCoordinateSystem,
  projCrsGetCoordoperation,
  projCrsGetDatum,
  projCrsGetDatumEnsemble,
  projCrsGetDatumForced,
  projCrsGetGeodeticCrs,
  projCrsGetHorizontalDatum,
  projCrsGetSubCrs,
  projCrsHasPointMotionOperation,
  projCrsInfoListDestroy,
  projCrsIsDerived,
  projCrsIsDynamic,
  projCrsPromoteTo3D,
  projCsGetAxisCount,
  projCsGetAxisInfo,
  projCsGetType,
  projDatumEnsembleGetAccuracy,
  projDatumEnsembleGetMember,
  projDatumEnsembleGetMemberCount,
  projDestroy,
  projDynamicDatumGetFrameReferenceEpoch,
  projEllipsoidGetParameters,
  projErrnoReset,
  projGetAreaOfUse,
  projGetAreaOfUseEx,
  projGetAuthoritiesFromDatabase,
  projGetCelestialBodyListFromDatabase,
  projGetCelestialBodyName,
  projGetCodesFromDatabase,
  projGetCrsInfoListFromDatabase,
  projGetCrsListParametersCreate,
  projGetCrsListParametersDestroy,
  projGetDomainCount,
  projGetEllipsoid,
  projGetGeoidModelsFromDatabase,
  projGetIdAuthName,
  projGetIdCode,
  projGetInsertStatements,
  projGetName,
  projGetNonDeprecated,
  projGetPrimeMeridian,
  projGetRemarks,
  projGetScope,
  projGetScopeEx,
  projGetSourceCrs,
  projGetTargetCrs,
  projGetType,
  projGetUnitsFromDatabase,
  projGridGetInfoFromDatabase,
  projIdentify,
  projInsertObjectSessionCreate,
  projInsertObjectSessionDestroy,
  projIntListDestroy,
  projIsCrs,
  projIsDeprecated,
  projIsDerivedCrs,
  projIsEquivalentTo,
  projIsEquivalentToWithCtx,
  projListDestroy,
  projListGet,
  projListGetCount,
  projLogFunc,
  projLogLevel,
  projNormalizeForVisualization,
  projOperationFactoryContextDestroy,
  projOperationFactoryContextSetAllowBallparkTransformations,
  projOperationFactoryContextSetAllowUseIntermediateCrs,
  projOperationFactoryContextSetAllowedIntermediateCrs,
  projOperationFactoryContextSetAreaOfInterest,
  projOperationFactoryContextSetAreaOfInterestName,
  projOperationFactoryContextSetCrsExtentUse,
  projOperationFactoryContextSetDesiredAccuracy,
  projOperationFactoryContextSetDiscardSuperseded,
  projOperationFactoryContextSetGridAvailabilityUse,
  projOperationFactoryContextSetSpatialCriterion,
  projOperationFactoryContextSetUseProjAlternativeGridNames,
  projPrimeMeridianGetParameters,
  projQueryGeodeticCrsFromDatum,
  projStringDestroy,
  projStringListDestroy,
  projSuggestsCodeFor,
  projTransArray,
  projTransGeneric,
  projUnitListDestroy,
  projUomGetInfoFromDatabase,
  proj_alter_id,
  proj_alter_name,
  proj_as_proj_string,
  proj_as_projjson,
  proj_as_wkt,
  proj_assign_context,
  proj_celestial_body_list_destroy,
  proj_clone,
  proj_concatoperation_get_step,
  proj_concatoperation_get_step_count,
  proj_context_clone,
  proj_context_create,
  proj_context_destroy,
  proj_context_errno,
  proj_context_errno_string,
  proj_context_get_database_metadata,
  proj_context_get_database_path,
  proj_context_get_database_structure,
  proj_context_get_user_writable_directory,
  proj_context_guess_wkt_dialect,
  proj_context_is_network_enabled,
  proj_context_set_autoclose_database,
  proj_context_set_database_path,
  proj_context_set_enable_network,
  proj_context_set_network_callbacks,
  proj_context_set_search_paths,
  proj_convert_conversion_to_other_method,
  proj_coordinate_metadata_create,
  proj_coordinate_metadata_get_epoch,
  proj_coordoperation_create_inverse,
  proj_coordoperation_get_accuracy,
  proj_coordoperation_get_grid_used,
  proj_coordoperation_get_grid_used_count,
  proj_coordoperation_get_method_info,
  proj_coordoperation_get_param,
  proj_coordoperation_get_param_count,
  proj_coordoperation_get_param_index,
  proj_coordoperation_get_towgs84_values,
  proj_coordoperation_has_ballpark_transformation,
  proj_coordoperation_is_instantiable,
  proj_coordoperation_requires_per_coordinate_input_time,
  proj_create,
  proj_create_cartesian_2D_cs,
  proj_create_compound_crs,
  proj_create_conversion,
  proj_create_crs_to_crs,
  proj_create_crs_to_crs_from_pj,
  proj_create_cs,
  proj_create_derived_geographic_crs,
  proj_create_ellipsoidal_2D_cs,
  proj_create_ellipsoidal_3D_cs,
  proj_create_engineering_crs,
  proj_create_from_database,
  proj_create_from_name,
  proj_create_from_wkt,
  proj_create_geocentric_crs,
  proj_create_geocentric_crs_from_datum,
  proj_create_geographic_crs,
  proj_create_geographic_crs_from_datum,
  proj_create_operation_factory_context,
  proj_create_operations,
  proj_create_projected_crs,
  proj_create_transformation,
  proj_create_vertical_crs,
  proj_create_vertical_crs_ex,
  proj_crs_alter_cs_angular_unit,
  proj_crs_alter_cs_linear_unit,
  proj_crs_alter_geodetic_crs,
  proj_crs_alter_parameters_linear_unit,
  proj_crs_create_bound_crs,
  proj_crs_create_bound_crs_to_WGS84,
  proj_crs_create_bound_vertical_crs,
  proj_crs_create_projected_3D_crs_from_2D,
  proj_crs_demote_to_2D,
  proj_crs_get_coordinate_system,
  proj_crs_get_coordoperation,
  proj_crs_get_datum,
  proj_crs_get_datum_ensemble,
  proj_crs_get_datum_forced,
  proj_crs_get_geodetic_crs,
  proj_crs_get_horizontal_datum,
  proj_crs_get_sub_crs,
  proj_crs_has_point_motion_operation,
  proj_crs_info_list_destroy,
  proj_crs_is_derived,
  proj_crs_is_dynamic,
  proj_crs_promote_to_3D,
  proj_cs_get_axis_count,
  proj_cs_get_axis_info,
  proj_cs_get_type,
  proj_datum_ensemble_get_accuracy,
  proj_datum_ensemble_get_member,
  proj_datum_ensemble_get_member_count,
  proj_destroy,
  proj_dynamic_datum_get_frame_reference_epoch,
  proj_ellipsoid_get_parameters,
  proj_errno_reset,
  proj_error_codes,
  proj_get_area_of_use,
  proj_get_area_of_use_ex,
  proj_get_authorities_from_database,
  proj_get_celestial_body_list_from_database,
  proj_get_celestial_body_name,
  proj_get_codes_from_database,
  proj_get_crs_info_list_from_database,
  proj_get_crs_list_parameters_create,
  proj_get_crs_list_parameters_destroy,
  proj_get_domain_count,
  proj_get_ellipsoid,
  proj_get_geoid_models_from_database,
  proj_get_id_auth_name,
  proj_get_id_code,
  proj_get_insert_statements,
  proj_get_name,
  proj_get_non_deprecated,
  proj_get_prime_meridian,
  proj_get_remarks,
  proj_get_scope,
  proj_get_scope_ex,
  proj_get_source_crs,
  proj_get_target_crs,
  proj_get_type,
  proj_get_units_from_database,
  proj_grid_get_info_from_database,
  proj_identify,
  proj_insert_object_session_create,
  proj_insert_object_session_destroy,
  proj_int_list_destroy,
  proj_is_crs,
  proj_is_deprecated,
  proj_is_derived_crs,
  proj_is_equivalent_to,
  proj_is_equivalent_to_with_ctx,
  proj_list_destroy,
  proj_list_get,
  proj_list_get_count,
  proj_log_func,
  proj_log_level,
  proj_normalize_for_visualization,
  proj_operation_factory_context_destroy,
  proj_operation_factory_context_set_allow_ballpark_transformations,
  proj_operation_factory_context_set_allow_use_intermediate_crs,
  proj_operation_factory_context_set_allowed_intermediate_crs,
  proj_operation_factory_context_set_area_of_interest,
  proj_operation_factory_context_set_area_of_interest_name,
  proj_operation_factory_context_set_crs_extent_use,
  proj_operation_factory_context_set_desired_accuracy,
  proj_operation_factory_context_set_discard_superseded,
  proj_operation_factory_context_set_grid_availability_use,
  proj_operation_factory_context_set_spatial_criterion,
  proj_operation_factory_context_set_use_proj_alternative_grid_names,
  proj_prime_meridian_get_parameters,
  proj_query_geodetic_crs_from_datum,
  proj_string_destroy,
  proj_string_list_destroy,
  proj_suggests_code_for,
  proj_trans_array,
  proj_trans_generic,
  proj_type__GT_destroy_fn,
  proj_unit_list_destroy,
  proj_uom_get_info_from_database,
  setCoordArray,
  setCoords,
  set_coord_array,
  set_coords_BANG_,
  should_use_context_dispatch_QMARK_,
  shutdown,
  shutdown_BANG_2 as shutdown_BANG_,
  toggle_graal_BANG_2 as toggle_graal_BANG_,
  transform_batch
};
//# sourceMappingURL=proj.mjs.map
