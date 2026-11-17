# qualifySurfaceTransition

```
import {qualifySurfaceTransition} from '@math.gl/geometry';

const report = qualifySurfaceTransition({positions: fromXYZ, indices}, toXYZ);
```

Qualify a fixed indexed 3D triangulated patch throughout **linear vertex interpolation**. This conservative subset requires a connected, consistently oriented manifold disk, no unused vertices, positive XY orientation for every triangle, and a boundary remaining convex in XY. It checks quadratic extrema over the complete transition interval, including narrow interior reversals missed by uniform time samples. Positive projected areas and a convex boundary keep the piecewise-linear mesh a graph over XY.

Arguments:

* `mesh.positions`: finite interleaved XYZ source endpoint positions.
* `mesh.indices`: consistently oriented triangle indices, shared by both endpoint meshes.
* `targetPositions`: finite interleaved XYZ endpoint positions, matching the source vertex count.
* `options.minimumDoubleArea`: positive finite rejection margin in squared XY units. Defaults to `1e-12` times the maximum squared endpoint projected edge length. Triangle double areas and pairwise boundary-vertex squared separations below the margin reject; boundary support violations beyond `1e-3` times the margin reject to allow floating-point noise on collinear refinement vertices.
* `options.maxChecks`: nonnegative safe integer; default 1000000. Bounds orientation, support and boundary-separation tests. Exhaustion rejects rather than returning a partial qualification.

Returns `{scope: 'convex-xy-disk-linear', minimumProjectedDoubleArea, boundary}`. `boundary` is an owned `Uint32Array` of boundary vertex indices without the repeated closing vertex. The report is structured-cloneable. Inputs remain unchanged.

Arithmetic overflow in area samples or coefficients rejects, even when endpoint positions are finite.

Malformed meshes, nonmanifold/disconnected inputs, holes, nonconvex boundaries, intermediate collapses/reversals and exhausted budgets throw `RangeError`. Valid surfaces outside this subset also reject. XYZ axes must be chosen such that the patch is a graph over XY; this is unsuitable for a full globe. Requalify after changing coordinates, topology or trajectories.

This checks the fixed piecewise-linear base mesh using floating-point margins; it is not formal interval certification, a smooth projection approximation bound, a camera error policy, a qualification of normal-offset extrusion, or support for changing cuts. Posed normals and ray intersections must use the current mesh. See the [prepared surface example](https://visgl.github.io/math.gl/next/examples/surface-mesh) and [deck.gl geometry-provider RFC](https://github.com/visgl/deck.gl/issues/10922).
