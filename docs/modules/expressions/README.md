# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From-v4.2" />
</p>

The `@math.gl/expressions` module provides a compact expression parser and evaluator for JavaScript-style expressions.

It extracts the expression machinery that has shipped inside `@deck.gl/json` and promotes it to a standalone, documented math.gl module with a stable public API.

## Installation

```bash
npm install @math.gl/expressions
```

## Usage

Evaluate a parsed expression against a data object:

```js
import { parse, eval as evaluate } from "@math.gl/expressions";

const expression = parse("value * scale + 1");
const result = evaluate(expression, { value: 3, scale: 2 });
// 7
```

Compile an expression once and reuse it:

```js
import { compile } from "@math.gl/expressions";

const accessor = compile("points[1].value");
const result = accessor({ points: [{ value: 1 }, { value: 4 }] });
// 4
```

Supply function libraries through parser options:

```js
import {
  BASIC_MATH_FUNCTION_LIBRARY,
  GEOSPATIAL_FUNCTION_LIBRARY,
  compile,
} from "@math.gl/expressions";

const fn = compile(
  "cartographicToCartesian([toRadians(longitude), toRadians(latitude), 0])",
  {
    libraries: [BASIC_MATH_FUNCTION_LIBRARY, GEOSPATIAL_FUNCTION_LIBRARY],
  },
);

const cartesian = fn({ longitude: 0, latitude: 0 });
// [6378137, 0, 0]
```

Compile a JSON-style accessor expression that disallows function calls:

```js
import { parseExpressionString } from "@math.gl/expressions";

const getFill = parseExpressionString("style.fill.color");
const fill = getFill({ style: { fill: { color: "#08f" } } });
// '#08f'
```

## API Surface

| Export                        | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `parse`                       | Parses an expression string into a JSEP AST.                            |
| `eval`                        | Evaluates a parsed AST against a context object.                        |
| `evalAsync`                   | Async evaluator for expressions containing async function calls.        |
| `compile`                     | Compiles an expression string or AST into a reusable function.          |
| `compileAsync`                | Async variant of `compile`.                                             |
| `addUnaryOp`                  | Registers a custom unary operator with the parser and evaluator.        |
| `addBinaryOp`                 | Registers a custom binary operator with the parser and evaluator.       |
| `BASIC_MATH_FUNCTION_LIBRARY` | Built-in scalar and vector-aware math helpers for expression contexts.  |
| `GEOSPATIAL_FUNCTION_LIBRARY` | Built-in WGS84 geospatial helpers for expression contexts.              |
| `mergeFunctionLibraries`      | Merges one or more function libraries into an evaluation context.       |
| `parseExpressionString`       | Compiles a JSON-style accessor expression with function calls disabled. |

## Function Libraries

The evaluator APIs accept a `libraries` option:

```ts
compile(expression, { libraries: [BASIC_MATH_FUNCTION_LIBRARY] });
eval(ast, row, { libraries: [GEOSPATIAL_FUNCTION_LIBRARY] });
evalAsync(ast, row, { libraries: [customLibrary] });
```

Libraries are merged left-to-right and then overlaid with the input context object, so row values win if a field name collides with a library export.

## Attribution

This module is adapted from the expression parser that ships in [`@deck.gl/json`](https://www.npmjs.com/package/@deck.gl/json).

Its evaluator is based on Stephen Oney's [`jsep`](https://github.com/EricSmekens/jsep) parser and on [@donmccurdy](https://github.com/donmccurdy)'s deprecated [`expression-eval`](https://www.npmjs.com/package/expression-eval) module. math.gl keeps that lineage explicit here because the public module is intentionally preserving and documenting the behavior that previously lived inside deck.gl internals.
