// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {compileResolvedScale} from '@math.gl/core/color';
import {parseSQLScaleExpression, parseSQLScaleAST} from '@math.gl/sql/parser';
import {parseSQLExpression, parseSQLSelectStatement} from '../src/parser';
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

test('fixed ordinal categories preserve literal types and allow a single explicit color', () => {
  expect(
    parseSQLScaleExpression("SCALE_ORDINAL(label, CATEGORIES('only'), PALETTE('#123456'))").scale
  ).toEqual({
    type: 'ordinal',
    domain: {type: 'fixed', values: ['only']},
    range: {type: 'colors', values: [[0x12 / 255, 0x34 / 255, 0x56 / 255, 1]]}
  });
  expect(
    parseSQLScaleExpression("SCALE_ORDINAL(value, CATEGORIES(-1, +2, '2'), PALETTE('Tableau10'))")
      .scale.domain
  ).toEqual({type: 'fixed', values: [-1, 2, '2']});
  for (const categories of [
    'CATEGORIES()',
    "CATEGORIES('a', 'a')",
    'CATEGORIES(NULL)',
    'CATEGORIES(TRUE)',
    'CATEGORIES(value)'
  ]) {
    expect(() =>
      parseSQLScaleExpression(`SCALE_ORDINAL(value, ${categories}, PALETTE('Tableau10'))`)
    ).toThrow();
  }
});

test('NICE rounds the actual continuous bounds and quantile breaks', () => {
  const continuous = parseSQLScaleExpression(
    "SCALE_COLOR(value, DOMAIN(value), PALETTE('#000000', '#ffffff'), NICE())"
  );
  const quantile = parseSQLScaleExpression("SCALE_QUANTILE(value, 5, PALETTE('viridis'), NICE())");
  expect(continuous.scale.nice).toBe(true);
  expect(compileResolvedScale(continuous.scale, [5.1, 33]).descriptor.domain).toEqual([5, 35]);
  const scale = compileResolvedScale(quantile.scale, [17, 89], [27, 41, 58, 72]);
  expect(scale.descriptor.domain).toEqual([15, 90]);
  expect(scale.descriptor.thresholds).toEqual([30, 40, 60, 70]);
  expect(scale.sample(29)).not.toEqual(scale.sample(30));
  expect(
    compileResolvedScale(quantile.scale, [0, 100], [20, 21, 60, 80]).descriptor.thresholds
  ).toHaveLength(4);
  expect(() =>
    parseSQLScaleExpression("SCALE_COLOR(value, DOMAIN(0, 1, 2), PALETTE('viridis'), NICE())")
  ).toThrow('NICE()');
});

test('NICE rounds reversed sequential bounds without reversing the palette', () => {
  const {scale} = parseSQLScaleExpression(
    "SCALE_COLOR(value, DOMAIN(33, 5.1), PALETTE('#000000', '#ffffff'), NICE())"
  );
  const resolved = compileResolvedScale(scale, [33, 5.1]);
  expect(resolved.descriptor.domain).toEqual([35, 5]);
  expect(resolved.sample(35)).toEqual([0, 0, 0, 1]);
  expect(resolved.sample(5)).toEqual([1, 1, 1, 1]);
});

test('NICE preserves exact decimal grid points and rounds genuinely off-grid values outward', () => {
  const {scale} = parseSQLScaleExpression(
    "SCALE_COLOR(value, DOMAIN(value), PALETTE('viridis'), NICE())"
  );
  const domain = (bounds: readonly [number, number]) =>
    compileResolvedScale(scale, bounds).descriptor.domain;
  expect(domain([0.6, 1.8])).toEqual([0.6, 1.8]);
  expect(domain([-1.8, -0.6])).toEqual([-1.8, -0.6]);
  expect(domain([0.5999999999999999, 1.8000000000000003])).toEqual([0.4, 2]);
  expect(domain([1.8, 0.6])).toEqual([1.8, 0.6]);
});

test('NICE resolved quantile descriptors reconstruct exactly without a second rounding pass', () => {
  const {scale} = parseSQLScaleExpression("SCALE_QUANTILE(value, 5, PALETTE('viridis'), NICE())");
  const resolved = compileResolvedScale(scale, [0.1, 10.7], [2.644, 5.188, 7.096, 8.58]);
  const {descriptor} = resolved;
  expect(descriptor).not.toHaveProperty('nice');
  expect(descriptor.thresholds).toEqual([3, 5, 7, 9]);
  const reloaded = compileResolvedScale(
    {...descriptor, domain: {type: 'fixed', values: descriptor.domain}},
    descriptor.domain,
    descriptor.thresholds
  );
  expect(reloaded.descriptor).toEqual(descriptor);
  expect([0, 3, 5, 7, 9, 11].map(reloaded.sample)).toEqual(
    [0, 3, 5, 7, 9, 11].map(resolved.sample)
  );
});
