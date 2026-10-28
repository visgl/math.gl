// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test, afterEach, vi} from 'vitest';
import {runTask, runTaskInBatches, WorkerFarm, type TaskDescriptor} from '../../src/tasks';

const processor = vi.fn((input: Float64Array, options: {scale?: number} = {}) =>
  input.map(value => value * (options.scale ?? 2))
);
const task: TaskDescriptor<Float64Array, Float64Array, {scale?: number}> = {
  id: 'adaptive-scale',
  name: 'Adaptive scale',
  module: 'test',
  version: '1',
  options: {},
  worker: new URL('../worker-utils/fixtures/task-worker.mjs', import.meta.url).href,
  loadWorker: () =>
    new Worker(new URL('../worker-utils/fixtures/task-worker.mjs', import.meta.url), {
      type: 'module'
    }),
  process: processor
};
afterEach(async () => {
  processor.mockClear();
  await WorkerFarm.getWorkerFarm().destroy();
});

test('small local work avoids worker construction and preserves copy ownership', async () => {
  const input = new Float64Array([1, 2]);
  const routes = [];
  const result = await runTask({...task, worker: false, loadWorker: undefined}, input, {
    mainThread: {maxSize: 16},
    inputOwnership: 'copy',
    scale: 3,
    onExecution: route => routes.push(route)
  });
  expect(result).toEqual(new Float64Array([3, 6]));
  expect(input).toEqual(new Float64Array([1, 2]));
  expect(routes).toEqual(['main-thread']);
  expect(processor).toHaveBeenCalledOnce();
});

test('local transfer detaches input and transfers cached result ownership', async () => {
  const input = new Float64Array([1, 2]);
  const cached = new Float64Array([7, 8]);
  const result = await runTask({...task, process: () => cached}, input, {execution: 'main-thread'});
  expect(input.byteLength).toBe(0);
  expect(cached.byteLength).toBe(0);
  expect(result).toEqual(new Float64Array([7, 8]));
});

test('routing uses an inclusive threshold and sends larger batches to actual workers', async () => {
  const routes = [];
  const output = [];
  for await (const batch of runTaskInBatches(
    task,
    [new Float64Array([1, 2]), new Float64Array([3, 4, 5])],
    {
      mainThread: {maxSize: 16},
      inputOwnership: 'copy',
      onExecution: route => routes.push(route)
    }
  ))
    output.push(batch);
  expect(routes).toEqual(['main-thread', 'worker']);
  expect(output).toEqual([new Float64Array([2, 4]), new Float64Array([6, 8, 10])]);
  expect(processor).toHaveBeenCalledOnce();
});

test('worker mode and auto without a policy always offload', async () => {
  for (const options of [{execution: 'worker' as const, mainThread: {maxSize: 100}}, {}]) {
    expect(await runTask(task, new Float64Array([1]), options)).toEqual(new Float64Array([2]));
  }
  expect(processor).not.toHaveBeenCalled();
});

test('scalar jobs need an explicit cost estimator for auto eligibility', async () => {
  const scalar: TaskDescriptor<number, number> = {...task, process: value => value * 2};
  const route = vi.fn();
  expect(
    await runTask(scalar, 3, {mainThread: {maxSize: 5, getSize: n => n}, onExecution: route})
  ).toBe(6);
  expect(route).toHaveBeenCalledWith('main-thread');
});

test('unknown zero-byte cost does not automatically select the main thread', async () => {
  const fail = new Error('worker path');
  const unknown = {
    ...task,
    worker: false,
    loadWorker: () => {
      throw fail;
    },
    process: () => 1
  };
  // Give both platforms an intentionally missing asset/factory.
  await expect(
    runTask({...unknown, worker: '/missing-task-worker.mjs'}, {} as any, {
      mainThread: {maxSize: 100}
    })
  ).rejects.toThrow();
});

