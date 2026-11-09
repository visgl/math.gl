// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {lngLatToWorld} from '@math.gl/web-mercator';
import {projectTextureCoordinates} from '@math.gl/geometry';

const bounds = [10, 20, 30, 60] as const;
const identity = (position: readonly number[]) => position;

test('projectTextureCoordinates preserves vertex order and source ownership', () => {
  const positions = new Float64Array([10, 60, 7, 30, 20, 9, 20, 40, 11]);
  const before = positions.slice();
  const result = projectTextureCoordinates(positions, {bounds, transform: identity});
  expect(result).toBeInstanceOf(Float64Array);
  expect(Array.from(result)).toEqual([0, 0, 1, 1, 0.5, 0.5]);
  expect(positions).toEqual(before);
  expect(result.buffer).not.toBe(positions.buffer);
});

test('projectTextureCoordinates supports XY, both origins and unclamped UVs', () => {
  const positions = [10, 20, 30, 60, -10, 100];
  expect(
    Array.from(projectTextureCoordinates(positions, {bounds, size: 2, transform: identity}))
  ).toEqual([0, 1, 1, 0, -1, -1]);
  expect(
    Array.from(
      projectTextureCoordinates(positions, {
        bounds,
        size: 2,
        transform: identity,
        origin: 'bottom-left'
      })
    )
  ).toEqual([0, 0, 1, 1, -1, 2]);
});

test('projectTextureCoordinates applies prepared nonlinear transforms without importing an engine', () => {
  const result = projectTextureCoordinates([0, 0, 1, 2, 2, 4], {
    size: 2,
    bounds: [0, 0, 4, 16],
    transform: ([x, y]) => [x * x, y * y]
  });
  expect(Array.from(result)).toEqual([0, 1, 0.25, 0.75, 1, 0]);
});

test('projectTextureCoordinates supplies fresh callback arrays, including typed-array subviews', () => {
  const input = new Float64Array([99, 10, 20, 30, 60, 99]).subarray(1, 5);
  const seen: (readonly number[])[] = [];
  const result = projectTextureCoordinates(input, {
    bounds,
    size: 2,
    transform: source => {
      seen.push(source);
      return source;
    }
  });
  expect(seen[0]).not.toBe(seen[1]);
  expect(seen).toEqual([
    [10, 20],
    [30, 60]
  ]);
  expect(Array.from(result)).toEqual([0, 1, 1, 0]);
});

test('projectTextureCoordinates accepts empty input without invoking the transform', () => {
  const transform = vi.fn(identity);
  expect(projectTextureCoordinates([], {bounds, transform})).toEqual(new Float64Array());
  expect(transform).not.toHaveBeenCalled();
});

test.each([
  [0, 0, 0, 1],
  [1, 0, 0, 1],
  [0, 2, 1, 1],
  [0, 0, 1, Infinity],
  [-1e308, 0, 1e308, 1],
  [0, 0, 1, 0]
])('projectTextureCoordinates rejects invalid image bounds %j', (...imageBounds) => {
  expect(() =>
    projectTextureCoordinates([], {
      bounds: imageBounds as [number, number, number, number],
      transform: identity
    })
  ).toThrow(RangeError);
});

test('projectTextureCoordinates rejects invalid layouts and samples rather than dropping vertices', () => {
  expect(() => projectTextureCoordinates([0, 0], {bounds, transform: identity})).toThrow(
    RangeError
  );
  expect(() => projectTextureCoordinates([], {bounds, transform: identity, size: 4 as 3})).toThrow(
    RangeError
  );
  expect(() =>
    projectTextureCoordinates([], {bounds, transform: identity, origin: 'other' as 'top-left'})
  ).toThrow(RangeError);
  expect(() => projectTextureCoordinates([NaN, 0], {bounds, size: 2, transform: identity})).toThrow(
    RangeError
  );
  for (const output of [null, [0], [NaN, 0], [0, Infinity]]) {
    expect(() =>
      projectTextureCoordinates([0, 0], {bounds, size: 2, transform: () => output})
    ).toThrow(RangeError);
  }
  expect(() =>
    projectTextureCoordinates([1e308, 0], {bounds: [-1e308, 0, 0, 1], size: 2, transform: identity})
  ).toThrow(RangeError);
  const error = new Error('Projection unavailable');
  expect(() =>
    projectTextureCoordinates([0, 0], {
      bounds,
      size: 2,
      transform: () => {
        throw error;
      }
    })
  ).toThrow(error);
});

// Published Web Mercator coordinates use a 512-unit world, with increasing northing.
test('projectTextureCoordinates composes with a real geospatial converter', () => {
  const uv = projectTextureCoordinates([0, 0, 0, 60, 180, 0], {
    size: 2,
    bounds: [0, 0, 512, 512],
    transform: position => lngLatToWorld(position)
  });
  expect(uv[0]).toBeCloseTo(0.5, 12);
  expect(uv[1]).toBeCloseTo(0.5, 12);
  expect(uv[2]).toBeCloseTo(0.5, 12);
  expect(uv[3]).toBeCloseTo(0.2903996408605087, 12);
  expect(uv[4]).toBeCloseTo(1, 12);
});
