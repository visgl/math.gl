// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Sources:
 * - Copyright (c) 2013 Stephen Oney, http://jsep.from.so/, MIT License
 * - Copyright (c) 2023 Don McCurdy, https://github.com/donmccurdy/expression-eval, MIT License
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/restrict-plus-operands */

import jsep from 'jsep';
import {mergeFunctionLibraries, type ExpressionEvaluationOptions} from './function-libraries';

/**
 * Named values and functions available while evaluating an expression.
 */
export type ExpressionContext = Record<string, unknown>;

/**
 * A JSEP abstract syntax tree node supported by the evaluator.
 */
export type Expression =
  | jsep.ArrayExpression
  | jsep.BinaryExpression
  | jsep.CallExpression
  | jsep.ConditionalExpression
  | jsep.Identifier
  | jsep.Literal
  | jsep.MemberExpression
  | jsep.ThisExpression
  | jsep.UnaryExpression;

/**
 * Evaluator implementation for a custom unary operator.
 *
 * @param operand - Value produced by the operator's operand expression.
 * @returns The operator result.
 */
export type UnaryOperator = (operand: any) => any;

/**
 * Evaluator implementation for a custom binary operator.
 *
 * @param left - Value produced by the left operand expression.
 * @param right - Value produced by the right operand expression.
 * @returns The operator result.
 */
export type BinaryOperator = (left: any, right: any) => any;

type Callable = (...args: any[]) => any;

const DEFAULT_PRECEDENCE: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '|': 3,
  '^': 4,
  '&': 5,
  '==': 6,
  '!=': 6,
  '===': 6,
  '!==': 6,
  '<': 7,
  '>': 7,
  '<=': 7,
  '>=': 7,
  '<<': 8,
  '>>': 8,
  '>>>': 8,
  '+': 9,
  '-': 9,
  '*': 10,
  '/': 10,
  '%': 10
};

const binops: Record<string, (...args: any[]) => any> = {
  '||': (a: unknown, b: unknown) => a || b,
  '&&': (a: unknown, b: unknown) => a && b,
  '|': (a: number, b: number) => a | b,
  '^': (a: number, b: number) => a ^ b,
  '&': (a: number, b: number) => a & b,
  '==': (a: unknown, b: unknown) => {
    // biome-ignore lint/suspicious/noDoubleEquals: this operator implements JavaScript loose equality.
    return a == b;
  },
  '!=': (a: unknown, b: unknown) => {
    // biome-ignore lint/suspicious/noDoubleEquals: this operator implements JavaScript loose inequality.
    return a != b;
  },
  '===': (a: unknown, b: unknown) => a === b,
  '!==': (a: unknown, b: unknown) => a !== b,
  '<': (a: number | string, b: number | string) => a < b,
  '>': (a: number | string, b: number | string) => a > b,
  '<=': (a: number | string, b: number | string) => a <= b,
  '>=': (a: number | string, b: number | string) => a >= b,
  '<<': (a: number, b: number) => a << b,
  '>>': (a: number, b: number) => a >> b,
  '>>>': (a: number, b: number) => a >>> b,
  '+': (a: unknown, b: unknown) => {
    // @ts-expect-error Addition intentionally supports JS coercion semantics.
    return a + b;
  },
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b,
  '%': (a: number, b: number) => a % b
};

const unops: Record<string, (...args: any[]) => any> = {
  '-': (a: number) => -a,
  '+': (a: unknown) => {
    // eslint-disable-next-line no-implicit-coercion
    return +a;
  },
  '~': (a: number) => ~a,
  '!': (a: unknown) => !a
};

function evaluateArray(list: jsep.Expression[], context: ExpressionContext): unknown[] {
  return list.map(value => evaluate(value, context));
}

/** Evaluates each expression in an array concurrently. */
async function evaluateArrayAsync(
  list: jsep.Expression[],
  context: ExpressionContext
): Promise<unknown[]> {
  return await Promise.all(list.map(value => evalAsync(value, context)));
}

/** Resolves a member expression and preserves its receiver for method calls. */
function evaluateMember(
  node: jsep.MemberExpression,
  context: ExpressionContext
): [Record<string, unknown>, unknown] {
  const object = evaluate(node.object, context) as Record<string, unknown>;
  const key = node.computed
    ? (evaluate(node.property, context) as string)
    : (node.property as jsep.Identifier).name;

  if (/^__proto__|prototype|constructor$/.test(key)) {
    throw new Error(`Access to member "${key}" disallowed.`);
  }

  return [object, object?.[key]];
}

