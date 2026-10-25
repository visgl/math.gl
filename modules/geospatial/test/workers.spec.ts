// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {runWorkerTask, type WorkerTaskContext} from '../src/workers';
import {projectBulk} from '../src/workers/operations';
import {FullProjectionEngine} from '../src/projection';
import {MapEngine, type MapDefinition} from '../src/discontinuous';

function fakeWorker() {
  return {
    onmessage: null,
    onerror: null,
    onmessageerror: null,
    terminated: false,
    message: null,
    postMessage(message) {
      this.message = message;
    },
    terminate() {
      this.terminated = true;
    }
  };
}

test('worker task progress, completion and cleanup', async () => {
  const worker = fakeWorker();
  const progress = [];
  const pending = runWorkerTask(
    () => worker as unknown as Worker,
    'test',
    {},
    {onProgress: p => progress.push(p)}
  );
  worker.onmessage({data: {type: 'progress', progress: {phase: 'test', completed: 2, total: 3}}});
  expect(worker.terminated).toBe(false);
  worker.onmessage({data: {type: 'result', result: 42}});
  expect(await pending).toBe(42);
  expect(progress).toEqual([{phase: 'test', completed: 2, total: 3}]);
  expect(worker.terminated).toBe(true);
  expect(worker.onmessage).toBeNull();
});

test('abort, stale replies and callback failures settle once and terminate', async () => {
  const worker = fakeWorker(),
    controller = new AbortController();
  const pending = runWorkerTask(
    () => worker as unknown as Worker,
    'test',
    {},
    {signal: controller.signal}
  );
  const stale = worker.onmessage;
  controller.abort();
  stale({data: {type: 'result', result: 42}});
  await expect(pending).rejects.toMatchObject({name: 'AbortError'});
  expect(worker.terminated).toBe(true);
  let created = false;
  await expect(
    runWorkerTask(
      () => {
        created = true;
        return worker as unknown as Worker;
      },
      'test',
      {},
      {signal: controller.signal}
    )
  ).rejects.toMatchObject({name: 'AbortError'});
  expect(created).toBe(false);
  const other = fakeWorker();
  const failed = runWorkerTask(
    () => other as unknown as Worker,
    'test',
    {},
    {
      onProgress: () => {
        throw new Error('callback');
      }
    }
  );
  other.onmessage({data: {type: 'progress', progress: {phase: 'test', completed: 0}}});
  await expect(failed).rejects.toThrow('callback');
  expect(other.terminated).toBe(true);
});

test('posting, loading and deserialization failures terminate', async () => {
  for (const failure of ['post', 'load', 'deserialize']) {
    const worker = fakeWorker();
    if (failure === 'post')
      worker.postMessage = () => {
        throw new Error('clone failed');
      };
    const result = runWorkerTask(() => worker as unknown as Worker, 'test', {});
    if (failure === 'load') worker.onerror({message: 'load failed'});
    if (failure === 'deserialize') worker.onmessageerror({});
    await expect(result).rejects.toThrow();
    expect(worker.terminated).toBe(true);
  }
});

test('chunked bulk projection matches synchronous XY/XYZM and inverse, including subviews', async () => {
  for (const Type of [Float32Array, Float64Array]) {
    const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};
    const engine = new FullProjectionEngine().createProjection(projection);
    const input = new Type([999, 0, 0, 12, 5, 10, 20, 13, 6, 30, 40, 14, 7, 999]);
    const coordinates = input.subarray(1, 13);
    const expected = engine.projectFlatSync(coordinates.slice(), 4);
    const progress = [];
    let yields = 0;
    const context: WorkerTaskContext = {
      report: p => progress.push(p),
      yieldTask: async () => {
        yields++;
      }
    };
    expect(
      await projectBulk({projection, coordinates, dimension: 4, chunkSize: 2}, context)
    ).toEqual(expected);
    expect(input[0]).toBe(999);
    expect(input[13]).toBe(999);
    expect(yields).toBe(2);
    expect(progress.filter(p => p.phase === 'bulk-projection').map(p => p.completed)).toEqual([
      0, 2, 3
    ]);
    const inverse = engine.unprojectFlatSync(expected.slice(), 4);
    expect(
      await projectBulk(
        {projection, coordinates, dimension: 4, inverse: true, chunkSize: 1},
        context
      )
    ).toEqual(inverse);
    await expect(projectBulk({projection, coordinates, chunkSize: 0}, context)).rejects.toThrow();
    await expect(projectBulk({projection, coordinates: new Type(3)}, context)).rejects.toThrow();
    expect(await projectBulk({projection, coordinates: new Type(0)}, context)).toHaveLength(0);
  }
});

test('worker map snapshots preserve layouts, inverse mapping and hinge poses without callbacks', () => {
  for (const definition of [
    {type: 'mercator'},
    {type: 'myriahedral', preset: 'sealine', columns: 12}
  ]) {
    let calls = 0;
    const original = new MapEngine(
      {version: 1, id: 'test', radius: 2, definition: definition as MapDefinition},
      {
        isLand: () => {
          calls++;
          return true;
        }
      }
    );
    const prepared = structuredClone(original.toPrepared());
    const before = calls;
    const restored = MapEngine.fromPrepared(prepared);
    expect(calls).toBe(before);
    expect(restored.getLayout()).toEqual(original.getLayout());
    expect(restored.capabilities).toEqual(original.capabilities);
    const p = original.projectPoint([23, 35]);
    expect(restored.projectPoint([23, 35])).toEqual(p);
    expect(restored.unprojectPoint(p.position, p.regionId)).toEqual(
      original.unprojectPoint(p.position, p.regionId)
    );
    if (original.motion)
      for (const amount of [0, 0.4, 1]) {
        expect(
          restored.evaluate({type: 'hinge', amount}).projectPlacedPoint(p.position, p.regionId)
        ).toEqual(
          original.evaluate({type: 'hinge', amount}).projectPlacedPoint(p.position, p.regionId)
        );
      }
  }
});
