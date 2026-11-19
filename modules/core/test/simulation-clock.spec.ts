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
  clock.seek(1.7);
  expect(clock.getTickIndex()).toBe(16);
  const fine = new SimulationClock({tickInterval: 0.001});
  fine.seek(128.076);
  expect(fine.getTickIndex()).toBe(128076);
  expect(fine.getTickAlpha()).toBeLessThan(1e-6);

  // The same rounding in an advance moves the tick index, and the result counts the move.
  const advanced = new SimulationClock({tickInterval: 0.1});
  expect(advanced.advance(1700)).toEqual({ticks: 16, skippedTicks: 0, droppedTime: 0});
  expect(advanced.getTickAlpha()).toBeLessThan(1);
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
