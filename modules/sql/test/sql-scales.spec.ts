// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {parseSQLScaleExpression, parseSQLScaleAST} from '../src/scales';
import {parseSQLExpression, parseSQLSelectStatement} from '../src/sql';
import type {Expression} from '../src/expressions';

test('SQL sequential scale preserves value AST and declares data-derived domain', () => {
  const {value, scale} = parseSQLScaleExpression(
    "SCALE_COLOR(temperature, DOMAIN_QUANTILE(temperature, 0.02, 0.98), PALETTE('viridis'))"
  );
  expect(value).toMatchObject({type: 'Identifier', name: 'temperature'});
  expect(scale).toEqual({
    type: 'sequential',
    domain: {type: 'percentile', column: 'temperature', lower: 0.02, upper: 0.98},
    range: {type: 'palette', name: 'viridis'}
  });
});

test('SQL numeric scales have explicit ranges, data-derived or fixed domains', () => {
  expect(
    parseSQLScaleExpression('SCALE_SQRT(population, DOMAIN(population), RANGE(2, 20))').scale
  ).toEqual({
    type: 'sqrt',
    domain: {type: 'extent', column: 'population'},
    range: {type: 'numeric', values: [2, 20]}
  });
  expect(
    parseSQLScaleExpression('SCALE_LINEAR(value, DOMAIN(-20, 50), RANGE(0, 1))').scale.domain
  ).toEqual({type: 'fixed', values: [-20, 50]});
  expect(
    parseSQLScaleExpression('SCALE_LINEAR(value, DOMAIN_ZERO(value), RANGE(0, 100))').scale.domain
  ).toEqual({type: 'extent', column: 'value', includeZero: true});
});

test('SQL diverging color scales preserve symmetric pivot', () => {
  const {scale} = parseSQLScaleExpression(
    "scale_diverging(delta, domain_symmetric(delta, 0), palette('RdBu'))"
  );
  expect(scale.type).toBe('diverging');
  expect(scale.domain).toEqual({type: 'symmetric', column: 'delta', pivot: 0});
});

test('SQL ordinal and quantile schemes create explicit categorical/class requirements', () => {
  expect(parseSQLScaleExpression("SCALE_ORDINAL(category, PALETTE('Tableau10'))").scale).toEqual({
    type: 'ordinal',
    domain: {type: 'categories', column: 'category'},
    range: {type: 'palette', name: 'Tableau10'}
  });
  expect(parseSQLScaleExpression("SCALE_QUANTILE(income, 5, PALETTE('Blues'))").scale).toEqual({
    type: 'quantile',
    domain: {type: 'extent', column: 'income'},
    range: {type: 'palette', name: 'Blues', count: 5}
  });
});

test('explicit CSS-like hex stops normalize to RGB(A) color tuples', () => {
  const {scale} = parseSQLScaleExpression(
    "SCALE_COLOR(v, DOMAIN(0, 100), PALETTE('#000000', '#FF8000'))"
  );
  expect(scale.range).toEqual({
    type: 'colors',
    values: [
      [0, 0, 0, 1],
      [1, 128 / 255, 0, 1]
    ]
  });
});

test('SQL scale parser rejects row-changing statements, invalid arguments and mismatched stops', () => {
  expect(() =>
    parseSQLScaleExpression("SELECT SCALE_COLOR(v, DOMAIN(v), PALETTE('viridis'))")
  ).toThrow();
  expect(() => parseSQLScaleExpression('SCALE_COLOR(v, DOMAIN(v), RANGE(0, 1))')).toThrow(
    'color range'
  );
  expect(() => parseSQLScaleExpression("SCALE_LINEAR(v, DOMAIN(v), PALETTE('viridis'))")).toThrow(
    'numeric RANGE'
  );
  expect(() => parseSQLScaleExpression("SCALE_QUANTILE(v, 1, PALETTE('viridis'))")).toThrow(
    'class count'
  );
  expect(() =>
    parseSQLScaleExpression("SCALE_COLOR(v, DOMAIN(0, 50, 100), PALETTE('#000000', '#FFFFFF'))")
  ).toThrow('equal lengths');
});

test('AST scale parsing reuses SELECT projection nodes without mutation', () => {
  const statement = parseSQLSelectStatement(
    "SELECT SCALE_COLOR(temperature * 2, DOMAIN(0, 100), PALETTE('viridis')) AS color FROM observations"
  );
  const expression = statement.select![0]!.expression;
  const snapshot = JSON.stringify(expression);
  const parsed = parseSQLScaleAST(expression);
  expect(parsed).toEqual(
    parseSQLScaleExpression("SCALE_COLOR(temperature * 2, DOMAIN(0, 100), PALETTE('viridis'))")
  );
  expect(parsed.value).toBe(
    (expression as Extract<Expression, {type: 'CallExpression'}>).arguments[0]
  );
  expect(JSON.stringify(expression)).toBe(snapshot);
});

test.each([
  'SCALE_LINEAR(v, DOMAIN(-20, 50), RANGE(0, 1))',
  'SCALE_SQRT(v, DOMAIN_ZERO(v), RANGE(0, 1))',
  'SCALE_LOG(v, DOMAIN(1, 100), RANGE(0, 1))',
  "SCALE_DIVERGING(v, DOMAIN_SYMMETRIC(v, 0), PALETTE('RdBu'))",
  "SCALE_ORDINAL(v, PALETTE('Tableau10'))",
  "SCALE_QUANTILE(v, 5, PALETTE('Blues'))",
  "SCALE_QUANTIZE(v, 5, PALETTE('Blues'))"
])('AST and text scale entry points agree: %s', sql => {
  expect(parseSQLScaleAST(parseSQLExpression(sql))).toEqual(parseSQLScaleExpression(sql));
});

test.each(['v + 1', 'UNKNOWN(v)', 'SCALE_LINEAR(v)', 'SCALE_COLOR(v, DOMAIN(v), RANGE(0, 1))'])(
  'AST scale entry rejects invalid scale semantics: %s',
  sql => {
    expect(() => parseSQLScaleAST(parseSQLExpression(sql))).toThrow();
  }
);

test('SQL thresholds take explicit increasing breaks and one extra palette color', () => {
  expect(
    parseSQLScaleExpression("SCALE_THRESHOLD(risk, ARRAY[-1, 5, 20], PALETTE('YlOrRd'))").scale
  ).toEqual({
    type: 'threshold',
    domain: {type: 'fixed', values: [-1, 5, 20]},
    range: {type: 'palette', name: 'YlOrRd', count: 4}
  });
  expect(
    parseSQLScaleExpression("SCALE_THRESHOLD(risk, ARRAY[5], PALETTE('#ffffff', '#000000'))").scale
      .domain
  ).toEqual({type: 'fixed', values: [5]});
  expect(() =>
    parseSQLScaleExpression("SCALE_THRESHOLD(risk, ARRAY[5, 5], PALETTE('YlOrRd'))")
  ).toThrow('strictly increasing');
  expect(() =>
    parseSQLScaleExpression("SCALE_THRESHOLD(risk, ARRAY[5], PALETTE('YlOrRd', 3))")
  ).toThrow('one more color');
});
