# Float precision

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

Use these `@math.gl/core` functions to send float64 positions to a GPU that reads float32.
JavaScript numbers are float64, with 53 significant bits. A float32 value has 24. At the
distance of the Earth from the Sun, 1.5e11 m, adjacent float32 values are 16 km apart.

There are two methods:

- **Origin subtraction (floating origin).** Keep positions in float64. Subtract an origin near
  the viewer in float64, then round the small result to float32. Move the origin when the
  viewer moves far from it. deck.gl `coordinateOrigin` and its offset coordinate systems use
  this method.
- **High/low split.** Store each value as two float32 values, `high + low`. The shader adds
  the two parts with float64-like arithmetic. luma.gl `fp64ify` and the deck.gl
  `positions64Low` attribute use this split.

```typescript
import {
  getFloat32Spacing,
  splitFloat64,
  splitFloat64Array,
  subtractOrigin,
  subtractOriginFromMatrix4
} from '@math.gl/core';

const positions = new Float64Array([4462401221997.05, 229825307562.78, -107360971771.64]);
getFloat32Spacing(positions[0]); // 524288: float32 values near Neptune are 524 km apart.

// Floating origin: subtract in float64, round once.
const origin = [4462400000000, 229825000000, -107360000000];
const relative = subtractOrigin(positions, origin); // Float32Array [1221997, 307562.78125, -971771.625]

// High/low split for a float64 shader.
const {high, low} = splitFloat64Array(positions);
```

All functions round with `Math.fround`: IEEE 754 round to nearest, ties to even. Non-finite
input throws `RangeError`, and so does a value that rounds to an infinite float32
(`|value| > 3.4028235e38`).

## Precision

The table gives the error of a body centre in the tangram.gl solar-system example. The unit is
1e6 km, the Sun is at the origin, and the time is 2026-11-19T00:00:00Z.

| Body    | float32 error of the centre | Bound from `getFloat32Spacing` | Limb point, origin at the centre |
| ------- | --------------------------- | ------------------------------ | -------------------------------- |
| Earth   | 4.4 km                      | 5.4 km                         | below 0.3 m                      |
| Neptune | 145.3 km                    | 244.3 km                       | below 1 m                        |

The error of a float32 value changes from one position to the next. The bound does not.

## Functions

#### `getFloat32Spacing(value: number): number`

Returns the distance between adjacent float32 values at the magnitude of `value`. For
`2^e <= |value| < 2^(e+1)` the spacing is `2^(e-23)`. Below `2^-126` it is `2^-149`. Rounding to
float32 moves a value by at most half the spacing. Use it to state the precision of a buffer,
or to find the distance at which to move a floating origin.

#### `splitFloat64(value: number): [high: number, low: number]`

Returns `high = Math.fround(value)` and `low = Math.fround(value - high)`. The subtraction is
exact. For `|value| >= 2^-101`, `high + low` differs from `value` by at most
`getFloat32Spacing(value) / 2^26`, a relative error of at most 2^-49. Below `2^-101` the error is
at most 2^-150. The worst case is just below the midpoint of two float32 values, for example
`2^e * (1 + 2^-24 - 2^-49)`.

#### `splitFloat64Array(values, high?, low?): {high: Float32Array, low: Float32Array}`

Applies `splitFloat64` to each value. The high parts go into `high` and the low parts into
`low`, at the same index. This is the layout of the deck.gl `positions` and `positions64Low`
attributes. The two optional arrays must have at least `values.length` elements.

#### `subtractOrigin(positions, origin, options?): Float32Array`

Returns `fround(position - origin)` for each position, with the subtraction in float64.

- `positions`: an array of numbers, `stride` elements per position. The length must be a
  multiple of `stride`.
- `origin`: 1 to 4 finite components, for example `[x, y, z]`.
- `options.stride`: elements from one position to the next. The default is `origin.length`.
  Elements after the first `origin.length` of each position are not read.
- `options.target`: a `Float32Array` for the result, at least `count * origin.length` long.

The result is packed: `origin.length` values per position. Each value has an error of at most
half of `getFloat32Spacing(position - origin)`, plus one float64 rounding. If you round the
position and the origin to float32 first, the error is up to half of
`getFloat32Spacing(position)`. The gain is about `|position| / |position - origin|`.

#### `subtractOriginFromMatrix4(out, matrix, origin): out`

Sets `out = translation(-origin) * matrix` for a column-major 4x4 matrix, in float64. For an
affine matrix such as a model matrix, the rotation and scale do not change, and the
translation becomes `translation - origin` with one float64 rounding. Round `out` to float32
after the call. `out` can be `matrix`.

A view matrix goes from world to eye. To use it with origin-relative positions, multiply it by
`translation(origin)` on the right: `mat4.translate(out, view, origin)`.

## Choosing an origin

A function cannot know where the viewer is, so the origin is application state. A simple rule
is to move the origin to the camera target when the target is farther from the origin than a
distance `d`. Choose `d` so that `getFloat32Spacing(d) / 2` is below the error that you accept.
For example, `getFloat32Spacing(8192) / 2` is 0.49 mm, so `d = 8 km` keeps metre positions to
better than 1 mm.

After the origin moves, compute the positions and the matrices again from the float64 values.
Do not add the origin change to float32 values: that adds a float32 rounding at each move.
