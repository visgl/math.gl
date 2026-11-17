# @math.gl/sql/parser 🧪

Import `@math.gl/sql/parser` to parse supported SQL statements into portable query and
predicate objects. The parser works without Apache Arrow. To execute SQL over native Arrow tables,
use [`queryArrowSQL`](../README.md) from the package root.

## Submodule features

| Feature                                   | Support | Notes                                                                                                                                                      |
| ----------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query parsing                             | ✅      | `parseSQLQuery()` parses SELECT statements and supported catalog commands.                                                                                 |
| Structural-only parsing                   | ✅      | `parseSQLSelect()` parses projection, source references, and limits without the built-in predicate parser. Supply `parseWhere` to enable WHERE.            |
| Standalone predicate parsing              | ✅      | `parseSQLPredicate()` parses the expression after WHERE.                                                                                                   |
| Named parameter binding                   | ✅      | Predicate parsing can bind values immediately or preserve parameter references for `bindSQLPredicate()`.                                                   |
| Predicate validation                      | ✅      | `validateSQLPredicate()`, `isSQLPredicate()`, and `SQL_PREDICATE_JSON_SCHEMA` validate portable predicates. The JSON Schema covers JSON-compatible values. |
| Portable TypeScript types                 | ✅      | Query, selection, table reference, catalog command, and predicate types contain no data sources or execution controls.                                     |
| Optional, tree-shakeable imports          | ✅      | Separate SQL subpath; structural parsing does not require the built-in predicate parser.                                                                  |
| Bounded parsing                           | ✅      | Input size, token count, and predicate nesting limits reject oversized input.                                                                              |
| Query execution and source discovery      | ❌      | Supplied by the consuming application, not this parser.                                                                                                    |
| Arrow integration or database connections | ❌      | No Arrow, loaders.gl, or database dependency.                                                                                                              |
| General-purpose SQL AST                   | ❌      | Output represents the supported query subset, not arbitrary SQL programs.                                                                                  |

## SQL syntax features

✅ Supported · ⚠️ Restricted · ❌ Unsupported. These statuses describe `parseSQLQuery()`. See Relational SELECT below for the planner-oriented parser.
An injected WHERE parser can define a different predicate language.

| SQL feature                           | Support | Syntax and limitations                                                                                                                            |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Column projection                     | ✅      | `SELECT city, population` or `SELECT *`.                                                                                                          |
| Column aliases                        | ✅      | `SELECT city AS name`; explicit `AS` is required.                                                                                                 |
| Source and table references           | ✅      | `FROM cities` or `FROM warehouse.cities`; FROM is optional.                                                                                       |
| Quoted identifiers                    | ✅      | Double quotes, including doubled quote escapes: `"city""name"`. Identifier case is preserved.                                                     |
| Keywords and statement terminator     | ✅      | Case-insensitive keywords and one optional trailing semicolon.                                                                                    |
| Comparisons                           | ⚠️      | Scalar expressions compared with `=`, `!=`, `<>`, `<`, `<=`, `>`, `>=`; includes column-to-column comparisons.                                   |
| Boolean predicates                    | ✅      | `AND`, `OR`, `NOT`, and parentheses.                                                                                                              |
| Membership                            | ✅      | `IN (...)` and `NOT IN (...)` with a nonempty list of scalar values.                                                                              |
| Null tests                            | ✅      | `IS NULL` and `IS NOT NULL`; expression comparisons with NULL evaluate to unknown.                                                                           |
| Scalar literals                       | ✅      | Numbers, single-quoted strings with doubled quote escapes, and Boolean values. Use null tests rather than NULL literals.                          |
| Named parameters                      | ✅      | `:name` binds values from `parameters` in expressions, SELECT statements, and scale expressions. Predicate templates also support preserved references. |
| Pagination                            | ✅      | `LIMIT` followed by a nonnegative safe integer, including zero. `OFFSET` skips rows before the limit.                                                                                   |
| Catalog commands                      | ✅      | `SHOW SOURCES`, `SHOW TABLES [FROM source]`, and `DESCRIBE source[.table]`. `SHOW SOURCES` is a parser-specific command.                          |
| Nested column access                  | ✅      | `start[1]` reads a list element. `endpoint.longitude` reads a struct field. Quote literal column names containing dots. |
| Qualified column names                | ❌      | Use the relational SELECT parser for table-qualified names. In `parseSQLQuery()`, dots access struct fields. |
| Computed columns and function calls   | ⚠️      | CAST, postfix :: conversions, arithmetic + - * /, named functions, searched CASE, and fixed-size ARRAY expressions. Execution supplies registered functions.                                                                      |
| Additional predicate operators        | ❌      | No `LIKE`, `ILIKE`, `BETWEEN`, regular expressions, or `EXISTS`.                                                                                  |
| Sorting and pagination                | ❌      | No `ORDER BY` or `FETCH`.                                                                                                              |
| Aggregation and distinct rows         | ❌      | No aggregate functions, `GROUP BY`, `HAVING`, or `DISTINCT`.                                                                                      |
| Joins and nested queries              | ❌      | No joins, subqueries, CTEs (`WITH`), or set operations such as `UNION`.                                                                           |
| Table aliases and qualified wildcards | ❌      | No `FROM cities AS c` or `SELECT c.*`.                                                                                                            |
| Window functions                      | ❌      | No `OVER` or window definitions.                                                                                                                  |
| Data and schema changes               | ❌      | No `INSERT`, `UPDATE`, `DELETE`, `CREATE`, or other mutation statements.                                                                          |
| Comments and scripts                  | ❌      | No SQL comments or multiple statements.                                                                                                           |

