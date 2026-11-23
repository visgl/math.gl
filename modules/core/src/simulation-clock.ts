// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {NumericArray} from './types';

/**
 * What the clock does when one advance passes more ticks than `maxTicksPerAdvance`.
 *
 * - `'skip'`: the simulated time keeps the full rate. The advance reports the last
 *   `maxTicksPerAdvance` ticks as ticks to step, and the other ticks as skipped ticks.
 *   Use it when the caller can set its state at a tick directly, for example from an
 *   analytic orbit model.
 * - `'lag'`: the simulated time advances by `maxTicksPerAdvance` ticks only. The clock
 *   drops the remaining time, so it falls behind the requested rate. Use it when each
 *   tick must run, for example in a numeric integration.
 */
export type SimulationClockCatchUpPolicy = 'skip' | 'lag';

/** Options for {@link SimulationClock}. */
export type SimulationClockOptions = {
  /**
   * Fixed tick interval `dt`, in simulated seconds. Finite and greater than 0.
   */
  tickInterval: number;
  /** Simulated time at tick 0, in seconds. The clock does not define a time scale. Default 0. */
  startTime?: number;
  /**
   * Simulated seconds for each real second. Finite. Use 0 to pause and a negative value to
   * run backward. Default 1.
   */
  rate?: number;
  /** Maximum number of ticks that one advance reports as ticks to step. Positive safe integer. Default 1000. */
  maxTicksPerAdvance?: number;
  /** Policy when one advance passes more than `maxTicksPerAdvance` ticks. Default `'skip'`. */
  catchUpPolicy?: SimulationClockCatchUpPolicy;
  /**
   * Number of ticks that the render time runs behind the simulated time. Non-negative safe
   * integer. Default 0. A delay of N keeps the states of the N ticks after the render tick
   * available, for example when they come from a worker or a network.
   */
  renderDelayTicks?: number;
};

/** Result of {@link SimulationClock.advance}. */
export type SimulationClockAdvance = {
  /**
   * Signed number of ticks to step: positive forward, negative backward. Its magnitude is
   * at most `maxTicksPerAdvance`. The stepped ticks are the last ticks that the advance passed.
   */
  ticks: number;
  /**
   * Signed number of ticks that the advance passed and did not report as ticks to step.
   * It is 0 unless the catch-up policy is `'skip'`. When it is not 0, set the state at tick
   * `getTickIndex() - ticks` before stepping.
   */
  skippedTicks: number;
  /**
   * Signed simulated seconds that the advance dropped. It is 0 unless the catch-up policy is
   * `'lag'`.
   */
  droppedTime: number;
};

/**
 * Interpolates between the states at two adjacent ticks. This is a fallback for states
 * without an exact solution between ticks; see {@link TickStateEvaluator}.
 * @param previous State at tick `getRenderTickIndex()`.
 * @param next State at tick `getRenderTickIndex() + 1`.
 * @param alpha Fraction of the tick interval after `previous`, in [0, 1).
 * @returns The interpolated state.
 */
export type TickStateInterpolator<StateT> = (
  previous: StateT,
  next: StateT,
  alpha: number
) => StateT;

/**
 * Evaluates the state of a model at a time inside a tick. Use it for the exact solution of
 * the motion, for example a closed-form orbit or an exact integrator that starts from the
 * state at the tick. It receives seconds, not the fraction `alpha`.
 * @param tickIndex Index of the render tick.
 * @param secondsIntoTick Simulated seconds after the render tick, in [0, `tickInterval`).
 * @returns The state at `tickIndex * tickInterval + secondsIntoTick` after `startTime`.
 */
export type TickStateEvaluator<StateT> = (tickIndex: number, secondsIntoTick: number) => StateT;

/** Default value of {@link SimulationClockOptions.maxTicksPerAdvance}. */
const DEFAULT_MAX_TICKS_PER_ADVANCE = 1000;

/** Unit roundoff of float64, `u = 2^-53`: the relative error bound of one rounded operation. */
const UNIT_ROUNDOFF = Number.EPSILON / 2;

