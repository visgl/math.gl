// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '@math.gl/tasks';
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
