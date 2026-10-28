// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {projectBulkInWorker, setupMapInWorker} from '@math.gl/geospatial/workers';
import {NullWorker, processOnWorker} from '@math.gl/core/worker-utils';

test('packaged null worker uses the shared protocol', async () => {
  assert.equal(await processOnWorker(NullWorker, 'hello'), 'hello');
});

test('pooled explorer worker retains cached grids after their results are transferred', async () => {
  const worker = {id: 'ice-grid-test', name: 'ice-grid-test', module: 'geospatial', version: 'latest',
    worker: new URL('./discontinuous-grid-worker.js', import.meta.url).href, options: {}};
  for (const [view, discontinuous] of [['eqearth', false], ['butterfly', true]]) {
    const input = {view, step: 30, discontinuous};
    const first = await processOnWorker(worker, input, {maxConcurrency: 1, reuseWorkers: true});
    const second = await processOnWorker(worker, input, {maxConcurrency: 1, reuseWorkers: true});
    assert(first.positions.length > 0);
    assert.deepEqual(second.positions, first.positions);
    assert.deepEqual(second.indices, first.indices);
  }
});

test('packaged bulk worker returns projected data and preserves copied input', async () => {
  const coordinates = new Float64Array([0, 0, 10, 20, 30, 40]);
  const original = coordinates.slice();
  const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};
  const progress = [];
  const result = await projectBulkInWorker({projection, coordinates, chunkSize: 1}, {onProgress: p => progress.push(p)});
  assert.deepEqual(result, new FullProjectionEngine().createProjection(projection).projectFlatSync(original.slice()));
  assert.deepEqual(coordinates, original);
  assert(progress.some(p => p.phase === 'bulk-projection' && p.completed === 3 && p.total === 3));
});

test('packaged map worker restores myriahedral state and reports progress', async () => {
  const description = {version: 1, id: 'world', definition: {type: 'myriahedral', preset: 'polyconic', columns: 12}};
  const progress = [];
  const snapshot = await setupMapInWorker(description, {onProgress: p => progress.push(p)});
  const restored = MapEngine.fromPrepared(snapshot);
  const direct = new MapEngine(description);
  assert.deepEqual(restored.getLayout(), direct.getLayout());
  assert.deepEqual(restored.projectPoint([10, 20]), direct.projectPoint([10, 20]));
  assert.deepEqual(restored.motion.evaluate(0.5), direct.motion.evaluate(0.5));
  assert(progress.some(p => p.phase === 'map-setup' && p.completed === 1));
});

test('cancelling a running bulk job preserves copied input', async () => {
  const controller = new AbortController();
  const coordinates = new Float64Array(100000);
  await assert.rejects(projectBulkInWorker({projection: {to: 'EPSG:3857'}, coordinates, chunkSize: 1}, {
    signal: controller.signal,
    onProgress: p => {if (p.phase === 'bulk-projection') controller.abort();}
  }), {name: 'AbortError'});
  assert.equal(coordinates.byteLength, 800000);
});

test('cached projection grids skip reprojecting and emit completed progress', async () => {
  const {prepareProjectionGrid, cacheProjectionGrid} = await import('./projection-grid.js');
  const cached = {positions: new Float32Array([1, 2]), indices: new Uint32Array([0])};
  cacheProjectionGrid('cached-test', cached);
  const progress = [];
  // An unknown projection would fail if preparation did not return before projection setup.
  const result = await prepareProjectionGrid('cached-test', {reportProgress: p => progress.push(p)});
  assert.equal(result, cached);
  assert.deepEqual(progress, [{phase: 'projection-grid', completed: 1, total: 1, unit: 'tasks'}]);
});

test('bulk projection publishes progress in optional shared control state', async () => {
  const {createSharedWorkerState} = await import('@math.gl/core/worker-utils');
  const state = createSharedWorkerState();
  assert(state);
  await projectBulkInWorker({projection: {to: 'EPSG:3857'}, coordinates: new Float64Array([0, 0, 10, 20])},
    {sharedState: state.buffer, cancellationMode: 'cooperative'});
  assert.equal(state.snapshot.completed, 2);
  assert.equal(state.snapshot.total, 2);
});
