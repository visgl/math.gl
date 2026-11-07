// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {TaskRunner} from '@math.gl/core/tasks';
import {ProjectCoordinatesTask, PrepareMapTask} from '@math.gl/geospatial/tasks';
const gridTask = {
  id: 'ice-age-grid',
  worker: {
    url: new URL('../../../../examples/geospatial/alpine-ice-age/src/discontinuous-grid-worker.js', import.meta.url),
    capabilities: {atomic: true, streaming: false}
  }
};

test('initialized explorer task retains cached grids after results transfer', async () => {
  const runner = new TaskRunner();
  const handle = await runner.initializeTask(gridTask, {});
  try {
    for (const [view, discontinuous] of [
      ['eqearth', false],
      ['butterfly', true]
    ]) {
      const input = {view, step: 30, discontinuous};
      const first = await handle.runTask(input);
      const second = await handle.runTask(input);
      assert(first.positions.length > 0);
      assert.deepEqual(second.positions, first.positions);
      assert.deepEqual(second.indices, first.indices);
    }
  } finally {
    await runner.close();
  }
});

test('grid cancellation terminates state and a fresh task can run', async () => {
  const runner = new TaskRunner();
  const controller = new AbortController();
  try {
    await assert.rejects(
      runner.runTask(
        gridTask,
        {view: 'butterfly', step: 1, discontinuous: true},
        {
          signal: controller.signal,
          onProgress: () => controller.abort(new Error('stop grid'))
        }
      ),
      /stop grid/
    );
    const result = await runner.runTask(gridTask, {
      view: 'butterfly',
      step: 30,
      discontinuous: true
    });
    assert(result.positions.length > 0);
  } finally {
    await runner.close();
  }
});

test('provided projection task preserves input and reports progress with local/worker parity', async () => {
  const runner = new TaskRunner();
  const coordinates = new Float64Array([0, 0, 10, 20, 30, 40]);
  const original = coordinates.slice();
  const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};
  const progress = [];
  try {
    const remote = await runner.runTask(
      ProjectCoordinatesTask,
      {projection, coordinates},
      {options: {chunkSize: 1}, onProgress: p => progress.push(p)}
    );
    const local = await runner.runTask(
      ProjectCoordinatesTask,
      {projection, coordinates},
      {execution: 'main-thread'}
    );
    assert.deepEqual(remote, local);
    assert.deepEqual(
      remote.coordinates,
      new FullProjectionEngine().createProjection(projection).projectFlatSync(original.slice())
    );
    assert.deepEqual(coordinates, original);
    assert(progress.some(p => p.phase === 'bulk-projection' && p.completed === 3 && p.total === 3));
  } finally {
    await runner.close();
  }
});

test('provided map task restores myriahedral state and reports progress', async () => {
  const runner = new TaskRunner();
  const description = {
    version: 1,
    id: 'world',
    definition: {type: 'myriahedral', preset: 'polyconic', columns: 12}
  };
  const progress = [];
  try {
    const {map} = await runner.runTask(
      PrepareMapTask,
      {description},
      {onProgress: p => progress.push(p)}
    );
    const restored = MapEngine.fromPrepared(map),
      direct = new MapEngine(description);
    assert.deepEqual(restored.getLayout(), direct.getLayout());
    assert.deepEqual(restored.projectPoint([10, 20]), direct.projectPoint([10, 20]));
    assert.deepEqual(restored.motion.evaluate(0.5), direct.motion.evaluate(0.5));
    assert(progress.some(p => p.phase === 'map-setup' && p.completed === 1));
  } finally {
    await runner.close();
  }
});

test('cancelling a running projection preserves copied input', async () => {
  const runner = new TaskRunner();
  const controller = new AbortController();
  const coordinates = new Float64Array(100000);
  try {
    await assert.rejects(
      runner.runTask(
        ProjectCoordinatesTask,
        {projection: {to: 'EPSG:3857'}, coordinates},
        {
          options: {chunkSize: 1},
          signal: controller.signal,
          onProgress: p => {
            if (p.phase === 'bulk-projection') controller.abort();
          }
        }
      ),
      {name: 'AbortError'}
    );
    assert.equal(coordinates.byteLength, 800000);
  } finally {
    await runner.close();
  }
});

