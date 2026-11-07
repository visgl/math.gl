// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TaskRunner} from '@math.gl/core/tasks';
import {getGeoArrowTransferList} from '@math.gl/geospatial/geoarrow-utils';
import {geometryTask} from './task.mjs';
import {fixture} from './fixture.mjs';
const runner = new TaskRunner();
test('task worker matches local clipping and transfers owned input', async () => {
  try {
    const local = await runner.runTask(
      geometryTask,
      {column: fixture(), projection: 'equirectangular'},
      {execution: 'main-thread'}
    );
    const column = fixture(),
      buffers = getGeoArrowTransferList(column);
    const remote = await runner.runTask(
      geometryTask,
      {column, projection: 'equirectangular'},
      {execution: 'worker', inputOwnership: 'transfer'}
    );
    assert.deepEqual(remote, local);
    assert(buffers.every(buffer => buffer.byteLength === 0));
    assert.deepEqual(Array.from(remote.polygonSourceRows), [1, 1, 2]);
    await assert.rejects(
      runner.runTask(
        geometryTask,
        {column: fixture(), projection: 'unknown'},
        {execution: 'worker'}
      ),
      /Unknown projection/
    );
    const next = await runner.runTask(
      geometryTask,
      {column: fixture(), projection: 'orthographic'},
      {execution: 'worker'}
    );
    assert.deepEqual(Array.from(next.polygonSourceRows), [2]);
  } finally {
    await runner.terminate();
  }
});
