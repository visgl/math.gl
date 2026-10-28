# @math.gl/geometry (POC)

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
import {BoxIndex, PointIndex, TriangleBVH} from '@math.gl/geometry';

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
  distance apart from floating-point roundoff. Geometry must be completely enclosed by the
  indexed box for pruning to be valid.
- `searchRay(origin, direction, maxDistance = Infinity)`: box candidates sorted by entry
  distance, then row index. Directions are normalized; a nonunit input does not change distances.
  An origin inside a box has entry distance zero. Ray direction must be finite and nonzero.
- `intersectRay(origin, direction, {maxDistance = Infinity, filter?, intersectItem?})`:
  nearest accepted box/geometry hit, returning `{index,distance}` or null. Unlike
  `searchRay`, this near-first branch-and-bound traversal does not materialize all
  candidates. `filter(index)` excludes rows before refinement.
  `intersectItem(index, currentMaxDistance)` returns an exact Euclidean hit distance
  or null; without it, box entry distance is used. Geometry must be enclosed by its
  indexed box, and refinement distances must be nonnegative and at least the box
  entry distance (allowing eight relative floating-point rounding steps between
  independently evaluated kernels). Refined distances are never clamped or rounded;
  broad-phase pruning uses the same allowance so inclusive limits and ties are retained.
  Rejected hits do not clip later candidates. Limits are inclusive;
  ties select the lowest original row. Callback order is unspecified, not an
  all-intersections stream. Exceptions propagate.

## TriangleBVH

`new TriangleBVH({positions, indices?, leafSize = 8})`: packed xyz vertices and optional
triangle-list vertex indices. Without indices, each three consecutive vertices form a triangle.
Returns original triangle numbers, not vertex numbers. Positions and indices are copied.

- `search(minimum, maximum)`: triangle **bounds** candidates, not exact triangle/box overlap.
- `intersectRay(origin, direction, {maxDistance = Infinity, backfaceCulling = false, filter?, acceptHit?})`:
  closest triangle hit `{index,distance,point,barycentric}`, or null. Distances are Euclidean;
  barycentric components correspond to vertices a,b,c. Degenerate/coplanar triangles have no hit.
  `filter(index)` excludes an original triangle before exact intersection.
  `acceptHit(hit)` can reject an exact point using barycentric weights, source validity,
  clipping or other application constraints. Rejection does not shorten the ray;
  a valid surface behind a foreground hole can still be selected. Predicates must
  treat the candidate as immutable; they run only for hits that could improve the
  accepted result, in unspecified traversal order, not as an all-intersections API.
  Exceptions propagate. With no predicates, existing behavior is unchanged.
- `nearest(point, {maxDistance = Infinity, filter?})`: closest point on a filled triangle,
  returning `{index,distance,point}` or null. Degenerate triangles reduce to segments/points.
- `intersectSphere(center, radius, {maxWork?, maxResults?, filter?})`: closed-sphere contacts
  as `{result, complete, work}`. Each result contains `{index,distance,point}` for the closest
  point on one accepted triangle, including face, edge and vertex contacts. Results are sorted
  by original triangle index, not distance. Radius must be finite and nonnegative; zero tests
  point contact. Broad-phase bounds expand slightly for roundoff, but the exact distance must
  still be at most the unmodified radius. Arithmetic/bounds overflow throws. Adjacent triangles can
  return coincident points; this is not a reduced contact manifold or a swept collision test.

## Bounded queries

`BoxIndex.nearestBoxQuery(minimum, maximum, {maxDistance?, maxWork?, filter?, distanceToItem?})`
finds the nearest indexed box to a filled query box. Its result envelope and work accounting
match `nearestQuery`; a point is a zero-volume query box. Refinement distances must be at
least the box-to-box lower bound apart from roundoff, and both geometries must stay inside
their respective boxes. This lets segment queries share branch-and-bound traversal.

`BoxIndex`, `PointIndex` and `TriangleBVH` provide `searchQuery`, `nearestQuery` and
`intersectRayQuery`. They take their corresponding query's arguments plus an optional
`maxWork` and return `IndexQueryResult<T>`:

```ts
const query = boxes.nearestQuery([3, 3], {maxWork: 256});
if (query.complete) {
  // query.result is the final nearest row, or null for a completed miss.
} else {
  // A result is provisional; null does not establish that nothing is nearby.
  // Retry with a larger budget, defer, or use an application-defined fallback.
}
```

One work unit visits a tree node or a leaf item. A node visit includes its bounds
test and up to two child-bound tests used for ordering/pruning. An item visit includes
its bounds test, optional filter, and at most one exact refinement. Pruned and rejected
visits count too. `work` never exceeds `maxWork`. Input validation and constant query
setup happen even with zero budget. Empty indexes complete with zero work; a nonempty
index with zero budget returns `complete: false` without invoking filters/refinements.
Completing on the last permitted visit returns `complete: true`.

`maxWork` defaults to Infinity; otherwise it must be a nonnegative safe integer.
This is a deterministic traversal budget, not a wall-clock, allocation, callback-runtime,
or numerical-error bound. Result sorting and formatting are outside the visit counter.
There is no continuation cursor. An incomplete nearest/ray result may be superseded by
a closer hit or a lower-index tie; it is never a certified final result.

