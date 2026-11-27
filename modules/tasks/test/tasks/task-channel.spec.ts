// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {TaskChannel} from '@math.gl/tasks/tasks/task-channel';

test('multiplexes bidirectional requests and transfers buffers through real ports', async () => {
  const ports = new MessageChannel();
  const host = new TaskChannel({
    send: (message, transfer) => ports.port1.postMessage(message, transfer),
    handleRequest: async (_operation, value) => Number(value) * 2
  });
  const worker = new TaskChannel({
    send: (message, transfer) => ports.port2.postMessage(message, transfer),
    handleRequest: async (_operation, value, signal) => {
      const result = await worker.request('double', (value as Uint8Array)[0], signal);
      return new Uint8Array([Number(result)]);
    },
    getResultTransferList: value => [(value as Uint8Array).buffer]
  });
  ports.port1.onmessage = event => host.receive(event.data);
  ports.port2.onmessage = event => worker.receive(event.data);
  try {
    const first = new Uint8Array([3]);
    const one = host.request('work', first, undefined, [first.buffer]);
    const two = host.request('work', new Uint8Array([5]));
    expect(first.byteLength).toBe(0);
    expect(await one).toEqual(new Uint8Array([6]));
    expect(await two).toEqual(new Uint8Array([10]));
  } finally {
    host.close();
    worker.close();
    ports.port1.close();
    ports.port2.close();
  }
});

test('transport failure rejects all pending requests with the same cause', async () => {
  const cause = new Error('crashed');
  let fail = false;
  const channel = new TaskChannel({
    send: () => {
      if (fail) throw cause;
    },
    handleRequest: async () => undefined
  });
  const first = channel.request('one', {});
  fail = true;
  const second = channel.request('two', {});
  await expect(first).rejects.toBe(cause);
  await expect(second).rejects.toBe(cause);
  await expect(channel.request('three', {})).rejects.toBe(cause);
});

test('cancellation reaches the remote request without closing unrelated requests', async () => {
  let remoteSignal: AbortSignal | undefined;
  let acknowledge!: () => void;
  const started = new Promise<void>(resolve => {
    acknowledge = resolve;
  });
  let host!: TaskChannel;
  const worker = new TaskChannel({
    send: message => host.receive(message),
    handleRequest: async (_operation, _value, signal) => {
      remoteSignal = signal;
      acknowledge();
      await new Promise<void>(resolve =>
        signal.addEventListener('abort', () => resolve(), {once: true})
      );
      return {};
    }
  });
  host = new TaskChannel({
    send: message => worker.receive(message),
    handleRequest: async () => ({})
  });
  const controller = new AbortController();
  const pending = host.request('work', {}, controller.signal);
  await started;
  const cause = new Error('cancelled');
  controller.abort(cause);
  await expect(pending).rejects.toBe(cause);
  expect(remoteSignal?.aborted).toBe(true);
  expect(await worker.request('other', {})).toEqual({});
  host.close();
  worker.close();
});
