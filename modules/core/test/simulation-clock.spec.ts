// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {SimulationClock, interpolateTickState, quat} from '@math.gl/core/matrix';
import type {SimulationClockAdvance} from '@math.gl/core/matrix';

const YEAR = 365.25 * 86400;

/**
 * Returns a deterministic pseudo-random generator.
 * @param seed Initial state.
 * @returns A function that returns numbers in [0, 1).
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

it('SimulationClock rejects invalid options and input with RangeError', () => {
  for (const tickInterval of [0, -1, NaN, Infinity]) {
    expect(() => new SimulationClock({tickInterval})).toThrow(RangeError);
  }
  for (const rate of [NaN, Infinity, -Infinity]) {
    expect(() => new SimulationClock({tickInterval: 1, rate})).toThrow(RangeError);
    expect(() => new SimulationClock({tickInterval: 1}).setRate(rate)).toThrow(RangeError);
  }
  for (const maxTicksPerAdvance of [0, -1, 1.5, NaN, 2 ** 53]) {
    expect(() => new SimulationClock({tickInterval: 1, maxTicksPerAdvance})).toThrow(RangeError);
  }
  expect(() => new SimulationClock({tickInterval: 1, startTime: NaN})).toThrow(RangeError);
  expect(
    () => new SimulationClock({tickInterval: 1, catchUpPolicy: 'drop' as unknown as 'skip'})
  ).toThrow(RangeError);

  const clock = new SimulationClock({tickInterval: 1});
  for (const milliseconds of [-1, NaN, Infinity]) {
    expect(() => clock.advance(milliseconds)).toThrow(RangeError);
  }
  expect(() => clock.seek(NaN)).toThrow(RangeError);
  expect(() => clock.seek(1e300)).toThrow(RangeError);
  expect(clock.getTime()).toBe(0);

  expect(() => interpolateTickState(0, 1, NaN)).toThrow(RangeError);
  expect(() => interpolateTickState([0, 1], [0], 0.5)).toThrow(RangeError);
  expect(() => interpolateTickState([0, 1], [0, 1], 0.5, [0])).toThrow(RangeError);
});

it('SimulationClock keeps the defaults and reuses the result object', () => {
  const clock = new SimulationClock({tickInterval: 0.5});
  expect(clock.startTime).toBe(0);
  expect(clock.getRate()).toBe(1);
  expect(clock.maxTicksPerAdvance).toBe(1000);
  expect(clock.catchUpPolicy).toBe('skip');

  const out: SimulationClockAdvance = {ticks: 9, skippedTicks: 9, droppedTime: 9};
  expect(clock.advance(1250, out)).toBe(out);
  expect(out).toEqual({ticks: 2, skippedTicks: 0, droppedTime: 0});
  expect(clock.getTime()).toBe(1.25);
  expect(clock.getTickIndex()).toBe(2);
  expect(clock.getTickAlpha()).toBe(0.5);
  expect(clock.advance(0, out)).toEqual({ticks: 0, skippedTicks: 0, droppedTime: 0});
});

it('SimulationClock rate changes keep the simulated time continuous', () => {
  const clock = new SimulationClock({tickInterval: 1 / 60, startTime: 1000});
  clock.advance(700);
  const rates = [86400, -3600, 0.25, YEAR, 1, -YEAR, 60];
  let expected = 1000.7;
  for (const rate of rates) {
    const before = clock.getTime();
    clock.setRate(rate);
    expect(clock.getRate()).toBe(rate);
    expect(clock.getTime()).toBe(before);
    clock.advance(10);
    expected += 0.01 * rate;
    expect(clock.getTime()).toBeCloseTo(expected, 6);
  }
});

it('SimulationClock holds the time while the rate is 0', () => {
  const clock = new SimulationClock({tickInterval: 0.1, rate: 2});
  clock.advance(1234);
  const time = clock.getTime();
  const tickIndex = clock.getTickIndex();
  const alpha = clock.getTickAlpha();
  clock.setRate(0);
  for (let i = 0; i < 1000; i++) {
    expect(clock.advance(16.7)).toEqual({ticks: 0, skippedTicks: 0, droppedTime: 0});
  }
  expect(clock.getTime()).toBe(time);
  expect(clock.getTickIndex()).toBe(tickIndex);
  expect(clock.getTickAlpha()).toBe(alpha);
});

it('SimulationClock runs backward at a negative rate', () => {
  const clock = new SimulationClock({tickInterval: 0.25, rate: -2});
  expect(clock.advance(1000)).toEqual({ticks: -8, skippedTicks: 0, droppedTime: 0});
  expect(clock.getTime()).toBe(-2);
  expect(clock.getTickIndex()).toBe(-8);
  expect(clock.getTickAlpha()).toBe(0);

  expect(clock.advance(100).ticks).toBe(-1);
  expect(clock.getTickIndex()).toBe(-9);
  expect(clock.getTime()).toBeCloseTo(-2.2, 12);
  expect(clock.getTickAlpha()).toBeCloseTo(0.2, 12);

  clock.setRate(2);
  expect(clock.advance(1100).ticks).toBe(9);
  expect(clock.getTime()).toBeCloseTo(0, 12);
});

it('SimulationClock keeps alpha in [0, 1) and counts every tick', () => {
  const random = createRandom(7);
  const tickIntervals = [0.1, 1 / 60, 1 / 3, 60, 1e-3];
  for (const tickInterval of tickIntervals) {
    const clock = new SimulationClock({tickInterval, startTime: 5, maxTicksPerAdvance: 50});
    for (let i = 0; i < 2000; i++) {
      if (i % 97 === 0) clock.setRate((random() - 0.5) * 2 * 10 ** Math.floor(random() * 6));
      const tickIndex = clock.getTickIndex();
      const result = clock.advance(random() * 40);
      expect(clock.getTickIndex() - tickIndex).toBe(result.ticks + result.skippedTicks);
      expect(Math.abs(result.ticks)).toBeLessThanOrEqual(50);
      const alpha = clock.getTickAlpha();
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThan(1);
      const reconstructed = clock.getTickTime(clock.getTickIndex()) + alpha * tickInterval;
      expect(Math.abs(reconstructed - clock.getTime())).toBeLessThan(
        1e-9 * (1 + Math.abs(clock.getTime()))
      );
    }
  }

  // In floating point, 1.7 - 17 * 0.1 is negative and 128.076 - 128075 * 0.001 is larger than 0.001.
  const clock = new SimulationClock({tickInterval: 0.1});
  for (const time of [1.7, 0.3, 0.7, -0.3, -1.7, 1 - Number.EPSILON]) {
    clock.seek(time);
    expect(clock.getTickAlpha()).toBeGreaterThanOrEqual(0);
    expect(clock.getTickAlpha()).toBeLessThan(1);
    expect(clock.getTime()).toBeCloseTo(time, 14);
  }
  // 1.7 is on the boundary of tick 17 within the rounding bound, so the clock is on tick 17.
  clock.seek(1.7);
  expect(clock.getTickIndex()).toBe(17);
  expect(clock.getTickAlpha()).toBe(0);
  const fine = new SimulationClock({tickInterval: 0.001});
  fine.seek(128.076);
  expect(fine.getTickIndex()).toBe(128076);
  expect(fine.getTickAlpha()).toBeLessThan(1e-6);

  // The same rounding in an advance moves the tick index, and the result counts the move.
  const advanced = new SimulationClock({tickInterval: 0.1});
  expect(advanced.advance(1700)).toEqual({ticks: 17, skippedTicks: 0, droppedTime: 0});
  expect(advanced.getTickAlpha()).toBe(0);
  const advancedFine = new SimulationClock({tickInterval: 0.001, maxTicksPerAdvance: 1e6});
  expect(advancedFine.advance(128076)).toEqual({ticks: 128076, skippedTicks: 0, droppedTime: 0});
  const capped = new SimulationClock({tickInterval: 0.001, maxTicksPerAdvance: 1000});
  expect(capped.advance(128076)).toEqual({ticks: 1000, skippedTicks: 127076, droppedTime: 0});
  const stepped = new SimulationClock({tickInterval: 0.1});
  for (let i = 0; i < 1000; i++) {
    stepped.advance(100);
    expect(stepped.getTickIndex()).toBe(i + 1);
    expect(stepped.getTickAlpha()).toBeLessThan(1e-9);
  }
});

it('SimulationClock caps the ticks for each advance at extreme rates', () => {
  const tickInterval = 1 / 60;
  const frame = 1000 / 60;
  const dueTicks = Math.floor(((frame / 1000) * YEAR) / tickInterval);

  const skip = new SimulationClock({tickInterval, rate: YEAR, maxTicksPerAdvance: 100});
  const skipResult = skip.advance(frame);
  expect(skipResult.ticks).toBe(100);
  expect(skipResult.ticks + skipResult.skippedTicks).toBe(dueTicks);
  expect(skipResult.droppedTime).toBe(0);
  expect(skip.getTime()).toBeCloseTo(YEAR / 60, 6);

  const lag = new SimulationClock({
    tickInterval,
    rate: YEAR,
    maxTicksPerAdvance: 100,
    catchUpPolicy: 'lag'
  });
  lag.advance(4); // A fraction of a tick that lag keeps.
  const alpha = lag.getTickAlpha();
  const tickIndex = lag.getTickIndex();
  const lagResult = lag.advance(frame);
  expect(lagResult).toMatchObject({ticks: 100, skippedTicks: 0});
  expect(lag.getTickIndex()).toBe(tickIndex + 100);
  expect(lag.getTickAlpha()).toBe(alpha);
  expect(lagResult.droppedTime).toBeCloseTo((frame / 1000) * YEAR - 100 * tickInterval, 3);

  const backward = new SimulationClock({tickInterval, rate: -YEAR, maxTicksPerAdvance: 100});
  const backwardResult = backward.advance(frame);
  expect(backwardResult.ticks).toBe(-100);
  expect(backwardResult.skippedTicks).toBeLessThan(0);
  expect(backward.getTime()).toBeCloseTo(-YEAR / 60, 6);

  const backwardLag = new SimulationClock({
    tickInterval,
    rate: -YEAR,
    maxTicksPerAdvance: 100,
    catchUpPolicy: 'lag'
  });
  const backwardLagResult = backwardLag.advance(frame);
  expect(backwardLagResult.ticks).toBe(-100);
  expect(backwardLagResult.droppedTime).toBeLessThan(0);
  expect(backwardLag.getTickIndex()).toBe(-100);

  // At the cap and one tick under it, every tick runs.
  const exact = new SimulationClock({tickInterval: 1, maxTicksPerAdvance: 5, catchUpPolicy: 'lag'});
  expect(exact.advance(5000)).toEqual({ticks: 5, skippedTicks: 0, droppedTime: 0});
  expect(exact.advance(4000)).toEqual({ticks: 4, skippedTicks: 0, droppedTime: 0});
  expect(exact.advance(6000)).toEqual({ticks: 5, skippedTicks: 0, droppedTime: 1});
  expect(exact.getTime()).toBe(14);
  // At the cap, lag keeps the new fraction of a tick and drops nothing.
  expect(exact.advance(5500)).toEqual({ticks: 5, skippedTicks: 0, droppedTime: 0});
  expect(exact.getTime()).toBe(19.5);

  // A year per second for a simulated minute of frames reports at most 100 ticks each.
  const fast = new SimulationClock({tickInterval, rate: YEAR, maxTicksPerAdvance: 100});
  let stepped = 0;
  for (let i = 0; i < 3600; i++) stepped += fast.advance(frame).ticks;
  expect(stepped).toBe(360000);
  expect(fast.getTime()).toBeCloseTo(60 * YEAR, 0);
});

it('SimulationClock stays on the tick grid over 1e7 advances', () => {
  const tickInterval = 1 / 60;
  const frame = 1000 / 60;
  const count = 1e7;
  const clock = new SimulationClock({tickInterval, startTime: 1.7e9});
  let naive = 0;
  for (let i = 0; i < count; i++) {
    clock.advance(frame);
    naive += (frame / 1000) * 1;
  }
  const expected = count / 60;
  const ticks = clock.getTickIndex() + clock.getTickAlpha();
  // The tick counter is exact: the clock is within a fraction of an ulp of tick `count`.
  expect(Math.abs(ticks - count)).toBeLessThan(1e-6);
  expect(Math.abs(clock.getElapsedTime() - expected)).toBeLessThan(1e-9);
  // A plain running sum of the same steps drifts by about 2e-5 s, so the case does stress the precision.
  expect(Math.abs(naive - expected)).toBeGreaterThan(1e-7);
});

it('SimulationClock seeks to a time and reports tick times', () => {
  const clock = new SimulationClock({tickInterval: 0.5, startTime: 100});
  clock.seek(101.75);
  expect(clock.getTickIndex()).toBe(3);
  expect(clock.getTickAlpha()).toBe(0.5);
  expect(clock.getTime()).toBe(101.75);
  expect(clock.getElapsedTime()).toBe(1.75);
  expect(clock.getTickTime(3)).toBe(101.5);
  clock.seek(99.75);
  expect(clock.getTickIndex()).toBe(-1);
  expect(clock.getTickAlpha()).toBe(0.5);
  expect(clock.getTime()).toBe(99.75);
});

it('interpolateTickState blends numbers and vectors, and the clock accepts other interpolators', () => {
  expect(interpolateTickState(2, 4, 0.25)).toBe(2.5);
  expect(interpolateTickState([0, 10, -2], [4, 20, 2], 0.5)).toEqual([2, 15, 0]);
  const previous = new Float64Array([1, 2]);
  expect(interpolateTickState(previous, [3, 6], 0.5, previous)).toBe(previous);
  expect(Array.from(previous)).toEqual([2, 4]);

  const clock = new SimulationClock({tickInterval: 0.2});
  clock.advance(250);
  expect(clock.interpolate<number>(10, 20, interpolateTickState)).toBeCloseTo(12.5, 12);
  const blended = clock.interpolate([0, 0], [8, -8], interpolateTickState);
  expect(blended[0]).toBeCloseTo(2, 12);
  expect(blended[1]).toBeCloseTo(-2, 12);

  const identity = [0, 0, 0, 1];
  const halfTurn = [0, 0, 1, 0];
  const rotation = clock.interpolate(identity, halfTurn, (a, b, alpha) =>
    Array.from(quat.slerp([0, 0, 0, 0], a, b, alpha))
  );
  // A quarter of a 180 degree turn about z is 45 degrees.
  expect(rotation[2]).toBeCloseTo(Math.sin(Math.PI / 8), 12);
  expect(rotation[3]).toBeCloseTo(Math.cos(Math.PI / 8), 12);
});

it('SimulationClock renders a fixed number of ticks behind the simulated time', () => {
  for (const renderDelayTicks of [-1, 1.5, NaN, Infinity]) {
    expect(() => new SimulationClock({tickInterval: 1, renderDelayTicks})).toThrow(RangeError);
  }
  const current = new SimulationClock({tickInterval: 0.5});
  current.advance(1750);
  expect(current.renderDelayTicks).toBe(0);
  expect(current.getRenderTickIndex()).toBe(current.getTickIndex());
  expect(current.getRenderTime()).toBe(current.getTime());

  const delayed = new SimulationClock({tickInterval: 0.5, startTime: 10, renderDelayTicks: 2});
  delayed.advance(1750);
  expect(delayed.getTickIndex()).toBe(3);
  expect(delayed.getRenderTickIndex()).toBe(1);
  expect(delayed.getTime()).toBe(11.75);
  expect(delayed.getRenderTime()).toBe(10.75);
  expect(delayed.getTickAlpha()).toBe(0.5);

  const calls: number[][] = [];
  delayed.interpolate(0, 1, (previous, next, alpha) => {
    calls.push([alpha]);
    return previous + alpha * (next - previous);
  });
  delayed.evaluate((tickIndex, secondsIntoTick) => calls.push([tickIndex, secondsIntoTick]));
  expect(calls).toEqual([[0.5], [1, 0.25]]);
});

it('SimulationClock keeps alpha and the seconds into a tick apart', () => {
  // With a tick that is not 1 s, alpha and seconds differ, so a mix-up shows.
  const clock = new SimulationClock({tickInterval: 0.5});
  clock.advance(1100);
  expect(clock.getTickIndex()).toBe(2);
  expect(clock.getSecondsIntoTick()).toBeCloseTo(0.1, 14);
  expect(clock.getTickAlpha()).toBeCloseTo(0.2, 14);
  expect(clock.evaluate((_tickIndex, secondsIntoTick) => secondsIntoTick)).toBe(
    clock.getSecondsIntoTick()
  );
  expect(clock.interpolate(0, 1, (_previous, _next, alpha) => alpha)).toBe(clock.getTickAlpha());
  expect(clock.getTickTime(clock.getTickIndex()) + clock.getSecondsIntoTick()).toBeCloseTo(
    clock.getTime(),
    14
  );
});

it('SimulationClock evaluates the exact motion between ticks, where a blend cuts the corner', () => {
  // A unit circle, one turn in 8 ticks.
  const tickInterval = 1;
  const angularRate = (2 * Math.PI) / 8;
  const positionAt = (time: number) => [Math.cos(angularRate * time), Math.sin(angularRate * time)];
  const clock = new SimulationClock({tickInterval, renderDelayTicks: 1});
  clock.advance(3500);
  const renderTick = clock.getRenderTickIndex();
  expect(renderTick).toBe(2);

  const exact = clock.evaluate((tickIndex, secondsIntoTick) =>
    positionAt(tickIndex * tickInterval + secondsIntoTick)
  );
  const expected = positionAt(clock.getRenderTime());
  expect(exact[0]).toBeCloseTo(expected[0], 14);
  expect(exact[1]).toBeCloseTo(expected[1], 14);
  expect(Math.hypot(exact[0], exact[1])).toBeCloseTo(1, 14);

  const blended = clock.interpolate(
    positionAt(renderTick),
    positionAt(renderTick + 1),
    interpolateTickState
  );
  // The chord at mid-tick is inside the circle by 1 - cos(pi / 8).
  expect(1 - Math.hypot(blended[0], blended[1])).toBeCloseTo(1 - Math.cos(Math.PI / 8), 12);
});

it('SimulationClock rebase moves the epoch and keeps the time', () => {
  const tickInterval = 1 / 60;
  const clock = new SimulationClock({tickInterval, startTime: 100, rate: 3600});
  const twin = new SimulationClock({tickInterval, startTime: 100, rate: 3600});
  clock.advance(1234);
  twin.advance(1234);
  const time = clock.getTime();
  const alpha = clock.getTickAlpha();
  const tickIndex = clock.getTickIndex();
  expect(tickIndex).toBeGreaterThan(1000);

  expect(clock.rebase()).toBe(tickIndex);
  expect(clock.getTickIndex()).toBe(0);
  expect(clock.startTime).toBe(100 + tickIndex * tickInterval);
  expect(clock.getTickAlpha()).toBe(alpha);
  expect(clock.getTime()).toBeCloseTo(time, 9);
  expect(clock.getElapsedTime()).toBeLessThan(tickInterval);

  for (let i = 0; i < 100; i++) {
    clock.advance(16.7);
    twin.advance(16.7);
    expect(clock.getTickIndex() + tickIndex).toBe(twin.getTickIndex());
    expect(clock.getTime()).toBeCloseTo(twin.getTime(), 9);
  }

  const before = new SimulationClock({tickInterval: 0.5});
  before.seek(-2.25);
  expect(before.rebase()).toBe(-5);
  expect(before.startTime).toBe(-2.5);
  expect(before.getTime()).toBe(-2.25);
  expect(before.rebase()).toBe(0);
});

it.each([
  ['paused', 0],
  ['between ticks', 1]
])('SimulationClock keeps the seek snap window after repeated rebases while %s', (_state, rate) => {
  const startTime = 2 ** 40;
  const clock = new SimulationClock({tickInterval: 1, startTime, rate});
  const epochErrorBound = clock['epochErrorBound'];

  // At this epoch, 1024 additions of 4u|epoch| inflate the snap window to half a tick.
  for (let frame = 0; frame < 1024; frame++) {
    clock.advance(0.5);
    expect(clock.rebase()).toBe(0);
  }
  expect(clock.startTime).toBe(startTime);
  expect.soft(clock['epochErrorBound']).toBe(epochErrorBound);

  clock.seek(startTime + 1.5);
  expect(clock.getTickIndex()).toBe(1);
  expect(clock.getTickAlpha()).toBe(0.5);
});

/**
 * Advances a clock through a list of real-time pieces and sums the reported ticks.
 * @param clock Clock to advance.
 * @param pieces Real milliseconds for each advance.
 * @returns The sum of `ticks + skippedTicks` over all advances.
 */
