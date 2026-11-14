// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  DataType,
  Field,
  Float64,
  Int64,
  Schema,
  Table,
  vectorFromArray,
  type Vector
} from 'apache-arrow';
import {takeArrowTableRows, validateArrowTableSchema} from '@math.gl/arrow';
import {compileArrowAggregates, type ArrowAggregate} from './aggregates';
import {valueType} from './buffers';
import {compileArrowExpression} from './compiler';
import type {ArrowExpressionOptions, ArrowExpressionValue} from './types';

/** A stable ordering key resolved against the source or grouped result. */
export type ArrowQueryOrder = {
  /** Column name before SELECT aliases are applied. */
  column: string;
  /** Sort direction, ascending by default. */
  direction?: 'asc' | 'desc';
  /** Explicit null placement, last by default. */
  nulls?: 'first' | 'last';
};

/** An inner equi-join with a prefix for right-side output names. */
export type ArrowQueryJoin = {
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
  const {vector: leftKey} = getScalarColumn(left, join.left);
  const {vector: rightKey} = getScalarColumn(right, join.right);
  const fields = [
    ...left.schema.fields,
    ...right.schema.fields.map(field => field.clone({name: join.rightPrefix + field.name}))
  ];
  if (new Set(fields.map(field => field.name)).size !== fields.length)
    throw new Error('Duplicate Arrow join output name');
  const schema = new Schema(fields, left.schema.metadata, undefined, left.schema.metadataVersion);

  const rightRows = new Map<ArrowExpressionValue, number[]>();
  for (let row = 0; row < right.numRows; row++) {
    signal?.throwIfAborted();
    const key = rightKey!.get(row);
    if (key === null || (typeof key === 'number' && Number.isNaN(key))) continue;
    const matches = rightRows.get(key);
    if (matches) matches.push(row);
    else rightRows.set(key, [row]);
  }
  const leftIndexes: number[] = [];
  const rightIndexes: number[] = [];
  for (let row = 0; row < left.numRows; row++) {
    signal?.throwIfAborted();
    const key = leftKey!.get(row);
    for (const match of rightRows.get(key) ?? []) {
      leftIndexes.push(row);
      rightIndexes.push(match);
    }
  }
  if (!leftIndexes.length) return new Table(schema, []);

  const tables = [
    takeArrowTableRows(left, Int32Array.from(leftIndexes)),
    takeArrowTableRows(right, Int32Array.from(rightIndexes))
  ];
  const columns = tables.flatMap(table =>
    table.schema.fields.map((_, index) => table.getChildAt(index)!)
  );
  return new Table(
    schema,
    Object.fromEntries(fields.map((field, index) => [field.name, columns[index]!]))
  );
}

/** Sorts stably by scalar keys and gathers only the requested rows. */
export function orderArrowTable(
  table: Table,
  orderBy: readonly ArrowQueryOrder[],
  offset: number,
  limit: number | undefined,
  signal?: AbortSignal
): Table {
  const keys = orderBy.map(key => ({...key, vector: getScalarColumn(table, key.column).vector}));
  const indexes = Array.from({length: table.numRows}, (_, index) => index);
  indexes.sort((left, right) => {
    signal?.throwIfAborted();
    for (const {vector, direction, nulls} of keys) {
      const a = vector!.get(left);
      const b = vector!.get(right);
      if (a === b) continue;
      if (a === null || b === null) return (a === null ? -1 : 1) * (nulls === 'first' ? 1 : -1);
      const order = a < b ? -1 : a > b ? 1 : Number(Number.isNaN(a)) - Number(Number.isNaN(b));
      if (order) return direction === 'desc' ? -order : order;
    }
    return 0;
  });
  return takeArrowTableRows(
    table,
    Int32Array.from(indexes.slice(offset, limit === undefined ? undefined : offset + limit))
  );
}

/** Groups by scalar source columns and evaluates the shared Arrow aggregate kernels. */
export function groupArrowTable(
  table: Table,
  groupBy: readonly string[],
  aggregates: Readonly<Record<string, ArrowAggregate>>,
  options: ArrowExpressionOptions & {signal?: AbortSignal}
): Table {
  const keys = groupBy.map(name => getScalarColumn(table, name));
  const fields = keys.map(({field}) => field);
  const definitions = Object.entries(aggregates);
  const names = [...groupBy, ...definitions.map(([name]) => name)];
  if (new Set(names).size !== names.length) throw new Error('Duplicate Arrow grouping output name');

  const compiled = compileArrowAggregates(aggregates, options);
  const groups = new Map<string, number[]>();
  if (!groupBy.length) groups.set('[]', []);
  for (let row = 0; groupBy.length && row < table.numRows; row++) {
    options.signal?.throwIfAborted();
    const key = JSON.stringify(
      keys.map(({vector}) => {
        const value = vector!.get(row);
        return [typeof value, String(value)];
      })
    );
    const rows = groups.get(key);
    if (rows) rows.push(row);
    else groups.set(key, [row]);
  }

  const rows = [...groups.values()];
  const representatives = rows.flatMap(indexes => (indexes.length ? [indexes[0]!] : []));
  const selected = takeArrowTableRows(table, Int32Array.from(representatives));
  const results = rows.map(indexes =>
    compiled.evaluate(
      groupBy.length ? takeArrowTableRows(table, Int32Array.from(indexes)) : table,
      options
    )
  );
  const aggregateFields = definitions.map(([name, aggregate]) => {
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
  const schema = new Schema([...fields, ...aggregateFields], table.schema.metadata);
  if (!results.length) return new Table(schema, []);
  const columns = [
    ...fields.map(field => selected.getChild(field.name)!),
    ...aggregateFields.map(field =>
      vectorFromArray(
        results.map(result => result[field.name]),
        field.type
      )
    )
  ];
  return new Table(schema, Object.fromEntries(names.map((name, index) => [name, columns[index]!])));
}

/** Validates scalar key types consistently even when there are no rows. */
function getScalarColumn(table: Table, name: string): {field: Field; vector: Vector | null} {
  const field = table.schema.fields.find(field => field.name === name);
  if (!field) throw new Error(`Arrow query column not found: ${name}`);
  const type = valueType(field.type);
  if (
    !(
      DataType.isNull(type) ||
      DataType.isBool(type) ||
      DataType.isInt(type) ||
      DataType.isFloat(type) ||
      DataType.isUtf8(type)
    )
  ) {
    throw new Error(`Unsupported Arrow relational key type: ${type}`);
  }
  return {field, vector: table.getChild(name)};
}
