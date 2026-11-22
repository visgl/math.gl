// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Data,
  DataType,
  makeData,
  type RecordBatch,
  Schema,
  Struct,
  Table,
  type Field
} from 'apache-arrow';
import {
  getRecordBatchMetadata,
  createRecordBatchWithMetadata,
  validateArrowTableSchema,
  takeArrowTableRows
} from '@math.gl/core/arrow';
import type {
  ColumnarPredicateParameterValues,
  ParameterizedColumnarPredicate
} from '../expressions';
import type {TableQuery} from '../parser/query-types';
import {compileArrowArray, compileArrowExpression} from './compiler';
import {compileArrowPredicate} from './predicate';
import {nullVectorData} from './vector-mask';
import type {ArrowAggregate} from './aggregates';
import {
  groupArrowTable,
  joinArrowTables,
  orderArrowTable,
  unionArrowTables,
  type ArrowQueryJoin,
  type ArrowQueryOrder
} from './relational-query';
import type {ArrowExpression, ArrowExpressionOptions, CompiledArrowExpression} from './types';

/** A linear Arrow query that can execute incrementally over batches. */
export type ArrowBatchQuery = TableQuery<ParameterizedColumnarPredicate> &
  Omit<ArrowExpressionOptions, 'inputSchema'> & {
    /** Named values for a parameterized predicate. */
    parameters?: ColumnarPredicateParameterValues;
    /** Checked between batches and during expression evaluation. */
    signal?: AbortSignal;
  };

/** Options specific to streaming Arrow queries. */
export type ArrowStreamingQuery = ArrowBatchQuery & {
  /** Emit a schema-bearing empty batch when an input batch produces no rows. */
  emitEmptyBatches?: boolean;
};

/** An in-memory SELECT with optional relational operators. */
export type ArrowTableQuery = ArrowBatchQuery & {
  /** Append schema-compatible tables before filtering. */
  union?: readonly Table[];
  /** Join a second table before filtering. */
  join?: ArrowQueryJoin;
  /** Scalar source columns that define groups. */
  groupBy?: readonly string[];
  /** Aggregate reductions indexed by output name. */
  aggregates?: Readonly<Record<string, ArrowAggregate>>;
  /** Stable ordering applied after grouping and before pagination. */
  orderBy?: readonly ArrowQueryOrder[];
};

/** A bound output field and either a source column index or a computed expression. */
type Projection = {field: Field} & ({index: number} | {expression: CompiledArrowExpression});

/** Applies WHERE, projection, and pagination directly to a native Apache Arrow table. */
export function queryArrowTable(source: Table, query: ArrowTableQuery = {}): Table {
  return executeArrowTableQuery(source, query, compileArrowPredicate);
}

/** Runs the table executor with the calling entry point's WHERE binder, when needed. */
export function executeArrowTableQuery(
  source: Table,
  query: ArrowTableQuery,
  bindPredicate?: typeof compileArrowPredicate
): Table {
  const {select, where, offset = 0, limit, functions, parameters, signal} = query;
  signal?.throwIfAborted();
  validatePagination(offset, limit);

  const {union, join, groupBy, aggregates, orderBy} = query;
  if (union?.length) source = unionArrowTables(source, union);
  if (join) source = joinArrowTables(source, join, signal);

  if (groupBy?.length || Object.keys(aggregates ?? {}).length || orderBy?.length) {
    source = executeArrowTableQuery(source, {where, functions, parameters, signal}, bindPredicate);
    if (groupBy?.length || Object.keys(aggregates ?? {}).length) {
      source = groupArrowTable(source, groupBy ?? [], aggregates ?? {}, {
        inputSchema: source.schema,
        functions,
        signal
      });
    }
    if (orderBy?.length) {
      source = orderArrowTable(source, orderBy, offset, limit, signal);
      return executeArrowTableQuery(source, {select, functions, signal});
    }
    return executeArrowTableQuery(source, {select, offset, limit, functions, signal});
  }

  return executeArrowProjection(source, query, undefined, bindPredicate);
}

/** Selects increasing, unique batch-relative row indices and borrows contiguous runs. */
export function selectArrowBatchRows(
  batch: RecordBatch,
  indexes: readonly number[],
  schema: Schema
): RecordBatch | undefined {
  if (!indexes.length) return undefined;
  if (indexes.length === batch.numRows) return batch;
  const start = indexes[0]!;
  if (indexes[indexes.length - 1]! - start + 1 === indexes.length) {
    return createRecordBatchWithMetadata(
      batch.schema,
      batch.data.slice(start, indexes.length),
      getRecordBatchMetadata(batch)
    );
  }
  return takeArrowTableRows(new Table(schema, [batch]), Int32Array.from(indexes)).batches[0];
}

/** Executes an already filtered input, optionally binding prepared projection calls. */
export function executeArrowProjection(
  source: Table,
  query: ArrowBatchQuery,
  prepare?: (expression: ArrowExpression, name: string) => CompiledArrowExpression,
  bindPredicate?: typeof compileArrowPredicate
): Table {
  const plan = compileArrowQuery(source.schema, query, prepare, bindPredicate);
  const result: RecordBatch[] = [];
  for (const batch of source.batches) {
    if (plan.done()) break;
    for (const output of plan.execute(batch)) result.push(output);
  }
  return new Table(plan.schema, result);
}

