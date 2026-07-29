// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type jsep from 'jsep';
import {eval as evaluate, parse} from './expression-eval';
import {get} from './get';

/**
 * An accessor compiled from a JSON-style expression string.
 *
 * @param row - Data object against which the expression is evaluated.
 * @returns The value produced by the expression.
 */
export type AccessorFunction = (row: Record<string, unknown>) => unknown;

const cachedExpressionMap: Record<string, AccessorFunction> = {
  '-': object => object
};

/**
 * Compiles a JSON-style expression string into an accessor function.
 *
 * @param propValue - Accessor expression to compile.
 * @returns A cached accessor function.
 * @throws If the expression is invalid or contains a function call.
 *
 * @remarks
 * `-` maps to the identity accessor and `a.b.c` maps to nested property
 * access. Function calls are rejected so accessors cannot execute functions
 * supplied by input data.
 */
export function parseExpressionString(propValue: string): AccessorFunction {
  if (propValue in cachedExpressionMap) {
    return cachedExpressionMap[propValue];
  }

  const ast = parse(propValue);
  const func =
    ast.type === 'Identifier'
      ? (row: Record<string, unknown>) => get(row, propValue)
      : compileAst(ast);

  cachedExpressionMap[propValue] = func;
  return func;
}

/** Validates and compiles a parsed accessor expression. */
function compileAst(ast: jsep.Expression): AccessorFunction {
  traverse(ast, node => {
    if (node.type === 'CallExpression') {
      throw new Error('Function calls not allowed in expression accessors');
    }
  });

  return (row: Record<string, unknown>) => evaluate(ast, row);
}

/** Visits each AST-like object in a parsed expression. */
// eslint-disable-next-line complexity
function traverse(node: unknown, visitor: (node: {type: string}) => void): void {
  if (Array.isArray(node)) {
    node.forEach(element => traverse(element, visitor));
    return;
  }

  if (node && typeof node === 'object') {
    if (isNodeLike(node)) {
      visitor(node);
    }
    for (const key in node) {
      traverse((node as Record<string, unknown>)[key], visitor);
    }
  }
}

/** Tests whether an object resembles a JSEP AST node. */
function isNodeLike(node: object): node is {type: string} {
  return 'type' in node && typeof (node as {type?: unknown}).type === 'string';
}