/** Asynchronously resolves a member expression and its receiver. */
async function evaluateMemberAsync(
  node: jsep.MemberExpression,
  context: ExpressionContext
): Promise<[Record<string, unknown>, unknown]> {
  const object = (await evalAsync(node.object, context)) as Record<string, unknown>;
  const key = node.computed
    ? ((await evalAsync(node.property, context)) as string)
    : (node.property as jsep.Identifier).name;

  if (/^__proto__|prototype|constructor$/.test(key)) {
    throw new Error(`Access to member "${key}" disallowed.`);
  }

  return [object, object?.[key]];
}

/** Evaluates one expression node synchronously. */
// eslint-disable-next-line complexity
function evaluateExpression(
  node: jsep.Expression,
  context: ExpressionContext,
  options?: ExpressionEvaluationOptions
): unknown {
  const expression = node as Expression;
  const mergedContext = mergeFunctionLibraries(context, options);

  switch (expression.type) {
    case 'ArrayExpression':
      return evaluateArray(expression.elements, mergedContext);

    case 'BinaryExpression':
      if (expression.operator === '||') {
        return (
          evaluate(expression.left, mergedContext) || evaluate(expression.right, mergedContext)
        );
      }
      if (expression.operator === '&&') {
        return (
          evaluate(expression.left, mergedContext) && evaluate(expression.right, mergedContext)
        );
      }
      return binops[expression.operator](
        evaluate(expression.left, mergedContext),
        evaluate(expression.right, mergedContext)
      );

    case 'CallExpression': {
      let caller: Record<string, unknown> | undefined;
      let fn: Callable | undefined;

      if (expression.callee.type === 'MemberExpression') {
        const member = evaluateMember(expression.callee as jsep.MemberExpression, mergedContext);
        caller = member[0];
        fn = member[1] as Callable | undefined;
      } else {
        fn = evaluate(expression.callee, mergedContext) as Callable | undefined;
      }

      if (typeof fn !== 'function') {
        return undefined;
      }

      return fn.apply(caller, evaluateArray(expression.arguments, mergedContext));
    }

    case 'ConditionalExpression':
      return evaluate(expression.test, mergedContext)
        ? evaluate(expression.consequent, mergedContext)
        : evaluate(expression.alternate, mergedContext);

    case 'Identifier':
      return mergedContext[expression.name];

    case 'Literal':
      return expression.value;

    case 'MemberExpression':
      return evaluateMember(expression, mergedContext)[1];

    case 'ThisExpression':
      return mergedContext;

    case 'UnaryExpression':
      return unops[expression.operator](evaluate(expression.argument, mergedContext));

    default:
      return undefined;
  }
}

/** Evaluates a nested expression using an already-merged context. */
function evaluate(node: jsep.Expression, context: ExpressionContext): unknown {
  return evaluateExpression(node, context);
}

/**
 * Evaluates a parsed expression asynchronously.
 *
 * @param node - Expression AST to evaluate.
 * @param context - Named values and functions available to the expression.
 * @param options - Function libraries to add to the context.
 * @returns The resolved expression value.
 *
 * @remarks
 * Function calls are awaited, including calls nested inside arrays, member
 * expressions, conditionals, unary expressions, and binary expressions.
 */
