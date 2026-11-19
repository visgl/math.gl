// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getJenksBreaks} from '@math.gl/core/color';

test('Jenks separates clusters and returns upper-class thresholds', () => {
  expect(getJenksBreaks([102, 1, 20, 99, 3, 24, 2, 22, 100], 3)).toEqual([20, 99]);
  expect(getJenksBreaks([0, 4, 5, 6, 9], 2)).toEqual([4]);
  expect(getJenksBreaks([0, 4, 5, 6, ...Array(10).fill(9)], 2)).toEqual([9]);
});

test('Jenks handles ties, nonfinite rows, and invalid class counts', () => {
  expect(getJenksBreaks([1, 1, 2, 2, 3, NaN, Infinity], 3)).toEqual([2, 3]);
  expect(getJenksBreaks([-5, 0, 5], 1)).toEqual([]);
  expect(() => getJenksBreaks([1, 1], 2)).toThrow('distinct finite');
  expect(() => getJenksBreaks([1], 0)).toThrow('positive integer');
});
