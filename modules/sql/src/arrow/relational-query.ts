// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  DataType,
  Field,
  Float64,
  Int64,
  makeData,
  makeVector,
  Schema,
  Table,
  vectorFromArray,
  type Vector
} from 'apache-arrow';
import {takeArrowTableRows, validateArrowTableSchema} from '@math.gl/core/arrow';
import {compileArrowAggregatePlan, type ArrowAggregate} from './aggregates';
import {compareUTF8} from '@math.gl/core/utf8';
import {nullVectorData} from './vector-mask';
import {ColumnReader, valueType} from './buffers';
import {compileArrowExpression, writeArrowExpressionValues} from './compiler';
import type {ArrowAggregateValue, ArrowExpressionOptions, ArrowExpressionValue} from './types';

/** A stable ordering key resolved against the source or grouped result. */
export type ArrowQueryOrder = {
  /** Column name before SELECT aliases are applied. */
  column: string;
  /** Sort direction, ascending by default. */
  direction?: 'asc' | 'desc';
  /** Explicit null placement, last by default. */
  nulls?: 'first' | 'last';
};

/** An equi-join with a prefix for any right-side output names. */
export type ArrowQueryJoin = {
  /** Join type. Defaults to inner. */
  type?: 'inner' | 'left' | 'semi' | 'anti';
  /** Native Arrow right input. */
  table: Table;
  /** Left key column. */
  left: string;
  /** Right key column. */
  right: string;
  /** Prefix including any separator, for example `products.`. */
  rightPrefix: string;
};

/** Appends inputs with matching schemas in input order. */
export function unionArrowTables(source: Table, inputs: readonly Table[]): Table {
  for (const table of inputs) {
    validateArrowTableSchema(table, source.schema, {
      rejectExtraFields: true,
      schemaName: 'UNION ALL'
    });
  }
  return new Table(
    source.schema,
    [source, ...inputs].flatMap(table => table.batches)
  );
}

/** Gathers matching row pairs in left row order and then right row order. */
export function joinArrowTables(left: Table, join: ArrowQueryJoin, signal?: AbortSignal): Table {
  const right = join.table;
  const {field: leftField, vector: leftKey} = getScalarColumn(left, join.left);
  const {field: rightField, vector: rightKey} = getScalarColumn(right, join.right);
  const leftType = valueType(leftField.type);
  const rightType = valueType(rightField.type);
  if (
    leftType.typeId !== rightType.typeId &&
    !DataType.isNull(leftType) &&
    !DataType.isNull(rightType) &&
    !(numericJoinKey(leftType) && numericJoinKey(rightType))
  ) {
    throw new Error(`Incompatible Arrow JOIN key types: ${leftType} and ${rightType}`);
  }
  const retainUnmatched = join.type === 'left';
  /** Existence joins emit at most one row per left input and no right fields. */
  const existence = join.type === 'semi' || join.type === 'anti';

  const rightRows = new Map<ArrowExpressionValue, number[]>();
  for (let row = 0; row < right.numRows; row++) {
    signal?.throwIfAborted();
    const key = normalizeJoinKey(rightKey!.get(row));
    if (key === null || (typeof key === 'number' && Number.isNaN(key))) continue;
    const matches = rightRows.get(key);
    if (matches) matches.push(row);
    else rightRows.set(key, [row]);
  }
  const leftIndexes: number[] = [];
  const rightIndexes: number[] = [];
  for (let row = 0; row < left.numRows; row++) {
    signal?.throwIfAborted();
    const key = normalizeJoinKey(leftKey!.get(row));
    const matches = rightRows.get(key);
    if (existence) {
      if (Boolean(matches) === (join.type === 'semi')) leftIndexes.push(row);
      continue;
    }
    if (retainUnmatched && !matches) {
      leftIndexes.push(row);
      rightIndexes.push(-1);
    }
    for (const match of matches ?? []) {
      leftIndexes.push(row);
      rightIndexes.push(match);
    }
  }
  if (existence) return takeArrowTableRows(left, Int32Array.from(leftIndexes));
  return gatherArrowJoin(
    left,
    right,
    leftIndexes,
    rightIndexes,
    makeArrowJoinSchema(left, right, join.rightPrefix, retainUnmatched)
  );
}

/** Builds the relational join schema and validates right prefix collisions. */
export function makeArrowJoinSchema(
  left: Table,
  right: Table,
  rightPrefix: string,
  nullableRight = false
): Schema {
  const fields = [
    ...left.schema.fields,
    ...right.schema.fields.map(field =>
      field.clone({name: rightPrefix + field.name, nullable: nullableRight || field.nullable})
    )
  ];
  if (new Set(fields.map(field => field.name)).size !== fields.length)
    throw new Error('Duplicate Arrow join output name');
  return new Schema(fields, left.schema.metadata, undefined, left.schema.metadataVersion);
}

