// Copyright (c) 2026 Will Cohen
//
// Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
// See LICENSE for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception

import * as squint_core from 'squint-cljs/core.js';
import * as string from 'squint-cljs/src/squint/string.js';
import * as clojure_DOT_string from 'squint-cljs/src/squint/string.js';
var c_name__GT_clj_name = function (c_fn_keyword) {
return squint_core.symbol(string.replace(squint_core.name(c_fn_keyword), "_", "-"));

};
var upper_char_QMARK_ = function (ch) {
if (!squint_core._EQ_(ch, string.lower_case(ch))) {
return squint_core._EQ_(ch, string.upper_case(ch))} else {
return false};

};
var lower_char_QMARK_ = function (ch) {
if (!squint_core._EQ_(ch, string.upper_case(ch))) {
return squint_core._EQ_(ch, string.lower_case(ch))} else {
return false};

};
var word_start_QMARK_ = function (s, i) {
const prev_1 = squint_core.subs(s, (i - 1), i);
const nxt_2 = ((((i + 1) < squint_core.count(s))) ? (squint_core.subs(s, (i + 1), (i + 2))) : (null));
if (squint_core.not(upper_char_QMARK_(prev_1))) {
return true} else {
if (!(nxt_2 == null)) {
return lower_char_QMARK_(nxt_2)} else {
return false}};

};
var camel_name__GT_clj_name = function (c_fn_keyword) {
const s_1 = squint_core.name(c_fn_keyword);
const n_2 = squint_core.count(s_1);
let i_3 = 0;
let out_4 = "";
let pending_sep_QMARK__5 = false;
while(true){
if ((i_3 >= n_2)) {
return squint_core.symbol(out_4)} else {
const ch_6 = squint_core.subs(s_1, i_3, (i_3 + 1));
if ((ch_6 === "_")) {
let G__7 = (i_3 + 1);
let G__8 = out_4;
let G__9 = !squint_core._EQ_(out_4, "");
i_3 = G__7;
out_4 = G__8;
pending_sep_QMARK__5 = G__9;
continue;
} else {
const sep_QMARK__10 = ((pending_sep_QMARK__5) ? (pending_sep_QMARK__5) : (((!squint_core._EQ_(out_4, "")) && ((() => {
const and_11_12 = upper_char_QMARK_(ch_6);
if (squint_core.truth_(and_11_12)) {
return word_start_QMARK_(s_1, i_3)} else {
return and_11_12};

})()))));
let G__13 = (i_3 + 1);
let G__14 = `${out_4??''}${((squint_core.truth_(sep_QMARK__10)) ? ("-") : (""))??''}${string.lower_case(ch_6)??''}`;
let G__15 = false;
i_3 = G__13;
out_4 = G__14;
pending_sep_QMARK__5 = G__15;
continue;
};
};
;break;
}
;

};
var fn_def_arg_syms = function (fn_def) {
return squint_core.mapv((function (p__1) {
const vec___1_4 = p__1;
const arg_name_5 = squint_core.nth(vec___1_4, 0, null);
const __6 = squint_core.nth(vec___1_4, 1, null);
return squint_core.symbol(squint_core.name(arg_name_5));

}), squint_core.get(fn_def, "argtypes"));

};
var library_fns_form = function (fndefs, p__2) {
const map___1_3 = p__2;
const map___1_4 = ((squint_core.truth_(squint_core.sequential_QMARK_(map___1_3))) ? (((squint_core.truth_(squint_core.vector_QMARK_(map___1_3))) ? (map___1_3) : (squint_core.seq_to_map_for_destructuring(map___1_3)))) : (map___1_3));
const name_fn_5 = squint_core.get(map___1_4, "name-fn");
const emit_fn_6 = squint_core.get(map___1_4, "emit-fn");
const alias_name_fn_7 = squint_core.get(map___1_4, "alias-name-fn");
const alias_emit_fn_8 = squint_core.get(map___1_4, "alias-emit-fn");
const walk_9 = (function (nf, ef) {
if (squint_core.truth_(((squint_core.truth_(nf)) ? (ef) : (nf)))) {
return squint_core.keep((function (p__3) {
const vec___10_13 = p__3;
const fn_key_14 = squint_core.nth(vec___10_13, 0, null);
const fn_def_15 = squint_core.nth(vec___10_13, 1, null);
const temp__23241__auto___16 = nf(fn_key_14);
if (squint_core.truth_(temp__23241__auto___16)) {
const fn_name_17 = temp__23241__auto___16;
return ef(fn_name_17, fn_key_14, fn_def_15);
};

}), fndefs);
};

});
return squint_core.cons("do", squint_core.concat(walk_9(name_fn_5, emit_fn_6), walk_9(alias_name_fn_7, alias_emit_fn_8)));

};
var underscore__GT_camelCase = function (s) {
const parts_1 = s.split("_");
return squint_core.apply(squint_core.str, squint_core.first(parts_1), squint_core.map((function (_PERCENT_1) {
return `${_PERCENT_1.substring(0, 1).toUpperCase()??''}${_PERCENT_1.substring(1)??''}`;

}), squint_core.rest(parts_1)));

};

export { c_name__GT_clj_name, camel_name__GT_clj_name, fn_def_arg_syms, library_fns_form, underscore__GT_camelCase }
