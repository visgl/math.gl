# @math.gl/core/sql 🧪

An optional SQL parser that converts a small SQL subset into portable query and predicate objects.
Import it from `@math.gl/core/sql`; it is not exported from the core root.
The parser describes queries. A separate execution engine supplies data and evaluates them.

## Submodule features

| Feature                                   | Support | Notes                                                                                                                                                      |
| ----------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query parsing                             | ✅      | `parseSQLQuery()` parses SELECT statements and supported catalog commands.                                                                                 |
| Structural-only parsing                   | ✅      | `parseSQLSelect()` parses projection, source references, and limits without the built-in predicate parser. Supply `parseWhere` to enable WHERE.            |
| Standalone predicate parsing              | ✅      | `parseSQLPredicate()` parses the expression after WHERE.                                                                                                   |
| Named parameter binding                   | ✅      | Predicate parsing can bind values immediately or preserve parameter references for `bindSQLPredicate()`.                                                   |
| Predicate validation                      | ✅      | `validateSQLPredicate()`, `isSQLPredicate()`, and `SQL_PREDICATE_JSON_SCHEMA` validate portable predicates. The JSON Schema covers JSON-compatible values. |
| Portable TypeScript types                 | ✅      | Query, selection, table reference, catalog command, and predicate types contain no data sources or execution controls.                                     |
| Optional, tree-shakeable imports          | ✅      | Separate core subpath; structural parsing does not require the built-in predicate parser.                                                                  |
| Bounded parsing                           | ✅      | Input size, token count, and predicate nesting limits reject oversized input.                                                                              |
| Query execution and source discovery      | ❌      | Supplied by the consuming application, not this parser.                                                                                                    |
| Arrow integration or database connections | ❌      | No Arrow, loaders.gl, or database dependency.                                                                                                              |
| General-purpose SQL AST                   | ❌      | Output represents the supported query subset, not arbitrary SQL programs.                                                                                  |

## SQL syntax features

✅ Supported · ⚠️ Restricted · ❌ Unsupported. These statuses describe the built-in parser.
An injected WHERE parser can define a different predicate language.

| SQL feature                           | Support | Syntax and limitations                                                                                                                            |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Column projection                     | ✅      | `SELECT city, population` or `SELECT *`.                                                                                                          |
| Column aliases                        | ✅      | `SELECT city AS name`; explicit `AS` is required.                                                                                                 |
| Source and table references           | ✅      | `FROM cities` or `FROM warehouse.cities`; FROM is optional.                                                                                       |
| Quoted identifiers                    | ✅      | Double quotes, including doubled quote escapes: `"city""name"`. Identifier case is preserved.                                                     |
| Keywords and statement terminator     | ✅      | Case-insensitive keywords and one optional trailing semicolon.                                                                                    |
| Comparisons                           | ⚠️      | A source column compared with a scalar: `=`, `!=`, `<>`, `<`, `<=`, `>`, `>=`. No column-to-column comparisons.                                   |
| Boolean predicates                    | ✅      | `AND`, `OR`, `NOT`, and parentheses.                                                                                                              |
| Membership                            | ✅      | `IN (...)` and `NOT IN (...)` with a nonempty list of scalar values.                                                                              |
| Null tests                            | ✅      | `IS NULL` and `IS NOT NULL`; comparisons such as `= NULL` are rejected.                                                                           |
| Scalar literals                       | ✅      | Numbers, single-quoted strings with doubled quote escapes, and Boolean values. Use null tests rather than NULL literals.                          |
| Named parameters                      | ⚠️      | `:name` in `parseSQLPredicate()`, with supplied values or preserved references. Use an injected WHERE parser for parameterized SELECT statements. |
| Row limit                             | ✅      | `LIMIT` followed by a nonnegative safe integer, including zero.                                                                                   |
| Catalog commands                      | ✅      | `SHOW SOURCES`, `SHOW TABLES [FROM source]`, and `DESCRIBE source[.table]`. `SHOW SOURCES` is a parser-specific command.                          |
| Qualified column names                | ❌      | `SELECT table.column` and qualified WHERE columns in `parseSQLQuery()` are rejected. Quote literal column names containing dots.                  |
| Computed columns and function calls   | ❌      | No arithmetic, SQL functions, `CASE`, or function-valued SELECT expressions.                                                                      |
| Additional predicate operators        | ❌      | No `LIKE`, `ILIKE`, `BETWEEN`, regular expressions, or `EXISTS`.                                                                                  |
| Sorting and pagination                | ❌      | No `ORDER BY`, `OFFSET`, or `FETCH`.                                                                                                              |
| Aggregation and distinct rows         | ❌      | No aggregate functions, `GROUP BY`, `HAVING`, or `DISTINCT`.                                                                                      |
| Joins and nested queries              | ❌      | No joins, subqueries, CTEs (`WITH`), or set operations such as `UNION`.                                                                           |
| Table aliases and qualified wildcards | ❌      | No `FROM cities AS c` or `SELECT c.*`.                                                                                                            |
| Window functions                      | ❌      | No `OVER` or window definitions.                                                                                                                  |
| Data and schema changes               | ❌      | No `INSERT`, `UPDATE`, `DELETE`, `CREATE`, or other mutation statements.                                                                          |
| Comments and scripts                  | ❌      | No SQL comments or multiple statements.                                                                                                           |

