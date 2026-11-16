// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {queryArrowSQL} from './arrow/query-arrow-sql';
export {
  queryArrowTable,
  queryArrowTableInBatches,
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
export type {
  ArrowExpression,
  ArrowExpressionOptions,
  ArrowExpressionEvaluationOptions,
  ArrowExpressionValue,
  ArrowTableFunction,
  ArrowTableFunctionPrototype,
  ArrowTableFunctionType
} from './arrow/types';
export {
  ExpressionEvaluationError,
  isExpressionEvaluationError,
  type ExpressionEvaluationErrorCode
} from './expressions/evaluation-error';
