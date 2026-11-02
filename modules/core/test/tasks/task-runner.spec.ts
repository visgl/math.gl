// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {TaskRunner, preloadTasks, type Task} from '../../src/tasks';

type Types = {
  input: {value: number};
  output: {value: number};
  options: {factor: number};
  initialization: {offset: number};
  state: {offset: number; calls: number};
};
function fixture() {
  const events: string[] = [];
  const task = {
    id: 'counter',
    initialize({offset}) {
      events.push('initialize');
      return {offset, calls: 0};
    },
    destroy(state) {
      events.push(`destroy:${state.calls}`);
    },
    process({value}, {factor}, {state}) {
      state.calls++;
      return {value: value * factor + state.offset};
    },
    async *processInBatches(inputs, options, context) {
      for await (const input of inputs) {
        context.state.calls++;
        yield {value: input.value * options.factor + context.state.offset};
      }
    }
  } satisfies Task<Types>;
  return {task, events};
}
const request = {initialization: {offset: 1}, options: {factor: 2}};
async function collect<T>(inputs: AsyncIterable<T>): Promise<T[]> {
  const values: T[] = [];
  for await (const value of inputs) values.push(value);
  return values;
}

test('automatic lifetime cleans state before returning named output', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner();
  expect(await runner.runTask(task, {value: 3}, request)).toEqual({
    value: 7
  });
  expect(events).toEqual(['initialize', 'destroy:1']);
  await runner.close();
});

test('explicit lifetime shares state and supports both processors', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner();
  const instance = await runner.initializeTask(task, {offset: 1});
  await instance.runTask({value: 1}, {options: {factor: 2}});
  expect(
    await collect(
      instance.runTasks([{value: 2}, {value: 3}], {
        options: {factor: 2}
      })
    )
  ).toEqual([{value: 5}, {value: 7}]);
  expect(await collect(instance.runTaskInBatches([{value: 4}], {options: {factor: 2}}))).toEqual([
    {value: 9}
  ]);
  expect(events).toEqual(['initialize']);
  await instance.close();
  await instance.close();
  expect(events).toEqual(['initialize', 'destroy:4']);
  await expect(instance.runTask({value: 1}, {options: {factor: 2}})).rejects.toThrow('closed');
  await runner.close();
});

test('runTasks orders parallel outputs and reuses per-slot state', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner({maxConcurrency: 2});
  const delayed = {
    ...task,
    async process(input, options, context) {
      await new Promise(resolve => setTimeout(resolve, input.value === 1 ? 10 : 0));
      return task.process(input, options, context);
    }
  };
  expect(
    await collect(
      runner.runTasks(delayed, [{value: 1}, {value: 2}, {value: 3}], {
        ...request,
        concurrency: 2
      })
    )
  ).toEqual([{value: 3}, {value: 5}, {value: 7}]);
  expect(events.filter(event => event === 'initialize')).toHaveLength(2);
  expect(events.filter(event => event.startsWith('destroy')).sort()).toEqual([
    'destroy:1',
    'destroy:2'
  ]);
  await runner.close();
});

test('empty multiple calls never initialize; abandoned streams clean up', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner();
  expect(await collect(runner.runTasks(task, [], request))).toEqual([]);
  expect(events).toEqual([]);
  for await (const output of runner.runTaskInBatches(task, [{value: 1}, {value: 2}], request)) {
    expect(output).toEqual({value: 3});
    break;
  }
  expect(events).toEqual(['initialize', 'destroy:1']);
  await runner.close();
});

test('copy/transfer boundaries and named payload validation apply locally', async () => {
  const runner = new TaskRunner();
  const task = {
    id: 'buffers',
    process: ({values}: {values: Float64Array}) => ({values})
  };
  const values = new Float64Array([1, 2]);
  expect(await runner.runTask(task, {values})).toEqual({values});
  expect(values.byteLength).toBe(16);
  await runner.runTask(task, {values}, {inputOwnership: 'transfer'});
  expect(values.byteLength).toBe(0);
  await expect(runner.runTask(task, [] as any)).rejects.toThrow('named fields');
  await expect(runner.runTask({id: 'bad', process: () => []} as any, {})).rejects.toThrow(
    'named fields'
  );
  await runner.close();
});

test('processing and destruction errors are both retained', async () => {
  const {task} = fixture();
  const runner = new TaskRunner();
  const broken = {
    ...task,
    process() {
      throw new Error('process failed');
    },
    destroy() {
      throw new Error('destroy failed');
    }
  };
  const error = await runner.runTask(broken, {value: 1}, request).catch(error => error);
  expect(error.errors.map(item => item.message)).toEqual(['process failed', 'destroy failed']);
  await runner.close();
});

test('runner closure destroys handles and rejects queued acquisitions', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner();
  await runner.initializeTask(task, {offset: 1});
  const waiting = runner.initializeTask(task, {offset: 2});
  const rejected = expect(waiting).rejects.toThrow('closed');
  await runner.close();
  await rejected;
  expect(events).toEqual(['initialize', 'destroy:0']);
});

