// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Worker as NodeWorker} from 'node:worker_threads';
import {runWorkerTask} from '@math.gl/geospatial/workers';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import {projectionGrid} from './projection-grid.js';
import {discontinuousGrid} from './discontinuous-views.js';

function createWorker() {
  const thread = new NodeWorker(new URL('./worker-test-host.mjs', import.meta.url));
  const worker = {
    postMessage: data => thread.postMessage(data),
    terminate: () => thread.terminate(),
    onmessage: null, onerror: null, onmessageerror: null
  };
  thread.on('message', data => worker.onmessage?.({data}));
  thread.on('error', error => worker.onerror?.({message: error.message}));
  thread.on('messageerror', error => worker.onmessageerror?.(error));
  return worker;
}

test('real worker bulk projection preserves input and reports exact record progress', async () => {
  const coordinates = new Float64Array([0, 0, 10, 20, 30, 40]);
  const original = coordinates.slice();
  const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};
  const progress = [];
  const output = await runWorkerTask(createWorker, 'bulk-projection', {projection, coordinates, chunkSize: 1}, {onProgress: p => progress.push(p)});
  assert.deepEqual(output, new FullProjectionEngine().createProjection(projection).projectFlatSync(original.slice()));
  assert.deepEqual(coordinates, original);
  assert.deepEqual(progress.filter(p => p.phase === 'bulk-projection').map(p => p.completed), [0, 1, 2, 3]);
});

test('real worker cancellation during setup and bulk work leaves inputs usable', async () => {
  for (const operation of ['map-setup', 'bulk-projection']) {
    const controller = new AbortController();
    const coordinates = new Float64Array(20000);
    const input = operation === 'map-setup'
      ? {version: 1, id: 'cancel', definition: {type: 'myriahedral', preset: 'sealine', columns: 48}}
      : {projection: {to: 'EPSG:3857'}, coordinates, chunkSize: 1};
    let progressCount = 0;
    await assert.rejects(runWorkerTask(createWorker, operation, input, {
      signal: controller.signal,
      onProgress: p => {
        progressCount++;
        if (operation === 'map-setup' || p.phase === 'bulk-projection') controller.abort();
      }
    }), {name: 'AbortError'});
    assert(progressCount > 0);
    assert.equal(coordinates.byteLength, 160000);
  }
});

test('real worker errors propagate and a subsequent independent job succeeds', async () => {
  await assert.rejects(runWorkerTask(createWorker, 'unknown', {}), /Unknown worker operation/);
  const snapshot = await runWorkerTask(createWorker, 'map-setup', {version: 1, id: 'mercator', definition: {type: 'mercator'}});
  const map = MapEngine.fromPrepared(snapshot);
  assert(map.projectPoint([10, 20]));
});

test('explorer worker grids match synchronous geometry, including hinged maps', async () => {
  for (const view of ['eqearth', 'albersEurope', 'globe']) {
    const actual = await runWorkerTask(createWorker, 'projection-grid', {view});
    assert.deepEqual(actual, projectionGrid(view));
  }
  for (const view of ['butterfly', 'myriahedral:cube']) {
    const progress = [];
    const actual = await runWorkerTask(createWorker, 'map-grid', {view, step: 30}, {onProgress: p => progress.push(p)});
    const {map, ...expected} = discontinuousGrid(view, 30);
    const {preparedMap, ...grid} = actual;
    assert.deepEqual(grid, expected);
    const restored = MapEngine.fromPrepared(preparedMap);
    assert.deepEqual(restored.projectPoint([10, 20]), map.projectPoint([10, 20]));
    if (map.motion) assert.deepEqual(restored.motion.evaluate(0.5), map.motion.evaluate(0.5));
    assert(progress.some(p => p.phase === 'map-setup'));
    assert(progress.some(p => p.phase === 'map-grid' && p.completed === p.total));
  }
});
