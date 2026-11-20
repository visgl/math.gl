# SimulationClock

A fixed-tick time base for animated scenes. The clock converts real milliseconds to
simulated seconds at a rate. It reports the ticks to step and the fraction `alpha`
between two ticks, so a renderer can interpolate between tick states.
Import `SimulationClock` and `interpolateTickState` from `@math.gl/core`.

```js
import {SimulationClock, interpolateTickState} from '@math.gl/core';

const clock = new SimulationClock({tickInterval: 1 / 30, rate: 86400});
let previous = getState(clock.getTickIndex());
let next = getState(clock.getTickIndex() + 1);

function onFrame(realMilliseconds) {
  const {ticks, skippedTicks} = clock.advance(realMilliseconds);
  if (ticks !== 0 || skippedTicks !== 0) {
    previous = getState(clock.getTickIndex());
    next = getState(clock.getTickIndex() + 1);
  }
  draw(clock.interpolate(previous, next, interpolateTickState));
}
```

## Model

- The simulated time is `startTime + tickIndex * tickInterval + remainder`. The tick index
  is an integer. The remainder is in [0, `tickInterval`). The clock does not keep a running
  sum of the time, so the time does not drift over many advances.
- The clock is time-scale-free. Simulated time is a number of seconds from an epoch that you
  choose. To use a time scale such as TT or UTC, keep the epoch in that scale and add
  `getElapsedTime()` to it.
- The rate is simulated seconds for each real second. A rate of 0 holds the time. A negative
  rate runs the time backward. Real time must not be negative.
- A rate change does not change the simulated time. Only later advances use the new rate.

## Construction

`new SimulationClock(options)`

