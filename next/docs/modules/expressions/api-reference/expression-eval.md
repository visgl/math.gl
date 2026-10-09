# Expression Evaluator

![From-v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The core evaluator API is useful when you want direct control over parsing, AST reuse, or custom operator registration.

## `parse(expression: string | Expression): Expression`[​](#parseexpression-string--expression-expression "Direct link to parseexpression-string--expression-expression")

Parses a string into a JSEP AST. Passing an AST returns it unchanged.

## `eval(expression: Expression, context: ExpressionContext, options?: ExpressionEvaluationOptions): unknown`[​](#evalexpression-expression-context-expressioncontext-options-expressionevaluationoptions-unknown "Direct link to evalexpression-expression-context-expressioncontext-options-expressionevaluationoptions-unknown")

Evaluates a parsed expression against the supplied context object.

## `evalAsync(expression: Expression, context: ExpressionContext, options?: ExpressionEvaluationOptions): Promise<unknown>`[​](#evalasyncexpression-expression-context-expressioncontext-options-expressionevaluationoptions-promiseunknown "Direct link to evalasyncexpression-expression-context-expressioncontext-options-expressionevaluationoptions-promiseunknown")

Async variant of `eval`. Useful when expressions may call async functions present on the context object.

## `compile(expression: string | Expression, options?: ExpressionEvaluationOptions): (context: ExpressionContext) => unknown`[​](#compileexpression-string--expression-options-expressionevaluationoptions-context-expressioncontext--unknown "Direct link to compileexpression-string--expression-options-expressionevaluationoptions-context-expressioncontext--unknown")

Compiles an expression into a reusable function.

## `compileAsync(expression: string | Expression, options?: ExpressionEvaluationOptions): (context: ExpressionContext) => Promise<unknown>`[​](#compileasyncexpression-string--expression-options-expressionevaluationoptions-context-expressioncontext--promiseunknown "Direct link to compileasyncexpression-string--expression-options-expressionevaluationoptions-context-expressioncontext--promiseunknown")

Async variant of `compile`.

## `addUnaryOp(operator: string, callback: UnaryOperator): void`[​](#addunaryopoperator-string-callback-unaryoperator-void "Direct link to addunaryopoperator-string-callback-unaryoperator-void")

Registers a unary operator with both JSEP and the evaluator.

`UnaryOperator` receives the evaluated operand and returns the operator result.

## `addBinaryOp(operator: string, precedenceOrCallback: number | BinaryOperator, callback?: BinaryOperator): void`[​](#addbinaryopoperator-string-precedenceorcallback-number--binaryoperator-callback-binaryoperator-void "Direct link to addbinaryopoperator-string-precedenceorcallback-number--binaryoperator-callback-binaryoperator-void")

Registers a binary operator with both JSEP and the evaluator.

If `callback` is omitted, the second argument is treated as the evaluator implementation and the parser uses the default precedence map bundled with the module.

`BinaryOperator` receives the evaluated left and right operands and returns the operator result. Supply an explicit precedence when registering a new operator.

## Function Libraries[​](#function-libraries "Direct link to Function Libraries")

`ExpressionEvaluationOptions` currently supports:

* `registry?: ExpressionFunctionRegistry`
* `libraries?: ExpressionFunctionLibrary[]`

Each library is a `Record<string, ExpressionFunction>`. Registry functions have the lowest precedence. Libraries are then merged left-to-right. A later library replaces same-named functions in an earlier library, and values supplied in the evaluation context take final precedence.

```
import {

  BASIC_MATH_FUNCTION_LIBRARY,

  compile,

  type ExpressionFunctionLibrary

} from '@math.gl/expressions';



const statistics: ExpressionFunctionLibrary = {

  mean: (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

};



const evaluate = compile('round(mean(a, b, c))', {

  libraries: [BASIC_MATH_FUNCTION_LIBRARY, statistics]

});



evaluate({a: 1, b: 2, c: 4}); // 2
```

The module provides these importable libraries:

* `BASIC_MATH_FUNCTION_LIBRARY` provides common `Math` functions and math.gl helpers including `clamp`, `lerp`, angle conversion, normalization, and safe modulo.
* `GEOSPATIAL_FUNCTION_LIBRARY` provides WGS84 coordinate conversion, surface projection, local frame, and ellipsoid helpers.

Use `mergeFunctionLibraries(context, options)` when integrating libraries with a custom evaluation workflow. It does not mutate the supplied context or libraries.
