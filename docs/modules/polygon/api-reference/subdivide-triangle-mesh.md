# subdivideTriangleMesh

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

Adaptively refines an indexed triangle mesh through a supplied coordinate transform. Use it to approximate filled polygons or deform textured bitmap meshes when transformed triangles need more vertices to follow a curved surface.

The utility checks both edge and triangle-interior samples. A failing triangle splits all three edges; adjacent triangles split the same shared edges. The resulting mesh remains conforming when the input is conforming. Vertices are shared by index, never welded by coordinate value.

For applications with a known source-space resolution requirement, opt into `refinement: 'source-edge'`. This splits only indexed edges longer than a finite `maxEdgeLength` and transforms each output vertex once, skipping all error probes. Both modes preserve conformity, winding, seam identities, and attribute provenance.

## Source-edge refinement

```ts
const mesh = subdivideTriangleMesh({
  positions: [0, 0, 1, 0, 1, 1, 0, 1],
  indices: [0, 1, 2, 0, 2, 3]
}, {
  refinement: 'source-edge',
  maxEdgeLength: 0.25,
  transform: ([x, y]) => [x, y, Math.sin(2 * x)],
  targetSize: 3
});
```

Use this mode when the application has its own resolution policy, such as a source tile's angular-span limit. It provides **no target-space accuracy guarantee** and does not detect invalid domains between output vertices. Choose the edge length for the projection and geometry being rendered; use the default sampled-error mode when target-space error should drive refinement. `tolerance` is not accepted in source-edge mode, to avoid implying that it is checked.

## Polygon with holes

Triangulate the polygon in its source coordinate space, then refine that mesh. This preserves the original triangles' source coverage and hole boundaries. For already triangulated loader output, pass its positions and indices directly.

```ts
import {earcut, subdivideTriangleMesh} from '@math.gl/polygon';

const positions = [
  0, 0, 4, 0, 4, 4, 0, 4, // exterior
  1, 1, 1, 3, 3, 3, 3, 1  // hole
];
const mesh = subdivideTriangleMesh({
  positions,
  indices: earcut(positions, [4])
}, {
  transform: ([x, y]) => [x, y, x * x],
  targetSize: 3,
  tolerance: 0.05
});
```

Triangulation must represent the intended source geometry. Edges, heights, and triangle interiors interpolate linearly in source coordinates. Longitude/latitude input does not acquire geodesic semantics. Split projection seams, clip invalid domains, and handle folds or self-intersections according to your application's geometry model before calling.

## Textured bitmap mesh

Start with triangles covering the image rectangle in the space where its UV mapping is defined. Refinement interpolates within that source mesh before applying the transform. For example, imagery whose UVs are affine in Mercator XY should be subdivided in Mercator XY, even when it will be displayed through a different projection.

```ts
const positions = [0, 0, 1, 0, 1, 1, 0, 1];
const uvs = [0, 0, 1, 0, 1, 1, 0, 1];
const mesh = subdivideTriangleMesh({positions, indices: [0, 1, 2, 0, 2, 3]}, {
  transform: ([x, y]) => [x, y, Math.sin(2 * x)],
  targetSize: 3,
  tolerance: 0.01
});
const refinedUVs = new Float32Array(mesh.positions.length / 3 * 2);
for (let vertex = 0; vertex < refinedUVs.length / 2; vertex++) {
  for (let component = 0; component < 2; component++) {
    for (let slot = 0; slot < 3; slot++) {
      const source = mesh.sourceVertexIndices[vertex * 3 + slot];
      const weight = mesh.sourceVertexWeights[vertex * 3 + slot];
      refinedUVs[vertex * 2 + component] += uvs[source * 2 + component] * weight;
    }
  }
}
// Render mesh.positions, mesh.indices, and refinedUVs together.
```

This preserves the source mesh's piecewise affine UV mapping. Duplicate vertices at UV seams so each side retains its own attributes. Use the same weights for other linearly interpolated attributes. Categorical attributes require an application policy; normals may require recomputation after deformation.

## API

`subdivideTriangleMesh(mesh, options)` takes:

