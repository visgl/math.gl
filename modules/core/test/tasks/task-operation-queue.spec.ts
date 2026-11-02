// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {TaskOperationQueue} from '../../src/tasks/task-operation-queue';
import {TaskRunner, type Task} from '../../src/tasks';

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

test('termination rejects queued requests consistently without interrupting active cleanup', async () => {
  const queue = new TaskOperationQueue(1);
  const running = deferred();
  const active = queue.run('exclusive', () => running.promise);
  const invoked = vi.fn(async () => {});
  const waiting = queue.run('parallel', invoked);
  const reason = new Error('terminated');
  queue.cancelPending(reason);
  await expect(waiting).rejects.toBe(reason);
  expect(invoked).not.toHaveBeenCalled();
  running.resolve();
  await active;
  await queue.close();
});

test('initialized local tasks opt in to overlapping operations and exclusive barriers', async () => {
  const first = deferred();
  const events: string[] = [];
  const task = {
    id: 'concurrent-test',
    concurrency: {
      maxConcurrency: 2,
      getSchedulingMode: (input: {kind: string}) =>
        input.kind === 'barrier' ? ('exclusive' as const) : ('parallel' as const)
    },
    initialize: () => ({}),
    async process(input) {
      events.push(input.kind);
      if (input.kind === 'first') await first.promise;
      return {kind: input.kind};
    }
  } satisfies Task<{input: {kind: string}; output: {kind: string}; state: object}>;
  const runner = new TaskRunner();
  const handle = await runner.initializeTask(
    task,
    {},
    {execution: 'main-thread', operationConcurrency: 2}
  );
  try {
    const one = handle.runTask({kind: 'first'});
    const two = handle.runTask({kind: 'second'});
    const barrier = handle.runTask({kind: 'barrier'});
    const three = handle.runTask({kind: 'third'});
    await two;
    expect(events).toEqual(['first', 'second']);
    first.resolve();
    await Promise.all([one, barrier, three]);
    expect(events).toEqual(['first', 'second', 'barrier', 'third']);
  } finally {
    await handle.close();
    await runner.close();
  }
});

test('cancelling active concurrent work invalidates shared local state', async () => {
  const started = deferred();
  const release = deferred();
  let destroyed = 0;
  const task = {
    id: 'concurrent-cancel',
    concurrency: {maxConcurrency: 2, getSchedulingMode: () => 'parallel' as const},
    initialize: () => ({}),
    destroy: () => {
      destroyed++;
    },
    async process(_input, _options, context) {
      started.resolve();
      await release.promise;
      context.throwIfAborted();
      return {};
    }
  } satisfies Task<{input: object; output: object; state: object}>;
  const runner = new TaskRunner();
  const handle = await runner.initializeTask(
    task,
    {},
    {execution: 'main-thread', operationConcurrency: 2}
  );
  const controller = new AbortController();
  const request = handle.runTask({}, {signal: controller.signal});
  await started.promise;
  controller.abort(new Error('stop'));
  expect(handle.state).toBe('invalid');
  const closing = handle.close();
  expect(destroyed).toBe(0);
  release.resolve();
  await expect(request).rejects.toThrow('stop');
  await expect(handle.runTask({})).rejects.toThrow('invalid');
  await closing;
  expect(destroyed).toBe(1);
  await runner.close();
  expect(destroyed).toBe(1);
});

test('a queued deadline rejects without invalidating the task', async () => {
  const started = deferred();
  const release = deferred();
  const task = {
    id: 'queued-timeout',
    initialize: () => ({}),
    async process() {
      started.resolve();
      await release.promise;
      return {};
    }
  } satisfies Task<{input: object; output: object; state: object}>;
  const runner = new TaskRunner();
  const handle = await runner.initializeTask(task, {}, {execution: 'main-thread'});
  const running = handle.runTask({});
  await started.promise;
  await expect(handle.runTask({}, {timeout: 5})).rejects.toMatchObject({name: 'TimeoutError'});
  expect(handle.state).toBe('ready');
  release.resolve();
  await running;
  const closing = handle.close();
  expect(handle.state).toBe('closing');
  await closing;
  expect(handle.state).toBe('closed');
  await runner.close();
});
