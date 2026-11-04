# Triangle topology

`analyzeTriangleTopology({indices, vertexCount})` checks the oriented edge condition for indexed
triangle meshes and returns an `Int32Array` of opposite half-edge offsets plus counts for boundary,
over-subscribed, inconsistently oriented, and degenerate edges or triangles. A half-edge offset is
the index-stream offset of its first vertex; the next corner of its triangle is its end.
Disconnected closed shells are allowed. This check does not detect self-intersections or establish
that every vertex link is manifold.

`applyTriangleIndexReplacements(indices, replacementOffsets, replacementValues)` returns a new
`Uint32Array` with sparse replacements applied to index-stream offsets. Offsets must be strictly
increasing. This can reconstruct an authored topology from a render index stream without inferring
merges from coincident positions. Callers retain their original render indices and vertex attributes.

```ts
import {analyzeTriangleTopology, applyTriangleIndexReplacements} from '@math.gl/geometry';

const manifoldIndices = applyTriangleIndexReplacements(renderIndices, offsets, values);
const analysis = analyzeTriangleTopology({indices: manifoldIndices, vertexCount});
if (analysis.closedOrientedManifold) {
  // Use analysis.oppositeHalfEdges for adjacency-based processing.
}
```
