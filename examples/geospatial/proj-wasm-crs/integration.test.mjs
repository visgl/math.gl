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
  assert.equal(result.batch.transferred, true);
  assert.equal(result.batch.workerParity, true);
  assert.equal(result.batch.staleDiscarded, true);
  assert.deepEqual(result.batch.rows, [7, 11, 19]);
  for (let i = 0; i < result.batch.input.length; i++)
    assert.ok(Math.abs(result.batch.inverse[i] - result.batch.input[i]) < 1e-8);
  for (let i = 0; i < 3; i++)
    assert.ok(Math.abs(result.batch.projected[i] - result.mathgl[i]) < 1e-6);

  assert.match(result.unsupported, /compound|vertical/i);
});
