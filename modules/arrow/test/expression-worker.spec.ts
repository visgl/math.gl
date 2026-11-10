// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table, Int32, Float64, FixedSizeList, Field, Schema, vectorFromArray} from 'apache-arrow';
import {parseSQLExpression} from '@math.gl/core/sql';
import {TaskRunner} from '@math.gl/tasks';
import {
  createArrowExpressionTask,
  prepareArrowExpressionInput,
  hydrateArrowExpressionResult
} from '../src/expressions/worker';

const task = createArrowExpressionTask({
  worker: {
    url: new URL('./fixtures/expression-worker.mjs', import.meta.url),
    capabilities: {atomic: true, streaming: false}
  }
});
function table() {
  return new Table({x: vectorFromArray([1, null, 3], new Int32())}).concat(
    new Table({x: vectorFromArray([4, 5], new Int32())})
  );
}

test.each(['main-thread', 'worker'] as const)(
  'whole-table task matches local results with copy ownership in %s',
  async execution => {
    const runner = new TaskRunner();
    const input = table().slice(1, 5);
    try {
      const handle = await runner.initializeTask(task, {expression: 'x * 2'}, {execution});
      try {
        const result = hydrateArrowExpressionResult(
          await handle.runTask(prepareArrowExpressionInput(input))
        );
        expect([...result.vector]).toEqual([null, 6, 8, 10]);
        expect(result.vector.data.map(data => data.length)).toEqual([2, 2]);
        expect([...input.getChild('x')!]).toEqual([null, 3, 4, 5]);
        expect([
          ...hydrateArrowExpressionResult(
            await handle.runTask(
              prepareArrowExpressionInput(input, {activeRows: new Uint8Array([1, 0, 1, 0])})
            )
          ).vector
        ]).toEqual([null, null, 8, null]);
        await expect(
          handle.runTask(
            prepareArrowExpressionInput(new Table(new Schema([new Field('y', new Int32())]), []))
          )
        ).rejects.toThrow('schema mismatch');
      } finally {
        await handle.close();
      }
    } finally {
      await runner.close();
    }
  }
);

test('worker transfer detaches owned input buffers and preserves custom output metadata', async () => {
  const runner = new TaskRunner();
  const input = table();
  const buffer = input.getChild('x')!.data[0]!.values.buffer;
  try {
    const result = hydrateArrowExpressionResult(
      await runner.runTask(task, prepareArrowExpressionInput(input), {
        execution: 'worker',
        initialization: {expression: 'double(x)'},
        inputOwnership: 'transfer'
      })
    );
    expect(buffer.byteLength).toBe(0);
    expect([...result.vector]).toEqual([2, null, 6, 8, 10]);
    expect(result.field.metadata.get('unit')).toBe('count');
  } finally {
    await runner.close();
  }
});

test('worker predicates, empty inputs and worker-local Turf registration', async () => {
  const runner = new TaskRunner();
  try {
    const input = table();
    const result = hydrateArrowExpressionResult(
      await runner.runTask(task, prepareArrowExpressionInput(input), {
        execution: 'worker',
        initialization: {
          predicate: {op: '>', args: [{property: 'x'}, {parameter: 'min'}]},
          parameters: {min: 3}
        }
      })
    );
    expect([...result.vector]).toEqual([false, null, false, true, true]);
    const empty = hydrateArrowExpressionResult(
      await runner.runTask(task, prepareArrowExpressionInput(new Table(input.schema, [])), {
        execution: 'worker',
        initialization: {expression: 'x + 1'}
      })
    );
    expect(empty.vector.type.toString()).toBe('Int32');
    expect(empty.vector.length).toBe(0);
    const type = new FixedSizeList(2, new Field('xy', new Float64(), true));
    const fields = ['a', 'b'].map(
      name => new Field(name, type, true, new Map([['ARROW:extension:name', 'geoarrow.point']]))
    );
    const points = new Table(new Schema(fields), {
      a: vectorFromArray([[0, 0], null], type),
      b: vectorFromArray(
        [
          [0, 1],
          [0, 1]
        ],
        type
      )
    });
    const distances = hydrateArrowExpressionResult(
      await runner.runTask(task, prepareArrowExpressionInput(points), {
        execution: 'worker',
        initialization: {expression: 'distance(a, b)'}
      })
    );
    expect(distances.vector.get(0)).toBeCloseTo(111.195, 2);
    expect(distances.vector.get(1)).toBeNull();
  } finally {
    await runner.close();
  }
});