// eslint-disable-next-line complexity
export async function evalAsync(
  node: jsep.Expression,
  context: ExpressionContext,
  options?: ExpressionEvaluationOptions
): Promise<unknown> {
  const expression = node as Expression;
  const mergedContext = mergeFunctionLibraries(context, options);

  switch (expression.type) {
    case 'ArrayExpression':
      return await evaluateArrayAsync(expression.elements, mergedContext);

    case 'BinaryExpression':
      if (expression.operator === '||') {
        return (
          (await evalAsync(expression.left, mergedContext)) ||
          (await evalAsync(expression.right, mergedContext))
        );
      }
      if (expression.operator === '&&') {
        return (
          (await evalAsync(expression.left, mergedContext)) &&
          (await evalAsync(expression.right, mergedContext))
        );
      }
      return binops[expression.operator](
        await evalAsync(expression.left, mergedContext),
        await evalAsync(expression.right, mergedContext)
      );

    case 'CallExpression': {
      let caller: Record<string, unknown> | undefined;
      let fn: Callable | undefined;

      if (expression.callee.type === 'MemberExpression') {
        const member = await evaluateMemberAsync(
          expression.callee as jsep.MemberExpression,
          mergedContext
        );
        caller = member[0];
        fn = member[1] as Callable | undefined;
      } else {
        fn = (await evalAsync(expression.callee, mergedContext)) as Callable | undefined;
      }

      if (typeof fn !== 'function') {
        return undefined;
      }

      return await fn.apply(caller, await evaluateArrayAsync(expression.arguments, mergedContext));
    }

    case 'ConditionalExpression':
      return (await evalAsync(expression.test, mergedContext))
        ? await evalAsync(expression.consequent, mergedContext)
        : await evalAsync(expression.alternate, mergedContext);

    case 'Identifier':
      return mergedContext[expression.name];

    case 'Literal':
      return expression.value;

    case 'MemberExpression':
      return (await evaluateMemberAsync(expression, mergedContext))[1];

    case 'ThisExpression':
      return mergedContext;

    case 'UnaryExpression':
      return unops[expression.operator](await evalAsync(expression.argument, mergedContext));

    default:
      return undefined;
  }
}

/**
 * Compiles an expression into a reusable synchronous evaluator.
 *
 * @param expression - Expression source or a previously parsed AST.
 * @param options - Function libraries to add to each evaluation context.
 * @returns A function that evaluates the expression against a context.
 */
export function compile(
  expression: string | jsep.Expression,
  options?: ExpressionEvaluationOptions
): (context: ExpressionContext) => unknown {
  const ast = parse(expression);
  return (context: ExpressionContext) => evaluateExpression(ast, context, options);
}

/**
 * Compiles an expression into a reusable asynchronous evaluator.
 *
 * @param expression - Expression source or a previously parsed AST.
 * @param options - Function libraries to add to each evaluation context.
 * @returns A function that asynchronously evaluates the expression.
 */
export function compileAsync(
  expression: string | jsep.Expression,
  options?: ExpressionEvaluationOptions
): (context: ExpressionContext) => Promise<unknown> {
  const ast = parse(expression);
  return (context: ExpressionContext) => evalAsync(ast, context, options);
}

/**
 * Registers a custom unary operator with the parser and evaluator.
 *
 * @param operator - Operator token to register.
 * @param fn - Evaluator implementation for the operator.
 *
 * @remarks
 * Registration changes module-global parser state and affects subsequent
 * calls to {@link parse}.
 */
export function addUnaryOp(operator: string, fn: UnaryOperator): void {
  jsep.addUnaryOp(operator);
  unops[operator] = fn;
}

/**
 * Registers a custom binary operator with the parser and evaluator.
 *
 * @param operator - Operator token to register.
 * @param precedenceOrFn - Parser precedence, or the evaluator implementation
 * when using the default precedence for a built-in operator.
 * @param fn - Evaluator implementation when an explicit precedence is given.
 *
 * @remarks
 * Registration changes module-global parser state and affects subsequent
 * calls to {@link parse}. New operators should provide explicit precedence.
 */
export function addBinaryOp(
  operator: string,
  precedenceOrFn: number | BinaryOperator,
  fn?: BinaryOperator
): void {
  if (fn) {
    jsep.addBinaryOp(operator, precedenceOrFn as number);
    binops[operator] = fn;
    return;
  }

  jsep.addBinaryOp(operator, DEFAULT_PRECEDENCE[operator] || 1);
  binops[operator] = precedenceOrFn as BinaryOperator;
}

/**
 * Parses expression source into a JSEP abstract syntax tree.
 *
 * @param expression - Expression source or an existing AST.
 * @returns A parsed AST, or the supplied AST unchanged.
 * @throws If the expression string is not valid JSEP syntax.
 */
export function parse(expression: string | jsep.Expression): jsep.Expression {
  return typeof expression === 'string' ? jsep(expression) : expression;
}

/**
 * Evaluates a parsed expression synchronously.
 *
 * @param node - Expression AST to evaluate.
 * @param context - Named values and functions available to the expression.
 * @param options - Function libraries to add to the context.
 * @returns The expression value.
 */
export {evaluateExpression as eval};
