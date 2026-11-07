# Numeric helpers

Import these functions from `@math.gl/core`. Vector functions accept finite 2D, 3D or 4D arrays of matching length. Output-writing functions take a sufficiently sized array or typed array first, return it, and support aliasing an input.

## Vector operations[​](#vector-operations "Direct link to Vector operations")

#### `vectorProjectOnVector(out, value, target)`[​](#vectorprojectonvectorout-value-target "Direct link to vectorprojectonvectorout-value-target")

Project onto a possibly non-unit target; a zero target produces zero.

#### `vectorProjectOnPlane(out, value, normal)`[​](#vectorprojectonplaneout-value-normal "Direct link to vectorprojectonplaneout-value-normal")

Remove the normal component; a zero normal leaves the value unchanged.

#### `vectorReflect(out, value, normal)`[​](#vectorreflectout-value-normal "Direct link to vectorreflectout-value-normal")

Reflect across the plane normal; the normal need not be unit length. A zero normal is identity.

#### `vectorSetLength(out, value, length)`[​](#vectorsetlengthout-value-length "Direct link to vectorsetlengthout-value-length")

Set a nonnegative length while preserving direction. A zero vector stays zero.

#### `vectorClampLength(out, value, minimum, maximum)`[​](#vectorclamplengthout-value-minimum-maximum "Direct link to vectorclamplengthout-value-minimum-maximum")

Clamp length to a finite, ordered, nonnegative interval.

#### `vectorManhattanDistance(a, b)`[​](#vectormanhattandistancea-b "Direct link to vectormanhattandistancea-b")

Sum absolute component differences.

These helpers are separate functions so importing a vector class alone does not retain their code. Pass a vector instance as the output to mutate it explicitly.

```
import {Vector3, vectorReflect, vectorClampLength} from '@math.gl/core';



const reflected = vectorReflect(new Float64Array(3), [1, -2, 0], [0, 3, 0]);

// [1, 2, 0]; a non-unit normal is accepted.

const velocity = new Vector3(3, 4, 0);

vectorClampLength(velocity, velocity, 0, 2.5); // [1.5, 2, 0]
```

## Scalar operations[​](#scalar-operations "Direct link to Scalar operations")

All arguments must be finite. Invalid domains throw `RangeError`.

#### `inverseLerp(start, end, value)`[​](#inverselerpstart-end-value "Direct link to inverselerpstart-end-value")

Unclamped interpolation parameter. Equal endpoints return zero. Reversed intervals are supported.

#### `mapLinear(value, inputStart, inputEnd, outputStart, outputEnd)`[​](#maplinearvalue-inputstart-inputend-outputstart-outputend "Direct link to maplinearvalue-inputstart-inputend-outputstart-outputend")

Unclamped range mapping; equal input endpoints return `outputStart`.

#### `damp(start, end, rate, dt)`[​](#dampstart-end-rate-dt "Direct link to dampstart-end-rate-dt")

Exponential approach to `end`, with nonnegative rate and elapsed time. Rate and time use reciprocal units.

#### `smoothstep(value, minimum, maximum)`[​](#smoothstepvalue-minimum-maximum "Direct link to smoothstepvalue-minimum-maximum")

Clamped cubic smoothing; `maximum` must exceed `minimum`.

#### `smootherstep(value, minimum, maximum)`[​](#smootherstepvalue-minimum-maximum "Direct link to smootherstepvalue-minimum-maximum")

Clamped quintic smoothing over a positive-width interval.

#### `pingpong(value, length = 1)`[​](#pingpongvalue-length--1 "Direct link to pingpongvalue-length--1")

Repeat between zero and positive `length`, including for negative inputs.

Damping is time-step independent for a fixed target and rate within floating-point roundoff. Changing the target between steps changes that result.

## Quaternion stepping[​](#quaternion-stepping "Direct link to Quaternion stepping")

#### `quatRotateTowards(out, a, b, step)`[​](#quatrotatetowardsout-a-b-step "Direct link to quatrotatetowardsout-a-b-step")

Normalizes nonzero quaternion inputs and moves along the shortest arc by at most `step` radians. It does not overshoot. `step` must be finite and nonnegative; a zero quaternion is rejected. Outputs may alias inputs. `Quaternion.rotateTowards(target, step)` provides the mutating class equivalent.
