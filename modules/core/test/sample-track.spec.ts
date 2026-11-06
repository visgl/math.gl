// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {SampleTrack, quat} from '@math.gl/core';

it('sample tracks copy data, support irregular times and caller-owned outputs', () => {
  const times = [1, 2, 5],
    values = [2, 4, 10];
  const track = new SampleTrack(times, values);
  times[0] = 100;
  values[1] = 999;
  const out = new Float64Array(1);
  for (const time of [3, 1, 4, 2, 1.5, 5]) {
    expect(track.evaluate(time, out)).toBe(out);
    expect(out[0]).toBeCloseTo(2 * time, 12);
  }
  expect(track.evaluate(-1)).toEqual([2]);
  expect(track.evaluate(100)).toEqual([10]);
  expect(new SampleTrack([1], [7]).evaluate(3)).toEqual([7]);
  expect(new SampleTrack([0, 1], [1, 2], {boundary: 'throw'}).evaluate(0)).toEqual([1]);
  expect(() => new SampleTrack([0, 1], [1, 2], {boundary: 'throw'}).evaluate(2)).toThrow();
  expect(() => track.evaluate(NaN)).toThrow();
  expect(() => track.evaluate(2, [])).toThrow();
});

it('discrete knots and cubic scalar/vector tracks preserve endpoints and linear data', () => {
  const discrete = new SampleTrack([0, 1, 3], [2, 5, 8], {interpolation: 'discrete'});
  expect(discrete.evaluate(0.9)).toEqual([2]);
  expect(discrete.evaluate(1)).toEqual([5]);
  expect(discrete.evaluate(3)).toEqual([8]);
  const cubic = new SampleTrack([0, 1, 3], [0, 0, 2, 3, 6, 9], {size: 2, interpolation: 'cubic'});
  for (const t of [0, 0.3, 1, 1.7, 3]) {
    const out = cubic.evaluate(t);
    expect(out[0]).toBeCloseTo(2 * t, 12);
    expect(out[1]).toBeCloseTo(3 * t, 12);
  }
});

it('quaternion tracks normalize and maintain sign continuity', () => {
  const q = quat.setAxisAngle([], [0, 0, 1], Math.PI / 2);
  for (const interpolation of ['linear', 'cubic', 'discrete'] as const) {
    const track = new SampleTrack([0, 1, 2], [0, 0, 0, 2, ...q.map(x => -x), ...q], {
      quaternion: true,
      interpolation
    });
    for (const t of [0, 0.2, 0.5, 1, 1.5, 2])
      expect(Math.hypot(...track.evaluate(t))).toBeCloseTo(1, 12);
    expect(track.evaluate(1)[3]).toBeGreaterThan(0);
  }
  const linear = new SampleTrack([0, 1], [0, 0, 0, 1, ...q], {quaternion: true});
  expect(linear.evaluate(0.5)[2]).toBeCloseTo(Math.sin(Math.PI / 8), 12);
});

it('Bezier time/value controls solve time rather than use normalized time directly', () => {
  const track = new SampleTrack([0, 1], [0, 1], {
    interpolation: 'bezier',
    inTangents: [0, 0, 1, 0],
    outTangents: [0, 0, 1, 1]
  });
  // x(s)=3s^2-2s^3, y(s)=s^3. At s=.5, x=.5 and y=.125.
  expect(track.evaluate(0.5)[0]).toBeCloseTo(0.125, 12);
  expect(track.evaluate(0)).toEqual([0]);
  expect(track.evaluate(1)).toEqual([1]);
  expect(() => new SampleTrack([0, 1], [0, 1], {interpolation: 'bezier'})).toThrow();
  expect(
    () =>
      new SampleTrack([0, 1], [0, 1], {
        interpolation: 'bezier',
        inTangents: [0, 0, 0.2, 0],
        outTangents: [0.8, 0, 1, 1]
      })
  ).toThrow();
});

it('invalid sample tracks fail during construction', () => {
  for (const times of [[], [1, 1], [2, 1], [0, NaN]])
    expect(() => new SampleTrack(times, times)).toThrow();
  expect(() => new SampleTrack([0, 1], [0])).toThrow();
  expect(() => new SampleTrack([0], [Infinity])).toThrow();
  expect(() => new SampleTrack([0], [0], {size: 0})).toThrow();
  expect(() => new SampleTrack([0], [0, 0, 0, 0], {quaternion: true})).toThrow();
  expect(() => new SampleTrack([0], [1], {quaternion: true, size: 1})).toThrow();
});

it('quaternion tracks normalize large finite samples without collapsing them', () => {
  const track = new SampleTrack(
    [0, 1],
    [1e308, 1e308, 1e308, 1e308, -1e308, -1e308, -1e308, -1e308],
    {quaternion: true}
  );
  expect(track.evaluate(0.5)).toEqual([0.5, 0.5, 0.5, 0.5]);
});

it('cubic interpolation preserves weighted slopes when a derivative underflows', () => {
  const track = new SampleTrack([0, 1e100], [0, 1e-300], {interpolation: 'cubic'});
  expect(track.evaluate(2.5e99)[0] / 1e-300).toBeCloseTo(0.25, 12);
});

it('cubic tangent fallback does not overflow an otherwise finite weighted slope', () => {
  const track = new SampleTrack([0, 1e-323, 1e-15], [0, 0, 1e308], {interpolation: 'cubic'});
  const result = track.evaluate(5e-324)[0];
  expect(Number.isFinite(result)).toBe(true);
  expect(result).toBeLessThan(0);
});

it('cubic weighted slopes avoid subnormal intermediate rounding', () => {
  const track = new SampleTrack([0, 2 ** -1070, 2 ** -40], [0, 0, 3 / 32], {
    interpolation: 'cubic'
  });
  const result = track.evaluate(2 ** -1071)[0];
  const expected = (-(3 / 32) * 2 ** -1030) / 8;
  expect(result / expected).toBeCloseTo(1, 12);
});
