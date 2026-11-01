// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '@math.gl/core/tasks';
await initializeTaskWorker({
  id: 'runner-fixture',
  initialize({offset = 0}) { return {offset, calls: 0, values: new Float64Array([7, 8])}; },
  destroy(state) { state.values = null; },
  async process({value = 0, cached = false, fail = false, delay = 0}, {factor = 1}, context) {
    if (fail) throw new Error('worker failure');
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    context.reportProgress({completed: 1, total: 1});
    context.state.calls++;
    return cached ? {values: context.state.values} : {value: value * factor + context.state.offset, calls: context.state.calls};
  },
  async *processInBatches(inputs, options, context) {
    for await (const {value} of inputs) {
      context.state.calls++;
      yield {value: value * options.factor + context.state.offset, calls: context.state.calls};
    }
  }
});