/**
 * Number of unit roundoffs, for each second of `|time| + tickInterval`, in the error bound of
 * one split of a time into ticks. With `t` the time to split, `d` the tick interval and `q`
 * the tick quotient, the rounded operations give:
 * - `realMilliseconds` from the caller: at most 1 rounding, `u * |delta|`;
 * - `delta = realMilliseconds / 1000 * rate`: 2 roundings, `2u * |delta|`;
 * - `total = remainder + delta`: 1 rounding, `u * |t|`;
 * - `q * d`, and the difference between `d` and the nominal tick interval that `d` rounds:
 *   `u * |q| * d` each, with `|q| * d <= |t| + d`.
 * As `|delta| <= |t| + d`, the sum is at most `3u(|t| + d) + u|t| + 2u(|t| + 2d) <= 7u(|t| + d)`.
 */
const ROUNDING_TERMS = 7;

/**
 * Returns the bound on the rounding error of one split of a time into ticks.
 * @param time Time to split, in seconds.
 * @param tickInterval Tick interval, in seconds.
 * @returns `7u(|time| + tickInterval)`, in seconds.
 */
function getSplitErrorBound(time: number, tickInterval: number): number {
  return ROUNDING_TERMS * UNIT_ROUNDOFF * (Math.abs(time) + tickInterval);
}

/**
 * Returns the bound on the rounding error of the remainder after a split.
 * @param remainder Remainder of the split, in seconds.
 * @param window Snap window of the split: the bound on the error of the time that it splits.
 * @returns 0 on a tick boundary, where the clock takes the time as exact, else `window`.
 */
function getRemainderErrorBound(remainder: number, window: number): number {
  return remainder === 0 ? 0 : window;
}

/**
 * A fixed-tick time base for animated scenes.
 *
 * The clock converts real milliseconds to simulated seconds at a rate. It stores the
 * simulated time as an integer tick index and a remainder in [0, `tickInterval`), so the
 * time does not drift over many advances. The tick fraction `alpha` lets a renderer
 * interpolate between the states at two ticks.
 *
 * The clock is time-scale-free: simulated time is a number of seconds from an epoch that
 * the caller chooses.
 *
 * Tick boundaries: the clock keeps a bound on the rounding error of its remainder, relative to
 * the nominal time of the inputs. Each split of a time `t` into ticks adds `7u(|t| + tickInterval)`,
 * where `u = 2^-53`. A remainder within the bound below `tickInterval` is on the next tick
 * boundary. On a boundary the clock takes the time as exact and sets the bound to 0. A seek
 * also counts the rounding of the input time and of `startTime`. The snap window is at most
 * `tickInterval / 2`, so a time exactly on a tick stays on that tick, also when the bound is
 * larger than a tick at a large time. Thus 1 advance of 300 ms and 3 advances of 100 ms with a
 * 0.1 s tick both give 3 ticks and `alpha` 0, while 299.999 ms stays on tick 2. The bound grows
 * only between tick boundaries, as the true error can.
 */
