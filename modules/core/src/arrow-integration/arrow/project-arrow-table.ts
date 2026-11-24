// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {makeData, Schema, Struct, Table} from 'apache-arrow';
import {createRecordBatchWithMetadata, getRecordBatchMetadata} from './arrow-record-batch';

/** A top-level Arrow column to select, optionally under a new name. */
export type ArrowColumnSelection =
  | string
  | Readonly<{
      /** Exact source field name, including any dots. */
      column: string;
      /** Output field name. Defaults to the source field name. */
      as?: string;
    }>;

/**
 * Selects and renames columns in the supplied order without copying column buffers.
 * Field, schema, and record batch metadata are retained. An empty projection
 * retains the source row count and batch boundaries.
 */
export function projectArrowTable(
  source: Table,
  selections: readonly ArrowColumnSelection[]
): Table {
  const names = new Set<string>();
  const indices: number[] = [];
  const fields = selections.map(selection => {
    const column = typeof selection === 'string' ? selection : selection.column;
    const alias = typeof selection === 'string' ? undefined : selection.as;
    const index = source.schema.fields.findIndex(field => field.name === column);
    if (index < 0) throw new Error(`Arrow projection column not found: ${column}`);
    const name = alias === undefined ? column : alias;
    if (typeof name !== 'string' || alias === '' || names.has(name)) {
      throw new Error(`Invalid or duplicate Arrow projection output name: ${name}`);
    }
    names.add(name);
    indices.push(index);
    const field = source.schema.fields[index]!;
    return name === column ? field : field.clone({name});
  });
  const schema = new Schema(
    fields,
    source.schema.metadata,
    undefined,
    source.schema.metadataVersion
  );
  const type = new Struct(fields);
  const batches = source.batches.map(batch =>
    createRecordBatchWithMetadata(
      schema,
      makeData({
        type,
        length: batch.numRows,
        children: indices.map(index => batch.data.children[index]!)
      }),
      getRecordBatchMetadata(batch)
    )
  );
  return new Table(schema, batches);
}
