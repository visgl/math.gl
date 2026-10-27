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
