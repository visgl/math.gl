// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Buffers} from 'apache-arrow/data';
import {createArrowData, getArrowVariadicBuffers} from './arrow-data';

/** Arrow JS typed array used in Arrow internal buffer slots. */
type ArrowTypedArray =
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;

/** Arrow JS object shapes supported by splitArrowBuffers. */
export type SplitArrowBuffersInput =
  | arrow.Table
  | arrow.RecordBatch
  | arrow.Vector
  | arrow.Data<arrow.DataType>;

/** Options for splitArrowBuffers. */
export type SplitArrowBuffersOptions = {
  /**
   * Buffer copy mode.
   * - 'none': do not copy any typed arrays.
   * - 'sliced': copy only typed arrays that view a larger ArrayBuffer.
   * - 'all': copy every Arrow internal typed array.
   */
  copy?: 'none' | 'sliced' | 'all';
  /** Also copy views whose backing buffer is used by any of these retained Arrow objects. */
  retain?: readonly SplitArrowBuffersInput[];
};

/** Copy ownership is scoped to one outgoing Arrow object. */
type SplitArrowBuffersContext = SplitArrowBuffersOptions & {
  /** Reuses a copy when multiple columns or dictionaries reference the same typed-array view. */
  copies: WeakMap<object, ArrowTypedArray>;
  /** Buffer identity catches aliases even when views cover disjoint byte ranges. */
  retainedBuffers: Set<ArrayBufferLike>;
};

/**
 * Rebuilds an Arrow object so sliced internal typed-array buffers are split into standalone
 * ArrayBuffers, while whole-buffer typed arrays are reused by default.
 * @param input Arrow table, record batch, vector, or data node to rebuild.
 * @param options Buffer splitting options.
 * @returns A real Arrow object of the same kind with transfer-safe internal buffers.
 */
export function splitArrowBuffers<T extends arrow.TypeMap>(
  input: arrow.Table<T>,
  options?: SplitArrowBuffersOptions
): arrow.Table<T>;
export function splitArrowBuffers<T extends arrow.TypeMap>(
  input: arrow.RecordBatch<T>,
  options?: SplitArrowBuffersOptions
): arrow.RecordBatch<T>;
export function splitArrowBuffers<T extends arrow.DataType>(
  input: arrow.Vector<T>,
  options?: SplitArrowBuffersOptions
): arrow.Vector<T>;
export function splitArrowBuffers<T extends arrow.DataType>(
  input: arrow.Data<T>,
  options?: SplitArrowBuffersOptions
): arrow.Data<T>;
export function splitArrowBuffers<T extends SplitArrowBuffersInput>(
  input: T,
  options: SplitArrowBuffersOptions = {}
): T {
  const retainedBuffers = new Set<ArrayBufferLike>();
  const visited = new Set<arrow.Data>();
  for (const retained of options.retain ?? []) {
    const chunks = isArrowTable(retained)
      ? retained.batches.map(batch => batch.data)
      : isArrowVector(retained)
        ? retained.data
        : [isArrowRecordBatch(retained) ? retained.data : retained];
    for (const data of chunks) collectArrowBuffers(data, retainedBuffers, visited);
  }
  const context: SplitArrowBuffersContext = {...options, copies: new WeakMap(), retainedBuffers};
  if (isArrowTable(input)) {
    return splitArrowTableBuffersInternal(input, context) as T;
  }

  if (isArrowRecordBatch(input)) {
    return splitArrowRecordBatchBuffers(input, context) as T;
  }

  if (isArrowVector(input)) {
    return splitArrowVectorBuffers(input, context) as T;
  }

  return splitArrowDataBuffers(input, context) as T;
}

/**
 * Rebuilds an Arrow table so sliced internal typed-array buffers are split into standalone
 * ArrayBuffers, while whole-buffer typed arrays are reused by default.
 * @param arrowTable Arrow table to rebuild without mutating the original table.
 * @param options Buffer splitting options.
 * @returns A real Arrow table with transfer-safe internal buffers.
 */
export function splitArrowTableBuffers<T extends arrow.TypeMap>(
  arrowTable: arrow.Table<T>,
  options?: SplitArrowBuffersOptions
): arrow.Table<T> {
  return splitArrowBuffers(arrowTable, options);
}

/**
 * Tests whether a value is an Arrow table.
 * @param input Value to test.
 * @returns True when the value is an Arrow table.
 */
function isArrowTable(input: SplitArrowBuffersInput): input is arrow.Table {
  return 'batches' in input;
}

/**
 * Tests whether a value is an Arrow record batch.
 * @param input Value to test.
 * @returns True when the value is an Arrow record batch.
 */
function isArrowRecordBatch(input: SplitArrowBuffersInput): input is arrow.RecordBatch {
  return 'schema' in input && 'data' in input && !Array.isArray(input.data);
}

/**
 * Tests whether a value is an Arrow vector.
 * @param input Value to test.
 * @returns True when the value is an Arrow vector.
 */
function isArrowVector(input: SplitArrowBuffersInput): input is arrow.Vector {
  return 'data' in input && Array.isArray(input.data);
}

