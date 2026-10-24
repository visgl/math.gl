# Discrete Global Grids

Global grid encodings identify cells rather than individual coordinates. Use `@math.gl/dggs` to turn cell identifiers into longitude/latitude centers and boundaries for visualization.

## Decode a cell[​](#decode-a-cell "Direct link to Decode a cell")

Choose a decoder for the encoding used by your data:

```
import {GeohashDecoder} from '@math.gl/dggs/geohash';



const center = GeohashDecoder.cellToLngLat('9q8yy');

const boundary = GeohashDecoder.cellToBoundary('9q8yy');
```

All bundled decoders expose the same small geometry contract. Supported encodings are A5, GeoHash, H3, full Plus Code, Quadkey, and S2. See the [module overview](https://visgl.github.io/math.gl/next/docs/modules/dggs.md) for imports and identifier formats.

| Method                 | Result                                           |
| ---------------------- | ------------------------------------------------ |
| `cellToLngLat()`       | Cell center as longitude and latitude in degrees |
| `cellToBoundary()`     | Boundary coordinates suitable for a polygon      |
| `cellToBoundaryFlat()` | Boundary coordinates in a flat numeric array     |

Use the [decoder reference](https://visgl.github.io/math.gl/next/docs/modules/dggs/api-reference/dggs-decoder.md) for winding, ring closure, bounds, and identifier validation. For cells crossing the antimeridian, its unwrapping option produces continuous longitudes; select the representation expected by your renderer.

## Detect a cell column[​](#detect-a-cell-column "Direct link to Detect a cell column")

```
import {findDGGSCellColumn} from '@math.gl/dggs';



const match = findDGGSCellColumn(['name', 's2_token', 'value']);

// {columnName: 's2_token', decoder: S2Decoder}
```

Detection recognizes conventional column names, not cell values. It returns `null` when there is no unique match. Specify the decoder directly when column naming is ambiguous.

## Choose the scope you need[​](#choose-the-scope-you-need "Direct link to Choose the scope you need")

The shared contract lets a visualization layer switch decoders without adapting each grid library's API. Decoder-specific subpaths avoid importing unrelated systems.

Encoding coordinates, neighbors, fills, compaction, and general grid traversal belong to each system's full library. Some decoders expose additional system-specific conveniences; they are not a shared traversal API. A grid's cell geometry, hierarchy, and area properties differ between systems, so choose the encoding based on your analysis requirements as well as rendering needs.
