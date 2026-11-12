# @math.gl/expressions 🧪

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From-v4.2" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Use `@math.gl/expressions` to evaluate expressions against JavaScript objects, parse SQL into
query objects, or compute values directly from Apache Arrow columns.

## Features

| Feature | Support | Notes |
| --- | --- | --- |
| Expression parsing and evaluation | ✅ | [Parse and evaluate](./api-reference/expression-eval.md) JSEP expressions against an explicit context. |
| Reusable compiled accessors | ✅ | Synchronous and asynchronous compile/evaluate APIs reuse parsed expressions. |
| Custom operators and function libraries | ✅ | Isolated [function registries](./api-reference/function-registry.md), custom operators, basic math, and optional geospatial/DGGS libraries. |
| Restricted property-access expressions | ✅ | [parseExpressionString](./api-reference/parse-expression-string.md) builds accessors with function calls disabled. |
| SQL parsing | ✅ | [Parse SQL](./sql/README.md) into query and predicate objects. |
| Arrow column evaluation | ✅ | [Evaluate expressions](./arrow/README.md) over batches or tables with Apache Arrow installed. |
| Full JavaScript programs and process isolation | ❌ | This is an expression evaluator, not a separate JavaScript runtime or security sandbox; registered functions run application code. |
| Reactive dependency tracking | ❌ | No incremental dependency graph, automatic invalidation, or reactive recomputation engine. |
| Shader compilation and automatic differentiation | ❌ | Compilation produces reusable JavaScript evaluators, without a GPU code generator or differentiation backend. |

## Installation

```bash
npm install @math.gl/expressions
```

Install `apache-arrow` (17 or later) to use the Arrow entry points.

| Import | Use it to |
| --- | --- |
| `@math.gl/expressions` | Parse and evaluate expressions against JavaScript objects. |
| [`@math.gl/expressions/sql`](./sql/README.md) | Parse SQL statements, predicates, and named parameters for a query engine. |
| [`@math.gl/expressions/arrow`](./arrow/README.md) | Evaluate schema-bound expressions and predicates over Arrow batches and tables. |
| [`@math.gl/expressions/arrow/worker`](./arrow/README.md#worker-execution) | Run Arrow expressions in a worker. |
| [`@math.gl/expressions/math`](./math/README.md) and [`@math.gl/expressions/color`](./color/README.md) | Register typed numeric and color functions for Arrow expressions. |

The package root and SQL parser work without Apache Arrow. The SQL parser returns query and
predicate objects. The application resolves data sources, plans queries, and selects result rows.

## Evaluate expressions against objects

Evaluate a parsed expression against a data object:

```js
import {parse, evaluate} from '@math.gl/expressions';

const expression = parse('value * scale + 1');
const result = evaluate(expression, {value: 3, scale: 2});
// 7
```

Compile an expression once and reuse it:

```js
import {compile} from '@math.gl/expressions';

const accessor = compile('points[1].value');
const result = accessor({points: [{value: 1}, {value: 4}]});
// 4
```

Supply function libraries through parser options:

```js
import {
  BASIC_MATH_FUNCTION_LIBRARY,
  compile
} from '@math.gl/expressions';
import {GEOSPATIAL_FUNCTION_LIBRARY} from '@math.gl/geospatial';

const fn = compile('cartographicToCartesian([toRadians(longitude), toRadians(latitude), 0])', {
  libraries: [BASIC_MATH_FUNCTION_LIBRARY, GEOSPATIAL_FUNCTION_LIBRARY]
});

const cartesian = fn({longitude: 0, latitude: 0});
// [6378137, 0, 0]
```

Register functions once and share them across evaluators:

```js
import {
  BASIC_MATH_FUNCTION_LIBRARY,
  ExpressionFunctionRegistry,
  compile
} from '@math.gl/expressions';

const registry = new ExpressionFunctionRegistry()
  .registerFunctions(BASIC_MATH_FUNCTION_LIBRARY)
  .registerFunction('double', (value) => value * 2);

const fn = compile('double(round(value))', {registry});
fn({value: 2.4});
// 4
```

Compile a JSON-style accessor expression that disallows function calls:

```js
import {parseExpressionString} from '@math.gl/expressions';

const getFill = parseExpressionString('style.fill.color');
const fill = getFill({style: {fill: {color: '#08f'}}});
// '#08f'
```

The evaluator accepts expressions and runs registered functions as application code. Treat those
functions and their input contexts as trusted. See [portable expression AST](portable-ast.md) for
validation, column discovery, and predicate normalization.

## API Surface

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

## Function Libraries

The WGS84 helper library is exported from `@math.gl/geospatial`; install
`@math.gl/geospatial` to use it. DGGS libraries require `@math.gl/dggs`.
The evaluator APIs accept a `libraries` option:

```ts
compile(expression, {libraries: [BASIC_MATH_FUNCTION_LIBRARY]});
evaluate(ast, row, {libraries: [GEOSPATIAL_FUNCTION_LIBRARY]});
evaluateAsync(ast, row, {libraries: [customLibrary]});
```

Libraries are merged left-to-right and then overlaid with the input context object, so row values win if a field name collides with a library export.

For applications that build function sets incrementally, use an [`ExpressionFunctionRegistry`](/docs/modules/expressions/api-reference/function-registry). The registry rejects accidental name collisions and can be shared by multiple compiled expressions without changing module-global state.

Optional [DGGS function tables](/docs/modules/expressions/api-reference/dggs-function-libraries) are available from `@math.gl/dggs`.

Try the APIs in the [expression playground](https://math.gl/examples/expressions).

## Attribution

This module is adapted from the expression parser that ships in [`@deck.gl/json`](https://www.npmjs.com/package/@deck.gl/json).

Its evaluator uses the vendored `jsep` 1.4.0 parser (MIT), with no external runtime dependency and derives from `expression-eval` by [Don McCurdy](https://github.com/donmccurdy). Source headers and distributed license notices retain the upstream attribution.

See [Attributions](../../references-and-credits.md) for the project-wide source inventory and acknowledgments.

See [Portable expression AST](portable-ast.md) for validation, column discovery, predicate normalization, numeric signatures, and backend integration.
