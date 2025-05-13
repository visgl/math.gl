# DGGS Types

### DGGSDecoder

A common type is provided as a template for DGGS decoder objects.

#### `name: string`

The name of the DGGS that this decoder object implements.

#### `getCellIndexFromToken(token: string): bigint`

Decodes a token string into the 64 bit index.

#### `getTokenFromCellIndex(index: bigint): string`

Encodes the 64 bit index into a token string.

#### `getCellLngLat(token: string): number[]`

Returns the center `[lng, lat]` of the specified cell

#### `getS2CellBoundaryPolygon(token: string): Float64Array`

Returns the boundary as a nested array `[[lng0, lat0], ...]` for the specified cell

#### `getS2CellBoundaryPolygonFlat(token: string): Float64Array`

Returns the boundary as a flat array `[lng0, lat0, ...]` for the specified cell
