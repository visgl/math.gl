// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, expectTypeOf, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  findArrowColumn,
  isArrowRecordBatch,
  isArrowTable,
  isFixedSizeListArrowType,
  isNumericArrowType
} from '../../src/arrow-integration';

test('Arrow table detection uses the table interface', () => {
  const table = arrow.tableFromArrays({value: [1]});
  expect(isArrowTable(table)).toBe(true);
  expect(
    isArrowTable({
      schema: table.schema,
      batches: table.batches,
      numRows: table.numRows,
      get: table.get.bind(table),
      getChild: table.getChild.bind(table)
    })
  ).toBe(true);
  expect(isArrowTable(table.batches[0])).toBe(false);
  expect(isArrowTable(null)).toBe(false);
});

test('Arrow table and record batch guards narrow unknown values', () => {
  const table: unknown = arrow.tableFromArrays({value: [1]});
  expect(isArrowTable(table)).toBe(true);
  expect(isArrowRecordBatch(table)).toBe(false);
  if (isArrowTable(table)) {
    expectTypeOf(table).toEqualTypeOf<arrow.Table>();
    const batch: unknown = table.batches[0];
    expect(isArrowRecordBatch(batch)).toBe(true);
    if (isArrowRecordBatch(batch)) {
      expectTypeOf(batch).toEqualTypeOf<arrow.RecordBatch>();
      expect(
        isArrowRecordBatch({
          numRows: batch.numRows,
          schema: batch.schema,
          data: batch.data,
          get: batch.get.bind(batch),
          getChild: batch.getChild.bind(batch)
        })
      ).toBe(true);
    }
    expect(isArrowRecordBatch(table.getChild('value'))).toBe(false);
    expect(isArrowRecordBatch({shape: 'arrow-table', data: table})).toBe(false);
  }
  expect(isArrowRecordBatch(null)).toBe(false);
});

test('Arrow column lookup resolves nested fields and literal dotted names', () => {
  const nested = arrow.vectorFromArray(
    [{x: 2}],
    new arrow.Struct([new arrow.Field('x', new arrow.Float32())])
  );
  const table = new arrow.Table({
    nested,
    'nested.x': arrow.vectorFromArray([3], new arrow.Float32())
  });
  expect(findArrowColumn(table, ['nested', 'x'])?.get(0)).toBe(2);
  expect(findArrowColumn(table.batches[0], ['nested.x'])?.get(0)).toBe(3);
  expect(findArrowColumn(table, ['nested', 'missing'])).toBeNull();
  expect(findArrowColumn(table, [])).toBeNull();
  expect(isNumericArrowType(nested.type)).toBe(false);
  expect(isNumericArrowType(new arrow.Int32())).toBe(true);
  expect(isNumericArrowType(new arrow.Float32())).toBe(true);
  expect(
    isFixedSizeListArrowType(
      new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32()))
    )
  ).toBe(true);
});
