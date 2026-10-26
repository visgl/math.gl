// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {NormalGravity} from '../src/normal-gravity';
import {qualifyNormalGravity} from './normal-gravity-qualification';
for (const row of qualifyNormalGravity())
  test(`${row.mode} ${row.id}`, () => expect(row.passed, JSON.stringify(row)).toBe(true));
test('Nonrotating sphere is exactly a monopole and returns owned results', () => {
  const options = {semiMajorAxis: 2, flattening: 0, gravitationalParameter: 8, angularVelocity: 0};
  const m = new NormalGravity(options);
  options.semiMajorAxis = 4;
  expect(Object.isFrozen(m)).toBe(true);
  expect(m.semiMajorAxis).toBe(2);
  const p = m.evaluateCartesian(3, 4, 0);
  expect(p.potential).toBe(8 / 5);
  expect(p.acceleration[0]).toBeCloseTo((-8 * 3) / 125, 14);
  expect(p.acceleration[1]).toBeCloseTo((-8 * 4) / 125, 14);
  p.acceleration.fill(99);
  expect(m.evaluateCartesian(3, 4, 0).acceleration[0]).toBeCloseTo((-8 * 3) / 125, 14);
  expect(m.surfaceGravity(0)).toBe(2);
});
test('WGS84 conventions, constants, polar symmetry and supported domains are explicit', () => {
  const m = NormalGravity.WGS84();
  expect(m.surfaceGravity(0)).toBeCloseTo(9.780325335903891, 12);
  expect(m.surfaceGravity(90)).toBeCloseTo(9.8321849378634, 12);
  for (const latitude of [-90, -45, 0, 45, 90]) {
    const p = m.evaluate(latitude, 30, 1000);
    expect(p.localAcceleration[0]).toBe(0);
    expect(p.localAcceleration[2]).toBeLessThan(0);
  }
  for (const args of [
    [91, 0, 0],
    [0, 181, 0],
    [0, 0, -1],
    [0, 0, 101 * m.semiMajorAxis],
    [NaN, 0, 0]
  ])
    expect(() => m.evaluate(...(args as [number, number, number]))).toThrow();
  for (const p of [
    [0, 0, 0],
    [1, 0, 0],
    [NaN, 0, 0],
    [102 * m.semiMajorAxis, 0, 0]
  ])
    expect(() => m.evaluateCartesian(...(p as [number, number, number]))).toThrow();
  const options = {semiMajorAxis: 2, flattening: 0, gravitationalParameter: 8, angularVelocity: 0};
  for (const change of [
    {semiMajorAxis: 0},
    {flattening: -0.1},
    {flattening: 0.03},
    {gravitationalParameter: 0},
    {angularVelocity: 10},
    {angularVelocity: NaN}
  ])
    expect(() => new NormalGravity({...options, ...change})).toThrow();
});
