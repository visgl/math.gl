# Curve classes

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

```
import {

  Curve,

  LineCurve,

  QuadraticBezierCurve,

  CubicBezierCurve,

  HermiteCurve,

  CatmullRomCurve

} from '@math.gl/curves';
```

## Constructors[​](#constructors "Direct link to Constructors")

All points and tangent vectors contain either two or three finite coordinates, with matching lengths. Inputs are copied at construction; later edits to the original arrays have no effect.

| Class                  | Arguments                                | Behavior                                                     |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| `LineCurve`            | `(start, end)`                           | Linear interpolation.                                        |
| `QuadraticBezierCurve` | `(start, control, end)`                  | Quadratic Bézier interpolation.                              |
| `CubicBezierCurve`     | `(start, control1, control2, end)`       | Cubic Bézier interpolation.                                  |
| `HermiteCurve`         | `(start, end, startTangent, endTangent)` | Cubic interpolation with the specified endpoint derivatives. |
| `CatmullRomCurve`      | `(points, options?)`                     | Piecewise cubic interpolation through every control point.   |

Hermite tangents are derivatives with respect to normalized t, including magnitude. They are not unit directions. Bézier derivatives follow the standard degree-scaled control-point differences.

## Shared methods[​](#shared-methods "Direct link to Shared methods")

* `dimension`: coordinate count, either 2 or 3.
* `getPoint(t, result?)`: position at t.
* `getDerivative(t, result?)`: analytic derivative with respect to normalized t.
* `getTangent(t, result?)`: normalized derivative; a zero vector at stationary points.
* `getPoints(divisions = 64)`: a flat Float64Array containing `divisions + 1` evenly spaced parameter samples, including both endpoints. Buffer length is `(divisions + 1) * dimension`.

Parameters must be finite and in \[0, 1]. Out-of-range inputs throw RangeError; curves do not clamp or extrapolate. Divisions must be positive safe integers and allocations must fit available memory. Optional result buffers must have at least `dimension` entries. Methods return the same buffer and preserve extra entries; without a buffer they allocate a number array. Use floating-point buffers for fractional results; integer typed arrays follow JavaScript's integer conversion rules.

`Curve` is also an abstract base for custom curves: call `super(dimension)` and implement protected `evaluate(t, result, derivative)`. Built-in validation and sampling then apply to your implementation.

## CatmullRomCurve options[​](#catmullromcurve-options "Direct link to CatmullRomCurve options")

* `closed = false`: open curves require at least two points; closed curves require at least three. Closed curves connect the last point to the first automatically. Supply each knot once, without repeating the first point at the end.
* `parameterization = 'centripetal'`: supports `'centripetal'`, `'chordal'`, and `'uniform'`. Nonuniform knot intervals use the square root of chord length or chord length, respectively.
* `tension = 0.5`: supported only with `'uniform'`, in \[0, 1]. Zero gives stationary knot derivatives; the default produces the standard uniform Catmull–Rom spline. Passing tension for a nonuniform spline throws rather than silently ignoring it.

Each segment occupies an equal portion of normalized t, regardless of its length. Knot i on an open curve with n points is at `i / (n - 1)`; on a closed curve it is at `i / n`. Open endpoints use linearly extrapolated neighboring control points. Coincident nonuniform knots form stationary segments. Coincident neighboring knots reuse the current segment interval to avoid division by zero. Tangent continuity is not promised at repeated knots.

Derivatives include the number-of-segments scale factor. At interior knots the returned derivative uses the following segment; at t=1 it uses the final segment. Uniform splines have matching knot derivatives. Nonuniform splines have matching tangent directions at distinct regular knots, but can have different derivative magnitudes because each segment receives an equal parameter span. Use CurveArcLength for approximately constant-speed traversal.
