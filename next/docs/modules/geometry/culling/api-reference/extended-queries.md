# Bounds, frusta and geometric queries

These functions are exported from both `@math.gl/geometry` and `@math.gl/geometry/culling`. They operate in Euclidean coordinates; they do not interpret geographic degrees or renderer objects. Finite inputs are required except for the infinity sentinels used by empty bounds. Floating-point queries are not certified exact predicates; very large coordinates or nearly degenerate geometry should be rescaled before querying.

## Bounds[​](#bounds "Direct link to Bounds")

Use existing `Bounds2D` and `Bounds3D` types: `[minimum, maximum]`. Ordered equal endpoints describe a nonempty point. Any inverted axis denotes empty bounds.

#### `createEmptyBounds(2 | 3)`[​](#createemptybounds2--3 "Direct link to createemptybounds2--3")

Creates canonical empty bounds with positive-infinity minimum and negative-infinity maximum.

#### `isEmptyBounds(bounds)`[​](#isemptyboundsbounds "Direct link to isemptyboundsbounds")

Whether any axis is inverted.

#### `boundsContainsPoint(bounds, point)`[​](#boundscontainspointbounds-point "Direct link to boundscontainspointbounds-point")

Closed-boundary containment.

#### `boundsContainsBounds(a, b)`[​](#boundscontainsboundsa-b "Direct link to boundscontainsboundsa-b")

Whether `a` contains `b`; every bounds contains empty bounds.

#### `boundsIntersect(a, b)`[​](#boundsintersecta-b "Direct link to boundsintersecta-b")

Closed overlap; touching counts. Empty bounds never overlap.

#### `unionBounds(a, b, out?)`[​](#unionboundsa-b-out "Direct link to unionboundsa-b-out")

Enclosing bounds.

#### `intersectBounds(a, b, out?)`[​](#intersectboundsa-b-out "Direct link to intersectboundsa-b-out")

Overlap or canonical empty bounds.

#### `expandBoundsByPoint(bounds, point, out?)`[​](#expandboundsbypointbounds-point-out "Direct link to expandboundsbypointbounds-point-out")

Include a point.

#### `expandBounds(bounds, padding, out?)`[​](#expandboundsbounds-padding-out "Direct link to expandboundsbounds-padding-out")

Expand by finite scalar padding; negative padding shrinks.

#### `clampPointToBounds(bounds, point, out?)`[​](#clamppointtoboundsbounds-point-out "Direct link to clamppointtoboundsbounds-point-out")

Closest point in bounds; `null` for empty bounds.

#### `spheresIntersect(aCenter, aRadius, bCenter, bRadius)`[​](#spheresintersectacenter-aradius-bcenter-bradius "Direct link to spheresintersectacenter-aradius-bcenter-bradius")

Closed 3D sphere overlap with nonnegative finite radii.

#### `boundsIntersectSphere(bounds, center, radius)`[​](#boundsintersectspherebounds-center-radius "Direct link to boundsintersectspherebounds-center-radius")

Closed box/ball overlap in the bounds' dimension.

Bounds outputs allocate by default; supplied output bounds must match dimension and may alias an input. The point-clamping output may alias its point input. Empty clamping leaves the supplied output unchanged.

## Projection and frustum conventions[​](#projection-and-frustum-conventions "Direct link to Projection and frustum conventions")

These core helpers use column-major matrices and a right-handed camera looking along negative Z. Each accepts `depthRange: 'negative-one-to-one' | 'zero-to-one'` and `reversedDepth: boolean`, defaulting to `'negative-one-to-one'` and `false`.

#### `mat4PerspectiveProjection(out, options)`[​](#mat4perspectiveprojectionout-options "Direct link to mat4perspectiveprojectionout-options")

Builds a perspective matrix from `fovy` in radians, positive `aspect`, positive `near`, and `far > near`. `far` may be `Infinity`.

#### `mat4FrustumProjection(out, options)`[​](#mat4frustumprojectionout-options "Direct link to mat4frustumprojectionout-options")

Builds an asymmetric perspective matrix from the near-plane `left`, `right`, `bottom`, and `top` bounds, positive `near`, and `far > near`. `far` may be infinite.

#### `mat4OrthographicProjection(out, options)`[​](#mat4orthographicprojectionout-options "Direct link to mat4orthographicprojectionout-options")

Builds an orthographic matrix from `left`, `right`, `bottom`, and `top`, with finite `near` and `far`.

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

