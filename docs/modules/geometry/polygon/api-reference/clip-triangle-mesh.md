# clipTriangleMesh

`clipTriangleMesh` is exported from `@math.gl/geometry` and its existing polygon entry.
It intersects an already projected indexed triangle mesh with disjoint convex target-plane
regions, preserving triangle winding and returning provenance for attribute interpolation.
It does not project coordinates, repair spherical topology or infer antimeridian edge paths.

```ts
import {clipTriangleMesh, interpolatePackedAttributes} from '@math.gl/geometry';

const clipped = clipTriangleMesh(mesh, {
  regions: [[[-180, -90], [180, -90], [180, 90], [-180, 90]]],
  periodic: {axis: 0, minimum: -180, period: 360}
});
const attributes = interpolatePackedAttributes(sourceBytes, clipped, attributeLayout);
```

Input positions are flat XY or XYZ (`size: 3`); indices contain three entries per triangle.
Each region is a convex ring without a repeated closing point, in either winding. Regions
must have disjoint interiors. For a concave boundary, holes or disconnected components,
triangulate the domain first (for example with `earcut`) and pass its triangles as regions.
Do not substitute a projection's rendering envelope for its valid domain. Native geographic
cuts and external streaming clippers must run before triangulating source geometries.

Optional `periodic` shifts **already unwrapped** triangles into the canonical target interval.
The regions must lie within that interval. Refined vertices must already use the correct local
period branch; this utility cannot determine which geographic route an input edge represents.
`periodicCopies` identifies the integer shift applied to each emitted triangle. UVs are
interpolated from original vertices independently of the target-period shift.

The result contains `positions`, `indices`, `sourceVertexIndices`, `sourceVertexWeights`,
`sourceTriangleIndices` and `periodicCopies`. Each vertex has three original vertex indices
and barycentric weights; use them with `interpolatePackedAttributes` for UVs, colors or
categorical attributes. Categorical values must agree across contributors, or callers must
split their source mesh at that attribute seam. Coincident output vertices are never welded.
Z is linearly interpolated; clipping is entirely in XY.

Defaults are 65,536 output vertices, 131,072 triangles and 1,000,000 triangle/copy/region
intersection attempts. Set `maxVertices`, `maxTriangles` and `maxIntersections` explicitly
for larger jobs. A region has at most 1,024 vertices. Exhaustion throws, with no partial result.
Nonfinite positions, bad indices, nonconvex regions and unrepresentable arithmetic also throw.
Overlapping regions are a caller error and can duplicate output; cross-region topology is not
validated. Curved boundaries and nonlinear attributes require adequate subdivision before
clipping. Use the existing `subdivideTriangleMesh` for sampled target-space transform error.