function advanceAll(clock: SimulationClock, pieces: number[]): number {
  let total = 0;
  for (const milliseconds of pieces) {
    const result = clock.advance(milliseconds);
    total += result.ticks + result.skippedTicks;
  }
  return total;
}

it('SimulationClock counts the same ticks for 1 x 300 ms and 3 x 100 ms', () => {
  // Review regression: 0.3 / 0.1 is 2.9999999999999996 in float64.
  const whole = new SimulationClock({tickInterval: 0.1});
  const parts = new SimulationClock({tickInterval: 0.1});
  expect(advanceAll(whole, [300])).toBe(3);
  expect(advanceAll(parts, [100, 100, 100])).toBe(3);
  for (const clock of [whole, parts]) {
    expect(clock.getTickIndex()).toBe(3);
    expect(clock.getTickAlpha()).toBe(0);
    expect(clock.getSecondsIntoTick()).toBe(0);
  }
});

it('SimulationClock keeps a time that is clearly before a tick boundary on the earlier tick', () => {
  // 299.999 ms is 1e-6 s before tick 3: much more than the rounding bound.
  const control = new SimulationClock({tickInterval: 0.1});
  expect(advanceAll(control, [299.999])).toBe(2);
  expect(control.getTickIndex()).toBe(2);
  expect(control.getSecondsIntoTick()).toBeCloseTo(0.099999, 12);
  expect(control.getTickAlpha()).toBeCloseTo(0.99999, 10);

  // 1e-15 s before tick 3 is about 3 times the bound 7u(0.3 + 0.1) = 3.1e-16 s, so it stays
  // on tick 2. A tolerance 10 times larger would move it to tick 3.
  const near = new SimulationClock({tickInterval: 0.1});
  expect(advanceAll(near, [299.999999999999])).toBe(2);
  expect(near.getTickIndex()).toBe(2);
  const seekNear = new SimulationClock({tickInterval: 0.1});
  seekNear.seek(0.3 - 1e-15);
  expect(seekNear.getTickIndex()).toBe(2);
  seekNear.seek(0.3);
  expect(seekNear.getTickIndex()).toBe(3);
  expect(seekNear.getTickAlpha()).toBe(0);
  seekNear.seek(-0.3);
  expect(seekNear.getTickIndex()).toBe(-3);
  expect(seekNear.getTickAlpha()).toBeLessThan(1e-14);
});

