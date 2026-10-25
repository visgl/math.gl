// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareMapGrid } from "./prepare-map-grid.js";
import { discontinuousGrid } from "./discontinuous-views.js";

test("worker preparation hydrates geometry, terminates on completion, and cancels abandoned work", async () => {
  const original = globalThis.Worker;
  const workers = [];
  class WorkerStub {
    constructor() {
      workers.push(this);
    }
    postMessage(message) {
      this.message = message;
    }
    terminate() {
      this.terminated = true;
    }
  }
  globalThis.Worker = WorkerStub;
  try {
    const pending = prepareMapGrid("butterfly", 30);
    const worker = workers.at(-1);
    assert.deepEqual(worker.message, {operation: 'map-grid', input: { view: "butterfly", step: 30 }});
    const { map, ...data } = discontinuousGrid("butterfly", 30);
    worker.onmessage({ data: {type: 'result', result: structuredClone({...data, preparedMap: map.toPrepared()})} });
    const result = await pending;
    assert(worker.terminated);
    assert.deepEqual(result.positions, data.positions);
    assert.equal(result.map.description.id, "butterfly");
    assert(result.map.projectPoint([0, 30]));
    assert.strictEqual(await prepareMapGrid("butterfly", 30), result);
    assert.equal(workers.length, 1, "cached grids do not start another worker");

    const controller = new AbortController();
    const abandoned = prepareMapGrid("guyou", 30, {
      signal: controller.signal,
    });
    controller.abort();
    await assert.rejects(abandoned, { name: "AbortError" });
    assert(workers.at(-1).terminated);

    const failed = prepareMapGrid("waterman", 30);
    workers.at(-1).onmessage({ data: { type: 'error', message: "Geometry failed" } });
    await assert.rejects(failed, /Geometry failed/);
    assert(workers.at(-1).terminated);
  } finally {
    if (original === undefined) delete globalThis.Worker;
    else globalThis.Worker = original;
  }
});
