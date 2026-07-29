# DGGSDecoder

`DGGSDecoder` defines the common API implemented by the decoder objects exported from `@math.gl/dggs`.

#### `name: string`

The name of the DGGS that this decoder object implements.

#### `getCellIndexFromToken?(token: string): bigint`

Decodes a token string into a 64-bit cell index when the DGGS has a binary index representation.

#### `getTokenFromCellIndex?(index: bigint): string`

Encodes a 64-bit cell index into a token string when the DGGS has a binary index representation.

#### `getCellLngLat(token: string): number[]`

Returns the center `[lng, lat]` of the specified cell.

#### `getCellBoundaryPolygon(token: string): [number, number][]`

Returns the closed boundary as `[[lng0, lat0], ...]`.

#### `getCellBoundaryPolygonFlat(token: string): number[]`

Returns the closed boundary as `[lng0, lat0, ...]`.

#### `getCellBounds(token: string): Bounds2D`

Returns the cell bounds as `[[minLng, minLat], [maxLng, maxLat]]`.