export class SimulationClock {
  /** Fixed tick interval, in simulated seconds. */
  readonly tickInterval: number;
  /** Number of ticks that the render time runs behind the simulated time. */
  readonly renderDelayTicks: number;
  /** Maximum number of ticks that one advance reports as ticks to step. */
  readonly maxTicksPerAdvance: number;
  /** Policy when one advance passes more than `maxTicksPerAdvance` ticks. */
  readonly catchUpPolicy: SimulationClockCatchUpPolicy;
  /** Simulated seconds for each real second. */
  private rate: number;
  /** Simulated time at tick 0, in seconds. Only {@link SimulationClock.rebase} changes it. */
  private epoch: number;
  /**
   * Bound on the rounding error of `epoch`, in seconds: `u|startTime|` for the input, and
   * `4u(|epoch| + |tickCount * tickInterval|)` when {@link SimulationClock.rebase} moves the epoch.
   */
  private epochErrorBound: number;
  /** Integer index of the last tick at or before the current time. */
  private tickIndex = 0;
  /** Simulated seconds after the tick `tickIndex`, in [0, `tickInterval`). */
  private remainder = 0;
  /**
   * Bound on the rounding error of `remainder`, in seconds, relative to the nominal time.
   * A split computes the new remainder from the old one, so the old error stays in it: the
   * bound after a split is the old bound plus the {@link getSplitErrorBound} of the split.
   * This sum is also the snap window of the split. When the remainder is 0, after a snap or
   * exactly, the clock takes the time to be on that tick boundary, so the remainder is exact
   * and the bound is 0. The lag policy keeps the old remainder and its bound. A rebase does not
   * change the remainder or its bound. Between tick boundaries the bound grows with each split,
   * as the true error can: the difference between `tickInterval` and the nominal tick interval,
   * for example, adds an error with the same sign at each tick.
   */
  private remainderErrorBound = 0;
  /** Remainder that {@link SimulationClock.splitTicks} returns with the tick count. */
  private splitRemainder = 0;

  /**
   * Creates a clock at tick 0.
   * @param options Clock options.
   * @throws RangeError if an option is not valid.
   */
  constructor(options: SimulationClockOptions) {
    const {
      tickInterval,
      startTime = 0,
      rate = 1,
      maxTicksPerAdvance = DEFAULT_MAX_TICKS_PER_ADVANCE,
      catchUpPolicy = 'skip',
      renderDelayTicks = 0
    } = options;
    if (!Number.isFinite(tickInterval) || tickInterval <= 0) {
      throw new RangeError('SimulationClock tickInterval must be finite and greater than 0');
    }
    if (!Number.isFinite(startTime)) {
      throw new RangeError('SimulationClock startTime must be finite');
    }
    if (!Number.isSafeInteger(maxTicksPerAdvance) || maxTicksPerAdvance < 1) {
      throw new RangeError('SimulationClock maxTicksPerAdvance must be a positive safe integer');
    }
    if (catchUpPolicy !== 'skip' && catchUpPolicy !== 'lag') {
      throw new RangeError("SimulationClock catchUpPolicy must be 'skip' or 'lag'");
    }
    if (!Number.isSafeInteger(renderDelayTicks) || renderDelayTicks < 0) {
      throw new RangeError('SimulationClock renderDelayTicks must be a non-negative safe integer');
    }
    this.tickInterval = tickInterval;
    this.renderDelayTicks = renderDelayTicks;
    this.epoch = startTime;
    this.epochErrorBound = UNIT_ROUNDOFF * Math.abs(startTime);
    this.maxTicksPerAdvance = maxTicksPerAdvance;
    this.catchUpPolicy = catchUpPolicy;
    this.rate = validateRate(rate);
  }

