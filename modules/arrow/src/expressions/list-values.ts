// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  DataType,
  Precision,
  Dictionary,
  Uint8,
  Vector,
  makeData,
  makeVector,
  vectorFromArray,
  type Field,
  type FixedSizeList,
  type List
} from 'apache-arrow';
import {float16Values} from './float16';
import {ColumnReader, typeKey, validateValue} from './buffers';
import type {ArrowExpressionValue} from './types';

/** Fixed numeric tuples are vector results; components of a valid tuple cannot be null. */
export function isTupleType(type: DataType): type is FixedSizeList {
  if (!DataType.isFixedSizeList(type)) return false;
  const child = type.children[0];
  if (!Number.isSafeInteger(type.listSize) || type.listSize <= 0 || !child || child.nullable)
    return false;
  if (!DataType.isInt(child.type) && !DataType.isFloat(child.type)) return false;
  typeKey(child.type);
  return true;
}

/** Builds a correctly typed all-null result, including zero-row batches. */
export function nullTupleVector(type: FixedSizeList, length: number): Vector {
  const childType = type.children[0]!.type;
  const child = makeData({
    type: childType,
    length: length * type.listSize,
    data: new childType.ArrayType(length * type.listSize)
  } as any);
  return makeVector(
    makeData({
      type,
      length,
      child,
      nullCount: length,
      nullBitmap: new Uint8Array(Math.ceil(length / 8))
    })
  );
}

/** Masks parent validity while preserving the numeric child buffers and slice offsets. */
export function maskTupleVector(vector: Vector, active: Uint8Array): Vector {
  if (!active.some(value => !value)) return vector;
  let start = 0;
  const chunks = vector.data.map(data => {
    const bitmap = new Uint8Array(Math.ceil((data.offset + data.length) / 8));
    let nullCount = 0;
    for (let row = 0; row < data.length; row++) {
      if (active[start + row] && data.getValid(row)) {
        const bit = data.offset + row;
        bitmap[bit >> 3] |= 1 << (bit & 7);
      } else nullCount++;
    }
    start += data.length;
    const buffers = data.buffers;
    buffers[2] = bitmap;
    return data.clone(data.type, data.offset, data.length, nullCount, buffers);
  });
  return new Vector(chunks);
}

/** Validates active tuple rows before exposing a kernel's buffers. */
export function validateTupleVector(vector: Vector, field: Field, active: Uint8Array): void {
  const type = field.type as FixedSizeList;
  let start = 0;
  for (const data of vector.data) {
    const child = data.children[0];
    if (!child || child.length < data.length * type.listSize)
      throw new Error('Invalid fixed-size list child length');
    for (let row = 0; row < data.length; row++) {
      if (!active[start + row]) continue;
      if (!data.getValid(row)) {
        if (!field.nullable)
          throw new Error(`Function ${field.name} returned null for a non-nullable result`);
        continue;
      }
      for (let component = 0; component < type.listSize; component++) {
        if (!child.getValid(row * type.listSize + component))
          throw new Error('Fixed-size list result contains a null non-nullable component');
      }
    }
    start += data.length;
  }
}

/** Selects branch tuples without decoding rows or constructing per-row arrays. */
export function selectTupleVectors(
  type: FixedSizeList,
  yes: Vector,
  no: Vector,
  selected: Uint8Array,
  active: Uint8Array
): Vector {
  const result = nullTupleVector(type, active.length);
  const data = result.data[0]!;
  const child = data.children[0]!;
  const values =
    DataType.isFloat(child.type) && child.type.precision === Precision.HALF
      ? float16Values(child.values as Uint16Array)
      : child.values;
  const a = new ColumnReader(yes.getChildAt(0)!);
  const b = new ColumnReader(no.getChildAt(0)!);
  const aValid = new ColumnReader(yes);
  const bValid = new ColumnReader(no);
  for (let row = 0; row < active.length; row++) {
    if (!active[row]) continue;
    const reader = selected[row] ? a : b;
    if (!(selected[row] ? aValid : bValid).isValid(row)) continue;
    data.setValid(row, true);
    for (let component = 0; component < type.listSize; component++) {
      const index = row * type.listSize + component;
      values[index] = reader.get(index) as any;
    }
  }
  return result;
}

/** Compiles a bounded flat array literal against its declared list element type. */
export function compileArrayLiteral(ast: any, type: DataType): (length: number) => Vector {
  if (!DataType.isList(type) && !DataType.isFixedSizeList(type))
    throw new Error('Array literals require a declared List or FixedSizeList argument');
  const listType = type as List | FixedSizeList;
  const child = listType.children[0]!;
  if (DataType.isDictionary(child.type))
    throw new Error('Array literal elements require primitive types');
  typeKey(child.type);
  if (ast.elements.length > 4096) throw new Error('Array literal exceeds 4096 elements');
  if (DataType.isFixedSizeList(type) && ast.elements.length !== type.listSize)
    throw new Error('Array literal length must match its FixedSizeList type');
  if (DataType.isFixedSizeList(type) && !isTupleType(type))
    throw new Error('Fixed-size array literals require non-nullable numeric elements');
  const values = Array.from(ast.elements, (element: any): ArrowExpressionValue => {
    let value: ArrowExpressionValue;
    if (element?.type === 'Literal') value = element.value;
    else if (
      element?.type === 'UnaryExpression' &&
      ['+', '-'].includes(element.operator) &&
      element.argument?.type === 'Literal' &&
      typeof element.argument.value === 'number'
    )
      value = element.operator === '-' ? -element.argument.value : element.argument.value;
    else throw new Error('Array elements must be scalar literals');
    if (value === null && !child.nullable)
      throw new Error('Array literal contains a null non-nullable element');
    validateValue(value, child.type);
    return value;
  });
  const literal = vectorFromArray([values], listType);
  const dictionaryType = new Dictionary(listType, new Uint8());
  let cached: Vector | undefined;
  return length => {
    if (!DataType.isFixedSizeList(listType) && cached?.length === length) return cached;
    if (DataType.isFixedSizeList(listType)) {
      // Fixed tuples can be expression results, so retain their ordinary Arrow representation.
      const result = nullTupleVector(listType, length);
      const data = result.data[0]!;
      const childData = data.children[0]!;
      const components =
        DataType.isFloat(childData.type) && childData.type.precision === Precision.HALF
          ? float16Values(childData.values as Uint16Array)
          : childData.values;
      for (let row = 0; row < length; row++) {
        data.setValid(row, true);
        for (let component = 0; component < listType.listSize; component++)
          components[row * listType.listSize + component] = values[component] as any;
      }
      cached = result;
    } else {
      // One dictionary value holds the complete list; never repeat it for every table row.
      cached = makeVector(
        makeData({type: dictionaryType, length, data: new Uint8Array(length), dictionary: literal})
      );
    }
    return cached;
  };
}
