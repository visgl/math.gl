// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Buffers} from 'apache-arrow/data';
import {createArrowData, getArrowVariadicBuffers} from './arrow-data';
import {splitArrowBuffers, type SplitArrowBuffersOptions} from './split-arrow-buffers';

/** Structured-cloneable Arrow data buffers; types are supplied by the IPC schema. */
export type DehydratedArrowData = {
  /** Logical element offset, including validity-bitmap alignment. */
  offset: number;
  /** Number of logical elements. */
  length: number;
  /** Number of null elements. */
  nullCount: number;
  /** Arrow buffer slots, retaining typed-array views. */
  buffers: Partial<Buffers<arrow.DataType>>;
  /** Nested child data in schema order. */
  children: DehydratedArrowData[];
  /** Extra value buffers used by variable-width view types in newer Arrow runtimes. */
  variadicBuffers: readonly Uint8Array[];
  /** Dictionary value chunks, when this data uses dictionary encoding. */
  dictionary?: DehydratedArrowData[];
};

/** Same-runtime structured-clone transport with IPC schema metadata and separate column buffers. */
export type DehydratedArrowTable = {
  /** Identifies the column-buffer protocol. */
  transport: 'arrow-js';
  /** Protocol revision; not an Apache Arrow version. */
  version: 1;
  /** Schema-only Arrow IPC stream, containing no table rows. */
  schema: Uint8Array;
  /** Original Arrow schema metadata version. */
  metadataVersion: arrow.MetadataVersion;
  /** Struct data for each record batch. */
  batches: DehydratedArrowData[];
};

/** Arrow IPC payload for transport across compatible Arrow JS versions. */
export type SerializedArrowTableIPC = {
  /** Identifies an Arrow IPC payload. */
  transport: 'arrow-ipc';
  /** Arrow IPC stream bytes. */
  data: Uint8Array;
};

/**
 * Dehydrates a table without converting column values to IPC or JavaScript rows.
 * Use matching Arrow JS versions at each end; use full IPC for cross-version transport.
 * @param table Table to dehydrate.
 * @param options Buffer ownership policy; sliced buffers are copied by default.
 * @returns Structured-cloneable payload. Whole buffers may still alias the input.
 */
export function dehydrateArrowTable(
  table: arrow.Table,
  options?: SplitArrowBuffersOptions
): DehydratedArrowTable {
  const splitTable = splitArrowBuffers(table, options);
  return {
    transport: 'arrow-js',
    version: 1,
    schema: arrow.tableToIPC(new arrow.Table(splitTable.schema, [])),
    metadataVersion: splitTable.schema.metadataVersion,
    batches: splitTable.batches.map(batch => dehydrateArrowData(batch.data))
  };
}

/**
 * Hydrates a trusted payload produced by dehydrateArrowTable into a real Arrow table.
 * @param table Structured-cloneable column-buffer payload from a compatible Arrow runtime.
 * @returns Table backed by the supplied buffers; no value-buffer copies are made.
 */
export function hydrateArrowTable(table: DehydratedArrowTable): arrow.Table {
  if (table.transport !== 'arrow-js' || table.version !== 1) {
    throw new Error('Unsupported Arrow column-buffer transport protocol.');
  }
  const decodedSchema = arrow.tableFromIPC(table.schema).schema;
  const schema = new arrow.Schema(
    decodedSchema.fields,
    decodedSchema.metadata,
    decodedSchema.dictionaries,
    table.metadataVersion
  );
  const type = new arrow.Struct(schema.fields);
  const batches = table.batches.map(
    data => new arrow.RecordBatch(schema, hydrateArrowData(data, type))
  );
  return new arrow.Table(schema, batches);
}

/**
 * Serializes a complete table to interoperable Arrow IPC stream bytes.
 * @param table Table to serialize.
 * @returns Structured-cloneable IPC envelope.
 */
export function serializeArrowTableToIPC(table: arrow.Table): SerializedArrowTableIPC {
  return {transport: 'arrow-ipc', data: arrow.tableToIPC(table)};
}

/**
 * Reads an Arrow IPC envelope or raw stream/file bytes.
 * @param table IPC envelope or raw IPC bytes.
 * @returns Decoded Arrow table.
 */
export function deserializeArrowTableFromIPC(
  table: SerializedArrowTableIPC | ArrayBuffer | Uint8Array
): arrow.Table {
  return arrow.tableFromIPC('transport' in table ? table.data : table);
}

/** Builds a plain descriptor for one Arrow data node. */
function dehydrateArrowData(data: arrow.Data): DehydratedArrowData {
  return {
    offset: data.offset,
    length: data.length,
    nullCount: data.nullCount,
    buffers: {
      [arrow.BufferType.OFFSET]: data.buffers[arrow.BufferType.OFFSET],
      [arrow.BufferType.DATA]: data.buffers[arrow.BufferType.DATA],
      [arrow.BufferType.VALIDITY]: data.buffers[arrow.BufferType.VALIDITY],
      [arrow.BufferType.TYPE]: data.buffers[arrow.BufferType.TYPE]
    },
    children: data.children.map(child => dehydrateArrowData(child)),
    variadicBuffers: getArrowVariadicBuffers(data),
    dictionary: data.dictionary?.data.map(chunk => dehydrateArrowData(chunk))
  };
}

/** Reconstructs one data node using types from the Arrow-native schema. */
function hydrateArrowData<T extends arrow.DataType>(
  data: DehydratedArrowData,
  type: T
): arrow.Data<T> {
  const children = data.children.map((child, index) =>
    hydrateArrowData(child, type.children[index]!.type)
  );
  const dictionary =
    data.dictionary && arrow.DataType.isDictionary(type)
      ? new arrow.Vector(data.dictionary.map(chunk => hydrateArrowData(chunk, type.dictionary)))
      : undefined;
  return createArrowData(
    type,
    data.offset,
    data.length,
    data.nullCount,
    data.buffers as Partial<Buffers<T>>,
    children,
    dictionary,
    data.variadicBuffers
  );
}
