// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import * as tasks from '@math.gl/core/task-runtime';
import * as workers from '@math.gl/core/worker-utils';
const require = createRequire(import.meta.url);
const cjsTasks = require('@math.gl/core/task-runtime');
const cjsWorkers = require('@math.gl/core/worker-utils');
assert.equal(tasks.WorkerFarm, workers.WorkerFarm);
assert.equal(cjsTasks.WorkerFarm, cjsWorkers.WorkerFarm);
for (const api of [tasks, cjsTasks]) {
  assert.equal(await api.runTask(api.NullWorker, 'worker'), 'worker');
  const task = {...api.NullWorker, process: input => input.map(value => value * 2)};
  const input = new Float64Array([1, 2]);
  const output = await api.runTask(task, input, {mainThread: {maxSize: 16}, inputOwnership: 'copy'});
  assert.deepEqual(output, new Float64Array([2, 4]));
  assert.equal(input.byteLength, 16);
  await api.WorkerFarm.getWorkerFarm().destroy();
}
console.log('Task runtime ESM/CommonJS exports, compatibility identity, worker assets and local dispatch passed.');
