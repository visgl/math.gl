// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Data, DataType, RecordBatch, Schema, Struct, Table, type Field} from 'apache-arrow';
import {takeArrowTableRows} from '@math.gl/arrow';
import type {
  ColumnarPredicateParameterValues,
  ParameterizedColumnarPredicate
} from '../expressions/index';
import type {TableQuery} from '../sql/query-types';
import {compileArrowArray, compileArrowExpression} from './compiler';
import {compileArrowPredicate} from './predicate';
import type {ArrowExpressionOptions, CompiledArrowExpression} from './types';

/** An in-memory SELECT and its execution options. The caller supplies the table named by FROM. */
export type ArrowTableQuery = TableQuery<ParameterizedColumnarPredicate> &
  Omit<ArrowExpressionOptions, 'inputSchema'> & {
    /** Named values for a parameterized predicate. */
    parameters?: ColumnarPredicateParameterValues;
    /** Checked between batches and during expression evaluation. */
    signal?: AbortSignal;
  };

/** A bound output field and either a source column index or a computed expression. */
type Projection = {field: Field} & ({index: number} | {expression: CompiledArrowExpression});

/** Applies WHERE, projection, and pagination directly to a native Apache Arrow table. */
export function queryArrowTable(source: Table, query: ArrowTableQuery = {}): Table {
  const {select, where, offset = 0, limit, functions, parameters, signal} = query;
  signal?.throwIfAborted();
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('Invalid Arrow query offset');
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0))
    throw new Error('Invalid Arrow query limit');

  const inputSchema = source.schema;
  const options = {inputSchema, functions};
  const predicate = where
    ? 'expression' in where
      ? compileArrowExpression(where.expression, options)
      : compileArrowPredicate(where, {...options, parameters})
    : undefined;
  if (predicate && !DataType.isBool(predicate.outputField.type))
    throw new Error('Arrow query WHERE requires a Boolean expression');

  const names = new Set<string>();
  const projection: Projection[] = select
    ? select.map(selection => {
        let output: Projection;
        if (typeof selection !== 'string' && ('array' in selection || 'expression' in selection)) {
          const expression =
            'array' in selection
              ? compileArrowArray(selection.array, {...options, type: selection.type})
              : compileArrowExpression(selection.expression, options);
          output = {
            expression,
            field: expression.outputField.clone({name: selection.as ?? expression.outputField.name})
          };
        } else {
          const column = typeof selection === 'string' ? selection : selection.column;
          const index = inputSchema.fields.findIndex(field => field.name === column);
          if (index < 0) throw new Error(`Arrow query column not found: ${column}`);
          const field = inputSchema.fields[index]!;
          output = {
            index,
            field:
              typeof selection === 'string' ? field : field.clone({name: selection.as ?? column})
          };
        }
        const name = output.field.name;
        if (names.has(name) || (typeof selection !== 'string' && selection.as === ''))
          throw new Error(`Invalid or duplicate Arrow query output name: ${name}`);
        names.add(name);
        return output;
      })
    : inputSchema.fields.map((field, index) => ({field, index}));

  const schema = select
    ? new Schema(
        projection.map(({field}) => field),
        inputSchema.metadata,
        undefined,
        inputSchema.metadataVersion
      )
    : inputSchema;
  const result: RecordBatch[] = [];
  let skip = offset;
  let remaining = limit ?? Infinity;
  for (const batch of source.batches) {
    if (remaining === 0) break;
    signal?.throwIfAborted();
    const {metadata} = batch as RecordBatch & {metadata?: Map<string, string>};
    const mask = predicate?.evaluate(batch, {signal});
    let selected: RecordBatch | undefined;
    if (mask) {
      const indexes: number[] = [];
      for (let row = 0; row < batch.numRows && indexes.length < remaining; row++) {
        if (mask.get(row) !== true) continue;
        if (skip > 0) skip--;
        else indexes.push(row);
      }
      if (indexes.length === batch.numRows) selected = batch;
      else if (indexes.length) {
        const gathered = takeArrowTableRows(
          new Table(inputSchema, [batch]),
          Int32Array.from(indexes)
        );
        selected = makeQueryBatch(
          inputSchema,
          gathered.batches[0]!.data.children,
          indexes.length,
          metadata
        );
      }
    } else {
      const start = Math.min(skip, batch.numRows);
      skip -= start;
      const end = start + Math.min(batch.numRows - start, remaining);
      if (end > start)
        selected = start === 0 && end === batch.numRows ? batch : batch.slice(start, end);
    }
    if (!selected?.numRows) continue;
    remaining -= selected.numRows;
    if (!select) {
      result.push(selected);
      continue;
    }

    const columns = projection.map(item =>
      'index' in item
        ? selected.data.children[item.index]!
        : item.expression.evaluate(selected, {signal})
    );
    // Computed vectors can introduce chunk boundaries inside the selected source batch.
    const boundaries = new Set([selected.numRows]);
    for (const column of columns) {
      if ('children' in column) continue;
      let end = 0;
      for (const chunk of column.data) {
        end += chunk.length;
        if (end > 0) boundaries.add(end);
      }
    }
    let start = 0;
    for (const end of [...boundaries].sort((left, right) => left - right)) {
      const children = columns.map(column =>
        'children' in column
          ? start === 0 && end === column.length
            ? column
            : column.slice(start, end - start)
          : column.slice(start, end).data[0]!
      );
      result.push(makeQueryBatch(schema, children, end - start, metadata));
      start = end;
    }
  }
  return new Table(schema, result);
}

/** Creates a batch while preserving its row count even for an empty projection. */
function makeQueryBatch(
  schema: Schema,
  children: Data[],
  length: number,
  metadata: Map<string, string> | undefined
): RecordBatch {
  const data = new Data(new Struct(schema.fields), 0, length, 0, undefined, children);
  return Object.assign(new RecordBatch(schema, data), {data, ...(metadata && {metadata})});
}
