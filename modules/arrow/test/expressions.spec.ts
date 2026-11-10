// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  Bool,
  Field,
  Float32,
  Null,
  Vector,
  Float64,
  Int8,
  Int32,
  Int64,
  Utf8,
  Table,
  vectorFromArray
} from 'apache-arrow';
import {
  compileArrowExpression,
  compileArrowFunction,
  compileArrowPredicate,
  ArrowFunctionRegistry
} from '../src/expressions';

function batch(columns: Record<string, Vector>) {
  return new Table(columns).batches[0]!;
}
function values(expression: string, input: ReturnType<typeof batch>) {
  return [...compileArrowExpression(expression, {inputSchema: input.schema}).evaluate(input)];
}

test('Arrow expressions bind numeric literals to columns and preserve output types', () => {
  const input = batch({x: vectorFromArray([1, 2, null], new Int32())});
  const compiled = compileArrowExpression('x * 2 + 1', {inputSchema: input.schema});
  expect([...compiled.evaluate(input)]).toEqual([3, 5, null]);
  expect(compiled.outputField.type.toString()).toBe('Int32');
  expect(values('x >= 2', input)).toEqual([false, true, null]);
});

test.each(['&&', '||'])('Arrow Boolean %s uses SQL truth tables', op => {
  const rows = [true, false, null].flatMap(a => [true, false, null].map(b => [a, b]));
  const input = batch({
    a: vectorFromArray(
      rows.map(row => row[0]),
      new Bool()
    ),
    b: vectorFromArray(
      rows.map(row => row[1]),
      new Bool()
    )
  });
  const expected = rows.map(([a, b]) =>
    op === '&&'
      ? a === false || b === false
        ? false
        : a === null || b === null
          ? null
          : true
      : a === true || b === true
        ? true
        : a === null || b === null
          ? null
          : false
  );
  expect(values(`a ${op} b`, input)).toEqual(expected);
  expect(values('!a', input)).toEqual(rows.map(([a]) => (a === null ? null : !a)));
});

test('UTF8 comparisons and parses do not decode input strings', () => {
  const input = batch({text: vectorFromArray(['12', '-3', null, 'bad', 'é'], new Utf8())});
  const decode = vi.spyOn(TextDecoder.prototype, 'decode').mockImplementation(() => {
    throw new Error('unexpected decode');
  });
  try {
    expect(values('parseNumber(text)', input)).toEqual([12, -3, null, null, null]);
    expect(values('parseNumber(isNull(text) ? "0" : text)', input)).toEqual([
      12,
      -3,
      0,
      null,
      null
    ]);
    expect(values('text < "20"', input)).toEqual([true, true, null, false, false]);
    expect(values('isNull(text)', input)).toEqual([false, false, true, false, false]);
  } finally {
    decode.mockRestore();
  }
});

test('sliced numeric, Boolean, UTF8 and dictionary buffers preserve offsets and nulls', () => {
  const input = batch({
    x: vectorFromArray([90, 1, null, 3, 90], new Int32()),
    flag: vectorFromArray([false, true, null, false, true], new Bool()),
    text: vectorFromArray(['skip', 'a', null, 'é', 'skip'])
  }).slice(1, 4);
  expect(values('x + 1', input)).toEqual([2, null, 4]);
  expect(values('flag || false', input)).toEqual([true, null, false]);
  expect(values('text == "a"', input)).toEqual([true, null, false]);
  const result = compileArrowExpression('text', {inputSchema: input.schema}).evaluate(input);
  expect(result.type.toString()).toBe('Utf8');
  expect([...result]).toEqual(['a', null, 'é']);
});

test('inactive branches never call registered scalar functions', () => {
  const scalar = vi.fn((x: number) => {
    if (x === 0) throw new Error('inactive');
    return 10 / x;
  });
  const registry = new ArrowFunctionRegistry().registerFunction('inverse', {
    arguments: [new Field('x', new Float64(), false)],
    result: new Field('inverse', new Float64(), false),
    scalar
  });
  const input = batch({x: vectorFromArray([0, 2, null], new Float64())});
  const options = {inputSchema: input.schema, registry};
  expect([...compileArrowExpression('x != 0 ? inverse(x) : 0', options).evaluate(input)]).toEqual([
    0, 5, 0
  ]);
  expect(scalar).toHaveBeenCalledTimes(1);
  expect([...compileArrowExpression('x == 0 || inverse(x) > 1', options).evaluate(input)]).toEqual([
    true,
    true,
    null
  ]);
  expect(scalar).toHaveBeenCalledTimes(2);
});