  /**
   * Advances the clock by an interval of real time at the current rate.
   * @param realMilliseconds Real time since the last advance, in milliseconds. Finite and not negative.
   * @param out Optional result object to fill.
   * @returns The ticks to step, the skipped ticks and the dropped time.
   * @throws RangeError if `realMilliseconds` is not valid, or if the tick index leaves the safe integer range.
   */
  advance(
    realMilliseconds: number,
    out: SimulationClockAdvance = {ticks: 0, skippedTicks: 0, droppedTime: 0}
  ): SimulationClockAdvance {
    if (!Number.isFinite(realMilliseconds) || realMilliseconds < 0) {
      throw new RangeError(
        'SimulationClock advance needs finite, non-negative real milliseconds; use a negative rate to run backward'
      );
    }
    out.ticks = 0;
    out.skippedTicks = 0;
    out.droppedTime = 0;
    const delta = (realMilliseconds / 1000) * this.rate;
    if (delta === 0) {
      return out;
    }
    // Tick arithmetic stays in integers; only the sub-tick remainder is fractional.
    const total = this.remainder + delta;
    const errorWindow = this.remainderErrorBound + getSplitErrorBound(total, this.tickInterval);
    const passedTicks = this.splitTicks(total, errorWindow);
    let remainder = this.splitRemainder;
    let errorBound = getRemainderErrorBound(remainder, errorWindow);
    let ticks = passedTicks;
    let skippedTicks = 0;
    if (Math.abs(passedTicks) > this.maxTicksPerAdvance) {
      ticks = Math.sign(passedTicks) * this.maxTicksPerAdvance;
      if (this.catchUpPolicy === 'skip') {
        skippedTicks = passedTicks - ticks;
      } else {
        // Lag: stop exactly `ticks` ticks later and keep the old fraction of a tick.
        out.droppedTime = delta - ticks * this.tickInterval;
        remainder = this.remainder;
        errorBound = this.remainderErrorBound;
      }
    }
    const tickIndex = this.tickIndex + ticks + skippedTicks;
    if (!Number.isSafeInteger(tickIndex)) {
      throw new RangeError('SimulationClock tick index left the safe integer range');
    }
    this.tickIndex = tickIndex;
    this.remainder = remainder;
    this.remainderErrorBound = errorBound;
    out.ticks = ticks;
    out.skippedTicks = skippedTicks;
    return out;
  }

  /**
   * Simulated time at tick 0, in seconds.
   * @returns The start time. {@link SimulationClock.rebase} moves it forward.
   */
  get startTime(): number {
    return this.epoch;
  }

  /**
   * Returns the current simulated time.
   * @returns `startTime + getElapsedTime()`, in seconds.
   */
  getTime(): number {
    return this.epoch + this.getElapsedTime();
  }

  /**
   * Returns the simulated time since `startTime`. Use it to keep precision when `startTime` is large.
   * @returns Elapsed simulated seconds.
   */
  getElapsedTime(): number {
    return this.tickIndex * this.tickInterval + this.remainder;
  }

  /**
   * Returns the index of the last tick at or before the current time.
   * @returns An integer tick index. It is negative before `startTime`.
   */
  getTickIndex(): number {
    return this.tickIndex;
  }

  /**
   * Returns the index of the tick at or before the render time.
   * @returns `getTickIndex() - renderDelayTicks`.
   */
  getRenderTickIndex(): number {
    return this.tickIndex - this.renderDelayTicks;
  }

  /**
   * Returns the render time: the simulated time `renderDelayTicks` ticks in the past.
   * The render tick has the same `alpha` and the same seconds into the tick as the current tick.
   * @returns `getTime() - renderDelayTicks * tickInterval`, in seconds.
   */
  getRenderTime(): number {
    return this.epoch + (this.getRenderTickIndex() * this.tickInterval + this.remainder);
  }

  /**
   * Returns the simulated seconds after the start of the current tick. This value is in
   * seconds; {@link SimulationClock.getTickAlpha} is the same position as a fraction.
   * @returns Seconds in [0, `tickInterval`).
   */
  getSecondsIntoTick(): number {
    return this.remainder;
  }

  /**
   * Returns the fraction of the tick interval after tick `getTickIndex()`. This value has no
   * unit; {@link SimulationClock.getSecondsIntoTick} is the same position in seconds.
   * The remainder is less than `tickInterval`, and IEEE 754 division of a smaller positive
   * number by a larger one is less than 1, so no clamp is necessary.
   * @returns `alpha` in [0, 1).
   */
  getTickAlpha(): number {
    return this.remainder / this.tickInterval;
  }

  /**
   * Returns the simulated time of a tick.
   * @param tickIndex Integer tick index.
   * @returns `startTime + tickIndex * tickInterval`, in seconds.
   */
  getTickTime(tickIndex: number): number {
    return this.epoch + tickIndex * this.tickInterval;
  }

  /**
   * Returns the rate.
   * @returns Simulated seconds for each real second.
   */
  getRate(): number {
    return this.rate;
  }

