# SampleTrack

Evaluate timestamped scalar, vector, or quaternion samples with reusable outputs.
Import `SampleTrack` and `SampleTrackOptions` from `@math.gl/core`.

```js
import {SampleTrack} from '@math.gl/core';

const track = new SampleTrack([0, 1, 3], [0, 0, 2, 3, 6, 9], {
  size: 2,
  interpolation: 'cubic'
});
const result = track.evaluate(2, new Float64Array(2)); // [4, 6]
```

## Construction

`new SampleTrack(times, values, options = {})`

The constructor copies caller data. Times must be finite and strictly increasing;
duplicate timestamps are rejected. Values are flat, sample-major, finite numbers
with exactly `times.length * size` entries. At least one sample is required.

| Option | Default | Meaning |
| --- | --- | --- |
| `size` | `1`, or `4` for quaternion tracks | Positive number of components per sample. |
| `interpolation` | `'linear'` | `'discrete'`, `'linear'`, `'cubic'`, or `'bezier'`. |
| `boundary` | `'clamp'` | Clamp outside times to endpoint samples, or throw with `'throw'`. |
| `quaternion` | `false` | Normalize nonzero `[x,y,z,w]` samples and align adjacent signs. Requires size 4. |
| `inTangents`, `outTangents` | None | Required time/value control points for Bézier tracks. |

## Evaluation

`track.evaluate(time, out?)` returns the output buffer, allocating a number array
when omitted. A supplied buffer must have at least `size` elements. Time must be
finite. The interval cache accelerates repeated access; binary search also supports
backward and random access. Exact knots return their sample (with normalized/sign-
aligned quaternion representation).

- Discrete interpolation holds the preceding sample until the next knot.
- Linear scalar/vector interpolation uses the interval's actual duration. Linear
  quaternion interpolation uses shortest-arc spherical interpolation.
- Cubic interpolation is component Hermite interpolation. Interior derivatives use
  the secant across neighboring samples and their actual timestamps; endpoint
  derivatives are one-sided. Quaternion cubic interpolation normalizes the resulting
  components. It is not squad or a constant-angular-speed rotation. If the cubic
  result is zero, evaluation throws.
- A one-sample track returns that sample throughout its clamped domain.

## Bézier time/value controls

For `N` samples of size `S`, each tangent array has `N * S * 2` entries. Each pair
is `[controlTime, controlValue]` for the corresponding key and component. For each
interval, control times must satisfy:

`startTime <= outgoingControlTime <= incomingControlTime <= endTime`.

This ensures monotonic time. Evaluation solves for the curve parameter with bounded
bisection before evaluating the value; it does not treat normalized time as the
Bézier parameter. Unused endpoint tangents must still be finite and present.
Quaternion tracks do not support this mode.

```js
const eased = new SampleTrack([0, 1], [0, 1], {
  interpolation: 'bezier',
  inTangents: [0, 0, 1, 0],
  outTangents: [0, 0, 1, 1]
});
const value = eased.evaluate(0.5); // approximately [0.125]
```

This API interpolates sample tracks. For geometric paths and distance-based sampling,
see [curves](../../geometry/curves/api-reference/curves.md).