test('explicit main-thread execution rejects missing processors and worker-only constraints', async () => {
  await expect(
    runTask({...task, process: undefined}, new Float64Array(1), {execution: 'main-thread'})
  ).rejects.toThrow('no main-thread processor');
  await expect(
    runTask(task, new Float64Array(1), {execution: 'main-thread', cancellationMode: 'terminate'})
  ).rejects.toThrow('hard termination');
  await expect(runTask(task, new Float64Array(1), {mainThread: {maxSize: -1}})).rejects.toThrow(
    'maxSize'
  );
});

test('local cancellation rejects promptly and discards late completion/progress', async () => {
  const controller = new AbortController();
  const progress = vi.fn();
  let finish;
  let localContext;
  const slow = {
    ...task,
    process: (_input, _options, context) => {
      localContext = context;
      return new Promise<Float64Array>(resolve => {
        finish = resolve;
      });
    }
  };
  const result = runTask(slow, new Float64Array([1]), {
    execution: 'main-thread',
    inputOwnership: 'copy',
    signal: controller.signal,
    onProgress: progress
  });
  controller.abort(new Error('stop local'));
  await expect(result).rejects.toThrow('stop local');
  expect(localContext.signal.aborted).toBe(true);
  localContext.reportProgress({phase: 'late', completed: 1, unit: 'tasks'});
  finish(new Float64Array([99]));
  await Promise.resolve();
  expect(progress).not.toHaveBeenCalled();
});

test('throwing local progress aborts even if a processor catches the callback exception', async () => {
  const catching = {
    ...task,
    process: (input, _options, context) => {
      try {
        context.reportProgress({phase: 'work', completed: 1, unit: 'tasks'});
      } catch {}
      return input;
    }
  };
  await expect(
    runTask(catching, new Float64Array(1), {
      execution: 'main-thread',
      onProgress: () => {
        throw new Error('progress failed');
      }
    })
  ).rejects.toThrow('progress failed');
});

test('already-aborted local work leaves transferable input attached', async () => {
  const controller = new AbortController();
  controller.abort(new Error('early'));
  const input = new Float64Array(1);
  await expect(
    runTask(task, input, {execution: 'main-thread', signal: controller.signal})
  ).rejects.toThrow('early');
  expect(input.byteLength).toBe(8);
  expect(processor).not.toHaveBeenCalled();
});

test('local result must satisfy the same structured-clone boundary as worker output', async () => {
  await expect(
    runTask({...task, process: () => (() => 1) as any}, new Float64Array(1), {
      execution: 'main-thread'
    })
  ).rejects.toThrow();
});

test('adaptive batches cancel a blocked producer and request cleanup', async () => {
  const controller = new AbortController();
  const cleanup = vi.fn();
  const input = {
    [Symbol.asyncIterator]: () => ({
      next: () => new Promise<IteratorResult<Float64Array>>(() => {}),
      return: cleanup
    })
  };
  const iterator = runTaskInBatches(task, input, {signal: controller.signal})[
    Symbol.asyncIterator
  ]();
  const next = iterator.next();
  controller.abort(new Error('stop producer'));
  await expect(next).rejects.toThrow('stop producer');
  expect(cleanup).toHaveBeenCalledOnce();
});

test('an explicit hard-cancellation requirement keeps auto execution on workers', async () => {
  const route = vi.fn();
  expect(
    await runTask(task, new Float64Array([2]), {
      mainThread: {maxSize: 64},
      cancellationMode: 'terminate',
      onExecution: route
    })
  ).toEqual(new Float64Array([4]));
  expect(route).toHaveBeenCalledWith('worker');
  expect(processor).not.toHaveBeenCalled();
});

test('invalid cost estimates reject before processor execution', async () => {
  await expect(
    runTask(task, new Float64Array(1), {
      mainThread: {maxSize: 64, getSize: () => NaN}
    })
  ).rejects.toThrow('size estimate');
  expect(processor).not.toHaveBeenCalled();
});

