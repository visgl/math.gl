// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {Buffers} from 'apache-arrow/data';
import {createArrowData, getArrowVariadicBuffers} from './arrow-data';
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
  batchIndex: number;
  /** Source rows local to that batch, in output order. */
  indexes: number[];
};

/** Materializes selected physical rows without decoding union tags or scalar values. */
export function takeArrowTableRows<T extends arrow.TypeMap>(
  table: arrow.Table<T>,
  indexes: Int32Array
): arrow.Table<T> {
  const offsets = [0];
  for (const batch of table.batches) offsets.push(offsets[offsets.length - 1]! + batch.numRows);
  const runs: ArrowRowRun[] = [];
  for (const index of indexes) {
    let lower = 0;
    let upper = table.batches.length - 1;
    while (lower < upper) {
      const middle = Math.floor((lower + upper) / 2);
      if (index >= offsets[middle + 1]!) lower = middle + 1;
      else upper = middle;
    }
    let run = runs[runs.length - 1];
    if (!run || run.batchIndex !== lower) {
      run = {batchIndex: lower, indexes: []};
      runs.push(run);
    }
    run.indexes.push(index - offsets[lower]!);
  }
  const context: TakeArrowContext = {dictionaries: new WeakMap(), variadicBuffers: new WeakMap()};
  const batches = runs.map(run => {
    const source = table.batches[run.batchIndex]!;
    const children = source.data.children.map(child =>
      takeArrowDataRows(child, run.indexes, context)
    );
    const data = new arrow.Data(
      new arrow.Struct(table.schema.fields),
      0,
      run.indexes.length,
      0,
      undefined,
      children
    );
    return new arrow.RecordBatch(table.schema, data);
  });
  return new arrow.Table(table.schema, batches);
}

/** Gathers one physical data node; child indexes are recursively compacted. */
function takeArrowDataRows(
  data: arrow.Data,
  indexes: readonly number[],
  context: TakeArrowContext
): arrow.Data {
  const type = data.type;
  if (arrow.DataType.isUnion(type)) return takeArrowUnionRows(data, indexes, context);
  const {bitmap, nullCount} = takeArrowValidity(data, indexes);
  const buffers: Partial<Buffers<arrow.DataType>> = {[arrow.BufferType.VALIDITY]: bitmap};
  if (arrow.DataType.isNull(type))
    return createArrowData(type, 0, indexes.length, indexes.length, buffers, []);
  if (arrow.DataType.isStruct(type)) {
    return createArrowData(
      type,
      0,
      indexes.length,
      nullCount,
      buffers,
      data.children.map(child => takeArrowDataRows(child, indexes, context))
    );
  }
  if (arrow.DataType.isFixedSizeList(type)) {
    const childIndexes: number[] = [];
    for (const index of indexes) {
      for (let coordinate = 0; coordinate < type.listSize; coordinate++)
        childIndexes.push(index * type.listSize + coordinate);
    }
    return createArrowData(type, 0, indexes.length, nullCount, buffers, [
      takeArrowDataRows(data.children[0]!, childIndexes, context)
    ]);
  }
  if (data.valueOffsets && data.children.length === 1) {
    const offsets = makeArrowOffsets(data.valueOffsets, indexes.length + 1);
    const childIndexes: number[] = [];
    const vector = new arrow.Vector([data]);
    indexes.forEach((index, outputIndex) => {
      if (vector.isValid(index)) {
        const begin = Number(data.valueOffsets[index]);
        const end = Number(data.valueOffsets[index + 1]);
        for (let childIndex = begin; childIndex < end; childIndex++) childIndexes.push(childIndex);
      }
      setArrowOffset(offsets, outputIndex + 1, childIndexes.length);
    });
    buffers[arrow.BufferType.OFFSET] = offsets;
    return createArrowData(type, 0, indexes.length, nullCount, buffers, [
      takeArrowDataRows(data.children[0]!, childIndexes, context)
    ]);
  }
  if (arrow.DataType.isBool(type)) {
    const values = new Uint8Array(Math.ceil(indexes.length / 8));
    indexes.forEach((index, outputIndex) => {
      const bitIndex = data.offset + index;
      if (data.values[bitIndex >> 3]! & (1 << (bitIndex & 7)))
        values[outputIndex >> 3]! |= 1 << (outputIndex & 7);
    });
    buffers[arrow.BufferType.DATA] = values;
  } else if (data.valueOffsets) {
    const offsets = makeArrowOffsets(data.valueOffsets, indexes.length + 1);
    const ranges: Array<[number, number]> = [];
    const vector = new arrow.Vector([data]);
    let length = 0;
    indexes.forEach((index, outputIndex) => {
      const begin = vector.isValid(index) ? Number(data.valueOffsets[index]) : 0;
      const end = vector.isValid(index) ? Number(data.valueOffsets[index + 1]) : 0;
      ranges.push([begin, end]);
      length += end - begin;
      setArrowOffset(offsets, outputIndex + 1, length);
    });
    const values = new Uint8Array(length);
    let cursor = 0;
    for (const [begin, end] of ranges) {
      values.set(data.values.subarray(begin, end), cursor);
      cursor += end - begin;
    }
    buffers[arrow.BufferType.OFFSET] = offsets;
    buffers[arrow.BufferType.DATA] = values;
  } else {
    // Copy raw fixed-width storage: this preserves nanoseconds, decimal words and float bits.
    const values = new type.ArrayType(indexes.length * data.stride);
    indexes.forEach((index, outputIndex) => {
      values.set(
        data.values.subarray(index * data.stride, (index + 1) * data.stride),
        outputIndex * data.stride
      );
    });
    buffers[arrow.BufferType.DATA] = values;
  }
  let dictionary: arrow.Vector | undefined;
  if (data.dictionary) {
    dictionary = context.dictionaries.get(data.dictionary);
    if (!dictionary) {
      dictionary = indexes.length
        ? splitArrowBuffers(data.dictionary, {copy: 'all'})
        : new arrow.Vector([takeArrowDataRows(data.dictionary.data[0]!, [], context)]);
      if (indexes.length) context.dictionaries.set(data.dictionary, dictionary);
    }
  }
  const variadicBuffers = getArrowVariadicBuffers(data).map(buffer => {
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
    indexes.length,
    nullCount,
    buffers,
    [],
    dictionary,
    variadicBuffers
  );
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
    const typeId = data.typeIds[index]!;
    typeIds[outputIndex] = typeId;
    if (dense) {
      const selected = childIndexes[type.typeIdToChildIndex[typeId]!]!;
      offsets![outputIndex] = selected.length;
      selected.push(data.valueOffsets[index]!);
    }
  });
  const children = data.children.map((child, childIndex) =>
    takeArrowDataRows(child, dense ? childIndexes[childIndex]! : indexes, context)
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

/** Re-packs selected validity bits without retaining the source backing buffer. */
function takeArrowValidity(
  data: arrow.Data,
  indexes: readonly number[]
): {bitmap: Uint8Array | undefined; nullCount: number} {
  const vector = new arrow.Vector([data]);
  const bitmap = new Uint8Array(Math.ceil(indexes.length / 8));
  let nullCount = 0;
  indexes.forEach((index, outputIndex) => {
    if (vector.isValid(index)) bitmap[outputIndex >> 3]! |= 1 << (outputIndex & 7);
    else nullCount++;
  });
  return {bitmap: nullCount ? bitmap : undefined, nullCount};
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