- `mesh.positions`: flat XY or XYZ source coordinates in an array or typed array.
- `mesh.indices`: three input vertex indices per triangle. The mesh must be conforming: no pre-existing T-junctions. Degenerate triangles are retained; this utility does not repair topology.

All input vertices, including unused vertices, are copied and transformed. Inputs remain unchanged. Empty geometry is supported.

| Option | Default | Description |
| --- | --- | --- |
| `transform` | Required | Deterministic `(position: readonly number[]) => ArrayLike<number> \| null`. Each invocation receives a fresh array. Must return exactly `targetSize` finite components. |
| `refinement` | `'transform-error'` | Sample transform error, or use `'source-edge'` to split only long source edges without error probes. |
| `tolerance` | Required in transform-error mode | Positive finite sampled error tolerance, in target-coordinate units. All target components participate. Must be omitted in source-edge mode. |
| `size` | `2` | Source dimension, `2` or `3`. |
| `targetSize` | `size` | Target dimension, `2` or `3`. |
| `maxEdgeLength` | `Infinity` in transform-error mode | Positive maximum Euclidean source-edge length. Required and finite in source-edge mode. All source components participate; choose compatible axis units. |
| `maxDepth` | `10` | Maximum global refinement passes, integer from `0` through `30`. |
| `maxVertices` | `65536` | Maximum output vertex count, including unused input vertices. |
| `maxTriangles` | `131072` | Maximum output triangle count. |

Both count limits must be positive integers no greater than `2^32 - 1`. A renderer can express tolerance in common-space units, or derive it from camera parameters and desired visual quality. The utility does not depend on a camera, CRS parser, or graphics runtime.

The result contains:

| Field | Type | Meaning |
| --- | --- | --- |
| `sourcePositions` | `Float64Array` | Refined source positions. |
| `positions` | `Float64Array` | Corresponding transformed positions. |
| `indices` | `Uint32Array` | Refined triangle topology. Source winding is preserved; a reversing transform may reverse target winding. |
| `sourceVertexIndices` | `Uint32Array` | Three original vertex indices per output vertex. |
| `sourceVertexWeights` | `Float64Array` | Three corresponding weights per output vertex, summing to one. Unused slots have zero weight and index `0`. |
| `sourceTriangleIndices` | `Uint32Array` | Original triangle index per output triangle, for face attribution. |

## Accuracy and failure behavior

In the default transform-error mode, edge probes use fractions `1/4`, `1/2`, and `3/4`. Interior probes use the centroid and barycentric permutations of `[1/2, 1/4, 1/4]`. Error is the Euclidean distance between the transformed source probe and barycentric interpolation of the transformed vertices at the same weights. This also detects nonlinear parameterization of otherwise flat geometry. An edge-length limit can force refinement where the error probes might miss oscillation.

The criterion is sampled. It does not guarantee a continuous bound for arbitrary transforms, detect every projection seam, or repair inverted triangles. Polygon boundaries and interiors are refined; the caller retains ownership of clipping policy, triangulation, GPU resources, and interpolation of attributes.

Invalid options, buffers, indices, nonfinite coordinates, rejected transform samples, and exhausted limits produce `RangeError`. Callback exceptions propagate unchanged. No partial result is returned. Source-coordinate attribute seams remain distinct because refinement shares vertices only along identical indexed edges.

Source-edge mode validates transformed output vertices, but intentionally never evaluates edge or interior probes. An invalid interior can therefore be undetected. Count and depth limits, finite-coordinate validation, and callback exception propagation apply in both modes. Refinement can change triangle ordering and counts between modes; consumers should use provenance rather than assume identical output topology.

## Performance comparison

After building the repository, run `node test/bench/subdivision.mjs` for a deterministic small/coarse-quad comparison. It reports median elapsed time, output counts and transform calls for both policies. The source-edge policy deliberately does less work and provides a weaker accuracy contract; this is not an equal-accuracy comparison or a production rendering benchmark. Output provenance and typed-array formats are unchanged.

See [subdividePolyline](./subdivide-polyline.md) for strokes and boundary-only processing. Boundary subdivision alone is insufficient when a filled polygon or image also needs its triangle interiors to deform.