test('queued acquisition honors cancellation without stealing capacity', async () => {
  const {task} = fixture();
  const runner = new TaskRunner();
  const first = await runner.initializeTask(task, {offset: 1});
  const controller = new AbortController();
  const waiting = runner.initializeTask(task, {offset: 2}, {signal: controller.signal});
  controller.abort(new Error('cancelled'));
  await expect(waiting).rejects.toThrow('cancelled');
  await first.close();
  expect(await runner.runTask(task, {value: 2}, request)).toEqual({
    value: 5
  });
  await runner.close();
});

test('missing capabilities and invalid controls fail explicitly', async () => {
  expect(() => new TaskRunner({maxConcurrency: 0})).toThrow();
  const runner = new TaskRunner();
  await expect(runner.runTask({id: 'empty'}, {})).rejects.toThrow('atomic');
  await expect(runner.runTask({id: 'empty'}, {}, {execution: 'worker'})).rejects.toThrow('worker');
  await expect(collect(runner.runTasks({id: 'empty'}, [], {concurrency: 0}))).rejects.toThrow(
    'concurrency'
  );
  await runner.close();
});

const workerTask = {
  id: 'runner-worker',
  worker: {
    url: new URL('../worker-utils/fixtures/runner-worker.mjs', import.meta.url),
    capabilities: {atomic: true, streaming: true}
  }
};

test.each(['main-thread', 'worker'] as const)(
  'host callbacks and events are copied in %s',
  async execution => {
    const runner = new TaskRunner();
    const events: unknown[] = [];
    const retained = {value: 12};
    const task = {
      ...workerTask,
      async process(
        input: {value: number; callback: boolean},
        _options: object,
        context: import('../../src/tasks').TaskContext
      ) {
        const result = await context.requestHost('double', {value: input.value});
        context.emitHost('complete', result as object);
        return result as {value: number};
      }
    };
    const instance = await runner.initializeTask(
      task,
      {},
      {
        execution,
        onRequest: async (operation, payload, signal) => {
          expect(operation).toBe('double');
          expect(payload).toEqual({value: 6});
          expect(signal.aborted).toBe(false);
          return retained;
        },
        onEvent: (operation, payload) => {
          expect(operation).toBe('complete');
          events.push(payload);
        }
      }
    );
    try {
      const result = await instance.runTask({value: 6, callback: true});
      expect(result).toEqual(retained);
      result.value = 99;
      expect(retained.value).toBe(12);
      expect(events).toEqual([{value: 12}]);
    } finally {
      await runner.close();
    }
  }
);

test('multiplexed worker channel preserves one initialized state', async () => {
  const runner = new TaskRunner();
  const task = {
    ...fixture().task,
    ...workerTask,
    concurrency: {
      maxConcurrency: 2,
      getSchedulingMode: () => 'parallel' as const
    }
  };
  const instance = await runner.initializeTask(
    task,
    {offset: 10},
    {execution: 'worker', operationConcurrency: 2}
  );
  try {
    const progress: number[] = [];
    const results = await Promise.all([
      instance.runTask({value: 2}, {options: {factor: 3}, onProgress: () => progress.push(1)}),
      instance.runTask({value: 4}, {options: {factor: 2}, onProgress: () => progress.push(2)})
    ]);
    expect(results.map(result => result.value)).toEqual([16, 18]);
    expect(progress.sort()).toEqual([1, 2]);
    expect(
      await collect(instance.runTaskInBatches([{value: 5}, {value: 6}], {options: {factor: 2}}))
    ).toEqual([
      {value: 20, calls: 3},
      {value: 22, calls: 4}
    ]);
    expect(await instance.runTask({value: 1}, {options: {factor: 1}})).toEqual({
      value: 11,
      calls: 5
    });
  } finally {
    await runner.close();
  }
});

test('multiplexed worker termination rejects callbacks and queued calls without recreating state', async () => {
  const runner = new TaskRunner();
  let started!: () => void;
  const callbackStarted = new Promise<void>(resolve => {
    started = resolve;
  });
  let callbackCount = 0;
  let callbackSignal: AbortSignal | undefined;
  const task = {
    ...workerTask,
    process: (_input: {value: number; callback?: boolean}) => ({value: 0}),
    concurrency: {maxConcurrency: 2, getSchedulingMode: () => 'parallel' as const}
  };
  const instance = await runner.initializeTask(
    task,
    {},
    {
      execution: 'worker',
      operationConcurrency: 2,
      onRequest: async (_operation, _payload, signal) => {
        callbackSignal = signal;
        if (++callbackCount === 2) started();
        await new Promise<void>(resolve =>
          signal.addEventListener('abort', () => resolve(), {once: true})
        );
        return {};
      }
    }
  );
  const first = instance.runTask({value: 1, callback: true});
  const second = instance.runTask({value: 2, callback: true});
  const queued = instance.runTask({value: 3});
  const cause = new Error('stop shared state');
  const assertions = [first, second, queued].map(promise => expect(promise).rejects.toBe(cause));
  await callbackStarted;
  await instance.terminate(cause);
  await Promise.all(assertions);
  expect(callbackSignal?.aborted).toBe(true);
  expect(instance.state).toBe('invalid');
  await expect(instance.runTask({value: 4})).rejects.toThrow();
  await runner.close();
});

