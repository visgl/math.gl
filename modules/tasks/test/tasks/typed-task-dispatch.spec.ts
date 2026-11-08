// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, expectTypeOf, test, vi} from 'vitest';
import {
  createTypedTaskDispatcher,
  TaskRunner,
  type Task,
  type TaskOperation,
  type TaskOperationRequest,
  type TaskOperationResult
} from '@math.gl/tasks';

type Operations = {
  count: TaskOperation<{source: string}, number>;
  lookup: TaskOperation<{id: number}, {name: string} | null>;
};

describe('typed task dispatcher', () => {
  test('works with an initialized TaskRunner handle', async () => {
    const task = {
      id: 'dispatch-test',
      initialize: () => ({calls: 0}),
      process(request, _options, {state}) {
        state.calls++;
        return {
          value:
            request.operation === 'count'
              ? request.input.source.length
              : {name: String(request.input.id)}
        };
      }
    } satisfies Task<{
      input: TaskOperationRequest<Operations>;
      output: {value: TaskOperationResult<Operations>};
      state: {calls: number};
    }>;
    const runner = new TaskRunner();
    const handle = await runner.initializeTask(task, {}, {execution: 'main-thread'});
    try {
      const dispatch = createTypedTaskDispatcher<Operations>(
        async request => (await handle.runTask(request)).value
      );
      expect(await dispatch({operation: 'count', input: {source: 'road'}})).toBe(4);
      expect(await dispatch({operation: 'lookup', input: {id: 42}})).toEqual({name: '42'});
    } finally {
      await handle.close();
      await runner.close();
    }
  });
  test('preserves requests, options, result values and errors', async () => {
    const error = new Error('failed');
    const transport = vi.fn(
      async (
        request:
          | {operation: 'count'; input: {source: string}}
          | {operation: 'lookup'; input: {id: number}},
        options?: {signal?: AbortSignal}
      ): Promise<number | {name: string} | null> => {
        if (options?.signal?.aborted) throw error;
        return request.operation === 'count'
          ? request.input.source.length
          : {name: String(request.input.id)};
      }
    );
    const dispatch = createTypedTaskDispatcher<Operations, {signal?: AbortSignal}>(transport);
    const count = dispatch({operation: 'count', input: {source: 'roads'}});
    const feature = dispatch({operation: 'lookup', input: {id: 7}});
    expectTypeOf(count).toEqualTypeOf<Promise<number>>();
    expectTypeOf(feature).toEqualTypeOf<Promise<{name: string} | null>>();
    expect(await count).toBe(5);
    expect(await feature).toEqual({name: '7'});
    const controller = new AbortController();
    controller.abort();
    await expect(
      dispatch({operation: 'count', input: {source: 'x'}}, {signal: controller.signal})
    ).rejects.toBe(error);
    expect(transport).toHaveBeenLastCalledWith(
      {operation: 'count', input: {source: 'x'}},
      {signal: controller.signal}
    );
    if (false) {
      // @ts-expect-error Input must match the selected operation.
      dispatch({operation: 'count', input: {id: 1}});
      // @ts-expect-error Unknown operations are not allowed.
      dispatch({operation: 'missing', input: {}});
    }
  });
});
