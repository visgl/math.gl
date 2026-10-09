<!-- -->

# Globe intersection and occlusion

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

These public APIs supply reusable CPU geometry for globe picking, label/annotation occlusion, limb meshes and imagery coverage. They do not depend on Kepler, deck.gl viewports or GPU state. Existing `SphereShape` remains useful for general transformed shape picking; `EllipsoidOccluder` specializes in planetary segment and limb queries.

```
import {EllipsoidOccluder, getGlobeHorizonBounds, splitGlobeBounds} from '@math.gl/geospatial';



const globe = new EllipsoidOccluder([6371000, 6371000, 6371000]);

const camera = [2 * 6371000, 0, 0];

const hit = globe.intersectRay(camera, [-1, 0, 0]); // [6371000, 19113000]

const nearSide = !globe.isPointOccluded(camera, [6371000, 0, 0]);

const limb = globe.getHorizon(camera);

const rectangles = splitGlobeBounds(getGlobeHorizonBounds(camera, 6371000));
```

## EllipsoidOccluder[​](#ellipsoidoccluder "Direct link to EllipsoidOccluder")

`new EllipsoidOccluder(radii, center = [0, 0, 0])` accepts three positive finite Cartesian axis radii and an optional center. Arrays and typed arrays are accepted. The constructor owns frozen snapshots; changing the inputs does not change queries. Axes align with the input Cartesian frame. A sphere works in any matching frame; a non-spherical body must use its principal axes. The class does not infer a CRS.

### intersectRay(origin, direction, result?)[​](#intersectrayorigin-direction-result "Direct link to intersectRay(origin, direction, result?)")

Returns the nonnegative parameter interval `[entry, exit]` where `origin + t * direction` intersects the solid. Parameters are distances only when the direction is unit length. An inside origin has entry zero; a tangent has equal entry/exit. A surface origin looking outward returns `[0, 0]`.

A true miss, intersections wholly behind the ray, or zero direction returns `undefined`. A provided mutable result array is reused and is untouched on miss. Inputs must have three finite components. The calculation normalizes direction in scaled ellipsoid space and avoids subtractive cancellation for the smaller root. It never substitutes the nearest limb point for a miss.

### isPointOccluded(camera, point, tolerance = 1e-12)[​](#ispointoccludedcamera-point-tolerance--1e-12 "Direct link to isPointOccluded(camera, point, tolerance = 1e-12)")

Returns whether the finite camera-to-point segment enters the ellipsoid interior. It includes altitude: a point beyond the surface horizon can be visible above the limb. A surface-facing normal test is insufficient for such objects.

Contact with the surface or a tangent segment alone does not count as occlusion. Inside points/cameras are occluded; coincident exterior points are not. Tolerance is a nonnegative margin in **scaled squared-radius units**, less than one; the interior test uses `distanceSquared < 1 - tolerance`. This is numerical tolerance, not terrain height. Terrain/building occlusion requires a separate data-aware test.

### getHorizon(camera)[​](#gethorizoncamera "Direct link to getHorizon(camera)")

Returns an exact limb ellipse `{center, axis1, axis2}` for an exterior camera:

```
const point = limb.center.map((value, i) =>

  value + limb.axis1[i] * Math.cos(angle) + limb.axis2[i] * Math.sin(angle)

);
```

All three vectors use the input Cartesian units. Each sampled point is on the body and tangent to the viewing line. Polar views need no special axis rotation. On/inside the body, there is no exterior apparent limb and the result is undefined. The limb is geometry, not a renderer-specific depth disk or screen mask.

## getGlobeHorizonBounds(camera, radius)[​](#getglobehorizonboundscamera-radius "Direct link to getGlobeHorizonBounds(camera, radius)")

Returns conservative surface bounds `[west, south, east, north]` in degrees for a sphere centered at zero. X points to longitude 0, Y to longitude 90 and Z north. `west > east` means an antimeridian crossing. A cap containing either pole covers all longitudes (`[-180, ..., 180, ...]`). On/inside the sphere returns undefined.

The analytic extent covers **the entire visible surface cap**, including limb and poles, with a small outward rounding margin. It can overfetch a zoomed/cropped screen; it is not a viewport-tight bound, an ellipsoid bound, or an elevated-terrain bound. Clip/refine coverage in the viewport owner if tighter imagery requests are needed.

## splitGlobeBounds(bounds)[​](#splitglobeboundsbounds "Direct link to splitGlobeBounds(bounds)")

Returns one ordinary degree rectangle or two at the antimeridian. Valid latitude and longitude ranges are checked. This avoids replacing a wrapped narrow extent with a full-world request. Protocol axis order, CRS conversion, image stitching, request cancellation and cache/resolution policy belong to loaders/layers.

## Coordinate integration[​](#coordinate-integration "Direct link to Coordinate integration")

For WGS84, use `Ellipsoid.WGS84.radii` and its Cartesian conversions with `EllipsoidOccluder`. For spherical deck GlobeView, convert camera and object positions to the same common frame/units, or convert both to ECEF. Do not mix the common-space radius with meter positions. Convert axes into the documented X/Y/Z convention before calling the geographic bounds helper. The helper does not accept WGS84 ECEF as a spherical approximation implicitly.

The [standalone example](https://github.com/visgl/math.gl/tree/master/examples/globe-primitives) composes these queries with `subdivideGlobeMesh`, demonstrating elevated labels, true ray misses and polar/antimeridian coverage without Kepler dependencies.

## Provenance and limits[​](#provenance-and-limits "Direct link to Provenance and limits")

Original MIT-licensed TypeScript implementations use analytic scaled-space ray/segment geometry and spherical-cap extrema. No Kepler/Cesium implementation code was copied. The consumer requirements came from merged Kepler [#3557](https://github.com/keplergl/kepler.gl/pull/3557) (WMS globe coverage) and [#3593](https://github.com/keplergl/kepler.gl/pull/3593) (true ray misses). The source records license, copyright and motivation in SPDX comments.

These are double-precision CPU calculations; matching GPU occlusion/render states still require layer work. Inputs that overflow scaled magnitudes are outside the supported numerical domain. Extremely distant near-tangent rays and differences below representable precision have no certified error bound. Tests cover analytic cases, Earth scale, translated/triaxial bodies, tangent limbs, elevated anchors and an independently sampled surface-cap containment corpus.
