# SQL expressions in Arrow

Parse SQL with [`@math.gl/expressions/sql`](https://visgl.github.io/math.gl/next/docs/modules/expressions/sql.md), then bind the returned AST to an Arrow schema with `compileArrowExpression()`. The compiled evaluator can process batches or an entire table in order. Parsing and execution are separate optional imports.

```
import {parseSQLExpression} from '@math.gl/expressions/sql';

import {compileArrowExpression} from '@math.gl/expressions/arrow';

import {SQRT} from '@math.gl/expressions/math';



const expression = parseSQLExpression('TRY(SQRT(value), 0)');

const compiled = compileArrowExpression(expression, {

  inputSchema: arrowTable.schema,

  functions: [SQRT]

});

const values = compiled.evaluateTable(arrowTable);
```

## Syntax and support[​](#syntax-and-support "Direct link to Syntax and support")

| Operation              | SQL expression                          | Basic expression syntax                                           | Arrow behavior                                                                           |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Arithmetic             | `x + y`, `x - y`, `x * y`, `x / y`      | Same operators                                                    | Exact integer arithmetic with overflow checks; typed floating arithmetic.                |
| Exponent and remainder | `POWER(x, y)`, `MOD(x, y)`              | Register the same named functions; `%` is also supported by Arrow | SQL does not accept `**`, `^`, or `%`.                                                   |
| Comparisons            | `=`, `<>`, `!=`, `<`, `<=`, `>`, `>=`   | `==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`                    | Same-type comparisons; null produces unknown. UTF-8 ordering is binary.                  |
| Boolean logic          | `AND`, `OR`, `NOT`                      | `&&`, `\|\|`, `!`                                                 | Three-valued logic with short-circuit evaluation.                                        |
| Null tests             | `x IS NULL`, `x IS NOT NULL`            | `isNull(x)`, `isNotNull(x)`                                       | Non-null Boolean result.                                                                 |
| Branches               | `CASE WHEN condition THEN x ELSE y END` | `condition ? x : y`                                               | Only the selected branch runs; omitted ELSE produces null.                               |
| Casts                  | `CAST(x AS REAL)`, `x::REAL`            | `cast(x, 'float32')`                                              | Explicit scalar conversion; invalid conversion or overflow throws.                       |
| Fixed arrays           | `ARRAY[x + 1, SIN(angle), 0]::REAL[3]`  | `array_float32(x + 1, SIN(angle), 0)`                             | Fixed width, numeric components, null tuple if any component is null.                    |
| Typed list arguments   | —                                       | `f([1, 2, 3])`                                                    | List literals bind to the function signature. Variable-length result lists are deferred. |
| Error recovery         | `TRY(x)` or `TRY(x, fallback)`          | Same names in the Arrow evaluator                                 | Classified errors become null or a lazy fallback; genuine nulls remain null.             |
| Null fallback          | `COALESCE(x, fallback)`                 | Same name in the Arrow evaluator                                  | Evaluates subsequent arguments only where previous results are null.                     |

The basic parser accepts JavaScript-oriented syntax. The standalone JavaScript evaluator has its own semantics and does not automatically provide Arrow casts, null behavior, or TRY. SQL unquoted function calls are case-insensitive; column names and quoted calls retain exact case.

The [SQL parser reference](https://visgl.github.io/math.gl/next/docs/modules/expressions/sql.md) describes SELECT, WHERE, source references, LIMIT, and catalog commands. Joins, aggregation, sorting, window functions, and variable-length output arrays remain outside this SQL subset.

## Numeric types and errors[​](#numeric-types-and-errors "Direct link to Numeric types and errors")

See [Arrow math functions](https://visgl.github.io/math.gl/next/docs/modules/expressions/math.md) for the complete function signatures and radians, rounding, and domain rules. Overloads prefer exact types; mixed floating arguments widen to the widest precision. Integer and floating columns require an explicit conversion when mixed. Integer transcendental calls return Float64. Int64/Uint64 integer operations preserve bigint precision where the operation returns an integer. Converting them to Float64 may lose precision.

Packed arrays infer the widest floating component or Float64 for integer-only inputs. A cast selects Float16, Float32, or Float64 and checks finite overflow. Invalid tuples have a cleared validity bit and zero-filled numeric padding. A renderer must consult the validity bit before using their coordinates or colors.

Domain, conversion, overflow, and division-by-zero errors are eligible for TRY. Float16 requires native `Float16Array` support in the executing thread. Subnormal results and underflow to zero are allowed. `TRY(expression, fallback)` leaves valid nulls alone; use `COALESCE(TRY(expression), fallback)` to replace both. Type errors, malformed expressions, unknown fields, cancellation, and unexpected callback failures remain fatal.

## Worker execution[​](#worker-execution "Direct link to Worker execution")

Send the parsed AST as the `expression` initialization value using the [whole-table worker API](https://visgl.github.io/math.gl/next/docs/modules/expressions/arrow.md#worker-execution). Register functions in the worker module:

```
import {initializeTaskWorker} from '@math.gl/tasks';

import {createArrowExpressionTask} from '@math.gl/expressions/arrow/worker';

import {SQRT} from '@math.gl/expressions/math';



await initializeTaskWorker(createArrowExpressionTask({functions: [SQRT]}));
```

On the host, initialize the task with `{expression: parseSQLExpression('TRY(SQRT(value), 0)')}`. The worker binds the schema and handles row errors before transporting the Arrow result. Functions and compiled closures stay in the worker. Keep input ownership and cancellation explicit.

## Performance and allocation[​](#performance-and-allocation "Direct link to Performance and allocation")

Run `yarn build` and `yarn benchmark:arrow-expressions`. Use `--quick` for a smoke run. The benchmark reuses four Arrow batches and compiled expressions. It compares a numeric composition with the existing JavaScript evaluator over predecoded rows, then measures TRY with 1 in 1,024 and 1 in 4 rows failing. It reports median and p95 execution time, rows per second, result chunks, and retained output buffer bytes. Each Arrow result is checked against an independent expected value for every row outside the timed section.

Scalar compositions are fused; vector kernels and TRY/COALESCE can materialize temporary vectors. TRY tracks failed rows per scope and skips subsequent work for those rows. A lazy fallback can still require full-length temporary buffers for the active batch. Frequent exceptions are more expensive than predictable domain checks such as `CASE WHEN value >= 0 THEN SQRT(value) END`. Retained output bytes do not include these temporary vectors, masks, exceptions, or GC traffic. Decoding input rows and worker transfer are excluded from the timed comparison.

One warm run on Apple M2 with Node 24.5.0 used 65,536 rows, four batches, three warmups, and seven interleaved samples. CPU time helps distinguish execution cost from other work on the host. These measurements describe this workload, not a performance guarantee.

| Workload                              | Median wall time | Median CPU time | Rows/s    | Retained output |
| ------------------------------------- | ---------------- | --------------- | --------- | --------------- |
| Arrow `SIN(x) + COS(y) * 2`           | 75.2 ms          | 28.4 ms         | 871,000   | 520 KiB         |
| JavaScript evaluator, predecoded rows | 437.4 ms         | 127.4 ms        | 150,000   | 512 KiB         |
| TRY null recovery, 64 failed rows     | 54.3 ms          | 17.7 ms         | 1,208,000 | 520 KiB         |
| TRY fallback, 64 failed rows          | 74.9 ms          | 26.1 ms         | 875,000   | 520 KiB         |
| TRY null recovery, 16,384 failed rows | 515.9 ms         | 170.1 ms        | 127,000   | 520 KiB         |
| TRY fallback, 16,384 failed rows      | 515.8 ms         | 174.9 ms        | 127,000   | 520 KiB         |

Arrow's retained buffers include 8 KiB of validity bits. The JavaScript baseline also retains 65,536 decoded row objects created before timing; their heap size is not measured here.
