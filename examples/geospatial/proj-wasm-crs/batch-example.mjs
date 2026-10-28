// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {runTask, WorkerFarm} from '@math.gl/core/tasks';
import {createProjWasmBatchProcessor, createLatestBatchRunner} from './batch.mjs';
const consumeTask = {id: 'consume-proj-batch', name: 'Consume projected buffers', module: 'example', version: '1', options: {},
  worker: new URL('./consume-worker.mjs', import.meta.url).href,
  loadWorker: () => new Worker(new URL('./consume-worker.mjs', import.meta.url), {type: 'module'})};

export async function runBatchExample(proj) {
  const processor = await createProjWasmBatchProcessor(proj, {sourceCRS: 'EPSG:4326', targetCRS: 'EPSG:8857', chunkSize: 2});
  const latest = createLatestBatchRunner(processor);
  try {
    const input = {positions: new Float64Array([12, 55, 123, 170, -20, 0, -75, 40, 10]), sourceRowIndices: new Uint32Array([7, 11, 19])};
    const discarded = latest.run(input);
    const current = await latest.run(input);
    if (await discarded !== null) throw new Error('Stale batch was published');
    const inverse = await processor.transform(current, {direction: 'inverse'});
    const projected = Array.from(current.positions);
    // Transfer owned result buffers into a real math.gl task worker. The producer
    // must stop reading all aliases after this call. Upstream PROJ may copy internally.
    const consumed = await runTask(consumeTask, current, {execution: 'worker', inputOwnership: 'transfer'});
    return {input: Array.from(input.positions), projected, inverse: Array.from(inverse.positions),
      rows: Array.from(consumed.sourceRowIndices), bounds: consumed.bounds,
      transferred: current.positions.byteLength === 0 && current.sourceRowIndices.byteLength === 0,
      workerParity: consumed.positions.every((value, i) => value === projected[i]), staleDiscarded: true};
  } finally {
    latest.cancel();
    try {await processor.dispose();} finally {await WorkerFarm.getWorkerFarm().destroy();}
  }
}
