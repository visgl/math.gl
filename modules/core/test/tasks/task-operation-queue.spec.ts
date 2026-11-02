// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {TaskOperationQueue} from '../../src/tasks/task-operation-queue';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return {promise, resolve};
}

test('parallel operations overlap and exclusive operations form FIFO barriers', async () => {
  const queue = new TaskOperationQueue(2);
  const first = deferred();
  const second = deferred();
  const barrier = deferred();
  const events: string[] = [];
  const one = queue.run('parallel', async () => {
    events.push('one');
    await first.promise;
  });
  const two = queue.run('parallel', async () => {
    events.push('two');
    await second.promise;
  });
  const exclusive = queue.run('exclusive', async () => {
    events.push('exclusive');
    await barrier.promise;
  });
  const three = queue.run('parallel', async () => {
    events.push('three');
  });
  await Promise.resolve();
  expect(events).toEqual(['one', 'two']);
  first.resolve();
  await one;
  expect(events).toEqual(['one', 'two']);
  second.resolve();
  await two;
  await vi.waitFor(() => expect(events).toEqual(['one', 'two', 'exclusive']));
  barrier.resolve();
  await exclusive;
  await three;
  expect(events).toEqual(['one', 'two', 'exclusive', 'three']);
  await queue.close();
});

test('queued abort removes a barrier and close drains accepted work', async () => {
  const queue = new TaskOperationQueue(2);
  const first = deferred();
  const started = vi.fn();
  const firstResult = queue.run('parallel', async () => first.promise);
  const controller = new AbortController();
  const canceled = queue.run(
    'exclusive',
    async () => {
      started();
    },
    controller.signal
  );
  const last = queue.run('parallel', async () => {
    started();
  });
  const close = queue.close();
  controller.abort(new Error('cancelled'));
  await expect(canceled).rejects.toThrow('cancelled');
  await last;
  expect(started).toHaveBeenCalledTimes(1);
  await expect(queue.run('parallel', async () => {})).rejects.toThrow('closed');
  first.resolve();
  await firstResult;
  await close;
});

test('errors release capacity and invalid configuration is rejected', async () => {
  expect(() => new TaskOperationQueue(0)).toThrow(RangeError);
  const queue = new TaskOperationQueue(1);
  const failed = queue.run('exclusive', async () => {
    throw new Error('failed');
  });
  const next = queue.run('parallel', async () => 42);
  await expect(failed).rejects.toThrow('failed');
  await expect(next).resolves.toBe(42);
  await queue.whenIdle();
});
