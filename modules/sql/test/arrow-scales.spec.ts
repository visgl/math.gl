// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {createArrowColumns, type ArrowProjectionOperation} from '@math.gl/sql/arrow';
import type {Expression} from '../src/expressions';
import {ABS} from '../src/math-functions';
import {parseSQLExpression} from '../src/parser/parse-sql-expression';
import {parseSQLScaleExpression} from '../src/scales';
import {compileResolvedScale, resolvePalette} from '../src/scales';
import {
  bindArrowScale,
  compileArrowScale,
  compileArrowScales,
  scaleProjectionOperation,
  createStreamingDomainAccumulator
} from '@math.gl/sql/scales';
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

test('binds streamed quantile breaks without scanning evaluation rows', () => {
  const training = tableFromArrays({value: [0, 10, 20, 30, 40]});
  const evaluation = tableFromArrays({value: [5, 6, 7]});
  const parsed = parseSQLScaleExpression("SCALE_QUANTILE(value, 5, PALETTE('Blues'))");
  const accumulator = createStreamingDomainAccumulator([parsed.scale.domain], {
    quantileColumns: ['value']
  });
  for (const batch of training.batches) accumulator.update(batch);
  const domain = accumulator.result()[0]!;
  const quantileBreaks = accumulator.quantileBreaks('value', 5);
  const result = bindArrowScale(training.schema, parsed, {domain, quantileBreaks});
  expect(result.scale.descriptor.domain).toEqual([0, 40]);
  expect(result.scale.descriptor.thresholds).toEqual([8, 16, 24, 32]);
  expect(result.evaluateBatch(evaluation.batches[0]!).get(2)?.toArray()).toEqual(
    new Uint8Array(
      (result.scale.sample(7) as readonly number[]).map(value => Math.round(value * 255))
    )
  );
  expect(() => bindArrowScale(training.schema, parsed, {domain})).toThrow('resolved break');
  expect(() =>
    bindArrowScale(training.schema, parsed, {
      domain,
      quantileBreaks: [8, 16, 12, 32]
    })
  ).toThrow('nondecreasing');
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

test('constant quantize domains retain only reachable palette classes', () => {
  const table = tableFromArrays({value: [5, 5]});
  const parsed = parseSQLScaleExpression("SCALE_QUANTIZE(value, 5, PALETTE('Blues'))");
  const result = bindArrowScale(table.schema, parsed, {domain: [5, 5]});
  expect(result.scale.descriptor.thresholds).toEqual([5]);
  expect(result.scale.descriptor.range.values).toHaveLength(2);
  expect(result.scale.sample(5)).toEqual(result.scale.descriptor.range.values[1]);
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

test('Arrow threshold scale binds a single break and starts the upper class at equality', () => {
  const data = tableFromArrays({risk: [4, 5, 6]});
  const parsed = parseSQLScaleExpression(
    "SCALE_THRESHOLD(risk, ARRAY[5], PALETTE('#000000', '#ffffff'))"
  );
  const result = compileArrowScale(data, parsed);
  expect(result.scale.descriptor.thresholds).toEqual([5]);
  expect(Array.from(result.evaluate(data), row => Array.from(row))).toEqual([
    [0, 0, 0, 255],
    [255, 255, 255, 255],
    [255, 255, 255, 255]
  ]);
});

test('SQL ordinal scales retain fixed category colors when earlier categories are absent', () => {
  const data = tableFromArrays({category: [20, 20, 99]});
  const parsed = parseSQLScaleExpression(
    "SCALE_ORDINAL(category, CATEGORIES(-10, 20), PALETTE('#ff0000', '#0000ff'))"
  );
  const result = compileArrowScale(data, parsed);
  expect(result.scale.descriptor.domain).toEqual([-10, 20]);
  expect(Array.from(result.evaluate(data).get(0))).toEqual([0, 0, 255, 255]);
  expect(result.evaluate(data).get(2)).toBeNull();
  expect(() =>
    parseSQLScaleExpression("SCALE_ORDINAL(category, CATEGORIES(20, 20), PALETTE('Tableau10'))")
  ).toThrow('no duplicates');
});

test('fixed ordinal mappings remain stable across separately evaluated batches', () => {
  const first = tableFromArrays({category: new Int32Array([10, 20])});
  const second = tableFromArrays({category: new Int32Array([20, 10, 99])});
  const scale = compileArrowScale(
    first,
    parseSQLScaleExpression(
      "SCALE_ORDINAL(category, CATEGORIES(10, 20), PALETTE('#ff0000', '#0000ff'))"
    )
  );
  const initial = scale.evaluateBatch(first.batches[0]!);
  const later = scale.evaluateBatch(second.batches[0]!);
  expect(Array.from(later.get(0))).toEqual(Array.from(initial.get(1)));
  expect(Array.from(later.get(1))).toEqual(Array.from(initial.get(0)));
  expect(later.get(2)).toBeNull();
});

test('quantiles classify an Arrow row expression with explicit colors', () => {
  const data = tableFromArrays({flow: [-20, 3, -1, 8, null]});
  const parsed = parseSQLScaleExpression(
    "SCALE_QUANTILE(ABS(flow), 2, PALETTE('#ffeecc', '#993300'))"
  );
  const result = compileArrowScales(data, {flow: parsed}, [ABS]).flow;
  expect(result.scale.descriptor.domain).toEqual([1, 20]);
  expect(result.scale.descriptor.thresholds).toEqual([5.5]);
  const colors = result.evaluate(data);
  expect(Array.from(colors.get(0))).toEqual([153, 51, 0, 255]);
  expect(Array.from(colors.get(1))).toEqual([255, 238, 204, 255]);
  expect(colors.get(4)).toBeNull();
  expect(() =>
    parseSQLScaleExpression("SCALE_QUANTILE(ABS(flow), 3, PALETTE('#ffeecc', '#993300'))")
  ).toThrow('one color per class');
});

test('computed Arrow quantiles preserve a supplied extent and use projected streaming domains', () => {
  const data = tableFromArrays({flow: [-20, 3, -1, 8, null]});
  const parsed = parseSQLScaleExpression(
    "SCALE_QUANTILE(ABS(flow), 2, PALETTE('#ffeecc', '#993300'))"
  );
  expect(resolveArrowDomains(data, [parsed.scale.domain], [ABS])).toEqual([[1, 20]]);
  const resolved = compileArrowScale(data, parsed, [0, 25], [ABS]);
  expect(resolved.scale.descriptor.domain).toEqual([0, 25]);
  expect(resolved.scale.descriptor.thresholds).toEqual([5.5]);
  expect(() => createStreamingDomainAccumulator([parsed.scale.domain])).toThrow('projected column');
});

test('evaluates parsed Arrow projections with resolved scale metadata', () => {
  const data = tableFromArrays({value: [0, 5, 10]});
  const tag: ArrowProjectionOperation<{kind: 'tag'}> = {
    matches: call => call.callee['name'] === 'TAG',
    prepare: call => ({
      expression: call.arguments[0] as Expression,
      metadata: {kind: 'tag'}
    })
  };
  const result = createArrowColumns(
    data,
    {
      value: parseSQLExpression('ABS(value + 1)'),
      color: parseSQLExpression(
        "TAG(SCALE_COLOR(value, DOMAIN(value), PALETTE('#000000', '#ffffff')))"
      )
    },
    {operations: [tag, scaleProjectionOperation], functions: [ABS]}
  );

  expect(result.table.schema.fields.map(field => field.name)).toEqual(['value', 'color']);
  expect(Array.from(result.table.getChild('value')!)).toEqual([1, 6, 11]);
  expect(Array.from(result.table.getChild('color')!.get(2))).toEqual([255, 255, 255, 255]);
  expect(result.columnMetadata.value).toEqual([]);
  expect(result.columnMetadata.color.map(entry => entry.kind)).toEqual(['tag', 'scale']);
  const scale = result.columnMetadata.color[1];
  expect(scale?.kind === 'scale' && scale.scale.descriptor.domain).toEqual([0, 10]);
  expect(data.schema.fields.map(field => field.name)).toEqual(['value']);
  expect(Array.from(data.getChild('value')!)).toEqual([0, 5, 10]);
});

test('an empty projection preserves rows across batches', () => {
  const first = tableFromArrays({value: [0, 1]});
  const input = first.concat(first);
  const {table, columnMetadata} = createArrowColumns(input, {});
  expect(table.numRows).toBe(4);
  expect(table.numCols).toBe(0);
  expect(columnMetadata).toEqual({});
  expect(input.numCols).toBe(1);
});