/**
 * Rebuilds an Arrow table by rebuilding each record batch.
 * @param arrowTable Arrow table to rebuild.
 * @param options Buffer splitting options.
 * @returns Rebuilt Arrow table.
 */
function splitArrowTableBuffersInternal<T extends arrow.TypeMap>(
  arrowTable: arrow.Table<T>,
  options: SplitArrowBuffersContext
): arrow.Table<T> {
  const recordBatches = arrowTable.batches.map(recordBatch =>
    splitArrowRecordBatchBuffers(recordBatch, options)
  );
  return new arrow.Table(arrowTable.schema, recordBatches);
}

/**
 * Rebuilds an Arrow record batch by rebuilding its data node.
 * @param recordBatch Arrow record batch to rebuild.
 * @param options Buffer splitting options.
 * @returns Rebuilt Arrow record batch.
 */
function splitArrowRecordBatchBuffers<T extends arrow.TypeMap>(
  recordBatch: arrow.RecordBatch<T>,
  options: SplitArrowBuffersContext
): arrow.RecordBatch<T> {
  return new arrow.RecordBatch(
    recordBatch.schema,
    splitArrowDataBuffers(recordBatch.data, options)
  );
}

/**
 * Recursively rebuilds Arrow Data and isolates requested internal typed-array buffers.
 * @param data Arrow data node to rebuild.
 * @param options Buffer splitting options.
 * @returns Rebuilt Arrow data node.
 */
function splitArrowDataBuffers<T extends arrow.DataType>(
  data: arrow.Data<T>,
  options: SplitArrowBuffersContext
): arrow.Data<T> {
  const children = data.children.map(childData => splitArrowDataBuffers(childData, options));
  const dictionary = data.dictionary
    ? splitArrowVectorBuffers(data.dictionary, options)
    : undefined;

  const buffers: Partial<Buffers<T>> = {
    [arrow.BufferType.OFFSET]: splitArrowBuffer(data.buffers[arrow.BufferType.OFFSET], options),
    [arrow.BufferType.DATA]: splitArrowBuffer(data.buffers[arrow.BufferType.DATA], options),
    [arrow.BufferType.VALIDITY]: splitArrowBuffer(data.buffers[arrow.BufferType.VALIDITY], options),
    [arrow.BufferType.TYPE]: splitArrowBuffer(data.buffers[arrow.BufferType.TYPE], options)
  };

  return createArrowData(
    data.type,
    data.offset,
    data.length,
    // @ts-expect-error _nullCount is protected. Reuse it to preserve lazy null-count state.
    data._nullCount,
    buffers,
    children,
    dictionary,
    getArrowVariadicBuffers(data).map(buffer => splitArrowBuffer(buffer, options))
  );
}

/**
 * Rebuilds an Arrow vector by rebuilding each underlying Data chunk.
 * @param vector Arrow vector to rebuild.
 * @param options Buffer splitting options.
 * @returns Rebuilt Arrow vector.
 */
function splitArrowVectorBuffers<T extends arrow.DataType>(
  vector: arrow.Vector<T>,
  options: SplitArrowBuffersContext
): arrow.Vector<T> {
  return new arrow.Vector(vector.data.map(data => splitArrowDataBuffers(data, options)));
}

/** Collects backing buffers from nested children, dictionaries, and view types. */
function collectArrowBuffers(
  data: arrow.Data,
  buffers: Set<ArrayBufferLike>,
  visited: Set<arrow.Data>
): void {
  if (visited.has(data)) return;
  visited.add(data);
  for (const view of [...data.buffers, ...getArrowVariadicBuffers(data)]) {
    if (isArrowTypedArray(view)) buffers.add(view.buffer);
  }
  for (const child of data.children) collectArrowBuffers(child, buffers, visited);
  for (const chunk of data.dictionary?.data ?? []) collectArrowBuffers(chunk, buffers, visited);
}

/**
 * Copies a typed-array view when requested or when it does not span its full backing buffer.
 * @param array Typed array from an Arrow buffer slot.
 * @param options Buffer splitting options.
 * @returns The original typed array or a copied typed array with a standalone buffer.
 */
function splitArrowBuffer<T>(array: T, options: SplitArrowBuffersContext): T {
  if (!isArrowTypedArray(array)) {
    return array;
  }

  const sliced = array.byteOffset !== 0 || array.byteLength !== array.buffer.byteLength;
  if (
    !options.retainedBuffers.has(array.buffer) &&
    options.copy !== 'all' &&
    (options.copy === 'none' || !sliced)
  ) {
    return array;
  }

  let copy = options.copies.get(array);
  if (!copy) {
    copy = array instanceof Uint8Array ? new Uint8Array(array) : array.slice();
    options.copies.set(array, copy);
  }
  return copy as T;
}

/**
 * Tests whether a value is an Arrow typed array instead of a DataView.
 * @param value Value to test.
 * @returns True when the value is one of the Arrow internal typed-array buffer types.
 */
function isArrowTypedArray(value: unknown): value is ArrowTypedArray {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}
