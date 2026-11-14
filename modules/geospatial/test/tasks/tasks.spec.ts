// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
const isBrowser = typeof process === 'undefined' || !process.versions?.node;
import {TaskRunner, preloadTasks} from '@math.gl/tasks';
import {
  ProjectCoordinatesTask,
  PrepareMapTask,
  CertifyTerrainCoverageTask
} from '@math.gl/geospatial/tasks';
import {MapEngine} from '@math.gl/geospatial/maps/map-engine';

const initialization = {projection: {from: 'EPSG:4326', to: 'EPSG:3857'}};
const input = () => ({coordinates: new Float64Array([0, 0, 10, 20])});

for (const execution of ['main-thread', 'worker'] as const) {
  test(`provided projection task supports all execution shapes on ${execution}`, async () => {
    const runner = new TaskRunner({maxConcurrency: 2});
    // Package assets are used in Node. Browser tests compile the source entry.
    const task = !isBrowser
      ? {
          ...ProjectCoordinatesTask,
          worker: {
            url: new URL('../../dist/tasks/projection-worker.js', import.meta.url),
            capabilities: {atomic: true, streaming: true}
          }
        }
      : {
          ...ProjectCoordinatesTask,
          worker: {
            create: () =>
              new Worker(new URL('../../src/tasks/projection-worker.ts', import.meta.url), {
                type: 'module'
              }),
            capabilities: {atomic: true, streaming: true}
          }
        };
    try {
      await preloadTasks([task], {execution});
      const original = input();
      const result = await runner.runTask(task, {...original, ...initialization}, {execution});
      expect([...original.coordinates]).toEqual([0, 0, 10, 20]);
      expect(result.coordinates[2]).toBeCloseTo(1113194.9079, 3);
      expect(result.coordinates[3]).toBeCloseTo(2273030.927, 3);
      const outputs = [];
      for await (const output of runner.runTasks(task, [input(), input()], {
        initialization,
        execution,
        concurrency: 2
      }))
        outputs.push(output);
      expect(outputs).toEqual([result, result]);
      const handle = await runner.initializeTask(task, initialization, {execution});
      const stream = [];
      for await (const output of handle.runTaskInBatches([input(), input()])) stream.push(output);
      expect(stream).toEqual([result, result]);
      const restored = await handle.runTask({coordinates: result.coordinates, inverse: true});
      expect(restored.coordinates[2]).toBeCloseTo(10, 8);
      expect(restored.coordinates[3]).toBeCloseTo(20, 8);
      await handle.close();
    } finally {
      await runner.close();
    }
  });

  test(`provided map task returns a restorable snapshot on ${execution}`, async () => {
    const runner = new TaskRunner();
    const task = !isBrowser
      ? {
          ...PrepareMapTask,
          worker: {
            url: new URL('../../dist/tasks/map-worker.js', import.meta.url),
            capabilities: {atomic: true, streaming: false}
          }
        }
      : {
          ...PrepareMapTask,
          worker: {
            create: () =>
              new Worker(new URL('../../src/tasks/map-worker.ts', import.meta.url), {
                type: 'module'
              }),
            capabilities: {atomic: true, streaming: false}
          }
        };
    try {
      await preloadTasks([task], {execution});
      const {map} = await runner.runTask(
        task,
        {description: {version: 1, id: 'world', definition: {type: 'mercator'}}},
        {execution}
      );
      expect(
        MapEngine.fromPrepared(map, {
          presets: mapPresets,
          geometry: mapGeometry,
          transitions: mapTransitions
        }).toPrepared()
      ).toEqual(map);
    } finally {
      await runner.close();
    }
  });
}

import {mapPresets, mapGeometry, mapTransitions} from '@math.gl/geospatial/maps';

test('coverage worker returns the same certificate as direct task execution', async () => {
  const runner = new TaskRunner();
  const task = {
    ...CertifyTerrainCoverageTask,
    worker: {
      ...(isBrowser
        ? {
            create: () =>
              new Worker(new URL('../../src/tasks/terrain-coverage-worker.ts', import.meta.url), {
                type: 'module'
              })
          }
        : {url: new URL('../../dist/tasks/terrain-coverage-worker.js', import.meta.url)}),
      capabilities: {atomic: true, streaming: false}
    }
  };
  const input = {
    field: {width: 2, height: 2, heights: new Float32Array(4)},
    mesh: {
      gridCoordinates: new Float64Array([0, 0, 1, 0, 0, 1, 1, 1]),
      indices: new Uint32Array([0, 1, 2, 1, 3, 2])
    }
  };
  try {
    const direct = await runner.runTask(task, input, {execution: 'main-thread'});
    expect(direct.status).toBe('certified');
    expect(await runner.runTask(task, input, {execution: 'worker'})).toEqual(direct);
  } finally {
    await runner.close();
  }
});
