# Portable visualization scale descriptors (experimental)

The optional `@math.gl/sql/scales` entry point defines serializable scale **specifications** and resolved scale metadata without introducing a D3, renderer, Apache Arrow, or GPU runtime dependency.

```
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

`ScaleSpec` describes fixed/data-derived domains, numeric ranges, explicit color stops or named palettes, classification type, pivot, clamping, interpolation and display metadata. `ResolvedScaleDescriptor` captures the **actual** domain, resolved color stops, class breaks and palette identification. A `ResolvedScale` binds the descriptor to a source-specific sampling function. Class breaks must be strictly increasing. An ordinal domain and its resolved range can each contain a single entry.

The scale **descriptor** remains JSON-safe for transport, legends and tooltips. The callback is a separate runtime facility. This module deliberately does not compute data-derived statistics, fetch palettes, interpolate colors, or render legends. Those belong in subsequent PRs.

### HDR interpretation[​](#hdr-interpretation "Direct link to HDR interpretation")

Color values are normalized-channel tuples, not CSS encodings. The `ScaleColorEncoding` distinguishes primaries (sRGB, Display P3, Rec.2020), transfer (sRGB, linear, PQ, HLG), and storage (UNORM8/16, Float16/32). Values above 1 are **not clipped** in a floating-point scene-linear range; gamut mapping, tone mapping and output presentation are separate downstream responsibilities.

See <https://github.com/visgl/deck.gl/issues/11147> for the cross-repository tracker.

## Evaluate on Arrow[​](#evaluate-on-arrow "Direct link to Evaluate on Arrow")

Install Apache Arrow and import `compileArrowScale` from `@math.gl/sql/arrow-scales`. It resolves the domain from your table, binds the input expression, and returns a sampler and an evaluator for Arrow tables and record batches.

```
import {parseSQLScaleExpression} from '@math.gl/sql/scales';

import {compileArrowScale} from '@math.gl/sql/arrow-scales';



const parsed = parseSQLScaleExpression(

  "SCALE_COLOR(temperature, DOMAIN(temperature), PALETTE('viridis'))"

);

const scale = compileArrowScale(table, parsed);

const colors = scale.evaluate(table);

const legend = scale.scale.descriptor;
```

Color evaluation returns a four-channel Arrow vector with the requested storage format. The sampler and legend use the same resolved domain and color stops.

Quantile scales collapse tied class breaks and omit the corresponding empty classes from the resolved colors. Arrow Int64 and Uint64 values are accepted within JavaScript's safe integer range.
