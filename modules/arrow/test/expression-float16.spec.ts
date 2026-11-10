// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  Dictionary,
  Field,
  FixedSizeList,
  Float16,
  Float64,
  Int8,
  Table,
  makeData,
  makeVector,
  vectorFromArray
} from 'apache-arrow';
import {isFloat16Array, NativeFloat16ArrayConstructor} from '@math.gl/core';
import {parseSQLExpression, parseSQLPredicate, parseSQLQuery} from '@math.gl/core/sql';
import {
  ExpressionEvaluationError,
  compileArrowArray,
  compileArrowExpression,
  compileArrowPredicate,
  type ArrowTableFunction
} from '../src/expressions';
import {float16Values} from '../src/expressions/float16';
const supported = typeof NativeFloat16ArrayConstructor === 'function';
function half(values: readonly number[]) {
  const bits = new Uint16Array(values.length);
  float16Values(bits).set(values);
  return makeVector(makeData({type: new Float16(), length: values.length, data: bits}));
}
test.runIf(supported)(
  'Float16 projections reuse encoded buffers and arithmetic rounds each operation',
  () => {
    const table = new Table({x: half([0, 1, 1.0009765625, 65504])}).slice(1);
    const options = {inputSchema: table.schema};
    const identity = compileArrowExpression('x', options).evaluateTable(table);
    expect([...identity]).toEqual([1, 1.0009765625, 65504]);
    expect(identity.data[0]!.values.buffer).toBe(table.getChild('x')!.data[0]!.values.buffer);
    const result = compileArrowExpression('x + 0.00048828125', options).evaluateTable(table);
    expect([...result]).toEqual([1, 1.001953125, 65504]);
    expect([
      ...compileArrowExpression('(x + 0.00048828125) - x', options).evaluateTable(
        new Table({x: half([1])})
      )
    ]).toEqual([0]);
    expect(result.type).toEqual(new Float16());
    expect(result.data[0]!.values).toBeInstanceOf(Uint16Array);
  }
);
test.runIf(supported)(
  'Float16 rounding covers subnormals, ties, signed zero, NaN and infinity',
  () => {
    const source = [0, -0, 2 ** -24, 2 ** -25, 1 + 2 ** -11, 65504, Infinity, NaN];
    const bits = new Uint16Array(source.length);
    const view = float16Values(bits);
    view.set(source);
    expect(isFloat16Array(view)).toBe(true);
    expect(Array.from(half(source))).toEqual(Array.from(view));
    expect(Object.is(view[1], -0)).toBe(true);
    expect(view[3]).toBe(0);
    expect(view[4]).toBe(1);
    const table = new Table({x: half([65504])});
    expect(() =>
      compileArrowExpression('x * 2', {inputSchema: table.schema}).evaluateTable(table)
    ).toThrow(ExpressionEvaluationError);
  }
);
test.runIf(supported)(
  'SQL FLOAT16 casts propagate null and reject overflow only in active rows',
  () => {
    const table = new Table({x: vectorFromArray([1.0005, null, 70000], new Float64())});
    const compiled = compileArrowExpression(parseSQLExpression('x::FLOAT16'), {
      inputSchema: table.schema
    });
    expect(compiled.outputField.type).toEqual(new Float16());
    expect([...compiled.evaluateTable(table, {activeRows: new Uint8Array([1, 1, 0])})]).toEqual([
      1.0009765625,
      null,
      null
    ]);
    expect(() => compiled.evaluateTable(table)).toThrow('overflow');
    expect(parseSQLExpression('CAST(x AS FLOAT16)')).toEqual(parseSQLExpression('x::FLOAT16'));
    expect([
      ...compileArrowPredicate(parseSQLPredicate('x::FLOAT16 = 1.0009765625'), {
        inputSchema: table.schema
      }).evaluateTable(table, {activeRows: new Uint8Array([1, 1, 0])})
    ]).toEqual([true, null, null]);
    expect(compiled.evaluateTable(new Table(table.schema, [])).type).toEqual(new Float16());
  }
);
test.runIf(supported)(
  'Float16 dictionaries, tuple branches and typed constants decode logical values',
  () => {
    const table = new Table({
      x: vectorFromArray([1, null, 2], new Dictionary(new Float16(), new Int8()))
    });
    expect([
      ...compileArrowExpression('x + 1', {inputSchema: table.schema}).evaluateTable(table)
    ]).toEqual([2, null, 3]);
    const tuple = new FixedSizeList(2, new Field('channel', new Float16(), false));
    const fn: ArrowTableFunction = {
      name: 'identity',
      prototypes: [
        {
          arguments: [new Field('value', tuple)],
          result: new Field('value', tuple),
          evaluate: ([v]) => v!
        }
      ]
    };
    const expression = compileArrowExpression('x > 1 ? identity([1.0005, 2]) : identity([0, 1])', {
      inputSchema: table.schema,
      functions: [fn]
    });
    expect(Array.from(expression.evaluateTable(table), row => Array.from(row))).toEqual([
      [0, 1],
      [0, 1],
      [1.0009765625, 2]
    ]);
  }
);
test.skipIf(supported)(
  'Float16 requires a decoded native array rather than Uint16 numeric assignments',
  () => {
    expect(() => float16Values(new Uint16Array(1))).toThrow('native Float16Array');
  }
);

test.runIf(supported)(
  'packed ARRAY projections infer and explicitly cast Float16 components',
  () => {
    expect(parseSQLQuery('SELECT ARRAY[x,y]::FLOAT16[2] AS position')).toEqual({
      select: [{array: ['x', 'y'], type: 'float16', as: 'position'}]
    });
    const table = new Table({x: half([1, 2]), y: half([3, 4])});
    const compiled = compileArrowArray(['x', 'y'], {inputSchema: table.schema});
    expect(compiled.outputField.type.children[0]!.type).toEqual(new Float16());
    expect(Array.from(compiled.evaluateTable(table), row => Array.from(row))).toEqual([
      [1, 3],
      [2, 4]
    ]);
    const wide = new Table({x: vectorFromArray([1.0005, 70000], new Float64())});
    const narrowed = compileArrowArray(['x'], {inputSchema: wide.schema, type: 'float16'});
    expect(
      Array.from(narrowed.evaluateTable(wide, {activeRows: new Uint8Array([1, 0])}), row =>
        row === null ? null : Array.from(row)
      )
    ).toEqual([[1.0009765625], null]);
    expect(() => narrowed.evaluateTable(wide)).toThrow(ExpressionEvaluationError);
    try {
      narrowed.evaluateTable(wide);
    } catch (error) {
      expect((error as ExpressionEvaluationError).code).toBe('overflow');
    }
  }
);
