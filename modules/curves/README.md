# @math.gl/curves

Renderer-independent 2D and 3D Euclidean curves: lines, quadratic and cubic Bézier curves,
cubic Hermite curves, and open or closed Catmull–Rom splines. Includes analytic derivatives,
unit tangents, flat Float64 sampling, and reusable approximate arc-length tables.

```ts
import {CubicBezierCurve, CurveArcLength} from '@math.gl/curves';

const curve = new CubicBezierCurve([0, 0, 0], [1, 2, 0], [3, 2, 1], [4, 0, 1]);
const point = curve.getPoint(0.5);
const tangent = curve.getTangent(0.5);
const traversal = new CurveArcLength(curve);
const positions = traversal.getSpacedPoints(100); // 101 xyz vertices
const output = new Float64Array(3);
traversal.getPointAt(0.25, output); // reuse a buffer during animation
```

Control points are copied at construction. Parameters are in [0, 1]; coordinates use the
caller's Cartesian units. Longitude/latitude inputs are treated as a plane, not geodesics.
The package has no renderer, GPU, or runtime dependencies.

See the [module documentation](https://math.gl/docs/modules/curves) for the API and numerical limits.
