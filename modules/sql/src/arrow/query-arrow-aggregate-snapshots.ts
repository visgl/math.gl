// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, Schema, Table, vectorFromArray, type RecordBatch} from 'apache-arrow';
import {compileArrowAggregates, type ArrowAggregate} from './aggregates';
import {queryArrowTableInBatches, type ArrowBatchQuery} from './query-arrow-table';
import {getArrowAggregateFields} from './relational-query';

/** Configuration for incremental aggregation with optional filtering and one group column. */
export type ArrowAggregateSnapshotOptions = Omit<ArrowBatchQuery, 'from' | 'select'> & {
  /** Names and definitions of the output aggregates. */
  aggregates: Readonly<Record<string, ArrowAggregate>>;
  /** Source column used as a group key. Omit it for scalar aggregates. */
  groupBy?: string;
  /** Emit after this many nonempty query batches. Defaults to one. */
  emitEveryBatches?: number;
};

/** A complete aggregate result at one point in the input stream. */
export type ArrowAggregateSnapshot = {
  /** Independent result table. */
  table: Table;
  /** Number of rows admitted to the accumulator. */
  rowsProcessed: number;
  /** Whether the input query is complete. */
  final: boolean;
};

/** Emits bounded-state aggregate snapshots, including a final snapshot for empty input. */
export async function* queryArrowAggregateSnapshots(
  input: AsyncIterable<RecordBatch> | Iterable<RecordBatch>,
  inputSchema: Schema,
  options: ArrowAggregateSnapshotOptions
): AsyncIterable<ArrowAggregateSnapshot> {
  const {aggregates, groupBy, emitEveryBatches = 1, ...query} = options;
  query.signal?.throwIfAborted();
  if (!Number.isSafeInteger(emitEveryBatches) || emitEveryBatches < 1) {
    throw new Error('emitEveryBatches must be a positive safe integer');
  }
  if (!Object.keys(aggregates).length) throw new Error('Expected at least one Arrow aggregate');
  const groupField =
    groupBy === undefined ? undefined : inputSchema.fields.find(field => field.name === groupBy);
  if (groupBy !== undefined && !groupField)
    throw new Error(`Unknown Arrow group column: ${groupBy}`);
  if (groupField && Object.prototype.hasOwnProperty.call(aggregates, groupField.name)) {
    throw new Error('Duplicate Arrow grouping output name');
  }

  const compileOptions = {inputSchema, functions: query.functions};
  const plan = compileArrowAggregates(aggregates, compileOptions);
  const grouped = groupField
    ? plan.createGroupedAccumulator({type: 'Identifier', name: groupField.name})
    : undefined;
  const scalar = grouped ? undefined : plan.createAccumulator();
  const aggregateFields = getArrowAggregateFields(aggregates, compileOptions);
  const outputGroupField =
    groupField && DataType.isDictionary(groupField.type)
      ? groupField.clone({type: groupField.type.dictionary})
      : groupField;
  const schema = new Schema(
    outputGroupField ? [outputGroupField, ...aggregateFields] : aggregateFields,
    inputSchema.metadata
  );
  let rowsProcessed = 0;
  let batchesSinceEmission = 0;

  /** Builds a snapshot from detached accumulator results. */
  function snapshot(final: boolean): ArrowAggregateSnapshot {
    const groups = grouped?.result();
    const rows = groups ? [...groups.values()] : [scalar!.result()];
    const columns = new Map(
      aggregateFields.map(field => [
        field.name,
        vectorFromArray(
          rows.map(row => row[field.name]),
          field.type
        )
      ])
    );
    if (outputGroupField && groups) {
      columns.set(
        outputGroupField.name,
        vectorFromArray([...groups.keys()], outputGroupField.type)
      );
    }
    return {
      table: new Table(
        schema,
        Object.fromEntries(schema.fields.map(field => [field.name, columns.get(field.name)!]))
      ),
      rowsProcessed,
      final
    };
  }

  for await (const batch of queryArrowTableInBatches(input, inputSchema, query)) {
    (grouped ?? scalar)!.update(batch, {signal: query.signal});
    rowsProcessed += batch.numRows;
    if (++batchesSinceEmission === emitEveryBatches) {
      yield snapshot(false);
      batchesSinceEmission = 0;
    }
  }
  query.signal?.throwIfAborted();
  yield snapshot(true);
}
