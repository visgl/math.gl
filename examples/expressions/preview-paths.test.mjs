// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {longitudeCopies} from './preview-paths.ts';

test('Unwrapped and wrapped dateline paths retain both map-edge halves', () => {
  for (const end of [181,-179]) {
    const source=[[179,10],[end,11]], before=structuredClone(source);
    assert.deepEqual(longitudeCopies(source), [[[-181,10],[-179,11]],[[179,10],[181,11]]]);
    assert.deepEqual(source,before);
  }
});
test('Ordinary paths stay single and seam points appear on both edges', () => {
  assert.deepEqual(longitudeCopies([[1,2],[3,4]]), [[[1,2],[3,4]]]);
  assert.deepEqual(longitudeCopies([[180,2]]), [[[-180,2]],[[180,2]]]);
  assert.deepEqual(longitudeCopies([[NaN,0]]), []);
});
