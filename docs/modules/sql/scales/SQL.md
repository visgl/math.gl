# SQL scale specifications (experimental)

Import `parseSQLScaleExpression` from `@math.gl/sql/scales`. It parses
one **row-preserving** scale expression using the existing bounded SQL expression
parser, then validates scale/domain/range semantics into a serializable
`ScaleSpec`. It does **not** evaluate scale statistics or colors.

```ts
import {parseSQLScaleExpression} from '@math.gl/sql/scales';

const {value, scale} = parseSQLScaleExpression(
  "SCALE_COLOR(temperature, DOMAIN(temperature), PALETTE('viridis'))"
);
// value: portable expression AST referring to temperature
// scale: {type: 'sequential', domain: {type: 'extent', column: 'temperature'},
//         range: {type: 'palette', name: 'viridis'}}
```

## Initial SQL vocabulary

| Form | Purpose |
| --- | --- |
| `DOMAIN(0, 100)` | Fixed numeric domain |
| `DOMAIN(column)` | Observed min/max of a named source column |
| `DOMAIN_ZERO(column)` | Data extent including 0 |
| `DOMAIN_SYMMETRIC(column, pivot)` | Domain symmetric about a fixed center |
| `DOMAIN_QUANTILE(column, lower, upper)` | Percentile-trimmed continuous domain |
| `RANGE(min, max [, ...])` | Numeric output range |
| `PALETTE('viridis' [, count])` | Named palette reference |
| `PALETTE('#000000', '#FFFFFF' [, ...])` | Explicit color stops (hex RGB/RGBA) |
| `SCALE_LINEAR(value, domain, range)` | Continuous linear numeric |
| `SCALE_SQRT(value, domain, range)` | Square-root numeric |
| `SCALE_LOG(value, domain, range)` | Log numeric |
| `SCALE_COLOR(value, domain, palette)` | Sequential color |
| `SCALE_DIVERGING(value, domain, palette)` | Diverging color |
| `SCALE_ORDINAL(column, palette)` | Stable categorical scale request |
| `SCALE_QUANTILE(column, count, palette)` | Equal-frequency class request |
| `SCALE_QUANTIZE(column, count, palette)` | Equal-width class request |
| `SCALE_THRESHOLD(value, ARRAY[break, ...], palette)` | Explicit class boundaries |

For example:

```sql
SCALE_SQRT(population, DOMAIN(population), RANGE(2, 20))
SCALE_DIVERGING(anomaly, DOMAIN_SYMMETRIC(anomaly, 0), PALETTE('RdBu'))
SCALE_QUANTILE(income, 5, PALETTE('Blues'))
SCALE_ORDINAL(country, PALETTE('Tableau10'))
SCALE_THRESHOLD(risk, ARRAY[20, 50, 80], PALETTE('YlOrRd'))
```

This is a small front-end contract; it is *not* a new SQL statement dialect.
In particular, WHERE, LIMIT, OFFSET and GROUP BY cannot be embedded into
per-column scale expressions. The result `value` retains the original
row-wise expression AST, and the `scale` has unresolved domain dependencies.
A later Arrow/GPU planner will resolve and share those dependencies.

The breaks must be strictly increasing. A value equal to a break starts the
next class. Provide one more explicit color than breaks. Named palettes default
to that color count.

Deferred syntax: arbitrary computed domain expressions,
piecewise domains, `PALETTE(RGBA16F(...), ...)`, HDR color options, palettes
with interpolation modifiers, and richer scalar transforms. Avoid changing
`parseSQLExpression` globally for these scale-only semantics.

Tracker: https://github.com/visgl/deck.gl/issues/11147

## Already parsed expressions

Use `parseSQLScaleAST(expression)` when a query planner already has an expression
from `parseSQLExpression` or a SELECT projection. It applies the same scale
validation as the text entry point without converting the AST back to SQL.

```ts
import {parseSQLSelectStatement} from '@math.gl/sql/parser';
import {parseSQLScaleAST} from '@math.gl/sql/scales';

const statement = parseSQLSelectStatement(
  "SELECT SCALE_COLOR(temperature, DOMAIN(temperature), PALETTE('viridis')) AS color FROM observations"
);
const {value, scale} = parseSQLScaleAST(statement.select![0].expression);
```

The returned `value` is the original row-expression node, not a clone. The input
AST is not mutated. This helper validates scale arguments; it does not validate
whether a backend can execute the row expression. Backends must reject unsupported
operations before compilation. Domain resolution and GPU/Arrow execution remain
separate steps.
