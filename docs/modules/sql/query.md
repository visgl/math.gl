# @math.gl/sql/query

Use the functions exported by `@math.gl/sql/query` to query native Arrow tables and record batches.
Start with the [SQL quick start](README.md), then use this page for structured queries and streaming.

## Query an Arrow table

`queryArrowTable()` runs an in-memory SELECT on a native Apache Arrow table and returns
a native Arrow table. Supply the input table directly. If the SELECT names a source
with `FROM`, the caller resolves that name before invoking the executor.

```ts
import {queryArrowTable} from '@math.gl/sql/query';
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
`join` defaults to an inner equi-join. Set `join.type` to `'left'` to keep unmatched left rows, including rows with null keys. Right output fields are nullable and unmatched rows carry nulls in those fields. Null keys do not match, and duplicate keys produce
all matching pairs. Right column names use the specified prefix. The executor applies
`WHERE` after combining the inputs, then groups and aggregates before sorting and
pagination. Sort keys reference input or grouped columns before SELECT aliases.
Sorting is stable, and nulls sort last by default. Counts and sums of integer columns
use Arrow Int64. Supply these relational operations through query options.

Use `queryArrowSQL(sql, tables)` to run relational SQL directly against a map of named
Arrow tables. Each SELECT supports one `INNER JOIN` or `LEFT JOIN` with an equality
condition or indexed spatial predicate. SQL also supports column-based grouping,
top-level aggregate calls, ordering by output columns, and UNION ALL with matching
output schemas. Trailing ORDER BY, OFFSET, and LIMIT apply to the combined result.
Arrow timestamp columns can be used as ordering and grouping keys. Comparisons
retain the precision of the stored timestamp unit.

```ts
import {queryArrowSQL} from '@math.gl/sql/query';

const totals = queryArrowSQL(
  'SELECT category, SUM(quantity) AS units FROM orders GROUP BY category ORDER BY units DESC',
  new Map([['orders', orders]])
);
```

### Indexed spatial joins

Register `ST_INTERSECTS`, `ST_CONTAINS`, or `ST_DWITHIN` from
`@math.gl/geospatial/st-functions` and use that function directly in the
`ON` clause. Qualify one geometry column from each table and use planar
GeoArrow inputs with compatible CRS metadata. Native GeoArrow and WKB
columns are accepted where supported by the registered predicate.

```sql
SELECT p.id AS observation, z.id AS zone
FROM observations p
LEFT JOIN zones z ON ST_Contains(z.geometry, p.geometry)
```

The join indexes right-side envelopes and evaluates the exact predicate only
for candidate pairs. `ST_DWithin` expands the search by a constant, finite,
nonnegative radius in the input coordinate units. A bound numeric parameter
can supply that radius. Results preserve left row order and then right row
order. A left join emits null right fields for each left row with no match.

#### Table functions

Pass `tableFunctions` to use application-defined sources in `FROM` or an inner join.
Each function accepts one named catalog table and synchronously returns an Arrow
table. Function names are case-insensitive. The returned rows participate in
projection, filtering, and sorting like any other source.

```ts
const trips = queryArrowSQL(
  'SELECT path, timestamps FROM EXPAND_TRIPS(data)',
  new Map([['data', tripDictionary]]),
  {tableFunctions: {expand_trips: expandTripDictionary}}
);
```

`expandTripDictionary` is an application function that resolves the segment
references and returns the assembled trip rows.

For worker execution, see [Workers](worker.md).

### Preparing a projection for multiple inputs

Use `getProjectionColumns` from `@math.gl/sql/expressions` to identify the source
columns required by a SELECT list before opening the data source. Use
`prepareArrowProjection` from `@math.gl/sql/query` to bind that SELECT list to
the source schema once and inspect the output schema before reading any batches.

```ts
import {getProjectionColumns} from '@math.gl/sql/expressions';
import {prepareArrowProjection} from '@math.gl/sql/query';

const selections = [{column: 'temperature', as: 'value'}];
const dependencies = getProjectionColumns(selections); // ['temperature']
const projection = prepareArrowProjection(inputSchema, selections);
const output = projection.projectTable(inputTable);
```

`projection.projectBatch(batch)` returns the output batches for a single input
batch. Computed vectors can introduce additional chunk boundaries. Uncomputed
columns share the input buffers.

### Querying a stream of record batches

`queryArrowTableInBatches(batches, schema, query)` applies the same schema-bound
WHERE and SELECT as `queryArrowTable` to an iterable or async iterable of
Arrow record batches. OFFSET and LIMIT apply across the stream, and reaching
the limit closes the input iterator. Supply the schema up front, including
for empty inputs. Grouping, sorting, joins and unions use the table engine.

```ts
import {queryArrowTableInBatches} from '@math.gl/sql/query';

