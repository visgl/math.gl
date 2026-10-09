# Overview

![From v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

`@math.gl/culling` tests bounding volumes against planes and provides analytic shape queries. Use it to reject objects outside a view frustum, intersect rays with shapes, and compute enclosing bounds.

<!-- -->

Loading <!-- -->Frustum culling<!-- -->…

⛶⛶ Explore fullscreen

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/culling
```

## Choose a primitive[​](#choose-a-primitive "Direct link to Choose a primitive")

| API                                                                                                                                             | Use it for                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [CullingVolume](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/culling-volume.md)                         | Visibility against a set of inward-facing planes                                        |
| [AxisAlignedBoundingBox](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/axis-aligned-bounding-box.md)     | Bounds aligned with the coordinate axes                                                 |
| [OrientedBoundingBox](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/oriented-bounding-box.md)            | Bounds with arbitrary orientation                                                       |
| [BoundingSphere](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/bounding-sphere.md)                       | A center and radius enclosing geometry                                                  |
| [Plane](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/plane.md)                                          | A normalized normal and signed distance                                                 |
| [Ray](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/ray.md)                                              | An origin and direction for intersection queries                                        |
| [Analytic shapes](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/shapes.md)                               | Box, capsule, cylinder, plane, and sphere queries without tessellation                  |
| [intersectOrientedBoxes2D](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/intersect-oriented-boxes-2d.md) | Allocation-free rotated rectangle queries for screen-space labels and other 2D geometry |

## Test visibility[​](#test-visibility "Direct link to Test visibility")

Supply planes in the same coordinate space as the bounding volume. Plane normals face inward:

```
import {BoundingSphere, CullingVolume, Plane} from '@math.gl/culling';



const volume = new CullingVolume([

  new Plane([1, 0, 0], 1),  // x >= -1

  new Plane([-1, 0, 0], 1)  // x <= 1

]);

const visibility = volume.computeVisibility(new BoundingSphere([0, 0, 0], 0.5));

// 'inside'
```

A camera frustum can be represented by six planes. `computeVisibility()` returns `'outside'`, `'intersecting'`, or `'inside'`; render or refine intersecting objects as appropriate for the application. Plane masks allow children to skip tests already resolved by a parent's bounds.

Vector inputs can be numeric arrays, including core vectors; no renderer objects are required. This module handles geometric queries, not time-dependent collision simulation.

## Attribution[​](#attribution "Direct link to Attribution")

Bounding-volume and frustum code was ported from Cesium under Apache-2.0. See the source headers and distributed license notices for provenance.
