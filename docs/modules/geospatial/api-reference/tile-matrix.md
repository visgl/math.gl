# Tile matrices

`@math.gl/geospatial/tile-matrix` provides geometry, extent queries and level selection for
regular rectangular tile grids in any coordinate system. The subpath has no runtime dependencies;
its types and functions are also exported from `@math.gl/geospatial`.

```typescript
import {getTileBounds, getTileIndex, getTileRange, selectTileMatrix}
  from '@math.gl/geospatial/tile-matrix';
import type {TileMatrix, TileMatrixSet} from '@math.gl/geospatial/tile-matrix';

const matrix: TileMatrix = {
  id: '2m', resolution: 2, origin: [200000, 4600000],
  cornerOfOrigin: 'topLeft', tileSize: [256, 256], matrixSize: [4, 3]
};
getTileBounds(matrix, 1, 0); // [200512, 4599488, 201024, 4600000]
getTileIndex(matrix, [200600, 4599600]); // [1, 0]
getTileRange(matrix, [200512, 4599488, 201024, 4600000]);
// {minTileColumn: 1, maxTileColumn: 1, minTileRow: 0, maxTileRow: 0}

const matrixSet: TileMatrixSet = {
  crs: 'EPSG:32618',
  matrices: [{...matrix, id: '8m', resolution: 8}, matrix]
};
selectTileMatrix(matrixSet, 3)?.id; // '2m'
```

## Geometry contract

`TileMatrix` and `TileMatrixSet` have readonly fields; inputs are never mutated.

| Field | Meaning |
| --- | --- |
| `id` | Opaque string identifier, independent of numeric zoom or array index. |
| `resolution` | Positive finite coordinate units per pixel, the same on both axes. |
| `origin` | Origin in canonical X/Y order in the matrix coordinate system. |
| `cornerOfOrigin` | Required `topLeft` or `bottomLeft`. Columns increase along X; rows decrease along Y for top-left and increase for bottom-left. |
| `tileSize` | Positive integer width and height in pixels; rectangular tiles are supported. |
| `matrixSize` | Positive integer width and height in tiles. |

A `TileMatrixSet` associates a `crs` identifier with `matrices` having unique IDs. Array order does
not imply zoom, matrices need not form a quadtree, and levels can have different origins and sizes.
Utilities use the supplied coordinate units without interpreting the CRS identifier.

Adapters resolve CRS axis order and units before constructing a matrix. Incomplete service metadata
is distinct from complete geometry. Parsing WMTS/OGC documents, discovery, tile fetching, rendering,
reprojection and variable-width rows belong outside these utilities.

## validateTileMatrix(matrix)

Throws `RangeError` for malformed geometry, nonfinite extents or tile spans too small to distinguish
at the origin or far edge in floating-point coordinates. All geometry utilities validate the matrix.

## getTileBounds(matrix, column, row)

Returns `TileMatrixBounds`, a readonly `[minX, minY, maxX, maxY]` tuple in matrix coordinates.
Indices must be integers inside the matrix; out-of-range indices throw `RangeError`.

## getTileIndex(matrix, coordinate)

Returns `[column, row]`, or `null` for nonfinite coordinates or a point outside the matrix.
Intervals are half-open in the direction of increasing column/row: the origin edge is included and
the opposite outer edge is excluded. A shared edge belongs to the following column or row.
Indices never wrap or clamp.

Lookup compares the same computed edges as `getTileBounds()`, preserving edge ownership with
fractional resolutions. It takes logarithmic time in matrix dimensions and constant space.

## getTileRange(matrix, bounds, limits?)

Returns one compact, inclusive `TileMatrixLimits` rectangle, or `null` for no intersection.
The result has `minTileColumn`, `maxTileColumn`, `minTileRow` and `maxTileRow` fields. Queries are
clipped to the matrix and, when supplied, the coverage limits. Tiles are not enumerated.

Bounds must be finite `[minX, minY, maxX, maxY]` coordinates with ordered minima and maxima;
malformed bounds or limits throw `RangeError`. These queries have no antimeridian wrapping.

Positive-width/height queries include tiles with positive overlap on that axis and exclude
neighbors that only touch the query edge. A zero-width or zero-height query uses the point-lookup
edge ownership on that axis. Thus a point query at the origin is included, while a point on the far
outer edge is excluded. Fractional edges use the same arithmetic as bounds and point lookup.

Query time is logarithmic in matrix dimensions, with constant space. Applications decide how to
enumerate the returned rectangle; even a compact range can describe many tiles.

## isTileIndexInRange(matrix, column, row, limits?)

Checks integer indices and optional inclusive `TileMatrixLimits`. Malformed limits throw
`RangeError`. Limits must fit inside matrix dimensions and describe a rectangular coverage subset.
They do not guarantee that a tile exists on a server.

## selectTileMatrix(matrixSet, targetResolution)

Selects the **coarsest matrix whose resolution is at or below the target**. If all matrices are
coarser than the target, returns the finest available matrix. Returns `null` for an empty set.
Equal-resolution ties retain the first matrix in the supplied array. The returned matrix is the
original object, and the set is not sorted or mutated.

The target must be positive and finite, in the same coordinate units per pixel as the matrices.
For a CRS using metres, this is metres per pixel; for a degree-based grid, it is degrees per pixel.
Convert viewport or ground-resolution inputs to those units before calling. No projection,
latitude-dependent scale correction or coverage-based selection is performed.

Every matrix is validated and duplicate IDs throw `RangeError`. Selection takes linear time and
linear space for identifier validation, independent of tile counts.

## Related utilities

[Geographic tile queries](./geographic-tiles.md) provide point lookup, bounds and extent ranges for
a particular equal-angle longitude/latitude quadtree. They handle antimeridian crossings and include
the world’s outer edges, unlike the explicit, nonwrapping, half-open matrix contract here.

[Globe horizon bounds](./globe-queries.md) produce geographic extents for visibility queries.
[DGGS utilities](../../dggs/README.md) decode addresses for global grid systems such as S2, H3 and
quadkeys. These are complementary to rectangular matrix geometry, rather than interchangeable APIs.
