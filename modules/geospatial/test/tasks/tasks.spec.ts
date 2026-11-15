// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
const isBrowser = typeof process === 'undefined' || !process.versions?.node;
import {TaskRunner, preloadTasks} from '@math.gl/tasks';
import {
  ProjectCoordinatesTask,
  PrepareMapTask,
  CertifyTerrainCoverageTask,
  TerrainResidencyTask
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

test('terrain residency reports stage timings only for measured commits', async () => {
  const runner = new TaskRunner();
  try {
    const handle = await runner.initializeTask(
      TerrainResidencyTask,
      {},
      {execution: 'main-thread'}
    );
    const address = {column: 0, row: 0, spacing: 1};
    const tile = {...address, field: {width: 2, height: 2, heights: new Float64Array(4)}};
    const initial = await handle.runTask({revision: 0, edits: [{type: 'upsert', tile}]});
    expect(initial.timings).toBeUndefined();

    const measured = await handle.runTask({
      revision: 1,
      measureStages: true,
      edits: [{type: 'samples', address, samples: [{index: 0, height: 2}]}]
    });
    expect(measured.revision).toBe(2);
    expect(measured.tiles[0].field.heights[5]).toBe(2);
    const {applyEditsMs, updateHalosMs, prepareDeltaMs, processMs} = measured.timings!;
    for (const duration of [applyEditsMs, updateHalosMs, prepareDeltaMs]) {
      expect(Number.isFinite(duration)).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(0);
    }
    expect(processMs).toBeCloseTo(applyEditsMs + updateHalosMs + prepareDeltaMs, 8);
    const stale = await handle.runTask({revision: 1, measureStages: true, edits: []});
    expect(stale.timings).toBeUndefined();
    expect(stale.error).toMatch(/Stale/);
  } finally {
    await runner.close();
  }
});

for (const ArrayType of [Float32Array, Float64Array]) {
  test(`resident sample transactions preserve strided ${ArrayType.name} data and rollback`, async () => {
    const {createTerrainMixedVertexTileHalos} = await import('@math.gl/geospatial/terrain');
    const runner = new TaskRunner();
    const handle = await runner.initializeTask(
      TerrainResidencyTask,
      {},
      {execution: 'main-thread'}
    );
    const address = {column: 0, row: 0, spacing: 1};
    const otherAddress = {column: 1, row: 0, spacing: 1};
    const tile = {
      ...address,
      field: {
        width: 2,
        height: 2,
        offset: 1,
        stride: 3,
        heights: new ArrayType([99, 1, NaN, 99, 3, 4]),
        validity: new Uint8Array([1, 1, 1, 1, 0, 1])
      }
    };
    try {
      await handle.runTask({revision: 0, edits: [{type: 'upsert', tile}]});
      const retained = await handle.runTask({type: 'snapshot'});
      const update = await handle.runTask({
        revision: 1,
        edits: [
          {type: 'samples', address, samples: [{index: 1, height: 2}]},
          {type: 'samples', address, samples: [{index: 3, height: null}]}
        ]
      });
      expect(update.error).toBeUndefined();
      const expected = {
        ...address,
        field: {width: 2, height: 2, heights: new ArrayType([1, 2, NaN, NaN])}
      };
      expect(update.tiles).toEqual(createTerrainMixedVertexTileHalos([expected]).tiles);
      expect(retained.tiles).toEqual(createTerrainMixedVertexTileHalos([tile]).tiles);
      const saved = await handle.runTask({type: 'snapshot'});
      const invalid = await handle.runTask({
        revision: 2,
        edits: [
          {type: 'samples', address, samples: [{index: 0, height: 77}]},
          {type: 'samples', address, samples: [{index: 4, height: 77}]}
        ]
      });
      expect(invalid.error).toMatch(/Invalid/);
      expect(await handle.runTask({type: 'snapshot'})).toEqual(saved);
      // Switch from the indexed sample path to a structural transaction midway.
      const other = {
        ...otherAddress,
        field: {
          width: 2,
          height: 2,
          origin: [1, 0] as [number, number],
          heights: new ArrayType([5, 6, 7, 8])
        }
      };
      const mixed = await handle.runTask({
        revision: 2,
        edits: [
          {type: 'samples', address, samples: [{index: 0, height: 10}]},
          {type: 'upsert', tile: other},
          {type: 'samples', address: otherAddress, samples: [{index: 3, height: 9}]},
          {type: 'remove', address},
          {type: 'upsert', tile},
          {type: 'samples', address, samples: [{index: 0, height: 11}]}
        ]
      });
      expect(mixed.error).toBeUndefined();
      const finalTiles = [
        {...address, field: {width: 2, height: 2, heights: new ArrayType([11, NaN, NaN, 4])}},
        {...other, field: {...other.field, heights: new ArrayType([5, 6, 7, 9])}}
      ];
      expect((await handle.runTask({type: 'snapshot'})).tiles).toEqual(
        createTerrainMixedVertexTileHalos(finalTiles).tiles
      );
      // A new layout must invalidate the address index, including insertion order.
      const last = await handle.runTask({
        revision: 3,
        edits: [{type: 'samples', address: otherAddress, samples: [{index: 0, height: 12}]}]
      });
      expect(last.error).toBeUndefined();
      finalTiles[1].field.heights[0] = 12;
      expect((await handle.runTask({type: 'snapshot'})).tiles).toEqual(
        createTerrainMixedVertexTileHalos(finalTiles).tiles
      );
      if (ArrayType === Float32Array) {
        const rejected = await handle.runTask({
          revision: 4,
          edits: [{type: 'samples', address, samples: [{index: 0, height: Number.MAX_VALUE}]}]
        });
        expect(rejected.error).toMatch(/overflow/);
        expect((await handle.runTask({type: 'snapshot'})).tiles).toEqual(
          createTerrainMixedVertexTileHalos(finalTiles).tiles
        );
      }
    } finally {
      await handle.close();
      await runner.close();
    }
  });
}

test('resident source index rejects invalid structural edits without poisoning the next commit', async () => {
  const runner = new TaskRunner();
  const handle = await runner.initializeTask(TerrainResidencyTask, {}, {execution: 'main-thread'});
  const address = {column: 0, row: 0, spacing: 1};
  const tile = {...address, field: {width: 2, height: 2, heights: new Float64Array(4)}};
  try {
    await handle.runTask({revision: 0, edits: [{type: 'upsert', tile}]});
    const before = await handle.runTask({type: 'snapshot'});
    for (const edits of [
      [
        {type: 'remove', address},
        {type: 'samples', address, samples: [{index: 0, height: 1}]}
      ],
      [
        {type: 'upsert', tile: {...tile, field: {...tile.field, width: 20}}},
        {type: 'samples', address, samples: [{index: 0, height: 1}]}
      ]
    ] as const) {
      expect((await handle.runTask({revision: 1, edits})).error).toBeDefined();
      expect(await handle.runTask({type: 'snapshot'})).toEqual(before);
    }
    const next = await handle.runTask({
      revision: 1,
      edits: [
        {type: 'samples', address, samples: []},
        {type: 'samples', address, samples: [{index: 0, height: 3}]}
      ]
    });
    expect(next.error).toBeUndefined();
    expect(next.revision).toBe(2);
  } finally {
    await handle.close();
    await runner.close();
  }
});
