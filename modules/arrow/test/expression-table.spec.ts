// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Table,
  Int32,
  Int8,
  Dictionary,
  Struct,
  FixedSizeList,
  Utf8,
  Schema,
  Field,
  vectorFromArray
} from 'apache-arrow';
import {
  compileArrowExpression,
  compileArrowFunction,
  compileArrowPredicate,
  ArrowFunctionRegistry
} from '../src/expressions';

function table() {
  return new Table({
    x: vectorFromArray([1, null, 3], new Int32()),
    text: vectorFromArray(['a', null, 'é'], new Utf8())
  }).concat(
    new Table({
      x: vectorFromArray([4, 5], new Int32()),
      text: vectorFromArray(['z', 'b'], new Utf8())
    })
  );
}

test('whole-table evaluation preserves batch order, masks, slices and source projection buffers', () => {
  const input = table().slice(1, 5);
  const compiled = compileArrowExpression('x + 1', {
    inputSchema: input.schema
  });
  const output = compiled.evaluateTable(input);
  expect([...output]).toEqual([null, 4, 5, 6]);
  expect(output.data.map(chunk => chunk.length)).toEqual(input.batches.map(batch => batch.numRows));
  expect([
    ...compiled.evaluateTable(input, {
      activeRows: new Uint8Array([1, 0, 1, 0])
    })
  ]).toEqual([null, null, 5, null]);
  const projection = compileArrowExpression('x', {
    inputSchema: input.schema
  }).evaluateTable(input);
  projection.data.forEach((chunk, index) =>
    expect(chunk.values.buffer).toBe(input.batches[index]!.getChild('x')!.data[0]!.values.buffer)
  );
  expect([
    ...compileArrowExpression('text < "z"', {
      inputSchema: input.schema
    }).evaluateTable(input)
  ]).toEqual([null, false, false, true]);
});

test('empty tables retain output type and still validate schema, masks and cancellation', () => {
  const input = table();
  const compiled = compileArrowExpression('x + 1', {
    inputSchema: input.schema
  });
  const empty = new Table(input.schema, []);
  expect(compiled.evaluateTable(empty).type.toString()).toBe('Int32');
  expect(compiled.evaluateTable(empty).length).toBe(0);
  expect(() =>
    compiled.evaluateTable(new Table(new Schema([new Field('other', new Int32())]), []))
  ).toThrow('schema mismatch');
  expect(() => compiled.evaluateTable(empty, {activeRows: new Uint8Array([1])})).toThrow(
    'activeRows'
  );
  expect(() =>
    compiled.evaluateTable(input, {
      activeRows: new Uint8Array([1, 2, 1, 1, 1])
    })
  ).toThrow('activeRows');
  const controller = new AbortController();
  controller.abort();
  expect(() => compiled.evaluateTable(empty, {signal: controller.signal})).toThrow();
});

test('predicates, dictionaries and direct scalar functions work over all batches', () => {
  const input = new Table({text: vectorFromArray(['a', null, 'b'])});
  const compiled = compileArrowPredicate(
    {op: 'in', args: [{property: 'text'}, ['a']]},
    {inputSchema: input.schema}
  );
  expect([...compiled.evaluateTable(input)]).toEqual([true, null, false]);
  expect(
    compileArrowExpression('text', {inputSchema: input.schema}).evaluateTable(input).type.toString()
  ).toBe('Utf8');
  const data = table();
  let calls = 0;
  const registry = new ArrowFunctionRegistry().registerFunction('increment', {
    arguments: [new Field('x', new Int32())],
    result: new Field('y', new Int32()),
    scalar: (x: number) => {
      calls++;
      return x + 1;
    }
  });
  expect([
    ...compileArrowExpression('x > 3 ? increment(x) : 0', {
      inputSchema: data.schema,
      registry
    }).evaluateTable(data)
  ]).toEqual([0, 0, 0, 5, 6]);
  expect(calls).toBe(2);
});

