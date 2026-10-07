# @math.gl/spatial-index (POC)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

import Example from '@site/src/components/spatial-index';

<Example inline interactive height={540} />

This proof of concept indexes static Cartesian boxes, points, and triangles. It uses a
median-split BVH with typed-array storage, retaining original row/triangle indices even when
construction reorders leaves. Inputs are copied. Empty indexes are supported. Bounding contact
counts as overlap, distances are Euclidean input-coordinate units, and ties select the lowest row.

```ts
import {BoxIndex, PointIndex, TriangleBVH} from '@math.gl/spatial-index';

const boxes = new BoxIndex({dimension: 2, bounds: [0, 0, 1, 1, 4, 4, 5, 5]});
boxes.search([0, 0], [2, 2]); // [0]
boxes.nearest([3, 3]); // {index: 1, distance: Math.sqrt(2)}
const points = new PointIndex({dimension: 3, positions: [0, 0, 0, 1, 2, 3]});
points.nearest([1, 2, 4]); // {index: 1, distance: 1}
```

## BoxIndex and PointIndex

`new BoxIndex({bounds, dimension, leafSize = 8})`: bounds are flat min coordinates followed by
max coordinates per record, e.g. `[minX,minY,maxX,maxY,...]`. dimension must be 2 or 3. Bounds
must be finite and ordered; zero-volume bounds are allowed. leafSize is a positive integer.

`new PointIndex({positions, dimension, leafSize})`: packed xy or xyz positions; points are
indexed as zero-volume boxes. No external ID registry is stored: map returned indices into
caller-owned IDs, feature properties, or tile references.

- `size`, `dimension`: input record count and coordinate dimension.
- `search(minimum, maximum)`: closed-box overlap candidates, sorted by row index.
- `nearest(point, {maxDistance = Infinity, filter?, distanceToItem?})`: nearest result
  `{index,distance}`, or null. Without refinement, distance is to the filled box (or point).
  `filter(index)` excludes rows. `distanceToItem(index)` can refine a candidate against actual
  geometry; return null to exclude it. Distances must be nonnegative and no less than the box
  distance. Geometry must be completely enclosed by the indexed box for pruning to be valid.
- `searchRay(origin, direction, maxDistance = Infinity)`: box candidates sorted by entry
  distance, then row index. Directions are normalized; a nonunit input does not change distances.
  An origin inside a box has entry distance zero. Ray direction must be finite and nonzero.

## TriangleBVH

`new TriangleBVH({positions, indices?, leafSize = 8})`: packed xyz vertices and optional
triangle-list vertex indices. Without indices, each three consecutive vertices form a triangle.
Returns original triangle numbers, not vertex numbers. Positions and indices are copied.

- `search(minimum, maximum)`: triangle **bounds** candidates, not exact triangle/box overlap.
- `intersectRay(origin, direction, {maxDistance = Infinity, backfaceCulling = false})`:
  closest triangle hit `{index,distance,point,barycentric}`, or null. Distances are Euclidean;
  barycentric components correspond to vertices a,b,c. Degenerate/coplanar triangles have no hit.
- `nearest(point, {maxDistance = Infinity, filter?})`: closest point on a filled triangle,
  returning `{index,distance,point}` or null. Degenerate triangles reduce to segments/points.

The ray and triangle geometry kernels are reused from `@math.gl/culling/queries`.
`@math.gl/spatial-index/boxes` provides BoxIndex and PointIndex without the triangle code.

## loaders.gl adapter boundary

GeoArrow adapters can generate one bounds record per non-null row, maintain a mapping back to
Arrow rows, and refine candidates against actual geometry. For nearest-feature queries, use
`distanceToItem` rather than treating nearest bounds as nearest geometry. Tile runtimes can use
an index for loaded-content queries while retaining refinement, availability and loading state
in their existing tile hierarchy. This PR changes no loaders.gl code.

## POC limits

Construction uses repeated median sorting (O(n log² n)), and queries can degrade to O(n).
Ray candidates are materialized and sorted before triangle refinement. Incremental updates,
packed-buffer serialization/restoration, k-nearest queries, SAH construction, and performance
budgets are deferred. Rebuild after changing data. Geometry kernels are not watertight-certified;
near-degenerate and extreme-scale numerical qualification is incomplete. This is not a tile
scheduler, an ellipsoidal index, or a geodesic nearest-neighbor implementation.

## Qualification workloads

The POC includes deterministic tests of realistic workloads, rather than relying only
on small example queries:

- **16,384 three-dimensional tile boxes:** range and filtered nearest queries are
  compared with exhaustive overlap and center-distance calculations. Across leaf sizes
  1, 8 and 64, nearest queries must refine fewer than 1% of the stored boxes. This checks
  pruning structurally, without a machine-dependent timing threshold.
- **8,192 indexed terrain triangles:** ray hits and nearest surface points are checked
  against analytic plane intersections and orthogonal projections, independently of
  the triangle kernels used by the BVH. Distance limits and misses are included.
- Randomized small meshes are also compared against exhaustive triangle-kernel queries;
  boundary contact, input copying, stable ties, empty indexes and degenerate geometry
  have focused coverage.

These qualify correctness and pruning on the tested distributions, not a general
performance guarantee. Clustered or overlapping bounds can still produce linear scans.
