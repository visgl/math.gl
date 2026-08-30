# DGGSDecoder

`DGGSDecoder` defines the common API implemented by the decoder objects exported from `@math.gl/dggs`.

This is a compact decoding contract for visualization and data inspection. It does not attempt to standardize the complete API surface of DGGS implementations.

#### `name: string`

The name of the DGGS that this decoder object implements.

#### `cellColumnNames: readonly string[]`

Conventional data-column names for cells in this grid. `findDGGSCellColumn(columnNames)` uses these names for case-insensitive detection and returns a unique `{columnName, decoder}` match, or `null` if no unique match exists.

### `findDGGSCellColumn(columnNames, decoders?)`

Finds a conventional cell column for the bundled decoders, or for a supplied list of compatible decoders. The function returns the original column name and decoder when exactly one match is available. It returns `null` for missing or ambiguous matches so callers can request an explicit selection.

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
