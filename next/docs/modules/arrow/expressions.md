# Arrow expressions

`@math.gl/arrow/expressions` evaluates schema-bound expressions directly over Arrow batches. Use it for WHERE predicates, derived columns and typed application functions. It reuses the parser from `@math.gl/core/expressions`; it does not parse SQL or perform table query planning.

```
import {compileArrowExpression, compileArrowPredicate} from '@math.gl/arrow/expressions';



const predicate = compileArrowPredicate(

  {op: '>=', args: [{property: 'population'}, {parameter: 'minimum'}]},

  {inputSchema: batch.schema, parameters: {minimum: 100000}}

);

const matches = predicate.evaluate(batch); // Bool Vector: retain only true rows



const expression = compileArrowExpression('population * 2', {inputSchema: batch.schema});

const result = expression.evaluate(batch);

console.log(expression.outputField, result);
```

Compile once and reuse across batches with the same ordered field names, types, encodings and nullability. Metadata differences do not invalidate a binding. Evaluation preserves row count; empty batches return empty vectors. Output field names can be replaced by an application's SELECT AS alias. WHERE column names and SELECT alias resolution belong to the caller's query planner.

## Functions[​](#functions "Direct link to Functions")

### compileArrowExpression(expression, options)[​](#compilearrowexpressionexpression-options "Direct link to compileArrowExpression(expression, options)")

Returns a reusable evaluator with `outputField: Field` and `evaluate(recordBatch, {activeRows?}): Vector`.

| Parameter             | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| `expression`          | Expression text or the AST accepted by core expressions.                |
| `options.inputSchema` | Required Arrow schema used to bind field names and types.               |
| `options.registry`    | Optional instance of `ArrowFunctionRegistry`.                           |
| `activeRows`          | Optional `Uint8Array`, one 0 or 1 per input row. Zero skips evaluation. |

### compileArrowFunction(name, arguments, options)[​](#compilearrowfunctionname-arguments-options "Direct link to compileArrowFunction(name, arguments, options)")

Compiles a direct function call. Each argument is expression text or an AST; options and the returned evaluator are the same as `compileArrowExpression`. This also supports built-in function names.

### compileArrowPredicate(predicate, options)[​](#compilearrowpredicatepredicate-options "Direct link to compileArrowPredicate(predicate, options)")

Compiles a portable `ParameterizedColumnarPredicate`. Options additionally accept `parameters`, a map of parameter names to scalar values. Missing parameters and unknown columns fail at compilation. The returned evaluator produces a Bool vector using the null semantics described below.

### ArrowFunctionRegistry[​](#arrowfunctionregistry "Direct link to ArrowFunctionRegistry")

Create an isolated registry with `new ArrowFunctionRegistry()`. `registerFunction(name, declaration)` returns the registry for chaining; `getFunction(name)` returns its declaration or `undefined`. Treat declared fields and their types as immutable after registration. Compilation captures the registered implementations; registering additional functions does not change existing evaluators.

## Typed functions[​](#typed-functions "Direct link to Typed functions")

```
import {Field, Float64} from 'apache-arrow';

import {ArrowFunctionRegistry, compileArrowFunction} from '@math.gl/arrow/expressions';



const registry = new ArrowFunctionRegistry().registerFunction('discount', {

  arguments: [new Field('price', new Float64(), false)],

  result: new Field('discounted_price', new Float64(), false),

  nullHandling: 'propagate',

  scalar: price => Number(price) * 0.9

});



const discount = compileArrowFunction('discount', ['price'], {inputSchema: batch.schema, registry});

const prices = discount.evaluate(batch);

// The same declaration can be called inside 'discount(price) > 100'.
```

Registries are instance-scoped. Names must be valid identifiers and unique; built-in names are reserved. Arguments use exact declared logical types. Numeric literals are checked against their operand's type; other conversions must be explicit. `nullHandling: 'propagate'` skips invocation when any argument is null and makes the expression result nullable. With `nullHandling: 'call'`, nullable arguments must be declared nullable and the implementation receives null values. Returning null for a non-nullable declared result is an error.

