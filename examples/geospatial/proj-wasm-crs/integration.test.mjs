// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {runExample} from './example.mjs';

test('real proj-wasm database resolution and normalized execution', {timeout: 60000}, async () => {
  const result = await runExample();
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(result.mathgl[i] - result.wasm[i]) < 1e-6);
    assert.ok(Math.abs(result.inverse[i] - result.input[i]) < 1e-8);
  }
  assert.match(result.lookup.version, /proj-wasm@0.1.0; EPSG:/);
  assert.equal(result.compoundType, 'CompoundCRS');
  assert.match(result.unsupported, /compound|vertical/i);
});
