// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {compileArrowScale, compileArrowScaleExpression} from '@math.gl/sql/scales';
import {parseSQLScaleExpression} from '@math.gl/sql/parser';

test('SQL symlog preserves zero and both signs and retains the configured constant', () => {
  const input = tableFromArrays({value: [-100, -10, 0, 10, 100]});
  const parsed = parseSQLScaleExpression(
    'SCALE_SYMLOG(value, DOMAIN(-100, 100), RANGE(-1, 1), 10)'
  );
  const {scale} = compileArrowScale(input, parsed);
  expect(scale.descriptor.transform).toEqual({type: 'symlog', constant: 10});
  expect(scale.sample(0)).toBe(0);
  expect(scale.sample(-10)).toBeCloseTo(-Math.log(2) / Math.log(11));
  expect(scale.sample(10)).toBeCloseTo(Math.log(2) / Math.log(11));
  const nested = compileArrowScaleExpression(
    input,
    'SCALE_SYMLOG(value, DOMAIN(value), RANGE(-1, 1)) + 1'
  );
  expect(Array.from(nested.evaluateTable(input)).filter((_, idx) => idx % 2 === 0)).toEqual([
    0, 1, 2
  ]);
});

test('SQL power transform works with signed numeric, sequential, and diverging scales', () => {
  const input = tableFromArrays({value: [-10, 0, 5, 10]});
  const numeric = parseSQLScaleExpression('SCALE_POWER(value, DOMAIN(-10, 10), RANGE(-1, 1), 2)');
  expect(compileArrowScale(input, numeric).scale.sample(-5)).toBe(-0.25);
  const color = parseSQLScaleExpression(
    "SCALE_COLOR(value, TRANSFORM_DOMAIN(DOMAIN(0, 10), POWER(2)), PALETTE('#000000', '#ffffff'))"
  );
  const {scale} = compileArrowScale(input, color);
  expect(scale.descriptor.domain).toEqual([0, 10]);
  expect(scale.descriptor.transform).toEqual({type: 'power', exponent: 2});
  expect(scale.sample(5)).toEqual([0.25, 0.25, 0.25, 1]);
  const diverging = parseSQLScaleExpression(
    "SCALE_DIVERGING(value, TRANSFORM_DOMAIN(DOMAIN(-10, 10), SYMLOG(2)), PALETTE('#000000', '#ffffff'))"
  );
  expect(compileArrowScale(input, diverging).scale.sample(0)).toEqual([0.5, 0.5, 0.5, 1]);
  expect(() =>
    parseSQLScaleExpression('SCALE_POWER(value, DOMAIN(0, 10), RANGE(0, 1), 0)')
  ).toThrow('positive');
});