#### `extractFrustumPlanes(viewProjection, options?)`[​](#extractfrustumplanesviewprojection-options "Direct link to extractfrustumplanesviewprojection-options")

Returns normalized inward planes in left/right/bottom/top/near/far order. A redundant infinite far plane is omitted. `CullingVolume.fromViewProjection()` replaces its planes only after successful extraction. Pass the same depth options used to build the projection. Configure the renderer depth clear value and comparison separately when using reversed depth.

## Ray conveniences[​](#ray-conveniences "Direct link to Ray conveniences")

#### `getRayPoint(origin, direction, t, out?)`[​](#getraypointorigin-direction-t-out "Direct link to getraypointorigin-direction-t-out")

Evaluates a nonnegative ray parameter.

#### `getClosestPointOnRay(point, origin, direction, out?)`[​](#getclosestpointonraypoint-origin-direction-out "Direct link to getclosestpointonraypoint-origin-direction-out")

Clamps projection behind the origin.

#### `distanceToRay(point, origin, direction)`[​](#distancetoraypoint-origin-direction "Direct link to distancetoraypoint-origin-direction")

Returns Euclidean distance. Directions must be nonzero and need not be normalized. Parameters are distances only when the direction is unit length.

#### `getClosestPointsRaySegment(origin, direction, start, end)`[​](#getclosestpointsraysegmentorigin-direction-start-end "Direct link to getclosestpointsraysegmentorigin-direction-start-end")

Returns `rayPoint`, `segmentPoint`, `rayParameter`, `segmentFraction`, and `distance`. Segment fractions are in \[0, 1]; a zero-length segment is allowed.

#### `transformRay(origin, direction, matrix)`[​](#transformrayorigin-direction-matrix "Direct link to transformrayorigin-direction-matrix")

Accepts finite affine transforms and returns new `origin` and `direction` arrays, preserving parameterization. A transform that collapses the direction is rejected. See the [Ray methods](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/ray.md#methods) for normalized class operations.

## Triangle and plane queries[​](#triangle-and-plane-queries "Direct link to Triangle and plane queries")

#### `getTriangleBarycentric(point, a, b, c, out?)`[​](#gettrianglebarycentricpoint-a-b-c-out "Direct link to gettrianglebarycentricpoint-a-b-c-out")

Weights of the point's orthogonal projection onto the triangle plane; `null` for degeneracy. Does not test containment.

#### `getTriangleArea(a, b, c)`[​](#gettriangleareaa-b-c "Direct link to gettriangleareaa-b-c")

Unsigned area.

#### `getTriangleNormal(a, b, c, out?)`[​](#gettrianglenormala-b-c-out "Direct link to gettrianglenormala-b-c-out")

Unit winding normal, or zero for a degenerate triangle.

#### `isTriangleFrontFacing(a, b, c, direction)`[​](#istrianglefrontfacinga-b-c-direction "Direct link to istrianglefrontfacinga-b-c-direction")

Winding normal has a negative dot product with the viewing/ray direction.

#### `triangleContainsPoint(point, a, b, c, tolerance = 1e-10)`[​](#trianglecontainspointpoint-a-b-c-tolerance--1e-10 "Direct link to trianglecontainspointpoint-a-b-c-tolerance--1e-10")

Plane proximity and barycentric containment. Tolerance is relative to the longest edge from `a`; degenerate triangles return false.

#### `interpolateTriangleAttribute(weights, a, b, c, out?)`[​](#interpolatetriangleattributeweights-a-b-c-out "Direct link to interpolatetriangleattributeweights-a-b-c-out")

Weighted interpolation of equal-length numeric attributes. Weights are supplied explicitly and need not be clamped.

#### `triangleIntersectsBounds(a, b, c, minimum, maximum)`[​](#triangleintersectsboundsa-b-c-minimum-maximum "Direct link to triangleintersectsboundsa-b-c-minimum-maximum")

Closed 3D overlap via separating axes; degenerate triangles reduce to segments/points.

#### `intersectPlaneSegment(normal, constant, start, end, out?)`[​](#intersectplanesegmentnormal-constant-start-end-out "Direct link to intersectplanesegmentnormal-constant-start-end-out")

Intersection with `dot(normal, point) + constant = 0`. A coplanar segment returns its start; a disjoint segment returns `null`.

Point/attribute outputs may alias inputs. Null-returning cases leave outputs unchanged. Plane normals need not be normalized but must be nonzero. Existing [query kernels](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/queries.md) continue to provide ray–triangle and segment closest-pair operations.