test('real worker retains state across atomic and streaming calls', async () => {
  const runner = new TaskRunner();
  const task = {...fixture().task, ...workerTask};
  const instance = await runner.initializeTask(task, {offset: 10}, {execution: 'worker'});
  try {
    expect(await instance.runTask({value: 2}, {options: {factor: 3}})).toEqual({
      value: 16,
      calls: 1
    });
    expect(await collect(instance.runTaskInBatches([{value: 3}], {options: {factor: 2}}))).toEqual([
      {value: 16, calls: 2}
    ]);
    expect(await instance.runTask({value: 1}, {options: {factor: 1}})).toEqual({
      value: 11,
      calls: 3
    });
  } finally {
    await runner.close();
  }
});

test('worker automatic calls do not share state and copy output preserves cached buffers', async () => {
  const runner = new TaskRunner();
  const task = {...fixture().task, ...workerTask};
  try {
    const one = await runner.runTask(task, {value: 1}, request);
    const two = await runner.runTask(task, {value: 1}, request);
    expect(one).toEqual(two);
    const instance = await runner.initializeTask(task, {offset: 0});
    const controls = {
      options: {factor: 1},
      outputOwnership: 'copy' as const
    };
    const first = await instance.runTask({cached: true} as any, controls);
    const second = await instance.runTask({cached: true} as any, controls);
    expect(first).toEqual({values: new Float64Array([7, 8])});
    expect(second).toEqual(first);
  } finally {
    await runner.close();
  }
});

test('worker failure invalidates the explicit handle rather than recreating state', async () => {
  const runner = new TaskRunner();
  const instance = await runner.initializeTask({...fixture().task, ...workerTask}, {offset: 0});
  await expect(instance.runTask({fail: true} as any, {options: {factor: 1}})).rejects.toThrow(
    'worker failure'
  );
  await expect(instance.runTask({value: 1}, {options: {factor: 1}})).rejects.toThrow('invalid');
  await runner.close();
});

test('aborting a worker invocation invalidates its state', async () => {
  const runner = new TaskRunner();
  const instance = await runner.initializeTask({...fixture().task, ...workerTask}, {offset: 0});
  const controller = new AbortController();
  const result = instance.runTask({delay: 1000} as any, {
    options: {factor: 1},
    signal: controller.signal
  });
  const rejected = expect(result).rejects.toThrow('stop');
  setTimeout(() => controller.abort(new Error('stop')), 10);
  await rejected;
  await expect(instance.runTask({value: 1}, {options: {factor: 1}})).rejects.toThrow('invalid');
  await runner.close();
});

test('local cancellation waits for settlement before destroying state', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner();
  let resume!: () => void;
  let entered!: () => void;
  const started = new Promise<void>(resolve => {
    entered = resolve;
  });
  const blocked = {
    ...task,
    async process(input, options, context) {
      entered();
      await new Promise<void>(resolve => {
        resume = resolve;
      });
      events.push('settled');
      return task.process(input, options, context);
    }
  };
  const controller = new AbortController();
  const result = runner.runTask(blocked, {value: 1}, {...request, signal: controller.signal});
  const rejected = expect(result).rejects.toThrow('stop');
  await started;
  controller.abort(new Error('stop'));
  expect(events).toEqual(['initialize']);
  resume();
  await rejected;
  expect(events).toEqual(['initialize', 'settled', 'destroy:1']);
  await runner.close();
});

test('close cannot destroy state while initialization is still executing', async () => {
  const runner = new TaskRunner();
  const events: string[] = [];
  let resume!: () => void;
  let entered!: () => void;
  const started = new Promise<void>(resolve => {
    entered = resolve;
  });
  const task = {
    id: 'slow-init',
    async initialize() {
      entered();
      await new Promise<void>(resolve => {
        resume = resolve;
      });
      events.push('initialized');
      return {};
    },
    destroy() {
      events.push('destroyed');
    },
    process() {
      return {};
    }
  };
  const opening = runner.initializeTask(task, {});
  await started;
  const closing = runner.close();
  expect(events).toEqual([]);
  resume();
  await opening;
  await closing;
  expect(events).toEqual(['initialized', 'destroyed']);
});

test('initializer rejection releases capacity and does not call destroy', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner();
  const broken = {
    ...task,
    initialize() {
      throw new Error('init failed');
    }
  };
  await expect(runner.runTask(broken, {value: 1}, request)).rejects.toThrow('init failed');
  expect(events).toEqual([]);
  expect(await runner.runTask(task, {value: 1}, request)).toEqual({value: 3});
  await runner.close();
});

