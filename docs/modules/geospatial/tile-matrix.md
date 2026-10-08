# Tile matrices

`@math.gl/geospatial` provides protocol-independent geometry for regular rectangular tile grids.
WMTS/OGC parsing, network discovery, request generation and reprojection belong to adapters.
Variable-width rows and nonrectangular spatial hierarchies are not represented.

A `TileMatrix` requires an opaque `id`, positive `resolution` in coordinate units per pixel,
`origin` in X/Y order, explicit `cornerOfOrigin`, `tileSize` in pixels and `matrixSize` in tiles.
Columns increase along X. Rows decrease along Y for `topLeft`, and increase for `bottomLeft`.
A `TileMatrixSet` associates a CRS identifier with matrices; IDs must be unique. Array order does
not imply zoom, and matrices need not form a quadtree. Adapters must resolve CRS axis semantics
before constructing matrices. These utilities perform no CRS lookup or transformation.

```typescript
import {getTileBounds, getTileIndex, isTileIndexInRange} from '@math.gl/geospatial';

const matrix = {
  id: 'coarse', resolution: 2, origin: [200000, 4600000],
  cornerOfOrigin: 'topLeft', tileSize: [256, 256], matrixSize: [4, 3]
} as const;
getTileBounds(matrix, 1, 0); // [200512, 4599488, 201024, 4600000]
getTileIndex(matrix, [200600, 4599600]); // [1, 0]
isTileIndexInRange(matrix, 4, 0); // false
```

- `validateTileMatrix(matrix)` throws `RangeError` for invalid or nonfinite geometry.
- `getTileBounds(matrix, column, row)` returns `[minX, minY, maxX, maxY]`; out-of-range indices throw.
- `getTileIndex(matrix, coordinate)` returns `[column, row]`, or `null` outside the matrix or for
  nonfinite input. Intervals are half-open in the direction of increasing column/row. The origin
  edge is included; the opposite outer edge is excluded. Indices never wrap or clamp. Lookup
  compares computed grid edges, so fractional resolutions have the same edge ownership as bounds.
  It takes logarithmic time in matrix dimensions and constant space.
- `isTileIndexInRange(matrix, column, row, limits?)` checks integer indices and optional inclusive
  `TileMatrixLimits`. Malformed limits throw. Limits describe a rectangular coverage subset;
  they do not guarantee a tile exists on a server.

All utilities validate matrix geometry. Callers supply complete geometry rather than partially
normalized service metadata. Matrices and coordinate inputs are not mutated.