for await (const batch of queryArrowTableInBatches(inputBatches, schema, {
  select: [{column: 'value', as: 'measurement'}],
  limit: 1000
})) {
  consume(batch);
}
```

Set `emitEmptyBatches: true` to keep a schema-bearing batch with its input
batch metadata when filtering or pagination leaves no rows in an input batch.
Empty batches do not consume the row limit. The option defaults to false.

### Progressive aggregate snapshots

`queryArrowAggregateSnapshots(batches, schema, options)` applies an optional
linear query before accumulating scalar aggregates or grouping by one source
column. Each snapshot contains an independent Arrow table, the number of
rows processed, and a `final` flag. Set `emitEveryBatches` to control provisional
snapshots. A final snapshot is emitted even when the stream is empty.

## Replace Arrow columns

`replaceArrowColumns(table, replacements, {functions})` returns a table with computed
columns in their original positions. Each replacement has an `as` field naming an
existing column and an `expression` field. Use each name at most once. All expressions
read the original table. The computed field supplies the output type and metadata.

In SQL, write an explicit select list and alias the expression to the desired column
name. For a table with `id` and `value` columns:

```sql
SELECT id, value + 1 AS value FROM data
```

## Scalar aggregates

Compile named reductions against a schema, then update the same accumulator as Arrow batches
arrive. Each call to `result()` returns a snapshot of the current scalar values.

```ts
import {compileArrowAggregates} from '@math.gl/sql/query';

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
aggregate changes. This API produces scalar results through Arrow expressions. For SQL aggregate calls, use `queryArrowSQL` from `@math.gl/sql/query`.

### Grouped accumulators

Call `plan.createGroupedAccumulator('region')` to run the same reductions independently for
each scalar key. Update it with the original Arrow batches. The plan evaluates the grouping
expression and shared reduction expressions against each batch, without copying rows into
separate Arrow tables.

`result()` returns a detached map from key to aggregate values in first-seen order. Null keys form
one group. Supported keys include strings, booleans, integers, and finite floating-point values.
Each successful batch commits its changes together. An expression error or cancellation preserves
the previous result.


## Function packages and column metadata

The `functions` option accepts individual declarations and nested readonly arrays.
Pass exported packages directly to reuse them across calls.

```ts
import {tableFromArrays} from 'apache-arrow';
import {queryArrowSQLWithMetadata} from '@math.gl/sql/query';
import {POSTGIS_SPATIAL_FUNCTIONS} from '@math.gl/geospatial/st-functions';
import {VISUALIZATION_FUNCTIONS} from '@math.gl/sql/scales';

const tables = new Map([['observations', tableFromArrays({value: [0, 2, 6, 8]})]]);
const {table, columnMetadata} = queryArrowSQLWithMetadata(
  "SELECT value, SCALE_COLOR(value, DOMAIN(value), PALETTE('Blues')) AS color " +
    "FROM observations WHERE value > 0 ORDER BY value LIMIT 2",
  tables,
  {functions: [POSTGIS_SPATIAL_FUNCTIONS, VISUALIZATION_FUNCTIONS]}
);
const scale = columnMetadata.color?.find(entry => entry.kind === 'scale')?.scale;
// The table has two rows. The scale domain is [2, 8], including the filtered row beyond LIMIT.
```

The returned scale is the same `ResolvedScale` that generated the color column.
Use its descriptor to build a legend. Each output column has an ordered list of
metadata entries. A column without metadata has an empty list. Entries in a
conditional expression describe all the bound calls, including calls in branches
that some rows skip. A `UNION ALL` combines entries by output position in branch
order and uses the first branch's column names.

Use `queryArrowSQL` when you only need the table. A prepared scalar declaration
uses a flat object with `kind: 'scalar'`, a SQL `name`, and a `prepare` method.
Use `satisfies ScalarFunction<MyMetadata>` to check the declaration and retain the
metadata type. Preparation can inspect the filtered input table and return a
rewritten expression, generated scalar declarations, and one metadata entry.

### Package transforms in a deck.gl example

Export example-specific transforms from the example module and register the
package with the rest of its SQL functions. The descriptor can close over
example configuration or a geometry kernel. Its Arrow evaluator can reuse
existing vectors and receives a mask for the rows it should evaluate.