test('scalar and vector functions share typing, masks, null propagation and direct calls', () => {
  const input = batch({x: vectorFromArray([1, null, 3], new Int32())});
  const scalar = vi.fn((x: number) => x * 2);
  const kernel = vi.fn((args, context) =>
    vectorFromArray(
      Array.from({length: context.length}, (_, row) =>
        context.activeRows[row] ? Number(args[0].get(row)) * 2 : null
      ),
      new Int32()
    )
  );
  const declaration = {
    arguments: [new Field('x', new Int32(), false)],
    result: new Field('double', new Int32(), false),
    scalar
  };
  const scalarRegistry = new ArrowFunctionRegistry().registerFunction('double', declaration);
  const vectorRegistry = new ArrowFunctionRegistry().registerFunction('double', {
    ...declaration,
    kernel
  });
  const a = compileArrowFunction('double', ['x'], {
    inputSchema: input.schema,
    registry: scalarRegistry
  });
  const b = compileArrowExpression('double(x)', {
    inputSchema: input.schema,
    registry: vectorRegistry
  });
  expect([...a.evaluate(input)]).toEqual([2, null, 6]);
  expect([...b.evaluate(input)]).toEqual([2, null, 6]);
  expect([...b.evaluate(input, {activeRows: new Uint8Array([0, 1, 1])})]).toEqual([null, null, 6]);
  expect([...kernel.mock.calls[1]![1].activeRows]).toEqual([0, 0, 1]);
  expect(scalar).toHaveBeenCalledTimes(2);
});

test('null-aware functions receive null values explicitly', () => {
  const registry = new ArrowFunctionRegistry().registerFunction('fill', {
    arguments: [new Field('x', new Int32(), true)],
    result: new Field('filled', new Int32(), false),
    nullHandling: 'call',
    scalar: x => (x === null ? 0 : x)
  });
  const input = batch({x: vectorFromArray([1, null], new Int32())});
  expect([
    ...compileArrowExpression('fill(x)', {inputSchema: input.schema, registry}).evaluate(input)
  ]).toEqual([1, 0]);
});

test('portable predicates compile through shared Arrow kernels and bind parameters', () => {
  const input = batch({x: vectorFromArray([1, 2, 3, null], new Int32())});
  const compiled = compileArrowPredicate(
    {
      op: 'and',
      args: [
        {op: '>=', args: [{property: 'x'}, {parameter: 'min'}]},
        {op: 'in', args: [{property: ['x']}, [2, 3]]}
      ]
    },
    {inputSchema: input.schema, parameters: {min: 2}}
  );
  expect([...compiled.evaluate(input)]).toEqual([false, true, true, null]);
  expect(() =>
    compileArrowPredicate(
      {op: '=', args: [{property: 'x'}, {parameter: 'missing'}]},
      {inputSchema: input.schema}
    )
  ).toThrow('requires a value');
});

test('integer bounds and exact argument types are checked before truncation', () => {
  const input = batch({x: vectorFromArray([127], new Int8())});
  expect(() => values('x + 1', input)).toThrow('overflow');
  expect(() => values('x == 128', input)).toThrow('overflow');
  expect(values('x / 2', input)).toEqual([63]);
  expect(values('toFloat64(x) / 2', input)).toEqual([63.5]);
  expect(() => values('x / 0', input)).toThrow('zero');
  const big = batch({x: vectorFromArray([9223372036854775807n], new Int64())});
  expect([
    ...compileArrowPredicate(
      {op: '=', args: [{property: 'x'}, 9223372036854775807n]},
      {inputSchema: big.schema}
    ).evaluate(big)
  ]).toEqual([true]);
});

