# Overview

![From-v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The experimental expression parser and evaluator are available from `@math.gl/core`. Geospatial function libraries are exported from `@math.gl/geospatial`; DGGS function libraries are exported from `@math.gl/dggs`.

It extracts the expression machinery that has shipped inside `@deck.gl/json` and provides it as a core subpath. Its API remains experimental.

## Feature support[​](#feature-support "Direct link to Feature support")

Expression-language features for reusable data accessors and application-provided function libraries.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature                                          | math.gl support    | Notes                                                                                                                                                                                                                     |
| ------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expression parsing and evaluation                | ✅ Implemented     | [Parse and evaluate](https://visgl.github.io/math.gl/next/docs/modules/core/expressions/api-reference/expression-eval.md) JSEP expressions against an explicit context.                                      |
| Reusable compiled accessors                      | ✅ Implemented     | Synchronous and asynchronous compile/evaluate APIs reuse parsed expressions.                                                                                                                                              |
| Custom operators and function libraries          | ✅ Implemented     | Isolated [function registries](https://visgl.github.io/math.gl/next/docs/modules/core/expressions/api-reference/function-registry.md), custom operators, basic math, and optional geospatial/DGGS libraries. |
| Restricted property-access expressions           | ✅ Implemented     | [parseExpressionString](https://visgl.github.io/math.gl/next/docs/modules/core/expressions/api-reference/parse-expression-string.md) builds accessors with function calls disabled.                          |
| Full JavaScript programs and process isolation   | ❌ Not implemented | This is an expression evaluator, not a separate JavaScript runtime or security sandbox; registered functions run application code.                                                                                        |
| Reactive dependency tracking                     | ❌ Not implemented | No incremental dependency graph, automatic invalidation, or reactive recomputation engine.                                                                                                                                |
| Shader compilation and automatic differentiation | ❌ Not implemented | Compilation produces reusable JavaScript evaluators, without a GPU code generator or differentiation backend.                                                                                                             |

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/core
```

## Usage[​](#usage "Direct link to Usage")

Evaluate a parsed expression against a data object:

```
import {parse, evaluate} from '@math.gl/core';



const expression = parse('value * scale + 1');

const result = evaluate(expression, {value: 3, scale: 2});

// 7
```

Compile an expression once and reuse it:

```
import {compile} from '@math.gl/core';



const accessor = compile('points[1].value');

const result = accessor({points: [{value: 1}, {value: 4}]});

// 4
```

Supply function libraries through parser options:

```
import {

  BASIC_MATH_FUNCTION_LIBRARY,

  compile

} from '@math.gl/core';

import {GEOSPATIAL_FUNCTION_LIBRARY} from '@math.gl/geospatial';



const fn = compile('cartographicToCartesian([toRadians(longitude), toRadians(latitude), 0])', {

  libraries: [BASIC_MATH_FUNCTION_LIBRARY, GEOSPATIAL_FUNCTION_LIBRARY]

});



const cartesian = fn({longitude: 0, latitude: 0});

// [6378137, 0, 0]
```

Register functions once and share them across evaluators:

```
import {

  BASIC_MATH_FUNCTION_LIBRARY,

  ExpressionFunctionRegistry,

  compile

} from '@math.gl/core';



const registry = new ExpressionFunctionRegistry()

  .registerFunctions(BASIC_MATH_FUNCTION_LIBRARY)

  .registerFunction('double', (value) => value * 2);



const fn = compile('double(round(value))', {registry});

fn({value: 2.4});

// 4
```

Compile a JSON-style accessor expression that disallows function calls:

```
import {parseExpressionString} from '@math.gl/core';



const getFill = parseExpressionString('style.fill.color');

const fill = getFill({style: {fill: {color: '#08f'}}});

// '#08f'
```

## API Surface[​](#api-surface "Direct link to API Surface")

| Export                        | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `parse`                       | Parses an expression string into a JSEP AST.                            |
| `evaluate`                    | Evaluates a parsed AST against a context object.                        |
| `evaluateAsync`               | Async evaluator for expressions containing async function calls.        |
| `compile`                     | Compiles an expression string or AST into a reusable function.          |
| `compileAsync`                | Async variant of `compile`.                                             |
| `addUnaryOp`                  | Registers a custom unary operator with the parser and evaluator.        |
| `addBinaryOp`                 | Registers a custom binary operator with the parser and evaluator.       |
| `ExpressionFunctionRegistry`  | Registers isolated named functions for one or more evaluators.          |
| `BASIC_MATH_FUNCTION_LIBRARY` | Built-in scalar and vector-aware math helpers for expression contexts.  |
| `mergeFunctionLibraries`      | Merges one or more function libraries into an evaluation context.       |
| `parseExpressionString`       | Compiles a JSON-style accessor expression with function calls disabled. |

## Function Libraries[​](#function-libraries "Direct link to Function Libraries")

The WGS84 helper library is exported from `@math.gl/geospatial`; install `@math.gl/geospatial` to use it. DGGS libraries require `@math.gl/dggs`. The evaluator APIs accept a `libraries` option:

```
compile(expression, {libraries: [BASIC_MATH_FUNCTION_LIBRARY]});

evaluate(ast, row, {libraries: [GEOSPATIAL_FUNCTION_LIBRARY]});

evaluateAsync(ast, row, {libraries: [customLibrary]});
```

Libraries are merged left-to-right and then overlaid with the input context object, so row values win if a field name collides with a library export.

For applications that build function sets incrementally, use an [`ExpressionFunctionRegistry`](https://visgl.github.io/math.gl/next/docs/modules/core/expressions/api-reference/function-registry.md). The registry rejects accidental name collisions and can be shared by multiple compiled expressions without changing module-global state.

Optional [DGGS function tables](https://visgl.github.io/math.gl/next/docs/modules/core/expressions/api-reference/dggs-function-libraries.md) are available from `@math.gl/dggs`.

Try the APIs in the [expression playground](https://math.gl/examples/expressions).

## Attribution[​](#attribution "Direct link to Attribution")

This module is adapted from the expression parser that ships in [`@deck.gl/json`](https://www.npmjs.com/package/@deck.gl/json).

Its evaluator uses the vendored `jsep` 1.4.0 parser (MIT), with no external runtime dependency and derives from `expression-eval` by [Don McCurdy](https://github.com/donmccurdy). Source headers and distributed license notices retain the upstream attribution.

See [References and credits](https://visgl.github.io/math.gl/next/docs/references-and-credits.md) for the project-wide source inventory and acknowledgments.
