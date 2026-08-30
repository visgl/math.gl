// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {clamp, createMat4, lerp, log2, mod, transformVector} from '../src/math-utils';

test('web mercator math helpers cover matrix, modular, and scalar paths', () => {
  const identity = createMat4();
  expect(identity).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  expect(transformVector(identity, [1, 2, 3, 1])).toEqual([1, 2, 3, 1]);
  expect(mod(-1, 360)).toBe(359);
  expect(mod(361, 360)).toBe(1);
  expect(lerp(10, 20, 0.25)).toBe(12.5);
  expect(clamp(-1, 0, 1)).toBe(0);
  expect(clamp(2, 0, 1)).toBe(1);
  expect(clamp(0.5, 0, 1)).toBe(0.5);
  expect(log2(8)).toBe(3);
});