  /**
   * Sets the rate. The simulated time does not change; only later advances use the new rate.
   * @param rate Simulated seconds for each real second. Finite. Use 0 to pause and a negative value to run backward.
   * @throws RangeError if `rate` is not finite.
   */
  setRate(rate: number): void {
    this.rate = validateRate(rate);
  }

  /**
   * Moves the clock to a simulated time. The caller must set its state at the new tick.
   * The bound on the error of the remainder is `7u(|time - startTime| + tickInterval)`, plus
   * `u|time|` for the rounding of the input, plus the bound on the error of `startTime`.
   * @param time Simulated time, in seconds. Finite.
   * @throws RangeError if `time` is not finite, or if its tick index is not a safe integer.
   */
  seek(time: number): void {
    if (!Number.isFinite(time)) {
      throw new RangeError('SimulationClock seek time must be finite');
    }
    const elapsed = time - this.epoch;
    // The split bound counts the subtraction. The rounding of `time` and the error of `epoch`
    // can be much larger than `u|elapsed|` when `time` and `epoch` are large and close.
    const errorWindow =
      getSplitErrorBound(elapsed, this.tickInterval) +
      UNIT_ROUNDOFF * Math.abs(time) +
      this.epochErrorBound;
    // Check the index after the carry and the snap of the split, before any state changes.
    const tickIndex = this.splitTicks(elapsed, errorWindow);
    if (!Number.isSafeInteger(tickIndex)) {
      throw new RangeError('SimulationClock seek time is outside the safe tick range');
    }
    this.tickIndex = tickIndex;
    this.remainder = this.splitRemainder;
    this.remainderErrorBound = getRemainderErrorBound(this.remainder, errorWindow);
  }

  /**
   * Splits a time after the start of the current tick into whole ticks and a remainder in
   * [0, `tickInterval`), with the tick boundary policy:
   * - The rounded quotient can be one tick off, for example `1.7 - 17 * 0.1 < 0`. The split
   *   moves the remainder back into [0, `tickInterval`).
   * - A remainder that is within the snap window below `tickInterval` is on the next tick
   *   boundary: the split counts that tick and sets the remainder to 0. For example, with a
   *   0.1 s tick, `0.3 / 0.1` is `2.9999999999999996`, and 300 ms count as 3 ticks.
   * - The snap window is `errorBound`, but at most `tickInterval / 2`. A remainder of 0 is then
   *   always outside the window, so a time exactly on a tick stays on that tick at any
   *   magnitude, and a snap never moves the time by more than half a tick.
   * @param time Seconds after the start of the current tick.
   * @param errorBound Bound on the rounding error of `time`, in seconds.
   * @returns The tick count. The remainder is in `splitRemainder`.
   */
  private splitTicks(time: number, errorBound: number): number {
    let ticks = Math.floor(time / this.tickInterval);
    let remainder = time - ticks * this.tickInterval;
    if (remainder < 0) {
      ticks -= 1;
      remainder += this.tickInterval;
    } else if (remainder >= this.tickInterval) {
      ticks += 1;
      remainder -= this.tickInterval;
    }
    const snapWindow = Math.min(errorBound, this.tickInterval / 2);
    if (this.tickInterval - remainder <= snapWindow) {
      ticks += 1;
      remainder = 0;
    }
    this.splitRemainder = remainder;
    return ticks;
  }

  /**
   * Moves the epoch forward to the current tick, so that the tick index becomes 0.
   * `getTime()` does not change, except for the rounding of one addition to `startTime`.
   * Use it in long runs, so that tick indices and `getElapsedTime()` stay small. Tick indices
   * that the caller stores must then decrease by the returned count.
   * @returns The number of ticks that the epoch moved. It is negative when the clock is before `startTime`.
   */
  rebase(): number {
    const tickCount = this.tickIndex;
    if (tickCount === 0) {
      return 0;
    }
    const moved = tickCount * this.tickInterval;
    // 3 terms of at most u(|epoch| + |moved|): the product, the sum, and the difference between
    // `tickInterval` and the nominal tick interval. The factor 4 covers the terms in u^2.
    this.epochErrorBound += 4 * UNIT_ROUNDOFF * (Math.abs(this.epoch) + Math.abs(moved));
    this.epoch += moved;
    this.tickIndex = 0;
    return tickCount;
  }

