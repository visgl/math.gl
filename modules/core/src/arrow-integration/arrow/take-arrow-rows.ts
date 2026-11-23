// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Buffers} from 'apache-arrow/data';
import {createArrowData, getArrowVariadicBuffers} from './arrow-data';
import {createRecordBatchWithMetadata, getRecordBatchMetadata} from './arrow-record-batch';
import {splitArrowBuffers} from './split-arrow-buffers';

/** Shared ownership for dictionaries and out-of-line view buffers in one snapshot. */
type TakeArrowContext = {
  /** Copies each dictionary only once, even when output revisits a source batch. */
  dictionaries: WeakMap<arrow.Vector, arrow.Vector>;
  /** Copies each out-of-line byte view only once. */
  variadicBuffers: WeakMap<Uint8Array, Uint8Array>;
};

/** One consecutive output run using the same source record batch. */
type ArrowRowRun = {
  /** Source batch index. */
  batch: number;
  /** Source rows local to that batch, in output order. */
  rows: number[];
};

/**
 * Materializes selected physical rows, retaining each source batch's metadata.
 * Revisited compatible chunks are gathered together; incompatible chunks retain source runs.
 * Negative indices insert null rows. The source must supply a batch to determine their layout.
 */
export function takeArrowTableRows<T extends arrow.TypeMap>(
  arrowTable: arrow.Table<T>,
  indexes: Int32Array
): arrow.Table<T> {
  const offsets = [0];
  for (const batch of arrowTable.batches)
    offsets.push(offsets[offsets.length - 1]! + batch.numRows);
  const runs: ArrowRowRun[] = [];
  const firstRow = indexes.find(index => index >= 0) ?? 0;
  for (const index of indexes) {
    const previousRun = runs[runs.length - 1];
    if (index < 0 && previousRun) {
      previousRun.rows.push(-1);
      continue;
    }
    const sourceRow = index < 0 ? firstRow : index;
    let lower = 0;
    let upper = arrowTable.batches.length - 1;
    while (lower < upper) {
      const middle = Math.floor((lower + upper) / 2);
      if (sourceRow >= offsets[middle + 1]!) lower = middle + 1;
      else upper = middle;
    }
    let run = runs[runs.length - 1];
    if (!run || run.batch !== lower) {
      run = {batch: lower, rows: []};
      runs.push(run);
    }
    run.rows.push(index < 0 ? -1 : index - offsets[lower]!);
  }
  const context: TakeArrowContext = {dictionaries: new WeakMap(), variadicBuffers: new WeakMap()};
  // Avoid one output batch per row when selection repeatedly crosses compatible chunks.
  const sources = [...new Set(runs.map(run => run.batch))];
  const sourceSlots: number[] = [];
  const sourceBatches = sources.map((source, slot) => {
    sourceSlots[source] = slot;
    return arrowTable.batches[source]!;
  });
  const coalesce =
    runs.length > sources.length &&
    sourceBatches.every(batch => {
      const metadata = getRecordBatchMetadata(sourceBatches[0]!);
      const other = getRecordBatchMetadata(batch);
      return other === metadata || !(other?.size || metadata?.size);
    }) &&
    canGatherArrowChunks(sourceBatches.map(batch => batch.data));
  const batches = (coalesce ? [runs] : runs.map(run => [run])).map(group => {
    const chunks = coalesce ? sourceBatches : [arrowTable.batches[group[0]!.batch]!];
    const rows = group.flatMap(run =>
      run.rows.map((index): ArrowChunkRow => [coalesce ? sourceSlots[run.batch]! : 0, index])
    );
    const data = gatherArrowChunks(
      chunks.map(batch => batch.data),
      rows,
      context
    );
    return createRecordBatchWithMetadata(
      arrowTable.schema,
      data.clone(data.type, 0, data.length, 0) as arrow.Data<arrow.Struct<T>>,
      getRecordBatchMetadata(chunks[0]!)
    );
  });
  return new arrow.Table(arrowTable.schema, batches);
}

/** Preserves dense/sparse union tags while gathering the corresponding child rows. */
function takeArrowUnionRows(
  data: arrow.Data,
  indexes: readonly number[],
  context: TakeArrowContext
): arrow.Data {
  const type = data.type as arrow.Union;
  const dense = type.mode === arrow.UnionMode.Dense;
  const typeIds = new Int8Array(indexes.length);
  const offsets = dense ? new Int32Array(indexes.length) : undefined;
  const childIndexes = data.children.map(() => [] as number[]);
  indexes.forEach((index, outputIndex) => {
    const typeId = index < 0 ? type.typeIds[0]! : data.typeIds[index]!;
    typeIds[outputIndex] = typeId;
    if (dense) {
      const selected = childIndexes[type.typeIdToChildIndex[typeId]!]!;
      offsets![outputIndex] = selected.length;
      selected.push(index < 0 ? -1 : data.valueOffsets[index]!);
    }
  });
  const children = data.children.map((child, childIndex) =>
    gatherArrowChunks(
      [child],
      (dense ? childIndexes[childIndex]! : indexes).map(index => [0, index]),
      context
    )
  );
  return createArrowData(
    type,
    0,
    indexes.length,
    0,
    {[arrow.BufferType.TYPE]: typeIds, [arrow.BufferType.OFFSET]: offsets},
    children
  );
}

/** Allocates an offset buffer with the same logical width as its source. */
function makeArrowOffsets(
  source: Int32Array | BigInt64Array,
  length: number
): Int32Array | BigInt64Array {
  return source instanceof BigInt64Array ? new BigInt64Array(length) : new Int32Array(length);
}

