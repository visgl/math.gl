// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, DateUnit, Int32, Precision, type Vector, type Data} from 'apache-arrow';
import {getFloat16ArrayConstructor, isFloat16ArrayConstructor} from '@math.gl/core/types';
import {createArrowUtf8Reader} from '@math.gl/core/arrow';
import {float16Values} from './float16';
import {ExpressionEvaluationError} from '../expressions';
import type {ArrowExpressionValue} from './types';

/** Dictionary encodings do not change expression value types. */
export function valueType(type: DataType): DataType {
  return DataType.isDictionary(type) ? valueType(type.dictionary) : type;
}

/** Stable primitive type identity, independent of concrete Arrow subclasses. */
export function typeKey(type: DataType): string {
  type = valueType(type);
  if (DataType.isInt(type)) return `${type.isSigned ? 'i' : 'u'}${type.bitWidth}`;
  if (DataType.isFloat(type)) return `f${type.precision}`;
  if (DataType.isBool(type)) return 'bool';
  if (DataType.isUtf8(type) || DataType.isLargeUtf8(type)) return 'utf8';
  if (DataType.isDate(type)) return type.unit === DateUnit.DAY ? 'date32' : 'date64';
  if (DataType.isTimestamp(type)) {
    const unit = ['s', 'ms', 'us', 'ns'][type.unit];
    return `timestamp_${unit}:${type.timezone ?? ''}`;
  }
  if (DataType.isTime(type)) return 'time_' + type.unit;
  if (DataType.isDuration(type)) return 'duration_' + type.unit;
  if (isVariableBinary(type)) return 'binary';
  if (DataType.isFixedSizeBinary(type)) return `fixedsizebinary:${type.byteWidth}`;
  if (DataType.isNull(type)) return 'null';
  throw new Error(`Unsupported Arrow expression type: ${type}`);
}

/** Identifies variable-width byte strings with either offset width. */
export function isVariableBinary(type: DataType): boolean {
  return DataType.isBinary(type) || DataType.isLargeBinary(type);
}

/** Reader over Arrow chunks; slices already adjust numeric buffers and string offsets. */
export class ColumnReader {
  private readonly ends: number[] = [];
  private chunkIndex = 0;
  private readonly location: [Data, number] = [null!, 0];
  /** Created on the first UTF-8 read. */
  private readUtf8?: ReturnType<typeof createArrowUtf8Reader>;
  private readonly half = new Map<Data, Float16Array | null>();
  private readonly dictionaries = new Map<Data, ColumnReader>();
  private readonly decoder = new TextDecoder();
  constructor(readonly vector: Vector) {
    let end = 0;
    for (const data of vector.data) {
      end += data.length;
      this.ends.push(end);
      if (DataType.isFloat(data.type) && data.type.precision === Precision.HALF)
        this.half.set(
          data,
          isFloat16ArrayConstructor(getFloat16ArrayConstructor())
            ? float16Values(data.values as Uint16Array)
            : null
        );
      if (DataType.isDictionary(data.type))
        this.dictionaries.set(data, new ColumnReader(data.dictionary!));
    }
  }
  /** Locates a chunk without constructing row objects. */
  private chunk(row: number): [Data, number] {
    let index = this.chunkIndex;
    if (row >= this.ends[index]! || (index > 0 && row < this.ends[index - 1]!)) {
      let low = 0;
      let high = this.ends.length - 1;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (row < this.ends[middle]!) high = middle;
        else low = middle + 1;
      }
      this.chunkIndex = index = low;
    }
    this.location[0] = this.vector.data[index]!;
    this.location[1] = row - (index ? this.ends[index - 1]! : 0);
    return this.location;
  }
  /** Tests validity with the physical bit offset. */
  isValid(row: number): boolean {
    const [data, index] = this.chunk(row);
    if (DataType.isNull(data.type)) return false;
    if (DataType.isUnion(data.type)) {
      // GeoArrow union nulls belong to the selected child, not the parent bitmap.
      const child = data.children[data.type.typeIdToChildIndex[data.typeIds[index]!]!];
      return Boolean(child && !DataType.isNull(child.type) && data.getValid(index));
    }
    const bit = data.offset + index;
    if (data.nullCount && !(data.nullBitmap[bit >> 3]! & (1 << (bit & 7)))) return false;
    return (
      !DataType.isDictionary(data.type) ||
      this.dictionaries.get(data)!.isValid(Number(data.values[index]))
    );
  }
  /** Reads a primitive; UTF-8 is decoded only for scalar callbacks or output materialization. */
  get(row: number): ArrowExpressionValue {
    if (!this.isValid(row)) return null;
    const [data, index] = this.chunk(row);
    if (DataType.isDictionary(data.type))
      return this.dictionaries.get(data)!.get(Number(data.values[index]));
    if (DataType.isUtf8(data.type) || DataType.isLargeUtf8(data.type))
      return this.decoder.decode(
        data.values.subarray(Number(data.valueOffsets[index]), Number(data.valueOffsets[index + 1]))
      );
    if (isVariableBinary(data.type))
      return data.values.subarray(
        Number(data.valueOffsets[index]),
        Number(data.valueOffsets[index + 1])
      );
    if (DataType.isFixedSizeBinary(data.type))
      return data.values.subarray(data.stride * index, data.stride * (index + 1));
    if (DataType.isBool(data.type)) {
      const bit = data.offset + index;
      return Boolean(data.values[bit >> 3]! & (1 << (bit & 7)));
    }
    // Temporal values use their physical units so microseconds never pass through Number.
    const half = this.half.get(data);
    if (half !== undefined) return half ? half[index]! : this.vector.get(row);
    return data.values[index] as number | bigint;
  }
  /** Resolves UTF-8 buffers, including dictionary values, without decoding. */
  utf8(row: number): [Uint8Array, number, number] {
    this.readUtf8 ??= createArrowUtf8Reader(this.vector);
    return this.readUtf8(row)!;
  }
}

