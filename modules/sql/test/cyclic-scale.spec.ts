// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {compileArrowScale, compileArrowScaleExpression} from '@math.gl/sql/scales';
import {parseSQLScaleExpression} from '@math.gl/sql/parser';

test('cyclic scales wrap the period in both directions and interpolate across the seam', () => {
  const input = tableFromArrays({heading: [15, 375, -345, 285, null]});
  const sql = "SCALE_CYCLIC(heading, DOMAIN(15, 375), PALETTE('#000000', '#ffffff'))";
  const parsed = parseSQLScaleExpression(sql);
  const {scale} = compileArrowScale(input, parsed);
  expect(scale.descriptor.domain).toEqual([15, 375]);
  expect(scale.sample(15)).toEqual(scale.sample(375));
  expect(scale.sample(-345)).toEqual(scale.sample(375));
  expect(scale.sample(195)).toEqual([1, 1, 1, 1]);
  expect(scale.sample(285)).toEqual([0.5, 0.5, 0.5, 1]);
  expect(scale.sample(null)).toBeNull();
  const column = compileArrowScaleExpression(input, sql).evaluateTable(input);
  expect(Array.from(column.get(3))).toEqual([128, 128, 128, 255]);
  expect(column.get(4)).toBeNull();
});

test('cyclic SQL requires explicit finite increasing endpoints', () => {
  expect(() =>
    parseSQLScaleExpression("SCALE_CYCLIC(heading, DOMAIN(heading), PALETTE('compass'))")
  ).toThrow('fixed origin');
  expect(() =>
    parseSQLScaleExpression("SCALE_CYCLIC(heading, DOMAIN(360, 0), PALETTE('compass'))")
  ).toThrow('positive finite period');
});
