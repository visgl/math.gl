# Portable expressions

Use `@math.gl/sql/expressions` to parse and evaluate expressions against JavaScript objects.
This entry point works without Apache Arrow. For SQL text, use [the parser](parser/README.md);
for table execution, start with [SQL queries](README.md).

## Evaluate expressions against objects

Evaluate a parsed expression against a data object:

```js
import {parse, evaluate} from '@math.gl/sql/expressions';

const expression = parse('value * scale + 1');
const result = evaluate(expression, {value: 3, scale: 2});
// 7
```

Compile an expression once and reuse it:

```js
import {compile} from '@math.gl/sql/expressions';

const accessor = compile('points[1].value');
const result = accessor({points: [{value: 1}, {value: 4}]});
// 4
```

Supply function libraries through parser options:

```js
import {
  BASIC_MATH_FUNCTION_LIBRARY,
  compile
} from '@math.gl/sql/expressions';
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
} from '@math.gl/sql/expressions';

const registry = new ExpressionFunctionRegistry()
  .registerFunctions(BASIC_MATH_FUNCTION_LIBRARY)
  .registerFunction('double', (value) => value * 2);

const fn = compile('double(round(value))', {registry});
fn({value: 2.4});
// 4
```

Compile a JSON-style accessor expression that disallows function calls:

```js
import {parseExpressionString} from '@math.gl/sql/expressions';

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

For applications that build function sets incrementally, use an [`ExpressionFunctionRegistry`](/docs/modules/sql/api-reference/function-registry). The registry rejects accidental name collisions and can be shared by multiple compiled expressions without changing module-global state.

Optional [DGGS function tables](/docs/modules/sql/api-reference/dggs-function-libraries) are available from `@math.gl/dggs`.

Try the APIs in the [expression playground](https://math.gl/examples/expressions).

## Attribution

This module is adapted from the expression parser that ships in [`@deck.gl/json`](https://www.npmjs.com/package/@deck.gl/json).

Its evaluator uses the vendored `jsep` 1.4.0 parser (MIT), with no external runtime dependency and derives from `expression-eval` by [Don McCurdy](https://github.com/donmccurdy). Source headers and distributed license notices retain the upstream attribution.

See [Attributions](../../references-and-credits.md) for the project-wide source inventory and acknowledgments.

See [Portable expression AST](portable-ast.md) for validation, column discovery, predicate normalization, numeric signatures, and backend integration.
