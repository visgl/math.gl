// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {Expression} from './expression-eval';

// Includes the call and literal nodes around supported 4096-element arguments.
const MAXIMUM_EXPRESSION_NODES = 16384;

/** Structural limits apply to external ASTs as well as parser output. */
export type ExpressionASTOptions = Readonly<{maxNodes?: number; maxDepth?: number}>;

/** Validates the portable named-column AST subset without binding types or executing callbacks. */
export function validateExpressionAST(
  value: unknown,
  options: ExpressionASTOptions = {}
): asserts value is Expression {
  visitExpressionAST(value, () => {}, options);
}

/** Collects exact source-column names in first-reference order; function names are excluded. */
export function getExpressionColumns(
  expression: Expression,
  options: ExpressionASTOptions = {}
): string[] {
  const columns = new Set<string>();
  visitExpressionAST(
    expression,
    node => {
      if (node.type === 'Identifier') columns.add(node.name);
    },
    options
  );
  return [...columns];
}

/** Visits only the validated portable subset; backend capability/type checks remain separate. */
function visitExpressionAST(
  value: unknown,
  visit: (node: any) => void,
  options: ExpressionASTOptions
): void {
  const maxNodes = options.maxNodes ?? MAXIMUM_EXPRESSION_NODES,
    maxDepth = options.maxDepth ?? 64;
  if (
    !Number.isSafeInteger(maxNodes) ||
    maxNodes < 1 ||
    maxNodes > MAXIMUM_EXPRESSION_NODES ||
    !Number.isSafeInteger(maxDepth) ||
    maxDepth < 0 ||
    maxDepth > 64
  )
    throw new Error(
      `Expression AST limits must not exceed ${MAXIMUM_EXPRESSION_NODES} nodes and 64 levels`
    );
  const stack: {node: unknown; depth: number; exit?: boolean}[] = [{node: value, depth: 0}];
  const ancestors = new Set<object>();
  let count = 0;
  while (stack.length) {
    const {node: input, depth, exit} = stack.pop()!;
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new Error('Invalid expression AST node');
    if (exit) {
      ancestors.delete(input);
      continue;
    }
    if (++count > maxNodes || depth > maxDepth)
      throw new Error('Expression AST exceeds node or depth limit');
    if (ancestors.has(input)) throw new Error('Expression AST contains a cycle');
    ancestors.add(input);
    stack.push({node: input, depth, exit: true});
    const node = input as any;
    const children: unknown[] = [];
    switch (node.type) {
      case 'Identifier':
        if (typeof node.name !== 'string' || !node.name.length || node.name.length > 65536)
          throw new Error('Invalid expression identifier');
        break;
      case 'Literal':
        if (
          node.value !== null &&
          !['number', 'bigint', 'boolean', 'string'].includes(typeof node.value)
        )
          throw new Error('Unsupported expression literal');
        if (node.raw !== undefined && typeof node.raw !== 'string')
          throw new Error('Invalid literal annotation');
        break;
      case 'UnaryExpression':
        if (typeof node.operator !== 'string' || !node.operator.length || node.operator.length > 32)
          throw new Error('Invalid expression operator');
        if (node.prefix !== undefined && typeof node.prefix !== 'boolean')
          throw new Error('Invalid unary annotation');
        children.push(node.argument);
        break;
      case 'LogicalExpression':
        if (node.operator !== '&&' && node.operator !== '||')
          throw new Error('Invalid logical operator');
        children.push(node.left, node.right);
        break;
      case 'BinaryExpression':
        if (typeof node.operator !== 'string' || !node.operator.length || node.operator.length > 32)
          throw new Error('Invalid expression operator');
        children.push(node.left, node.right);
        break;
      case 'ConditionalExpression':
        children.push(node.test, node.consequent, node.alternate);
        break;
      case 'ArrayExpression':
        if (!Array.isArray(node.elements)) throw new Error('Invalid expression array');
        if (node.elements.length + count > maxNodes)
          throw new Error('Expression AST exceeds node limit');
        for (const element of node.elements) {
          if (element == null) throw new Error('Expression array contains holes');
          children.push(element);
        }
        break;
      case 'CallExpression':
        if (
          node.callee?.type !== 'Identifier' ||
          typeof node.callee.name !== 'string' ||
          !node.callee.name.length ||
          node.callee.name.length > 65536 ||
          !Array.isArray(node.arguments) ||
          (node.sqlFunction !== undefined && node.sqlFunction !== true)
        )
          throw new Error('Expressions require named function calls');
        // Callees are function names, never column references.
        if (node.arguments.length + count > maxNodes)
          throw new Error('Expression AST exceeds node limit');
        children.push(...node.arguments);
        break;
      default:
        throw new Error(`Unsupported portable expression AST node: ${node.type}`);
    }
    if (children.length + count + stack.length - ancestors.size > maxNodes)
      throw new Error('Expression AST exceeds node limit');
    visit(node);
    for (let index = children.length - 1; index >= 0; index--)
      stack.push({node: children[index], depth: depth + 1});
  }
}