/** Stores a compacted offset without wrapping the 32-bit representation. */
function setArrowOffset(offsets: Int32Array | BigInt64Array, index: number, value: number): void {
  if (offsets instanceof BigInt64Array) offsets[index] = BigInt(value);
  else {
    if (value > 0x7fffffff)
      throw new RangeError('Selected Arrow values exceed 32-bit offset capacity.');
    offsets[index] = value;
  }
}

/** Source data-node index and local row index (-1 inserts a typed null). */
type ArrowChunkRow = readonly [source: number, index: number];

/** Requires identical dictionaries and excludes layouts with chunk-local buffer references. */
function canGatherArrowChunks(chunks: readonly arrow.Data[]): boolean {
  const first = chunks[0]!;
  const typeId = first.type.typeId;
  // IPC types through Duration use the physical layouts below. Newer view layouts
  // keep their chunk-local buffer references and stay on the source-run fallback.
  return (
    typeId <= arrow.Type.Duration &&
    typeId !== arrow.Type.Union &&
    chunks.every(data => data.dictionary === first.dictionary) &&
    first.children.every((_, index) =>
      canGatherArrowChunks(chunks.map(data => data.children[index]!))
    )
  );
}

/** Gathers compatible chunks directly into physical buffers, without decoding row values. */
function gatherArrowChunks(
  chunks: readonly arrow.Data[],
  rows: readonly ArrowChunkRow[],
  context: TakeArrowContext
): arrow.Data {
  const first = chunks[0]!;
  const type = first.type;
  if (arrow.DataType.isUnion(type))
    return takeArrowUnionRows(
      first,
      rows.map(row => row[1]),
      context
    );
  const bitmap = new Uint8Array(Math.ceil(rows.length / 8));
  let nullCount = 0;
  rows.forEach(([source, index], output) => {
    if (index >= 0 && chunks[source]!.getValid(index)) bitmap[output >> 3]! |= 1 << (output & 7);
    else nullCount++;
  });
  const buffers: Partial<Buffers<arrow.DataType>> = {
    [arrow.BufferType.VALIDITY]: nullCount ? bitmap : undefined
  };
  let children: arrow.Data[] = [];
  if (arrow.DataType.isStruct(type)) {
    children = first.children.map((_, index) =>
      gatherArrowChunks(
        chunks.map(data => data.children[index]!),
        rows,
        context
      )
    );
  } else if (arrow.DataType.isFixedSizeList(type) || first.valueOffsets) {
    const fixed = arrow.DataType.isFixedSizeList(type) ? type.listSize : undefined;
    const offsets =
      fixed !== undefined ? undefined : makeArrowOffsets(first.valueOffsets, rows.length + 1);
    const childRows: ArrowChunkRow[] = [];
    let length = 0;
    rows.forEach(([source, index], output) => {
      const data = chunks[source]!;
      const valid = index >= 0 && chunks[source]!.getValid(index);
      const begin =
        fixed !== undefined ? index * fixed : valid ? Number(data.valueOffsets[index]) : 0;
      const end =
        fixed !== undefined ? begin + fixed : valid ? Number(data.valueOffsets[index + 1]) : 0;
      if (first.children.length) {
        for (let child = begin; child < end; child++)
          childRows.push([source, index < 0 ? -1 : child]);
      }
      length += end - begin;
      if (offsets) setArrowOffset(offsets, output + 1, length);
    });
    if (offsets) buffers[arrow.BufferType.OFFSET] = offsets;
    if (first.children.length) {
      children = [
        gatherArrowChunks(
          chunks.map(data => data.children[0]!),
          childRows,
          context
        )
      ];
    } else {
      const values = new Uint8Array(length);
      rows.forEach(([source, index], output) => {
        const data = chunks[source]!;
        if (index < 0 || !data.getValid(index)) return;
        values.set(
          data.values.subarray(
            Number(data.valueOffsets[index]),
            Number(data.valueOffsets[index + 1])
          ),
          Number(offsets![output])
        );
      });
      buffers[arrow.BufferType.DATA] = values;
    }
  } else if (arrow.DataType.isBool(type)) {
    const values = new Uint8Array(Math.ceil(rows.length / 8));
    rows.forEach(([source, index], output) => {
      const data = chunks[source]!;
      const bit = data.offset + index;
      if (index >= 0 && data.values[bit >> 3]! & (1 << (bit & 7)))
        values[output >> 3]! |= 1 << (output & 7);
    });
    buffers[arrow.BufferType.DATA] = values;
  } else if (!arrow.DataType.isNull(type)) {
    const storageType = arrow.DataType.isDictionary(type) ? type.indices : type;
    const values = new storageType.ArrayType(rows.length * first.stride);
    rows.forEach(([source, index], output) => {
      if (index < 0) return;
      const data = chunks[source]!;
      values.set(
        data.values.subarray(index * data.stride, (index + 1) * data.stride),
        output * first.stride
      );
    });
    buffers[arrow.BufferType.DATA] = values;
  }
  let dictionary: arrow.Vector | undefined;
  if (first.dictionary) {
    dictionary = context.dictionaries.get(first.dictionary);
    if (!dictionary) {
      dictionary = rows.length
        ? splitArrowBuffers(first.dictionary, {copy: 'all'})
        : new arrow.Vector([gatherArrowChunks([first.dictionary.data[0]!], [], context)]);
      if (rows.length) context.dictionaries.set(first.dictionary, dictionary);
    }
  }
  const variadicBuffers = getArrowVariadicBuffers(first).map(buffer => {
    let copy = context.variadicBuffers.get(buffer);
    if (!copy) {
      copy = new Uint8Array(buffer);
      context.variadicBuffers.set(buffer, copy);
    }
    return copy;
  });
  return createArrowData(
    type,
    0,
    rows.length,
    arrow.DataType.isNull(type) ? rows.length : nullCount,
    buffers,
    children,
    dictionary,
    variadicBuffers
  );
}