test('early multi-input return closes the producer and destroys each slot', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner({maxConcurrency: 2});
  let returned = false;
  async function* inputs() {
    try {
      yield {value: 1};
      yield {value: 2};
      yield {value: 3};
    } finally {
      returned = true;
    }
  }
  for await (const output of runner.runTasks(task, inputs(), {...request, concurrency: 2})) {
    expect(output).toEqual({value: 3});
    break;
  }
  expect(returned).toBe(true);
  expect(events.filter(event => event.startsWith('destroy'))).toHaveLength(2);
  await runner.close();
});

test('progress callbacks, share validation, output validation, and unknown routes', async () => {
  const runner = new TaskRunner();
  const task = {
    id: 'progress',
    process(_input, _options, context) {
      context.reportProgress({completed: 1});
      return {};
    }
  } satisfies Task<{input: object; output: object}>;
  const progress: unknown[] = [];
  await runner.runTask(task, {}, {onProgress: value => progress.push(value)});
  expect(progress).toEqual([{completed: 1, phase: 'process', unit: 'items'}]);
  await expect(
    runner.runTask(
      task,
      {},
      {
        onProgress() {
          throw new Error('callback');
        }
      }
    )
  ).rejects.toThrow('callback');
  await expect(
    runner.runTask(task, {values: new Float64Array(1)}, {inputOwnership: 'share'})
  ).rejects.toThrow('shared storage');
  await expect(runner.runTask(task, {}, {outputOwnership: 'bad' as any})).rejects.toThrow(
    'output ownership'
  );
  await expect(runner.runTask(task, {}, {inputOwnership: 'bad' as any})).rejects.toThrow(
    'input ownership'
  );
  await expect(runner.runTask(task, {}, {execution: 'bad' as any})).rejects.toThrow(
    'execution mode'
  );
  await runner.close();
});

test('worker targets must have exactly one locator', async () => {
  const runner = new TaskRunner();
  const task = {
    ...workerTask,
    worker: {
      ...workerTask.worker,
      create: () => {
        throw new Error('unused');
      }
    }
  };
  await expect(runner.initializeTask(task, {})).rejects.toThrow('exactly one');
  await runner.close();
});

test('forced worker termination cancels active work and closes the runner', async () => {
  const runner = new TaskRunner();
  const instance = await runner.initializeTask({...fixture().task, ...workerTask}, {offset: 0});
  const result = instance.runTask({delay: 1000} as any, {options: {factor: 1}});
  const rejected = expect(result).rejects.toThrow('stop');
  await new Promise(resolve => setTimeout(resolve, 10));
  await runner.terminate(new Error('stop'));
  await rejected;
  await expect(runner.initializeTask(workerTask, {})).rejects.toThrow('closed');
});

test('cancellation interrupts a blocked asynchronous input producer', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner();
  const controller = new AbortController();
  let returned = false;
  const inputs: AsyncIterable<{value: number}> = {
    [Symbol.asyncIterator]() {
      return {
        next: () => new Promise(() => {}),
        return: async () => {
          returned = true;
          return {done: true, value: undefined};
        }
      };
    }
  };
  const result = collect(
    runner.runTaskInBatches(task, inputs, {...request, signal: controller.signal})
  );
  const rejected = expect(result).rejects.toThrow('stop');
  await new Promise(resolve => setTimeout(resolve, 10));
  controller.abort(new Error('stop'));
  await rejected;
  expect(returned).toBe(true);
  expect(events).toEqual(['initialize', 'destroy:0']);
  await runner.close();
});

test('cancelled local initialization destroys late-returned state and rejects', async () => {
  const runner = new TaskRunner();
  const controller = new AbortController();
  let destroyed = false;
  let resume!: () => void;
  let entered!: () => void;
  const started = new Promise<void>(resolve => {
    entered = resolve;
  });
  const task = {
    id: 'late-init',
    async initialize() {
      entered();
      await new Promise<void>(resolve => {
        resume = resolve;
      });
      return {};
    },
    destroy() {
      destroyed = true;
    },
    process() {
      return {};
    }
  };
  const opening = runner.initializeTask(task, {}, {signal: controller.signal});
  const rejected = expect(opening).rejects.toThrow('stop');
  await started;
  controller.abort(new Error('stop'));
  resume();
  await rejected;
  expect(destroyed).toBe(true);
  await runner.close();
});

test('input transfer cannot detach reusable application-option buffers', async () => {
  const runner = new TaskRunner();
  const values = new Float64Array([1]);
  const task = {
    id: 'alias',
    process(input: {values: Float64Array}, _options: {metadata: Float64Array}) {
      return input;
    }
  };
  await expect(
    runner.runTask(task, {values}, {options: {metadata: values}, inputOwnership: 'transfer'})
  ).rejects.toThrow('aliases');
  expect(values.byteLength).toBe(8);
  await runner.close();
});

test('worker streams preserve RegExp application options', async () => {
  const runner = new TaskRunner();
  try {
    const outputs = await collect(
      runner.runTaskInBatches({...fixture().task, ...workerTask}, [{value: 1}, {value: 2}], {
        ...request,
        options: {factor: 2, pattern: /^2$/} as any
      })
    );
    expect(outputs).toEqual([{value: 5, calls: 1}]);
  } finally {
    await runner.close();
  }
});

