# Ray and closest-point queries

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

import Example from '@site/src/components/culling-queries';

<Example inline interactive height={520} />

Import `intersectRayBounds`, `intersectRayTriangle`, and `getClosestPointOnTriangle` from
`@math.gl/culling` or the lightweight `@math.gl/culling/queries` entry point.

- `intersectRayBounds(origin, direction, minimum, maximum, maxT = Infinity)` supports 2D/3D
  closed bounds. Returns entry t, zero for an origin inside, or null. Parallel components and
  boundary contact are supported. Bounds must be ordered and dimensions must match.
- `intersectRayTriangle(origin, direction, a, b, c, options?)` accepts 3D arrays and returns
  `{t, barycentric: [aWeight, bWeight, cWeight]}` or null. Options are `maxT` and
  `backfaceCulling` (default false, counterclockwise fronts). Degenerate triangles and coplanar
  rays have no hit. The triangle is filled, including its edges and vertices.
- `getClosestPointOnTriangle(point, a, b, c)` returns a new xyz array. Degenerate triangles
  reduce to segments or points. It measures against the filled triangle, not just its edges.

Coordinates must be finite; directions must be nonzero; maxT must be nonnegative (Infinity
is allowed). A hit lies at `origin + t * direction`. t is distance only for a unit direction.
These kernels do not normalize it implicitly. Inputs are not mutated.

These are floating-point kernels for ordinary Cartesian visualization coordinates. Triangle
intersections are not watertight-certified; extreme scales, nearly degenerate triangles, and
shared-edge rounding require further numerical qualification. They do not provide continuous
collision detection or geodesic measurements.
