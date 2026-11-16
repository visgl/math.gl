# Query execution

Use the functions exported by `@math.gl/sql` to query native Arrow tables and record batches.
Start with the [SQL quick start](README.md), then use this page for structured queries and streaming.

## Query an Arrow table

`queryArrowTable()` runs an in-memory SELECT on a native Apache Arrow table and returns
a native Arrow table. Supply the input table directly. If the SELECT names a source
with `FROM`, the caller resolves that name before invoking the executor.

```ts
import {queryArrowTable} from '@math.gl/sql';
import {parseSQLQuery} from '@math.gl/sql/parser';

const query = parseSQLQuery(
  'SELECT id, price * quantity AS total FROM orders WHERE quantity > 0 LIMIT 100'
);
if ('command' in query) throw new Error('Expected SELECT');
const result = queryArrowTable(orders, query);
```

Queries can project and alias existing fields, evaluate computed columns, filter with
SQL Boolean and null semantics, and apply `OFFSET` and `LIMIT` in source order.
Computed columns read the filtered source columns. Output aliases only name result
fields. Unaliased computed fields receive unique names based on their SELECT position.
Direct projections share Arrow buffers when rows need no gathering. Computed
types and error behavior follow the Arrow expression compiler.

For relational queries, pass native Arrow inputs and structured options:

```ts
const totals = queryArrowTable(orders, {
  union: [moreOrders],
  join: {table: products, left: 'product_id', right: 'id', rightPrefix: 'product.'},
  groupBy: ['product.category'],
  aggregates: {
    units: {operation: 'SUM', expression: 'quantity'},
    orders: {operation: 'COUNT'}
  },
  orderBy: [{column: 'units', direction: 'desc'}],
  limit: 10
});
```

`union` appends schema-compatible tables in input order, retaining duplicates.
`join` performs an inner equi-join. Null keys do not match, and duplicate keys produce
all matching pairs. Right column names use the specified prefix. The executor applies
`WHERE` after combining the inputs, then groups and aggregates before sorting and
pagination. Sort keys reference input or grouped columns before SELECT aliases.
Sorting is stable, and nulls sort last by default. Counts and sums of integer columns
use Arrow Int64. Supply these relational operations through query options.

Use `queryArrowSQL(sql, tables)` to run relational SQL directly against a map of named
Arrow tables. It supports one inner equality join per SELECT, column-based grouping,
top-level aggregate calls, ordering by output columns, and UNION ALL with matching
output schemas. Trailing ORDER BY, OFFSET, and LIMIT apply to the combined result.

```ts
import {queryArrowSQL} from '@math.gl/sql';

const totals = queryArrowSQL(
  'SELECT category, SUM(quantity) AS units FROM orders GROUP BY category ORDER BY units DESC',
  new Map([['orders', orders]])
);
```

For worker execution, see [Workers](workers.md).

### Querying a stream of record batches

`queryArrowTableInBatches(batches, schema, query)` applies the same schema-bound
WHERE and SELECT as `queryArrowTable` to an iterable or async iterable of
Arrow record batches. OFFSET and LIMIT apply across the stream, and reaching
the limit closes the input iterator. Supply the schema up front, including
for empty inputs. Grouping, sorting, joins and unions use the table engine.

```ts
import {queryArrowTableInBatches} from '@math.gl/sql';

for await (const batch of queryArrowTableInBatches(inputBatches, schema, {
  select: [{column: 'value', as: 'measurement'}],
  limit: 1000
})) {
  consume(batch);
}
```

### Progressive aggregate snapshots

`queryArrowAggregateSnapshots(batches, schema, options)` applies an optional
linear query before accumulating scalar aggregates or grouping by one source
column. Each snapshot contains an independent Arrow table, the number of
rows processed, and a `final` flag. Set `emitEveryBatches` to control provisional
snapshots. A final snapshot is emitted even when the stream is empty.

Set `emitEmptyBatches: true` to keep a schema-bearing batch with its input
batch metadata when filtering or pagination leaves no rows in an input batch.
Empty batches do not consume the row limit. The option defaults to false.

## Scalar aggregates

Compile named reductions against a schema, then update the same accumulator as Arrow batches
arrive. Each call to `result()` returns a snapshot of the current scalar values.

```ts
import {compileArrowAggregates} from '@math.gl/sql';

const plan = compileArrowAggregates({
  rows: {operation: 'COUNT'},
  revenue: {operation: 'SUM', expression: 'price * quantity'},
  average: {operation: 'AVG', expression: 'price * quantity'}
}, {inputSchema: schema});

const state = plan.createAccumulator();
for await (const batch of batches) {
  state.update(batch);
  console.log(state.result());
}
```

Use `plan.evaluate(table)` for a complete Arrow table or `await plan.evaluateInBatches(batches)`
for the final result of a stream. Use `state.merge(partial)` to add another accumulator from the
same plan. Repeated expression strings or shared AST objects are evaluated once per batch.
`SUM` and `AVG` share a sum and non-null count, so batches contribute in proportion to their
valid row counts.

| Operation | Input | Result |
| --- | --- | --- |
| `COUNT` | Omit the expression for all rows, or provide an expression to count non-null values | Exact `bigint` |
| `SUM` | Numeric | Exact `bigint` for integer input, otherwise a Float64 number |
| `AVG` | Numeric | Float64 number |
| `MIN`, `MAX` | Numeric or UTF-8 | Input scalar type, with binary ordering for UTF-8 |
| `EVERY`, `BOOL_AND`, `BOOL_OR` | Boolean | Boolean |
| `BIT_AND`, `BIT_OR`, `BIT_XOR` | Integer | Number for up to 32 bits, `bigint` for 64 bits |

All expression forms skip nulls. Empty or all-null input yields `0n` for counts and `null` for
other reductions. Floating sums and averages use Float64 arithmetic, so rounding can vary with
batch boundaries and merge order. IEEE infinities and NaNs can propagate. Integer averages
convert the exact sum and count to Float64 before dividing.

A running aggregate may change when a batch arrives. If you use it to compute another output
such as a row's share of the total, wait for the final result or recompute that output when its
aggregate changes. This API produces scalar results through Arrow expressions. For SQL aggregate calls, use `queryArrowSQL` from the package root.

### Grouped accumulators

Call `plan.createGroupedAccumulator('region')` to run the same reductions independently for
each scalar key. Update it with the original Arrow batches. The plan evaluates the grouping
expression and shared reduction expressions against each batch, without copying rows into
separate Arrow tables.

`result()` returns a detached map from key to aggregate values in first-seen order. Null keys form
one group. Supported keys include strings, booleans, integers, and finite floating-point values.
Each successful batch commits its changes together. An expression error or cancellation preserves
the previous result.