```ts
import {Field, Float64, vectorFromArray} from 'apache-arrow';
import type {ScalarFunction} from '@math.gl/sql/arrow';

const float = new Float64();

const HEIGHT_OFFSET = {
  kind: 'scalar',
  name: 'HEIGHT_OFFSET',
  prototypes: [{
    arguments: [new Field('height', float, true), new Field('offset', float, true)],
    result: new Field('elevation', float, true),
    evaluate([heights, offsets], {length, activeRows}) {
      return vectorFromArray(Array.from({length}, (_, row) =>
        activeRows[row] ? Number(heights!.get(row)) + Number(offsets!.get(row)) : null
      ), float);
    }
  }]
} satisfies ScalarFunction;

export const EXAMPLE_TRANSFORMS = [HEIGHT_OFFSET] as const;
```

Pass the example's Arrow table as `features` and bind `offset` from a UI control.
The transform composes with the built-in scale and the result carries the
resolved scale metadata for a legend.

```ts
import {queryArrowSQLWithMetadata} from '@math.gl/sql/query';
import {VISUALIZATION_FUNCTIONS} from '@math.gl/sql/scales';

const {table, columnMetadata} = queryArrowSQLWithMetadata(
  `SELECT SCALE_LINEAR(HEIGHT_OFFSET(height, :offset), DOMAIN(0, 100), RANGE(0, 200))
     AS elevation FROM features`,
  new Map([['features', features]]),
  {
    functions: [EXAMPLE_TRANSFORMS, VISUALIZATION_FUNCTIONS],
    parameters: {offset}
  }
);
```

Use the `elevation` column for the layer's elevation accessor and
`columnMetadata.elevation` for the legend.
For transforms whose signature depends on a source field, provide
`resolvePrototype(fields)` to declare the input and output schema at bind time.

### Aggregate function declarations

Aggregate calls can appear inside grouped projections, such as
`SELECT category, MAX(value) - MIN(value) AS extent FROM observations GROUP BY category`.
The planner computes the reductions first, then evaluates each surrounding expression over the
group keys and reduction results. Aggregate calls require projection scope. Nesting one aggregate
inside another and referring to ungrouped input columns in grouped expressions are SQL errors.

A flat declaration can bind an aggregate against its Arrow argument fields:

```ts
import {Field, Float64} from 'apache-arrow';
import type {AggregateFunction} from '@math.gl/sql/arrow';

const SUM_SQUARES = {
  kind: 'aggregate',
  name: 'SUM_SQUARES',
  bind({arguments: fields}) {
    if (fields.length !== 1) throw new Error('SUM_SQUARES requires one argument');
    return {
      outputField: new Field('sum_squares', new Float64(), false),
      createAccumulator() {
        let total = 0;
        return {
          update([values]) {
            for (const value of values!) {
              if (value !== null) total += Number(value) ** 2;
            }
          },
          finalize: () => total
        };
      }
    };
  }
} satisfies AggregateFunction;
```

Custom aggregates can return nested arrays for Arrow List result fields.
Set `argumentCount` when an aggregate shares its SQL name with a scalar
function of a different arity.

Register this declaration through `functions` and use `SUM_SQUARES(value)` in a
projection. The query creates one accumulator per group. The accumulator defines
null handling and the result for an empty input. An aggregate can also emit
metadata at binding, which is available on its projected output column.

### Table function declarations

A standalone table function receives a named catalog table. Declare the output
schema during binding and evaluate against that input. The SQL engine validates
the returned schema.

```ts
import type {TableFunction} from '@math.gl/sql/arrow';

const COPY_ROWS = {
  kind: 'table',
  name: 'COPY_ROWS',
  bind(inputSchema) {
    return {
      outputSchema: inputSchema,
      evaluate: input => input
    };
  }
} satisfies TableFunction;
```

Register `COPY_ROWS` through `functions` and use `SELECT * FROM COPY_ROWS(input)`.
The legacy `tableFunctions` map still supports synchronous table transforms.
A descriptor can attach typed metadata to named output fields. Direct SELECT
projections carry those entries forward under the final output aliases.

A correlated descriptor implements `bindLateral` for a single input column.
Its evaluator returns a table and one parent row index per output row. Parent
positions must be nondecreasing. Use
`CROSS JOIN LATERAL NAME(source.column) AS alias(output)` to emit the matching
rows. `LEFT JOIN LATERAL ... ON TRUE` retains unmatched parents and fills the
function columns with nulls. The built-in `UNNEST` uses the same lateral
execution path and is available without registration.