test.each(['main-thread', 'worker'] as const)(
  'terminate unwinds paused output iterators on %s',
  async execution => {
    for (const method of ['runTasks', 'runTaskInBatches'] as const) {
      const runner = new TaskRunner();
      const handle = await runner.initializeTask(
        {...fixture().task, ...workerTask},
        {offset: 0},
        {execution}
      );
      const iterator = handle[method]([{value: 1}, {value: 2}], {options: {factor: 1}})[
        Symbol.asyncIterator
      ]();
      await iterator.next();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          runner.terminate(new Error('stop')),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('termination hung')), 2000);
          })
        ]);
      } finally {
        clearTimeout(timer);
        await iterator.return?.();
        await runner.close();
      }
    }
  }
);

test('worker input sharing does not impose sharing on copied application options', async () => {
  const runner = new TaskRunner();
  const task = {...fixture().task, ...workerTask};
  const metadata = new Float64Array([42]);
  try {
    expect(
      await runner.runTask(
        task,
        {value: 1},
        {
          ...request,
          inputOwnership: 'share',
          options: {factor: 2, metadata} as any
        }
      )
    ).toEqual({value: 3, calls: 1});
    expect(metadata.byteLength).toBe(8);
  } finally {
    await runner.close();
  }
});

test('runTasks yields ready results while the producer waits for feedback', async () => {
  const runner = new TaskRunner({maxConcurrency: 2});
  let resume!: () => void;
  const feedback = new Promise<void>(resolve => {
    resume = resolve;
  });
  async function* inputs() {
    yield {value: 1};
    await feedback;
    yield {value: 2};
  }
  const iterator = runner
    .runTasks(fixture().task, inputs(), {...request, concurrency: 2})
    [Symbol.asyncIterator]();
  try {
    expect((await iterator.next()).value).toEqual({value: 3});
    resume();
    expect((await iterator.next()).value).toEqual({value: 5});
    expect((await iterator.next()).done).toBe(true);
  } finally {
    resume();
    await iterator.return?.();
    await runner.close();
  }
});

test('runTasks does not wait for extra capacity taken while reading input', async () => {
  const runner = new TaskRunner({maxConcurrency: 2});
  const {task} = fixture();
  let pinned: Awaited<ReturnType<typeof runner.initializeTask>> | undefined;
  async function* inputs() {
    yield {value: 1};
    pinned = await runner.initializeTask(task, {offset: 0});
    yield {value: 2};
  }
  try {
    expect(await collect(runner.runTasks(task, inputs(), {...request, concurrency: 2}))).toEqual([
      {value: 3},
      {value: 5}
    ]);
  } finally {
    await pinned?.close();
    await runner.close();
  }
});

test('normal early return awaits producer cleanup and propagates cleanup failure', async () => {
  const runner = new TaskRunner();
  const handle = await runner.initializeTask(fixture().task, {offset: 0});
  let cleaned = false;
  async function* inputs() {
    try {
      yield {value: 1};
      yield {value: 2};
    } finally {
      await new Promise(resolve => setTimeout(resolve, 10));
      cleaned = true;
      throw new Error('producer cleanup');
    }
  }
  try {
    const iterator = handle.runTasks(inputs(), {options: {factor: 1}})[Symbol.asyncIterator]();
    await iterator.next();
    await expect(iterator.return?.()).rejects.toThrow('producer cleanup');
    expect(cleaned).toBe(true);
  } finally {
    await runner.close();
  }
});

test('automatic transfer leaves initialization buffers intact', async () => {
  const task = {
    id: 'buffers',
    initialize({buffer}: {buffer: ArrayBuffer}) {
      return {buffer};
    },
    process({buffer}: {buffer: ArrayBuffer}) {
      return {buffer};
    },
    async *processInBatches(inputs: AsyncIterable<{buffer: ArrayBuffer}>) {
      yield* inputs;
    }
  };
  const runner = new TaskRunner();
  try {
    for (const streaming of [false, true]) {
      const initialization = {buffer: new ArrayBuffer(8)};
      const input = {buffer: new ArrayBuffer(8)};
      const controls = {initialization, inputOwnership: 'transfer' as const};
      if (streaming) await collect(runner.runTaskInBatches(task, [input], controls));
      else await runner.runTask(task, input, controls);
      expect(initialization.buffer.byteLength).toBe(8);
      expect(input.buffer.byteLength).toBe(0);
    }
  } finally {
    await runner.close();
  }
});

