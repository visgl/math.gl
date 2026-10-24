// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  BigInt,
  BigIntAvailable,
  BigInt64Array,
  BigInt64ArrayAvailable,
  BigUint64Array,
  BigUint64ArrayAvailable
} from '../../src/types/bigint';
import {getBounds2D, isBounds2D} from '../../src/types/bounds-types';

test('@math.gl/core/types bounds helpers preserve and truncate dimensions', () => {
  const bounds2d = [
    [1, 2],
    [3, 4]
  ] as [[number, number], [number, number]];
  const bounds3d = [
    [1, 2, 3],
    [4, 5, 6]
  ] as [[number, number, number], [number, number, number]];
  expect(isBounds2D(bounds2d)).toBe(true);
  expect(isBounds2D(bounds3d)).toBe(false);
  expect(getBounds2D(bounds2d)).toBe(bounds2d);
  expect(getBounds2D(bounds3d)).toEqual([
    [1, 2],
    [4, 5]
  ]);
});

test('@math.gl/core/types bigint compatibility exports select native implementations', () => {
  expect(BigIntAvailable).toBe(true);
  expect(BigInt64ArrayAvailable).toBe(true);
  expect(BigUint64ArrayAvailable).toBe(true);
  expect(BigInt('42')).toBe(42n);
  expect(new BigInt64Array([1n, -2n])).toEqual(new globalThis.BigInt64Array([1n, -2n]));
  expect(BigUint64Array).toBe(globalThis.BigUint64Array);
  expect(new BigUint64Array([1n, 2n])).toEqual(new globalThis.BigUint64Array([1n, 2n]));
});