it('SimulationClock seeks exactly to a tick at a large time', () => {
  // Review regression: the bound 7u(2e15 + 1) is 1.55 s, more than the 1 s tick, and the
  // snap moved the exact tick 2e15 to 2e15 + 1.
  const clock = new SimulationClock({tickInterval: 1});
  clock.seek(2e15);
  expect(clock.getTickIndex()).toBe(2e15);
  expect(clock.getSecondsIntoTick()).toBe(0);
  expect(clock.getTickAlpha()).toBe(0);

  // The largest safe tick index is in the safe range, so the seek lands on it exactly.
  const limit = new SimulationClock({tickInterval: 1});
  limit.seek(Number.MAX_SAFE_INTEGER);
  expect(limit.getTickIndex()).toBe(Number.MAX_SAFE_INTEGER);
  expect(Number.isSafeInteger(limit.getTickIndex())).toBe(true);
  expect(limit.getSecondsIntoTick()).toBe(0);

  // One tick more is outside the safe range: the seek throws and the clock does not change.
  const before = {
    tickIndex: limit.getTickIndex(),
    seconds: limit.getSecondsIntoTick(),
    time: limit.getTime()
  };
  expect(() => limit.seek(2 ** 53)).toThrow(
    new RangeError('SimulationClock seek time is outside the safe tick range')
  );
  expect(limit.getTickIndex()).toBe(before.tickIndex);
  expect(limit.getSecondsIntoTick()).toBe(before.seconds);
  expect(limit.getTime()).toBe(before.time);
  // An advance past the limit also throws without a change.
  expect(() => limit.advance(1000)).toThrow(RangeError);
  expect(limit.getTickIndex()).toBe(before.tickIndex);
  expect(limit.getSecondsIntoTick()).toBe(before.seconds);
});

