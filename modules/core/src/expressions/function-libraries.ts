// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */

import {
  clamp,
  degrees,
  lerp,
  normalizeAngle,
  radians,
  safeMod,
  toDegrees,
  toRadians
} from '../lib/common';
import type {ExpressionFunctionRegistry} from './function-registry';

/**
 * A function that can be exposed to evaluated expressions.
 *
 * @param args - Arguments supplied by a call expression.
 * @returns The value made available to the expression.
 */
export type ExpressionFunction = (...args: any[]) => any;

/**
 * A named collection of functions that can be supplied to an expression
 * evaluator through {@link ExpressionEvaluationOptions}.
 */
export type ExpressionFunctionLibrary = Record<string, ExpressionFunction>;

/**
 * Options shared by the synchronous and asynchronous expression evaluators.
 */
export type ExpressionEvaluationOptions = {
  /**
   * Instance-scoped registry of named functions available to the expression.
   */
  registry?: ExpressionFunctionRegistry;

  /**
   * Function libraries to add to the evaluation context.
   *
   * Libraries are merged from left to right. Functions in later libraries
   * replace functions with the same name in earlier libraries. Values in the
   * expression context replace functions with the same name in any library.
   */
  libraries?: ExpressionFunctionLibrary[];
};

/**
 * General-purpose mathematical functions for expression evaluation.
 *
 * Includes JavaScript `Math` functions and math.gl helpers such as `clamp`,
 * `lerp`, `normalizeAngle`, `safeMod`, `toDegrees`, and `toRadians`.
 *
 * @example
 * ```ts
 * const evaluate = compile("clamp(sin(angle), 0, 1)", {
 *   libraries: [BASIC_MATH_FUNCTION_LIBRARY]
 * });
 * evaluate({angle: Math.PI / 2});
 * ```
 */
export const BASIC_MATH_FUNCTION_LIBRARY: ExpressionFunctionLibrary = {
  abs: Math.abs,
  acos: Math.acos,
  asin: Math.asin,
  atan: Math.atan,
  ceil: Math.ceil,
  clamp,
  cos: Math.cos,
  degrees,
  exp: Math.exp,
  floor: Math.floor,
  lerp,
  log: Math.log,
  max: Math.max,
  min: Math.min,
  normalizeAngle,
  pow: Math.pow,
  radians,
  round: Math.round,
  safeMod,
  sign: Math.sign,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
  toDegrees,
  toRadians,
  trunc: Math.trunc
};

/**
/**
 * Adds configured function libraries to an expression context.
 *
 * @param context - Values available to the expression.
 * @param options - Function libraries to merge into the context.
 * @returns The original context when no libraries are supplied, or a new
 * context containing the libraries and context values.
 *
 * @remarks
 * Libraries are merged from left to right, then overlaid with `context`.
 * Registry functions have the lowest precedence. The input objects are not modified.
 */
export function mergeFunctionLibraries(
  context: Record<string, unknown>,
  options?: ExpressionEvaluationOptions
): Record<string, unknown> {
  if (!options?.libraries?.length) {
    if (!options?.registry) {
      return context;
    }
  }

  return Object.assign(
    {},
    options.registry?.getFunctionTable(),
    ...(options.libraries || []),
    context
  );
}
