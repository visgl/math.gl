// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createResourceWorker} from '@math.gl/core/worker-utils';
await createResourceWorker({
  initialize: input => ({value: input.value, disposed: input.disposed, hangDisposer: input.hangDisposer}),
  run: (state, input) => {
    if (input === 'crash') process.exit(1);
    state.value += input;
    return state.value;
  },
  dispose: async state => {
    if (state.hangDisposer) await new Promise(() => {});
    if (state.disposed) Atomics.store(new Int32Array(state.disposed), 0, 1);
  }
});
