// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type {
  ExpressionEvaluationOptions,
  ExpressionFunction,
  ExpressionFunctionLibrary
} from './function-libraries';
export {ExpressionFunctionRegistry, type FunctionRegistrationOptions} from './function-registry';
export type {BinaryOperator, Expression, ExpressionContext, UnaryOperator} from './expression-eval';
export {
  addBinaryOp,
  addUnaryOp,
  compile,
  compileAsync,
  evaluate,
  evaluateAsync,
  parse
} from './expression-eval';
export {BASIC_MATH_FUNCTION_LIBRARY, mergeFunctionLibraries} from './function-libraries';
export {parseExpressionString, type AccessorFunction} from './parse-expression-string';

export * from './columnar-predicate';

export {isColumnarScalarType, COLUMNAR_SCALAR_TYPES, type ColumnarScalarType} from './scalar-type';

export {validateExpressionAST, getExpressionColumns, type ExpressionASTOptions} from './ast';
export {columnarPredicateToExpression} from './predicate-expression';
export {
  ExpressionEvaluationError,
  isExpressionEvaluationError,
  type ExpressionEvaluationErrorCode
} from './evaluation-error';
export {
  NUMERIC_FUNCTION_DEFINITIONS,
  type NumericFunctionDefinition,
  type NumericFunctionPrototype,
  type ExpressionNumericType
} from './numeric-functions';