/** Streams a linear Arrow query with global pagination and source backpressure. */
export async function* queryArrowTableInBatches(
  input: AsyncIterable<RecordBatch> | Iterable<RecordBatch>,
  inputSchema: Schema,
  query: ArrowStreamingQuery = {}
): AsyncIterable<RecordBatch> {
  query.signal?.throwIfAborted();
  validatePagination(query.offset ?? 0, query.limit);
  const plan = compileArrowQuery(inputSchema, query, undefined, compileArrowPredicate);
  if (plan.done()) return;
  for await (const batch of input) {
    query.signal?.throwIfAborted();
    if (batch.schema !== inputSchema) {
      validateArrowTableSchema(new Table(batch.schema, []), inputSchema, {
        rejectExtraFields: true,
        schemaName: 'query input schema'
      });
    }
    yield* plan.execute(batch, query.emitEmptyBatches);
    if (plan.done()) return;
  }
}

/** Validates pagination before the query reads or transforms any rows. */
function validatePagination(offset: number, limit?: number): void {
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('Invalid Arrow query offset');
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0))
    throw new Error('Invalid Arrow query limit');
}

/** Binds predicates and projection to a schema once per execution. */
function compileArrowQuery(
  inputSchema: Schema,
  query: ArrowBatchQuery,
  prepare?: Parameters<typeof executeArrowProjection>[2],
  bindPredicate?: typeof compileArrowPredicate
) {
  const {select, where, offset = 0, limit, functions, parameters, signal} = query;
  const options = {inputSchema, functions};
  if (where && !('expression' in where) && !bindPredicate)
    throw new Error('Portable Arrow predicates require a predicate binder');
  const predicate = where
    ? 'expression' in where
      ? compileArrowExpression(where.expression, options)
      : bindPredicate!(where, {...options, parameters})
    : undefined;
  if (predicate && !DataType.isBool(predicate.outputField.type))
    throw new Error('Arrow query WHERE requires a Boolean expression');

  const names = new Set<string>();
  for (const selection of select ?? []) {
    const name =
      typeof selection === 'string'
        ? selection
        : (selection.as ?? ('column' in selection ? selection.column : undefined));
    if (name === undefined) continue;
    if (names.has(name) || (typeof selection !== 'string' && selection.as === ''))
      throw new Error(`Invalid or duplicate Arrow query output name: ${name}`);
    names.add(name);
  }
  const projection: Projection[] = select
    ? select.map((selection, ordinal) => {
        if (typeof selection !== 'string' && ('array' in selection || 'expression' in selection)) {
          let name = selection.as;
          if (name === undefined) {
            name = `expression_${ordinal + 1}`;
            while (names.has(name)) name += '_';
            names.add(name);
          }
          const expression =
            'array' in selection
              ? compileArrowArray(selection.array, {...options, type: selection.type})
              : prepare
                ? prepare(selection.expression, name)
                : compileArrowExpression(selection.expression, options);
          return {expression, field: expression.outputField.clone({name})};
        }
        const column = typeof selection === 'string' ? selection : selection.column;
        const index = inputSchema.fields.findIndex(field => field.name === column);
        if (index < 0) throw new Error(`Arrow query column not found: ${column}`);
        const field = inputSchema.fields[index]!;
        return {
          index,
          field: typeof selection === 'string' ? field : field.clone({name: selection.as ?? column})
        };
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
  let skip = offset;
  let remaining = limit ?? Infinity;
  /** Evaluates one batch using the remaining pagination budget. */
  function* execute(batch: RecordBatch, emitEmpty = false): Iterable<RecordBatch> {
    signal?.throwIfAborted();
    const metadata = getRecordBatchMetadata(batch);
    const mask = predicate?.evaluate(batch, {signal});
    let selected: RecordBatch | undefined;
    if (mask) {
      const indexes: number[] = [];
      for (let row = 0; row < batch.numRows && indexes.length < remaining; row++) {
        if ((row & 1023) === 0) signal?.throwIfAborted();
        if (mask.get(row) !== true) continue;
        if (skip > 0) skip--;
        else indexes.push(row);
      }
      selected = selectArrowBatchRows(batch, indexes, inputSchema);
    } else {
      const start = Math.min(skip, batch.numRows);
      skip -= start;
      const end = start + Math.min(batch.numRows - start, remaining);
      if (end > start)
        selected =
          start === 0 && end === batch.numRows
            ? batch
            : createRecordBatchWithMetadata(
                batch.schema,
                batch.data.slice(start, end - start),
                metadata
              );
    }
    if (!selected?.numRows) {
      if (emitEmpty) {
        const children = schema.fields.map(field =>
          DataType.isDenseUnion(field.type)
            ? nullVectorData(field.type, 0)
            : makeData({type: field.type, nullCount: 0})
        );
        yield makeQueryBatch(schema, children, 0, metadata);
      }
      return;
    }
    remaining -= selected.numRows;
    if (!select) {
      yield selected;
      return;
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
      yield makeQueryBatch(schema, children, end - start, metadata);
      start = end;
    }
  }
  return {schema, done: () => remaining === 0, execute};
}

/** Creates a batch while preserving its row count even for an empty projection. */
function makeQueryBatch(
  schema: Schema,
  children: Data[],
  length: number,
  metadata: Map<string, string> | undefined
): RecordBatch {
  const data = new Data(new Struct(schema.fields), 0, length, 0, undefined, children);
  return createRecordBatchWithMetadata(schema, data, metadata);
}
