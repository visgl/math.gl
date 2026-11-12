// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {RecordBatch, Schema, Struct, Table} from 'apache-arrow';
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

  for (const {as, index, compiled} of plan) {
    fields[index] = compiled.outputField.clone({name: as});
  }
  const schema = new Schema(fields, table.schema.metadata, undefined, table.schema.metadataVersion);
  const struct = new Struct(fields);
  const batches = table.batches.flatMap(batch => {
    const columns = plan.map(({index, compiled}) => ({index, vector: compiled.evaluate(batch)}));
    // Vector kernels can return multiple chunks. Align the output batches at each boundary.
    const boundaries = new Set([batch.numRows]);
    for (const {vector} of columns) {
      let end = 0;
      for (const chunk of vector.data) {
        end += chunk.length;
        if (end > 0) boundaries.add(end);
      }
    }
    let start = 0;
    return [...boundaries]
      .sort((a, b) => a - b)
      .map(end => {
        const wholeBatch = start === 0 && end === batch.numRows;
        const source = wholeBatch ? batch.data : batch.data.slice(start, end - start);
        const children = [...source.children];
        for (const {index, vector} of columns) {
          children[index] = (wholeBatch ? vector : vector.slice(start, end)).data[0]!;
        }
        start = end;
        const data = source.clone(
          struct,
          source.offset,
          source.length,
          source.nullCount,
          source.buffers,
          children
        );
        // RecordBatch normalizes child lengths and recreates the parent struct.
        return Object.assign(new RecordBatch(schema, data), {data});
      });
  });
  return new Table(schema, batches);
}