/** Creates a type-specialized scalar validator once per bound operation. */
export function createValueValidator(inputType: DataType): (value: ArrowExpressionValue) => void {
  const type = valueType(inputType),
    key = typeKey(type);
  if (DataType.isInt(type)) {
    if (type.bitWidth === 64) {
      const bits = BigInt(type.bitWidth),
        min = type.isSigned ? -(1n << (bits - 1n)) : 0n;
      const max = type.isSigned ? (1n << (bits - 1n)) - 1n : (1n << bits) - 1n;
      return value => {
        if (value === null) return;
        if (typeof value !== 'bigint') throw new Error('64-bit integers require bigint values');
        if (value < min || value > max)
          throw new ExpressionEvaluationError('overflow', 'Integer expression overflow');
      };
    }
    const min = type.isSigned ? -(2 ** (type.bitWidth - 1)) : 0;
    const max = type.isSigned ? 2 ** (type.bitWidth - 1) - 1 : 2 ** type.bitWidth - 1;
    return value => {
      if (value === null) return;
      if (typeof value !== 'number')
        throw new TypeError('Integer expressions require numeric values');
      if (!Number.isInteger(value))
        throw new ExpressionEvaluationError(
          'conversion',
          'Integer expression requires integral numbers'
        );
      if (value < min || value > max)
        throw new ExpressionEvaluationError('overflow', 'Integer expression overflow');
    };
  }
  if (key === 'date32') {
    return value => {
      if (value === null) return;
      if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < -0x80000000 ||
        value > 0x7fffffff
      )
        throw new ExpressionEvaluationError('overflow', 'Invalid Date32 epoch day');
    };
  }
  if (DataType.isTime(type) && type.bitWidth === 32) return createValueValidator(new Int32());
  if (
    key === 'date64' ||
    DataType.isTimestamp(type) ||
    DataType.isTime(type) ||
    DataType.isDuration(type)
  ) {
    return value => {
      if (value === null) return;
      if (typeof value !== 'bigint' || value !== BigInt.asIntN(64, value))
        throw new ExpressionEvaluationError('overflow', 'Invalid temporal epoch value');
    };
  }
  if (isVariableBinary(type) || DataType.isFixedSizeBinary(type)) {
    return value => {
      if (value === null) return;
      if (
        !(value instanceof Uint8Array) ||
        (DataType.isFixedSizeBinary(type) && value.byteLength !== type.byteWidth)
      )
        throw new Error(`Invalid value for ${type}`);
    };
  }
  const expected = DataType.isFloat(type) ? 'number' : key === 'bool' ? 'boolean' : 'string';
  return value => {
    if (value !== null && (key === 'null' || typeof value !== expected))
      throw new Error(`Invalid value for ${type}`);
  };
}

/** Checks a literal against a declared primitive type during binding. */
export function validateValue(value: ArrowExpressionValue, type: DataType): void {
  createValueValidator(type)(value);
}
