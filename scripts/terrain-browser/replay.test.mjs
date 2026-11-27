// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {arrivalTrace, encode, decode, replayBrowser} from './replay.mjs';

test('arrival traces retain ordered edits, pauses and simultaneous brush samples', () => {
  const events = Array.from({length: 128}, (_, index) => ({edit: {index}}));
  for (const name of ['brush', 'streaming']) {
    const trace = arrivalTrace(events, name);
    assert.deepEqual(
      trace.map(e => e.edit),
      events.map(e => e.edit)
    );
    assert.ok(trace.every((e, i) => i === 0 || e.arrivalMs >= trace[i - 1].arrivalMs));
    assert.ok(trace[64].arrivalMs - trace[63].arrivalMs > 75);
    assert.deepEqual(trace, arrivalTrace(events, name));
  }
  assert.equal(arrivalTrace(events, 'brush')[3].arrivalMs, 0);
  assert.throws(() => arrivalTrace(events, 'invalid'));
});

test('JSON bridge preserves nodata and typed output buffers for exact parity', () => {
  const data = {
    heights: new Float64Array([1, NaN, -99]),
    validity: new Uint8Array([1, 0, 1]),
    rows: [null, {value: NaN}]
  };
  assert.deepEqual(decode(JSON.parse(JSON.stringify(encode(data)))), data);
});

test('invalid scheduler inputs reject instead of hanging', async () => {
  await assert.rejects(replayBrowser({}, [], 'copy', 'single'));
  await assert.rejects(replayBrowser({}, [{}], 'copy', 'unknown'));
});

test('dispatch serializes revisions, preserves every edit and caps observed backlogs', async () => {
  const originalFrame = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = callback => setTimeout(callback, 16);
  globalThis.cancelAnimationFrame = clearTimeout;
  try {
    for (const policy of ['single', 'opportunistic', 'bounded-wait']) {
      let active = 0;
      let revision = 3;
      const events = Array.from({length: 23}, (_, index) => ({
        arrivalMs: index < 20 ? 0 : 50,
        edit: {index}
      }));
      const handle = {
        async runTask(input) {
          assert.equal(active++, 0);
          assert.equal(input.revision, revision);
          await new Promise(resolve => setTimeout(resolve, 5));
          active--;
          return {revision: ++revision};
        }
      };
      const {commits} = await replayBrowser(handle, events, 'copy', policy, 0);
      assert.deepEqual(
        commits.flatMap(c => c.batch.map(e => e.edit)),
        events.map(e => e.edit)
      );
      assert.ok(commits.every(c => c.batch.length <= (policy === 'single' ? 1 : 8)));
      assert.ok(commits.every(c => c.batch.every(e => e.observedMs <= c.sentMs)));
      if (policy !== 'single') assert.ok(commits.some(c => c.batch.length > 1));
      assert.equal(active, 0);
    }
    await assert.rejects(
      replayBrowser(
        {
          async runTask() {
            throw new Error('transport failed');
          }
        },
        [{arrivalMs: 0, edit: {}}],
        'copy',
        'single',
        0
      ),
      /transport failed/
    );
  } finally {
    if (originalFrame) globalThis.requestAnimationFrame = originalFrame;
    else delete globalThis.requestAnimationFrame;
    if (originalCancel) globalThis.cancelAnimationFrame = originalCancel;
    else delete globalThis.cancelAnimationFrame;
  }
});
