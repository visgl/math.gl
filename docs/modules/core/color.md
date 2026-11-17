# Colors, scales, and LUTs

`@math.gl/core/color` provides reusable color conversions, palettes, scale compilation, quantile sketches, and RGB lookup-table sampling. It operates on ordinary values and typed arrays and does not require Apache Arrow or a SQL runtime.

```typescript
import {
  compileResolvedScale,
  resolvePalette,
  createColorLUTSampler,
  applyColorLUT
} from '@math.gl/core/color';
```

`compileResolvedScale` binds a validated scale specification to a resolved domain. The returned scale samples numeric or categorical inputs and exposes resolved metadata. Colors retain the specified transfer function, primaries, and channel encoding. `resolvePalette` retrieves palette stops; `ScaleQuantileSketch` supports bounded streaming quantile estimates.

`createColorLUTSampler` creates an RGB sampler for a `ColorLUT`; `applyColorLUT` applies it to interleaved RGB or RGBA floating-point arrays. Sampling uses the authored domain and preserves signed/HDR results. RGBA application preserves alpha at float32 precision.

For SQL expressions, data-derived domains, Arrow column output, and batch evaluation, use [`@math.gl/sql/scales`](../sql/scales/README.md).
