# Arrow expressions

`@math.gl/arrow/expressions` evaluates schema-bound expressions directly over Arrow batches. Use it
for WHERE predicates, derived columns and typed application functions. It reuses the parser from
`@math.gl/core/expressions`; it does not parse SQL or perform table query planning.

```ts
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

Compile once and reuse across batches with the same ordered field names, types, encodings and
nullability. GeoArrow extension encoding/CRS metadata must match; other metadata differences do not invalidate a binding. Evaluation preserves row count;
empty batches return empty vectors. Output field names can be replaced by an application's SELECT AS
alias. WHERE column names and SELECT alias resolution belong to the caller's query planner.

## Functions

### compileArrowExpression(expression, options)

Returns a reusable evaluator with `outputField: Field` and
`evaluate(recordBatch, {activeRows?}): Vector`.

| Parameter | Description |
| --- | --- |
| `expression` | Expression text or the AST accepted by core expressions. |
| `options.inputSchema` | Required Arrow schema used to bind field names and types. |
| `options.functions` | Optional array of named `ArrowTableFunction` declarations. |
| `activeRows` | Optional `Uint8Array`, one 0 or 1 per input row. Zero skips evaluation. |

### compileArrowFunction(name, arguments, options)

Compiles a direct function call. Each argument is expression text or an AST; options and the returned
evaluator are the same as `compileArrowExpression`. This also supports built-in function names.

### compileArrowPredicate(predicate, options)

Compiles a portable `ParameterizedColumnarPredicate`. Options additionally accept `parameters`, a
map of parameter names to scalar values. Missing parameters and unknown columns fail at compilation.
The returned evaluator produces a Bool vector using the null semantics described below.

## Named table functions

Pass declarations through `functions`; the compiler builds a private name lookup once per compilation.
Names must be valid identifiers; built-in names are reserved. Argument signatures within each name must be unique. No global registry is modified.
Treat declared fields and their types as immutable. Compilation snapshots the declarations and their
argument arrays, so later changes to the supplied function list do not change existing evaluators.

```ts
import {Field, Float64, vectorFromArray} from 'apache-arrow';
import {compileArrowFunction, type ArrowTableFunction} from '@math.gl/arrow/expressions';

const discount: ArrowTableFunction = {
  name: 'discount',
  prototypes: [{arguments: [new Field('price', new Float64(), true)],
  result: new Field('discounted_price', new Float64(), true),
  nullHandling: 'propagate',
  evaluate([prices], {length, activeRows}) {
    return vectorFromArray(Array.from({length}, (_, row) =>
      activeRows[row] && prices!.isValid(row) ? prices!.get(row) * 0.9 : null
    ), new Float64());
  },
  evaluateScalar: price => Number(price) * 0.9
  }]
};

