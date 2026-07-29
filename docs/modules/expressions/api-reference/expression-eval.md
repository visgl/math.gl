# Expression Evaluator

The core evaluator API is useful when you want direct control over parsing, AST reuse, or custom operator registration.

## `parse(expression: string | Expression): Expression`

Parses a string into a JSEP AST. Passing an AST returns it unchanged.

## `eval(expression: Expression, context: ExpressionContext, options?: ExpressionEvaluationOptions): unknown`

Evaluates a parsed expression against the supplied context object.

## `evalAsync(expression: Expression, context: ExpressionContext, options?: ExpressionEvaluationOptions): Promise<unknown>`

Async variant of `eval`. Useful when expressions may call async functions present on the context object.

## `compile(expression: string | Expression, options?: ExpressionEvaluationOptions): (context: ExpressionContext) => unknown`

Compiles an expression into a reusable function.

## `compileAsync(expression: string | Expression, options?: ExpressionEvaluationOptions): (context: ExpressionContext) => Promise<unknown>`

Async variant of `compile`.

## `addUnaryOp(operator: string, callback): void`

Registers a unary operator with both JSEP and the evaluator.

## `addBinaryOp(operator: string, precedenceOrCallback, callback?): void`

Registers a binary operator with both JSEP and the evaluator.

If `callback` is omitted, the second argument is treated as the evaluator implementation and the parser uses the default precedence map bundled with the module.

## Function Libraries

`ExpressionEvaluationOptions` currently supports:

- `libraries?: ExpressionFunctionLibrary[]`

The module ships with:

- `BASIC_MATH_FUNCTION_LIBRARY`
- `GEOSPATIAL_FUNCTION_LIBRARY`
- `mergeFunctionLibraries(context, options)`
