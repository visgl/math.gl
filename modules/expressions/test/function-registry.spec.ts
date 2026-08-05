// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {
  ExpressionFunctionRegistry,
  compile,
  compileAsync,
  eval as evaluate,
  parse
} from '@math.gl/expressions';

test('@math.gl/expressions#ExpressionFunctionRegistry', () => {
  const registry = new ExpressionFunctionRegistry()
    .registerFunction('double', (value: number) => value * 2)
    .registerFunctions({
      add: (left: number, right: number) => left + right
    });

  const fn = compile('double(add(value, offset))', {registry});
  expect(fn({value: 3, offset: 2}), 'calls functions with evaluated arguments').toBe(10);
  expect(registry.hasFunction('double'), 'reports registered functions').toBeTruthy();
  expect(registry.getFunction('double')?.(4), 'returns registered functions').toBe(8);
  expect(registry.unregisterFunction('double'), 'unregisters existing functions').toBeTruthy();
  expect(registry.unregisterFunction('missing'), 'reports missing functions').toBeFalsy();
});

test('@math.gl/expressions#ExpressionFunctionRegistry collisions', () => {
  const registry = new ExpressionFunctionRegistry([{transform: (value: number) => value + 1}]);

  expect(
    () => registry.registerFunction('transform', (value: number) => value * 2),
    'rejects duplicate names'
  ).toThrow(/already registered/);

  registry.registerFunction('transform', (value: number) => value * 2, {replace: true});
  expect(
    compile('transform(value)', {registry})({value: 3}),
    'replaces registrations explicitly'
  ).toBe(6);
  expect(
    () => registry.registerFunction('not-valid!', () => 1),
    'rejects names that cannot be called as identifiers'
  ).toThrow(/Invalid expression function name/);
  expect(
    () => registry.registerFunctions({constructor: () => 1}),
    'rejects unsafe property names'
  ).toThrow(/Invalid expression function name/);
});

test('@math.gl/expressions#ExpressionFunctionRegistry precedence and isolation', () => {
  const first = new ExpressionFunctionRegistry([{valueOf: () => 1}]);
  const second = new ExpressionFunctionRegistry([{valueOf: () => 2}]);

  expect(evaluate(parse('valueOf()'), {}, {registry: first}), 'uses the selected registry').toBe(1);
  expect(evaluate(parse('valueOf()'), {}, {registry: second}), 'isolates registries').toBe(2);
  expect(
    evaluate(parse('valueOf()'), {valueOf: () => 3}, {registry: first}),
    'context functions take precedence'
  ).toBe(3);
  expect(
    evaluate(parse('valueOf()'), {}, {registry: first, libraries: [{valueOf: () => 4}]}),
    'per-evaluator libraries take precedence'
  ).toBe(4);
  expect(
    Object.isFrozen(first.getFunctionTable()),
    'returns a frozen function table snapshot'
  ).toBeTruthy();
});

test('@math.gl/expressions#ExpressionFunctionRegistry async', async () => {
  const registry = new ExpressionFunctionRegistry().registerFunction(
    'load',
    async (value: number) => await Promise.resolve(value * 2)
  );
  const fn = compileAsync('load(value) + 1', {registry});
  expect(await fn({value: 4}), 'awaits registered functions').toBe(9);
});
