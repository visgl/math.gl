// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Field, Float32, Float64, Int32, Table, vectorFromArray} from 'apache-arrow';
import {
  compileArrowExpression,
  compileArrowFunction,
  ArrowEvaluationError,
  type ArrowTableFunction,
  type ArrowTableFunctionPrototype
} from '../src/expressions';
function prototype(types: readonly (Float32 | Float64 | Int32)[]): ArrowTableFunctionPrototype {
  return {
    arguments: types.map((type, index) => new Field(`arg${index}`, type, true)),
    result: new Field('result', types[0]!, true),
    evaluate: ([input]) => input!,
    evaluateScalar: (...values) => values[0]!
  };
}
const input = () =>
  new Table({
    x: vectorFromArray([1, null, 3], new Float32()),
    y: vectorFromArray([2, 4, 6], new Float64()),
    i: vectorFromArray([1, 2, 3], new Int32())
  });
test('exact prototypes win, source float widths select the smallest widening, and literals follow typed operands', () => {
  const table = input(),
    functions: ArrowTableFunction[] = [
      {
        name: 'F',
        prototypes: [
          prototype([new Float64(), new Float64()]),
          prototype([new Float32(), new Float32()])
        ]
      }
    ];
  const compiled = compileArrowExpression('F(x, 1)', {inputSchema: table.schema, functions});
  expect(compiled.outputField.type).toEqual(new Float32());
  expect([...compiled.evaluateTable(table)]).toEqual([1, null, 3]);
  const wide = compileArrowExpression('F(x, y)', {inputSchema: table.schema, functions});
  expect(wide.outputField.type).toEqual(new Float64());
  expect([...wide.evaluateTable(table)]).toEqual([1, null, 3]);
  expect(
    compileArrowFunction('F', ['1', '2'], {inputSchema: table.schema, functions}).outputField.type
  ).toEqual(new Float64());
});
test('same-name groups combine distinct prototypes and reject duplicate signatures', () => {
  const table = input(),
    f32 = {name: 'F', prototypes: [prototype([new Float32()])]},
    f64 = {name: 'F', prototypes: [prototype([new Float64()])]};
  expect(
    compileArrowExpression('F(x)', {inputSchema: table.schema, functions: [f32, f64]}).outputField
      .type
  ).toEqual(new Float32());
  expect(() =>
    compileArrowExpression('x', {inputSchema: table.schema, functions: [f32, f32]})
  ).toThrow('Duplicate');
});
test('ambiguous widening and implicit integer/float mixtures fail at binding', () => {
  const table = input();
  const ambiguous = {
    name: 'F',
    prototypes: [
      prototype([new Float32(), new Float64()]),
      prototype([new Float64(), new Float32()])
    ]
  };
  expect(() =>
    compileArrowExpression('F(x,x)', {inputSchema: table.schema, functions: [ambiguous]})
  ).toThrow('Ambiguous');
  const mixed = {
    name: 'F',
    prototypes: [prototype([new Float32(), new Float32()]), prototype([new Int32(), new Int32()])]
  };
  expect(() =>
    compileArrowExpression('F(x,i)', {inputSchema: table.schema, functions: [mixed]})
  ).toThrow('type mismatch');
});
test('numeric data errors are classified while binding and unexpected callback errors are not', () => {
  const table = input();
  expect(() =>
    compileArrowExpression('i / 0', {inputSchema: table.schema}).evaluateTable(table)
  ).toThrow(ArrowEvaluationError);
  try {
    compileArrowExpression('cast("bad", "int32")', {inputSchema: table.schema}).evaluateTable(
      table
    );
  } catch (error) {
    expect(error).toBeInstanceOf(ArrowEvaluationError);
    expect((error as ArrowEvaluationError).code).toBe('conversion');
  }
  expect(() => compileArrowExpression('missing', {inputSchema: table.schema})).not.toThrow(
    ArrowEvaluationError
  );
});

test('contextual conditional arguments retain type checks and widening costs', () => {
  const table = input();
  const f64 = {name: 'F', prototypes: [prototype([new Float64()])]};
  expect(() =>
    compileArrowExpression('F(true ? i : null)', {inputSchema: table.schema, functions: [f64]})
  ).toThrow('type mismatch');
  const overloaded = {
    name: 'F',
    prototypes: [prototype([new Float64()]), prototype([new Float32()])]
  };
  const compiled = compileArrowExpression('F(true ? x : null)', {
    inputSchema: table.schema,
    functions: [overloaded]
  });
  expect(compiled.outputField.type).toEqual(new Float32());
  expect([...compiled.evaluateTable(table)]).toEqual([1, null, 3]);
  expect(
    compileArrowExpression('F(true ? x : null)', {inputSchema: table.schema, functions: [f64]})
      .outputField.type
  ).toEqual(new Float64());
});
