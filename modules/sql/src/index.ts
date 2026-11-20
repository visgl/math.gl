// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export * from './query';
export type {
  ArrowExpression,
  ArrowExpressionOptions,
  ArrowExpressionEvaluationOptions,
  ArrowExpressionValue,
  ArrowTableFunction,
  AggregateAccumulator,
  AggregateFunction,
  TableFunction,
  BoundTableFunction,
  BoundLateralTableFunction,
  LateralTableBinder,
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
