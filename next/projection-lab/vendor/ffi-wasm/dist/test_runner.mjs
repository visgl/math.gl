// Copyright (c) 2026 Will Cohen
//
// Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
// See LICENSE for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception

import * as squint_core from 'squint-cljs/core.js';
import * as cljs_test from 'squint-cljs/src/squint/test.js';
import * as cljs_DOT_test from 'squint-cljs/src/squint/test.js';
var run_tests_and_exit_BANG_ = /* @__PURE__ */ (() => {
const impl3_1 = (function (args) {
process.once("beforeExit", (function (_) {
console.error("clj-native test-runner: the event loop drained before the tests ended; exiting 1");
return process.exit(1);

}));
const first_arg_2 = squint_core.first(args);
const teardown_3 = ((squint_core.truth_(squint_core.fn_QMARK_(first_arg_2))) ? (first_arg_2) : (null));
const ns_names_4 = ((squint_core.truth_(teardown_3)) ? (squint_core.rest(args)) : (args));
return Promise.resolve(squint_core.apply(cljs_test.run_tests, ns_names_4)).then((function (results) {
const fail_5 = (() => {
const or_6_7 = squint_core.get(results, "fail");
if (squint_core.truth_(or_6_7)) {
return or_6_7} else {
return 0};

})();
const err_8 = (() => {
const or_9_10 = squint_core.get(results, "error");
if (squint_core.truth_(or_9_10)) {
return or_9_10} else {
return 0};

})();
const exit_code_11 = ((((fail_5 + err_8) > 0)) ? (1) : (0));
return Promise.resolve(((squint_core.truth_(teardown_3)) ? (teardown_3()) : (null))).then((function (_) {
return process.exit(exit_code_11);

}));

})).catch((function (e) {
console.error("clj-native test-runner: test run or teardown rejected; exiting 1:", e);
return process.exit(1);

}));

});
const f1 = (function (...rest2) {
const self__23348__auto___12 = this;
return impl3_1.call(self__23348__auto___12, (((rest2.length === 0)) ? (null) : (rest2)));

});
(f1["squint$lang$variadic"] = impl3_1);
return f1;

})();

export { run_tests_and_exit_BANG_ }
