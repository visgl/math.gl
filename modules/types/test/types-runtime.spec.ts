// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  BigInt,
  BigIntAvailable,
  BigInt64Array,
  BigInt64ArrayAvailable,
  BigUint64Array,
  BigUint64ArrayAvailable
} from '../src/bigint';
import {getBounds2D, isBounds2D, type Bounds} from '../src/bounds-types';

test('@math.gl/types bounds helpers preserve and truncate dimensions', () => {
  const bounds2d = [
    [1, 2],
    [3, 4]
  ] as [[number, number], [number, number]];
  const bounds3d = [
    [1, 2, 3],
    [4, 5, 6]
  ] as [[number, number, number], [number, number, number]];
  const malformed = [...bounds3d, [7, 8, 9]] as unknown as Bounds;
  expect(isBounds2D(bounds2d)).toBe(true);
  expect(isBounds2D(malformed)).toBe(false);
  expect(getBounds2D(bounds2d)).toBe(bounds2d);
  expect(getBounds2D(malformed)).toEqual([
    [1, 2],
    [4, 5]
  ]);
});

test('@math.gl/types bigint compatibility exports select native implementations', () => {
  expect(BigIntAvailable).toBe(true);
  expect(BigInt64ArrayAvailable).toBe(true);
  expect(BigUint64ArrayAvailable).toBe(true);
  expect(BigInt('42')).toBe(42n);
  expect(new BigInt64Array([1n, -2n])).toEqual(new globalThis.BigInt64Array([1n, -2n]));
  expect(BigUint64Array).toEqual([globalThis.BigUint64Array]);
});