it('SimulationClock seeks to integer multiples of the tick at all safe magnitudes', () => {
  const u = Number.EPSILON / 2;
  for (const tickInterval of [1, 1 / 60, 0.001, 7]) {
    const clock = new SimulationClock({tickInterval});
    // Tick indices from 1 to the limit. For an integer tick, the limit is the safe integer
    // range of the time, where `tickIndex * tickInterval` is exact. Otherwise it is 2^50: a
    // tick then spans at least 4 ULPs of the time, because ULP(t) <= 2u * t <= tickInterval / 4.
    const lastTick = Number.isInteger(tickInterval)
      ? Math.floor(Number.MAX_SAFE_INTEGER / tickInterval)
      : 2 ** 50;
    const tickIndices = [lastTick, lastTick - 1];
    for (let exponent = 0; exponent <= 16; exponent++) {
      for (const mantissa of [1, 3, 7, 9]) {
        const tickIndex = mantissa * 10 ** exponent;
        if (tickIndex <= lastTick) tickIndices.push(tickIndex);
      }
    }
    for (const tickIndex of tickIndices) {
      const boundary = tickIndex * tickInterval;
      clock.seek(boundary);
      expect(clock.getTickIndex(), `${tickInterval} x ${tickIndex}`).toBe(tickIndex);
      expect(clock.getSecondsIntoTick(), `${tickInterval} x ${tickIndex}`).toBe(0);

      // The snap window is the seek bound, at most half a tick. A time 1.5 windows below the
      // boundary is outside the window, so it stays on the tick before.
      const snapWindow = Math.min(7 * u * (boundary + tickInterval), tickInterval / 2);
      clock.seek(boundary - 1.5 * snapWindow);
      expect(clock.getTickIndex(), `${tickInterval} x ${tickIndex} - 1.5w`).toBe(tickIndex - 1);
    }
  }
});

