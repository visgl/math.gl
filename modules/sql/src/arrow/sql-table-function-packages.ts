// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, Schema, Table, Vector, vectorFromArray} from 'apache-arrow';
import {takeArrowTableRows, validateArrowTableSchema} from '@math.gl/core/arrow';
import {walkArrowFunctions} from './registry';
import {expandArrowColumn, getUnnestFields} from './unnest-arrow-column';
import type {ArrowFunctionPackage, BoundLateralTableFunction, TableFunction} from './types';

/** Built-in SQL list and map expansion. Joins manage outer rows and aliases. */
export const UNNEST = {
  kind: 'table',
  name: 'UNNEST',
  bindLateral({argument, ordinality}) {
    const type = argument.type;
    const map = DataType.isMap(type);
    if (!map && !DataType.isList(type) && !DataType.isFixedSizeList(type))
      throw new Error('SQL UNNEST requires List, FixedSizeList or Map');
    const options = {
      valueColumn: 'value',
      ...(map && {keyColumn: 'key'}),
      ...(ordinality && {ordinalColumn: 'ordinal'})
    };
    const fields = getUnnestFields(type, options);
    if (map) [fields[0], fields[1]] = [fields[1]!, fields[0]!];
    const outputSchema = new Schema(fields);
    return {
      outputSchema,
      evaluate(input, {signal}) {
        const result = expandArrowColumn(input, argument.name, {...options, signal});
        return {
          parentRows: result.parentRows,
          table: result.table.numRows
            ? new Table(
                outputSchema,
                Object.fromEntries(
                  fields.map(field => [field.name, result.table.getChild(field.name)!])
                )
              )
            : new Table(outputSchema, [])
        };
      }
    };
  }
} satisfies TableFunction;

/** Collects reusable table descriptors in case-insensitive SQL name order. */
export function getSQLTableFunctions(functions: readonly ArrowFunctionPackage[] = []) {
  const result = new Map<string, TableFunction<unknown>>([['UNNEST', UNNEST]]);
  for (const entry of walkArrowFunctions(functions)) {
    if (!('kind' in entry) || entry.kind !== 'table') continue;
    const name = entry.name.toUpperCase();
    if (entry === UNNEST) continue;
    if (result.has(name)) throw new Error(`Duplicate Arrow SQL table function: ${name}`);
    result.set(name, entry);
  }
  return result;
}

/** Checks the result of descriptor evaluation against its bound schema. */
export function validateSQLTableResult(table: Table, schema: Schema): void {
  validateArrowTableSchema(table, schema, {
    rejectExtraFields: true,
    schemaName: 'table function output'
  });
}

/** Correlates output rows and applies SQL outer-row and alias semantics. */
export function joinLateralTable(
  input: Table,
  bound: BoundLateralTableFunction<unknown>,
  alias: string,
  columns: readonly string[],
  outer: boolean,
  signal?: AbortSignal
): Table {
  const fields = bound.outputSchema.fields;
  if (columns.length !== fields.length)
    throw new Error('Table function column alias count does not match its output');
  const childFields = fields.map((field, index) =>
    field.clone({name: alias + '.' + columns[index], nullable: outer || field.nullable})
  );
  const schema = new Schema([...input.schema.fields, ...childFields], input.schema.metadata);
  if (new Set(schema.fields.map(field => field.name)).size !== schema.fields.length)
    throw new Error('Duplicate lateral table function output name');
  signal?.throwIfAborted();
  const {table, parentRows} = bound.evaluate(input, {signal});
  validateSQLTableResult(table, bound.outputSchema);
  if (
    parentRows.length !== table.numRows ||
    parentRows.some(
      (row, i) => row < 0 || row >= input.numRows || (i > 0 && row < parentRows[i - 1]!)
    )
  )
    throw new Error('Invalid lateral table function parent positions');

  const gathered: number[] = [];
  const childRows: number[] = [];
  let cursor = 0;
  for (let parent = 0; parent < input.numRows; parent++) {
    signal?.throwIfAborted();
    if (outer && parentRows[cursor] !== parent) {
      gathered.push(parent);
      childRows.push(-1);
    }
    while (parentRows[cursor] === parent) {
      gathered.push(parent);
      childRows.push(cursor++);
    }
  }
  if (!gathered.length) return new Table(schema, []);
  const parents = takeArrowTableRows(input, Int32Array.from(gathered));
  const vectors = input.schema.fields.map(
    field => [field.name, parents.getChild(field.name)!] as const
  );
  for (const [index, field] of fields.entries()) {
    const vector = table.getChild(field.name)!;
    let expanded = vector;
    if (childRows.length !== table.numRows) {
      const nullRow = vectorFromArray([null], field.type);
      expanded = new Vector(
        childRows.flatMap(row => (row < 0 ? nullRow.data : vector.slice(row, row + 1).data))
      );
    }
    vectors.push([childFields[index]!.name, expanded]);
  }
  return new Table(schema, Object.fromEntries(vectors));
}
