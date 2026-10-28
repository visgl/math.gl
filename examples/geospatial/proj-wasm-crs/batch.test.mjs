// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjWasmBatchProcessor, createLatestBatchRunner} from './batch.mjs';
const config = {sourceCRS: 'EPSG:4326', targetCRS: 'EPSG:8857', chunkSize: 2};
const batch = () => ({positions: new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), sourceRowIndices: new Uint32Array([2, 5, 8])});
function mock(overrides = {}) {
  const calls = [];
  const proj = {
    PJ_FWD: 1, PJ_INV: -1,
    contextCreate: async () => {calls.push('context'); return 'ctx';},
    projContextSetEnableNetwork: async ({enabled}) => {assert.equal(enabled, 0);},
    projCreateCrsToCrs: async () => {calls.push('operation'); return 'op';},
    projNormalizeForVisualization: async () => 'normalized',
    coordArray: async n => Array.from({length: n}, () => [0, 0, 0, 0]),
    setCoords: async (coords, values) => values.forEach((p, i) => {coords[i] = p;}),
    projTransArray: async ({coord, direction, n}) => {calls.push(n); coord.forEach(p => {p[0] += 10 * direction;}); return 0;},
    getCoords: async (coords, i) => coords[i],
    projDestroy: async ({pj}) => {calls.push(`destroy:${pj}`);},
    projContextDestroy: async () => {calls.push('destroy:ctx');}, ...overrides
  };
  return {proj, calls};
}
test('reuses one operation, chunks batches, preserves rows and snapshots queued input', async () => {
  const {proj, calls} = mock(), processor = await createProjWasmBatchProcessor(proj, config);
  const input = batch(), pending = processor.transform(input);
  input.positions.fill(99); input.sourceRowIndices.fill(99);
  const projected = await pending;
  assert.deepEqual(Array.from(projected.positions), [11, 2, 3, 14, 5, 6, 17, 8, 9]);
  assert.deepEqual(Array.from(projected.sourceRowIndices), [2, 5, 8]);
  assert.deepEqual(Array.from((await processor.transform(projected, {direction: 'inverse'})).positions), Array.from(batch().positions));
  assert.equal(calls.filter(x => x === 'operation').length, 1);
  assert.deepEqual(calls.filter(Number.isInteger), [2, 1, 2, 1]);
  const a = processor.dispose(), b = processor.dispose(); assert.equal(a, b); await a;
  assert.deepEqual(calls.slice(-3), ['destroy:normalized', 'destroy:op', 'destroy:ctx']);
  await assert.rejects(processor.transform(batch()), /disposed/);
});
test('input limits and empty batches are explicit', async () => {
  for (const options of [{...config, chunkSize: 0}, {...config, maxPoints: Infinity}, {...config, sourceCRS: ''}])
    await assert.rejects(createProjWasmBatchProcessor(mock().proj, options));
  const processor = await createProjWasmBatchProcessor(mock().proj, {...config, maxPoints: 3});
  try {
    for (const input of [{...batch(), positions: new Float32Array(9)}, {...batch(), positions: new Float64Array([1])},
      {...batch(), positions: new Float64Array([NaN, 0, 0])}, {...batch(), sourceRowIndices: new Uint32Array(1)},
      {positions: new Float64Array(12), sourceRowIndices: new Uint32Array(4)}]) await assert.rejects(processor.transform(input));
    await assert.rejects(processor.transform(batch(), {direction: 'bad'}));
    const result = await processor.transform({positions: new Float64Array(), sourceRowIndices: new Uint32Array()});
    assert.equal(result.positions.length, 0);
  } finally {await processor.dispose();}
});
test('native failures and nonfinite output reject whole batches without poisoning reuse', async () => {
  let fail = true;
  const {proj} = mock({projTransArray: async () => fail ? 12 : 0});
  const processor = await createProjWasmBatchProcessor(proj, config);
  try {
    await assert.rejects(processor.transform(batch()), /failed/); fail = false;
    assert.equal((await processor.transform(batch())).positions.length, 9);
    proj.getCoords = async () => [Infinity, 0, 0];
    await assert.rejects(processor.transform(batch()), /invalid coordinates/);
  } finally {await processor.dispose();}
});
test('dispose waits for accepted work and rejects new requests immediately', async () => {
  let release, started;
  const gate = new Promise(r => {release = r;}), entered = new Promise(r => {started = r;});
  const {proj, calls} = mock({projTransArray: async () => {started(); await gate; return 0;}});
  const processor = await createProjWasmBatchProcessor(proj, config), pending = processor.transform(batch());
  await entered;
  const closing = processor.dispose();
  assert.ok(!calls.includes('destroy:ctx'));
  await assert.rejects(processor.transform(batch()), /disposed/);
  release(); await pending; await closing;
  assert.equal(calls.at(-1), 'destroy:ctx');
});
test('initialization and disposal attempt all owned resource cleanup', async () => {
  const {proj, calls} = mock({projNormalizeForVisualization: async () => {throw new Error('init');}});
  await assert.rejects(createProjWasmBatchProcessor(proj, config), /init/);
  assert.deepEqual(calls.slice(-2), ['destroy:op', 'destroy:ctx']);
  const second = mock();
  const processor = await createProjWasmBatchProcessor(second.proj, config);
  second.proj.projDestroy = async ({pj}) => {second.calls.push(`destroy:${pj}`); if (pj === 'normalized') throw new Error('cleanup');};
  await assert.rejects(processor.dispose(), /cleanup/);
  assert.deepEqual(second.calls.slice(-3), ['destroy:normalized', 'destroy:op', 'destroy:ctx']);
});
test('latest-view requests discard stale success/errors and cancellation stops publication', async () => {
  const queue = [];
  const processor = {transform: () => new Promise((resolve, reject) => queue.push({resolve, reject}))};
  const latest = createLatestBatchRunner(processor);
  const first = latest.run(batch()), second = latest.run(batch());
  queue[1].resolve('current'); queue[0].reject(new Error('old failure'));
  assert.equal(await second, 'current'); assert.equal(await first, null);
  const third = latest.run(batch()); latest.cancel(); queue[2].resolve('obsolete'); assert.equal(await third, null);
  const fourth = latest.run(batch()); queue[3].reject(new Error('current failure')); await assert.rejects(fourth, /current failure/);
});
test('abort between native calls discards partial output', async () => {
  const controller = new AbortController(); let count = 0;
  const {proj} = mock({projTransArray: async () => {count++; controller.abort(new Error('cancelled')); return 0;}});
  const processor = await createProjWasmBatchProcessor(proj, config);
  try {await assert.rejects(processor.transform(batch(), {signal: controller.signal}), /cancelled/); assert.equal(count, 1);}
  finally {await processor.dispose();}
});

