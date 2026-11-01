// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '../../../dist/tasks/index.js';
const identity = Math.random();
let loaded = false;
let initialized = 0;
let destroyed = 0;
await initializeTaskWorker({
  id: 'warm-task',
  async preload() {
    // Run a native import: Vitest's browser import wrapper is unavailable inside workers.
    const load = new Function('url', 'return import(url)');
    const {value} = await load(new URL('./preload-dependency.mjs', import.meta.url).href);
    loaded = value === 7;
  },
  initialize() {
    initialized++;
    return {calls: 0};
  },
  destroy() {
    destroyed++;
  },
  async process(input, _options, {state}) {
    if (input.fail) throw new Error('warm failure');
    if (input.wait) await new Promise(resolve => setTimeout(resolve, 1000));
    return {identity, loaded, initialized, destroyed, calls: ++state.calls};
  },
  async *processInBatches(inputs, options, context) {
    for await (const input of inputs) yield await this.process(input, options, context);
  }
});
