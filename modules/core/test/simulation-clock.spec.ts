// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {SimulationClock, interpolateTickState, quat} from '@math.gl/core';
import type {SimulationClockAdvance} from '@math.gl/core';

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
