# createGeoidFromGrid

Creates a `Geoid` from a complete global grid of decoded unsigned 16-bit samples.
It uses the same bilinear or cubic interpolation as `parsePGM`, without requiring
Arrow or a Parquet decoder in `@math.gl/geoid`.

```typescript
import {createGeoidFromGrid} from '@math.gl/geoid';

// Decode Parquet in the application, then extract the complete raw_value column.
const geoid = createGeoidFromGrid({
  width: 1440,
  height: 721,
  values: rawValues, // Uint16Array
  offset: -108,
  scale: 0.003,
  cubic: true
});

const N = geoid.getHeight(51.5, 0); // meters above the WGS84 ellipsoid
```

## Parameters

Accepts a `GeoidGridProps` object:

| Property | Type | Description |
| --- | --- | --- |
| `width` | `number` | Even integer ≥ 2; number of longitude columns |
| `height` | `number` | Odd integer ≥ 3; number of latitude rows |
| `values` | `Uint16Array` | Exactly `width * height` raw samples |
| `offset` | `number` | Finite height offset in meters |
| `scale` | `number` | Finite, positive meters per sample unit |
| `cubic` | `boolean` | Defaults to `false` (bilinear); `true` selects cubic interpolation |

The grid starts at 90°N, 0°E. Rows run north to south, including both poles;
columns run eastward with spacing `360 / width`, without a duplicated seam column.
Samples are row-major: `values[row * width + column]`. Height N is
`offset + scale * sample`. Longitude normalization in a decoded table does not
change this required grid order.

The array is borrowed without copying or converting to PGM bytes. Typed-array
subviews are supported. Keep the samples unchanged for the lifetime of the geoid:
interpolation caches coefficients from previously queried cells.

## Decoded Parquet grids

The `earth/geoid/v1` datasets in
[deck.gl-data](https://github.com/visgl/deck.gl-data/tree/codex/geoid-parquet/earth/geoid/v1)
contain `raw_value`, `row`, and `column` fields plus grid metadata. Extract the
complete `raw_value` column as a `Uint16Array`, using dimensions, offset and scale
from the manifest or `geoid` schema metadata. Assemble chunked columns first;
restore row/column order if a query reordered rows. Filtered or incomplete tables
cannot be used as a complete grid. Do not pass the decoded `geoid_height` column
as raw samples.

Invalid dimensions, array type/count, or offset/scale throw an error. The factory
does not inspect coordinates or verify the grid's provenance. Use the high grid
for height conversion; the low grid is a decimated visualization preview.
Interpolation error bounds are unspecified for this generic input.
