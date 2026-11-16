# SQL catalog (experimental)

`SQLCatalog` names Arrow tables and lazy sources so an application can reuse them across
queries. It also exposes schemas for discovery and UI panels. **This API is experimental
and may change.** Import it from `@math.gl/sql`; no additional package is required.

## Start with two tables

```ts
import {tableFromArrays} from 'apache-arrow';
import {SQLCatalog} from '@math.gl/sql';

const trips = tableFromArrays({zone_id: new Int32Array([1, 2]), speed: [10, 20]});
const zones = tableFromArrays({id: new Int32Array([1, 2]), name: ['south', 'north']});
const catalog = new SQLCatalog({tables: {trips, zones}, primaryTable: 'trips'});

const result = catalog.query(`
  SELECT t.speed, z.name
  FROM data.trips t JOIN data.zones z ON t.zone_id = z.id
`);
const fastTrips = catalog.query('SELECT speed WHERE speed > 10');
```

`data` is the default SQL schema (namespace). Unqualified names resolve there. Explicit
`FROM` overrides the primary table. A primary table is never inferred: without one,
`SELECT 1 AS value` returns one row, while `SELECT speed` and `SELECT *` require a source.
With a primary table, `SELECT 1 AS value` produces one row per input row.

The catalog uses the same executor as `queryArrowSQL`: one inner equality join per SELECT
and compatible-schema `UNION ALL` are currently supported. Multiple/outer joins, CTEs,
`UNION DISTINCT`, `INTERSECT` and `EXCEPT` are not yet supported. See the
[SQL support matrix](README.md#supported-sql). Catalogs are not passed directly to worker
or streaming query APIs; resolve an Arrow table and use those APIs separately.

## Supply table definitions

Applications, loaders.gl adapters and deck.gl integrations can supply definitions:

```ts
import type {SQLTableDefinition} from '@math.gl/sql';

const definitions: SQLTableDefinition[] = [
  {name: 'trips', source: trips, arrowSchema: trips.schema, description: 'Trip observations'},
  {schema: 'lookup', name: 'zones', source: zones}
];
const catalog = new SQLCatalog({tables: definitions, primaryTable: 'trips'});
```

Definitions separate registration from execution. `source` is a native Arrow `Table` or
an object with `read()` and optional `getSchema()`. `arrowSchema` describes the Arrow
fields; `schema` names the SQL namespace. Registration copies the definition envelope;
Arrow objects and providers remain caller-owned and should not be mutated during a query.

A string name is always literal: `'a.b'` names a table containing a dot in the default
schema. Use `{schema: 'a', name: 'b'}` in catalog methods to address another namespace.
In SQL, `a.b` is qualified; `"a.b"` is a single name. Names are case-sensitive, including
unquoted names, matching the existing table-map API. Quote spaces, punctuation and reserved
words; escape a double quote by doubling it. Use aliases for column qualification, for
example `FROM lookup.zones z` followed by `z.name`.

## Load an external source

```ts
import {tableFromIPC} from 'apache-arrow';

catalog.registerTable({
  name: 'remote_trips',
  description: 'Arrow IPC file',
  source: {
    async read({signal}) {
      const response = await fetch('/trips.arrow', {signal});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return tableFromIPC(new Uint8Array(await response.arrayBuffer()));
    }
  }
});

const result = await catalog.queryAsync('SELECT * FROM remote_trips LIMIT 10');
```

Only referenced sources are read, once per query even for a self-join or repeated UNION
input. Each query captures its registrations before the first asynchronous operation.
Changes to registrations affect subsequent queries. Reads are sequential and materialize
whole tables; `LIMIT` does not limit downloads. There is no pushdown, persistent cache or
cross-source transactional snapshot. Wrap the provider if the application needs caching.

Supply `arrowSchema` or `getSchema({signal})` when types are available before loading rows.
Queries validate the materialized table's field order, names, types and nullability against
that schema. `getSchema()` may be called for each query; metadata inspection does not cache
its result. `query()` rejects external inputs and directs callers to `queryAsync()`.

Pass `{signal}` to cancel a query. Providers must cooperate with cancellation; the catalog
also checks before and after reads. Source errors retain their original `cause` and include
the SQL table name.

### Integrating loaders.gl and deck.gl

Keep format detection, authentication, loader options, connection lifetime and cache policy
in the integration. math.gl does not import loaders.gl, deck.gl or DuckDB. A loader adapter
can expose `read: ({signal}) => loadAsArrow(url, {signal})`; a renderer can supply the Arrow
table it already holds. Both can include `arrowSchema` and `description` for panels.

For a DuckDB connection, wrap the application's existing Arrow-producing operation:

```ts
// readDuckDBTable and describeDuckDBTable are application adapter functions.
// They own connection use, cancellation and conversion to native Arrow objects.
catalog.registerTable({
  schema: 'analytics',
  name: 'trips',
  source: {
    read: ({signal}) => readDuckDBTable({signal}),
    getSchema: ({signal}) => describeDuckDBTable({signal})
  }
});
```

These callbacks are not math.gl or DuckDB API names. Bind the intended table in the adapter;
do not concatenate arbitrary catalog names into remote SQL.

## Discover tables and types

```ts
catalog.listSchemas();                 // ['data', 'lookup', ...]
catalog.listTables();                  // Metadata across all schemas; no I/O
catalog.describeTable('trips');        // Known Arrow schema and resident row count
await catalog.describeTableAsync('remote_trips'); // Optional getSchema(), never read()

catalog.query('SHOW SCHEMAS');
catalog.query('SHOW TABLES');           // Tables in the default schema
catalog.query('SHOW TABLES FROM lookup');
catalog.query('DESCRIBE data.trips');
```

`listTables()` and `describeTable()` never call the source. `describeTableAsync()` calls
`getSchema()` only when no schema was supplied. If neither is available, its `arrowSchema`
remains undefined. SQL `DESCRIBE` requires known types; use `queryAsync('DESCRIBE ...')`
to request an external schema. It never falls back to downloading rows.

The structured API preserves nested Arrow fields, dictionaries and schema/field metadata
for panels. SQL `DESCRIBE` returns top-level columns and type strings. Metadata result
columns have stable types, including empty results:

| Command | Result columns |
| --- | --- |
| `SHOW SCHEMAS` | `schema_name: Utf8` |
| `SHOW TABLES [FROM schema]` | `schema_name: Utf8`, `table_name: Utf8` |
| `DESCRIBE [schema.]table` | `column_name: Utf8`, `data_type: Utf8`, `is_nullable: Bool` |

## API reference

| API | Behavior |
| --- | --- |
| `new SQLCatalog({tables?, defaultSchema?, primaryTable?})` | `tables` accepts definitions, a Map, or an object. `defaultSchema` defaults to `data`; `data` always exists. |
| `registerSchema(schema)` | Adds an empty namespace; existing namespaces are unchanged. |
| `registerTable(definition, {replace?})` | Adds a definition and its namespace. Duplicate identities throw unless `replace: true`. |
| `removeTable(name)` | Returns whether a definition was removed; clears its primary designation. Does not close external resources. |
| `setPrimaryTable(name?)` | Selects a registered table, or clears the primary selection. |
| `subscribe(listener)` | Notifies after registration, removal or primary changes; returns an unsubscribe callback. Listeners should not throw. |
| `listSchemas()` | Returns names in registration order. |
| `listTables({schema?})` | Lists all namespaces by default; an unknown explicit namespace throws. |
| `describeTable(name)` | Returns metadata or throws for an unknown table. |
| `describeTableAsync(name, {signal?})` | Optionally obtains physical types without loading rows. |
| `query(sql, options?)` | Returns an Arrow Table synchronously. |
| `queryAsync(sql, options?)` | Returns a Promise of an Arrow Table; resolves external inputs. |

Query options are `signal`, `functions`, and `parseParameter`, as in `queryArrowSQL`.
`SQLTableName` is a literal string or `{schema, name}`. `SQLTableInfo` contains `name`,
`schema`, `description?`, `arrowSchema?`, `external`, `primary`, and resident-only `numRows?`.
It is a metadata envelope, not a loading-state store. Panel integrations own pending/error
state and can subscribe to definition changes. Refresh external metadata by explicitly
calling `describeTableAsync()` again.
