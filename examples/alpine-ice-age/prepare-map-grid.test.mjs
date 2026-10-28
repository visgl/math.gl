// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareMapGrid} from './prepare-map-grid.js';
import {discontinuousGrid} from './discontinuous-views.js';

test('worker preparation restores geometry, caches success and propagates cancellation and failure', async () => {
  const original = globalThis.Worker;
  globalThis.Worker = class {};
  const jobs = [];
  const runTask = (descriptor, input, {signal, onProgress}) => new Promise((resolve, reject) => {
    const job = {descriptor, input, resolve, reject, onProgress};
    jobs.push(job);
    signal?.addEventListener('abort', () => reject(signal.reason), {once: true});
  });
  try {
    const progress = [];
    const pending = prepareMapGrid('butterfly', 30, {runTask, onProgress: p => progress.push(p)});
    assert.deepEqual(jobs[0].input, {view: 'butterfly', step: 30, discontinuous: true});
    jobs[0].onProgress({phase: 'map-grid', completed: 1, unit: 'chunks'});
    const {map, ...data} = discontinuousGrid('butterfly', 30);
    jobs[0].resolve(structuredClone({...data, preparedMap: map.toPrepared()}));
    const result = await pending;
    assert.deepEqual(result.positions, data.positions);
    assert.equal(result.map.description.id, 'butterfly');
    assert(result.map.projectPoint([0, 30]));
    assert.equal(progress.length, 1);
    assert.strictEqual(await prepareMapGrid('butterfly', 30, {runTask}), result);
    assert.equal(jobs.length, 1);

    const controller = new AbortController();
    const aborted = prepareMapGrid('guyou', 30, {signal: controller.signal, runTask});
    controller.abort();
    await assert.rejects(aborted, {name: 'AbortError'});
    const failed = prepareMapGrid('waterman', 30, {runTask});
    jobs.at(-1).reject(new Error('Geometry failed'));
    await assert.rejects(failed, /Geometry failed/);
  } finally {
    if (original === undefined) delete globalThis.Worker;
    else globalThis.Worker = original;
  }
});
