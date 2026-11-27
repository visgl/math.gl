// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Field, Float64, Schema, Table, tableFromArrays, vectorFromArray} from 'apache-arrow';
import {expect, test} from 'vitest';
import {queryArrowSQL, queryArrowSQLWithMetadata} from '@math.gl/sql/query';
import {type TableFunction} from '@math.gl/sql/arrow';

const IDENTITY = {
  kind: 'table',
  name: 'COPY_ROWS',
  bind(inputSchema) {
    const field = inputSchema.fields[0]!;
    return {
      outputSchema: inputSchema,
      columnMetadata: {[field.name]: [{kind: 'source'}]},
      evaluate(input) {
        return input;
      }
    };
  }
} satisfies TableFunction<{kind: 'source'}>;

const DOUBLE_POSITIVE = {
  kind: 'table',
  name: 'DOUBLE_POSITIVE',
  bindLateral({argument, ordinality}) {
    if (ordinality) throw new Error('DOUBLE_POSITIVE has no ordinality column');
    const type = new Float64();
    const outputSchema = new Schema([new Field('value', type, false)]);
    return {
      outputSchema,
      evaluate(input) {
        const parents: number[] = [];
        const output: number[] = [];
        input
          .getChild(argument.name)!
          .toArray()
          .forEach((value: number, index: number) => {
            if (value > 0) {
              parents.push(index, index);
              output.push(value, value * 2);
            }
          });
        return {
          table: new Table(outputSchema, {value: vectorFromArray(output, type)}),
          parentRows: Int32Array.from(parents)
        };
      }
    };
  }
} satisfies TableFunction;

test('registered standalone sources bind their schema and inherit typed metadata under aliases', () => {
  const tables = new Map([['data', tableFromArrays({x: [2, 0, -1]})]]);
  const {table, columnMetadata} = queryArrowSQLWithMetadata(
    'SELECT a.x AS observation FROM copy_rows(data) AS a',
    tables,
    {functions: [[IDENTITY]]}
  );
  expect(Array.from(table.getChild('observation')!)).toEqual([2, 0, -1]);
  expect(columnMetadata['observation']).toEqual([{kind: 'source'}]);
  const legacy = queryArrowSQL('SELECT x FROM copy_rows(data)', tables, {
    tableFunctions: {COPY_ROWS: table => table}
  });
  expect(legacy.numRows).toBe(3);
  const controller = new AbortController();
  controller.abort(new Error('cancel relation'));
  expect(() =>
    queryArrowSQL('SELECT * FROM copy_rows(data)', tables, {
      functions: [IDENTITY],
      signal: controller.signal
    })
  ).toThrow('cancel relation');
});

test('lateral descriptors correlate multiple rows and let the join preserve empty parents', () => {
  const tables = new Map([['data', tableFromArrays({x: [2, 0, -1]})]]);
  const options = {functions: [[DOUBLE_POSITIVE]]};
  const cross = queryArrowSQL(
    'SELECT d.x, e.v FROM data AS d CROSS JOIN LATERAL double_positive(d.x) AS e(v)',
    tables,
    options
  );
  expect(Array.from(cross.getChild('x')!)).toEqual([2, 2]);
  expect(Array.from(cross.getChild('e.v')!)).toEqual([2, 4]);
  const outer = queryArrowSQL(
    'SELECT e.v AS expanded FROM data AS d LEFT JOIN LATERAL double_positive(d.x) AS e(v) ON TRUE',
    tables,
    options
  );
  expect(Array.from(outer.getChild('expanded')!)).toEqual([2, 4, null, null]);
  expect(outer.schema.fields[0]?.nullable).toBe(true);
});
