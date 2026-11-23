# @math.gl/sql

A lightweight SQL query engine for Apache Arrow tables. Query tables already in memory, compute columns, and aggregate record batches in JavaScript applications and workers.

The engine accepts native Arrow `Table` and `RecordBatch` objects. Your application loads the data and supplies table names; no database connection or table registration service is needed. The API is experimental and implements a defined SQL subset.

## Install[​](#install "Direct link to Install")

```
npm install @math.gl/sql apache-arrow
```

Apache Arrow 17 or later is required for execution. The `/parser` and `/expressions` entry points can be used without Arrow; it is an optional peer dependency for those uses.

## Package entry points[​](#package-entry-points "Direct link to Package entry points")

| Import path                       | Use it to                                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@math.gl/sql/query`              | Run [queries over Arrow tables](https://visgl.github.io/math.gl/docs/modules/sql/query.md), compute columns, or aggregate record batches.                     |
| `@math.gl/sql/dataframe`          | Wrap Arrow tables with the experimental DataFrame API and select an active GeoArrow field.                                                                            |
| `@math.gl/sql/parser`             | [Parse SQL](https://visgl.github.io/math.gl/docs/modules/sql/parser.md) into expressions, predicates, or queries without executing it.                        |
| `@math.gl/sql/expressions`        | [Evaluate portable expressions](https://visgl.github.io/math.gl/docs/modules/sql/expressions.md) against JavaScript objects.                                  |
| `@math.gl/sql/arrow`              | [Compile expressions and predicates](https://visgl.github.io/math.gl/docs/modules/sql/arrow.md) against an Arrow schema for reuse across batches.             |
| `@math.gl/sql/worker`             | Run structured queries and expressions [off the calling thread](https://visgl.github.io/math.gl/docs/modules/sql/worker.md).                                  |
| `@math.gl/sql/math-functions`     | Register [numeric SQL functions](https://visgl.github.io/math.gl/docs/modules/sql/math-functions.md) such as `SIN` and `SQRT`.                                |
| `@math.gl/sql/geoarrow-functions` | Register [GeoArrow conversions](https://visgl.github.io/math.gl/docs/modules/sql/geoarrow-functions.md) for WKB, specialized native arrays, and dense unions. |
| `@math.gl/sql/color-functions`    | Register [color functions](https://visgl.github.io/math.gl/docs/modules/sql/color-functions.md) for construction, conversion, and mapping.                    |
| `@math.gl/sql/scales`             | [Resolve domains and evaluate scales](https://visgl.github.io/math.gl/docs/modules/sql/scales.md) on Arrow columns.                                           |

Worker bootstrap entry points `@math.gl/sql/worker-entry.js` and `@math.gl/sql/query-worker-entry.js` start their respective worker runtimes. See [Workers](https://visgl.github.io/math.gl/docs/modules/sql/worker.md) for setup. The test-only entry point `@math.gl/sql/scales-conformance` provides shared fixture cases for scale implementations.

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

| Option           | Purpose                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `functions`      | Typed application function declarations, registered for this query.                                                                                                         |
| `signal`         | An `AbortSignal` checked during execution.                                                                                                                                  |
| `parseParameter` | A callback from a named SQL parameter to an expression AST; see [relational parsing](https://visgl.github.io/math.gl/docs/modules/sql/parser.md#relational-select). |

Direct column projections can share input buffers. Filtering, sorting, joins, and computed columns may allocate results. See [query execution](https://visgl.github.io/math.gl/docs/modules/sql/query.md) for structured queries, record-batch streaming, and progressive aggregates.

## Supported SQL[​](#supported-sql "Direct link to Supported SQL")

This table describes the SQL that `queryArrowSQL` executes.

| Capability               | Support and limits                                                                                                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projection and filtering | Columns, aliases, computed expressions, and Boolean `WHERE` expressions.                                                                                                                                                    |
| Joins                    | One inner equality join per SELECT; qualify both join keys with table names or aliases.                                                                                                                                     |
| Table functions          | Standalone `FROM function(...)` and correlated `CROSS JOIN LATERAL` or `LEFT JOIN LATERAL … ON TRUE`. See [table functions](https://visgl.github.io/math.gl/docs/modules/sql/query.md#table-function-declarations). |
| Aggregation              | Column-based `GROUP BY` and top-level aggregate calls such as `SUM(quantity)` and `COUNT(*)`.                                                                                                                               |
| Sorting                  | `ORDER BY` output columns or aliases; stable ordering with nulls last by default.                                                                                                                                           |
| Pagination               | Nonnegative integer `OFFSET` and `LIMIT`.                                                                                                                                                                                   |
| Set operations           | `UNION ALL` with compatible output schemas; trailing sorting and pagination apply to the combined result.                                                                                                                   |
| Typed expressions        | Explicit casts, arithmetic, supported scalar functions, searched CASE, and fixed-size arrays. See [expression conformance](https://visgl.github.io/math.gl/docs/modules/sql/arrow/sql-conformance.md).              |

The executor does not support writes or schema changes, CTEs, subqueries, window functions, `DISTINCT`, `HAVING`, or general SQL dialect compatibility. Catalog commands accepted by `parseSQLQuery`, such as `SHOW SOURCES`, are for applications to handle; they are not executable by `queryArrowSQL`. See [the parser reference](https://visgl.github.io/math.gl/docs/modules/sql/parser.md) for each parser's contract.

## Expand nested collections[​](#expand-nested-collections "Direct link to Expand nested collections")

Experimental [SQL UNNEST](https://visgl.github.io/math.gl/docs/modules/sql/unnest.md) expands List, FixedSizeList and Map columns with CROSS or LEFT joins, output aliases and optional ordinality.

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

See [function packages and column metadata](https://visgl.github.io/math.gl/docs/modules/sql/query.md#function-packages-and-column-metadata) to write scalar, aggregate, and table functions. For functions supplied by other math.gl packages, see [spatial SQL](https://visgl.github.io/math.gl/docs/modules/sql/arrow/spatial-functions.md) and [DGGS function libraries](https://visgl.github.io/math.gl/docs/modules/sql/api-reference/dggs-function-libraries.md).

## Execution choices[​](#execution-choices "Direct link to Execution choices")

* Use `queryArrowSQL` for SQL text over a map of in-memory tables.
* Use `queryArrowTable` when the application already has structured query options.
* Use `queryArrowTableInBatches` for streaming projection, filtering, and pagination.
* Use `queryArrowAggregateSnapshots` for provisional and final aggregate tables.
* Use a [worker session](https://visgl.github.io/math.gl/docs/modules/sql/worker.md) for structured queries off the calling thread.

Streaming queries do not make joins, sorting, or arbitrary relational SQL incremental. The synchronous engine checks cancellation during execution, but a worker is needed to keep long-running work off the UI thread. Registered functions run application code; evaluation is not a security sandbox.

## Work with an Arrow data frame[​](#work-with-an-arrow-data-frame "Direct link to Work with an Arrow data frame")

```
import {GeoDataFrame} from '@math.gl/sql/dataframe';



