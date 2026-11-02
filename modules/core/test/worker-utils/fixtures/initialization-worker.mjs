// math.gl
// SPDX-License-Identifier: MIT
import {initializeTaskWorker} from '@math.gl/core/tasks';
await initializeTaskWorker({
  id: 'initialization-ownership',
  initialize: ({port}) => ({port}),
  destroy: state => state.port.close(),
  process({value}, _options, context) {
    context.state.port.postMessage(value);
    return {value};
  },
  async *processInBatches(inputs, _options, context) {
    for await (const {value} of inputs) {
      context.state.port.postMessage(value);
      yield {value};
    }
  }
});
