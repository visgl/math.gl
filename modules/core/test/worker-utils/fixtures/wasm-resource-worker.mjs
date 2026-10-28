// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createResourceWorker} from '@math.gl/core/worker-utils';

await createResourceWorker({
  async initialize(bytes) {
    const {instance} = await WebAssembly.instantiate(bytes);
    return {instance, calls: 0};
  },
  async run(state, input, context) {
    state.calls++;
    if (input === 'cancel') {
      context.reportProgress({phase: 'running', completed: 0, unit: 'tasks'});
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1));
        context.throwIfAborted();
      }
    }
    return {valid: state.instance instanceof WebAssembly.Instance, calls: state.calls};
  },
  dispose(state) { state.instance = null; }
});