it('SimulationClock counts the same ticks for every partition of a nominal time', () => {
  // Each piece is an exact number of sub-tick units, with an exact or 1-rounding real time,
  // so the nominal total is exactly `tickCount` ticks.
  const cases = [
    {tickInterval: 0.1, numerator: 100, denominator: 1},
    {tickInterval: 1 / 60, numerator: 1000, denominator: 60},
    {tickInterval: 0.3, numerator: 300, denominator: 1}
  ];
  const rates = [1, 2, 0.5, 4, 8, 0.25];
  const random = createRandom(11);
  const unitsPerTick = 12;
  for (const {tickInterval, numerator, denominator} of cases) {
    for (let trial = 0; trial < 300; trial++) {
      const tickCount = 1 + Math.floor(random() * 40);
      const pieceCount = 1 + Math.floor(random() * 30);
      const units: number[] = [];
      let sum = 0;
      for (let i = 0; i < pieceCount - 1; i++) {
        let unit = Math.floor(random() * 50) - 15;
        if (unit === 0) unit = 1;
        units.push(unit);
        sum += unit;
      }
      const last = tickCount * unitsPerTick - sum;
      if (last !== 0) units.push(last);

      const clock = new SimulationClock({tickInterval, maxTicksPerAdvance: 1e6});
      let ticks = 0;
      for (const unit of units) {
        const rate = Math.sign(unit) * rates[Math.floor(random() * rates.length)];
        clock.setRate(rate);
        // Real milliseconds for `unit` sub-tick units at `rate`: one rounded division.
        const milliseconds =
          (Math.abs(unit) * numerator) / (unitsPerTick * denominator * Math.abs(rate));
        const result = clock.advance(milliseconds);
        ticks += result.ticks + result.skippedTicks;
      }
      expect(ticks).toBe(tickCount);
      expect(clock.getTickIndex()).toBe(tickCount);
      expect(clock.getTickAlpha()).toBeLessThan(1e-12);
      expect(clock.getSecondsIntoTick()).toBeLessThan(1e-12 * tickInterval);

      const whole = new SimulationClock({tickInterval, maxTicksPerAdvance: 1e6});
      expect(advanceAll(whole, [(tickCount * numerator) / denominator])).toBe(tickCount);
      expect(whole.getTickIndex()).toBe(tickCount);
      expect(Math.abs(whole.getTickAlpha() - clock.getTickAlpha())).toBeLessThan(1e-12);
    }
  }
});

it('SimulationClock applies the boundary policy backward and after a seek', () => {
  // Backward: 0.01 s - 2.41 s is nominally tick -24. The split gives -25 and a remainder
  // 3.6e-16 s below 0.1 s, inside the bound 7u(2.4 + 0.1) + 7u(0.01 + 0.1).
  const backward = new SimulationClock({tickInterval: 0.1});
  backward.seek(0.01);
  backward.setRate(-1);
  expect(backward.advance(2410)).toEqual({ticks: -24, skippedTicks: 0, droppedTime: 0});
  expect(backward.getTickIndex()).toBe(-24);
  expect(backward.getTickAlpha()).toBe(0);

  // After a seek, the remainder carries the rounding error of the seek. 2.05 s + 50 ms is
  // nominally tick 21; the remainder is 1.8e-16 s below 0.1 s, more than the bound of the
  // advance alone but inside the bound that includes the seek.
  const afterSeek = new SimulationClock({tickInterval: 0.1});
  afterSeek.seek(2.05);
  expect(afterSeek.getTickIndex()).toBe(20);
  expect(afterSeek.advance(50)).toEqual({ticks: 1, skippedTicks: 0, droppedTime: 0});
  expect(afterSeek.getTickIndex()).toBe(21);
  expect(afterSeek.getTickAlpha()).toBe(0);
});

/** An exact rational number with a positive denominator. */
type Rational = {numerator: bigint; denominator: bigint};

/**
 * Returns the exact value of an integer or a rational number of seconds.
 * @param numerator Integer numerator.
 * @param denominator Positive integer denominator.
 * @returns The rational number.
 */
function rational(numerator: number | bigint, denominator: number | bigint = 1): Rational {
  return {numerator: BigInt(numerator), denominator: BigInt(denominator)};
}

/**
 * Follows a run of advances in exact rational arithmetic and checks the clock at each advance.
 * The run starts at tick 0 with the rate of the clock.
 * @param clock Clock under test, at time 0.
 * @param tickInterval Exact nominal tick interval, in seconds.
 * @param rate Integer rate of the run.
 * @param milliseconds Integer real milliseconds of each advance.
 * @param tolerance Largest difference between `alpha` and the exact fraction of a tick.
 * @returns The number of advances that ended exactly on a tick boundary.
 */
