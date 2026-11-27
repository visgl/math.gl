// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  queryArrowSQL,
  queryArrowSQLWithMetadata,
  type ArrowSQLTableFunction,
  type ArrowSQLQueryOptions,
  type ArrowSQLMetadataResult
} from './arrow/query-arrow-sql';
export {
  queryArrowTable,
  queryArrowTableInBatches,
  prepareArrowProjection,
  type PreparedArrowProjection,
  type ArrowBatchQuery,
  type ArrowStreamingQuery,
  type ArrowTableQuery
} from './arrow/query-arrow-table';
export type {ArrowQueryJoin, ArrowQueryOrder} from './arrow/relational-query';
export {
  queryArrowAggregateSnapshots,
  type ArrowAggregateSnapshot,
  type ArrowAggregateSnapshotOptions
} from './arrow/query-arrow-aggregate-snapshots';
export {
  compileArrowAggregates,
  type ArrowAggregate,
  type ArrowAggregateAccumulator,
  type ArrowGroupedAggregateAccumulator,
  type CompiledArrowAggregates
} from './arrow/aggregates';
export {replaceArrowColumns} from './arrow/replace-arrow-columns';
export {UNNEST} from './arrow/sql-table-function-packages';
