// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  columnarPredicateToExpression,
  type ParameterizedColumnarPredicate,
  type ColumnarPredicateParameterValues
} from '../expressions/index';
import {compileArrowExpression} from './compiler';
import type {ArrowExpressionOptions, CompiledArrowExpression} from './types';

/** Compiles portable WHERE predicates with SQL three-valued Boolean results. */
export function compileArrowPredicate(
  predicate: ParameterizedColumnarPredicate,
  options: ArrowExpressionOptions & {parameters?: ColumnarPredicateParameterValues}
): CompiledArrowExpression {
  return compileArrowExpression(columnarPredicateToExpression(predicate, options), options);
}
