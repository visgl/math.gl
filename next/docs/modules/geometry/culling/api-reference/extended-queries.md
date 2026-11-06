# Bounds, frusta and geometric queries

These functions are exported from both `@math.gl/geometry` and `@math.gl/geometry/culling`. They operate in Euclidean coordinates; they do not interpret geographic degrees or renderer objects. Finite inputs are required except for the infinity sentinels used by empty bounds. Floating-point queries are not certified exact predicates; very large coordinates or nearly degenerate geometry should be rescaled before querying.

## Bounds[​](#bounds "Direct link to Bounds")

Use existing `Bounds2D` and `Bounds3D` types: `[minimum, maximum]`. Ordered equal endpoints describe a nonempty point. Any inverted axis denotes empty bounds. `createEmptyBounds(2 | 3)` creates canonical empty bounds with positive-infinity minimum and negative-infinity maximum.

| Function                                               | Result                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| `isEmptyBounds(bounds)`                                | Whether any axis is inverted.                                 |
| `boundsContainsPoint(bounds, point)`                   | Closed-boundary containment.                                  |
| `boundsContainsBounds(a, b)`                           | Whether `a` contains `b`; every bounds contains empty bounds. |
| `boundsIntersect(a, b)`                                | Closed overlap; touching counts. Empty bounds never overlap.  |
| `unionBounds(a, b, out?)`                              | Enclosing bounds.                                             |
| `intersectBounds(a, b, out?)`                          | Overlap or canonical empty bounds.                            |
| `expandBoundsByPoint(bounds, point, out?)`             | Include a point.                                              |
| `expandBounds(bounds, padding, out?)`                  | Expand by finite scalar padding; negative padding shrinks.    |
| `clampPointToBounds(bounds, point, out?)`              | Closest point in bounds; `null` for empty bounds.             |
| `spheresIntersect(aCenter, aRadius, bCenter, bRadius)` | Closed 3D sphere overlap with nonnegative finite radii.       |
| `boundsIntersectSphere(bounds, center, radius)`        | Closed box/ball overlap in the bounds' dimension.             |

Bounds outputs allocate by default; supplied output bounds must match dimension and may alias an input. The point-clamping output may alias its point input. Empty clamping leaves the supplied output unchanged.

## Projection and frustum conventions[​](#projection-and-frustum-conventions "Direct link to Projection and frustum conventions")

Core exports `mat4PerspectiveProjection(out, options)`, `mat4FrustumProjection(out, options)` and `mat4OrthographicProjection(out, options)`. All use column-major matrices and a right-handed camera looking along negative Z.

* Perspective options: `fovy` in radians, positive `aspect`, positive `near`, and `far > near`. `far` may be `Infinity`.
* Frustum options: `left`, `right`, `bottom`, `top`, positive `near`, and `far > near`. The first four describe the near-plane rectangle; `far` may be infinite.
* Orthographic options: the same bounds, with finite `near` and `far`.
* All accept `depthRange: 'negative-one-to-one' | 'zero-to-one'` and `reversedDepth: boolean`. Defaults are `negative-one-to-one` and `false`.

```
import {mat4PerspectiveProjection} from '@math.gl/core';

import {CullingVolume} from '@math.gl/geometry';



const options = {

  fovy: Math.PI / 3, aspect: 1.5, near: 0.1, far: Infinity,

  depthRange: 'zero-to-one', reversedDepth: true

};

const projection = mat4PerspectiveProjection(new Float64Array(16), options);

const volume = new CullingVolume().fromViewProjection(projection, options);

// Identity view in this example. Otherwise supply projection * view.
```

`extractFrustumPlanes(viewProjection, options?)` returns normalized inward planes in left/right/bottom/top/near/far order. A redundant infinite far plane is omitted. `CullingVolume.fromViewProjection()` replaces its planes only after successful extraction. Pass the same depth options used to build the projection. Configure the renderer depth clear value and comparison separately when using reversed depth.

## Ray conveniences[​](#ray-conveniences "Direct link to Ray conveniences")

`getRayPoint(origin, direction, t, out?)` evaluates a nonnegative ray parameter. `getClosestPointOnRay(point, origin, direction, out?)` clamps projection behind the origin. `distanceToRay(point, origin, direction)` returns Euclidean distance. Directions must be nonzero and need not be normalized. Parameters are distances only when the direction is unit length.

`getClosestPointsRaySegment(origin, direction, start, end)` returns `rayPoint`, `segmentPoint`, `rayParameter`, `segmentFraction`, and `distance`. Segment fractions are in \[0, 1]; a zero-length segment is allowed.

`transformRay(origin, direction, matrix)` accepts finite affine transforms and returns new `origin` and `direction` arrays, preserving parameterization. A transform that collapses the direction is rejected. The `Ray` class adds `at`, `closestPointTo`, `distanceTo` and `transform`; its `transform` renormalizes direction, so subsequent class parameters are distances in the new space.

## Triangle and plane queries[​](#triangle-and-plane-queries "Direct link to Triangle and plane queries")

| Function                                                    | Contract                                                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `getTriangleBarycentric(point, a, b, c, out?)`              | Weights of the point's orthogonal projection onto the triangle plane; `null` for degeneracy. Does not test containment.             |
| `getTriangleArea(a, b, c)`                                  | Unsigned area.                                                                                                                      |
| `getTriangleNormal(a, b, c, out?)`                          | Unit winding normal, or zero for a degenerate triangle.                                                                             |
| `isTriangleFrontFacing(a, b, c, direction)`                 | Winding normal has a negative dot product with the viewing/ray direction.                                                           |
| `triangleContainsPoint(point, a, b, c, tolerance = 1e-10)`  | Plane proximity and barycentric containment. Tolerance is relative to the longest edge from `a`; degenerate triangles return false. |
| `interpolateTriangleAttribute(weights, a, b, c, out?)`      | Weighted interpolation of equal-length numeric attributes. Weights are supplied explicitly and need not be clamped.                 |
| `triangleIntersectsBounds(a, b, c, minimum, maximum)`       | Closed 3D overlap via separating axes; degenerate triangles reduce to segments/points.                                              |
| `intersectPlaneSegment(normal, constant, start, end, out?)` | Intersection with `dot(normal, point) + constant = 0`. A coplanar segment returns its start; a disjoint segment returns `null`.     |

Point/attribute outputs may alias inputs. Null-returning cases leave outputs unchanged. Plane normals need not be normalized but must be nonzero. Existing [query kernels](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/queries.md) continue to provide ray–triangle and segment closest-pair operations.
