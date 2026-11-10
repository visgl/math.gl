// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {Table, Float64, vectorFromArray} from 'apache-arrow';
import {TaskRunner} from '@math.gl/tasks';
import {
  createArrowExpressionTask,
  prepareArrowExpressionInput,
  hydrateArrowExpressionResult
} from '@math.gl/arrow/expressions/worker';
const table = new Table({value: vectorFromArray([1, null, 3], new Float64())}).concat(
  new Table({value: vectorFromArray([4, 5], new Float64())})
);
const task = createArrowExpressionTask({
  worker: {
    url: new URL('./worker.mjs', import.meta.url),
    capabilities: {atomic: true, streaming: false}
  }
});
const runner = new TaskRunner();
try {
  const initialized = await runner.initializeTask(
    task,
    {expression: 'value * 2 + 1'},
    {execution: 'worker'}
  );
  try {
    const {vector} = hydrateArrowExpressionResult(
      await initialized.runTask(prepareArrowExpressionInput(table))
    );
    assert.deepEqual([...vector], [3, null, 7, 9, 11]);
    assert.equal(vector.data.length, 2);
    assert.equal(table.getChild('value').get(0), 1); // Default ownership copies input buffers.
    // biome-ignore lint/suspicious/noConsole: Show the executable example result.
    console.log('Worker expression:', [...vector], 'chunks:', vector.data.length);
  } finally {
    await initialized.close();
  }
} finally {
  await runner.close();
}
