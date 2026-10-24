# Accessor Compiler

![From-v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`parseExpressionString(expression: string): (row: Record<string, unknown>) => unknown`

Compiles a JSON-style accessor expression into a reusable function.

## Supported forms[​](#supported-forms "Direct link to Supported forms")

* `-` returns the input object unchanged.
* `a.b.c` resolves nested properties using dot-path access.
* General expressions like `value * 100` are parsed and evaluated against the input object.

## Restrictions[​](#restrictions "Direct link to Restrictions")

Function calls are rejected when using `parseExpressionString()`.

That restriction mirrors the original use inside `@deck.gl/json`, where accessor expressions are evaluated against plain data objects rather than executable environments.

Because of that restriction, function libraries such as `BASIC_MATH_FUNCTION_LIBRARY` and `GEOSPATIAL_FUNCTION_LIBRARY` are intended for `eval()`, `evalAsync()`, `compile()`, and `compileAsync()`, not for `parseExpressionString()`.
