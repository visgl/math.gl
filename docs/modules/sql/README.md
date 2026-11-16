# @math.gl/sql

A lightweight SQL query engine for Apache Arrow tables. Query tables already in memory,
compute columns, and aggregate record batches in JavaScript applications and workers.

The engine accepts native Arrow `Table` and `RecordBatch` objects. Your application loads
the data and supplies table names; no database connection or table registration service is needed.
The API is experimental and implements a defined SQL subset.

## Install

```bash
npm install @math.gl/sql apache-arrow
```

Apache Arrow 17 or later is required for execution. The `/parser` and `/expressions` entry
points can be used without Arrow; it is an optional peer dependency for those uses.

## Run a query

```ts
import {tableFromArrays} from 'apache-arrow';
import {queryArrowSQL} from '@math.gl/sql';

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

`queryArrowSQL(sql, tables, options?)` returns a native Arrow table synchronously. The map
resolves names in `FROM` and `JOIN`. Results retain Arrow types and nulls; integer sums and
counts use Int64. Unknown tables or columns, unsupported syntax, and incompatible types throw.

Direct column projections can share input buffers. Filtering, sorting, joins, and computed
columns may allocate results. See [query execution](queries.md) for structured queries,
record-batch streaming, and progressive aggregates.

## Choose an entry point

| Import | Purpose |
| --- | --- |
| `@math.gl/sql` | Execute SQL or structured queries, replace computed columns, and aggregate tables or streams. |
| [`@math.gl/sql/parser`](parser/README.md) | Parse SQL into expressions, predicates, or query representations without executing it. |
| [`@math.gl/sql/arrow`](arrow/README.md) | Compile expressions and predicates against an Arrow schema. |
| [`@math.gl/sql/worker`](workers.md) | Execute structured queries and expressions in workers. |
| [`@math.gl/sql/math-functions`](math-functions/README.md) | Register typed numeric functions such as `SIN` and `SQRT`. |
| [`@math.gl/sql/color-functions`](color-functions/README.md) | Register color construction, conversion, and mapping functions. |
| [`@math.gl/sql/expressions`](expressions.md) | Parse and evaluate portable expressions against JavaScript objects. |

## Supported SQL

These capabilities describe **`queryArrowSQL`**, rather than every parser entry point.

| Capability | Support and limits |
| --- | --- |
| Projection and filtering | Columns, aliases, computed expressions, and Boolean `WHERE` expressions. |
| Joins | One inner equality join per SELECT; qualify both join keys with table names or aliases. |
| Aggregation | Column-based `GROUP BY` and top-level aggregate calls such as `SUM(quantity)` and `COUNT(*)`. |
| Sorting | `ORDER BY` output columns or aliases; stable ordering with nulls last by default. |
| Pagination | Nonnegative integer `OFFSET` and `LIMIT`. |
| Set operations | `UNION ALL` with compatible output schemas; trailing sorting and pagination apply to the combined result. |
| Typed expressions | Explicit casts, arithmetic, supported scalar functions, searched CASE, and fixed-size arrays. See [expression conformance](arrow/sql-conformance.md). |

The executor does not support writes or schema changes, CTEs, subqueries, window functions,
`DISTINCT`, `HAVING`, or general SQL dialect compatibility. Catalog commands accepted by
`parseSQLQuery`, such as `SHOW SOURCES`, are for applications to handle; they are not executable
by `queryArrowSQL`. See [the parser reference](parser/README.md) for each parser's contract.

## Add functions

Function declarations are explicit and local to a query. Import only the functions you need:

```ts
import {queryArrowSQL} from '@math.gl/sql';
import {SQRT} from '@math.gl/sql/math-functions';

const roots = queryArrowSQL(
  'SELECT SQRT(CAST(quantity AS FLOAT64)) AS root FROM orders',
  new Map([['orders', orders]]),
  {functions: [SQRT]}
);
```

See [typed functions](arrow/README.md#named-table-functions) for application-defined functions
and [color functions](color-functions/README.md) for visualization-oriented queries.
Geospatial and DGGS libraries remain in their owning packages.

## Execution choices

- Use `queryArrowSQL` for SQL text over a map of in-memory tables.
- Use `queryArrowTable` when the application already has structured query options.
- Use `queryArrowTableInBatches` for streaming projection, filtering, and pagination.
- Use `queryArrowAggregateSnapshots` for provisional and final aggregate tables.
- Use a [worker session](workers.md) for structured queries off the calling thread.

Streaming queries do not make joins, sorting, or arbitrary relational SQL incremental.
The synchronous engine checks cancellation during execution, but a worker is needed to keep
long-running work off the UI thread. Registered functions run application code; evaluation
is not a security sandbox.