function checkAgainstExactTicks(
  clock: SimulationClock,
  tickInterval: Rational,
  rate: number,
  milliseconds: number[],
  tolerance: number
): number {
  // The exact time is `sum / 1000` seconds, so its position is `sum * q / (1000 * p)` ticks.
  const scale = 1000n * tickInterval.numerator;
  let sum = 0n;
  let counted = 0;
  let boundaries = 0;
  for (const [i, ms] of milliseconds.entries()) {
    sum += BigInt(ms) * BigInt(rate) * tickInterval.denominator;
    const result = clock.advance(ms);
    counted += result.ticks + result.skippedTicks;
    const tick = Number(sum / scale);
    const fraction = Number(sum % scale) / Number(scale);
    const label = `advance ${i}`;
    expect(clock.getTickIndex(), label).toBe(tick);
    expect(counted, label).toBe(tick);
    // On a boundary, a remainder just below the tick must snap, or the tick index is one low.
    if (fraction === 0) boundaries++;
    expect(Math.abs(clock.getTickAlpha() - fraction), label).toBeLessThan(tolerance);
  }
  return boundaries;
}

it('SimulationClock matches exact tick arithmetic over long runs at 1x and at a year per second', () => {
  const random = createRandom(29);
  const frames = Array.from({length: 5000}, () => 15 + Math.floor(random() * 4));
  // 1x with a 0.1 s tick: the exact time is on a tick boundary when the milliseconds add up to
  // a multiple of 100, so many advances must snap.
  const slow = new SimulationClock({tickInterval: 0.1});
  expect(checkAgainstExactTicks(slow, rational(1, 10), 1, frames, 1e-12)).toBeGreaterThan(30);
  // A year per second with a 7 s tick: each frame passes about 70,000 ticks and ends 1/35 of a
  // tick or more from a boundary, unless it is on the boundary. The remainder of a 5e5 s split
  // has rounding errors of about 1e-10 s, and they add up over the advances between snaps.
  const fast = new SimulationClock({tickInterval: 7, rate: YEAR});
  expect(checkAgainstExactTicks(fast, rational(7), YEAR, frames, 1e-7)).toBeGreaterThan(30);
});

/**
 * Advances a clock at rate 1 to `gap` seconds before the tick boundary after the next one.
 * @param clock Clock under test. Its rate is 1 afterward.
 * @param gap Seconds before the boundary.
 * @returns The ticks that the advance passed.
 */
function advanceToBeforeBoundary(clock: SimulationClock, gap: number): number {
  clock.setRate(1);
  const {tickInterval} = clock;
  const result = clock.advance((2 * tickInterval - clock.getSecondsIntoTick() - gap) * 1000);
  return result.ticks + result.skippedTicks;
}

/**
 * Returns the bound of the split of one advance, as the clock computes it.
 * @param clock Clock before the advance.
 * @param milliseconds Real milliseconds of the advance.
 * @returns `7u(|t| + tickInterval)` for `t = remainder + delta`, in seconds.
 */
function getAdvanceBound(clock: SimulationClock, milliseconds: number): number {
  const total = clock.getSecondsIntoTick() + (milliseconds / 1000) * clock.getRate();
  return 7 * (Number.EPSILON / 2) * (Math.abs(total) + clock.tickInterval);
}

it('SimulationClock clears the bound on a tick boundary over a long run at a year per second', () => {
  // Review regression: the bound only grew, and no snap cleared it. At 4e-10 s for each frame
  // at a year per second, 1e-6 s before a tick moved to the next tick after about 40 s of
  // frames. A 16 ms frame at a year per second is exactly 5049216 ticks of 0.1 s, so each frame
  // ends on a tick boundary, and the bound goes back to 0.
  const tickInterval = 0.1;
  const clock = new SimulationClock({tickInterval, rate: YEAR, maxTicksPerAdvance: 1e7});
  for (let i = 1; i <= 20000; i++) {
    expect(clock.advance(16).ticks).toBe(5049216);
    expect(clock.getSecondsIntoTick()).toBe(0);
    expect(getStoredBound(clock)).toBe(0);
  }
  expect(advanceToBeforeBoundary(clock, 1e-6)).toBe(1);
  expect(clock.getSecondsIntoTick()).toBeGreaterThan(tickInterval - 2e-6);

  // A snap to a remainder of 0 also clears the bound: 35 ms at a year per second is exactly
  // 157788 ticks of 7 s. A gap of 1.5 bounds of that frame is then outside the window.
  const snapped = new SimulationClock({tickInterval: 7, rate: YEAR, maxTicksPerAdvance: 1e6});
  const bound = getAdvanceBound(snapped, 35);
  expect(snapped.advance(35).ticks).toBe(157788);
  expect(snapped.getSecondsIntoTick()).toBe(0);
  expect(getStoredBound(snapped)).toBe(0);
  expect(advanceToBeforeBoundary(snapped, 1.5 * bound)).toBe(1);
  expect(snapped.getSecondsIntoTick()).toBeGreaterThan(0);
});

it('SimulationClock adds the bounds of the advances between tick boundaries', () => {
  // Frames of 16 to 17 ms at a year per second do not end on a tick boundary. The error of the
  // remainder grows with each frame, so the window grows: a gap of 1.5 windows stays before
  // the boundary, and a gap of 1 / 1.5 window is on the boundary.
  const tickInterval = 1 / 60;
  const random = createRandom(5);
  for (const [factor, ticks] of [
    [1.5, 1],
    [1 / 1.5, 2]
  ]) {
    const clock = new SimulationClock({tickInterval, rate: YEAR, maxTicksPerAdvance: 1e8});
    let sum = 0;
    for (let i = 0; i < 2000; i++) {
      const frame = 16 + random();
      sum += getAdvanceBound(clock, frame);
      clock.advance(frame);
    }
    // The bound is the sum of the bounds of the splits, about 8e-7 s after 2000 frames.
    expect(getStoredBound(clock)).toBeCloseTo(sum, 20);
    expect(sum).toBeGreaterThan(5e-7);
    // At rate 1 the probe adds a bound of about 3e-17 s.
    const gap = factor * (getStoredBound(clock) + 1e-16);
    expect(advanceToBeforeBoundary(clock, gap), `${factor} windows`).toBe(ticks);
    if (ticks === 2) expect(clock.getSecondsIntoTick()).toBe(0);
    else expect(clock.getSecondsIntoTick()).toBeGreaterThan(tickInterval - 2 * gap);
  }

  // The lag policy keeps the old remainder, so it keeps the old bound, here 0 at tick 0.
  const lag = new SimulationClock({tickInterval, rate: YEAR, catchUpPolicy: 'lag'});
  const lagBound = getAdvanceBound(lag, 16);
  expect(lag.advance(16).ticks).toBe(1000);
  expect(getStoredBound(lag)).toBe(0);
  expect(advanceToBeforeBoundary(lag, lagBound / 2)).toBe(1);
  expect(lag.getSecondsIntoTick()).toBeGreaterThan(0);
});