test.each([false, true])(
  'runner termination aborts blocked input reads (after output: %s)',
  async afterOutput => {
    const runner = new TaskRunner({maxConcurrency: 2});
    let reading!: () => void;
    const blocked = new Promise<void>(resolve => {
      reading = resolve;
    });
    let returned = false;
    let index = 0;
    const inputs: AsyncIterable<{value: number}> = {
      [Symbol.asyncIterator]() {
        return {
          next() {
            if (afterOutput && index++ === 0)
              return Promise.resolve({done: false as const, value: {value: 1}});
            reading();
            return new Promise<IteratorResult<{value: number}>>(() => {});
          },
          async return() {
            returned = true;
            return {done: true as const, value: undefined};
          }
        };
      }
    };
    const iterator = runner
      .runTasks(fixture().task, inputs, {...request, concurrency: 2})
      [Symbol.asyncIterator]();
    if (afterOutput) expect((await iterator.next()).value).toEqual({value: 3});
    const next = iterator.next();
    const rejected = expect(next).rejects.toThrow('stop input reads');
    await blocked;
    await runner.terminate(new Error('stop input reads'));
    await rejected;
    expect(returned).toBe(true);
    await iterator.return?.();
  }
);

test('runTaskSync returns named output and destroys synchronous state before returning', async () => {
  const {task, events} = fixture();
  const runner = new TaskRunner();
  expect(runner.runTaskSync(task, {value: 3}, request)).toEqual({value: 7});
  expect(events).toEqual(['initialize', 'destroy:1']);
  const workerDefined = {...task, ...workerTask};
  expect(runner.runTaskSync(workerDefined, {value: 3}, request)).toEqual({value: 7});
  const busy = await runner.initializeTask(task, {offset: 0});
  expect(() => runner.runTaskSync(task, {value: 1}, request)).toThrow('capacity');
  await busy.close();
  expect(runner.runTaskSync(task, {value: 1}, request)).toEqual({value: 3});
  await runner.close();
  expect(() => runner.runTaskSync(task, {value: 1}, request)).toThrow('closed');
});

test('runTaskSync preserves ownership and cancellation contracts', async () => {
  const task = {
    id: 'sync',
    process: ({values}: {values: Uint8Array}) => {
      values[0]++;
      return {values};
    }
  };
  const runner = new TaskRunner();
  const values = new Uint8Array([1]);
  expect(runner.runTaskSync(task, {values})).toEqual({values: new Uint8Array([2])});
  expect(values[0]).toBe(1);
  const controller = new AbortController();
  controller.abort(new Error('cancel sync'));
  expect(() => runner.runTaskSync(task, {values}, {signal: controller.signal})).toThrow(
    'cancel sync'
  );
  expect(runner.runTaskSync(task, {values}, {inputOwnership: 'transfer'}).values[0]).toBe(2);
  expect(values.byteLength).toBe(0);
  await runner.close();
});

test('runTaskSync rejects async hooks and aggregates processing and cleanup failures', async () => {
  const runner = new TaskRunner();
  const events: string[] = [];
  const task = {
    id: 'sync-failure',
    initialize() {
      events.push('initialize');
      return {};
    },
    process() {
      throw new Error('process');
    },
    destroy() {
      events.push('destroy');
      throw new Error('destroy');
    }
  };
  expect(() => runner.runTaskSync(task, {})).toThrow(AggregateError);
  expect(events).toEqual(['initialize', 'destroy']);
  events.length = 0;
  const asyncTask = {
    ...task,
    async process() {
      return {};
    }
  };
  // JavaScript callers receive a runtime error before any known async hook runs.
  expect(() => runner.runTaskSync(asyncTask as any, {})).toThrow('synchronous');
  expect(events).toEqual([]);
  const hidden = {
    id: 'hidden',
    initialize() {
      return Promise.resolve({});
    },
    process() {
      return {};
    },
    destroy() {
      events.push('late destroy');
    }
  };
  expect(() => runner.runTaskSync(hidden as any, {})).toThrow('promise');
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(events).toEqual(['late destroy']);
  await runner.close();
});

const warmTask = {
  id: 'warm-task',
  worker: {
    url: new URL('../worker-utils/fixtures/warm-task-worker.mjs', import.meta.url),
    capabilities: {atomic: true, streaming: true}
  },
  process: (_input: {fail?: boolean; wait?: boolean}) =>
    ({}) as {identity: number; initialized: number; destroyed: number; calls: number}
};

test('synchronous progress can cancel and cleanup waits for invalid hidden async work', async () => {
  const runner = new TaskRunner();
  const events: string[] = [];
  const controller = new AbortController();
  const task = {
    id: 'sync-progress',
    initialize() {
      return {};
    },
    destroy() {
      events.push('destroy');
    },
    process(_input: object, _options: object, context: any) {
      context.reportProgress({completed: 1});
      return {value: 1};
    }
  };
  expect(() =>
    runner.runTaskSync(
      task,
      {},
      {
        signal: controller.signal,
        onProgress: () => controller.abort(new Error('progress abort'))
      }
    )
  ).toThrow('progress abort');
  expect(events).toEqual(['destroy']);
  events.length = 0;
  let finish!: () => void;
  const hidden = {
    ...task,
    process() {
      return new Promise<object>(resolve => {
        finish = () => resolve({});
      });
    }
  };
  expect(() => runner.runTaskSync(hidden as any, {})).toThrow('promise');
  expect(events).toEqual([]);
  finish();
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(events).toEqual(['destroy']);
  const asyncCleanup = {
    ...task,
    destroy() {
      return Promise.resolve();
    }
  };
  expect(() => runner.runTaskSync(asyncCleanup as any, {})).toThrow('destroy returned a promise');
  await runner.close();
});

