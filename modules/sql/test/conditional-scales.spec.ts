// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {compileArrowScaleExpression} from '../src/scales/arrow-scales';

// Explicit domains ensure the invalid value is only evaluated if its branch is selected.
test('CASE selects color scales and masks errors in unselected value expressions', () => {
  const data = tableFromArrays({flow: [-2, 0, 2]});
  const compiled = compileArrowScaleExpression(
    data,
    `CASE WHEN flow > 0
    THEN SCALE_COLOR(10 / flow, DOMAIN(0, 10), PALETTE('#000000', '#ffffff'))
    ELSE SCALE_COLOR(flow, DOMAIN(-2, 0), PALETTE('#ff0000', '#0000ff')) END`
  );
  const result = compiled.evaluateTable(data);
  expect(Array.from(result.get(0))).toEqual([255, 0, 0, 255]);
  expect(Array.from(result.get(1))).toEqual([0, 0, 255, 255]);
  expect(Array.from(result.get(2))).toEqual([128, 128, 128, 255]);
  expect(compiled.scales).toHaveLength(2);
  expect(compiled.scales[0]!.descriptor.domain).toEqual([0, 10]);
});

test('nested conditional numeric scales retain whole-table domains and batch evaluation', () => {
  const data = tableFromArrays({value: [0, 50, 100, null]});
  const compiled = compileArrowScaleExpression(
    data,
    'CASE WHEN value > 0 THEN SCALE_LINEAR(value, DOMAIN(value), RANGE(0, 10)) ELSE 0 END'
  );
  expect(Array.from(compiled.evaluateTable(data))).toEqual([0, 5, 10, 0]);
  expect(compiled.scales[0]!.descriptor.domain).toEqual([0, 100]);
  expect(Array.from(compiled.evaluate(data.batches[0]!))).toEqual([0, 5, 10, 0]);
});

test('caller masks, scale-free expressions and incompatible branch types', () => {
  const data = tableFromArrays({value: [0, 10]});
  const compiled = compileArrowScaleExpression(
    data,
    'SCALE_LINEAR(value, DOMAIN(0, 10), RANGE(0, 1))'
  );
  expect(Array.from(compiled.evaluateTable(data, {activeRows: new Uint8Array([0, 1])}))).toEqual([
    null,
    1
  ]);
  expect(compileArrowScaleExpression(data, 'value + 1').scales).toEqual([]);
  expect(() =>
    compileArrowScaleExpression(
      data,
      "CASE WHEN value > 0 THEN SCALE_COLOR(value, DOMAIN(0, 10), PALETTE('viridis')) ELSE 2 END"
    )
  ).toThrow();
});
