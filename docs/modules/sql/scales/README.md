# Portable visualization scale descriptors (experimental)

Compare ramps and class breaks in the [color scale gallery](gallery.mdx).

The optional `@math.gl/sql/scales` entry point defines serializable scale
**specifications** and resolved scale metadata without introducing a D3, renderer,
Apache Arrow, or GPU runtime dependency.

```ts
import {validateScaleSpec, createResolvedScale} from '@math.gl/sql/scales';

const spec = validateScaleSpec({
  id: 'temperature',
  type: 'sequential',
  domain: {type: 'extent', column: 'temperature'},
  range: {type: 'palette', name: 'viridis'},
  interpolation: 'oklab'
});

// After a source-specific backend computes the domain and resolves the palette:
const resolved = createResolvedScale({
  id: 'temperature',
  type: 'sequential',
  domain: [-20, 50],
  range: {type: 'colors', values: [[0.1, 0, 0.3, 1], [1, 0.9, 0.2, 1]]}
}, value => {
  // Backend-provided evaluator; the layer and legend must share this callback.
  return value === null ? null : [1, 0.9, 0.2, 1];
});
```

`ScaleSpec` describes fixed/data-derived domains, numeric ranges, explicit color
stops or named palettes, classification type, pivot, clamping, interpolation and
display metadata. `ResolvedScaleDescriptor` captures the **actual** domain,
resolved color stops, class breaks and palette identification. A
`ResolvedScale` binds the descriptor to a source-specific sampling function. Class breaks must
be strictly increasing. An ordinal domain and its resolved range can each contain
a single entry.

The scale **descriptor** remains JSON-safe for transport, legends and tooltips.
The callback is a separate runtime facility. This module deliberately does not
compute data-derived statistics, fetch palettes, interpolate colors, or render
legends. Those belong in subsequent PRs.

### HDR interpretation

Color values are normalized-channel tuples, not CSS encodings.
The `ScaleColorEncoding` distinguishes primaries (sRGB, Display P3, Rec.2020),
transfer (sRGB, linear, PQ, HLG), and storage (UNORM8/16, Float16/32). Values
above 1 are **not clipped** in a floating-point scene-linear range; gamut mapping,
tone mapping and output presentation are separate downstream responsibilities.

See https://github.com/visgl/deck.gl/issues/11147 for the cross-repository tracker.

## Evaluate on Arrow

Install Apache Arrow and import `compileArrowScale` from `@math.gl/sql/scales`.
It resolves the domain from your table, binds the input expression, and returns a
sampler and an evaluator for Arrow tables and record batches.

```ts
import {parseSQLScaleExpression} from '@math.gl/sql/scales';
import {compileArrowScale} from '@math.gl/sql/scales';

const parsed = parseSQLScaleExpression(
  "SCALE_COLOR(temperature, DOMAIN(temperature), PALETTE('viridis'))"
);
const scale = compileArrowScale(table, parsed);
const colors = scale.evaluate(table);
const legend = scale.scale.descriptor;
```

Color evaluation returns a four-channel Arrow vector with the requested storage
format. The sampler and legend use the same resolved domain and color stops.

Quantile scales collapse tied class breaks and omit the corresponding empty
classes from the resolved colors. Arrow Int64 and Uint64 values are accepted
within JavaScript's safe integer range.
## Resolve domains from a stream

Create a streaming domain accumulator from `@math.gl/sql/scales` and call
`update(batch)` for every Arrow record batch. Call `result()` to read the latest
resolved domains in request order. Extents track exact bounds. Percentiles and
quantile breaks use a bounded approximate sketch, and categorical domains
retain each distinct value in memory.


To evaluate batches using statistics collected during a scan, call
`bindArrowScale(schema, parsed, {domain, quantileBreaks})` from
`@math.gl/sql/scales`. Use the matching domain from the accumulator's
`result()`. For quantile classification, pass the class boundaries from
`quantileBreaks(column, classCount)`. The binder reads no rows. Its
`evaluateBatch()` method and resolved descriptor use the same boundaries.

## Backend conformance fixtures

The optional `@math.gl/sql/scales/conformance` entry exports
`SCALE_CONFORMANCE_CASES`, `ScaleConformanceCase`, and `ScaleConformanceSample`.
Each JSON-serializable case supplies a resolved descriptor, input/expected-output
samples, and an absolute per-component tolerance. Expected values are specified
independently of the evaluator under test.

Use the same cases for a CPU, worker, or GPU implementation. A backend that
supports only a subset should explicitly select and report supported case IDs;
unsupported cases must not silently fall back to a different scale. Numeric
results compare by absolute error; nulls and color arity compare exactly. NaN
must fail a numeric comparison. The corpus covers extrapolation, log-domain
rejection, linear-sRGB interpolation, null/under/over colors, quantile boundaries
after repeated-break removal, and extended linear HDR channels.

These are evaluator samples **before storage quantization**. Packed color formats,
GPU layouts, approximate domain statistics, and broader color-space conversion
need additional tests. The main scales entry does not import these test fixtures.


## Parameterized scale inputs

`parseSQLScaleExpression(sql, {parameters})` binds values before validating the scale:

```ts
const scale = parseSQLScaleExpression(
  'SCALE_COLOR(value, DOMAIN(:domain), PALETTE(:colors))',
  {parameters: {domain: [0, 50, 100], colors: ['#440154', '#21918c', '#fde725']}}
);
```

`PALETTE(:colors)` accepts an array of `#RRGGBB`/`#RRGGBBAA` strings or an array of
numeric RGB/RGBA tuples. Numeric channels follow the scale's normalized color
convention, with alpha defaulting to 1 for RGB; there is no implicit byte conversion
or clipping. An array always specifies explicit colors, even when it contains only
one string. A scalar string in `PALETTE(:name)` retains named-palette behavior.

`DOMAIN(:domain)` and `RANGE(:range)` accept numeric stop arrays, and
`CATEGORIES(:categories)` accepts fixed category arrays. Existing scale validation
still applies, including matching domain/color lengths and minimum stop counts.
Binding copies the arrays, so later edits to the caller's palette do not change the
parsed scale. A bound scale call in a SELECT projection can also be passed to
`parseSQLScaleAST`.