const parcels = GeoDataFrame.fromArrow(table, {geometry: 'boundary'});

const bounds = parcels.geometry.totalBounds();

const labels = parcels.select('parcel_id', 'label_point').toArrow();
```

`DataFrame.fromArrow(table)` wraps any Arrow table. `GeoDataFrame.fromArrow` infers the active field when the schema has exactly one GeoArrow field. Use `setGeometry(name)` to create a frame with a different active field on the same table. Null and empty geometries contribute no coordinates to `totalBounds()`, which returns null when the active vector has no coordinates. `select(...names)` returns a plain frame with the requested columns and shares their buffers. `toArrow()` returns the wrapped table.

Use `filter(predicate, options)` to keep rows where a SQL expression is true. Use `withColumns({name: expression}, options)` to add or replace attributes. Both methods take named SQL parameters through `options.parameters`.

```
const visible = parcels

  .filter('population >= :minimum', {parameters: {minimum: 1000}})

  .withColumns({radius: 'population * 0.01'})

  .toArrow();
```

Every expression in a `withColumns` call reads the same input table. Existing columns keep their slots and new columns are appended. A GeoDataFrame retains its active geometry through both operations and rejects attempts to overwrite it. Unchanged columns share buffers where batch layout permits. Filters that gather scattered rows may allocate new buffers.

### Filter by viewport[​](#filter-by-viewport "Direct link to Filter by viewport")

Keep the source frame and call `filterViewport` on it as the camera moves. The first query computes row envelopes for the active field. Later queries reuse that cache for the same Arrow table and field.

```
const visible = parcels.filterViewport([175, -20, -175, -10], {

  wrapLongitude: true

});
```

Bounds are `[minX, minY, maxX, maxY]` in the field's stored coordinates. Filtering uses inclusive two-dimensional envelope intersection. Null and empty geometries are skipped, and the result retains source order and active geometry. Planar coordinates are the default. Set `wrapLongitude` for geographic longitude in degrees. Both `[175, -20, -175, -10]` and `[175, -20, 185, -10]` cover the same seam-crossing window. A longitude span of at least 360 degrees covers all longitudes. Each row appears at most once.

The cached envelopes use the coordinate ranges as stored. When a geometry crosses the antimeridian, split it at the seam or store it with continuous longitudes to get a tight envelope.

### Reproject an active geometry[​](#reproject-an-active-geometry "Direct link to Reproject an active geometry")

Use `toCRS` before filtering or displaying a table in a different coordinate reference system. Pass a synchronous projection engine configured for the source and target CRSs. The target is an authority code, such as `EPSG:4326`.

```
import {createProjectionEngine} from '@math.gl/geospatial/projection-core';

