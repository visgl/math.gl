// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {
  ExpressionEvaluationOptions,
  ExpressionFunction,
  ExpressionFunctionLibrary,
} from "./function-libraries";
export type { Expression, ExpressionContext } from "./expression-eval";
export {
  addBinaryOp,
  addUnaryOp,
  compile,
  compileAsync,
  eval,
  evalAsync,
  parse,
} from "./expression-eval";
export {
  BASIC_MATH_FUNCTION_LIBRARY,
  GEOSPATIAL_FUNCTION_LIBRARY,
  mergeFunctionLibraries,
} from "./function-libraries";
export {
  parseExpressionString,
  type AccessorFunction,
} from "./parse-expression-string";