| Option | Default | Description |
| --- | --- | --- |
| `tickInterval` | Required | Fixed tick interval `dt`, in simulated seconds. Finite and greater than 0. |
| `startTime` | `0` | Simulated time at tick 0, in seconds. Finite. |
| `rate` | `1` | Simulated seconds for each real second. Finite. |
| `maxTicksPerAdvance` | `1000` | Maximum ticks that one advance reports as ticks to step. Positive safe integer. |
| `catchUpPolicy` | `'skip'` | `'skip'` or `'lag'`. See [Large rates](#large-rates). |
| `renderDelayTicks` | `0` | Ticks that the render time runs behind the simulated time. Non-negative safe integer. See [Render delay](#render-delay). |

The constructor throws `RangeError` for an option that is not valid.

## Methods

#### `advance(realMilliseconds, out?)`

Advances the clock by an interval of real time at the current rate. Returns an object with
these fields. Pass `out` to fill an object that you keep.

| Field | Description |
| --- | --- |
| `ticks` | Signed number of ticks to step: positive forward, negative backward. Its magnitude is at most `maxTicksPerAdvance`. |
| `skippedTicks` | Signed number of ticks that the clock passed and did not report. Only `'skip'` sets it. |
| `droppedTime` | Signed simulated seconds that the clock dropped. Only `'lag'` sets it. |

The stepped ticks are the last ticks of the advance. When `skippedTicks` is not 0, set the
state at tick `getTickIndex() - ticks`, then step `ticks` times.

`advance` throws `RangeError` if `realMilliseconds` is negative or not finite, or if the tick
index leaves the safe integer range.

#### `getTime()`

Returns the simulated time, in seconds.

#### `getElapsedTime()`

Returns the simulated seconds since `startTime`. Use it when `startTime` is large, for
example a Unix time, to keep the precision of the fraction.

#### `getTickIndex()`

Returns the integer index of the last tick at or before the current time. It is negative
before `startTime`.

#### `getTickAlpha()` and `getSecondsIntoTick()`

Both give the position of the clock inside the current tick:

- `getTickAlpha()` returns the fraction of the tick, in [0, 1). It has no unit.
- `getSecondsIntoTick()` returns the simulated seconds after the tick, in [0, `tickInterval`).

They are equal only when `tickInterval` is 1. `interpolate` gives its callback `alpha`, and
`evaluate` gives its callback seconds, so a callback cannot receive the wrong one.

#### `getRenderTickIndex()` and `getRenderTime()`

Return the render tick, `getTickIndex() - renderDelayTicks`, and the render time,
`getTime() - renderDelayTicks * tickInterval`. The render tick has the same `alpha` and the
same seconds into the tick as the current tick.

#### `getTickTime(tickIndex)`

Returns the simulated time of a tick: `startTime + tickIndex * tickInterval`.

#### `getRate()` and `setRate(rate)`

Get or set the rate. `setRate` does not change the simulated time. It throws `RangeError`
if `rate` is not finite.

#### `seek(time)`

Moves the clock to a simulated time. You must then set the state at the new tick. It throws
`RangeError` if `time` is not finite or is outside the safe tick range.

#### `rebase()`

Moves the epoch forward to the current tick. The tick index becomes 0, and `startTime`
increases by the old tick index times `tickInterval`. `getTime()`, `alpha` and the seconds
into the tick do not change, except for the rounding of one addition to `startTime`. Returns
the number of ticks that the epoch moved. Decrease each tick index that you store by this
count. Use it in long runs, so that tick indices and `getElapsedTime()` stay small.

#### `evaluate(evaluator)`

Calls `evaluator(getRenderTickIndex(), getSecondsIntoTick())` and returns its result. Use it
when the motion between two ticks has an exact solution, for example a closed-form orbit, or
an exact integrator that starts from the state at the tick. A straight-line blend of two tick
states cuts the corners of curved motion, and its velocity jumps at each tick.

```js
const position = clock.evaluate((tickIndex, secondsIntoTick) =>
  getOrbitPosition(tickIndex * clock.tickInterval + secondsIntoTick)
);
```

#### `interpolate(previous, next, interpolator)`

Calls `interpolator(previous, next, getTickAlpha())` and returns its result. `previous` is
the state at tick `getRenderTickIndex()` and `next` is the state at the tick after it. Use
`interpolateTickState` for numbers and vectors. Supply another function for other states,
for example a quaternion slerp:

```js
import {quat} from '@math.gl/core';

const rotation = clock.interpolate(previousRotation, nextRotation, (a, b, alpha) =>
  quat.slerp([0, 0, 0, 1], a, b, alpha)
);
```

## Large rates

At a rate of one year per second and a tick of 1/60 s, one 16 ms frame passes about
3 × 10⁷ ticks. `maxTicksPerAdvance` limits the ticks that one advance reports.
`catchUpPolicy` sets what happens to the other ticks:

- `'skip'` keeps the full rate. The clock moves past the extra ticks and reports them in
  `skippedTicks`. Use it when you can compute the state at a tick directly, for example
  from an analytic orbit.
- `'lag'` steps `maxTicksPerAdvance` ticks only. The clock keeps the old fraction of a tick
  and reports the rest of the time in `droppedTime`. The simulated time falls behind the
  rate. Use it when each tick must run, for example in a numeric integration.

## Render delay

With `renderDelayTicks` set to N, the renderer draws the time N ticks before the simulated
time. The states of the N ticks after the render tick then exist before the renderer needs
them, for example when a worker or a network sends them late. Use `interpolate` or
`evaluate` with the render tick: they use `getRenderTickIndex()`.

## `interpolateTickState(previous, next, alpha, out?)`

Linearly interpolates `previous + alpha * (next - previous)`. It is the fallback for states
that have no exact solution between ticks. The states are both numbers,
or both arrays or typed arrays with the same length. For arrays, the function writes to
`out` if you supply it, else to a new array. `out` can be `previous` or `next`. It throws
`RangeError` if `alpha` is not finite, if the lengths do not match, or if `out` is too short.

## Relation to other time APIs

- [SampleTrack](./sample-track.md) evaluates keyframes at a time. Use it with
  `clock.getTime()` for recorded or authored motion.
- luma.gl `Timeline` in `@luma.gl/engine` maps the engine time to animation channels with a
  delay, a duration and repeats. It has no fixed tick, it does not run before time 0, and a
  change of a channel rate changes the channel time. Use `Timeline` for finite animations,
  and `SimulationClock` for a simulated world that runs at a variable rate.