An optional `kernel(arguments, {activeRows, length})` supplies vector execution. It receives full-length Arrow vectors, potentially dictionary encoded, and a byte mask containing 0 or 1 for each row. It must only evaluate active rows, preserve row count and return the declared logical result type. Inactive output values are ignored. Inputs belong to the caller and must not be mutated. A kernel is never called when there are no active rows. The scalar implementation remains required as the reference contract; the library does not retry a failing kernel through the scalar implementation.

## Supported expressions[​](#supported-expressions "Direct link to Supported expressions")

* Top-level fields, numeric/string/Boolean/null literals, parentheses and named function calls.
* Arithmetic `+`, `-`, `*`, `/`, `%`; unary `+` and `-`; comparisons `==`, `===`, `!=`, `!==`, `<`, `<=`, `>`, `>=`.
* Boolean `&&`, `||`, `!` and the conditional `condition ? yes : no`.
* `isNull`, `isNotNull`, `parseNumber`, `parseBigInt`, `parseBoolean`.
* Explicit numeric conversions `toFloat64`, `toInt32`, `toInt64`.

Referenced inputs support signed/unsigned integers, Float32/Float64, Bool and Utf8, including dictionary encodings. Computed outputs use ordinary vectors. Int64 and Uint64 values use bigint. Integer arithmetic checks bounds rather than wrapping; integer division truncates toward zero and division/remainder by zero throws. Checked integer conversions reject fractional or out-of-range results. Explicit conversion from bigint to Float64 can round. Float32 intermediates round to Float32 at each operation. Floating arithmetic and comparisons retain IEEE behavior, including Infinity and NaN for zero divisors.

UTF-8 comparison uses unsigned byte order without locale collation. String parsing operates on Arrow byte ranges and uses the existing UTF-8 helpers' decimal/Boolean grammar. Invalid text becomes null; parsed integers outside Int64 range throw. Custom scalar functions decode only the active values they consume. Binary kernels and input readers honor validity bitmaps and slice offsets.

Nulls propagate through ordinary operators. Boolean logic is three-valued: `false && null` is false, `true || null` is true, and `!null` is null. A null conditional test selects the false branch. Inactive branches never invoke user functions. `evaluate(batch, {activeRows})` can additionally skip selected rows; skipped positions are null even when `outputField` describes a non-nullable expression.

## Portable predicates[​](#portable-predicates "Direct link to Portable predicates")

The format-neutral `ColumnarPredicate` vocabulary and its parameter-binding, validation, column-path and copy utilities are exported from `@math.gl/core/expressions`, without an Arrow dependency. `compileArrowPredicate` accepts comparisons, `in`, `isNull`, `and`, `or` and `not`, plus named parameters. Its v1 Arrow executor supports top-level primitive fields; nested paths, dates, binary values and other Arrow types fail explicitly. A string property containing dots is one literal field name.

SQL parsing, source pushdown and result-row selection remain the query engine's responsibility. Only true predicate results select rows; false and null results do not. Computed SELECT functions should be evaluated after filtering, using the selected batch or an active-row mask.

## Performance and boundaries[​](#performance-and-boundaries "Direct link to Performance and boundaries")

Input readers use Arrow buffers without allocating JavaScript row objects. Primitive string kernels avoid decoding input strings. Built-in operations and scalar callbacks are fused into the output pass, and constants remain scalar. Temporary vectors are materialized only as arguments to registered vector kernels. Kernel branches may require a mask prepass; working memory remains bounded by the current batch. Direct field projections can reuse input buffers; retain those outputs only as long as needed.

Run `node modules/arrow/scripts/benchmark-expressions.mjs` after building to compare numeric and UTF-8 workloads with the existing expression evaluator. The report separates throughput, row objects, string decodes and output buffer bytes; it does not claim to measure total allocator traffic.

This optional subpath does not add Arrow to core imports. Importing the function registry alone does not include the compiler or Arrow runtime. Unregistered application function libraries are not loaded.
