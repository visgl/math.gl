import * as squint_core from 'squint-cljs/core.js';
import * as string from 'squint-cljs/src/squint/string.js';
import * as clojure_DOT_string from 'squint-cljs/src/squint/string.js';
var _STAR_resource_context_STAR_ = ({val: squint_core.atom(squint_core.list())});
var _STAR_bound_resource_context_QMARK__STAR_ = ({val: false});
var _STAR_resource_debug_double_free_STAR_ = ({val: null});
var set_debug_double_free_BANG_ = function (enabled_QMARK_) {
return _STAR_resource_debug_double_free_STAR_.val = enabled_QMARK_;

};
var stack_do_release = function (item) {
if (squint_core.truth_(item)) {
return (() => {
try{
if (squint_core.truth_(squint_core.fn_QMARK_(item))) {
return item()} else {
if (squint_core.truth_(squint_core.fn_QMARK_(item[Symbol.dispose]))) {
return item[Symbol.dispose].call(item)} else {
if (squint_core.truth_(squint_core.fn_QMARK_(item[Symbol.asyncDispose]))) {
return item[Symbol.asyncDispose].call(item)} else {
if (squint_core.truth_(squint_core.fn_QMARK_(item.close))) {
return item.close()} else {
if ("else") {
throw (new Error(`${"item is not a function or disposable: "}${squint_core.type(item)??''}`))} else {
return null}}}}};
}
catch(e1){
return console.warn(string.join(" ", [e1, "Failed to release", item]));
}

})();
};

};
var stack_track = /* @__PURE__ */ (() => {
const impl41 = (function (item, dispose_fn) {
if (squint_core.truth_((() => {
const and__23608__auto__2 = _STAR_resource_debug_double_free_STAR_.val;
if (squint_core.truth_(and__23608__auto__2)) {
return squint_core.some((function (_PERCENT_1) {
return (item === squint_core.first(_PERCENT_1));

}), squint_core.deref(_STAR_resource_context_STAR_.val))} else {
return and__23608__auto__2};

})())) {
throw squint_core.ex_info("Duplicate track detected; this will result in a double free", ({"item": item}))};
if (squint_core.truth_(_STAR_bound_resource_context_QMARK__STAR_.val)) {
} else {
console.log("Stack resource tracking used but no resource context bound.\nThis is probably a memory leak.")};
squint_core.swap_BANG_(_STAR_resource_context_STAR_.val, squint_core.conj, [item, dispose_fn]);
return item;

});
const impl53 = (function (item) {
return stack_track(item, item);

});
const f1 = (function (...args2) {
const self64 = this;
const G__75 = args2.length;
switch (G__75) {case 2:
return impl41.call(self64, args2[0], args2[1]);

break;
case 1:
return impl53.call(self64, args2[0]);

break;
default:
throw (new Error(`${"Invalid arity: "}${args2.length??''}`))};

});
return f1;

})();
var stack_ignore_resources = function (pred) {
let resources1 = squint_core.deref(_STAR_resource_context_STAR_.val);
while(true){
const retval2 = squint_core.filter(squint_core.comp(pred, squint_core.first), resources1);
const leftover3 = squint_core.apply(squint_core.list, squint_core.remove(squint_core.comp(pred, squint_core.first), resources1));
if (squint_core.not(squint_core.compare_and_set_BANG_(_STAR_resource_context_STAR_.val, resources1, leftover3))) {
let G__4 = squint_core.deref(_STAR_resource_context_STAR_.val);
resources1 = G__4;
continue;
} else {
return retval2};
;break;
}
;

};
var stack_ignore = function (item) {
stack_ignore_resources((function (_PERCENT_1) {
return (item === _PERCENT_1);

}));
return item;

};
var stack_release = function (item) {
if (squint_core.truth_(item)) {
return squint_core.reduce((function (_, entry) {
return stack_do_release(squint_core.second(entry));

}), null, stack_ignore_resources((function (_PERCENT_1) {
return (item === _PERCENT_1);

})));
};

};
var stack_release_resource_seq = /* @__PURE__ */ (() => {
const impl111 = (function (res_ctx, p__12) {
const map__23 = p__12;
const pred4 = squint_core.get(map__23, "pred", squint_core.identity);
return squint_core.reduce((function (_, p__13) {
const vec__58 = p__13;
const _9 = squint_core.nth(vec__58, 0, null);
const dispose_fn10 = squint_core.nth(vec__58, 1, null);
return stack_do_release(dispose_fn10);

}), null, squint_core.filter(squint_core.comp(pred4, squint_core.first), res_ctx));

});
const f8 = (function (arg9, ...rest10) {
const self__23286__auto__11 = this;
return impl111.call(self__23286__auto__11, arg9, (((rest10.length === 0)) ? (null) : (rest10)));

});
(f8["squint$lang$variadic"] = impl111);
return f8;

})();
var stack_release_current_resources = /* @__PURE__ */ (() => {
const impl171 = (function (pred) {
const leftover2 = stack_ignore_resources(pred);
return stack_release_resource_seq(leftover2);

});
const impl183 = (function () {
return stack_release_current_resources(squint_core.constantly(true));

});
const f14 = (function (...args15) {
const self194 = this;
const G__205 = args15.length;
switch (G__205) {case 1:
return impl171.call(self194, args15[0]);

break;
case 0:
return impl183.call(self194);

break;
default:
throw (new Error(`${"Invalid arity: "}${args15.length??''}`))};

});
return f14;

})();
var close_context = function (ctx) {
if (squint_core.truth_(ctx.closed)) {
return null} else {
ctx.closed = true;
stack_release_resource_seq(squint_core.deref(ctx.entries));
return squint_core.reset_BANG_(ctx.entries, squint_core.list());
};

};
var make_closeable_context = function (body_fn) {
const old_ctx1 = _STAR_resource_context_STAR_.val;
const old_bound_QMARK_2 = _STAR_bound_resource_context_QMARK__STAR_.val;
const fresh_atom3 = squint_core.atom(squint_core.list());
const restore_BANG_4 = (function () {
_STAR_resource_context_STAR_.val = old_ctx1;
return _STAR_bound_resource_context_QMARK__STAR_.val = old_bound_QMARK_2;

});
const build_ctx5 = (function (value) {
const ctx6 = squint_core.js_obj();
ctx6.value = value;
ctx6.entries = fresh_atom3;
ctx6.closed = false;
ctx6.close = (function () {
return close_context(ctx6);

});
(ctx6[Symbol.dispose] = (function () {
return close_context(ctx6);

}));
return ctx6;

});
_STAR_resource_context_STAR_.val = fresh_atom3;
_STAR_bound_resource_context_QMARK__STAR_.val = true;
const value7 = (() => {
try{
return body_fn();
}
catch(e8){
stack_release_current_resources();
restore_BANG_4();
throw e8;
}

})();
if (squint_core.truth_((() => {
const c__23538__auto__9 = Promise;
const x__23539__auto__10 = value7;
const ret__23540__auto__11 = (x__23539__auto__10 instanceof c__23538__auto__9);
return ret__23540__auto__11;

})())) {
return value7.then((function (resolved) {
restore_BANG_4();
return build_ctx5(resolved);

}), (function (e) {
stack_release_current_resources();
restore_BANG_4();
throw e;

}))} else {
restore_BANG_4();
return build_ctx5(value7);
};

};
var bind_and_execute = function (ctx, body_fn) {
if (squint_core.truth_(ctx.closed)) {
throw squint_core.ex_info("Cannot bind: closeable context is closed", ({"ctx": ctx}))};
const old_ctx1 = _STAR_resource_context_STAR_.val;
const old_bound_QMARK_2 = _STAR_bound_resource_context_QMARK__STAR_.val;
_STAR_resource_context_STAR_.val = ctx.entries;
_STAR_bound_resource_context_QMARK__STAR_.val = true;
return (() => {
try{
return body_fn();
}
finally{
_STAR_resource_context_STAR_.val = old_ctx1;
_STAR_bound_resource_context_QMARK__STAR_.val = old_bound_QMARK_2}

})();

};
var gc_finalization_registry = (new FinalizationRegistry(stack_do_release));
var gc_track_gc_only = function (item, dispose_fn) {
gc_finalization_registry.register(item, dispose_fn);
return item;

};
var gc_track = function (item, dispose_fn) {
const token1 = ({});
const fired_QMARK_2 = squint_core.atom(false);
const wrapped3 = (function () {
if (squint_core.truth_(squint_core.compare_and_set_BANG_(fired_QMARK_2, false, true))) {
gc_finalization_registry.unregister(token1);
return dispose_fn();
};

});
gc_finalization_registry.register(item, wrapped3, token1);
stack_track(wrapped3, wrapped3);
return item;

};
var track_impl = function (item, dispose_fn, track_type) {
const G__211 = track_type;
switch (G__211) {case "gc":
return gc_track_gc_only(item, dispose_fn);

break;
case "stack":
return stack_track(item, dispose_fn);

break;
case "gc_and_stack":
return gc_track(item, dispose_fn);

break;
default:
throw (new Error(`${"No matching clause: "}${G__211??''}`))};

};
var in_stack_resource_context_QMARK_ = function () {
return _STAR_bound_resource_context_QMARK__STAR_.val;

};
var normalize_track_type = function (track_type) {
const track_type1 = (() => {
const or__23576__auto__2 = track_type;
if (squint_core.truth_(or__23576__auto__2)) {
return or__23576__auto__2} else {
return "auto"};

})();
if ((track_type1 === "auto")) {
if (squint_core.truth_(in_stack_resource_context_QMARK_())) {
return "stack"} else {
return "gc"}} else {
if (squint_core.truth_(squint_core.string_QMARK_(track_type1))) {
return track_type1} else {
if (squint_core.truth_((() => {
const or__23576__auto__3 = squint_core.array_QMARK_(track_type1);
if (squint_core.truth_(or__23576__auto__3)) {
return or__23576__auto__3} else {
const c__23538__auto__4 = Set;
const x__23539__auto__5 = track_type1;
const ret__23540__auto__6 = (x__23539__auto__5 instanceof c__23538__auto__4);
return ret__23540__auto__6;
};

})())) {
const s7 = (new Set(track_type1));
if (squint_core.truth_((() => {
const and__23608__auto__8 = s7.has("gc");
if (squint_core.truth_(and__23608__auto__8)) {
return s7.has("stack")} else {
return and__23608__auto__8};

})())) {
return "gc_and_stack"} else {
if (squint_core.truth_(s7.has("gc"))) {
return "gc"} else {
if (squint_core.truth_(s7.has("stack"))) {
return "stack"} else {
if ("else") {
return track_type1} else {
return null}}}};
} else {
if ("else") {
return track_type1} else {
return null}}}};

};
var track = /* @__PURE__ */ (() => {
const impl251 = (function (item, keymap) {
const keymap2 = (() => {
const or__23576__auto__3 = keymap;
if (squint_core.truth_(or__23576__auto__3)) {
return or__23576__auto__3} else {
return ({})};

})();
const track_type4 = keymap2.tracktype;
const dispose_fn5 = keymap2.disposefn;
const track_type6 = normalize_track_type(track_type4);
if (squint_core.truth_((() => {
const and__23608__auto__8 = (() => {
const or__23576__auto__7 = (track_type6 === "gc");
if (or__23576__auto__7) {
return or__23576__auto__7} else {
return (track_type6 === "gc_and_stack")};

})();
if (squint_core.truth_(and__23608__auto__8)) {
return squint_core.not(dispose_fn5)} else {
return and__23608__auto__8};

})())) {
throw squint_core.ex_info("gc track types must have a dispose function that does *not*\nreference item.", ({"item": item, "track-type": track_type6}))};
const dispose_fn9 = (() => {
const or__23576__auto__10 = dispose_fn5;
if (squint_core.truth_(or__23576__auto__10)) {
return or__23576__auto__10} else {
return item};

})();
if (squint_core.truth_(squint_core.fn_QMARK_(dispose_fn9))) {
} else {
throw squint_core.ex_info("The dispose method must be a clojurescript function.", ({"dispose-fn": dispose_fn9}))};
return track_impl(item, dispose_fn9, track_type6);

});
const impl2611 = (function (item) {
return track(item, null);

});
const f22 = (function (...args23) {
const self2712 = this;
const G__2813 = args23.length;
switch (G__2813) {case 2:
return impl251.call(self2712, args23[0], args23[1]);

break;
case 1:
return impl2611.call(self2712, args23[0]);

break;
default:
throw (new Error(`${"Invalid arity: "}${args23.length??''}`))};

});
return f22;

})();
var releasing_fn = function (body_fn) {
const old_ctx1 = _STAR_resource_context_STAR_.val;
const old_bound_QMARK_2 = _STAR_bound_resource_context_QMARK__STAR_.val;
_STAR_resource_context_STAR_.val = squint_core.atom(squint_core.list());
_STAR_bound_resource_context_QMARK__STAR_.val = true;
return (() => {
try{
return body_fn();
}
finally{
stack_release_current_resources();
_STAR_resource_context_STAR_.val = old_ctx1;
_STAR_bound_resource_context_QMARK__STAR_.val = old_bound_QMARK_2}

})();

};
var chain_resources = function (new_resource, old_resource) {
return gc_track_gc_only(new_resource, squint_core.constantly(old_resource));

};

export { _STAR_resource_context_STAR_, track, stack_do_release, in_stack_resource_context_QMARK_, track_impl, set_debug_double_free_BANG_, stack_ignore, bind_and_execute, close_context, gc_track, chain_resources, stack_release_current_resources, _STAR_bound_resource_context_QMARK__STAR_, stack_release, normalize_track_type, stack_ignore_resources, gc_track_gc_only, stack_release_resource_seq, _STAR_resource_debug_double_free_STAR_, make_closeable_context, releasing_fn, stack_track, gc_finalization_registry }
