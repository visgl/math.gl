// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test as baseTest} from 'vitest';
import {
  getTransferList,
  isBrowser,
  processOnWorker,
  processOnWorkerInBatches,
  type WorkerObject
} from '../../src/worker-utils';

const test = baseTest.runIf(!isBrowser);
const source = `const {parentPort} = require('worker_threads');
parentPort.on('message', ({type, payload}) => {
  if (type === 'process') parentPort.postMessage({source:'loaders.gl', type:'done', payload:{result:payload.input}});
  if (type === 'process-in-batches' || type === 'output-ack') parentPort.postMessage({source:'loaders.gl', type:'input-request', payload:{}});
  if (type === 'input-batch') parentPort.postMessage({source:'loaders.gl', type:'output-batch', payload:{result:payload.input}});
  if (type === 'input-done') parentPort.postMessage({source:'loaders.gl', type:'done', payload:{}});
});`;
const worker: WorkerObject<Uint8Array, Uint8Array> = {
  id: 'ownership',
  name: 'ownership',
  module: 'test',
  version: '1',
  worker: true,
  options: {}
};

test('copy and transfer ownership for atomic and streaming work', async () => {
  for (const ownership of ['copy', 'transfer'] as const) {
    const input = new Uint8Array([1, 2, 3]);
    const result = await processOnWorker(worker, input, {source, inputOwnership: ownership});
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
    expect(input.byteLength).toBe(ownership === 'copy' ? 3 : 0);
    const batch = new Uint8Array([4, 5]);
    const output = [];
    for await (const value of processOnWorkerInBatches(worker, [batch], {
      source,
      inputOwnership: ownership
    }))
      output.push(value);
    expect(output).toEqual([new Uint8Array([4, 5])]);
    expect(batch.byteLength).toBe(ownership === 'copy' ? 2 : 0);
  }
});

test('transfer discovery deduplicates aliases and traverses cyclic maps and sets', () => {
  const buffer = new ArrayBuffer(16);
  const payload: any = {first: new Uint8Array(buffer), map: new Map(), set: new Set()};
  payload.map.set(payload, new DataView(buffer));
  payload.set.add(payload.map);
  payload.self = payload;
  expect(getTransferList(payload)).toEqual([buffer]);
});
