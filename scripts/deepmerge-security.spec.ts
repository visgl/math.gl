// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {test} from 'vitest';

const require = createRequire(pathToFileURL(resolve('package.json')));
const toolingRequire = createRequire(require.resolve('@vis.gl/dev-tools'));
const entry = toolingRequire.resolve('deepmerge');
const entries = {commonjs: entry, umd: resolve(dirname(entry), 'umd.js')};

for (const [name, path] of Object.entries(entries)) {
  const merge = toolingRequire(path);
  test(`${name}: target __proto__ stays an own data property`, () => {
    const input = JSON.parse('{"__proto__":{"securityProbe":true},"nested":{"value":1}}');
    const result = merge(input, {nested: {other: 2}});
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.equal(result.securityProbe, undefined);
    assert.equal(Object.hasOwn(result, '__proto__'), true);
    assert.deepEqual(result.__proto__, {securityProbe: true});
    assert.deepEqual(result.nested, {value: 1, other: 2});
    assert.equal(Object.getPrototypeOf(input), Object.prototype);
  });
  test(`${name}: null-prototype target does not permit source prototype poisoning`, () => {
    const source = JSON.parse('{"__proto__":{"securityProbe":true}}');
    const result = merge(Object.create(null), source);
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.equal(result.securityProbe, undefined);
    assert.equal(Object.hasOwn(result, '__proto__'), true);
    assert.deepEqual(result.__proto__, {securityProbe: true});
  });
  test(`${name}: nested and array clones keep ordinary prototypes`, () => {
    const value = JSON.parse('{"__proto__":{"securityProbe":true},"keep":1}');
    const result = merge({nested: value, values: [value]}, {});
    for (const clone of [result.nested, result.values[0]]) {
      assert.equal(Object.getPrototypeOf(clone), Object.prototype);
      assert.equal(clone.securityProbe, undefined);
      assert.equal(clone.keep, 1);
      assert.notEqual(clone, value);
    }
  });
  test(`${name}: configuration merges preserve symbols and custom array behavior`, () => {
    const symbol = Symbol('configuration');
    const left = {nested: {one: 1}, values: [1], [symbol]: {left: 1}};
    const right = {nested: {two: 2}, values: [2], [symbol]: {right: 2}};
    const result = merge(left, right, {arrayMerge: (_target: unknown[], source: unknown[]) => source.slice()});
    assert.deepEqual(result, {nested: {one: 1, two: 2}, values: [2], [symbol]: {left: 1, right: 2}});
    assert.deepEqual(left.values, [1]);
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
  });
}