test('latest runner honors pre-aborted and in-flight caller signals and removes listeners', async () => {
  const calls = [];
  const latest = createLatestBatchRunner({transform: (input, options) => new Promise(resolve => calls.push({resolve, signal: options.signal}))});
  const early = new AbortController(), earlyReason = new Error('already cancelled'); early.abort(earlyReason);
  await assert.rejects(latest.run(batch(), {signal: early.signal}), error => error === earlyReason);
  assert.equal(calls.length, 0);
  const caller = new AbortController(), reason = new Error('view unmounted');
  let added = 0, removed = 0;
  const add = caller.signal.addEventListener.bind(caller.signal), remove = caller.signal.removeEventListener.bind(caller.signal);
  caller.signal.addEventListener = (...args) => {added++; return add(...args);};
  caller.signal.removeEventListener = (...args) => {removed++; return remove(...args);};
  const pending = latest.run(batch(), {signal: caller.signal});
  caller.abort(reason);
  assert.equal(calls[0].signal.reason, reason);
  // Even a processor that completes despite cooperative cancellation cannot publish.
  calls[0].resolve('cancelled output');
  await assert.rejects(pending, error => error === reason);
  assert.equal(added, 1); assert.equal(removed, 1);
  const oldCaller = new AbortController();
  const old = latest.run(batch(), {signal: oldCaller.signal}), current = latest.run(batch());
  oldCaller.abort();
  assert.equal(calls[2].signal.aborted, false);
  calls[1].resolve('stale'); calls[2].resolve('new');
  assert.equal(await old, null); assert.equal(await current, 'new');
});