## Usage

```ts
import { parseSQLQuery } from "@math.gl/sql/parser";

const query = parseSQLQuery(
  "SELECT city AS name, population FROM warehouse.cities WHERE population >= 100000 LIMIT 10",
);
```

WHERE references source column names, before projection aliases are applied.
For example, use `WHERE city = 'Paris'`, not the output alias `name`.

For structural parsing with an explicitly supplied predicate parser:

```ts
import { parseSQLSelect, parseSQLPredicate } from "@math.gl/sql/parser";

const query = parseSQLSelect("SELECT city WHERE population >= :minimum", {
  parseWhere: (expression) =>
    parseSQLPredicate(expression, {
      parameters: { minimum: 100000 },
    }),
});
```

Importing only `parseSQLSelect` lets a tree-shaking bundler omit the built-in predicate parser.
Without `parseWhere`, this function rejects statements containing WHERE.

## Relational SELECT

Use `parseSQLSelectStatement()` when your application owns the query planner.
It returns projection, source, join, filter, grouping, sorting, and pagination clauses
without resolving names or executing the query.

```ts
import {parseSQLSelectStatement} from '@math.gl/sql/parser';

const statement = parseSQLSelectStatement(
  'SELECT t.region, COUNT(*) AS total FROM trips AS t ' +
    'WHERE t.fare >= :minimum GROUP BY t.region ORDER BY total DESC NULLS LAST LIMIT 10',
  {parseParameter: name => ({type: 'Identifier', name: `:${name}`})}
);
```

The parser supports table aliases, qualified column references, INNER, LEFT,
SEMI, and ANTI joins with ON conditions, GROUP BY, ORDER BY with optional null
placement, LIMIT, OFFSET, and SQL line comments. Aggregate calls are expression nodes. COUNT(*)
is a call with a wildcard identifier argument marked `sqlWildcard: true`. The caller validates the supported
join conditions and aggregate functions and binds parameters. Use
`parseParameter` to supply an expression node for each named parameter.

## Expressions

`parseSQLExpression()` returns the shared expression AST. Computed selections use
`{expression, as?}`; computed WHERE clauses use `{expression}`. Existing portable predicate
shapes remain unchanged for predicates accepted by `parseSQLPredicate()`.

`CASE WHEN condition THEN value ELSE fallback END` evaluates only the selected branch.
Unquoted function names resolve case-insensitively; quoted function names and column names
retain their exact case. Use `POWER(x, y)` and `MOD(x, y)`; SQL does not accept JavaScript
`**`, `^`, or `%`. JavaScript expression parsing remains available separately.

`ARRAY[x + 1, SIN(angle), 0]` has a fixed width known at compilation. Arrow evaluation
infers the widest floating component type; integer-only arrays use Float64. Explicit casts
such as `ARRAY[x, y]::REAL[2]` select Float16/32/64 precision and check finite overflow.
Any null component produces a null tuple with zero-filled numeric padding. Variable-length
result lists are deferred. SQL parsing and Arrow evaluation remain separate optional imports.

## Parameters and validation

Preserve parameter references when a predicate will be reused with different values:

