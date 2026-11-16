// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {createResolvedScale, validateScaleSpec, type ScaleSpec} from '../src/scales';

test('portable data-derived scale specification is JSON serializable', () => {
  const spec: ScaleSpec = {
    id: 'temperature',
    type: 'sequential',
    domain: {type: 'extent', column: 'temperature'},
    range: {type: 'palette', name: 'viridis'},
    interpolation: 'oklab',
    clamp: true
  };
  expect(validateScaleSpec(JSON.parse(JSON.stringify(spec)))).toEqual(spec);
});

test('HDR color stops preserve extended linear values', () => {
  const spec: ScaleSpec = {
    type: 'sequential',
    domain: {type: 'fixed', values: [0, 1000]},
    range: {
      type: 'colors',
      values: [
        [0, 0, 0, 1],
        [4, 2, 0.5, 1]
      ]
    },
    encoding: {
      primaries: 'rec2020',
      transfer: 'linear',
      format: 'rgba16float',
      referenceWhiteNits: 203
    }
  };
  expect(validateScaleSpec(spec)).toBe(spec);
  expect(spec.range.type === 'colors' && spec.range.values[1][0]).toBe(4);
});

test('resolved scale keeps the evaluator and its authoritative legend descriptor together', () => {
  const scale = createResolvedScale(
    {
      type: 'sequential',
      domain: [0, 100],
      range: {
        type: 'colors',
        values: [
          [0, 0, 0, 1],
          [2, 1, 0, 1]
        ]
      },
      encoding: {primaries: 'srgb', transfer: 'linear', format: 'rgba16float'}
    },
    value => (value === null ? null : [2, 1, 0, 1])
  );
  expect(scale.sample(50)).toEqual([2, 1, 0, 1]);
  expect(scale.descriptor.domain).toEqual([0, 100]);
  expect(JSON.stringify(scale.descriptor)).not.toContain('sample');
});

test('invalid intervals, HDR settings, and breaks are rejected', () => {
  expect(() =>
    validateScaleSpec({
      type: 'sequential',
      domain: {type: 'percentile', column: 'v', lower: 0.8, upper: 0.2},
      range: {type: 'palette', name: 'viridis'}
    })
  ).toThrow('Percentile');
  expect(() =>
    validateScaleSpec({
      type: 'sequential',
      domain: {type: 'fixed', values: [0, 1]},
      range: {
        type: 'colors',
        values: [
          [0, 0, 0, 1],
          [Infinity, 0, 0, 1]
        ]
      }
    })
  ).toThrow('finite');
  expect(() =>
    createResolvedScale(
      {
        type: 'threshold',
        domain: [0, 100],
        range: {
          type: 'colors',
          values: [
            [0, 0, 0, 1],
            [1, 1, 1, 1]
          ]
        },
        thresholds: [40, 20]
      },
      () => null
    )
  ).toThrow('ordered');
});