import {mercator} from '@math.gl/geospatial/projection-projections-merc';



const engine = createProjectionEngine({projections: [mercator]});

const geographic = parcels.toCRS('EPSG:4326', {engine});
```

The source comes from the active field's GeoArrow CRS metadata. Use `from` to supply the source explicitly. Configure the engine's WKT or PROJJSON parser when the source uses one of those representations.

The method transforms XY vertices of native GeoArrow geometries with planar edges and preserves Z and M values. Lines and polygons retain their vertex topology. Nulls, row order, batches, and the other columns are preserved. The output field declares the target CRS, and its viewport cache is populated in the new coordinate space on first use.

### Join by spatial predicate[​](#join-by-spatial-predicate "Direct link to Join by spatial predicate")

Use `sjoin` to match the active native GeoArrow geometry of two frames in the same coordinate system. Convert WKB or WKT columns to native GeoArrow first. For example, attach region attributes to points inside region polygons.

```
import {ST_WITHIN} from '@math.gl/geospatial/st-functions';



const matched = points.sjoin(regions, {

  predicate: ST_WITHIN,

  rightPrefix: 'region_'

});
```

This is an inner join. Each matching pair produces one row in left input order and then right input order. Overlapping polygons can yield multiple rows for the same point. The result keeps the left active geometry and prefixes all right fields, including the right geometry. Use `select` to keep the columns needed by a layer.

The join searches a box index over the right frame's cached envelopes and checks candidate pairs with the bound spatial SQL predicate. Supported predicates are `ST_WITHIN`, `ST_CONTAINS`, `ST_COVEREDBY`, `ST_COVERS`, and `ST_INTERSECTS`, with the geometry signatures and boundary semantics of each SQL function. For example, use `ST_COVEREDBY` to include points on polygon boundaries. These predicates operate on planar coordinates. Split geometries at the antimeridian before joining across the seam.