```ts
import { parseSQLPredicate, bindSQLPredicate } from "@math.gl/sql/parser";

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

## Parsing versus execution

Use `queryArrowSQL` from `@math.gl/sql` for relational SQL over named Arrow tables.
Use this parser entry point when an application needs to inspect a query or supply its own executor.

`parseSQLQuery` produces a linear query or a catalog command. `parseSQLSelectStatement`
and `parseSQLSelectCompound` represent relational SELECT syntax. Their outputs have different
shapes: do not pass a relational statement object directly to `queryArrowTable`.
The built-in `queryArrowSQL` function handles that translation.

## CAST expressions

`parseSQLExpression('CAST(value AS INTEGER)')` returns a core expression AST suitable for
`compileArrowExpression` from `@math.gl/sql/arrow`. The optional SQL module itself has no
Arrow dependency. `SELECT CAST(value AS INTEGER) AS count` returns a selection with an `expression`
AST and `as` alias. Existing plain-column selections retain their shapes.

### SQL type card

These are the cast targets supported by math.gl. The middle column lists Arrow-oriented
spellings and dialect aliases accepted by the parser. A dash means there is no corresponding
spelling supported in that column.

| SQL standard type | SQL Arrow type | Arrow type |
| --- | --- | --- |
| — | `INT8` | `Int8` |
| `SMALLINT` | `INT16` | `Int16` |
| `INTEGER`, `INT` | `INT32` | `Int32` |
| `BIGINT` | `INT64` | `Int64` |
| — | `UINT8`, `UINT16`, `UINT32`, `UINT64` | `Uint8`, `Uint16`, `Uint32`, `Uint64` |
| — | `FLOAT16` | `Float16` |
| `REAL` | `FLOAT32` | `Float32` |
| `DOUBLE PRECISION` | `FLOAT64` | `Float64` |
| `BOOLEAN` | — | `Bool` |
| `VARCHAR`, `CHARACTER VARYING` | `UTF8` | `Utf8` |
| — | `DICTIONARY(UTF8, INT32)` | `Dictionary<Utf8, Int32>` |
| `BLOB` | `BINARY`, `VARBINARY` | `Binary` |
| — | `VARBINARY(n)` | `Binary` with an `n`-byte cap at cast time |
| `BINARY(n)` | `FIXEDSIZEBINARY(n)` | `FixedSizeBinary(n)` |
| `DATE` | — | `Date32` (`DateDay` in Arrow JS) |
| `TIMESTAMP`, `TIMESTAMP WITHOUT TIME ZONE` | — | `Timestamp(MICROSECOND)` |
| `TIMESTAMP WITH TIME ZONE` | — | `Timestamp(MICROSECOND, "UTC")` |
| — | `GEOMETRY` | `Binary` with the `geoarrow.wkb` extension |
| — | `FLOAT16[n]`, `FLOAT32[n]`, `FLOAT64[n]`, `UINT8[n]` | `FixedSizeList` of the corresponding element type |

CAST accepts columns, scalar literals, and nested expressions. Integer casts reject overflow
and return bigint for 64-bit targets.
`WHERE CAST(value AS INTEGER) >= :minimum` records ordered `casts` on the source property;
executors must apply those conversions before testing the predicate. Binding, validation, copying
and column discovery preserve this information. Arrow's predicate evaluator executes these casts.

Unsupported targets/modifiers fail explicitly. This subset does not accept DECIMAL, TIME,
or scalar length or precision modifiers other than binary widths. The portable predicate
representation supports scalar casts on columns only. See [Arrow expression conversion rules](../arrow/README.md#sql-cast).

Postfix `value::TYPE` and chained casts are also supported with the same conversion rules.

`CAST(category AS UTF8)` returns plain Arrow UTF-8, like `VARCHAR`.
`CAST(category AS DICTIONARY(UTF8, INT32))` requests dictionary-encoded UTF-8
with signed 32-bit indices. Dictionary entries are assigned in encounter order
within each evaluated batch. Nulls remain null.

`BINARY`, `VARBINARY`, and `BLOB` select Arrow `Binary`. `VARBINARY(n)` also selects
`Binary` and rejects values larger than `n` bytes. `BINARY(n)` and `FIXEDSIZEBINARY(n)`
select Arrow `FixedSizeBinary(n)`, zero-pad shorter values on the right, and reject
longer values. Binary casts accept existing bytes or the UTF-8 bytes of text.

`DATE` accepts ISO `YYYY-MM-DD` text. Timestamp casts accept a date and time
separated by `T` or a space, with up to six fractional second digits. Zoned timestamps
require `Z` or a signed `HH:MM` offset and are normalized to UTC. Timestamps without
a time zone require offset-free text and preserve the wall-clock fields. Temporal
casts preserve nulls and reject invalid calendar values and excess fractional digits.
An input column of the matching Arrow temporal type can also be cast directly.

`CAST(payload AS GEOMETRY)` labels a binary WKB value with the `geoarrow.wkb`
extension. The cast treats the bytes as opaque and preserves existing WKB field
metadata, including CRS when present.

## Packed floating-point arrays

`SELECT ARRAY[x, y, z] AS position` returns `{array: ['x', 'y', 'z'], as: 'position'}`.
Source-only selections retain this shape and require an alias. Computed arrays such as
`ARRAY[x + 1, SIN(angle), 0] AS position` return `{expression, as}`.
Use `compileArrowArray(selection.array, {inputSchema, type: selection.type})` for the former,
and `compileArrowExpression(selection.expression, {inputSchema, functions})` for the latter.

The component type is the widest floating input, or Float64 for integer-only arrays.
`::FLOAT16[3]`, `::REAL[3]`, and `::DOUBLE PRECISION[3]` explicitly choose precision and require
matching width. `FLOAT32` and `FLOAT64` are also accepted for fixed-array casts. Float16
execution requires native Float16Array. Null components make the whole tuple null, with zero
numeric padding. GPU consumers must respect parent validity or invalid positions appear at the origin.

Executors can consume the [portable expression AST](../portable-ast.md) and Arrow-independent numeric metadata.

`ARRAY[r, g, b, a]::UINT8[4]` and `CAST(ARRAY[r, g, b, a] AS UINT8[4])` select byte storage.
The parser checks the width and lowers both spellings to an `array_uint8` call. `PACK_UNORM8`
is a separate call that scales normalized values. See [Byte arrays and normalized packing](../arrow/README.md#byte-arrays-and-normalized-packing).

### Syntax errors

Parser syntax errors use `SQLParseError`, a `SyntaxError` with a zero-based UTF-16 `offset`,
one-based `line` and `column`, and a short `token` preview when a token is present. When parsing
a complete statement, locations in the built-in WHERE parser refer to the original SQL text.
Use the structured fields to highlight the location in an editor. Exceptions thrown by a
custom WHERE parser are preserved.

Pass a [probe.gl](https://vis.gl/probe.gl) logger as the `log` option to `parseSQLQuery` to capture parser
errors. The parser reports the diagnostic and throws the original error.


## Named query parameters

Pass a readonly object with case-sensitive keys, omitting the colon from each key:

```ts
const query = parseSQLQuery(
  'SELECT price * :factor AS adjusted WHERE category IN (:categories)',
  {parameters: {factor: 1.2, categories: ['food', 'books']}}
);
```

`parseSQLExpression`, `parseSQLSelect`, `parseSQLQuery`, `parseSQLSelectStatement`,
`parseSQLSelectCompound`, and `queryArrowSQL` accept `parameters` in their options.
`parseSQLSelect` still requires a `parseWhere` callback for WHERE; use `parseSQLQuery`
for built-in predicate and expression handling.

`SQLParameterValue`, `SQLParameters`, and `SQLParameterOptions` are exported from
`@math.gl/sql/parser` and `@math.gl/sql`. Values can be finite numbers, strings,
booleans, bigint, null, Date, Uint8Array, homogeneous numeric/string arrays, or
arrays of numeric tuples. Readonly arrays and tuples are accepted. Mutable values
are copied when bound. Array values are limited to 4096 entries per array.

Arrays remain one argument in expressions and use the receiving Arrow function's
List or FixedSizeList signature. Numeric tuple projections can declare their width
with a cast, for example `SELECT :position::FLOAT32[3] AS position`. In `IN (:values)`
and `NOT IN (:values)`, flat arrays expand into scalar membership entries; empty
arrays yield false and true respectively, including for null input rows.

Parameters are values, not table names, column names, or SQL fragments. Quoted
strings containing colons stay literal strings. Missing values and unsupported
types fail with the parameter name; extra keys are allowed. The custom
`parseParameter(name)` AST callback remains available, but cannot be combined with
`parameters`. The existing scalar-only `parseSQLPredicate` and preserved predicate
binding APIs retain their contracts; use the expression or query parser for arrays.


Arrow compilation converts bound values to the receiving field/function type once.
String comparisons use pre-encoded UTF-8 bytes without decoding table values.
Membership compiles numeric lookup sets or sorted UTF-8/binary byte ranges reused
across batches. List arguments retain one typed Arrow dictionary value, and fixed
tuples copy preconverted physical components into each output batch. Date values
bind to epoch days for Date32 or epoch microseconds for timestamps (UTC by default).
These compiled buffers belong to the compiled expression; changing a parameter map
requires parsing and compiling again.

### Binary inputs

Callers can supply pre-encoded text and numeric typed arrays:

```ts
const parameters = {
  name: {type: 'utf8', value: new TextEncoder().encode('Montréal')},
  weights: new Float32Array([0.2, 0.3, 0.5]),
  channels: {type: 'array', value: new Uint8Array([255, 0, 128])},
  payload: {type: 'binary', value: new Uint8Array([1, 2, 3])}
} satisfies SQLParameters;
```

Float32/Float64 and 8/16/32-bit numeric typed arrays are accepted. A bare
`Uint8Array` is a binary scalar; tag it as `array` for numeric list semantics or
`utf8` for text semantics. `SQLNumericArray` and `SQLBinaryParameter` describe these
inputs. DataView and bigint typed arrays are not supported.

Binding snapshots buffers and validates UTF-8. The AST retains ordinary string
values/array elements for portable evaluators alongside their binary storage.
Arrow compilation reuses matching typed element layouts and supplied UTF-8 bytes;
comparisons do not encode or decode text per row. Different receiving numeric
types are converted once during compilation. This is copy-on-bind, not a borrowed
buffer or ownership-transfer API.