const compiled = compileArrowFunction('discount', ['price'], {
  inputSchema: batch.schema,
  functions: [discount]
});
const prices = compiled.evaluate(batch);
// The same declaration can be used inside 'discount(price) > 100'.
```

`ArrowTableFunctionType` is the type of `evaluate`: it accepts an ordered `readonly Vector[]`
and `{activeRows: Uint8Array, length: number}`, and returns a `Vector` of the same length.
`evaluate` is required on every prototype and can be called directly as `function.prototypes[index].evaluate(...)`. Direct callers must
supply correctly typed vectors and a mask, and honor the declaration's null policy; compilation
provides these checks and null propagation when invoking functions inside expressions.

Arguments use exact declared logical types. Numeric literals are checked against their operand's
type; other conversions must be explicit. `nullHandling: 'propagate'` skips rows with null arguments
and makes the expression result nullable. With `nullHandling: 'call'`, nullable arguments must be
declared nullable and the implementation receives null values. Returning null for a non-nullable
declared result is an error.

### Vector evaluation and scalar fusion

The vector implementation receives full-length Arrow vectors, potentially dictionary encoded, and a
byte mask containing 0 or 1 per row. It must evaluate only active rows, preserve row count, and return
the declared logical result type. Inactive output values are ignored. Inputs belong to the caller
and must not be mutated. The evaluator never calls a function when no rows are active.

An optional `evaluateScalar(...values)` provides equivalent primitive row semantics. When present,
the expression compiler uses it to fuse the function into its output loop, avoiding intermediate
vectors. Without it, the compiler calls `evaluate` at the vector boundary. It never runs both
implementations or retries a failure through the other implementation. Both implementations must
agree on values and errors. Conditional branches and null propagation skip scalar callbacks too.

The example uses `vectorFromArray` for readability; vector kernels can write Arrow buffers directly.
Geometry functions can supply only `evaluate`, with exact nested argument fields and GeoArrow
extension metadata. Geometry layouts require schema-bound declarations; there is no overload
resolution yet. Results support primitives and fixed-size numeric tuples. Other nested results, including variable-length geometry output, are not supported.

### RGBA and other numeric tuple results

A vector-only function can return a `FixedSizeList` with a positive fixed width and a
non-nullable numeric child. For RGBA, declare four `Float32` channels or four `Uint8` channels:

```ts
const rgba = new FixedSizeList(4, new Field('channel', new Float32(), false));
const result = new Field('color', rgba, true);
```

The parent validity bitmap represents a missing color; transparent RGBA is a valid value.
The evaluator preserves the declared field metadata and child buffers, validates active result rows,
and masks inactive or null-propagated rows through parent validity. Tuple functions cannot supply
`evaluateScalar`. Tuple values can be projected, passed to another vector function, tested with
`isNull`, or selected with `condition ? color(value) : [0, 0, 0, 1]`.
Arithmetic and comparisons on whole tuples are unsupported. Conditional selection allocates one
numeric child buffer and copies selected components, without per-row JavaScript arrays.

### Typed array arguments

Array literals take their type from a function's declared `List` or `FixedSizeList` argument.
For example, `List<Float64>` accepts numeric bins and `List<Utf8>` accepts category names:

```ts
// Application-supplied functions declare these arguments:
const bins = new Field('bins', new List(new Field('item', new Float64(), false)), false);
const categories = new Field('categories', new List(new Field('item', new Utf8(), false)), false);
// Expressions: bucket(value, [10, 20, 50]) and category(kind, ["road", "rail", "water"])
```

The compiler validates every element against the exact declared type. Empty variable-length lists
are supported; fixed-size literals must match their width. Null elements require a nullable child.
Literals are flat and limited to 4096 elements: dynamic values, nested arrays, holes and spreads
are rejected. Standalone arrays have no inferred type. A conditional array branch can inherit its
type from the other tuple branch or a declared function argument.

Variable-length constants are broadcast as dictionary-encoded vectors containing one list value,
so a large bin/category list is not copied for every row. Kernels must handle dictionary inputs
(as Arrow `Vector.get` does) and treat inputs as read-only. Fixed tuples use ordinary child buffers.
The same declarations and literals work with `evaluateTable` and worker-local functions.
These are evaluator primitives; palette and color-scale functions are supplied separately.

## Supported expressions

- Top-level fields, numeric/string/Boolean/null literals, parentheses and named function calls.
- Arithmetic `+`, `-`, `*`, `/`, `%`; unary `+` and `-`; comparisons `==`, `===`, `!=`, `!==`, `<`, `<=`, `>`, `>=`.
- Boolean `&&`, `||`, `!` and the conditional `condition ? yes : no`.
- `isNull`, `isNotNull`, `parseNumber`, `parseBigInt`, `parseBoolean`.
- Explicit numeric conversions `toFloat64`, `toInt32`, `toInt64`.

Referenced inputs support signed/unsigned integers, Float32/Float64, Bool and Utf8, including dictionary encodings.
Computed outputs use ordinary vectors. Int64 and Uint64 values use bigint. Integer arithmetic checks
bounds rather than wrapping; integer division truncates toward zero and division/remainder by zero
throws. Checked integer conversions reject fractional or out-of-range results. Explicit conversion
from bigint to Float64 can round. Float32 intermediates round to Float32 at each operation. Floating arithmetic and comparisons retain IEEE behavior, including Infinity and NaN for zero divisors.

UTF-8 comparison uses unsigned byte order without locale collation. String parsing operates on Arrow
byte ranges and uses the existing UTF-8 helpers' decimal/Boolean grammar. Invalid text becomes null;
parsed integers outside Int64 range throw. Custom scalar functions decode only the active values
they consume. Binary kernels and input readers honor validity bitmaps and slice offsets.

Nulls propagate through ordinary operators. Boolean logic is three-valued: `false && null` is false,
`true || null` is true, and `!null` is null. A null conditional test selects the false branch. Inactive
branches never invoke user functions. `evaluate(batch, {activeRows})` can additionally skip selected
rows; skipped positions are null even when `outputField` describes a non-nullable expression.

## Portable predicates

The format-neutral `ColumnarPredicate` vocabulary and its parameter-binding, validation, column-path
and copy utilities are exported from `@math.gl/core/expressions`, without an Arrow dependency.
`compileArrowPredicate` accepts comparisons, `in`, `isNull`, `and`, `or` and `not`, plus named parameters.
Its v1 Arrow executor supports top-level primitive fields; nested paths, dates, binary values and other
Arrow types fail explicitly. A string property containing dots is one literal field name.

SQL parsing, source pushdown and result-row selection remain the query engine's responsibility.
Only true predicate results select rows; false and null results do not. Computed SELECT functions
should be evaluated after filtering, using the selected batch or an active-row mask.

## Performance and boundaries

Input readers use Arrow buffers without allocating JavaScript row objects. Primitive string kernels
avoid decoding input strings. Built-in operations and scalar callbacks are fused into the output pass, and constants remain scalar.
Temporary vectors are materialized at registered vector boundaries and for tuple conditionals. List constants retain one shared payload plus row indices. Kernel branches
may require a mask prepass; working memory remains bounded by the current batch. Direct
field projections can reuse input buffers; retain those outputs only as long as needed.

Run `node modules/arrow/scripts/benchmark-expressions.mjs` after building to compare numeric and UTF-8
workloads with the existing expression evaluator. The report separates throughput, row objects,
string decodes and output buffer bytes; it does not claim to measure total allocator traffic.

This optional subpath does not add Arrow to core imports. Function declaration types are erased
from runtime bundles. Application function libraries are included only when imported.


## Whole-table evaluation

`compiled.evaluateTable(arrowTable, {activeRows?, signal?})` evaluates the table's batches in order and
returns one chunked Arrow vector. It reuses each batch result's buffers; it does not flatten or copy
columns. Direct primitive projections reuse input buffers. Dictionary outputs use ordinary vectors.
An empty table still validates its schema and produces an empty vector with the compiled output type.

A table mask contains one byte per row across all batches. Cancellation is checked before and after
each batch; synchronous evaluation does not yield to the event loop. Use a worker for responsive UI
cancellation. A single large batch or custom synchronous kernel cannot be interrupted mid-call.

## Worker execution

Import worker helpers from `@math.gl/arrow/expressions/worker` and the runner from `@math.gl/tasks`.
Send a serializable expression/AST or `{predicate, parameters}` program. Compiled closures and
registries stay in their own realm. A retained task compiles on its first input and validates that
schema on subsequent calls, including empty tables. Create a new task instance for a different
expression or schema.

```ts
import {TaskRunner} from '@math.gl/tasks';
import {
  createArrowExpressionTask, prepareArrowExpressionInput, hydrateArrowExpressionResult
} from '@math.gl/arrow/expressions/worker';

