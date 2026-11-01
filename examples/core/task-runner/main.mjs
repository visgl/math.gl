// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {TaskRunner} from '@math.gl/core/tasks';
import {transformTask} from './task.mjs';

const runner = new TaskRunner({maxConcurrency: 2});
const input = {values: new Float64Array([1, 2, 3])};
const request = {initialization: {offset: 1}, options: {factor: 10}};
try {
  const single = await runner.runTask(transformTask, input, request);
  assert.deepEqual([...single.values], [11, 21, 31]);
  assert.equal(single.calls, 1);
  console.log('One call:', [...single.values]);

  const calls = [];
  for await (const output of runner.runTasks(transformTask, [input, input, input], {...request, concurrency: 2})) {
    calls.push(output.calls);
  }
  assert.deepEqual(calls, [1, 1, 2]);
  console.log('Independent slots:', calls);

  const streamCalls = [];
  for await (const output of runner.runTaskInBatches(transformTask, [input, input], request)) {
    streamCalls.push(output.calls);
  }
  assert.deepEqual(streamCalls, [1, 2]);
  console.log('One streaming session:', streamCalls);

  const initialized = await runner.initializeTask(transformTask, {offset: 1});
  try {
    const first = await initialized.runTask(input, {options: {factor: 10}});
    const second = await initialized.runTask(input, {options: {factor: 10}});
    assert.deepEqual([first.calls, second.calls], [1, 2]);
    console.log('Explicit lifetime:', [first.calls, second.calls]);
  } finally {
    await initialized.close();
  }
  assert.equal(input.values.byteLength, 24);
} finally {
  await runner.close();
}
