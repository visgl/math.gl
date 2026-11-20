# UNNEST (experimental)

`UNNEST` expands a list or map column into rows. Each element produces one output
row with the parent columns repeated. Use it through `queryArrowSQL` from
`@math.gl/sql` to filter or aggregate nested observations in a single query.

## Expand a list

```ts
import {Field, Int32, List, Table, vectorFromArray} from 'apache-arrow';
import {queryArrowSQL} from '@math.gl/sql/query';

const observations = new Table({
  station: vectorFromArray(['A', 'B', 'C']),
  readings: vectorFromArray([[10, 20], [], null],
    new List(new Field('reading', new Int32(), true)))
});
const result = queryArrowSQL(`
  SELECT s.station, r.value, r.position
  FROM observations s
  CROSS JOIN UNNEST(s.readings) WITH ORDINALITY AS r(value, position)
  WHERE r.value >= 10
`, new Map([['observations', observations]]));
```

The result has two rows, both for station A. Their values are 10 and 20 and their
positions are 1 and 2. Projected child columns are named `r.value` and `r.position`.
Use `AS` in SELECT to choose different result names.

`UNNEST` evaluates its column reference for each parent row. The reference may be
unqualified or qualified by the parent table's alias. The output alias and its
parenthesized column names are required. Quoted identifiers follow the ordinary
SQL identifier rules.

## Preserve empty and null collections

A cross join emits no rows for an empty or null collection. A null element inside
a nonempty list emits a row with a null value and its original position.

Use a left join to keep every parent:

```sql
SELECT s.station, r.value, r.position
FROM observations s
LEFT JOIN UNNEST(s.readings) WITH ORDINALITY AS r(value, position) ON TRUE
```

Stations B and C each produce one row with null value and position. Position is
one-based and restarts for each parent. It records input order before filtering.
Without `ORDER BY`, applications should not rely on final SQL result ordering.

## Maps and nested values

For an Arrow Map, supply two aliases in key/value order:

```sql
SELECT c.county, f.destination, f.count
FROM counties c
CROSS JOIN UNNEST(c.flows) AS f(destination, count)
WHERE f.count >= 50
```

Map keys retain their Arrow type. Add `WITH ORDINALITY` and a third alias to obtain
the one-based map entry position. Map entry order follows the stored Arrow data.

List values retain their Arrow element type, including structs. For a list of
structs, name the element and access its fields:

```sql
SELECT c.county, f.item.destination, f.item.count
FROM counties c
CROSS JOIN UNNEST(c.flows) AS f(item)
```

A standalone struct column is accessed through its fields and is rejected as an
UNNEST input. Supported collections are Arrow List, FixedSizeList, and Map.

## Filter and aggregate

Expanded columns participate in the existing SELECT, WHERE, GROUP BY, ORDER BY,
LIMIT and UNION ALL operations:

```sql
SELECT f.destination AS destination, SUM(f.count) AS total
FROM counties c
CROSS JOIN UNNEST(c.flows) AS f(destination, count)
GROUP BY f.destination
ORDER BY total DESC
```

`COUNT(*)` counts expanded rows, including null elements and the placeholder rows
from a left join. `COUNT(f.count)` counts only non-null values.

## Supported syntax and execution limits

```sql
CROSS JOIN UNNEST(parent.column) AS alias(value)
CROSS JOIN UNNEST(parent.column) WITH ORDINALITY AS alias(value, position)
LEFT JOIN UNNEST(parent.column) AS alias(value) ON TRUE
```

For maps, insert the key alias before the value alias. A left join requires
`ON TRUE`. Other ON predicates, computed collection arguments, standalone UNNEST
in FROM, multiple expansions, and combining expansion with another join in the
same SELECT are currently unsupported and rejected. Register a query result as a
named table to perform a subsequent join in another query.

Expansion currently materializes a complete Arrow table before filtering and
pagination. Parent columns are repeated, so a large collection can produce a large
result even with LIMIT. Cancellation uses the query's `signal` option. Child types
and field metadata are retained. Output names must be unique, including names
formed from the expansion alias and output column names.

The implementation helper is internal. SQL is the public expansion API. The
catalog work can reuse this relational operation when integrated with execution.
