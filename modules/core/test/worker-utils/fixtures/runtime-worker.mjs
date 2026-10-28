// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/worker-utils';
let runs = 0;
await createWorker(async (input, options, context) => {
  runs++;
  if (input?.mode === 'shared-spin') {
    context.sharedState.setProgress(1, 2);
    const deadline = performance.now() + 3000;
    while (performance.now() < deadline) context.throwIfAborted();
    throw new Error('Shared cancellation was not observed');
  }
  if (input?.mode === 'crash') process.exit(1);
  if (input?.mode === 'cooperate') {
    context.reportProgress({phase: 'running', completed: 0, unit: 'tasks'});
    for (let i = 0; i < 100; i++) {
      await new Promise(resolve => setTimeout(resolve, 5));
      context.signal.throwIfAborted();
    }
  }
  if (input?.mode === 'ignore') {
    context.reportProgress({phase: 'running', completed: 0, unit: 'tasks'});
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return input?.mode ? runs : input;
}, async function* (input, _options, context) {
  for await (const batch of input) {
    context.signal.throwIfAborted();
    yield batch;
  }
});
