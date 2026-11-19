// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {compileArrowBivariateScale, compileBivariateColorScale} from '@math.gl/sql/scales';

const spec = {
  xDomain: [0, 100],
  yDomain: [-2, 2],
  colors: [
    [
      [0, 0, 0, 1],
      [1, 0, 0, 1]
    ],
    [
      [0, 0, 1, 1],
      [1, 1, 1, 1]
    ]
  ]
} as const;

test('discrete bivariate output uses the same two-axis cuts as the legend', () => {
  const scale = compileBivariateColorScale(spec);
  expect(scale.descriptor.xBreaks).toEqual([50]);
  expect(scale.descriptor.yBreaks).toEqual([0]);
  expect(scale.sample(50, 0)).toEqual([1, 1, 1, 1]);
  expect(scale.sample(49, 1)).toEqual([0, 0, 1, 1]);
  expect(scale.sample(null, 0)).toBeNull();
  expect(scale.sample(Infinity, 0)).toBeNull();
  expect(() => compileBivariateColorScale({...spec, colors: [spec.colors[0], []]})).toThrow(
    'rectangular'
  );
  expect(() => compileBivariateColorScale({...spec, yDomain: [2, 2]})).toThrow('increasing');
});

test('Arrow evaluates two expressions and shares the bilinear sampler', () => {
  const input = tableFromArrays({x: [0, 49, 99, null], y: [-2, 0, 2, 2]});
  const bound = compileArrowBivariateScale(
    'x + 1',
    'y',
    {...spec, interpolation: 'bilinear'},
    {
      inputSchema: input.schema
    }
  );
  const output = bound.evaluateTable(input, {activeRows: Uint8Array.of(0, 1, 1, 1)});
  expect(bound.scale.sample(50, 0)).toEqual([0.5, 0.25, 0.5, 1]);
  expect(output.get(0)).toBeNull();
  expect(Array.from(output.get(1))).toEqual([128, 64, 128, 255]);
  expect(Array.from(output.get(2))).toEqual([255, 255, 255, 255]);
  expect(output.get(3)).toBeNull();
});
