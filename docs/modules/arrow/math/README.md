# @math.gl/arrow/math

Optional SQL-style numeric function declarations for [Arrow expressions](../expressions/README.md).
Import the functions you use; this entry point is separate from the Arrow and core roots.

```typescript
import {compileArrowExpression} from '@math.gl/arrow/expressions';
import {SIN, POWER} from '@math.gl/arrow/math';

const expression = compileArrowExpression('POWER(SIN(angle), 2)', {
  inputSchema: arrowTable.schema,
  functions: [SIN, POWER]
});
const values = expression.evaluateTable(arrowTable);
```

## Functions

Each exported declaration has typed `prototypes` with equivalent scalar and masked vector
implementations. Functions return one value per input row and propagate null arguments.

| Functions | Arguments and result |
| --- | --- |
| `ABS(x)`, `SIGN(x)` | Absolute value or sign; preserve the input type. |
| `FLOOR(x)`, `CEILING(x)` | Round toward negative or positive infinity; preserve the input type. |
| `ROUND(x)`, `TRUNC(x)` | Round ties away from zero or truncate toward zero; preserve the input type. |
| `SQRT(x)`, `POWER(x, y)` | Square root or exponentiation. |
| `EXP(x)`, `LN(x)`, `LOG10(x)` | Natural exponential, natural logarithm, base-10 logarithm. |
| `SIN(x)`, `COS(x)`, `TAN(x)` | Trigonometric functions; inputs are radians. |
| `ASIN(x)`, `ACOS(x)`, `ATAN(x)` | Inverse trigonometric functions; results are radians. |
| `ATAN2(y, x)` | Angle of the point `(x, y)` in radians. |
| `DEGREES(x)`, `RADIANS(x)` | Convert radians to degrees or degrees to radians. |
| `MOD(x, y)` | Remainder with the dividend's sign; preserve the input type. |

## Types and errors

Float16, Float32, and Float64 inputs retain their precision. Binary functions widen mixed
floating arguments to the widest input type. Integers produce Float64 for transcendental
functions; integer-preserving functions keep exact integer arithmetic, including Int64/Uint64
bigints. Mixing integer and floating columns requires an explicit cast. Converting large
integers to Float64 for transcendental functions can lose precision above 2^53.

Invalid domains raise `ExpressionEvaluationError` with code `domain`. Zero divisors raise
`divisionByZero`. Integer overflow and finite-input overflow at the declared floating precision
raise `overflow`. Subnormal results and underflow to zero are allowed. Input NaNs propagate;
infinite inputs follow the mathematical operation when defined. Float16 execution requires
native `Float16Array` support.

Decimal-place rounding is deferred. The existing JavaScript scalar math library is unchanged.
