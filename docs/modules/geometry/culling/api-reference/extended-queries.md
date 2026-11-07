# Bounds, frusta and geometric queries

These functions are exported from both `@math.gl/geometry` and
`@math.gl/geometry/culling`. They operate in Euclidean coordinates; they do not
interpret geographic degrees or renderer objects. Finite inputs are required except
for the infinity sentinels used by empty bounds. Floating-point queries are not
certified exact predicates; very large coordinates or nearly degenerate geometry
should be rescaled before querying.

## Bounds

Use existing `Bounds2D` and `Bounds3D` types: `[minimum, maximum]`. Ordered equal
endpoints describe a nonempty point. Any inverted axis denotes empty bounds.

#### `createEmptyBounds(2 | 3)`

Creates canonical empty bounds with positive-infinity
minimum and negative-infinity maximum.

#### `isEmptyBounds(bounds)`

Whether any axis is inverted.

#### `boundsContainsPoint(bounds, point)`

Closed-boundary containment.

#### `boundsContainsBounds(a, b)`

Whether `a` contains `b`; every bounds contains empty bounds.

#### `boundsIntersect(a, b)`

Closed overlap; touching counts. Empty bounds never overlap.

#### `unionBounds(a, b, out?)`

Enclosing bounds.

#### `intersectBounds(a, b, out?)`

Overlap or canonical empty bounds.

#### `expandBoundsByPoint(bounds, point, out?)`

Include a point.

#### `expandBounds(bounds, padding, out?)`

Expand by finite scalar padding; negative padding shrinks.

#### `clampPointToBounds(bounds, point, out?)`

Closest point in bounds; `null` for empty bounds.

#### `spheresIntersect(aCenter, aRadius, bCenter, bRadius)`

Closed 3D sphere overlap with nonnegative finite radii.

#### `boundsIntersectSphere(bounds, center, radius)`

Closed box/ball overlap in the bounds' dimension.

Bounds outputs allocate by default; supplied output bounds must match dimension and
may alias an input. The point-clamping output may alias its point input. Empty
clamping leaves the supplied output unchanged.

## Projection and frustum conventions

These core helpers use column-major matrices and a right-handed camera looking along negative Z. Each accepts `depthRange: 'negative-one-to-one' | 'zero-to-one'` and `reversedDepth: boolean`, defaulting to `'negative-one-to-one'` and `false`.

#### `mat4PerspectiveProjection(out, options)`

Builds a perspective matrix from `fovy` in radians, positive `aspect`, positive `near`, and `far > near`. `far` may be `Infinity`.

#### `mat4FrustumProjection(out, options)`

Builds an asymmetric perspective matrix from the near-plane `left`, `right`, `bottom`, and `top` bounds, positive `near`, and `far > near`. `far` may be infinite.

#### `mat4OrthographicProjection(out, options)`

Builds an orthographic matrix from `left`, `right`, `bottom`, and `top`, with finite `near` and `far`.

```js
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

#### `extractFrustumPlanes(viewProjection, options?)`

Returns normalized inward planes
in left/right/bottom/top/near/far order. A redundant infinite far plane is omitted.
`CullingVolume.fromViewProjection()` replaces its planes only after successful
extraction. Pass the same depth options used to build the projection. Configure the
renderer depth clear value and comparison separately when using reversed depth.

## Ray conveniences

#### `getRayPoint(origin, direction, t, out?)`

Evaluates a nonnegative ray parameter.

#### `getClosestPointOnRay(point, origin, direction, out?)`

Clamps projection behind the
origin.

#### `distanceToRay(point, origin, direction)`

Returns Euclidean distance.
Directions must be nonzero and need not be normalized. Parameters are distances
only when the direction is unit length.

#### `getClosestPointsRaySegment(origin, direction, start, end)`

Returns `rayPoint`,
`segmentPoint`, `rayParameter`, `segmentFraction`, and `distance`. Segment fractions
are in [0, 1]; a zero-length segment is allowed.

#### `transformRay(origin, direction, matrix)`

Accepts finite affine transforms and
returns new `origin` and `direction` arrays, preserving parameterization. A transform
that collapses the direction is rejected. See the [Ray methods](./ray.md#methods) for normalized class operations.

## Triangle and plane queries

#### `getTriangleBarycentric(point, a, b, c, out?)`

Weights of the point's orthogonal projection onto the triangle plane; `null` for degeneracy. Does not test containment.

#### `getTriangleArea(a, b, c)`

Unsigned area.

#### `getTriangleNormal(a, b, c, out?)`

Unit winding normal, or zero for a degenerate triangle.

#### `isTriangleFrontFacing(a, b, c, direction)`

Winding normal has a negative dot product with the viewing/ray direction.

#### `triangleContainsPoint(point, a, b, c, tolerance = 1e-10)`

Plane proximity and barycentric containment. Tolerance is relative to the longest edge from `a`; degenerate triangles return false.

#### `interpolateTriangleAttribute(weights, a, b, c, out?)`

Weighted interpolation of equal-length numeric attributes. Weights are supplied explicitly and need not be clamped.

#### `triangleIntersectsBounds(a, b, c, minimum, maximum)`

Closed 3D overlap via separating axes; degenerate triangles reduce to segments/points.

#### `intersectPlaneSegment(normal, constant, start, end, out?)`

Intersection with `dot(normal, point) + constant = 0`. A coplanar segment returns its start; a disjoint segment returns `null`.

Point/attribute outputs may alias inputs. Null-returning cases leave outputs
unchanged. Plane normals need not be normalized but must be nonzero. Existing
[query kernels](./queries.md) continue to provide ray–triangle and segment closest-pair
operations.