test('empty batches, masks, schema mismatch and unsupported syntax fail predictably', () => {
  const table = new Table({x: vectorFromArray([1, 2], new Int32())});
  const input = table.batches[0]!,
    compiled = compileArrowExpression('x+1', {inputSchema: input.schema});
  expect([...compiled.evaluate(input.slice(0, 0))]).toEqual([]);
  expect(() => compiled.evaluate(batch({x: vectorFromArray([1, 2], new Float64())}))).toThrow(
    'schema mismatch'
  );
  expect(() => compiled.evaluate(input, {activeRows: new Uint8Array([2, 0])})).toThrow(
    'activeRows'
  );
  for (const expression of ['missing', 'x.foo', '[x]', 'x ** 2', 'missing(x)'])
    expect(() => compileArrowExpression(expression, {inputSchema: input.schema})).toThrow();
});

test('kernel contracts reject wrong results and skip inactive invocations', () => {
  const input = batch({x: vectorFromArray([1, 2], new Int32())});
  const kernel = vi.fn(() => vectorFromArray([1], new Int32()));
  const registry = new ArrowFunctionRegistry().registerFunction('custom', {
    arguments: [new Field('x', new Int32(), true)],
    result: new Field('out', new Int32(), false),
    scalar: x => x,
    kernel
  });
  const compiled = compileArrowExpression('custom(x)', {inputSchema: input.schema, registry});
  expect([...compiled.evaluate(input, {activeRows: new Uint8Array(2)})]).toEqual([null, null]);
  expect(kernel).not.toHaveBeenCalled();
  expect(() => compiled.evaluate(input)).toThrow('Invalid kernel result');
  kernel.mockReturnValue(vectorFromArray([null, null], new Int32()));
  expect(() => compiled.evaluate(input)).toThrow('non-nullable');
});

test('typed function registries reject reserved names, duplicates and incompatible inputs', () => {
  const declaration = {
    arguments: [new Field('x', new Float64(), false)],
    result: new Field('out', new Float64(), false),
    scalar: (x: number) => x
  };
  const registry = new ArrowFunctionRegistry().registerFunction('identity', declaration);
  expect(() => registry.registerFunction('identity', declaration)).toThrow('Duplicate');
  expect(() => registry.registerFunction('isNull', declaration)).toThrow('Reserved');
  const input = batch({x: vectorFromArray([1], new Int32())});
  expect(() =>
    compileArrowFunction('identity', ['x'], {inputSchema: input.schema, registry})
  ).toThrow('type mismatch');
  expect(() => compileArrowFunction('identity', [], {inputSchema: input.schema, registry})).toThrow(
    'argument count'
  );
});

test('UTF8 bigint and Boolean conversions, Unicode ordering and floating NaNs', () => {
  const input = batch({
    text: vectorFromArray(['9223372036854775807', 'true', 'false', 'é', '😀', null], new Utf8())
  });
  expect(values('parseBigInt(text)', input)).toEqual([
    9223372036854775807n,
    null,
    null,
    null,
    null,
    null
  ]);
  expect(values('parseBoolean(text)', input)).toEqual([null, true, false, null, null, null]);
  expect(values('text > "é"', input)).toEqual([false, false, false, false, true, null]);
  const numeric = batch({x: vectorFromArray([NaN, Infinity, -Infinity, -0], new Float64())});
  expect(values('x == x', numeric)).toEqual([false, true, true, true]);
  expect(values('x != x', numeric)).toEqual([true, false, false, false]);
});