test('global preloading deduplicates nested code loading without initializing state', async () => {
  const events: string[] = [];
  const dependency = {
    id: 'dependency',
    async preload() {
      events.push('dependency');
    }
  };
  const task = {
    id: 'nested',
    async preload() {
      events.push('preload');
      await preloadTasks([dependency]);
    },
    initialize() {
      events.push('initialize');
      return {};
    },
    destroy() {
      events.push('destroy');
    },
    process() {
      return {value: 7};
    }
  };
  await Promise.all([preloadTasks([task, task]), preloadTasks([task])]);
  expect(events).toEqual(['preload', 'dependency']);
  const one = new TaskRunner();
  const two = new TaskRunner();
  try {
    expect(one.runTaskSync(task, {})).toEqual({value: 7});
    await two.runTask(task, {});
    expect(events).toEqual([
      'preload',
      'dependency',
      'initialize',
      'destroy',
      'initialize',
      'destroy'
    ]);
  } finally {
    await one.close();
    await two.close();
  }
});

test('automatic local execution awaits preload; failed preload can retry', async () => {
  const runner = new TaskRunner();
  let loads = 0;
  let initialized = 0;
  const task = {
    id: 'retry-preload',
    async preload() {
      if (++loads === 1) throw new Error('load failed');
    },
    initialize() {
      initialized++;
      return {};
    },
    process() {
      return {value: 1};
    }
  };
  try {
    expect(() => runner.runTaskSync(task, {})).toThrow('Preload task');
    await expect(runner.runTask(task, {})).rejects.toThrow('load failed');
    expect(initialized).toBe(0);
    await runner.runTask(task, {});
    expect(loads).toBe(2);
    expect(runner.runTaskSync(task, {})).toEqual({value: 1});
    expect(loads).toBe(2);
  } finally {
    await runner.close();
  }
});

test('cancelling local preload stops waiting without cancelling shared imports', async () => {
  let finish!: () => void;
  let loads = 0;
  const task = {
    id: 'pending-code',
    preload() {
      loads++;
      return new Promise<void>(resolve => {
        finish = resolve;
      });
    }
  };
  const controller = new AbortController();
  const pending = preloadTasks([task], {signal: controller.signal});
  await Promise.resolve();
  controller.abort(new Error('stop loading wait'));
  await expect(pending).rejects.toThrow('stop loading wait');
  const another = preloadTasks([task]);
  finish();
  await another;
  expect(loads).toBe(1);
  await expect(preloadTasks([task], {execution: 'worker'})).rejects.toThrow('no worker');
  await expect(preloadTasks([task], {signal: controller.signal})).rejects.toThrow(
    'stop loading wait'
  );
});

test('worker preloading waits for nested imports without state or retained workers', async () => {
  await preloadTasks([warmTask, warmTask]);
  const runner = new TaskRunner();
  try {
    const first = await runner.runTask(warmTask, {});
    expect(first).toMatchObject({initialized: 1, destroyed: 0, calls: 1, loaded: true});
    const second = await runner.runTask(warmTask, {});
    expect(second.identity).not.toBe(first.identity);
    expect(second).toMatchObject({initialized: 1, destroyed: 0, calls: 1, loaded: true});
  } finally {
    await runner.close();
  }
});

test('worker preload failure and cancellation reject instead of hanging', async () => {
  const target = (name: string) => ({
    id: name,
    worker: {
      url: new URL(`../worker-utils/fixtures/${name}.mjs`, import.meta.url),
      capabilities: {atomic: true, streaming: false}
    }
  });
  await expect(preloadTasks([target('failing-preload-worker')])).rejects.toThrow(
    'nested preload failed'
  );
  const controller = new AbortController();
  const pending = preloadTasks([target('blocked-preload-worker')], {signal: controller.signal});
  setTimeout(() => controller.abort(new Error('stop preload')), 50);
  await expect(pending).rejects.toThrow('stop preload');
});

test('cancelled automatic code loading releases capacity while the shared load continues', async () => {
  const runner = new TaskRunner();
  let finish!: () => void;
  let started!: () => void;
  const loading = new Promise<void>(resolve => {
    started = resolve;
  });
  let initialized = 0;
  let loads = 0;
  const task = {
    id: 'abort-before-state',
    preload() {
      loads++;
      started();
      return new Promise<void>(resolve => {
        finish = resolve;
      });
    },
    initialize() {
      initialized++;
      return {};
    },
    process() {
      return {value: 7};
    }
  };
  const controller = new AbortController();
  const operation = runner.runTask(task, {}, {signal: controller.signal});
  await loading;
  const shared = preloadTasks([task]);
  controller.abort(new Error('cancel code wait'));
  try {
    await expect(operation).rejects.toThrow('cancel code wait');
    expect(initialized).toBe(0);
    expect(await runner.runTask({id: 'available-slot', process: () => ({value: 1})}, {})).toEqual({
      value: 1
    });
    finish();
    await shared;
    expect(await runner.runTask(task, {})).toEqual({value: 7});
    expect(loads).toBe(1);
    expect(initialized).toBe(1);
  } finally {
    finish();
    await runner.terminate();
  }
});

