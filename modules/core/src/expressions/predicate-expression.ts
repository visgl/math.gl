// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {Expression} from './expression-eval';
import {validateExpressionAST} from './ast';
import {
  bindColumnarPredicateParameters,
  getColumnarPredicateColumns,
  validateColumnarPredicate,
  type ColumnarPredicate,
  type ColumnarPredicateProperty,
  type ParameterizedColumnarPredicate,
  type ColumnarPredicateParameterValues
} from './columnar-predicate';

/** Normalizes bound or parameterized top-level predicates to the shared expression AST. */
export function columnarPredicateToExpression(
  predicate: ParameterizedColumnarPredicate,
  options: {parameters?: ColumnarPredicateParameterValues} = {}
): Expression {
  // Bound the input before the recursive predicate utilities inspect it.
  const stack: {node: any; depth: number}[] = [{node: predicate, depth: 0}];
  let count = 0;
  let membershipValues = 0;
  while (stack.length) {
    const {node, depth} = stack.pop()!;
    if (++count > 4096 || depth > 64) throw new Error('Predicate exceeds node or depth limit');
    if (
      !node ||
      typeof node !== 'object' ||
      !Array.isArray(node.args) ||
      !['and', 'or', 'not', 'isNull', 'in', '=', '<>', '<', '<=', '>', '>='].includes(node.op)
    )
      throw new Error('Invalid columnar predicate');
    if (node.op === 'and' || node.op === 'or' || node.op === 'not') {
      if (node.op === 'not' && node.args.length !== 1)
        throw new Error('NOT requires one predicate');
      if (node.args.length + count + stack.length > 4096)
        throw new Error('Predicate exceeds node limit');
      for (const child of node.args) stack.push({node: child, depth: depth + 1});
    } else if (
      node.args.length !== (node.op === 'isNull' ? 1 : 2) ||
      !node.args[0] ||
      typeof node.args[0] !== 'object' ||
      (node.op === 'in' && !Array.isArray(node.args[1]))
    )
      throw new Error('Invalid predicate arguments');
    if (node.op === 'in') {
      membershipValues += node.args[1].length;
      if (membershipValues > 4096) throw new Error('Predicate membership exceeds node limit');
    }
  }
  const bound = bindColumnarPredicateParameters(predicate, options.parameters ?? {});
  validateColumnarPredicate(bound, new Set(getColumnarPredicateColumns(bound)));
  const expression = convert(bound);
  validateExpressionAST(expression);
  return expression;
}
function combine(operator: string, expressions: Expression[]): Expression {
  // A balanced tree retains bounded depth for long IN lists and logical groups.
  if (expressions.length === 1) return expressions[0]!;
  const midpoint = Math.floor(expressions.length / 2);
  return {
    type: 'BinaryExpression',
    operator,
    left: combine(operator, expressions.slice(0, midpoint)),
    right: combine(operator, expressions.slice(midpoint))
  } as Expression;
}
function convert(predicate: ColumnarPredicate): Expression {
  if (predicate.op === 'and' || predicate.op === 'or')
    return combine(predicate.op === 'and' ? '&&' : '||', predicate.args.map(convert));
  if (predicate.op === 'not')
    return {
      type: 'UnaryExpression',
      operator: '!',
      prefix: true,
      argument: convert(predicate.args[0])
    } as Expression;
  const property = predicate.args[0] as ColumnarPredicateProperty;
  const path = typeof property.property === 'string' ? [property.property] : property.property;
  if (path.length !== 1) throw new Error('Expression normalization requires top-level columns');
  let left = {type: 'Identifier', name: path[0]} as Expression;
  const call = (name: string, args: Expression[]) =>
    ({type: 'CallExpression', callee: {type: 'Identifier', name}, arguments: args}) as Expression;
  for (const type of property.casts ?? [])
    left = call('cast', [
      left,
      {type: 'Literal', value: type, raw: JSON.stringify(type)} as Expression
    ]);
  const literal = (value: unknown): Expression => {
    if (value instanceof Date || value instanceof Uint8Array)
      throw new Error('Date and binary predicate literals require explicit backend conversion');
    if (
      property.casts?.[property.casts.length - 1] === 'int64' &&
      typeof value === 'number' &&
      Number.isSafeInteger(value)
    )
      value = BigInt(value);
    return {
      type: 'Literal',
      value,
      raw: typeof value === 'bigint' ? String(value) : JSON.stringify(value)
    } as Expression;
  };
  if (predicate.op === 'isNull') return call('isNull', [left]);
  if (predicate.op === 'in') return call('in', [left, ...predicate.args[1].map(literal)]);
  return {
    type: 'BinaryExpression',
    operator: predicate.op === '=' ? '==' : predicate.op === '<>' ? '!=' : predicate.op,
    left,
    right: literal(predicate.args[1])
  } as Expression;
}
