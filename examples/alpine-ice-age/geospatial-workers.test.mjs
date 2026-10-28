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

test('task runtime routes small projection batches locally with worker numerical parity', async () => {
  const {runTask} = await import('@math.gl/core/tasks');
  const {BulkProjectionWorker} = await import('@math.gl/geospatial/workers');
  const coordinates = new Float64Array([0, 0, 10, 20, 30, 40]);
  const original = coordinates.slice();
  const input = {projection: {from: 'EPSG:4326', to: 'EPSG:3857'}, coordinates};
  const routes = [];
  const local = await runTask(BulkProjectionWorker, input, {
    mainThread: {maxSize: 3, getSize: request => request.coordinates.length / 2},
    inputOwnership: 'copy', onExecution: route => routes.push(route)
  });
  const worker = await runTask(BulkProjectionWorker, input, {
    mainThread: {maxSize: 2, getSize: request => request.coordinates.length / 2},
    inputOwnership: 'copy', onExecution: route => routes.push(route)
  });
  assert.deepEqual(routes, ['main-thread', 'worker']);
  assert.deepEqual(local, worker);
  assert.deepEqual(coordinates, original);
});

test('explicit main-thread map setup matches the worker descriptor', async () => {
  const {runTask} = await import('@math.gl/core/tasks');
  const {MapSetupWorker} = await import('@math.gl/geospatial/workers');
  const description = {version: 1, id: 'local-map', definition: {type: 'mercator'}};
  const local = await runTask(MapSetupWorker, description, {execution: 'main-thread', inputOwnership: 'copy'});
  const remote = await setupMapInWorker(description);
  assert.deepEqual(MapEngine.fromPrepared(local).getLayout(), MapEngine.fromPrepared(remote).getLayout());
  assert.deepEqual(MapEngine.fromPrepared(local).projectPoint([10, 20]), MapEngine.fromPrepared(remote).projectPoint([10, 20]));
});

test('scene cancellation aborts repeated globe requests and ignores late completion', async () => {
  const {readFile} = await import('node:fs/promises');
  const {runInNewContext} = await import('node:vm');
  const {transformSync} = await import('esbuild');
  const {createMapPreparationGate} = await import('./map-preparation-gate.js');
  const source = await readFile(new URL('./global-scene.js', import.meta.url), 'utf8');
  const requests = [];
  const loading = [], progress = [], errors = [];
  const attributes = new Map();
  const module = {exports: {}};
  class Stub {setProps() {} finalize() {} observe() {} disconnect() {}}
  runInNewContext(transformSync(source, {format: 'cjs'}).code, {
    module, exports: module.exports, AbortController,
    window: {matchMedia: () => ({matches: true})},
    ResizeObserver: Stub,
    require: path => path === './prepare-map-grid.js' ? {
      prepareMapGrid: (view, step, options) => new Promise((resolve, reject) => {
        requests.push({view, ...options, resolve, reject});
      })
    } : path === './map-preparation-gate.js' ? {createMapPreparationGate} : {Deck: Stub, OrthographicView: Stub}
  });
  const canvas = {
    addEventListener() {}, removeEventListener() {},
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key)
  };
  const scene = module.exports.createGlobalScene(canvas, e => errors.push(e),
    value => loading.push(value), () => {}, value => progress.push(value));
  for (let i = 0; i < 2; i++) {
    scene.render({}, {view: 'globe'});
    const request = requests.at(-1);
    assert.equal(request.signal.aborted, false);
    assert.equal(attributes.get('aria-busy'), 'true');
    scene.cancelPreparation();
    assert.equal(request.signal.aborted, true);
    assert.equal(attributes.has('aria-busy'), false);
    assert.equal(loading.at(-1), false);
    assert.equal(progress.at(-1), null);
    const count = progress.length;
    request.onProgress({completed: 1});
    assert.equal(progress.length, count);
    // Neither a late success nor a late failure may render or report an error.
    if (i === 0) request.resolve({});
    else request.reject(new Error('late failure'));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(requests.length, i + 1);
    assert.deepEqual(errors, []);
    scene.render({}, {view: 'globe'});
    assert.equal(requests.length, i + 1, 'unrelated renders do not restart cancelled work');
    scene.retryPreparation();
  }
  scene.cancelPreparation();
  scene.finalize();
});
