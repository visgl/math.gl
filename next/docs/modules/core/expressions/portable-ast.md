# Portable expression AST

`@math.gl/core/expressions` provides a shared expression AST for independently implemented executors. It has no Arrow, GPU, loaders.gl, or database dependency. SQL parsing is optional through `@math.gl/core/sql`; importing the AST utilities does not include either parser.

## Validate and inspect[​](#validate-and-inspect "Direct link to Validate and inspect")

```
import {validateExpressionAST, getExpressionColumns} from '@math.gl/core/expressions';

import {parseSQLExpression} from '@math.gl/core/sql';



const expression = parseSQLExpression('SIN(angle) + offset');

validateExpressionAST(expression);

const columns = getExpressionColumns(expression); // ['angle', 'offset']
```

`validateExpressionAST(value, {maxNodes?, maxDepth?})` checks external ASTs without binding names, selecting types, or running functions. Defaults are 16,384 nodes and 192 levels; callers can tighten these limits. The budget accommodates existing 4,096-element arrays, including their enclosing expression nodes. SQL parser token limits are unchanged. Cycles, holes, malformed nodes, member calls, and unsupported literal objects fail explicitly. Repeated references to one child are allowed and count each time.

`getExpressionColumns(expression, options?)` validates the same subset and returns exact column names in first-reference order. Function identifiers and string literals are excluded. A quoted SQL identifier such as `"a.b"` is one literal column name, not a path.

| Node                    | Contract                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Identifier`            | Exact source-column name.                                                                                                    |
| `Literal`               | Number, bigint, Boolean, string, or null. Bigints may be supplied in ASTs; SQL uses quoted BIGINT casts.                     |
| `UnaryExpression`       | Operator and `argument`.                                                                                                     |
| `BinaryExpression`      | Operator, `left`, and `right`. External `LogicalExpression` nodes are also accepted for Boolean conjunction and disjunction. |
| `CallExpression`        | Named `callee` and ordered `arguments`. SQL unquoted calls carry `sqlFunction: true`.                                        |
| `ConditionalExpression` | `test`, `consequent`, `alternate`; only the selected branch executes.                                                        |
| `ArrayExpression`       | Ordered literal elements, interpreted against a declared list type by the Arrow evaluator.                                   |

SQL arithmetic, comparisons, and Boolean operators use the same node shapes as the basic expression parser. SQL `CASE` lowers to conditional nodes; casts and SQL fixed-array constructors use named built-in calls (`cast`, `array`, `array_float16`, `array_float32`, `array_float64`). JavaScript array literals and SQL fixed-array constructors retain distinct semantics. Signed numeric constants may appear as a literal or a unary node. Preserve bigint and nonfinite numeric values with structured cloning when transferring an AST between workers. `raw` and `prefix` parser annotations do not change evaluation. `sqlFunction` affects function name lookup: fold unquoted SQL function names, preserve quoted calls and all column names.

Structural validation does not grant backend support. Each executor must reject unsupported operators, functions, types, or node kinds before execution. Property/member access and `this` from the broader JavaScript evaluator are outside this portable subset.

## Normalize WHERE predicates[​](#normalize-where-predicates "Direct link to Normalize WHERE predicates")

`columnarPredicateToExpression(predicate, {parameters?})` binds named parameters and normalizes portable comparisons, logical groups, membership lists, casts, and null tests into this AST. Logical groups use balanced trees. Membership lowers to a compact `in(value, ...literals)` call, retaining a single copy of the tested expression and its casts. It preserves exact top-level column names and rejects nested property paths and Date/binary literals that need backend-specific conversion. The result uses the same AST limits. Arrow predicate compilation uses this utility.

A query consumer can normalize a WHERE clause as follows:

```
const where = query.where;

const expression = where && ('expression' in where

  ? where.expression

  : columnarPredicateToExpression(where));
```

## Numeric function metadata[​](#numeric-function-metadata "Direct link to Numeric function metadata")

`NUMERIC_FUNCTION_DEFINITIONS` describes the 21 functions in `@math.gl/arrow/math` without importing Arrow or executable kernels. Each definition contains its name, exact argument/result prototypes, null/NaN policy, error categories, and relevant domain, angle, rounding, or remainder rules. Arrow declarations derive their signatures from this catalog.

Select exact signatures first, then floating widening; never implicitly mix integer and floating columns. Mixed floating arguments use the widest precision. Integer transcendental calls return Float64, while integer-preserving functions retain their exact type. Untyped numeric literals default to Float64 and can inherit a declared argument type during binding. An entirely untyped null-only numeric call defaults to a full Float64 signature when available; otherwise unresolved calls remain ambiguous. Null arguments do not widen known typed operands.

`ExpressionEvaluationError` and `isExpressionEvaluationError()` provide shared classifications: `domain`, `conversion`, `overflow`, and `divisionByZero`. These errors are eligible for explicit TRY recovery. Programming, binding, cancellation, and infrastructure errors remain fatal.

## Backend integration[​](#backend-integration "Direct link to Backend integration")

A GPU consumer should bind the published AST to its existing operation/compiler implementation. It should validate source names before applying SELECT aliases and retain hidden WHERE columns until filtering completes. Shader identifiers and operation symbols come from trusted bindings, not interpolated column or function names.

Backend support is explicit. A 32-bit GPU implementation must reject Float64, Int64, UTF-8, or Float16 expressions it cannot execute faithfully; it must not silently narrow values. Use an explicit SQL cast such as `value::REAL` when Float32 is intended.

Preserve SQL three-valued Boolean logic, branch short-circuiting, fixed-array null/padding rules, and classified error behavior. Eager shader `select` or unconditional child evaluation cannot implement CASE or TRY where inactive expressions may fail. GPUs can record per-row error status for the execution layer to interpret; accepting an AST alone does not establish conformance. GPU buffer layout, shader generation, capability checks, submission, and fallback policy belong to the consuming library. This package introduces no luma.gl backend or dependency.

The `signedUnitInterval` domain used by `ASIN` and `ACOS` includes both endpoints `-1` and `1`.
