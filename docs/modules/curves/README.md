# @math.gl/curves

import CurvesExample from '@site/src/components/curves';

<CurvesExample inline interactive height={580} />

The curves module provides renderer-independent parametric curves for 2D and 3D Cartesian
coordinates. Use it for camera paths, trajectories, interpolation, and sampled line geometry.

```ts
import {CatmullRomCurve, CurveArcLength} from '@math.gl/curves';

const path = new CatmullRomCurve([
  [0, 0, 0],
  [1, 2, 0],
  [4, 2, 1],
  [6, 0, 1]
]);
const traversal = new CurveArcLength(path, 2048);
const position = traversal.getPointAt(0.5);
const tangent = path.getTangent(traversal.getParameterAt(0.5));
const vertices = traversal.getSpacedPoints(128); // flat Float64Array, 129 xyz points
```

- [Curve classes](./api-reference/curves.md): line, quadratic/cubic Bézier, Hermite, and Catmull–Rom.
- [CurveArcLength](./api-reference/curve-arc-length.md): reusable length approximation and distance sampling.

Control points may be arrays, math.gl vectors, or numeric typed arrays. Every point in a curve
must have the same dimension (2 or 3) and finite coordinates. Built-in curves copy their control
data during construction and expose no control-point mutation API. All calculations use JavaScript
numbers; generated flat buffers use Float64Array. Point, derivative, and tangent methods accept
caller-owned output arrays or typed arrays.

Coordinates are Euclidean and lengths use the input units. Project geographic positions into an
appropriate Cartesian frame first; interpolating raw longitude/latitude does not produce a geodesic
or handle antimeridian crossings. Arithmetic remains subject to floating-point overflow and rounding.

This first version focuses on curve evaluation and traversal. Moving frames, swept meshes, NURBS,
and geodesic interpolation are outside its current API.