test('worker cancellation rejects promptly and errors propagate', async () => {
  const runner = new TaskRunner();
  try {
    let input = table();
    for (let i = 0; i < 6; i++) input = input.concat(input);
    const controller = new AbortController();
    let progress = 0;
    await expect(
      runner.runTask(task, prepareArrowExpressionInput(input), {
        execution: 'worker',
        initialization: {expression: 'x + 1'},
        signal: controller.signal,
        onProgress: () => {
          progress++;
          controller.abort(new Error('stop expression'));
        }
      })
    ).rejects.toThrow('stop expression');
    expect(progress).toBeGreaterThan(0);
    await expect(
      runner.runTask(task, prepareArrowExpressionInput(table()), {
        execution: 'worker',
        initialization: {expression: 'missing(x)'}
      })
    ).rejects.toThrow('Unknown Arrow function');
    await expect(
      runner.runTask(task, prepareArrowExpressionInput(table()), {
        execution: 'worker',
        initialization: {expression: 'x + 1'},
        signal: controller.signal
      })
    ).rejects.toThrow('stop expression');
  } finally {
    await runner.close();
  }
});

test('worker transport preserves sliced dictionaries and rejects invalid masks', async () => {
  const runner = new TaskRunner();
  const table = new Table({text: vectorFromArray(['skip', 'a', null, 'b'])}).slice(1, 4);
  try {
    const result = hydrateArrowExpressionResult(
      await runner.runTask(task, prepareArrowExpressionInput(table), {
        execution: 'worker',
        initialization: {expression: 'text == "a"'}
      })
    );
    expect([...result.vector]).toEqual([true, null, false]);
    await expect(
      runner.runTask(task, prepareArrowExpressionInput(table, {activeRows: new Uint8Array([1])}), {
        execution: 'worker',
        initialization: {expression: 'text'}
      })
    ).rejects.toThrow('activeRows');
  } finally {
    await runner.close();
  }
});

test('worker transports RGBA results, typed array arguments, metadata and sliced chunks', async () => {
  const runner = new TaskRunner();
  try {
    const input = table().slice(1, 5);
    const result = hydrateArrowExpressionResult(
      await runner.runTask(
        task,
        prepareArrowExpressionInput(input, {activeRows: new Uint8Array([1, 1, 0, 1])}),
        {
          execution: 'worker',
          initialization: {expression: 'color(x, [7, 9])'}
        }
      )
    );
    expect(Array.from(result.vector, row => (row === null ? null : Array.from(row)))).toEqual([
      null,
      [3, 7, 0, 1],
      null,
      [5, 7, 0, 1]
    ]);
    expect(result.vector.data.map(data => data.length)).toEqual([2, 2]);
    expect(result.field.metadata.get('color-space')).toBe('srgb');
  } finally {
    await runner.close();
  }
});

test.runIf(typeof globalThis.Float16Array === 'function')(
  'worker transports Float16 SQL cast output as Arrow Uint16 bits',
  async () => {
    const runner = new TaskRunner();
    try {
      const result = hydrateArrowExpressionResult(
        await runner.runTask(task, prepareArrowExpressionInput(table()), {
          execution: 'worker',
          initialization: {expression: 'cast(x, "float16")'}
        })
      );
      expect([...result.vector]).toEqual([1, null, 3, 4, 5]);
      expect(result.vector.type.toString()).toBe('Float16');
      expect(result.vector.data[0]!.values).toBeInstanceOf(Uint16Array);
    } finally {
      await runner.close();
    }
  }
);
test('worker-local color declarations produce Uint8 RGBA', async () => {
  const runner = new TaskRunner();
  try {
    const input = table();
    const result = hydrateArrowExpressionResult(
      await runner.runTask(task, prepareArrowExpressionInput(input), {
        execution: 'worker',
        initialization: {expression: 'COLOR_TO_RGBA8(COLOR_RGB(toFloat64(x) / 5, 0, 0))'}
      })
    );
    expect(Array.from(result.vector, row => (row === null ? null : Array.from(row)))).toEqual([
      [51, 0, 0, 255],
      null,
      [153, 0, 0, 255],
      [204, 0, 0, 255],
      [255, 0, 0, 255]
    ]);
  } finally {
    await runner.close();
  }
});

test('SQL AST and worker-local math preserve TRY fallbacks and genuine nulls across batches', async () => {
  const runner = new TaskRunner();
  const input = new Table({x: vectorFromArray([4, -1, null], new Float64())}).concat(
    new Table({x: vectorFromArray([9, -4], new Float64())})
  );
  try {
    const result = hydrateArrowExpressionResult(
      await runner.runTask(task, prepareArrowExpressionInput(input), {
        execution: 'worker',
        initialization: {expression: parseSQLExpression('TRY(SQRT(x), 0)')}
      })
    );
    expect([...result.vector]).toEqual([2, 0, null, 3, 0]);
    expect(result.vector.data.map(data => data.length)).toEqual([3, 2]);
  } finally {
    await runner.close();
  }
});
