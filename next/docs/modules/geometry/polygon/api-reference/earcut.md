# earcut

![From-v3.5](https://img.shields.io/badge/From-v3.5-blue.svg?style=flat-square)

Computes a triangulation of a polygon using the [earcut library](https://github.com/mapbox/earcut).

```
import {earcut} from '@math.gl/geometry';



earcut([10, 0, 0, 50, 60, 60, 70, 10]);

// returns [1, 0, 3, 3, 2, 1]



// Polygon with a hole starting at vertex 4

earcut([0, 0, 100, 0, 100, 100, 0, 100, 20, 20, 80, 20, 80, 80, 20, 80], [4]);

// returns [3, 0, 4, 5, 4, 0, 3, 4, 7, 5, 0, 1, 2, 3, 7, 6, 5, 1, 2, 7, 6, 6, 1, 2]
```

## Usage[​](#usage "Direct link to Usage")

```
earcut(positions[, holeIndices, size = 2, areas, plane]);
```

Arguments:

* `positions` (Array|TypedArray) - a flat array of the vertex positions that define the polygon.
* `holeIndices` (Array, optional) - is an array of hole indices if any (e.g. \[5, 8] for a 12-vertex input would mean one hole with vertices 5–7 and another with 8–11).
* `size` (Number, optional) - the number of elements in each vertex. Size `2` will interpret `positions` as `[x0, y0, x1, y1, ...]` and size `3` will interpret `positions` as `[x0, y0, z0, x1, y1, z1, ...]`. Default `2`.
* `areas` (Array, optional) - areas of outer polygon and holes as computed by `getPolygonSignedArea()`. Can be optionally supplied to speed up triangulation
* `plane` (String, optional) - the 2D projection plane on which to tesselate a 3D polygon on. One of `xy`, `yz`, `xz`. Default to `xy`

Returns:

An array of indices into the `positions` array that describes the triangulation of the polygon

## Implementation and performance[​](#implementation-and-performance "Direct link to Implementation and performance")

The custom implementation incorporates the general-purpose optimizations from [loaders.gl's WKB triangulator](https://github.com/visgl/loaders.gl/blob/5cbc82c81c78e297cfdc5e04b3aefc97bc3d0ba5/modules/core/src/arrow-geometry/triangulate-wkb.ts): reusable vertex nodes and hole queues, direct vertex indices in the clipping loop, and a combined coordinate-reading and signed-area pass when areas are not supplied. WKB header parsing, binary ring layouts, and little-endian decoding remain specific to loaders.gl's binary-input API.

Precomputed areas must use the same projection plane as triangulation. Polygons with more than 80 input vertices use spatial hashing on that plane. Output indices refer to vertices, so multiply by `size` to locate coordinates in `positions`.

Scratch nodes are reused across calls, with all mutable node fields reset before reuse. Nested calls and exceptions restore scratch state. Calls requiring more than 65,536 scratch nodes release the node cache on completion; smaller calls keep it for reuse. Input arrays and returned triangle arrays are never retained in the cache. As with upstream Earcut, self-intersections and other invalid polygons are handled on a best-effort basis, without a guarantee of a correct triangulation.