test('vector-only functions accept matching dictionary encodings', () => {
  const input = new Table({text: vectorFromArray(['a', null, 'bbb'])});
  const type = input.schema.fields[0]!.type;
  const registry = new ArrowFunctionRegistry().registerFunction('size', {
    arguments: [new Field('text', type, true)],
    result: new Field('size', new Int32(), true),
    kernel: ([text], {activeRows}) => {
      expect(text!.type).toBe(type);
      return vectorFromArray(
        Array.from(activeRows, (active, row) => (active ? text!.get(row).length : null)),
        new Int32()
      );
    }
  });
  expect([
    ...compileArrowExpression('size(text)', {
      inputSchema: input.schema,
      registry
    }).evaluateTable(input)
  ]).toEqual([1, null, 3]);
  registry.registerFunction('logicalSize', {
    ...registry.getFunction('size')!,
    arguments: [new Field('text', new Utf8(), true)]
  });
  expect([
    ...compileArrowExpression('logicalSize(text)', {
      inputSchema: input.schema,
      registry
    }).evaluateTable(input)
  ]).toEqual([1, null, 3]);
  registry.registerFunction('wrongEncoding', {
    arguments: [new Field('text', new Dictionary(new Utf8(), new Int8()), true)],
    result: new Field('size', new Int32(), true),
    kernel: () => vectorFromArray([], new Int32())
  });
  expect(() =>
    compileArrowExpression('wrongEncoding(text)', {
      inputSchema: input.schema,
      registry
    })
  ).toThrow('Argument type mismatch');
});

test('nested schema validation ignores descriptive metadata but checks extensions', () => {
  const schema = (metadata: Map<string, string>) =>
    new Schema([
      new Field('unused', new Struct([new Field('child', new Int32(), true, metadata)]))
    ]);
  const compiled = compileArrowExpression('1', {
    inputSchema: schema(new Map([['description', 'original']]))
  });
  expect(
    compiled.evaluateTable(new Table(schema(new Map([['description', 'updated']])), [])).length
  ).toBe(0);
  expect(() =>
    compiled.evaluateTable(new Table(schema(new Map([['ARROW:extension:name', 'different']])), []))
  ).toThrow('schema mismatch');
});

test('dictionary declarations reject literals before invoking a vector kernel', () => {
  const registry = new ArrowFunctionRegistry().registerFunction('encoded', {
    arguments: [new Field('text', new Dictionary(new Utf8(), new Int8()), true)],
    result: new Field('result', new Int32()),
    kernel: () => {
      throw new Error('must not execute');
    }
  });
  for (const argument of ['"a"', 'null']) {
    expect(() =>
      compileArrowFunction('encoded', [argument], {
        inputSchema: new Schema([]),
        registry
      })
    ).toThrow('dictionary-encoded source column');
  }
});

test('nested list sizes match structurally even when type strings are uninformative', () => {
  const field = (size: number) => {
    const type = new FixedSizeList(size, new Field('coordinate', new Int32()));
    type.toString = () => '[object Object]';
    return new Field('point', type);
  };
  const xy = field(2);
  const xyz = field(3);
  const schema = new Schema([xy]);
  const compiled = compileArrowExpression('1', {inputSchema: schema});
  expect(compiled.evaluateTable(new Table(new Schema([field(2)]), [])).length).toBe(0);
  expect(() => compiled.evaluateTable(new Table(new Schema([xyz]), []))).toThrow('schema mismatch');
  const registry = new ArrowFunctionRegistry().registerFunction('pointValue', {
    arguments: [xyz],
    result: new Field('value', new Int32()),
    kernel: () => vectorFromArray([], new Int32())
  });
  expect(() =>
    compileArrowFunction('pointValue', ['point'], {
      inputSchema: schema,
      registry
    })
  ).toThrow('Argument type mismatch');
});
