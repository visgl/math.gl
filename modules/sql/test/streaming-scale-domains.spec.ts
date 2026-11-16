// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {createStreamingDomainAccumulator} from '@math.gl/sql/arrow-scales';
import {ScaleQuantileSketch} from '@math.gl/sql/scales';

test('streaming min/max, symmetric, percentile and category snapshots', () => {
  const table = tableFromArrays({
    value: [2n, 4n, 6n, 8n, 10n],
    type: ['B', 'A', 'B', 'C', 'A']
  });
  const accumulator = createStreamingDomainAccumulator(
    [
      {type: 'extent', column: 'value'},
      {type: 'extent', column: 'value', includeZero: true},
      {type: 'symmetric', column: 'value', pivot: 0},
      {type: 'percentile', column: 'value', lower: 0.25, upper: 0.75},
      {type: 'categories', column: 'type'}
    ],
    {quantileCapacity: 64}
  );
  const before = accumulator.result();
  expect(before[0]).toEqual([]);
  for (const batch of table.batches) accumulator.update(batch);
  const after = accumulator.result();
  expect(after[0]).toEqual([2, 10]);
  expect(after[1]).toEqual([0, 10]);
  expect(after[2]).toEqual([-10, 10]);
  expect(after[3]).toHaveLength(2);
  expect(after[4]).toEqual(['A', 'B', 'C']);
});

test('sketch uses bounded memory and monotone class thresholds', () => {
  const sketch = new ScaleQuantileSketch(32);
  for (let i = 0; i < 10000; i++) sketch.add(i);
  expect(sketch.length).toBe(10000);
  expect(sketch.storedSamples).toBeLessThanOrEqual(64);
  const values = [0.1, 0.25, 0.5, 0.75, 0.9].map(p => sketch.quantile(p)!);
  expect(values).toEqual([...values].sort((a, b) => a - b));
  expect(values[2]).toBeGreaterThan(2000);
  expect(values[2]).toBeLessThan(8000);
});

test('quantile class boundaries can be maintained without percentile domains', () => {
  const table = tableFromArrays({value: [0, 10, 20, 30, 40]});
  const accumulator = createStreamingDomainAccumulator([{type: 'extent', column: 'value'}], {
    quantileColumns: ['value']
  });
  for (const batch of table.batches) accumulator.update(batch);
  expect(accumulator.quantileBreaks('value', 5)).toHaveLength(4);
});

test('merged sketches preserve sample count and exact extrema', () => {
  const first = new ScaleQuantileSketch(32);
  const second = new ScaleQuantileSketch(32);
  for (let i = 0; i < 10000; i++) (i < 8000 ? first : second).add(i);
  first.merge(second);
  expect(first.length).toBe(10000);
  expect(first.storedSamples).toBeLessThanOrEqual(32);
  expect(first.quantile(0)).toBe(0);
  expect(first.quantile(1)).toBe(9999);
  expect(first.quantile(0.5)).toBeGreaterThan(2000);
  expect(first.quantile(0.5)).toBeLessThan(8000);
});
