// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, Field, Int32, Schema, Table, Utf8, Vector, vectorFromArray} from 'apache-arrow';
import {takeArrowTableRows} from '@math.gl/core/arrow';
import {physicalKey, extensionKey} from './signature';

/** Names and cancellation for expanding a nested column into relational rows. */
export type UnnestArrowColumnOptions = {
  /** Name of the appended child-value column. Must not replace an existing column. */
  valueColumn: string;
  /** Optional map/struct key or one-based list position column. */
  keyColumn?: string;
  /** Optional one-based element position, including for maps. */
  ordinalColumn?: string;
  /** Retain null and empty containers as one row with null key/value. Defaults to false. */
  outer?: boolean;
  /** Synchronous cancellation, checked per source row. */
  signal?: AbortSignal;
};

/**
 * Expands a List, FixedSizeList, Map, or homogeneous Struct column.
 * Parent columns and metadata are retained. Lists preserve element order, maps
 * preserve entry order, and structs use schema field order. Null elements remain
 * rows; null/empty containers produce no rows unless outer is true.
 */
export function unnestArrowColumn(
  table: Table,
  column: string,
  options: UnnestArrowColumnOptions
): Table {
  const input = table.getChild(column);
  if (!input) throw new Error(`Unknown nested column: ${column}`);
  const type = input.type;
  const list = DataType.isList(type) || DataType.isFixedSizeList(type);
  const map = DataType.isMap(type);
  const struct = DataType.isStruct(type);
  if (!list && !map && !struct) throw new Error('UNNEST requires a list, map, or struct column');
  const children = map ? type.children[0]!.type.children : type.children;
  const valueField = children[map ? 1 : 0];
  if (!valueField) throw new Error('UNNEST requires a declared child type');
  if (
    struct &&
    children.some(
      field =>
        physicalKey(field.type) !== physicalKey(valueField.type) ||
        extensionKey(field) !== extensionKey(valueField)
    )
  ) {
    throw new Error('UNNEST struct fields must share one type');
  }
  const keyType = list ? new Int32() : map ? children[0]!.type : new Utf8();
  const fields = [
    ...table.schema.fields,
    valueField.clone({name: options.valueColumn, nullable: true}),
    ...(options.keyColumn ? [new Field(options.keyColumn, keyType, true)] : []),
    ...(options.ordinalColumn ? [new Field(options.ordinalColumn, new Int32(), true)] : [])
  ];
  if (new Set(fields.map(field => field.name)).size !== fields.length) {
    throw new Error('Duplicate UNNEST output name');
  }
  const schema = new Schema(fields, table.schema.metadata);
  const parentRows: number[] = [];
  /** Physical child slices preserve timestamps, dictionaries and nested values. */
  const values: Vector[] = [];
  /** Physical map keys or generated struct/list positions. */
  const keys: Vector[] = [];
  /** One-based position within each parent collection. */
  const positions: (number | null)[] = [];
  /** Current collection position, reset for each parent. */
  let position = 0;
  /** Appends one expanded row while preserving its parent index. */
  function append(row: number, key: Vector, value: Vector, ordinal: number | null): void {
    parentRows.push(row);
    keys.push(key);
    values.push(value);
    positions.push(ordinal);
  }
  /** Tracks logical parent positions across Arrow chunks. */
  let row = 0;
  for (const data of input.data) {
    /** Chunk-local parent validity and offsets. */
    const chunk = new Vector([data]);
    for (let local = 0; local < chunk.length; local++, row++) {
      options.signal?.throwIfAborted();
      const before = parentRows.length;
      position = 0;
      if (chunk.isValid(local)) {
        if (struct) {
          for (let index = 0; index < children.length; index++) {
            append(
              row,
              vectorFromArray([children[index]!.name], keyType),
              new Vector([data.children[index]!]).slice(local, local + 1),
              ++position
            );
          }
        } else {
          /** Collection offsets already account for sliced variable-length parents. */
          const begin =
            list && DataType.isFixedSizeList(type)
              ? (data.offset + local) * type.listSize
              : Number(data.valueOffsets[local]);
          const end =
            list && DataType.isFixedSizeList(type)
              ? begin + type.listSize
              : Number(data.valueOffsets[local + 1]);
          /** Physical collection values, including map entry structs. */
          const child = new Vector([data.children[0]!]);
          for (let index = begin; index < end; index++) {
            options.signal?.throwIfAborted();
            const value = map
              ? child.getChildAt(1)!.slice(index, index + 1)
              : child.slice(index, index + 1);
            const key = map
              ? child.getChildAt(0)!.slice(index, index + 1)
              : vectorFromArray([index - begin + 1], keyType);
            append(row, key, value, ++position);
          }
        }
      }
      if (options.outer && before === parentRows.length)
        append(
          row,
          vectorFromArray([null], keyType),
          vectorFromArray([null], valueField.type),
          null
        );
    }
  }
  if (!parentRows.length) return new Table(schema, []);
  const parents = takeArrowTableRows(table, Int32Array.from(parentRows));
  return new Table(schema, {
    ...Object.fromEntries(
      table.schema.fields.map(field => [field.name, parents.getChild(field.name)!])
    ),
    [options.valueColumn]: new Vector(values.flatMap(value => value.data)),
    ...(options.keyColumn ? {[options.keyColumn]: new Vector(keys.flatMap(key => key.data))} : {}),
    ...(options.ordinalColumn
      ? {[options.ordinalColumn]: vectorFromArray(positions, new Int32())}
      : {})
  });
}
