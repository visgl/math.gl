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

### Antimeridian boundary options

All bundled decoders accept an optional `DGGSBoundaryOptions` argument on
`cellToBoundary(cell, options?)`, `cellToBoundaryFlat(cell, options?)`, and
`cellToBounds(cell, options?)`:

```typescript
const options = {unwrap: true, referenceLongitude: 180};
const boundary = H3Decoder.cellToBoundary(cell, options);
const flatBoundary = H3Decoder.cellToBoundaryFlat(cell, options);
const bounds = H3Decoder.cellToBounds(cell, options);
```

`unwrap` defaults to `false`, preserving existing geometry. With `unwrap: true`,
longitudes follow the preceding vertex continuously: an edge from 179° to -179°
becomes 179° to 181°. The optional `referenceLongitude` places the first vertex
near the supplied longitude; it is ignored unless `unwrap` is enabled. Returned
longitudes and bounds may lie outside [-180, 180]. Bounds are the minimum and
maximum coordinates of the resulting boundary, not a wrapped geographic interval.

### `unwrapDGGSBoundary(boundary, referenceLongitude?)`

This standalone export applies the same policy to readonly longitude/latitude
pairs from any decoder. It returns fresh pairs without mutating the input.

```typescript
import {unwrapDGGSBoundary} from '@math.gl/dggs';

unwrapDGGSBoundary([[179, 10], [-179, 10]]);
// [[179, 10], [181, 10]]
```

Without a reference, the first longitude stays unchanged. Subsequent vertices
shift by multiples of 360° to minimize the distance to the preceding longitude.
Exact 180° ties retain their direction. Latitude, vertex order, and open or closed
boundaries are preserved; an empty boundary returns an empty array.

Boundaries whose input longitude span is at least 360° are conservatively copied
unchanged, preserving explicit full-world cells. Closed rings that acquire net
longitude winding are also copied unchanged, even when a reference is supplied.
Polar cells need additional topology handling. Neither API splits polygons at the
seam, computes geodesic edges, nor performs renderer tessellation.

For example, a decoder adapter can opt into this policy for `GlobalGridLayer`:

```typescript
import {H3Decoder} from '@math.gl/dggs';
import {GlobalGridLayer} from '@deck.gl-community/geo-layers';

const globalGrid = {
  ...H3Decoder,
  cellToBoundary: cell => H3Decoder.cellToBoundary(cell, {unwrap: true})
};
const layer = new GlobalGridLayer({id: 'h3-cells', data: cells, globalGrid});
```

Consumers that already unwrap boundaries should apply the policy only once in
their integration. Renderer-specific polygon normalization and globe subdivision
remain the renderer's responsibility.
