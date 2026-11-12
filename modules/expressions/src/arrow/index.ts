// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {compileArrowArray, compileArrowExpression, compileArrowFunction} from './compiler';
export {compileArrowPredicate} from './predicate';
export type {
  ArrowExpression,
  ArrowExpressionOptions,
  ArrowExpressionEvaluationOptions,
  ArrowExpressionValue,
  ArrowTableFunction,
  ArrowTableFunctionPrototype,
  ArrowTableFunctionType,
  CompiledArrowExpression
} from './types';

export {
  ExpressionEvaluationError,
  isExpressionEvaluationError,
  type ExpressionEvaluationErrorCode
} from '../expressions/index';

export {replaceArrowColumns} from './replace-arrow-columns';

export {
  compileArrowAggregates,
  type ArrowAggregate,
  type ArrowAggregateAccumulator,
  type CompiledArrowAggregates
} from './aggregates';