  /**
   * Evaluates a model at the render time. Use it in place of {@link SimulationClock.interpolate}
   * when the state between two ticks has an exact solution, for example a closed-form orbit.
   * @param evaluator Function of the render tick index and the seconds into that tick.
   * @returns The value that `evaluator` returns.
   */
  evaluate<StateT>(evaluator: TickStateEvaluator<StateT>): StateT {
    return evaluator(this.getRenderTickIndex(), this.remainder);
  }

  /**
   * Interpolates between the states at the render tick and the tick after it at the current
   * `alpha`. A straight-line blend cuts the corners of curved motion; when the motion has an
   * exact solution, use {@link SimulationClock.evaluate}.
   * @param previous State at tick `getRenderTickIndex()`.
   * @param next State at tick `getRenderTickIndex() + 1`.
   * @param interpolator Function that blends two states, for example {@link interpolateTickState} or a quaternion slerp.
   * @returns The value that `interpolator` returns.
   */
  interpolate<StateT>(
    previous: StateT,
    next: StateT,
    interpolator: TickStateInterpolator<NoInfer<StateT>>
  ): StateT {
    return interpolator(previous, next, this.getTickAlpha());
  }
}

/**
 * Linearly interpolates between the states at two adjacent ticks.
 * @param previous State at the earlier tick.
 * @param next State at the later tick.
 * @param alpha Fraction of the tick interval after `previous`. Finite.
 * @returns `previous + alpha * (next - previous)`.
 * @throws RangeError if `alpha` is not finite.
 */
export function interpolateTickState(previous: number, next: number, alpha: number): number;
/**
 * Linearly interpolates each component of two vector states at adjacent ticks.
 * @param previous State at the earlier tick.
 * @param next State at the later tick, with the same length as `previous`.
 * @param alpha Fraction of the tick interval after `previous`. Finite.
 * @param out Optional output with at least the length of `previous`. It can be `previous` or `next`.
 * @returns `out`, or a new number array.
 * @throws RangeError if `alpha` is not finite or if a length does not match.
 */
export function interpolateTickState<OutT extends NumericArray = number[]>(
  previous: Readonly<NumericArray>,
  next: Readonly<NumericArray>,
  alpha: number,
  out?: OutT
): OutT;
/**
 * Implementation of the {@link interpolateTickState} overloads.
 * @param previous State at the earlier tick.
 * @param next State at the later tick.
 * @param alpha Fraction of the tick interval after `previous`.
 * @param out Optional vector output.
 * @returns The interpolated number or vector.
 */
export function interpolateTickState(
  previous: number | Readonly<NumericArray>,
  next: number | Readonly<NumericArray>,
  alpha: number,
  out?: NumericArray
): number | NumericArray {
  if (!Number.isFinite(alpha)) {
    throw new RangeError('interpolateTickState alpha must be finite');
  }
  if (typeof previous === 'number' && typeof next === 'number') {
    return previous + alpha * (next - previous);
  }
  if (typeof previous === 'number' || typeof next === 'number' || previous.length !== next.length) {
    throw new RangeError(
      'interpolateTickState states must both be numbers or have the same length'
    );
  }
  const result = out ?? new Array<number>(previous.length);
  if (result.length < previous.length) {
    throw new RangeError('interpolateTickState output is shorter than the state');
  }
  for (let i = 0; i < previous.length; i++) {
    result[i] = previous[i] + alpha * (next[i] - previous[i]);
  }
  return result;
}

/**
 * Checks a rate.
 * @param rate Simulated seconds for each real second.
 * @returns `rate`.
 * @throws RangeError if `rate` is not finite.
 */
function validateRate(rate: number): number {
  if (!Number.isFinite(rate)) {
    throw new RangeError('SimulationClock rate must be finite');
  }
  return rate;
}
