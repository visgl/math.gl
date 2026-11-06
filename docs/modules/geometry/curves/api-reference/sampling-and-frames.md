# Adaptive sampling and transport frames

Import these helpers from `@math.gl/geometry`. Existing parametric curves and
`CurveArcLength` remain available for fixed-division sampling and length lookup.

## sampleCurveAdaptive

`sampleCurveAdaptive(curve, {tolerance, maxDepth = 16, maxPoints = 65536})`

Returns flat `positions`, matching `parameters`, `converged`, and
`maxSampledError`. Parameters increase from zero to one, including both endpoints.
`tolerance` must be positive and finite, in the curve's coordinate units.
`maxDepth` is an integer from 0 to 30; `maxPoints` is an integer of at least two.

Each interval checks quarter, midpoint and three-quarter points against its chord.
Intervals exceeding tolerance are subdivided until accepted or a work limit is
reached. `converged: false` means a limit prevented meeting this sampled criterion;
the returned points still cover the whole parameter interval.

This is a sampled error estimate, not a certified global bound for arbitrary
oscillatory curves. `maxSampledError` describes accepted/output intervals and must
not be interpreted as the maximum distance over all parameters.

```js
import {QuadraticBezierCurve, sampleCurveAdaptive} from '@math.gl/geometry';

const curve = new QuadraticBezierCurve([0, 0], [1, 2], [2, 0]);
const samples = sampleCurveAdaptive(curve, {tolerance: 0.001, maxPoints: 4096});
if (!samples.converged) {
  // Increase the budget or accept the reported sampled error.
}
```

## computeParallelTransportFrames

`computeParallelTransportFrames(points, {closed = false, initialNormal} = {})`

Accepts at least two finite 3D polyline points and returns flat `tangents`, `normals`,
and `binormals`, with three components per input point. Tangents use the next distinct
point, or the preceding distinct point at the end. Repeated points are retained;
an entirely stationary path is rejected.

The optional initial normal is projected perpendicular to the first tangent and
normalized. A parallel or zero initial normal is rejected. When omitted, a coordinate
axis with the least alignment to the first tangent is selected deterministically.

Frames use minimal rotation between successive tangent directions. At an exact
180-degree reversal, the previous normal supplies a deterministic rotation axis.
This convention avoids an undefined cross-product axis, but a reversing path still
has a discontinuous tangent.

A closed path must repeat its first point as its last point and have at least four
entries. Residual twist is distributed by accumulated polyline distance so the
first and last frames agree. These are frames of the supplied polyline, not a claim
of analytic curvature or torsion for the underlying curve.