## Usage

```ts
import { parseSQLQuery } from "@math.gl/core/sql";

const query = parseSQLQuery(
  "SELECT city AS name, population FROM warehouse.cities WHERE population >= 100000 LIMIT 10",
);
```

WHERE references source column names, before projection aliases are applied.
For example, use `WHERE city = 'Paris'`, not the output alias `name`.

For structural parsing with an explicitly supplied predicate parser:

```ts
import { parseSQLSelect, parseSQLPredicate } from "@math.gl/core/sql";

const query = parseSQLSelect("SELECT city WHERE population >= :minimum", {
  parseWhere: (expression) =>
    parseSQLPredicate(expression, {
      parameters: { minimum: 100000 },
    }),
});
```

Importing only `parseSQLSelect` lets a tree-shaking bundler omit the built-in predicate parser.
Without `parseWhere`, this function rejects statements containing WHERE.

## Parameters and validation

Preserve parameter references when a predicate will be reused with different values:

```ts
import { parseSQLPredicate, bindSQLPredicate } from "@math.gl/core/sql";

const predicate = parseSQLPredicate("population >= :minimum", {
  preserveParameters: true,
});
const bound = bindSQLPredicate(predicate, { minimum: 100000 });
```

Binding returns a new predicate without modifying the template. Missing parameters and unsupported
values throw. Runtime predicates support `bigint`, `Date`, and `Uint8Array` values in addition to
JSON scalars; the exported JSON Schema describes only the JSON-compatible representation.
`validateSQLPredicate()` throws on invalid predicates; `isSQLPredicate()` returns a Boolean.

Statements and standalone predicates are limited to 65,536 characters and 4,096 tokens per parser.
Predicate nesting is limited to 64 levels. Unsupported syntax throws rather than being ignored.

## Using a query engine

Once a math.gl release containing this subpath is available, applications using loaders.gl's
optional scan query API can inject the parser:

```ts
import { query } from "@loaders.gl/core/scan";
import { parseSQLQuery } from "@math.gl/core/sql";

const result = await query("SELECT city AS name WHERE population > 100000", {
  source: arrowTable,
  sqlParser: parseSQLQuery,
});
```

The parser can also be loaded on demand:

```ts
const result = await query("SHOW TABLES FROM warehouse", {
  sources,
  sqlParser: import("@math.gl/core/sql").then((module) => module.parseSQLQuery),
});
```

`arrowTable` and `sources` are application-provided inputs. The query engine resolves source names,
validates columns, and executes the result. math.gl does not import loaders.gl, and moving the
loaders.gl parser implementation to this package is a separate migration.

## CAST expressions

`parseSQLExpression('CAST(value AS INTEGER)')` returns a core expression AST suitable for
`compileArrowExpression` from `@math.gl/arrow/expressions`. The optional SQL module itself has no
Arrow dependency. `SELECT CAST(value AS INTEGER) AS count` returns a selection with an `expression`
AST and `as` alias. Existing plain-column selections retain their shapes.

Supported SQL targets: SMALLINT, INTEGER/INT, BIGINT, REAL, DOUBLE PRECISION, BOOLEAN,
VARCHAR and CHARACTER VARYING. CAST accepts columns, scalar literals and nested casts.
`WHERE CAST(value AS INTEGER) >= :minimum` records ordered `casts` on the source property;
executors must apply those conversions before testing the predicate. Binding, validation, copying
and column discovery preserve this information. Arrow's predicate evaluator executes these casts.

Unsupported targets/modifiers fail explicitly. This subset does not accept DECIMAL, date/time,
length/precision modifiers, arbitrary arithmetic inside CAST, or casts on predicate scalar
values. See [Arrow expression conversion rules](../../arrow/expressions/README.md#sql-cast).

Postfix `value::TYPE` and chained casts are also supported with the same conversion rules.
