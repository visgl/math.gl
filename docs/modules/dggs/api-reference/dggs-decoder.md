# DGGSDecoder

`DGGSDecoder` defines the common API implemented by the decoder objects exported from `@math.gl/dggs`.

This is a compact decoding contract for visualization and data inspection. It does not attempt to standardize the complete API surface of DGGS implementations.

#### `DGGSCell = string | bigint`

The common cell identifier type. String-only systems reject `bigint` values. A5, H3, and S2 accept both their hexadecimal token form and a 64-bit `bigint` index.

#### `name: string`

The name of the DGGS that this decoder object implements.

#### `cellColumnNames: readonly string[]`

Conventional data-column names for cells in this grid. `findDGGSCellColumn(columnNames)` uses these names for case-insensitive detection and returns a unique `{columnName, decoder}` match, or `null` if no unique match exists.

#### `hasNumericRepresentation: boolean`

Whether the grid supports a 64-bit `bigint` cell representation.

#### `cellToLngLat(cell: DGGSCell): [number, number]`

Returns the center `[longitude, latitude]` of the specified cell.

#### `cellToBoundary(cell: DGGSCell): [number, number][]`

Returns the closed boundary as `[[longitude0, latitude0], ...]`.

Together with `name`, these fields make decoder objects structurally compatible with deck.gl-community's `GlobalGridLayer` contract.

#### `tokenToCell?(token: string): bigint`

Decodes a token string into a 64-bit cell index when the grid has a numeric representation.

#### `cellToToken?(cell: DGGSCell): string`

Returns the string representation of a cell when the grid has a numeric representation.

### `findDGGSCellColumn(columnNames, decoders?)`

Finds a conventional cell column for the bundled decoders, or for a supplied list of compatible decoders. The function returns the original column name and decoder when exactly one match is available. It returns `null` for missing or ambiguous matches so callers can request an explicit selection.

#### `cellToBoundaryFlat(cell: DGGSCell): number[]`

Returns the closed boundary as `[lng0, lat0, ...]`.

#### `cellToBounds(cell: DGGSCell): Bounds2D`

Returns the cell bounds as `[[minLng, minLat], [maxLng, maxLat]]`.
