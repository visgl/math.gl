# Ray and closest-point queries

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

<!-- -->

Loading <!-- -->Ray & closest-point lab<!-- -->…

⛶

Import `unprojectScreenRay`, `intersectRayBounds`, `intersectRayTriangle`, and `getClosestPointOnTriangle` from `@math.gl/geometry/culling` or the lightweight `@math.gl/geometry/culling` entry point.

* `intersectRayBounds(origin, direction, minimum, maximum, maxT = Infinity)` supports 2D/3D closed bounds. Returns entry t, zero for an origin inside, or null. Parallel components and boundary contact are supported. Bounds must be ordered and dimensions must match.
* `intersectRayTriangle(origin, direction, a, b, c, options?)` accepts 3D arrays and returns `{t, barycentric: [aWeight, bWeight, cWeight]}` or null. Options are `maxT` and `backfaceCulling` (default false, counterclockwise fronts). Degenerate triangles and coplanar rays have no hit. The triangle is filled, including its edges and vertices.
* `getClosestPointOnTriangle(point, a, b, c)` returns a new xyz array. Degenerate triangles reduce to segments or points. It measures against the filled triangle, not just its edges.
* `unprojectScreenRay(inverseClipMatrix, viewport, pixel, depthRange?)` returns the finite near-to-far segment as `{origin, direction}`, or `null` for invalid or degenerate input. The column-major inverse matrix maps clip coordinates into the caller's output space. `viewport` has `width`, `height`, and optional `x`/`y`; the pixel and viewport use the same top-origin screen units. Outside-viewport pixels are allowed. The clip depth range defaults to `[-1, 1]`; use `[0, 1]` when the inverse matrix uses zero-to-one depth. The direction is not normalized: `origin + direction` is the far endpoint, so use `maxT: 1` for a finite segment with the intersection kernels. To query an API that accepts distance instead of a ray parameter, use `Math.hypot(...direction)` as the distance limit.

Coordinates must be finite; directions must be nonzero; maxT must be nonnegative (Infinity is allowed). A hit lies at `origin + t * direction`. t is distance only for a unit direction. These kernels do not normalize it implicitly. Inputs are not mutated.

These are floating-point kernels for ordinary Cartesian visualization coordinates. Triangle intersections are not watertight-certified; extreme scales, nearly degenerate triangles, and shared-edge rounding require further numerical qualification. They do not provide continuous collision detection or geodesic measurements.
