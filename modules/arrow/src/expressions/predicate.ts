// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  bindColumnarPredicateParameters,
  validateColumnarPredicate,
  type ColumnarPredicate,
  type ColumnarPredicateProperty,
  type ParameterizedColumnarPredicate,
  type ColumnarPredicateParameterValues,
  type Expression
} from '@math.gl/core/expressions';
import {compileArrowExpression} from './compiler';
import type {ArrowExpressionOptions, CompiledArrowExpression} from './types';

/** Compiles portable WHERE predicates with SQL three-valued Boolean results. */
export function compileArrowPredicate(
  predicate: ParameterizedColumnarPredicate,
  options: ArrowExpressionOptions & {parameters?: ColumnarPredicateParameterValues}
): CompiledArrowExpression {
  const bound = bindColumnarPredicateParameters(predicate, options.parameters ?? {});
  validateColumnarPredicate(bound, new Set(options.inputSchema.fields.map(field => field.name)));
  return compileArrowExpression(toExpression(bound), options);
}

/** Translates the portable predicate shape into the shared typed expression compiler. */
function toExpression(predicate: ColumnarPredicate): Expression {
  if (predicate.op === 'and' || predicate.op === 'or') {
    return predicate.args.map(toExpression).reduce(
      (left, right) =>
        ({
          type: 'BinaryExpression',
          operator: predicate.op === 'and' ? '&&' : '||',
          left,
          right
        }) as Expression
    );
  }
  if (predicate.op === 'not')
    return {
      type: 'UnaryExpression',
      operator: '!',
      prefix: true,
      argument: toExpression(predicate.args[0])
    } as Expression;
  const path = (predicate.args[0] as ColumnarPredicateProperty).property;
  if (Array.isArray(path) && path.length !== 1)
    throw new Error('Nested Arrow predicate paths are not supported yet');
  const left = {type: 'Identifier', name: typeof path === 'string' ? path : path[0]} as Expression;
  if (predicate.op === 'isNull')
    return {
      type: 'CallExpression',
      callee: {type: 'Identifier', name: 'isNull'},
      arguments: [left]
    } as Expression;
  if (predicate.op === 'in') {
    if (!predicate.args[1].length)
      return {type: 'Literal', value: false, raw: 'false'} as Expression;
    return predicate.args[1]
      .map(
        value =>
          ({
            type: 'BinaryExpression',
            operator: '==',
            left,
            right: {type: 'Literal', value}
          }) as Expression
      )
      .reduce(
        (a, b) => ({type: 'BinaryExpression', operator: '||', left: a, right: b}) as Expression
      );
  }
  return {
    type: 'BinaryExpression',
    operator: predicate.op === '=' ? '==' : predicate.op === '<>' ? '!=' : predicate.op,
    left,
    right: {type: 'Literal', value: predicate.args[1]}
  } as Expression;
}
