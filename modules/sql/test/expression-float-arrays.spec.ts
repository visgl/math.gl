// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Float32, Float64, Table, tableFromArrays, vectorFromArray, type Vector} from 'apache-arrow';
import {expect, test} from 'vitest';
import {parseSQLExpression} from '@math.gl/sql/parser';
import {compileArrowExpression} from '../src/arrow';

/** Compiles and evaluates an ARRAY expression against the fixture table. */

function evaluate(sql: string, table: Table): Vector {
  return compileArrowExpression(parseSQLExpression(sql), {
    inputSchema: table.schema
  }).evaluateTable(table);
}

/** Reads fixed-size lists as JavaScript arrays while preserving null rows. */

function decode(vector: Vector): (number[] | null)[] {
  return Array.from(vector, row => (row === null ? null : Array.from(row)));
}

test.each([Float32Array, Float64Array])(
  'SQL ARRAY packs sliced %s columns across batches',
  ArrayType => {
    const first = tableFromArrays({
      x: new ArrayType([99, -0, Infinity, 100]),
      y: new ArrayType([99, 2.5, NaN, 100])
    }).slice(1, 3);
    const second = tableFromArrays({
      x: new ArrayType([3.25, 4.5]),
      y: new ArrayType([5.75, 6.125])
    });
    const table = new Table([...first.batches, ...second.batches]);
    const packed = evaluate('ARRAY[x, y]', table);

    expect(packed.data).toHaveLength(2);
    expect(packed.getChildAt(0)?.toArray()).toBeInstanceOf(ArrayType);
    expect(decode(packed)).toEqual([
      [-0, 2.5],
      [Infinity, NaN],
      [3.25, 5.75],
      [4.5, 6.125]
    ]);
    expect(Array.from(first.getChild('x')!)).toEqual([-0, Infinity]);
  }
);

test('SQL ARRAY preserves nulls, precision promotion, and inactive rows', () => {
  const table = new Table({
    x: vectorFromArray([1, null, -3], new Float32()),
    y: vectorFromArray([4, 5, 6], new Float64())
  });
  const packed = evaluate('ARRAY[x, y]', table);
  expect(packed.getChildAt(0)?.toArray()).toBeInstanceOf(Float64Array);
  expect(decode(packed)).toEqual([[1, 4], null, [-3, 6]]);

  const floats = tableFromArrays({x: [1, -2, 3], y: [4, 5, 6]});
  const masked = evaluate('CASE WHEN x > 0 THEN ARRAY[x, y] ELSE ARRAY[0, 0] END', floats);
  expect(decode(masked)).toEqual([
    [1, 4],
    [0, 0],
    [3, 6]
  ]);
});

test('SQL ARRAY retains the overflow behavior of explicit narrower output types', () => {
  const table = tableFromArrays({x: [1, 1e100], y: [3, 4]});
  expect(() => evaluate('ARRAY_FLOAT32(x, y)', table)).toThrow('ARRAY cast overflow');
  expect(decode(evaluate('TRY(ARRAY_FLOAT32(x, y))', table))).toEqual([[1, 3], null]);
});
