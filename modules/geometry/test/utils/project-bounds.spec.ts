// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {projectBounds} from '@math.gl/geometry';

const identity = (source: readonly number[]) => source;

test('projectBounds encloses sampled nonlinear edge and interior extrema missed by corners', () => {
  const result = projectBounds(
    [
      [0, 0],
      [1, 1]
    ],
    {
      targetSize: 3,
      subdivisions: 2,
      transform: ([x, y]) => [x, y, 16 * x * (1 - x) * y * (1 - y)]
    }
  );
  expect(result).toEqual({
    status: 'sampled',
    bounds: [
      [0, 0, 0],
      [1, 1, 1]
    ],
    sampleCount: 9
  });
  const volume = projectBounds(
    [
      [-1, -1, -1],
      [1, 1, 1]
    ],
    {
      subdivisions: 2,
      targetSize: 2,
      transform: ([x, y, z]) => [x, (1 - x * x) * (1 - y * y) * (1 - z * z)]
    }
  );
  expect(volume).toEqual({
    status: 'sampled',
    bounds: [
      [-1, 0],
      [1, 1]
    ],
    sampleCount: 27
  });
});

test('projectBounds never qualifies point samples as conservative without a supplied contract', () => {
  const transform = ([x]: readonly number[]) => [x, Math.sin(2 * Math.PI * x)];
  const sampled = projectBounds(
    [
      [0, 0],
      [1, 0]
    ],
    {subdivisions: 2, transform}
  );
  expect(sampled.status).toBe('sampled');
  expect(sampled.bounds![1][1]).toBeLessThan(1e-10);
  const bounded = projectBounds(
    [
      [0, 0],
      [1, 0]
    ],
    {
      subdivisions: 2,
      transform,
      lipschitz: [1, 2 * Math.PI]
    }
  );
  expect(bounded.status).toBe('conservative');
  for (let index = 0; index <= 1000; index++) {
    const projected = transform([index / 1000]);
    for (let axis = 0; axis < 2; axis++) {
      expect(projected[axis]).toBeGreaterThanOrEqual(bounded.bounds![0][axis]);
      expect(projected[axis]).toBeLessThanOrEqual(bounded.bounds![1][axis]);
    }
  }
});

test('projectBounds supports affine shear, reflection and component-specific Lipschitz bounds', () => {
  const result = projectBounds(
    [
      [0, 0, 0],
      [2, 4, 6]
    ],
    {
      subdivisions: 2,
      transform: ([x, y, z]) => [-x + 2 * y, z, 7],
      lipschitz: [Math.sqrt(5), 1, 0]
    }
  );
  expect(result.status).toBe('conservative');
  expect(result.bounds![0][0]).toBeLessThan(-2);
  expect(result.bounds![1][0]).toBeGreaterThan(8);
  expect(result.bounds![0][1]).toBeLessThan(0);
  expect(result.bounds![1][1]).toBeGreaterThan(6);
  expect(result.bounds![0][2]).toBeCloseTo(7, 12);
  expect(result.bounds![1][2]).toBeCloseTo(7, 12);
});

test('projectBounds keeps degenerate axes singular and gives callbacks detached sample arrays', () => {
  const input = [new Float64Array([1, 2, 3]), new Float64Array([1, 4, 3])] as const;
  const seen: (readonly number[])[] = [];
  const result = projectBounds(input, {
    subdivisions: 2,
    transform: source => {
      seen.push(source);
      return source;
    }
  });
  expect(result).toEqual({
    status: 'sampled',
    bounds: [
      [1, 2, 3],
      [1, 4, 3]
    ],
    sampleCount: 3
  });
  expect(seen).toEqual([
    [1, 2, 3],
    [1, 3, 3],
    [1, 4, 3]
  ]);
  expect(seen[0]).not.toBe(seen[1]);
  expect(Array.from(input[0])).toEqual([1, 2, 3]);
});

test.each([null, [], [NaN, 1], [1, Infinity]].map(output => ({output})))(
  'projectBounds rejects invalid samples %j without partial bounds',
  ({output}) => {
    let calls = 0;
    const result = projectBounds(
      [
        [0, 0],
        [1, 1]
      ],
      {subdivisions: 1, transform: source => (++calls === 2 ? output : source)}
    );
    expect(result).toEqual({status: 'invalid', bounds: null, sampleCount: 2});
  }
);

test('projectBounds propagates transform errors and rejects overflowing enclosures', () => {
  const error = new Error('Projection failed');
  expect(() =>
    projectBounds(
      [
        [0, 0],
        [1, 1]
      ],
      {
        transform: () => {
          throw error;
        }
      }
    )
  ).toThrow(error);
  const result = projectBounds(
    [
      [0, 0],
      [1e308, 1e308]
    ],
    {
      subdivisions: 1,
      transform: identity,
      lipschitz: [1e308, 1e308]
    }
  );
  expect(result).toEqual({status: 'invalid', bounds: null, sampleCount: 4});
});

test('projectBounds validates dimensions, source extents and budgets before transforming', () => {
  const transform = vi.fn(identity);
  for (const bounds of [
    [[0], [1]],
    [
      [0, 0],
      [1, 1, 1]
    ],
    [
      [1, 0],
      [0, 1]
    ],
    [
      [NaN, 0],
      [1, 1]
    ],
    [
      [-1e308, 0],
      [1e308, 1]
    ]
  ])
    expect(() => projectBounds(bounds as [number[], number[]], {transform})).toThrow(RangeError);
  for (const options of [
    {subdivisions: 0},
    {subdivisions: 1.5},
    {subdivisions: Infinity},
    {maxSamples: 0},
    {maxSamples: Infinity},
    {maxSamples: 1},
    {subdivisions: Number.MAX_SAFE_INTEGER},
    {targetSize: 4 as 3},
    {lipschitz: [1]},
    {lipschitz: [1, -1]},
    {lipschitz: [1, NaN]},
    {lipschitz: new Array<number>(2)},
    {lipschitz: [1, ,] as number[]}
  ])
    expect(() =>
      projectBounds(
        [
          [0, 0],
          [1, 1]
        ],
        {transform, ...options}
      )
    ).toThrow(RangeError);
  expect(transform).not.toHaveBeenCalled();
});
