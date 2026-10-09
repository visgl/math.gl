# CurveArcLength

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

```
import {CubicBezierCurve, CurveArcLength} from '@math.gl/curves';



const curve = new CubicBezierCurve([0, 0], [0, 2], [3, 2], [3, 0]);

const traversal = new CurveArcLength(curve, 2048);

const halfway = traversal.getPointAt(0.5);
```

## Constructor[​](#constructor "Direct link to Constructor")

`new CurveArcLength(curve, divisions = 1024)` samples the curve uniformly in t and builds a cumulative chord-length table. Construction takes O(divisions) evaluations and O(divisions) storage. Divisions must be a positive safe integer and the table must fit available memory. Non-finite computed lengths throw RangeError.

Build the table once and reuse it during animation. Built-in curves copy their control data; if a custom Curve changes after table construction, create a new table.

## Properties and methods[​](#properties-and-methods "Direct link to Properties and methods")

* `curve`: the sampled Curve.
* `divisions`: the table resolution.
* `length`: approximate total length in the curve's coordinate units.
* `getParameterAt(u)`: map a fraction of total length to normalized t using binary search and linear interpolation in the table. Query cost is O(log divisions).
* `getPointAt(u, result?)`: evaluate the curve at that mapped parameter. Optional result buffers follow the same rules as Curve.getPoint.
* `getSpacedPoints(divisions = 64)`: flat Float64Array containing `divisions + 1` points at approximately equal arc-length fractions, including both endpoints.

u must be finite and in \[0, 1]. Both endpoints are preserved exactly. For a zero-length table, `getParameterAt(u)` returns u. Stationary intervals within nonzero-length curves are skipped by interior distance queries.

## Accuracy[​](#accuracy "Direct link to Accuracy")

This is a fixed-resolution polyline approximation, not exact quadrature or an error-bounded adaptive solver. Increase table divisions for highly curved paths. A coarse table can miss loops or backtracking entirely; a zero-length table does not prove that the curve is constant. Output sampling divisions change the number of emitted points, not the table's accuracy. For splines, choosing a table resolution divisible by the number of segments includes every knot.