/** Materializes aligned row pairs with the relational join's output schema. */
export function gatherArrowJoin(
  left: Table,
  right: Table,
  leftIndexes: readonly number[],
  rightIndexes: readonly number[],
  schema: Schema
): Table {
  if (!leftIndexes.length) return new Table(schema, []);

  const rightInput =
    !right.numRows && rightIndexes.length
      ? right.concat(
          new Table(
            right.schema,
            Object.fromEntries(
              right.schema.fields.map(field => [
                field.name,
                makeVector(nullVectorData(field.type, 1))
              ])
            )
          )
        )
      : right;
  const tables = [
    takeArrowTableRows(left, Int32Array.from(leftIndexes)),
    takeArrowTableRows(rightInput, Int32Array.from(rightIndexes))
  ];
  const columns = tables.flatMap(table =>
    table.schema.fields.map((_, index) => table.getChildAt(index)!)
  );
  return new Table(
    schema,
    Object.fromEntries(schema.fields.map((field, index) => [field.name, columns[index]!]))
  );
}

/** Integer and floating-point fields share a numeric join key domain. */
function numericJoinKey(type: DataType): boolean {
  return DataType.isInt(type) || DataType.isFloat(type);
}

/** Canonicalizes numeric keys without narrowing 64-bit integers to Number. */
function normalizeJoinKey(value: ArrowExpressionValue): ArrowExpressionValue {
  return typeof value === 'number' && Number.isInteger(value) ? BigInt(value) : value;
}

/** Sorts stably by scalar keys and gathers only the requested rows. */
export function orderArrowTable(
  table: Table,
  orderBy: readonly ArrowQueryOrder[],
  offset: number,
  limit: number | undefined,
  signal?: AbortSignal
): Table {
  const keys = orderBy.map(key => {
    const {field, vector} = getScalarColumn(table, key.column, 'order');
    return {
      ...key,
      reader: vector && new ColumnReader(vector),
      utf8: DataType.isUtf8(valueType(field.type))
    };
  });
  const indexes = Int32Array.from({length: table.numRows}, (_, index) => index);
  indexes.sort((left, right) => {
    signal?.throwIfAborted();
    for (const {reader, utf8, direction, nulls} of keys) {
      const leftValid = reader!.isValid(left);
      const rightValid = reader!.isValid(right);
      if (!leftValid || !rightValid) {
        if (leftValid === rightValid) continue;
        return (leftValid ? 1 : -1) * (nulls === 'first' ? 1 : -1);
      }
      let order: number;
      if (utf8) {
        const [a, start, end] = reader!.utf8(left);
        order = compareUTF8(a, start, end, ...reader!.utf8(right));
      } else {
        const a = reader!.get(left)!;
        const b = reader!.get(right)!;
        order = a < b ? -1 : a > b ? 1 : Number(Number.isNaN(a)) - Number(Number.isNaN(b));
      }
      if (order) return direction === 'desc' ? -order : order;
    }
    return 0;
  });
  return takeArrowTableRows(
    table,
    indexes.subarray(offset, limit === undefined ? undefined : offset + limit)
  );
}

/** A custom aggregate bound once to the input schema. */
export type BoundRelationAggregate = {
  /** Arrow field shared by all groups of this aggregate call. */
  readonly outputField: Field;
  /** Reduces one group's rows to a value in the field's physical units. */
  evaluate(table: Table): ArrowAggregateValue;
};

/** Materializes an aggregate list without reinterpreting its scalar leaves as JS values. */
function writeAggregateList(field: Field, values: readonly ArrowAggregateValue[]): Vector {
  const {type} = field;
  if (!DataType.isList(type) && !DataType.isFixedSizeList(type)) {
    const active = Uint8Array.from(values, value => Number(value !== null));
    return writeArrowExpressionValues(field, active, row => values[row] as ArrowExpressionValue);
  }
  const length = values.length;
  const bitmap = new Uint8Array(Math.ceil(length / 8));
  const offsets = DataType.isList(type) ? new Int32Array(length + 1) : undefined;
  const children: ArrowAggregateValue[] = [];
  const size = DataType.isFixedSizeList(type) ? type.listSize : 0;
  let nullCount = 0;
  for (let row = 0; row < length; row++) {
    const value = values[row] as readonly ArrowAggregateValue[] | null;
    if (value) {
      bitmap[row >> 3]! |= 1 << (row & 7);
      for (const item of value) children.push(item);
    } else {
      nullCount++;
      for (let column = 0; column < size; column++) children.push(null);
    }
    if (offsets) offsets[row + 1] = children.length;
  }
  if (offsets && children.length > 0x7fffffff)
    throw new Error('Aggregate list exceeds 32-bit Arrow offset capacity');
  const child = writeAggregateList(type.valueField, children).data[0]!;
  const data = {length, nullCount, nullBitmap: bitmap, child};
  return DataType.isList(type)
    ? makeVector(makeData({type, ...data, valueOffsets: offsets!}))
    : makeVector(makeData({type, ...data}));
}