`searchQuery(minimum, maximum, {maxWork?, maxResults?, filter?})` additionally supports
an accepted-result limit. `maxResults` follows the same validation as `maxWork`.
The filter runs only after box overlap. Finding one more accepted row than the limit
returns `complete: false`; exactly filling the limit can still complete if the remaining
search proves there are no further matches. At most `maxResults` rows are retained.
Partial rows are sorted by original index but are an unspecified traversal subset, not
the lowest-index or closest subset. Sphere queries use these same limits and count their
closest-point refinement within the leaf item visit. Callbacks may run for the one extra
match needed to establish truncation; they must not assume every call yields a returned row.

The existing `search`, `nearest` and `intersectRay` methods remain unlimited. They never
silently return budget-truncated results, even when passed a wider options object that
contains `maxWork`. `searchRay` remains an unlimited all-candidates query.

### Segment clearance and capsule overlap

`TriangleBVH.nearestSegment(start, end, {maxDistance?, filter?})` returns the minimum
Euclidean separation between a closed segment and accepted triangles, or null within
the inclusive distance limit. `nearestSegmentQuery` additionally takes `maxWork` and
returns the completion envelope. Each `TriangleSegmentResult` contains `index`, `distance`,
triangle `point`, `segmentPoint`, and `segmentFraction` in [0, 1]. Equal triangle distances
prefer the lowest original index. The segment's AABB supplies a conservative lower bound
for pruning; long diagonal segments may have loose bounds and require linear traversal.
The unlimited method ignores work limits in wider option objects.

`intersectCapsule(start, end, radius, {maxWork?, maxResults?, filter?})` returns a bounded
list of these closest pairs, sorted by original triangle index, whose distance is at most
the radius. Radius must be finite and nonnegative. A zero-length axis geometrically reduces
to a sphere; radius zero tests the closed segment, including coplanar triangle overlap.
Capsule bounds use a roundoff allowance; exact refinement uses the original radius.
One leaf-item work unit includes the full segment/triangle refinement. Capacity truncation
has the same completion rules as sphere queries. Output points are detached.

A capsule also describes the volume covered by a fixed-radius sphere translating along
a straight segment. A complete empty query rules out that swept-volume overlap with the
indexed geometry under the floating-point query contract. The returned fraction locates
minimum separation, **not the earliest contact**; for example, a sphere approaching a plane
touches before its center crosses the plane. No time-of-impact, changing-radius, rotating,
or curved-path sweep is supplied. Coplanar overlaps may have many minimizing pairs.

The new low-level kernels are exported from `@math.gl/geometry/culling`:

- `getClosestPointsOnSegments(a0, a1, b0, b1)` returns `distance`, `pointA`, `pointB`,
  `fractionA`, and `fractionB` for two closed segments.
- `getClosestPointsSegmentTriangle(start, end, a, b, c)` returns `distance`, `segmentPoint`,
  `trianglePoint`, and `segmentFraction`. It considers face crossings, both endpoint/face
  distances, and all three segment/edge distances. Degenerate triangles reduce to edges/points.

Inputs must be finite XYZ points. Coordinate spans and output distances that overflow throw.
Kernels translate and uniformly scale before dot/cross products, then restore output points
and compute their distance. Returned points remain inside their source bounding boxes despite
roundoff. Equal **computed** distances prefer the lowest segment parameter (then the second
parameter for two segments); this is not a promise of the earliest mathematical minimizer.
These are Float64 algorithms, not exact predicates: grazing contact and extremely ill-conditioned
geometry can still be affected by rounding. Scaling does not recover features already lost in
input coordinates or guarantee accuracy for arbitrarily disparate feature sizes. Use local frames.

For background on closest-pair formulations, see Geometric Tools'
[segment/triangle query](https://github.com/davideberly/GeometricTools/blob/master/GTE/Mathematics/DistSegment3Triangle3.h)
and [segment-distance analysis](https://www.geometrictools.com/Documentation/DistanceLine3Line3.pdf).

The ray and triangle geometry kernels are reused from `@math.gl/geometry/culling`.
`@math.gl/geometry` provides BoxIndex and PointIndex without the triangle code.

For terrain picking, keep physical heights and validity masks in the caller (for
example loaders.gl height grids). The BVH indexes displayed geometry; it does not
infer datums, reconstruct elevation, or apply exaggeration:

```ts
const hit = mesh.intersectRay(origin, direction, {
  maxDistance: 1000,
  filter: triangleIndex => loadedTriangles.has(triangleIndex),
  acceptHit: candidate => isValidSurfacePoint(candidate.index, candidate.barycentric)
});
```

This acceptance boundary supports Tangram's terrain-query conformance work without
importing terrain or renderer concepts into math.gl. Cooperative construction,
explicit index-memory admission and an exact zero-budget fallback remain prerequisites
to replacing Tangram's production query index; this change does not claim that switch.

## loaders.gl adapter boundary

GeoArrow adapters can generate one bounds record per non-null row, maintain a mapping back to
Arrow rows, and refine candidates against actual geometry. For nearest-feature queries, use
`distanceToItem` rather than treating nearest bounds as nearest geometry. Tile runtimes can use
an index for loaded-content queries while retaining refinement, availability and loading state
in their existing tile hierarchy. This PR changes no loaders.gl code.

## POC limits

Construction uses repeated median sorting (O(n log² n)), and queries can degrade to O(n).
`searchRay` materializes and sorts all broad-phase candidates; nearest `intersectRay`
queries instead prune against accepted hits during traversal. Incremental updates,
packed-buffer serialization/restoration, k-nearest queries, SAH construction, and measured
latency budgets are deferred. Rebuild after changing data. Geometry kernels are not watertight-certified;
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