test('cached projection grids skip reprojecting and emit completed progress', async () => {
  const {prepareProjectionGrid, cacheProjectionGrid} = await import('../../../../examples/geospatial/alpine-ice-age/src/projection-grid.js');
  const cached = {positions: new Float32Array([1, 2]), indices: new Uint32Array([0])};
  cacheProjectionGrid('cached-test', cached);
  const progress = [];
  // An unknown projection would fail if preparation did not return before projection setup.
  const result = await prepareProjectionGrid('cached-test', {
    reportProgress: p => progress.push(p)
  });
  assert.equal(result, cached);
  assert.deepEqual(progress, [{phase: 'projection-grid', completed: 1, total: 1, unit: 'tasks'}]);
});

test('scene cancellation aborts repeated globe requests and ignores late completion', async () => {
  const {readFile} = await import('node:fs/promises');
  const {runInNewContext} = await import('node:vm');
  const {transformSync} = await import('esbuild');
  const {createMapPreparationGate} = await import('../../../../examples/geospatial/alpine-ice-age/src/map-preparation-gate.js');
  const source = await readFile(new URL('../../../../examples/geospatial/alpine-ice-age/src/global-scene.js', import.meta.url), 'utf8');
  const requests = [];
  const loading = [],
    progress = [],
    errors = [];
  const attributes = new Map();
  const module = {exports: {}};
  let terminated = false;
  class Stub {
    setProps() {}
    finalize() {}
    observe() {}
    disconnect() {}
  }
  runInNewContext(transformSync(source, {format: 'cjs'}).code, {
    module,
    exports: module.exports,
    AbortController,
    window: {matchMedia: () => ({matches: true})},
    ResizeObserver: Stub,
    require: path =>
      path === './prepare-map-grid.js'
        ? {
            createMapGridPreparer: () => ({
              prepare: (view, step, options) =>
                new Promise((resolve, reject) => {
                  requests.push({view, ...options, resolve, reject});
                }),
              terminate: async () => {
                terminated = true;
              }
            })
          }
        : path === './map-preparation-gate.js'
          ? {createMapPreparationGate}
          : {Deck: Stub, OrthographicView: Stub}
  });
  const canvas = {
    addEventListener() {},
    removeEventListener() {},
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key)
  };
  const scene = module.exports.createGlobalScene(
    canvas,
    e => errors.push(e),
    value => loading.push(value),
    () => {},
    value => progress.push(value)
  );
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
  await scene.finalize();
  assert.equal(terminated, true);
});

test('scene preparer retains its worker and replaces it after cancellation', async () => {
  const {createMapGridPreparer} = await import('../../../../examples/geospatial/alpine-ice-age/src/prepare-map-grid.js');
  class RecordingRunner extends TaskRunner {
    initialized = 0;
    initializeTask(...args) {
      this.initialized++;
      return super.initializeTask(...args);
    }
  }
  const runner = new RecordingRunner();
  const preparer = createMapGridPreparer({runner, task: gridTask, useWorker: true});
  try {
    assert((await preparer.prepare('butterfly', 20)).positions.length > 0);
    assert((await preparer.prepare('waterman', 20)).positions.length > 0);
    assert.equal(runner.initialized, 1, 'different preparations reuse the initialized worker');
    const controller = new AbortController();
    await assert.rejects(
      preparer.prepare('guyou', 1, {
        signal: controller.signal,
        onProgress: () => controller.abort(new Error('stop retained grid'))
      }),
      /stop retained grid/
    );
    assert((await preparer.prepare('butterfly', 15)).positions.length > 0);
    assert.equal(runner.initialized, 2, 'cancelled worker state is recreated');
  } finally {
    await preparer.terminate();
  }
  await assert.rejects(preparer.prepare('butterfly', 20), /closed/);
  await preparer.terminate();
  await assert.rejects(runner.initializeTask(gridTask, {}), /closed/);
});