/** Groups by scalar source columns and evaluates the shared Arrow aggregate kernels. */
export function groupArrowTable(
  table: Table,
  groupBy: readonly string[],
  aggregates: Readonly<Record<string, ArrowAggregate>>,
  options: ArrowExpressionOptions & {signal?: AbortSignal},
  custom: ReadonlyMap<string, BoundRelationAggregate> = new Map()
): Table {
  const keys = groupBy.map(name => getScalarColumn(table, name, 'group'));
  const fields = keys.map(({field}) => field);
  const definitions = Object.entries(aggregates);
  const names = [...groupBy, ...definitions.map(([name]) => name), ...custom.keys()];
  if (new Set(names).size !== names.length) throw new Error('Duplicate Arrow grouping output name');

  const compiled = compileArrowAggregatePlan(aggregates, options);
  const {representatives, values: results} =
    groupBy.length && !custom.size
      ? compiled.evaluateGroups(table, groupBy, options.signal)
      : evaluateCustomGroups(table, keys, groupBy.length, compiled, custom, options);
  const selected = takeArrowTableRows(table.select([...groupBy]), Int32Array.from(representatives));
  const aggregateFields = [
    ...getArrowAggregateFields(aggregates, options),
    ...Array.from(custom, ([name, aggregate]) => aggregate.outputField.clone({name}))
  ];
  const schema = new Schema([...fields, ...aggregateFields], table.schema.metadata);
  if (!results.length) return new Table(schema, []);
  const columns = [
    ...fields.map(field => selected.getChild(field.name)!),
    ...aggregateFields.map(field => {
      if (custom.has(field.name)) {
        if (DataType.isList(field.type))
          return writeAggregateList(
            field,
            results.map(result => result[field.name]!)
          );
        if (!DataType.isFixedSizeList(field.type))
          return writeArrowExpressionValues(
            field,
            new Uint8Array(results.length).fill(1),
            row => results[row]![field.name]!
          );
      }
      return vectorFromArray(
        results.map(result => result[field.name]),
        field.type
      );
    })
  ];
  return new Table(schema, Object.fromEntries(names.map((name, index) => [name, columns[index]!])));
}

/** Custom reducers receive per-group tables through the table function API. */
function evaluateCustomGroups(
  table: Table,
  keys: readonly {vector: Vector | null}[],
  keyCount: number,
  compiled: ReturnType<typeof compileArrowAggregatePlan>,
  custom: ReadonlyMap<string, BoundRelationAggregate>,
  options: ArrowExpressionOptions & {signal?: AbortSignal}
) {
  const readers = keys.map(({vector}) => new ColumnReader(vector!));
  const groups = new Map<string, number[]>();
  if (!keyCount) groups.set('[]', []);
  for (let row = 0; keyCount && row < table.numRows; row++) {
    options.signal?.throwIfAborted();
    const key = JSON.stringify(
      readers.map(reader => {
        const value = reader.get(row);
        return [typeof value, String(value)];
      })
    );
    const rows = groups.get(key);
    if (rows) rows.push(row);
    else groups.set(key, [row]);
  }

  const rows = [...groups.values()];
  const representatives = rows.flatMap(indexes => (indexes.length ? [indexes[0]!] : []));
  const values = rows.map(indexes => {
    const input = keyCount ? takeArrowTableRows(table, Int32Array.from(indexes)) : table;
    const output = compiled.evaluate(input, options);
    for (const [name, aggregate] of custom) {
      Object.defineProperty(output, name, {value: aggregate.evaluate(input)});
    }
    return output;
  });
  return {representatives, values};
}

/** Derives output fields consistently for materialized and incremental aggregates. */
export function getArrowAggregateFields(
  aggregates: Readonly<Record<string, ArrowAggregate>>,
  options: ArrowExpressionOptions
): Field[] {
  return Object.entries(aggregates).map(([name, aggregate]) => {
    const expression =
      aggregate.expression === undefined
        ? undefined
        : compileArrowExpression(aggregate.expression, options);
    const inputType = expression && valueType(expression.outputField.type);
    const type =
      aggregate.operation === 'COUNT' ||
      (aggregate.operation === 'SUM' && inputType && DataType.isInt(inputType))
        ? new Int64()
        : aggregate.operation === 'AVG' || !inputType
          ? new Float64()
          : inputType;
    return new Field(name, type, aggregate.operation !== 'COUNT');
  });
}

/** Validates scalar key types consistently even when there are no rows. */
function getScalarColumn(
  table: Table,
  name: string,
  operation: 'join' | 'order' | 'group' = 'join'
): {field: Field; vector: Vector | null} {
  const field = table.schema.fields.find(field => field.name === name);
  if (!field) throw new Error(`Arrow query column not found: ${name}`);
  const type = valueType(field.type);
  if (
    !(
      DataType.isNull(type) ||
      DataType.isBool(type) ||
      DataType.isInt(type) ||
      DataType.isFloat(type) ||
      DataType.isUtf8(type) ||
      (operation !== 'join' && (DataType.isDate(type) || DataType.isTimestamp(type))) ||
      (operation === 'group' && (DataType.isBinary(type) || DataType.isFixedSizeBinary(type)))
    )
  ) {
    throw new Error(`Unsupported Arrow relational key type: ${type}`);
  }
  return {field, vector: table.getChild(name)};
}
