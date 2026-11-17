# @math.gl/geometry/culling

![From v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

`@math.gl/geometry/culling` tests bounding volumes against planes and provides analytic shape queries. Use it to reject objects outside a view frustum, intersect rays with shapes, and compute enclosing bounds.

<!-- -->

Loading <!-- -->Frustum culling<!-- -->…

⛶⛶ Explore fullscreen

## Usage[​](#usage "Direct link to Usage")

```
import {BoundingSphere, CullingVolume, Plane} from '@math.gl/geometry/culling';



const volume = new CullingVolume([

  new Plane([1, 0, 0], 1),  // x >= -1

  new Plane([-1, 0, 0], 1)  // x <= 1

]);

const visibility = volume.computeVisibility(new BoundingSphere([0, 0, 0], 0.5));

// 'inside'
```

## Features[​](#features "Direct link to Features")

| Feature                                      | Support | Notes                                                                                                                                                                                                            |
| -------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bounding spheres, AABBs and OBBs             | ✅      | [Bounding volumes](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/bounding-volume.md), point-cloud bounds, planes, and ray representations.                       |
| Frustum classification and plane masks       | ✅      | [CullingVolume](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/culling-volume.md) reports inside/intersecting/outside and supports hierarchical plane-mask reuse. |
| Analytic shape ray and closest-point queries | ✅      | [Box, capsule, cylinder, plane and sphere](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/shapes.md) queries avoid tessellating the shapes.                       |
| Triangle and segment kernels                 | ✅      | [Ray/triangle and closest-point kernels](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/queries.md) include segment/triangle closest pairs.                       |
| Rotated 2D rectangle overlap                 | ✅      | [intersectOrientedBoxes2D](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/intersect-oriented-boxes-2d.md) provides allocation-free oriented rectangle queries.    |
| Large-scene acceleration structures          | ◐       | [Static indexes](https://visgl.github.io/math.gl/next/docs/modules/geometry/spatial-index.md) are separate APIs; individual culling kernels do not build or maintain an index.                      |
| Continuous collision dynamics                | ❌      | No time integration, friction, restitution, constraint/contact solver, or general first-impact engine.                                                                                                           |
| Universal exact-predicate certification      | ❌      | Floating-point kernels retain documented degeneracy and scale limits; no general watertight/exact-arithmetic guarantee.                                                                                          |

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/geometry
```

## Choose a primitive[​](#choose-a-primitive "Direct link to Choose a primitive")

| API                                                                                                                                                      | Use it for                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [CullingVolume](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/culling-volume.md)                         | Visibility against a set of inward-facing planes                                        |
| [AxisAlignedBoundingBox](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/axis-aligned-bounding-box.md)     | Bounds aligned with the coordinate axes                                                 |
| [OrientedBoundingBox](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/oriented-bounding-box.md)            | Bounds with arbitrary orientation                                                       |
| [BoundingSphere](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/bounding-sphere.md)                       | A center and radius enclosing geometry                                                  |
| [Plane](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/plane.md)                                          | A normalized normal and signed distance                                                 |
| [Ray](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/ray.md)                                              | An origin and direction for intersection queries                                        |
| [Analytic shapes](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/shapes.md)                               | Box, capsule, cylinder, plane, and sphere queries without tessellation                  |
| [intersectOrientedBoxes2D](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/intersect-oriented-boxes-2d.md) | Allocation-free rotated rectangle queries for screen-space labels and other 2D geometry |

## Test visibility[​](#test-visibility "Direct link to Test visibility")

Supply planes in the same coordinate space as the bounding volume. Plane normals face inward:

A camera frustum can be represented by six planes. `computeVisibility()` returns `'outside'`, `'intersecting'`, or `'inside'`; render or refine intersecting objects as appropriate for the application. Plane masks allow children to skip tests already resolved by a parent's bounds.

Vector inputs can be numeric arrays, including core vectors; no renderer objects are required. This module handles geometric queries, not time-dependent collision simulation.

## Attribution[​](#attribution "Direct link to Attribution")

Bounding-volume and frustum code was ported from Cesium under Apache-2.0. See the source headers and distributed license notices for provenance.

See [Attributions](https://visgl.github.io/math.gl/next/docs/references-and-credits.md) for the project-wide source inventory and acknowledgments.

## Bounds and query extensions[​](#bounds-and-query-extensions "Direct link to Bounds and query extensions")

See [bounds, frusta and geometric queries](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/extended-queries.md) for closed-boundary bounds operations, depth-aware frustum extraction, ray conveniences, barycentric interpolation, triangle–box overlap and plane–segment intersections.
