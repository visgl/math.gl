// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  prepareSQLParameters,
  areSQLParametersEqual,
  getSQLParameterNames,
  parseSQLExpression
} from '../src/parser';

test('snapshots detect mutations and compare query-specific dependencies', () => {
  const colors = [1, 2];
  const previous = prepareSQLParameters({colors, minimum: 2});
  expect(prepareSQLParameters({minimum: 2, colors: [1, 2]}, {previous})).toBe(previous);
  colors[0] = 3;
  const next = prepareSQLParameters({colors, minimum: 2}, {previous});
  expect(areSQLParametersEqual(previous, next)).toBe(false);
  expect(areSQLParametersEqual(previous, next, {names: ['minimum']})).toBe(true);
  expect(areSQLParametersEqual(previous, next, {names: ['colors']})).toBe(false);
  expect(parseSQLExpression(':colors', {parameters: previous})).toMatchObject({
    elements: [{value: 1}, {value: 2}]
  });
  const ast = parseSQLExpression(':colors', {parameters: previous}) as any;
  ast.elements[0].value = 100;
  expect(parseSQLExpression(':colors', {parameters: previous})).toMatchObject({
    elements: [{value: 1}, {value: 2}]
  });
});

test('binary snapshots compare contents and preserve physical types', () => {
  const a = prepareSQLParameters({
    x: new Float32Array([1]),
    text: {type: 'utf8', value: new Uint8Array([65])}
  });
  const b = prepareSQLParameters({
    x: new Float32Array([1]),
    text: {type: 'utf8', value: new Uint8Array([65])}
  });
  expect(areSQLParametersEqual(a, b)).toBe(true);
  expect(areSQLParametersEqual(a, prepareSQLParameters({x: new Float64Array([1])}))).toBe(false);
  expect(() => parseSQLExpression(':missing', {parameters: a})).toThrow('requires a value');
});

test('dependency discovery ignores quotes, comments and casts', () => {
  expect(
    getSQLParameterNames(`SELECT :x::FLOAT32, ':ignored', ":quoted", :x, :colors -- :comment
  /* :hidden */ WHERE y = :minimum`)
  ).toEqual(['x', 'colors', 'minimum']);
});
