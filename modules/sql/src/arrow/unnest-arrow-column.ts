// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, Field, Int32, Schema, Table, Utf8, vectorFromArray} from 'apache-arrow';
import {takeArrowTableRows} from '@math.gl/arrow';
import {physicalKey, extensionKey} from './signature';

/** Names and cancellation for expanding a nested column into relational rows. */
export type UnnestArrowColumnOptions = {
  /** Name of the appended child-value column. Must not replace an existing column. */
  valueColumn: string;
  /** Optional map/struct key or one-based list position column. */
  keyColumn?: string;
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
    ...(options.keyColumn ? [new Field(options.keyColumn, keyType, true)] : [])
  ];
  if (new Set(fields.map(field => field.name)).size !== fields.length) {
    throw new Error('Duplicate UNNEST output name');
  }
  const schema = new Schema(fields, table.schema.metadata);
  const parentRows: number[] = [];
  const values: unknown[] = [];
  const keys: unknown[] = [];
  /** Appends one expanded row while preserving its parent index. */
  function append(row: number, key: unknown, value: unknown): void {
    parentRows.push(row);
    keys.push(key);
    values.push(value);
  }
  for (let row = 0; row < table.numRows; row++) {
    options.signal?.throwIfAborted();
    const value = input.get(row);
    const before = parentRows.length;
    if (value !== null) {
      if (list) {
        for (let index = 0; index < value.length; index++) append(row, index + 1, value.get(index));
      } else if (map) {
        for (const [key, item] of value) append(row, key, item);
      } else {
        for (const field of children) append(row, field.name, value[field.name]);
      }
    }
    if (options.outer && before === parentRows.length) append(row, null, null);
  }
  if (!parentRows.length) return new Table(schema, []);
  const parents = takeArrowTableRows(table, Int32Array.from(parentRows));
  return new Table(schema, {
    ...Object.fromEntries(
      table.schema.fields.map(field => [field.name, parents.getChild(field.name)!])
    ),
    [options.valueColumn]: vectorFromArray(values, valueField.type),
    ...(options.keyColumn ? {[options.keyColumn]: vectorFromArray(keys, keyType)} : {})
  });
}
