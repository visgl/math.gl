// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, Precision, type Vector, type Data} from 'apache-arrow';
import {float16Values, requireFloat16} from './float16';
import {ExpressionEvaluationError} from '../expressions/index';
import type {ArrowExpressionValue} from './types';

/** Dictionary encodings do not change expression value types. */
export function valueType(type: DataType): DataType {
  return DataType.isDictionary(type) ? valueType(type.dictionary) : type;
}

/** Stable primitive type identity, independent of concrete Arrow subclasses. */
export function typeKey(type: DataType): string {
  type = valueType(type);
  if (DataType.isInt(type)) return `${type.isSigned ? 'i' : 'u'}${type.bitWidth}`;
  if (DataType.isFloat(type)) {
    if (type.precision === Precision.HALF) requireFloat16();
    return `f${type.precision}`;
  }
  if (DataType.isBool(type)) return 'bool';
  if (DataType.isUtf8(type)) return 'utf8';
  if (DataType.isNull(type)) return 'null';
  throw new Error(`Unsupported Arrow expression type: ${type}`);
}

/** Reader over Arrow chunks; slices already adjust numeric buffers and string offsets. */
export class ColumnReader {
  private readonly ends: number[] = [];
  private readonly location: [Data, number] = [null!, 0];
  private readonly range: [Uint8Array, number, number] = [null!, 0, 0];
  private readonly half = new Map<Data, Float16Array>();
  private readonly dictionaries = new Map<Data, ColumnReader>();
  private readonly decoder = new TextDecoder();
  constructor(readonly vector: Vector) {
    let end = 0;
    for (const data of vector.data) {
      end += data.length;
      this.ends.push(end);
      if (DataType.isFloat(data.type) && data.type.precision === Precision.HALF)
        this.half.set(data, float16Values(data.values as Uint16Array));
      if (DataType.isDictionary(data.type))
        this.dictionaries.set(data, new ColumnReader(data.dictionary!));
    }
  }
  /** Locates a chunk without constructing row objects. */
  private chunk(row: number): [Data, number] {
    let index = 0;
    while (row >= this.ends[index]!) index++;
    this.location[0] = this.vector.data[index]!;
    this.location[1] = row - (index ? this.ends[index - 1]! : 0);
    return this.location;
  }
  /** Tests validity with the physical bit offset. */
  isValid(row: number): boolean {
    const [data, index] = this.chunk(row);
    if (DataType.isNull(data.type)) return false;
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
    if (DataType.isUtf8(data.type))
      return this.decoder.decode(
        data.values.subarray(data.valueOffsets[index], data.valueOffsets[index + 1])
      );
    if (DataType.isBool(data.type)) {
      const bit = data.offset + index;
      return Boolean(data.values[bit >> 3]! & (1 << (bit & 7)));
    }
    return this.half.has(data)
      ? this.half.get(data)![index]!
      : (data.values[index] as number | bigint);
  }
  /** Resolves UTF-8 buffers, including dictionary values, without decoding. */
  utf8(row: number): [Uint8Array, number, number] {
    const [data, index] = this.chunk(row);
    if (DataType.isDictionary(data.type))
      return this.dictionaries.get(data)!.utf8(Number(data.values[index]));
    this.range[0] = data.values as Uint8Array;
    this.range[1] = Number(data.valueOffsets[index]);
    this.range[2] = Number(data.valueOffsets[index + 1]);
    return this.range;
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
