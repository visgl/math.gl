// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** @satisfies {import('@math.gl/tasks').Task<{
 * input: {values: Float64Array}, output: {values: Float64Array, calls: number},
 * options: {factor: number}, initialization: {offset: number},
 * state: {offset: number, calls: number}
 * }>} */
export const transformTask = {
  id: 'transform',
  initialize({offset}) {
    return {offset, calls: 0};
  },
  destroy(state) {
    state.calls = 0;
  },
  process({values}, {factor}, context) {
    context.throwIfAborted();
    context.state.calls++;
    return {
      values: values.map(value => value * factor + context.state.offset),
      calls: context.state.calls
    };
  },
  async *processInBatches(inputs, options, context) {
    for await (const input of inputs) {
      yield transformTask.process(input, options, context);
    }
  },
  worker: {
    url: new URL('./worker.mjs', import.meta.url),
    capabilities: {atomic: true, streaming: true}
  }
};
