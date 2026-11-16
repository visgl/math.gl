// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {parseSQLScaleExpression} from '../src/scales';
import {compileResolvedScale, resolvePalette} from '../src/scales';
import {compileArrowScale, compileArrowScales} from '@math.gl/sql/arrow-scales';
import {resolveArrowDomains, resolveArrowQuantiles} from '../src/scales/arrow-domains';

test('shared Arrow extents, symmetric and percentile domains', () => {
  const table = tableFromArrays({value: [-10, 0, 20, null], label: ['B', 'A', 'B', 'C']});
  expect(
    resolveArrowDomains(table, [
      {type: 'extent', column: 'value'},
      {type: 'symmetric', column: 'value', pivot: 0},
      {type: 'percentile', column: 'value', lower: 0.25, upper: 0.75},
      {type: 'categories', column: 'label'}
    ])
  ).toEqual([
    [-10, 20],
    [-20, 20],
    [-5, 10],
    ['A', 'B', 'C']
  ]);
});

test('numeric Arrow scale preserves rows and exposes resolved numeric domain', () => {
  const table = tableFromArrays({population: [0, 25, 100, null]});
  const compiled = compileArrowScale(
    table,
    parseSQLScaleExpression('SCALE_SQRT(population, DOMAIN(population), RANGE(2, 20))')
  );
  expect(compiled.scale.descriptor.domain).toEqual([0, 100]);
  expect(compiled.evaluate(table).toArray()[2]).toBeCloseTo(20);
  expect(compiled.evaluate(table).get(3)).toBeNull();
});

test('continuous color scale and legend sample agree', () => {
  const table = tableFromArrays({value: [0, 50, 100]});
  const compiled = compileArrowScale(
    table,
    parseSQLScaleExpression("SCALE_COLOR(value, DOMAIN(value), PALETTE('viridis'))")
  );
  const middle = compiled.scale.sample(50) as readonly number[];
  const vector = compiled.evaluate(table);
  const channels = vector.get(1)!.toArray() as Uint8Array;
  expect(Array.from(channels)).toEqual(middle.map(x => Math.round(x * 255)));
  expect(compiled.scale.descriptor.palette).toBe('viridis');
});

test('quantile class breaks are explicit and stable', () => {
  const table = tableFromArrays({v: [0, 10, 20, 30, 40]});
  expect(resolveArrowQuantiles(table, 'v', 5)).toEqual([8, 16, 24, 32]);
  const result = compileArrowScale(
    table,
    parseSQLScaleExpression("SCALE_QUANTILE(v, 5, PALETTE('Blues'))")
  );
  expect(result.scale.descriptor.thresholds).toEqual([8, 16, 24, 32]);
  expect(result.evaluate(table).length).toBe(5);
});

test('shared domain planner returns separate compiled attribute scales', () => {
  const table = tableFromArrays({value: [1, 4, 9]});
  const result = compileArrowScales(table, {
    radius: parseSQLScaleExpression('SCALE_SQRT(value, DOMAIN(value), RANGE(2, 20))'),
    fill: parseSQLScaleExpression("SCALE_COLOR(value, DOMAIN(value), PALETTE('viridis'))")
  });
  expect(result.radius.scale.descriptor.domain).toEqual(result.fill.scale.descriptor.domain);
  expect(result.radius.evaluate(table).length).toBe(3);
  expect(result.fill.evaluate(table).length).toBe(3);
});

test('HDR explicit stops are not clamped by sampling', () => {
  const scale = compileResolvedScale(
    {
      type: 'sequential',
      domain: {type: 'fixed', values: [0, 1]},
      range: {
        type: 'colors',
        values: [
          [0, 0, 0, 1],
          [4, 2, 0.5, 1]
        ]
      },
      encoding: {primaries: 'rec2020', transfer: 'linear', format: 'rgba32float'}
    },
    [0, 1]
  );
  expect(scale.sample(1)).toEqual([4, 2, 0.5, 1]);
  expect(resolvePalette({type: 'palette', name: 'viridis'}).length).toBeGreaterThan(2);
});

test('numeric categories sort numerically and can bind an ordinal scale', () => {
  const table = tableFromArrays({code: [10, 2, 10]});
  const scale = compileArrowScale(
    table,
    parseSQLScaleExpression("SCALE_ORDINAL(code, PALETTE('Tableau10'))")
  );
  expect(scale.scale.descriptor.domain).toEqual([2, 10]);
  expect(scale.evaluate(table).get(0)?.toArray()).toEqual(scale.evaluate(table).get(2)?.toArray());
});

test('diverging pivot centers colors and Arrow emits actual binary16 channels', () => {
  const table = tableFromArrays({v: [-10, 0, 30, null]});
  const parsed = parseSQLScaleExpression(
    "SCALE_DIVERGING(v, DOMAIN(v), PALETTE('#000000', '#800000', '#ffffff'))"
  );
  const scale = compileArrowScale(table, {
    ...parsed,
    scale: {
      ...parsed.scale,
      pivot: 0,
      encoding: {primaries: 'srgb', transfer: 'srgb', format: 'rgba16float'}
    }
  });
  expect(scale.scale.sample(0)).toEqual([128 / 255, 0, 0, 1]);
  const output = scale.evaluate(table);
  expect(String(output.type)).toContain('Float16');
  expect(output.get(1)?.get(0)).toBeCloseTo(128 / 255, 3);
  expect(output.get(3)).toBeNull();
});

test('tied quantiles drop empty classes from the sampler and legend', () => {
  const table = tableFromArrays({v: [0, 0, 0, 10, 10]});
  const scale = compileArrowScale(
    table,
    parseSQLScaleExpression("SCALE_QUANTILE(v, 5, PALETTE('Blues'))")
  );
  const {thresholds, range} = scale.scale.descriptor;
  expect(thresholds).toEqual([0, expect.closeTo(4), 10]);
  expect(range.values).toHaveLength(4);
  expect(scale.scale.sample(0)).toEqual(range.values[1]);
});

test('safe Arrow Int64 values scale without losing missing color rows', () => {
  const table = tableFromArrays({v: [0n, null, 10n]});
  const scale = compileArrowScale(
    table,
    parseSQLScaleExpression("SCALE_COLOR(v, DOMAIN(v), PALETTE('viridis'))")
  );
  const vector = scale.evaluate(table);
  expect(scale.scale.descriptor.domain).toEqual([0, 10]);
  expect(vector.get(1)).toBeNull();
  expect(vector.get(2)?.get(0)).toBe(253);
  const child = vector.getChildAt(0)!;
  expect(child.length).toBe(12);
  expect(child.nullCount).toBe(0);
});