test('fused expressions call condition functions once and mask vector kernel branches', () => {
  const input = batch({x: vectorFromArray([0, 2, null], new Int32())});
  const condition = vi.fn((x: number | null) => x !== null && x > 0);
  const kernel = vi.fn((args, context) => {
    expect([...context.activeRows]).toEqual([0, 1, 0]);
    expect(args[0].get(1)).toBe(5);
    return vectorFromArray([null, 10, null], new Int32());
  });
  const registry = new ArrowFunctionRegistry()
    .registerFunction('positive', {
      arguments: [new Field('x', new Int32(), true)],
      result: new Field('positive', new Bool(), false),
      nullHandling: 'call',
      scalar: condition
    })
    .registerFunction('twice', {
      arguments: [new Field('x', new Int32(), false)],
      result: new Field('twice', new Int32(), false),
      scalar: (x: number) => x * 2,
      kernel
    });
  const compiled = compileArrowExpression('positive(x) ? twice(x * 2 + 1) : 0', {
    inputSchema: input.schema,
    registry
  });
  expect([...compiled.evaluate(input)]).toEqual([0, 10, 0]);
  expect(condition).toHaveBeenCalledTimes(3);
  expect(kernel).toHaveBeenCalledTimes(1);
  expect(values('null ? x : 0', input)).toEqual([0, 0, 0]);
});

test('fused Float32 intermediates retain declared precision', () => {
  const input = batch({x: vectorFromArray([16777216], new Float32())});
  expect(values('(x + 1) - x', input)).toEqual([0]);
  const registry = new ArrowFunctionRegistry().registerFunction('increment', {
    arguments: [new Field('x', new Float32())],
    result: new Field('result', new Float32()),
    scalar: (x: number) => x + 1
  });
  expect([
    ...compileArrowExpression('increment(x) - x', {inputSchema: input.schema, registry}).evaluate(
      input
    )
  ]).toEqual([0]);
});

test('Null result functions still execute on active rows', () => {
  const input = batch({x: vectorFromArray([1, 2], new Int32())});
  const scalar = vi.fn(() => null);
  const registry = new ArrowFunctionRegistry().registerFunction('observe', {
    arguments: [new Field('x', new Int32())],
    result: new Field('result', new Null(), true),
    scalar
  });
  expect([
    ...compileArrowExpression('observe(x)', {inputSchema: input.schema, registry}).evaluate(input)
  ]).toEqual([null, null]);
  expect(scalar).toHaveBeenCalledTimes(2);
});

test('literal nulls use Boolean context and comparison null semantics', () => {
  const input = batch({x: vectorFromArray([1], new Int32())});
  expect(values('true && null', input)).toEqual([null]);
  expect(values('null || false', input)).toEqual([null]);
  expect(values('!null', input)).toEqual([null]);
  expect(values('1 == null', input)).toEqual([null]);
  expect(values('null == 1', input)).toEqual([null]);
  expect(values('true ? 1 : null', input)).toEqual([1]);
  expect(values('false ? null : 1', input)).toEqual([1]);
});

test('signed literals bind to the operand or function argument type', () => {
  const input = batch({x: vectorFromArray([-128, 1], new Int8())});
  expect(values('x == -128', input)).toEqual([true, false]);
  expect(values('x < -1', input)).toEqual([true, false]);
  expect(values('x < 0 ? -128 : x', input)).toEqual([-128, 1]);
  expect(() => values('x == -129', input)).toThrow('overflow');
  expect(values('toInt32(-1)', input)).toEqual([-1, -1]);
  const registry = new ArrowFunctionRegistry().registerFunction('identity', {
    arguments: [new Field('value', new Int8())],
    result: new Field('result', new Int8()),
    scalar: (value: number) => value
  });
  expect([
    ...compileArrowFunction('identity', ['-128'], {inputSchema: input.schema, registry}).evaluate(
      input
    )
  ]).toEqual([-128, -128]);
});

test('floating-point zero divisors retain IEEE results while integer division is checked', () => {
  const input = batch({x: vectorFromArray([1, -1, 0, null], new Float64())});
  expect(values('x / 0', input)).toEqual([Infinity, -Infinity, NaN, null]);
  expect(values('x / -0', input)).toEqual([-Infinity, Infinity, NaN, null]);
  expect(values('x % 0', input)).toEqual([NaN, NaN, NaN, null]);
  const narrow = batch({x: vectorFromArray([1, 0], new Float32())});
  expect(values('x / 0', narrow)).toEqual([Infinity, NaN]);
  const integer = batch({x: vectorFromArray([1], new Int32())});
  expect(values('toFloat64(x) / 0', integer)).toEqual([Infinity]);
  expect(() => values('x % 0', integer)).toThrow('Division by zero');
});
