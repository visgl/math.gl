# earcut

![From-v3.5](https://img.shields.io/badge/From-v3.5-blue.svg?style=flat-square)

Computes a triangulation of a polygon using the [earcut library](https://github.com/mapbox/earcut).

```
import {earcut} from '@math.gl/geometry/polygon';



earcut([10, 0, 0, 50, 60, 60, 70, 10]);

// returns [1, 0, 3, 1, 3, 2]



// Polygon with a hole starting at vertex 4

earcut([0, 0, 100, 0, 100, 100, 0, 100, 20, 20, 80, 20, 80, 80, 20, 80], [4]);

// returns [0, 4, 7, 5, 4, 0, 5, 0, 1, 5, 1, 2, 3, 0, 7, 3, 7, 6, 6, 5, 2, 6, 2, 3]
```

## Usage[​](#usage "Direct link to Usage")

```
earcut(positions[, holeIndices, size = 2, areas, plane, options]);
```

Arguments:

* `positions` (Array|TypedArray) - a flat array of the vertex positions that define the polygon.
* `holeIndices` (Array, optional) - is an array of hole indices if any (e.g. \[5, 8] for a 12-vertex input would mean one hole with vertices 5–7 and another with 8–11).
* `size` (Number, optional) - the number of elements in each vertex. Size `2` will interpret `positions` as `[x0, y0, x1, y1, ...]` and size `3` will interpret `positions` as `[x0, y0, z0, x1, y1, z1, ...]`. Default `2`.
* `areas` (Array, optional) - areas of outer polygon and holes as computed by `getPolygonSignedArea()`. Can be optionally supplied to speed up triangulation
* `plane` (String, optional) - the 2D projection plane on which to tesselate a 3D polygon on. One of `xy`, `yz`, `xz`. Default to `xy`
* `options` (`EarcutOptions`, optional) - `triangulation: 'fast' | 'balanced'` selects the clipping order. Default `'fast'`.

Returns:

An array of indices into the `positions` array that describes the triangulation of the polygon. Triangle order and the choice of valid diagonals are implementation details and may change between versions.

## Implementation and performance[​](#implementation-and-performance "Direct link to Implementation and performance")

The triangulation core uses bounding-box blocks to accelerate hole bridging, radix sorting for spatial hashing, local filtering around bridges, and an explicit stack for polygon splits. Strictly convex hashed rings skip interior-point checks.

Reusable vertex nodes and hole queues reduce allocations across calls. When areas are not supplied, coordinate reads and signed-area accumulation share one pass. The `areas` parameter skips this calculation; the `plane` parameter selects the coordinates used by ring construction and spatial indexes.

Precomputed areas must use the same projection plane as triangulation. Polygons with more than 80 input vertices use spatial hashing on that plane. Output indices refer to vertices, so multiply by `size` to locate coordinates in `positions`.

Scratch storage is isolated for calls nested through input getters and reset even when a getter throws. Node references in sorting and bridge-index buffers are cleared after use. Calls exceeding 65,536 cached nodes or spatial-index entries release their caches on completion; smaller calls keep bounded storage for reuse. Input arrays and returned triangle arrays are never retained in the cache. As with upstream Earcut, self-intersections and other invalid polygons are handled on a best-effort basis, without a guarantee of a correct triangulation.

When the leftmost vertex of a hole is also a vertex of the outer ring or of a hole that is already bridged, the hole is bridged at that shared vertex. Rings that touch at a vertex are common in clipped vector tiles.

## Choosing a triangulation strategy[​](#choosing-a-triangulation-strategy "Direct link to Choosing a triangulation strategy")

```
import {earcut, type EarcutOptions} from '@math.gl/geometry/polygon';



const options: EarcutOptions = {triangulation: 'balanced'};

const indices = earcut(positions, holeIndices, 2, undefined, 'xy', options);

// Precomputed areas and projections work with either strategy:

const projected = earcut(positions3D, holeIndices, 3, areasXZ, 'xz', options);
```

`fast` follows upstream Earcut's clipping order and favors throughput on typical vector-tile fills. `balanced` skips the next candidate after each cut, reducing long fans on convex boundaries. It can be useful when triangles will be refined for nonlinear projection, texture interpolation, or other mesh processing.

These names describe strategies, not guarantees: speed depends on the polygon, and `balanced` can be faster on some shapes. Neither strategy guarantees a minimum angle, aspect ratio, constrained Delaunay triangulation, or a bound on interpolation error. Both preserve the same API, winding convention, and best-effort handling of invalid polygons. Applications requiring an error bound must still validate or refine their mesh.