it('SimulationClock keeps the bound of a seek until a tick boundary, also after a rebase', () => {
  // The bound of seek(1e9) is 7u(1e9 + 0.1) + u * 1e9 = 8.9e-7 s. It is a real error of the
  // remainder, so the next advance counts it, also after a rebase: a rebase does not change the
  // remainder. The snap to the boundary clears it.
  for (const rebase of [false, true]) {
    const clock = new SimulationClock({tickInterval: 0.1});
    clock.seek(1e9 + 0.05);
    if (rebase) expect(clock.rebase()).toBe(1e10);
    expect(advanceToBeforeBoundary(clock, 1e-7)).toBe(2);
    expect(clock.getSecondsIntoTick()).toBe(0);
    // The advance after the snap has only its own small bound at rate 1.
    expect(advanceToBeforeBoundary(clock, 1e-7)).toBe(1);
    expect(clock.getSecondsIntoTick()).toBeCloseTo(0.1 - 1e-7, 12);
  }
});

/** Greatest common divisor of two non-negative integers. */
function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

/**
 * Returns a reduced rational number.
 * @param numerator Integer numerator.
 * @param denominator Non-zero integer denominator.
 * @returns The reduced rational with a positive denominator.
 */
function reduce(numerator: bigint, denominator: bigint): Rational {
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = gcd(numerator < 0n ? -numerator : numerator, denominator * sign) || 1n;
  return {numerator: (sign * numerator) / divisor, denominator: (sign * denominator) / divisor};
}

/** Returns `a + b`. */
function add(a: Rational, b: Rational): Rational {
  return reduce(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator
  );
}

/** Returns `a * b`. */
function multiply(a: Rational, b: Rational): Rational {
  return reduce(a.numerator * b.numerator, a.denominator * b.denominator);
}

/** Returns `a - b`. */
function subtract(a: Rational, b: Rational): Rational {
  return add(a, multiply(b, rational(-1)));
}

/** Returns `|a|`. */
function absolute(a: Rational): Rational {
  return a.numerator < 0n ? multiply(a, rational(-1)) : a;
}

/** Returns `floor(a / b)` for a positive `b`. */
function floorDivide(a: Rational, b: Rational): bigint {
  const numerator = a.numerator * b.denominator;
  const denominator = a.denominator * b.numerator;
  const quotient = numerator / denominator;
  return numerator < 0n && quotient * denominator !== numerator ? quotient - 1n : quotient;
}

/** Returns true if `a <= b`. */
function isAtMost(a: Rational, b: Rational): boolean {
  return a.numerator * b.denominator <= b.numerator * a.denominator;
}

/**
 * Returns the exact value of a finite float64.
 * @param value Finite number.
 * @returns The rational number that `value` stores.
 */
function exactValue(value: number): Rational {
  let scaled = value;
  let denominator = 1n;
  while (!Number.isInteger(scaled)) {
    scaled *= 2;
    denominator *= 2n;
  }
  return reduce(BigInt(scaled), denominator);
}

/** A nominal real time interval of an advance: the caller passes the rounded `input`. */
type NominalMilliseconds = {input: number; exact: Rational};

/** A nominal simulated time of a seek: the caller passes the rounded `input`. */
type NominalTime = {input: number; exact: Rational};

/**
 * Returns a nominal value and the float64 that a caller passes for it.
 * @param numerator Integer numerator.
 * @param denominator Positive integer denominator.
 * @returns The value as a float64 input and as an exact rational.
 */
function nominal(numerator: number, denominator = 1): NominalMilliseconds & NominalTime {
  return {input: numerator / denominator, exact: rational(numerator, denominator)};
}

/** Returns the stored bound on the rounding error of the remainder of a clock. */
function getStoredBound(clock: SimulationClock): number {
  // The bound is private state. The test reads it to check that it covers the exact error.
  return (clock as unknown as {remainderErrorBound: number}).remainderErrorBound;
}

/**
 * Follows a clock in exact rational arithmetic, with the nominal tick interval and the nominal
 * inputs. After each step it checks that the tick index is the exact tick and that the stored
 * bound covers the exact error of the remainder.
 */
class ExactClockModel {
  /** Exact simulated time after the nominal epoch, in seconds. */
  private elapsed = rational(0);
  /** Exact nominal epoch: the start time plus the ticks that the rebases moved, in seconds. */
  private epoch: Rational;
  /** Smallest distance from a tick boundary of an exact time that is not on a boundary. */
  minimumDistance = Infinity;
  /** Largest stored bound. */
  maximumBound = 0;
  /** Number of steps that ended exactly on a tick boundary. */
  boundaries = 0;

  constructor(
    readonly clock: SimulationClock,
    readonly tickInterval: Rational,
    private rate: number,
    startTime: Rational = rational(0)
  ) {
    this.epoch = startTime;
  }

  advance(milliseconds: NominalMilliseconds, label: string): void {
    const delta = multiply(multiply(milliseconds.exact, rational(1, 1000)), exactValue(this.rate));
    const result = this.clock.advance(milliseconds.input);
    if (this.clock.catchUpPolicy === 'lag' && result.droppedTime !== 0) {
      // Lag: the clock keeps its remainder and moves the reported ticks only.
      this.elapsed = add(this.elapsed, multiply(rational(result.ticks), this.tickInterval));
    } else {
      this.elapsed = add(this.elapsed, delta);
    }
    this.check(label);
  }

  seek(time: NominalTime, label: string): void {
    this.clock.seek(time.input);
    this.elapsed = subtract(time.exact, this.epoch);
    this.check(label);
  }

  setRate(rate: number): void {
    this.rate = rate;
    this.clock.setRate(rate);
  }

  rebase(label: string): void {
    const ticks = this.clock.rebase();
    const moved = multiply(rational(ticks), this.tickInterval);
    this.epoch = add(this.epoch, moved);
    this.elapsed = subtract(this.elapsed, moved);
    this.check(label);
  }

