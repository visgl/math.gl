# intersectOrientedBoxes2D

Test two oriented rectangles in a shared two-dimensional Euclidean coordinate space. This scalar separating-axis query is useful for rotated screen-space labels and other planar collision checks. It does not require 3D bounding volumes, matrices or renderer objects.

```
import {intersectOrientedBoxes2D} from '@math.gl/culling/oriented-box-2d';

import type {OrientedBox2D} from '@math.gl/culling/oriented-box-2d';



const angle = Math.PI / 4;

const first: OrientedBox2D = {

  center: [200, 100],

  halfSize: [40, 8], // half-width and half-height, not full dimensions

  direction: [Math.cos(angle), Math.sin(angle)]

};

const second: OrientedBox2D = {

  center: [230, 110], halfSize: [30, 10], direction: [1, 0]

};

const overlaps = intersectOrientedBoxes2D(first, second);
```

The dedicated subpath has no runtime dependencies. The package root also exports the function and type for convenience; existing root-package dependencies are unchanged.

## Box representation[​](#box-representation "Direct link to Box representation")

`OrientedBox2D` is structural, not a class. Each field accepts a numeric array, typed array or math.gl vector with exactly two finite components:

| Field       | Meaning                                                                               |
| ----------- | ------------------------------------------------------------------------------------- |
| `center`    | Rectangle center in a shared coordinate system.                                       |
| `halfSize`  | Nonnegative half-width and half-height in that system's units.                        |
| `direction` | Nonzero width-axis direction. Magnitude is ignored; the height axis is perpendicular. |

Zero half-sizes describe closed line segments or points. A zero direction is always invalid, even for a point: retaining an explicit orientation avoids undefined degenerate axes. Directions can be prepared once and reused; the query does not compute trigonometric functions. No corners, temporary arrays, query objects or shared mutable scratch buffers are created. Inputs are never modified.

## Intersection and tolerance[​](#intersection-and-tolerance "Direct link to Intersection and tolerance")

`intersectOrientedBoxes2D(first, second, epsilon = 0)` returns a boolean. It tests both axes of both boxes; overlapping axis-aligned extents alone do not imply oriented-box overlap.

Edges and vertices are included. The default allowance is zero. Supply a nonnegative finite `epsilon` in the center's units to tolerate small numerical gaps on every separating axis. This is a **per-axis SAT allowance**, not a Euclidean-distance test: a diagonal gap can pass even when its Euclidean length exceeds `epsilon`. There is no fixed pixel/meter epsilon.

The query subtracts centers before projection and scales each axis's projected displacement and radii independently, so a huge perpendicular extent cannot erase a tiny separating gap. This also avoids overflow in radius sums and opposite-sign center subtraction. Width directions are scaled before local normalization so huge and subnormal finite inputs remain usable. It still uses floating-point arithmetic; recenter coordinates and choose a suitable allowance near contact boundaries. Geometry smaller than the representable precision of its stored coordinates cannot be recovered.

Invalid vector lengths, nonfinite components, negative half-sizes, zero directions or invalid allowances throw `RangeError`. This API does not implement spatial indexing, collision response, label placement policy, geographic projection or 3D oriented-box intersection.

## Tangram conformance[​](#tangram-conformance "Direct link to Tangram conformance")

Tests compare this translated-center/radius formulation against an independent corner-projection SAT oracle over deterministic label-sized rectangles. Both include contact, rotation and containment. The new helper handles zero-sized boxes explicitly instead of deriving an axis from a collapsed edge. Tangram's production collision code and serialized box format are unchanged; a renderer adapter can provide its existing center, half-sizes and width axis.
