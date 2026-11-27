// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createTerrainFilteredPyramid} from '@math.gl/geospatial/terrain';

test('box filter preserves source weights for odd dimensions and missing values', () => {
  const levels = createTerrainFilteredPyramid({
    width: 3,
    height: 3,
    heights: Float64Array.from([1, 2, 3, 4, 5, 6, 7, 8, NaN])
  });
  expect(levels.map(l => [l.width, l.height])).toEqual([
    [3, 3],
    [2, 2],
    [1, 1]
  ]);
  expect([...levels[1].heights]).toEqual([3, 4.5, 7.5, 0]);
  expect([...levels[1].validCounts]).toEqual([4, 2, 2, 0]);
  expect([...levels[1].sampleCounts]).toEqual([4, 2, 2, 1]);
  expect(levels[2].heights[0]).toBe(4.5);
  expect(levels[2].validCounts[0]).toBe(8);
  expect(levels[2].sampleCounts[0]).toBe(9);
});

test('missing mask and extreme opposite heights remain explicit', () => {
  const p = createTerrainFilteredPyramid({
    width: 2,
    height: 2,
    heights: Float64Array.from([1e308, -1e308, 7, 10]),
    validity: Uint8Array.from([1, 1, 0, 0])
  });
  expect(p[1].heights[0]).toBe(0);
  expect(p[1].validCounts[0]).toBe(2);
  expect(p[1].sampleCounts[0]).toBe(4);
  expect(() =>
    createTerrainFilteredPyramid(
      {width: 2, height: 2, heights: new Float64Array(4)},
      {maxSamples: 3}
    )
  ).toThrow();
});