const task = createArrowExpressionTask({worker: {
  create: () => new Worker(new URL('./expression-worker.ts', import.meta.url), {type: 'module'}),
  capabilities: {atomic: true, streaming: false}
}});
const runner = new TaskRunner();
try {
  const session = await runner.initializeTask(task, {expression: 'population > 100000'}, {
    execution: 'worker'
  });
  try {
    const result = await session.runTask(prepareArrowExpressionInput(arrowTable), {signal});
    const {field, vector} = hydrateArrowExpressionResult(result);
    // vector preserves batch order; field retains result name, type and metadata.
  } finally {await session.close();}
} finally {await runner.close();}
```

Worker module:

```ts
import {initializeTaskWorker} from '@math.gl/tasks';
import {createArrowExpressionTask} from '@math.gl/arrow/expressions/worker';
await initializeTaskWorker(createArrowExpressionTask());
```

For Node, use `worker.url: new URL('./expression-worker.mjs', import.meta.url)` instead of a factory.
The shipped `@math.gl/arrow/expressions/worker-entry.js` is a module worker for built-ins; use a custom
worker module to construct and register application functions or Turf adapters locally.
The executable example is in `examples/arrow/expressions-worker`.

### Ownership and cancellation

`prepareArrowExpressionInput(table, {activeRows?})` borrows column buffers without copying values.
TaskRunner's default `inputOwnership: 'copy'` preserves the caller's table. Explicit
`inputOwnership: 'transfer'` detaches every referenced ArrayBuffer, including buffers shared by other
columns, dictionaries and slices. Relinquish those aliases too; transfer is not a slice-only move.
Output buffers transfer back by default, and `hydrateArrowExpressionResult()` reconstructs a vector
and output field without copying buffers. A result mask makes the returned field nullable.

This transport uses schema-only IPC plus separate Arrow buffers, not full value serialization.
Use the same Apache Arrow version on host and worker. TaskRunner owns worker cleanup; caller-owned
input tables remain owned by the caller unless explicitly transferred. Workers yield between batches
for cancellation and report row progress. Errors reject the operation; cancellation returns no partial
result. Do not mutate borrowed input buffers while a task is running.

Run `node modules/arrow/scripts/benchmark-expression-tables.mjs` after building. It reports local and
worker throughput, cold startup, warm round-trip costs, preparation time, output chunks/bytes and known
row-object/string-decoding allocations. Worker timings include transfer and hydration. The transfer
case includes preparing an owned copy so its reusable source fixture remains intact. Workers can cost
more overall for small workloads while keeping evaluation off the UI thread.

## Turf functions

`@math.gl/geospatial/turf/expressions` exports `createTurfArrowFunction({name, arguments, result, evaluate})`.
Pass the exact GeoArrow argument fields and a nullable Float64 or Bool result. Import only the Turf
functions you use; the adapter itself imports no Turf implementations.

```ts
import {Field, Float64} from 'apache-arrow';
import {area, distance} from '@math.gl/geospatial/turf';
import {createTurfArrowFunction} from '@math.gl/geospatial/turf/expressions';
const functions = [
  createTurfArrowFunction({
    name: 'area',
    arguments: [polygonField],
    result: new Field('area', new Float64(), true),
    evaluate: area
  }),
  createTurfArrowFunction({
    name: 'distanceMeters',
    arguments: [pointField, pointField],
    result: new Field('distance', new Float64(), true),
    evaluate: (a, b) => distance(a, b, {units: 'meters'})
  })
];
// Compile 'area(geometry) > 1000' with {inputSchema, functions},
// or construct the same declarations inside the worker module.
```

The adapter combines active-row masks with GeoArrow validity without changing coordinate buffers.
It supports row-aligned numeric and Boolean Turf results: area, length, distance, bearing, rhumb
variants, angle and Boolean predicates. It retains each Turf function's units, geometry restrictions,
CRS assumptions and null behavior. Geometry-producing functions, row-count-changing operations and
flattened `bbox` results are excluded. Nested geometry arithmetic remains unsupported.

## SQL CAST

Use `parseSQLExpression` from `@math.gl/core/sql` to compile standard SQL cast syntax:

```ts
import {parseSQLExpression} from '@math.gl/core/sql';
const converted = compileArrowExpression(parseSQLExpression('CAST(population AS BIGINT)'), {
  inputSchema: batch.schema
});
```

Supported targets are SMALLINT (Int16), INTEGER/INT (Int32), BIGINT (Int64), REAL (Float32),
DOUBLE PRECISION (Float64), BOOLEAN (Bool), and VARCHAR/CHARACTER VARYING (Utf8).
Nulls remain null. Numeric-to-integer casts truncate toward zero and reject overflow; text-to-integer
casts require integer text. Invalid text, non-finite numeric results and overflow throw only for
active rows. Boolean casts accept Boolean/text inputs; Boolean-to-text yields `TRUE` or `FALSE`.
Text parsing uses the UTF-8 primitives without decoding numeric/Boolean input strings.
Bigint-to-floating conversion can lose precision. Float32 casts round to Float32.

The SQL parser emits the shared expression AST, equivalent to `cast(value, "int64")` in expression
syntax. CAST can be nested, selected with an alias, or applied to a WHERE column before comparison.
Precision/length modifiers, DECIMAL, date/time targets, casts on the
right-hand predicate scalar are currently unsupported.

Postfix `value::TYPE` and chained casts are also supported with the same conversion rules.

## Packed source columns

`compileArrowArray(columns, {inputSchema, type?})` packs existing floating-point columns into one
fixed-size list vector. `type` may be `float16`, `float32` or `float64`; omission preserves Float64 if present
in any source component, otherwise Float32 or Float16, preserving the widest input precision. Unknown and non-floating columns are rejected at binding.

```ts
import {compileArrowArray} from '@math.gl/arrow/expressions';
const position = compileArrowArray(['x', 'y', 'z'], {inputSchema: arrowTable.schema});
const positions = position.evaluateTable(arrowTable);
```

The optional SQL parser represents `ARRAY[x,y,z] AS position` as a portable array selection with an
optional explicit precision. Pass its `array` and `type` to this helper. Evaluation interleaves each
batch without row filtering, retaining source order and chunk boundaries. Any null component makes
the parent list null; its numeric slots remain zeros. Masked rows follow the same rule. Consumers
reading numeric buffers directly must honor parent validity. Empty results retain their fixed-size
schema. Explicit Float32 conversion can lose precision, following Arrow floating-point conversion.

## Float16

Arrow `Float16` inputs, scalar results and fixed-size numeric tuple results use native
`Float16Array` views over Arrow's Uint16 binary16 storage. Expressions decode logical numbers,
respect slice offsets and nulls, and round at every half-precision operation boundary. Output
buffers remain Arrow-compatible Uint16 bit patterns; buffer transport and worker evaluation retain
that representation. Numeric projections can reuse input storage.

`parseSQLExpression('value::FLOAT16')` and `CAST(value AS FLOAT16)` bind explicit half-precision
casts. Values round using the runtime's binary16 conversion; finite values that overflow on explicit
casts throw, while arithmetic retains IEEE infinity/NaN behavior. Subnormals and signed zero are
preserved. Runtime native `Float16Array` support is required in every executing worker or thread;
without it, Float16 operations fail with a capability error. Other expression types remain usable.
The capability checks reuse the existing core Float16 helpers.

Packed arrays also accept `ARRAY[x,y,z]::FLOAT16[3]` or `compileArrowArray(columns, {inputSchema, type: "float16"})`. Native Float16Array is required for half-precision execution.


## Function prototypes and numeric overloads

Each named `ArrowTableFunction` owns a non-empty `prototypes` array. A prototype declares its
argument fields, result field, null policy, vector implementation and optional fused scalar
implementation. Multiple objects with the same name may contribute distinct prototypes. Duplicate
argument-type/metadata signatures are rejected; changing only return type or nullability does not
create an overload. There are no legacy single-signature aliases.

Compilation selects one prototype: exact signatures win, otherwise Float16 can widen to Float32 or
Float64 and Float32 can widen to Float64. The least total widening wins; ties are ambiguous and
fail binding. Integer/float and mixed integer-width conversions require explicit casts. Literals
follow typed arguments; calls containing only numeric literals prefer their default Float64 type.
Use typed null casts to disambiguate otherwise ambiguous null arguments. Kernels receive the chosen
prototype's declared input types. No per-batch overload lookup or callback probing occurs.

`ArrowEvaluationError` exposes `code` values `domain`, `conversion`, `overflow` and
`divisionByZero`. Numeric data errors use this class; unknown names, incompatible signatures,
schema mismatches and implementation failures remain ordinary fatal errors. Division and modulo
by zero throw for integer and floating Arrow arithmetic. Error recovery is added separately.

## TRY and COALESCE

`TRY(expression)` converts classified row-level domain, conversion, overflow, and division-by-zero
errors to null. `TRY(expression, fallback)` evaluates the fallback only for failing rows;
a genuine null result stays null. Use `COALESCE(TRY(expression), fallback)` to replace both.

```ts
import {parseSQLExpression} from '@math.gl/core/sql';
import {SQRT} from '@math.gl/arrow/math';
const compiled = compileArrowExpression(parseSQLExpression('TRY(SQRT(value), 0)'), {
  inputSchema: arrowTable.schema,
  functions: [SQRT]
});
```

Fallback errors propagate unless separately wrapped in TRY. Nested recovery scopes are isolated.
Syntax errors, unknown names, incompatible types, cancellation and unexpected callback/kernel
exceptions remain fatal. TRY never retries a batch or invokes a callback twice. Recovery boundaries
materialize an output vector; pure scalar operations outside them remain fused.

Vector implementations can call `context.reportError?.(row, error)` with a classified error and then
skip the rest of that row. Outside TRY the reporter throws. Inside TRY it records the row failure
and clears that row in the kernel's active mask. A kernel without a reporter must throw the error.
A thrown batch exception cannot be associated with a row and remains fatal, even inside TRY.

See [SQL expression conformance](./sql-conformance.md) for syntax, numeric rules, worker registration, and the benchmark.
