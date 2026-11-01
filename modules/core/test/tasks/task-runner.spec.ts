// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {TaskRunner, type Task} from '../../src/tasks';

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
