// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {
  ExpressionFunctionRegistry,
  compile,
  compileAsync,
  eval as evaluate,
  parse
} from '@math.gl/expressions';

test('@math.gl/expressions#ExpressionFunctionRegistry', t => {
  const registry = new ExpressionFunctionRegistry()
    .registerFunction('double', (value: number) => value * 2)
    .registerFunctions({
      add: (left: number, right: number) => left + right
    });

  const fn = compile('double(add(value, offset))', {registry});
  t.equal(fn({value: 3, offset: 2}), 10, 'calls functions with evaluated arguments');
  t.ok(registry.hasFunction('double'), 'reports registered functions');
  t.equal(registry.getFunction('double')?.(4), 8, 'returns registered functions');
  t.ok(registry.unregisterFunction('double'), 'unregisters existing functions');
  t.notOk(registry.unregisterFunction('missing'), 'reports missing functions');
  t.end();
});

test('@math.gl/expressions#ExpressionFunctionRegistry collisions', t => {
  const registry = new ExpressionFunctionRegistry([{transform: (value: number) => value + 1}]);

  t.throws(
    () => registry.registerFunction('transform', (value: number) => value * 2),
    /already registered/,
    'rejects duplicate names'
  );

  registry.registerFunction('transform', (value: number) => value * 2, {replace: true});
  t.equal(
    compile('transform(value)', {registry})({value: 3}),
    6,
    'replaces registrations explicitly'
  );
  t.throws(
    () => registry.registerFunction('not-valid!', () => 1),
    /Invalid expression function name/,
    'rejects names that cannot be called as identifiers'
  );
  t.throws(
    () => registry.registerFunctions({constructor: () => 1}),
    /Invalid expression function name/,
    'rejects unsafe property names'
  );
  t.end();
});

test('@math.gl/expressions#ExpressionFunctionRegistry precedence and isolation', t => {
  const first = new ExpressionFunctionRegistry([{valueOf: () => 1}]);
  const second = new ExpressionFunctionRegistry([{valueOf: () => 2}]);

  t.equal(evaluate(parse('valueOf()'), {}, {registry: first}), 1, 'uses the selected registry');
  t.equal(evaluate(parse('valueOf()'), {}, {registry: second}), 2, 'isolates registries');
  t.equal(
    evaluate(parse('valueOf()'), {valueOf: () => 3}, {registry: first}),
    3,
    'context functions take precedence'
  );
  t.equal(
    evaluate(parse('valueOf()'), {}, {registry: first, libraries: [{valueOf: () => 4}]}),
    4,
    'per-evaluator libraries take precedence'
  );
  t.ok(Object.isFrozen(first.getFunctionTable()), 'returns a frozen function table snapshot');
  t.end();
});

test('@math.gl/expressions#ExpressionFunctionRegistry async', async t => {
  const registry = new ExpressionFunctionRegistry().registerFunction(
    'load',
    async (value: number) => await Promise.resolve(value * 2)
  );
  const fn = compileAsync('load(value) + 1', {registry});
  t.equal(await fn({value: 4}), 9, 'awaits registered functions');
  t.end();
});
