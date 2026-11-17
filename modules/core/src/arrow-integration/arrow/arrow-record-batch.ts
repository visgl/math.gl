// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {RecordBatch, type Data, type Schema, type Struct, type TypeMap} from 'apache-arrow';

/** Reads native or application-defined batch metadata. */
export function getRecordBatchMetadata(batch: RecordBatch): Map<string, string> | undefined {
  return (batch as RecordBatch & {metadata?: Map<string, string>}).metadata;
}

/** Constructs a batch with metadata and preserves the row count for zero-column batches. */
export function createRecordBatchWithMetadata<T extends TypeMap>(
  schema: Schema<T>,
  data: Data<Struct<T>>,
  metadata?: Map<string, string>
): RecordBatch<T> {
  if ('metadata' in RecordBatch.prototype) {
    // Arrow 17's declaration predates the third constructor argument in Arrow 21.2.
    const MetadataRecordBatch = RecordBatch as new (
      schema: Schema<T>,
      data: Data<Struct<T>>,
      metadata?: Map<string, string>
    ) => RecordBatch<T>;
    return Object.assign(new MetadataRecordBatch(schema, data, metadata), {data});
  }
  const batch = Object.assign(new RecordBatch(schema, data), {data});
  return metadata === undefined ? batch : Object.assign(batch, {metadata});
}
