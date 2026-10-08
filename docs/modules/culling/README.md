# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From v3.0" />
</p>

`@math.gl/culling` tests bounding volumes against planes and provides analytic shape queries. Use it to reject objects outside a view frustum, intersect rays with shapes, and compute enclosing bounds.


import CullingExample from '@site/src/components/culling-playground';

<CullingExample inline />

## Installation

```bash
npm install @math.gl/culling
```


## Choose a primitive

| API | Use it for |
| --- | --- |
| [CullingVolume](./api-reference/culling-volume.md) | Visibility against a set of inward-facing planes |
| [AxisAlignedBoundingBox](./api-reference/axis-aligned-bounding-box.md) | Bounds aligned with the coordinate axes |
| [OrientedBoundingBox](./api-reference/oriented-bounding-box.md) | Bounds with arbitrary orientation |
| [BoundingSphere](./api-reference/bounding-sphere.md) | A center and radius enclosing geometry |
| [Plane](./api-reference/plane.md) | A normalized normal and signed distance |
| [Ray](./api-reference/ray.md) | An origin and direction for intersection queries |
| [Analytic shapes](./api-reference/shapes.md) | Box, capsule, cylinder, plane, and sphere queries without tessellation |
| [intersectOrientedBoxes2D](./api-reference/intersect-oriented-boxes-2d.md) | Allocation-free rotated rectangle queries for screen-space labels and other 2D geometry |

## Test visibility

Supply planes in the same coordinate space as the bounding volume. Plane normals face inward:

```js
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

## Attribution

Bounding-volume and frustum code was ported from Cesium under Apache-2.0. See the source headers and distributed license notices for provenance.
