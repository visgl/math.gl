// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {RecordBatch, Schema, Struct, Table, makeData} from 'apache-arrow';
import {compileArrowExpression} from './compiler';
import type {ArrowExpression, ArrowExpressionOptions} from './types';

/** Replace named columns in their original slots. Each expression reads the same input table. */
export function replaceArrowColumns(
  table: Table,
  replacements: readonly Readonly<{as: string; expression: ArrowExpression}>[],
  options: Omit<ArrowExpressionOptions, 'inputSchema'> = {}
): Table {
  if (!replacements.length) return table;
  const fields = [...table.schema.fields];
  const indices = new Map(fields.map((field, index) => [field.name, index]));
  if (indices.size !== fields.length) throw new Error('Arrow input column names must be unique');
  const seen = new Set<string>();
  const plan = replacements.map(({as, expression}) => {
    const index = indices.get(as);
    if (index === undefined) throw new Error(`Unknown Arrow replacement column: ${as}`);
    if (seen.has(as)) throw new Error(`Duplicate Arrow replacement column: ${as}`);
    seen.add(as);
    return {
      as,
      index,
      compiled: compileArrowExpression(expression, {...options, inputSchema: table.schema})
    };
  });

  let result = table;
  for (const {as, index, compiled} of plan) {
    result = result.setChildAt(index, compiled.evaluateTable(table));
    fields[index] = compiled.outputField.clone({name: as});
  }
  const schema = new Schema(fields, table.schema.metadata, undefined, table.schema.metadataVersion);
  const struct = new Struct(fields);
  return new Table(
    schema,
    result.batches.map(
      batch =>
        new RecordBatch(
          schema,
          makeData({
            type: struct,
            length: batch.numRows,
            nullCount: 0,
            children: batch.data.children
          })
        )
    )
  );
}
