// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  queryArrowSQL,
  queryArrowSQLWithMetadata,
  type ArrowSQLQueryOptions,
  type ArrowSQLTableFunction,
  type ArrowSQLMetadataResult
} from './arrow/query-arrow-sql';
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
  ArrowFunctionPackage,
  ScalarFunction,
  PreparedScalarFunction,
  ArrowTableFunctionPrototype,
  ArrowTableFunctionType
} from './arrow/types';
export {
  ExpressionEvaluationError,
  isExpressionEvaluationError,
  type ExpressionEvaluationErrorCode
} from './expressions/evaluation-error';

export type {
  SQLParameterValue,
  SQLParameters,
  SQLParameterOptions,
  SQLNumericArray,
  SQLBinaryParameter
} from './parser/sql-parameters';
export {
  prepareSQLParameters,
  areSQLParametersEqual,
  getSQLParameterNames,
  type SQLParameterSnapshot
} from './parser/parameter-snapshots';
