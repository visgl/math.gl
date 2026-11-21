# @math.gl/sql

A lightweight SQL query engine for Apache Arrow tables. Query tables already in memory, compute columns, and aggregate record batches in JavaScript applications and workers.

The engine accepts native Arrow `Table` and `RecordBatch` objects. Your application loads the data and supplies table names; no database connection or table registration service is needed. The API is experimental and implements a defined SQL subset.

## Install[​](#install "Direct link to Install")

```
npm install @math.gl/sql apache-arrow
```

Apache Arrow 17 or later is required for execution. The `/parser` and `/expressions` entry points can be used without Arrow; it is an optional peer dependency for those uses.

## Package entry points[​](#package-entry-points "Direct link to Package entry points")

| Import path                    | Use it to                                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@math.gl/sql/query`           | Run [queries over Arrow tables](https://visgl.github.io/math.gl/next/docs/modules/sql/query.md), compute columns, or aggregate record batches.         |
| `@math.gl/sql/parser`          | [Parse SQL](https://visgl.github.io/math.gl/next/docs/modules/sql/parser.md) into expressions, predicates, or queries without executing it.            |
| `@math.gl/sql/expressions`     | [Evaluate portable expressions](https://visgl.github.io/math.gl/next/docs/modules/sql/expressions.md) against JavaScript objects.                      |
| `@math.gl/sql/arrow`           | [Compile expressions and predicates](https://visgl.github.io/math.gl/next/docs/modules/sql/arrow.md) against an Arrow schema for reuse across batches. |
| `@math.gl/sql/worker`          | Run structured queries and expressions [off the calling thread](https://visgl.github.io/math.gl/next/docs/modules/sql/worker.md).                      |
| `@math.gl/sql/math-functions`  | Register [numeric SQL functions](https://visgl.github.io/math.gl/next/docs/modules/sql/math-functions.md) such as `SIN` and `SQRT`.                    |
| `@math.gl/sql/color-functions` | Register [color functions](https://visgl.github.io/math.gl/next/docs/modules/sql/color-functions.md) for construction, conversion, and mapping.        |
| `@math.gl/sql/scales`          | [Parse scale expressions, resolve domains, and evaluate scales](https://visgl.github.io/math.gl/next/docs/modules/sql/scales.md) on Arrow columns.     |

Worker bootstrap entry points `@math.gl/sql/worker-entry.js` and `@math.gl/sql/query-worker-entry.js` start their respective worker runtimes. See [Workers](https://visgl.github.io/math.gl/next/docs/modules/sql/worker.md) for setup. The test-only entry point `@math.gl/sql/scales-conformance` provides shared fixture cases for scale implementations.

## Run a query[​](#run-a-query "Direct link to Run a query")

```
import {tableFromArrays} from 'apache-arrow';

import {queryArrowSQL} from '@math.gl/sql/query';



const orders = tableFromArrays({

  category: ['books', 'games', 'books'],

  quantity: new Int32Array([2, 1, 3])

});



const result = queryArrowSQL(

  `SELECT category, SUM(quantity) AS units

   FROM orders

   GROUP BY category

   ORDER BY units DESC`,

  new Map([['orders', orders]])

);



console.log(result.getChild('category')?.get(0)); // 'books'

