// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  createRecordBatchWithMetadata,
  getRecordBatchMetadata,
  projectArrowTable
} from '@math.gl/core/arrow';

test('projects and aliases Arrow columns while borrowing data and retaining metadata', () => {
  const fields = [
    new arrow.Field('value.raw', new arrow.Int32(), false, new Map([['unit', 'm']])),
    new arrow.Field('name', new arrow.Utf8())
  ];
  const schema = new arrow.Schema(fields, new Map([['source', 'fixture']]));
  const type = new arrow.Struct(fields);
  const batches = [0, 1].map(value =>
    createRecordBatchWithMetadata(
      schema,
      arrow.makeData({
        type,
        length: 1,
        children: [
          arrow.vectorFromArray([value], new arrow.Int32()).data[0]!,
          arrow.vectorFromArray([`row ${value}`], new arrow.Utf8()).data[0]!
        ]
      }),
      new Map([['batch', String(value)]])
    )
  );
  const source = new arrow.Table(schema, batches);
  const projected = projectArrowTable(source, [
    'name',
    {column: 'value.raw', as: 'value'},
    {column: 'value.raw', as: 'copy'}
  ]);

  expect(projected.schema.fields.map(field => field.name)).toEqual(['name', 'value', 'copy']);
  expect(projected.schema.metadata).toEqual(schema.metadata);
  expect(projected.schema.fields[1]!.metadata.get('unit')).toBe('m');
  expect(projected.schema.fields[1]!.nullable).toBe(false);
  expect(projected.batches.map(batch => batch.numRows)).toEqual([1, 1]);
  for (const [index, batch] of projected.batches.entries()) {
    expect(batch.data.children[1]).toBe(source.batches[index]!.data.children[0]);
    expect(batch.data.children[2]).toBe(batch.data.children[1]);
    expect(getRecordBatchMetadata(batch)?.get('batch')).toBe(String(index));
  }
  expect(source.schema.fields.map(field => field.name)).toEqual(['value.raw', 'name']);

  const empty = projectArrowTable(source, []);
  expect(empty.numCols).toBe(0);
  expect(empty.numRows).toBe(2);
  expect(empty.batches.map(batch => getRecordBatchMetadata(batch)?.get('batch'))).toEqual([
    '0',
    '1'
  ]);
});

test('rejects missing columns and invalid output aliases', () => {
  const table = arrow.tableFromArrays({value: Int32Array.of(1)});
  expect(() => projectArrowTable(table, ['missing'])).toThrow(/column not found/);
  expect(() => projectArrowTable(table, ['value', 'value'])).toThrow(/duplicate/);
  expect(() => projectArrowTable(table, [{column: 'value', as: ''}])).toThrow(/invalid/i);
});