test('many small local batches yield so UI-style cancellation can be delivered', async () => {
  const controller = new AbortController();
  const busy = {
    ...task,
    process: (input: Float64Array) => {
      const deadline = performance.now() + 2;
      while (performance.now() < deadline) {
        /* Representative synchronous kernel. */
      }
      return input;
    }
  };
  const input = Array.from({length: 30}, () => new Float64Array([1]));
  let completed = 0;
  const timer = setTimeout(() => controller.abort(new Error('cancel stream')), 0);
  try {
    await expect(
      (async () => {
        for await (const output of runTaskInBatches(busy, input, {
          execution: 'main-thread',
          inputOwnership: 'copy',
          signal: controller.signal
        })) {
          expect(output[0]).toBe(1);
          completed++;
        }
      })()
    ).rejects.toThrow('cancel stream');
    expect(completed).toBeLessThan(input.length);
  } finally {
    clearTimeout(timer);
  }
});

test('async routing diagnostics cannot produce an unhandled rejection or fail the task', async () => {
  expect(
    await runTask(task, new Float64Array([1]), {
      execution: 'main-thread',
      onExecution: async () => {
        throw new Error('diagnostic');
      }
    })
  ).toEqual(new Float64Array([2]));
});

test('independent transfer batches retain reusable option/context buffers across local and worker routes', async () => {
  const weights = new Float64Array([3]);
  const backing = new ArrayBuffer(16);
  const optionView = new Uint8Array(backing, 0, 8);
  const contextView = new Uint8Array(backing, 8, 8);
  const inputs = [new Float64Array([1]), new Float64Array([2, 3])];
  const routes = [];
  const result = [];
  const local = {
    ...task,
    process: (input, options, _context, jobContext) => {
      expect(options.optionView.buffer).toBe(jobContext.contextView.buffer);
      expect(options.weights[0]).toBe(3);
      return input.map(value => value * (options.scale ?? 2));
    }
  };
  for await (const output of runTaskInBatches(
    local,
    inputs,
    {
      mainThread: {maxSize: 8},
      weights,
      optionView,
      onExecution: route => routes.push(route)
    },
    {},
    {contextView}
  ))
    result.push(output);
  expect(routes).toEqual(['main-thread', 'worker']);
  expect(result).toEqual([new Float64Array([2]), new Float64Array([4, 6])]);
  expect(inputs.map(input => input.byteLength)).toEqual([0, 0]);
  expect(weights.byteLength).toBe(8);
  expect(backing.byteLength).toBe(16);
});

test('all-worker transfer batches keep metadata reusable after the first request', async () => {
  const weights = new Float64Array([3]);
  const contextData = new Float64Array([4]);
  const outputs = [];
  for await (const output of runTaskInBatches(
    task,
    [new Float64Array([1]), new Float64Array([2])],
    {execution: 'worker', weights},
    {},
    {contextData}
  )) {
    outputs.push(output[0]);
  }
  expect(outputs).toEqual([2, 4]);
  expect(weights.byteLength).toBe(8);
  expect(contextData.byteLength).toBe(8);
});

test('transfer aliases with reusable metadata reject before detachment; copy preserves aliases', async () => {
  const input = new Float64Array([1]);
  const transferring = runTaskInBatches(task, [input], {execution: 'main-thread', metadata: input});
  await expect(transferring[Symbol.asyncIterator]().next()).rejects.toThrow('aliases reusable');
  expect(input.byteLength).toBe(8);
  const aliasTask = {
    ...task,
    process: (data, options) => {
      expect(data.buffer).toBe(options.metadata.buffer);
      return data;
    }
  };
  const copied = [];
  for await (const result of runTaskInBatches(aliasTask, [input], {
    execution: 'main-thread',
    inputOwnership: 'copy',
    metadata: input
  }))
    copied.push(result);
  expect(copied[0]).toEqual(input);
  expect(input.byteLength).toBe(8);
});
