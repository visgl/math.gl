### `GeohashDecoder`

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

:::caution
This module is still experimental. It may have issues and functionality may change in minor releases.
:::

> The GeoHash functions in math.gl are currently focused on **decoding** Geohash encoded data, not encoding it.

## Functions

Implements the functions in the [DGGSDecoder](/docs/modules/types/api-reference/dggs) type, e.g:

- `getCellIndexFromToken(token: string): bigint` - Decodes a token string into the 64 bit index.
- `getTokenFromCellIndex(index: bigint): string` - Encodes the 64 bit index into a token string.
- `getCellLngLat(token: string): number[]` - Returns the center `[lng, lat]` of the cell
- `getCellBoundaryPolygonFlat(token: string): Float64Array` - Returns the boundary as a flat array `[lng0, lat0, ...]` for the S2 cell