console.log(result.getChild('units')?.get(0)); // 5n (Arrow Int64)
```

`queryArrowSQL(sql, tables, options?)` returns a native Arrow table synchronously. The map resolves names in `FROM` and `JOIN`. Results retain Arrow types and nulls; integer sums and counts use Int64. Unknown tables or columns, unsupported syntax, and incompatible types throw.

The optional third argument accepts:

| Option           | Purpose                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `functions`      | Typed application function declarations, registered for this query.                                                                                                                   |
| `signal`         | An `AbortSignal` checked during execution.                                                                                                                                            |
| `parseParameter` | A callback from a named SQL parameter to an expression AST; see [relational parsing](https://visgl.github.io/math.gl/next/docs/modules/sql/parser.md#relational-select). |

Direct column projections can share input buffers. Filtering, sorting, joins, and computed columns may allocate results. See [query execution](https://visgl.github.io/math.gl/next/docs/modules/sql/query.md) for structured queries, record-batch streaming, and progressive aggregates.

## Supported SQL[​](#supported-sql "Direct link to Supported SQL")

This table describes the SQL that `queryArrowSQL` executes.

| Capability               | Support and limits                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projection and filtering | Columns, aliases, computed expressions, and Boolean `WHERE` expressions.                                                                                                                                                              |
| Joins                    | One inner equality join per SELECT; qualify both join keys with table names or aliases.                                                                                                                                               |
| Table functions          | Standalone `FROM function(...)` and correlated `CROSS JOIN LATERAL` or `LEFT JOIN LATERAL … ON TRUE`. See [table functions](https://visgl.github.io/math.gl/next/docs/modules/sql/query.md#table-function-declarations). |
| Aggregation              | Column-based `GROUP BY` and top-level aggregate calls such as `SUM(quantity)` and `COUNT(*)`.                                                                                                                                         |
| Sorting                  | `ORDER BY` output columns or aliases; stable ordering with nulls last by default.                                                                                                                                                     |
| Pagination               | Nonnegative integer `OFFSET` and `LIMIT`.                                                                                                                                                                                             |
| Set operations           | `UNION ALL` with compatible output schemas; trailing sorting and pagination apply to the combined result.                                                                                                                             |
| Typed expressions        | Explicit casts, arithmetic, supported scalar functions, searched CASE, and fixed-size arrays. See [expression conformance](https://visgl.github.io/math.gl/next/docs/modules/sql/arrow/sql-conformance.md).              |

The executor does not support writes or schema changes, CTEs, subqueries, window functions, `DISTINCT`, `HAVING`, or general SQL dialect compatibility. Catalog commands accepted by `parseSQLQuery`, such as `SHOW SOURCES`, are for applications to handle; they are not executable by `queryArrowSQL`. See [the parser reference](https://visgl.github.io/math.gl/next/docs/modules/sql/parser.md) for each parser's contract.

## Expand nested collections[​](#expand-nested-collections "Direct link to Expand nested collections")

Experimental [SQL UNNEST](https://visgl.github.io/math.gl/next/docs/modules/sql/unnest.md) expands List, FixedSizeList and Map columns with CROSS or LEFT joins, output aliases and optional ordinality.

## Add functions[​](#add-functions "Direct link to Add functions")

Function declarations are explicit and local to a query. Import only the functions you need:

```
import {queryArrowSQL} from '@math.gl/sql/query';

import {SQRT} from '@math.gl/sql/math-functions';



const roots = queryArrowSQL(

  'SELECT SQRT(CAST(quantity AS FLOAT64)) AS root FROM orders',

  new Map([['orders', orders]]),

  {functions: [SQRT]}

);
```

See [function packages and column metadata](https://visgl.github.io/math.gl/next/docs/modules/sql/query.md#function-packages-and-column-metadata) to write scalar, aggregate, and table functions. For functions supplied by other math.gl packages, see [spatial SQL](https://visgl.github.io/math.gl/next/docs/modules/sql/arrow/spatial-functions.md) and [DGGS function libraries](https://visgl.github.io/math.gl/next/docs/modules/sql/api-reference/dggs-function-libraries.md).

## Execution choices[​](#execution-choices "Direct link to Execution choices")

* Use `queryArrowSQL` for SQL text over a map of in-memory tables.
* Use `queryArrowTable` when the application already has structured query options.
* Use `queryArrowTableInBatches` for streaming projection, filtering, and pagination.
* Use `queryArrowAggregateSnapshots` for provisional and final aggregate tables.
* Use a [worker session](https://visgl.github.io/math.gl/next/docs/modules/sql/worker.md) for structured queries off the calling thread.

Streaming queries do not make joins, sorting, or arbitrary relational SQL incremental. The synchronous engine checks cancellation during execution, but a worker is needed to keep long-running work off the UI thread. Registered functions run application code; evaluation is not a security sandbox.