test('terminate does not wait for a stalled code load that has not created state', async () => {
  const runner = new TaskRunner();
  let finish!: () => void;
  let started!: () => void;
  const loading = new Promise<void>(resolve => {
    started = resolve;
  });
  let initialized = false;
  const task = {
    id: 'terminate-code-wait',
    preload() {
      started();
      return new Promise<void>(resolve => {
        finish = resolve;
      });
    },
    initialize() {
      initialized = true;
      return {};
    },
    process() {
      return {};
    }
  };
  const operation = runner.runTask(task, {});
  const rejected = expect(operation).rejects.toThrow('stop runner');
  await loading;
  try {
    await runner.terminate(new Error('stop runner'));
    await rejected;
    expect(initialized).toBe(false);
    finish();
    await preloadTasks([task]);
    expect(initialized).toBe(false);
  } finally {
    finish();
    await runner.terminate();
  }
});

test.each(['main-thread', 'worker'] as const)(
  'automatic setup ownership is independent of payload ownership (%s)',
  async execution => {
    const runner = new TaskRunner();
    const task = {
      id: 'initialization-ownership',
      initialize: ({port}: {port: MessagePort}) => ({port}),
      destroy: (state: {port: MessagePort}) => state.port.close(),
      process: ({value}: {value: number}, _options: {}, context: any) => {
        context.state.port.postMessage(value);
        return {value};
      },
      async *processInBatches(inputs: AsyncIterable<{value: number}>, _options: {}, context: any) {
        for await (const {value} of inputs) {
          context.state.port.postMessage(value);
          yield {value};
        }
      },
      worker: {
        url: new URL('../worker-utils/fixtures/initialization-worker.mjs', import.meta.url),
        capabilities: {atomic: true, streaming: true}
      }
    };
    try {
      for (const streaming of [false, true]) {
        for (const inputOwnership of ['copy', 'share'] as const) {
          const channel = new MessageChannel();
          try {
            const message = new Promise(resolve => {
              channel.port1.onmessage = event => resolve(event.data);
            });
            const request = {
              execution,
              initialization: {port: channel.port2},
              initializationOwnership: 'transfer' as const,
              inputOwnership
            };
            if (streaming) {
              expect(await collect(runner.runTaskInBatches(task, [{value: 7}], request))).toEqual([
                {value: 7}
              ]);
            } else {
              expect(await runner.runTask(task, {value: 7}, request)).toEqual({value: 7});
            }
            expect(await message).toBe(7);
          } finally {
            channel.port1.close();
            channel.port2.close();
          }
        }
      }
      let consumed = false;
      const inputs = {
        *[Symbol.iterator]() {
          consumed = true;
          yield {value: 1};
        }
      };
      await expect(
        collect(
          runner.runTasks(task, inputs, {
            initialization: {port: null as any},
            initializationOwnership: 'transfer'
          } as any)
        )
      ).rejects.toThrow('reusable template');
      expect(consumed).toBe(false);
    } finally {
      await runner.close();
    }
  }
);

test('synchronous setup ownership preserves copied processing input', () => {
  const runner = new TaskRunner();
  const setup = new Uint8Array([3]);
  const input = new Uint8Array([4]);
  const task = {
    id: 'sync-setup-ownership',
    initialize: ({values}: {values: Uint8Array}) => values,
    process: ({values}: {values: Uint8Array}, _options: {}, {state}: {state: Uint8Array}) => ({
      value: state[0] + values[0]
    })
  };
  expect(
    runner.runTaskSync(
      task,
      {values: input},
      {
        initialization: {values: setup},
        initializationOwnership: 'transfer',
        inputOwnership: 'copy'
      }
    )
  ).toEqual({value: 7});
  expect(setup.byteLength).toBe(0);
  expect(input.byteLength).toBe(1);
});

test.runIf(typeof SharedArrayBuffer !== 'undefined')(
  'multi-input setup can share a reusable template',
  async () => {
    const runner = new TaskRunner({maxConcurrency: 2});
    const values = new Int32Array(new SharedArrayBuffer(4));
    const task = {
      id: 'shared-setup-template',
      initialize: ({values}: {values: Int32Array}) => values,
      process: ({value}: {value: number}, _options: {}, {state}: {state: Int32Array}) => ({
        value: Atomics.add(state, 0, value)
      })
    };
    try {
      expect(
        await collect(
          runner.runTasks(task, [{value: 1}, {value: 2}], {
            initialization: {values},
            initializationOwnership: 'share',
            concurrency: 2
          })
        )
      ).toEqual([{value: 0}, {value: 1}]);
      expect(values[0]).toBe(3);
    } finally {
      await runner.close();
    }
  }
);