  private check(label: string): void {
    const tick = floorDivide(this.elapsed, this.tickInterval);
    const exactRemainder = subtract(this.elapsed, multiply(rational(tick), this.tickInterval));
    const clockElapsed = add(
      multiply(rational(this.clock.getTickIndex()), this.tickInterval),
      exactValue(this.clock.getSecondsIntoTick())
    );
    const error = absolute(subtract(clockElapsed, this.elapsed));
    const bound = getStoredBound(this.clock);
    this.maximumBound = Math.max(this.maximumBound, bound);
    if (exactRemainder.numerator === 0n) {
      this.boundaries++;
    } else {
      const above = Number(exactRemainder.numerator) / Number(exactRemainder.denominator);
      const interval = Number(this.tickInterval.numerator) / Number(this.tickInterval.denominator);
      this.minimumDistance = Math.min(this.minimumDistance, above, interval - above);
    }
    const errorText = (Number(error.numerator) / Number(error.denominator)).toExponential(3);
    expect(this.clock.getTickIndex(), `${label}: tick index`).toBe(Number(tick));
    expect(
      isAtMost(error, exactValue(bound)),
      `${label}: error ${errorText} > bound ${bound}`
    ).toBe(true);
  }
}

it('SimulationClock keeps the error of a seek until the remainder is exact', () => {
  // Review regression: each split stored only its own bound, so one small advance after a seek
  // dropped the error of the seek. 1e6 + 0.35 s + 10 ms + 40 ms is nominally tick 10000004, but
  // the remainder of the seek is 2.3e-11 s low, more than the bounds of the two advances. The
  // split then gave tick 10000003 and alpha 1 - 2.3e-10.
  const clock = new SimulationClock({tickInterval: 0.1});
  clock.seek(1e6 + 0.35);
  expect(clock.advance(10).ticks).toBe(0);
  expect(clock.advance(40).ticks).toBe(1);
  expect(clock.getTickIndex()).toBe(10000004);
  expect(clock.getTickAlpha()).toBe(0);

  // The same steps in exact arithmetic: the stored bound covers the error after each step.
  const model = new ExactClockModel(new SimulationClock({tickInterval: 0.1}), rational(1, 10), 1);
  model.seek(nominal(20000007, 20), 'seek');
  model.advance(nominal(10), 'advance 10 ms');
  model.advance(nominal(40), 'advance 40 ms');
});

it('SimulationClock matches exact tick arithmetic over mixed seeks, rates and advances', () => {
  const milliseconds = [1, 7, 10, 16, 33, 40, 50, 100, 250, 1000].map(ms => nominal(ms));
  milliseconds.push(nominal(1000, 60));
  const rates = [1, 2, 3, 0.5, -1, -3, 60, 1000, YEAR, -YEAR];
  const seeks = [
    nominal(0),
    nominal(41, 20),
    nominal(20000001, 20),
    nominal(10000000003, 10),
    nominal(-1000001, 2),
    nominal(123456789, 1000),
    nominal(70000000007, 20)
  ];
  const intervals: [number, Rational][] = [
    [0.1, rational(1, 10)],
    [1 / 60, rational(1, 60)],
    [7, rational(7)]
  ];
  for (const [tickInterval, exactInterval] of intervals) {
    for (const catchUpPolicy of ['skip', 'lag'] as const) {
      const random = createRandom(41);
      const clock = new SimulationClock({tickInterval, catchUpPolicy, maxTicksPerAdvance: 1e7});
      const model = new ExactClockModel(clock, exactInterval, 1);
      const counts = {seek: 0, setRate: 0, rebase: 0, advance: 0};
      for (let i = 0; i < 3000; i++) {
        const pick = random();
        const label = `${tickInterval} ${catchUpPolicy} step ${i}`;
        if (pick < 0.02) {
          counts.seek++;
          model.seek(seeks[Math.floor(random() * seeks.length)], `${label} seek`);
        } else if (pick < 0.11) {
          counts.setRate++;
          model.setRate(rates[Math.floor(random() * rates.length)]);
        } else if (pick < 0.14) {
          counts.rebase++;
          model.rebase(`${label} rebase`);
        } else {
          counts.advance++;
          model.advance(milliseconds[Math.floor(random() * milliseconds.length)], label);
        }
      }
      // Every operation runs, so the walk interleaves each of them with the others.
      for (const [operation, count] of Object.entries(counts)) {
        expect(count, `${tickInterval} ${catchUpPolicy} ${operation} count`).toBeGreaterThan(0);
      }
      // The run is free of ambiguity: every exact time off a boundary is far outside the bound.
      expect(model.minimumDistance).toBeGreaterThan(4 * model.maximumBound);
      expect(model.boundaries).toBeGreaterThan(10);
    }
  }
});

it('SimulationClock counts the rounding of the time and of the epoch in a seek', () => {
  // With startTime 1e9, seek(1e9 + 0.3) is nominally tick 3. The input rounds to 4.8e-8 s below
  // 1e9 + 0.3, much more than the bound 7u(0.3 + 0.1) of the split. The rounding of the input
  // time counts, so the split snaps to tick 3.
  const late = new SimulationClock({tickInterval: 0.1, startTime: 1e9});
  late.seek(1e9 + 0.3);
  expect(late.getTickIndex()).toBe(3);
  expect(late.getTickAlpha()).toBe(0);

  // Both inputs round: just above 2^30, 2^30 + 0.08 and 2^30 + 0.38 round in opposite
  // directions, and the elapsed time is 1.9e-7 s above 0.3 s, more than u * startTime.
  const binade = nominal(107374182408, 100);
  const rounded = new ExactClockModel(
    new SimulationClock({tickInterval: 0.1, startTime: binade.input}),
    rational(1, 10),
    1,
    binade.exact
  );
  rounded.seek(nominal(107374182438, 100), 'seek 2^30 + 0.38');

  // After a rebase, the epoch carries the rounding of the moved ticks. Each seek near the new
  // epoch, and the advances after it, stay on the exact ticks.
  const startTime = nominal(5000001, 5);
  const model = new SimulationClock({tickInterval: 0.1, startTime: startTime.input});
  const exact = new ExactClockModel(model, rational(1, 10), 1, startTime.exact);
  exact.seek(nominal(20000000001, 20), 'seek');
  exact.rebase('rebase');
  for (const [numerator, denominator] of [
    [20000000003, 20],
    [10000000007, 10],
    [100000000037, 100]
  ]) {
    exact.seek(nominal(numerator, denominator), `seek ${numerator} / ${denominator}`);
    for (let i = 0; i < 20; i++) exact.advance(nominal(5), `advance ${i}`);
  }
  expect(exact.boundaries).toBeGreaterThan(2);
});
