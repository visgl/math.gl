// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMapPreparationGate} from './map-preparation-gate.js';

test('cancel aborts globe preparation and prevents unrelated renders restarting it', () => {
  const gate = createMapPreparationGate();
  const controller = new AbortController();
  assert.equal(gate.cancel({opts: {view: 'globe'}, controller}), 'globe');
  assert.equal(controller.signal.aborted, true);
  assert.equal(gate.allows('globe'), false);
  assert.equal(gate.allows('globe'), false);
  gate.retry();
  assert.equal(gate.allows('globe'), true);
});

test('a new view permits preparation and a later globe selection', () => {
  const gate = createMapPreparationGate();
  const controller = new AbortController();
  gate.cancel({opts: {view: 'globe'}, controller});
  assert.equal(gate.allows('butterfly'), true);
  assert.equal(gate.allows('globe'), true);
  assert.equal(gate.cancel(null), null);
});
