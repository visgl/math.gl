// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Field, FixedSizeList, Float64, Table, Uint8, vectorFromArray} from 'apache-arrow';
import {parseSQLExpression, parseSQLQuery} from '@math.gl/core/sql';
import {
  compileArrowArray,
  compileArrowExpression,
  ExpressionEvaluationError
} from '../src/expressions';
const table = new Table({x: vectorFromArray([0, 128.75, null, 255, 256, -1, NaN], new Float64())});
const decode = (vector: Iterable<any>) =>
  Array.from(vector, row => (row === null ? null : Array.from(row)));
function compile(sql: string, input = table) {
  return compileArrowExpression(parseSQLExpression(sql), {inputSchema: input.schema});
}
test('UINT8 casts retain direct byte values, truncate fractions, and expose the portable array call', () => {
  expect(parseSQLExpression('CAST(ARRAY[x, 1] AS UINT8[ 2 ])')).toEqual(
    parseSQLExpression('ARRAY[x, 1]::UINT8[2]')
  );
  const expression = parseSQLExpression('ARRAY[x, 1]::UINT8[2]');
  expect(expression).toMatchObject({
    type: 'CallExpression',
    callee: {type: 'Identifier', name: 'array_uint8'}
  });
  expect(parseSQLQuery('SELECT ARRAY[x]::UINT8[1] AS bytes')).toEqual({
    select: [{array: ['x'], as: 'bytes', type: 'uint8'}]
  });
  expect(() => parseSQLExpression('ARRAY[x]::UINT8[2]')).toThrow('length');
  const input = table.slice(0, 4);
  const vector = compile('ARRAY[x, 0, 255]::UINT8[3]', input).evaluateTable(input);
  expect(vector.type.children[0]!.type).toEqual(new Uint8());
  expect(decode(vector)).toEqual([[0, 0, 255], [128, 0, 255], null, [255, 0, 255]]);
  expect(vector.data[0]!.children[0]!.values).toBeInstanceOf(Uint8Array);
  expect(
    decode(
      compileArrowArray(['x'], {inputSchema: input.schema, type: 'uint8'}).evaluateTable(input)
    )
  ).toEqual([[0], [128], null, [255]]);
});
test('PACK_UNORM8 scales and rounds arbitrary widths without confusing byte values with normalized ones', () => {
  const ast = parseSQLExpression('pack_unorm8(ARRAY[0, 0.5, 1, 0.25, 0.75])');
  expect(ast).toMatchObject({
    type: 'CallExpression',
    sqlFunction: true,
    callee: {type: 'Identifier', name: 'pack_unorm8'},
    arguments: [{type: 'CallExpression', callee: {name: 'array'}}]
  });
  const vector = compileArrowExpression(ast, {inputSchema: table.schema}).evaluateTable(
    table.slice(0, 1)
  );
  expect(decode(vector)).toEqual([[0, 128, 255, 64, 191]]);
  expect(vector.type.children[0]!.type).toEqual(new Uint8());
  expect(() => compile('PACK_UNORM8(x)')).toThrow('fixed-size');
});
test('byte overflow and normalized domains participate in TRY; invalid rows are zero-padded', () => {
  const direct = compile('TRY(ARRAY[7, x]::UINT8[2])').evaluateTable(table);
  expect(decode(direct)).toEqual([[7, 0], [7, 128], null, [7, 255], null, null, null]);
  expect(Array.from(direct.data[0]!.children[0]!.values).slice(8)).toEqual([0, 0, 0, 0, 0, 0]);
  expect(() => compile('ARRAY[x]::UINT8[1]').evaluateTable(table)).toThrow(
    ExpressionEvaluationError
  );
  const input = new Table({x: vectorFromArray([0, 1, null, 1.01, -0.01, Infinity], new Float64())});
  const packed = compile('TRY(PACK_UNORM8(ARRAY[x, 0.5]))', input).evaluateTable(input);
  expect(decode(packed)).toEqual([[0, 128], [255, 128], null, null, null, null]);
  expect(Array.from(packed.data[0]!.children[0]!.values).slice(4)).toEqual(new Array(8).fill(0));
});
test('packing respects slices, nullable components, masks and empty schema', () => {
  const type = new FixedSizeList(2, new Field('channel', new Float64(), true));
  const input = new Table({
    x: vectorFromArray([[1, 1], [0.25, 0.5], [null, 0.75], null, [1, 0]], type)
  }).slice(1);
  const compiled = compile('PACK_UNORM8(x)', input);
  expect(compiled.outputField.nullable).toBe(true);
  expect(decode(compiled.evaluateTable(input, {activeRows: new Uint8Array([1, 1, 1, 0])}))).toEqual(
    [[64, 128], null, null, null]
  );
  const empty = compiled.evaluateTable(new Table(input.schema, []));
  expect(empty.length).toBe(0);
  expect(empty.type.children[0]!.type).toEqual(new Uint8());
});

test('existing chained floating array casts retain their parser shape', () => {
  const expected = parseSQLExpression('ARRAY[x]::DOUBLE PRECISION[1]');
  expect(parseSQLExpression('ARRAY[x]::REAL[1]::DOUBLE PRECISION[1]')).toEqual(expected);
  expect(parseSQLExpression('CAST(ARRAY[x]::REAL[1] AS DOUBLE PRECISION[1])')).toEqual(expected);
  expect(() => parseSQLExpression('ARRAY[x]::REAL[1]::UINT8[1]')).toThrow('Chained UINT8');
  expect(() => parseSQLExpression('ARRAY[x]::UINT8[1]::REAL[1]')).toThrow('Chained UINT8');
});
