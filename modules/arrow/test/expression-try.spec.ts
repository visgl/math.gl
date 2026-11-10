// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Field, Float64, Int32, Table, vectorFromArray} from 'apache-arrow';
import {parseSQLExpression} from '@math.gl/core/sql';
import {
  compileArrowExpression,
  ArrowEvaluationError,
  type ArrowTableFunction
} from '../src/expressions';
import {SQRT, LN, MOD} from '../src/math';
const table = new Table({x: vectorFromArray([4, -1, null, 9], new Float64())});
const functions: ArrowTableFunction[] = [SQRT, LN, MOD];
function evaluate(sql: string, custom = functions) {
  return compileArrowExpression(parseSQLExpression(sql), {
    inputSchema: table.schema,
    functions: custom
  }).evaluateTable(table);
}
function custom(name: string, scalar: (x: number) => number): ArrowTableFunction {
  return {
    name,
    prototypes: [
      {
        arguments: [new Field('x', new Float64(), true)],
        result: new Field('out', new Float64(), false),
        evaluate: ([x]) => x!,
        evaluateScalar: x => scalar(x as number)
      }
    ]
  };
}
test('TRY catches classified row errors and its optional fallback is error-only', () => {
  expect([...evaluate('TRY(SQRT(x))')]).toEqual([2, null, null, 3]);
  expect([...evaluate('TRY(SQRT(x), 7)')]).toEqual([2, 7, null, 3]);
  expect([...evaluate('COALESCE(TRY(SQRT(x)), 7)')]).toEqual([2, 7, 7, 3]);
  expect([...evaluate('TRY(NULL, 7)')]).toEqual([null, null, null, null]);
  expect([...evaluate('COALESCE(NULL, 7)')]).toEqual([7, 7, 7, 7]);
  expect([...evaluate('TRY(ISNULL(SQRT(x)))')]).toEqual([false, null, true, false]);
});
test('fallback and subsequent callbacks run only on active rows and never twice', () => {
  const calls: number[] = [],
    fallbacks: number[] = [];
  const f = custom('F', x => {
    calls.push(x);
    if (x < 0) throw new ArrowEvaluationError('domain', 'negative');
    return x;
  });
  const fallback = custom('G', x => {
    fallbacks.push(x);
    return 10;
  });
  expect([...evaluate('TRY(F(x), G(x))', [f, fallback])]).toEqual([4, 10, null, 9]);
  expect(calls).toEqual([4, -1, 9]);
  expect(fallbacks).toEqual([-1]);
  calls.length = 0;
  fallbacks.length = 0;
  expect([...evaluate('TRY(F(x) + G(x))', [f, fallback])]).toEqual([14, null, null, 19]);
  expect(calls).toEqual([4, -1, 9]);
  expect(fallbacks).toEqual([4, 9]);
  const compiled = compileArrowExpression(parseSQLExpression('TRY(F(x))'), {
    inputSchema: table.schema,
    functions: [f]
  });
  calls.length = 0;
  expect([...compiled.evaluateTable(table, {activeRows: new Uint8Array([1, 0, 0, 0])})]).toEqual([
    4,
    null,
    null,
    null
  ]);
  expect(calls).toEqual([4]);
});
test('nested TRY scopes isolate errors and fallback errors escape their own TRY', () => {
  expect([...evaluate('TRY(COALESCE(TRY(SQRT(x)), 8))')]).toEqual([2, 8, 8, 3]);
  expect(() => evaluate('TRY(SQRT(x), LN(x))')).toThrow(ArrowEvaluationError);
  expect([...evaluate('TRY(TRY(SQRT(x), LN(x)))')]).toEqual([2, null, null, 3]);
  expect([...evaluate('TRY(SQRT(x), TRY(LN(x), 8))')]).toEqual([2, 8, null, 3]);
});
test('binding, cancellation and unexpected implementation failures stay fatal', () => {
  expect(() => evaluate('TRY(missing)')).toThrow('Unknown');
  expect(() => evaluate('TRY(SQRT(x), TRUE)')).toThrow();
  expect(() =>
    evaluate('TRY(F(x))', [
      custom('F', () => {
        throw new Error('bug');
      })
    ])
  ).toThrow('bug');
  const controller = new AbortController();
  controller.abort();
  const compiled = compileArrowExpression(parseSQLExpression('TRY(SQRT(x))'), {
    inputSchema: table.schema,
    functions
  });
  expect(compiled.outputField.nullable).toBe(true);
  expect(() => compiled.evaluateTable(table, {signal: controller.signal})).toThrow();
});
test('reported vector errors recover individual rows without retrying a kernel', () => {
  let batches = 0;
  const rows: number[] = [];
  const f: ArrowTableFunction = {
    name: 'F',
    prototypes: [
      {
        arguments: [new Field('x', new Float64(), true)],
        result: new Field('out', new Float64(), false),
        evaluate([input], {length, activeRows, reportError}) {
          batches++;
          const values: (number | null)[] = new Array(length).fill(null);
          for (let row = 0; row < length; row++) {
            if (!activeRows[row]) continue;
            rows.push(row);
            const x = input!.get(row) as number;
            if (x < 0) {
              reportError!(row, new ArrowEvaluationError('domain', 'negative'));
              continue;
            }
            values[row] = x;
          }
          return vectorFromArray(values, new Float64());
        }
      }
    ]
  };
  expect([...evaluate('TRY(F(x), 7)', [f])]).toEqual([4, 7, null, 9]);
  expect(batches).toBe(1);
  expect(rows).toEqual([0, 1, 3]);
  expect(() => evaluate('F(x)', [f])).toThrow(ArrowEvaluationError);
  const unexpected = {
    ...f,
    prototypes: [
      {
        ...f.prototypes[0]!,
        evaluate: () => {
          throw new Error('kernel bug');
        }
      }
    ]
  };
  expect(() => evaluate('TRY(F(x))', [unexpected])).toThrow('kernel bug');
});
test('TRY supports fixed-size results and typed conversion failures', () => {
  const result = evaluate('TRY(ARRAY[SQRT(x), 1], ARRAY[7, 8])');
  expect(Array.from(result, row => (row === null ? null : Array.from(row)))).toEqual([
    [2, 1],
    [7, 8],
    null,
    [3, 1]
  ]);
  const input = new Table({x: vectorFromArray([1, 2147483647], new Int32())});
  const compiled = compileArrowExpression(parseSQLExpression('TRY(x + 1)'), {
    inputSchema: input.schema
  });
  expect([...compiled.evaluateTable(input)]).toEqual([2, null]);
});

test('earlier scalar failures suppress later vector arguments and fixed-array cast overflow recovers', () => {
  const rows: number[] = [];
  const f = custom('F', x => {
    if (x < 0) throw new ArrowEvaluationError('domain', 'negative');
    return x;
  });
  const g: ArrowTableFunction = {
    name: 'G',
    prototypes: [
      {
        arguments: [new Field('x', new Float64(), true)],
        result: new Field('out', new Float64(), false),
        evaluate([input], {activeRows}) {
          for (let row = 0; row < activeRows.length; row++) if (activeRows[row]) rows.push(row);
          return input!;
        }
      }
    ]
  };
  expect([...evaluate('TRY(F(x) + G(x))', [f, g])]).toEqual([8, null, null, 18]);
  expect(rows).toEqual([0, 3]);
  const result = evaluate('TRY(ARRAY[1e39]::REAL[1])');
  expect(Array.from(result)).toEqual([null, null, null, null]);
  expect(Array.from(result.data[0]!.children[0]!.values)).toEqual([0, 0, 0, 0]);
});
