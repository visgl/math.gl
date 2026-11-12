# Arrow color functions

`@math.gl/expressions/color` exports named `ArrowTableFunction` declarations for schema-bound expressions.
Pass the declarations you use through `functions`. All configuration is supplied as arguments.

```ts
import {compileArrowExpression} from '@math.gl/expressions/arrow';
import {COLOR_SCALE, COLOR_TO_RGBA8} from '@math.gl/expressions/color';

const expression = compileArrowExpression(
  'COLOR_TO_RGBA8(COLOR_SCALE(value, 0, 100, "viridis"))',
  {inputSchema: arrowTable.schema, functions: [COLOR_SCALE, COLOR_TO_RGBA8]}
);
const colors = expression.evaluateTable(arrowTable);
```

Numeric arguments use Float64; use explicit conversions for other source types. Working colors are
`FixedSizeList<Float32, 4>` normalized gamma-encoded sRGB with straight alpha and non-nullable
channels. Null parent validity means missing color; alpha zero is a valid transparent color.
`COLOR_TO_RGBA8` produces `FixedSizeList<Uint8, 4>` for rendering. Each declaration's prototype `evaluate`
method can also be called directly with its declared Arrow vectors and an active-row mask.

## Functions

| Function | Description |
| --- | --- |
| `COLOR_RGB(r, g, b)` | Normalized components; opaque alpha. |
| `COLOR_RGBA(r, g, b, a)` | Normalized components with explicit alpha. |
| `COLOR_FROM_HEX(text)` | CSS `#rgb`, `#rgba`, `#rrggbb`, or `#rrggbbaa`. |
| `COLOR_TO_HEX(color)` | Lowercase `#rrggbbaa`, always including alpha. |
| `COLOR_MIX(a, b, t)` | Clamped interpolation in gamma-encoded sRGB, using premultiplied alpha internally. |
| `COLOR_WITH_ALPHA(color, alpha)` | Replaces alpha. |
| `COLOR_TO_RGBA8(color)` | Clamps and rounds each channel to 0–255. |
| `COLOR_RAMP(value, min, max, start, end)` | Continuous two-color ramp with explicit bounds. |
| `COLOR_SCALE(value, min, max, palette)` | Continuous named palette with explicit bounds. |
| `COLOR_DIVERGING(value, min, midpoint, max, palette)` | Maps the midpoint to the palette center. |
| `COLOR_BINS(value, breaks, colors)` | Ordered Float64 breaks and hexadecimal color strings; colors count must equal breaks count plus one. |
| `COLOR_CATEGORY(value, categories, colors)` | Exact case-sensitive string keys and hexadecimal color strings; one color per unique key. |

Channels and interpolation positions clamp to [0,1]. Domains must be strictly increasing and
finite; diverging bounds must satisfy `min < midpoint < max`. Threshold equality selects the next
bin. Unknown categories, malformed hex, unknown palettes, duplicate category keys, invalid list
lengths/domains and non-finite row values produce null. Null arguments propagate. This policy is
the same for literals and row-dependent arguments. Inactive rows are skipped and produce null.

```ts
// List literals take their types from the function declarations.
'COLOR_BINS(value, [10, 20], ["#2166ac", "#f7f7f7", "#b2182b"])'
'COLOR_CATEGORY(kind, ["road", "rail", "water"], ["#777", "#a53", "#38c"])'
```

The built-in palettes are `viridis` (five sampled anchors), `grayscale` (black/white) and `blueRed`
(blue/near-white/red). These are sRGB anchor interpolations, not continuous reference colormap
implementations or perceptually uniform interpolation. Palette strings and global domain arguments
are stable across batches; the functions never infer a domain or assign categories by encounter order.

## Performance and integration

Color kernels write Arrow child buffers directly and preserve row count, chunk order and masks.
Dictionary-encoded bin/category literals share one list payload. Row-dependent lists require reading
and validating each row's configuration. Compound color expressions currently allocate intermediate
vectors and small temporary color values; scalar fusion does not apply to tuple results.

Importing individual declarations allows unused functions to tree-shake. The color entry point does
not import the expression compiler. Register declarations in a worker's local expression task to use
identical kernels there. SQL function-valued SELECT planning remains an application responsibility.
