// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  DataType,
  Field,
  Int32,
  Schema,
  Table,
  Utf8,
  Vector,
  makeData,
  vectorFromArray
} from 'apache-arrow';
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

/** Derives the exposed child fields without reading input rows. */
export function getUnnestFields(type: DataType, options: UnnestArrowColumnOptions): Field[] {
  const map = DataType.isMap(type);
  const list = DataType.isList(type) || DataType.isFixedSizeList(type);
  const struct = DataType.isStruct(type);
  if (!list && !map && !struct) throw new Error('UNNEST requires a list, map, or struct column');
  const children = map ? type.children[0]!.type.children : type.children;
  const value = children[map ? 1 : 0];
  if (!value) throw new Error('UNNEST requires a declared child type');
  return [
    value.clone({name: options.valueColumn, nullable: true}),
    ...(options.keyColumn
      ? [
          new Field(
            options.keyColumn,
            list ? new Int32() : map ? children[0]!.type : new Utf8(),
            true
          )
        ]
      : []),
    ...(options.ordinalColumn ? [new Field(options.ordinalColumn, new Int32(), true)] : [])
  ];
}

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
  const result = expandArrowColumn(table, column, options);
  const fields = [...table.schema.fields, ...result.table.schema.fields];
  if (new Set(fields.map(field => field.name)).size !== fields.length)
    throw new Error('Duplicate UNNEST output name');
  const schema = new Schema(fields, table.schema.metadata);
  if (!result.parentRows.length) return new Table(schema, []);
  const parents = takeArrowTableRows(table, result.parentRows);
  return new Table(
    schema,
    Object.fromEntries(
      fields.map((field, index) => [
        field.name,
        index < table.numCols
          ? parents.getChildAt(index)!
          : result.table.getChildAt(index - table.numCols)!
      ])
    )
  );
}

/** Returns physical children and their parent positions for a lateral join. */
export function expandArrowColumn(
  table: Table,
  column: string,
  options: UnnestArrowColumnOptions
): {table: Table; parentRows: Int32Array} {
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
  if (!struct && !options.outer) return expandCollectionRuns(input, options);
  const keyType = list ? new Int32() : map ? children[0]!.type : new Utf8();
  const schema = new Schema(getUnnestFields(type, options));
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
              ? local * type.listSize
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
  return {
    parentRows: Int32Array.from(parentRows),
    table: parentRows.length
      ? new Table(schema, {
          [options.valueColumn]: new Vector(values.flatMap(value => value.data)),
          ...(options.keyColumn
            ? {[options.keyColumn]: new Vector(keys.flatMap(key => key.data))}
            : {}),
          ...(options.ordinalColumn
            ? {[options.ordinalColumn]: vectorFromArray(positions, new Int32())}
            : {})
        })
      : new Table(schema, [])
  };
}

/** Expands non-outer collections by slicing contiguous physical child ranges. */
function expandCollectionRuns(
  input: Vector,
  options: UnnestArrowColumnOptions
): {table: Table; parentRows: Int32Array} {
  const type = input.type;
  const map = DataType.isMap(type);
  const listSize = DataType.isFixedSizeList(type) ? type.listSize : 0;
  const schema = new Schema(getUnnestFields(type, options));
  const parentRows: number[] = [];
  const values: Vector[] = [];
  const keys: Vector[] = [];
  const emitPositions = options.ordinalColumn || (!map && options.keyColumn);
  let parent = 0;

  for (const data of input.data) {
    const chunk = new Vector([data]);
    const entries = new Vector([data.children[0]!]);
    const childValues = map ? entries.getChildAt(1)! : entries;
    const childKeys = map && options.keyColumn ? entries.getChildAt(0) : null;
    let runStart = 0;
    let runEnd = 0;
    const flush = () => {
      if (runEnd > runStart) {
        values.push(childValues.slice(runStart, runEnd));
        if (childKeys) keys.push(childKeys.slice(runStart, runEnd));
      }
    };

    for (let row = 0; row < chunk.length; row++, parent++) {
      options.signal?.throwIfAborted();
      if (!chunk.isValid(row)) continue;
      const start = listSize ? row * listSize : Number(data.valueOffsets[row]);
      const end = listSize ? start + listSize : Number(data.valueOffsets[row + 1]);
      if (start === end) continue;
      if (start !== runEnd) {
        flush();
        runStart = start;
      }
      runEnd = end;
      for (let index = start; index < end; index++) {
        if ((index & 1023) === 0) options.signal?.throwIfAborted();
        parentRows.push(parent);
      }
    }
    flush();
  }
  if (!parentRows.length) return {table: new Table(schema, []), parentRows: new Int32Array()};
  const ordinals = emitPositions ? makeListOrdinals(parentRows) : undefined;
  const columns: Record<string, Vector> = {
    [options.valueColumn]: new Vector(values.flatMap(value => value.data))
  };
  if (options.keyColumn) {
    columns[options.keyColumn] = map ? new Vector(keys.flatMap(key => key.data)) : ordinals!;
  }
  if (options.ordinalColumn) columns[options.ordinalColumn] = ordinals!;
  return {table: new Table(schema, columns), parentRows: Int32Array.from(parentRows)};
}

/** Writes one-based positions directly into an Arrow Int32 buffer. */
function makeListOrdinals(parentRows: readonly number[]): Vector {
  const data = new Int32Array(parentRows.length);
  let position = 0;
  for (let row = 0; row < parentRows.length; row++) {
    position = parentRows[row] === parentRows[row - 1] ? position + 1 : 1;
    data[row] = position;
  }
  return new Vector([makeData({type: new Int32(), data})]);
}
