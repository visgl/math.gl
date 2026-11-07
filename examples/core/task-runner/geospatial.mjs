// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore-all lint/suspicious/noConsole: Report successful completion of this command-line task demo.
import assert from 'node:assert/strict';
import {TaskRunner} from '@math.gl/core/tasks';
import {ProjectCoordinatesTask, PrepareMapTask} from '@math.gl/geospatial/tasks';
import {MapEngine} from '@math.gl/geospatial/discontinuous';

const runner = new TaskRunner({maxConcurrency: 2});
const projection = {from: 'EPSG:4326', to: 'EPSG:3857'};
const input = () => ({coordinates: new Float64Array([0, 0, 10, 20]), projection});
try {
  const result = await runner.runTask(ProjectCoordinatesTask, input());
  assert.ok(Math.abs(result.coordinates[2] - 1113194.9079) < 0.001);
  const outputs = [];
  for await (const output of runner.runTasks(ProjectCoordinatesTask, [input(), input()], {
    concurrency: 2
  }))
    outputs.push(output);
  assert.deepEqual(outputs, [result, result]);
  for await (const output of runner.runTaskInBatches(ProjectCoordinatesTask, [input()]))
    assert.deepEqual(output, result);
  const handle = await runner.initializeTask(ProjectCoordinatesTask, {projection});
  try {
    const restored = await handle.runTask({coordinates: result.coordinates, inverse: true});
    assert.ok(Math.abs(restored.coordinates[2] - 10) < 1e-8);
  } finally {
    await handle.close();
  }
  const {map} = await runner.runTask(PrepareMapTask, {
    description: {version: 1, id: 'world', definition: {type: 'mercator'}}
  });
  assert.deepEqual(MapEngine.fromPrepared(map).toPrepared(), map);
  console.log(
    'Provided geospatial tasks: atomic, multiple, streaming, persistent, and map checks passed.'
  );
} finally {
  await runner.close();
}
