// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {MapEngine, MAP_PROJECTIONS, type MapProjection} from '../../src/discontinuous';
import reference from './catalog-reference.json';
import type {Position} from '../../src/discontinuous/math';
test('catalog covers every named default constructor in d3-geo-projection 4.0.0', () => {
  expect(new Set(MAP_PROJECTIONS).size).toBe(MAP_PROJECTIONS.length);
  for (const entry of reference.cases) expect(MAP_PROJECTIONS).toContain(entry.projection);
});
for (const entry of reference.cases)
  test(`catalog ${entry.projection}: D3 default aspect and shape`, () => {
    const map = new MapEngine({
      version: 1,
      id: entry.projection,
      definition: {type: 'projection', projection: entry.projection as MapProjection}
    });
    const [s0, s1] = entry.samples,
      p = map.projectPoint(s0.source as Position)!.position,
      q = map.projectPoint(s1.source as Position)!.position;
    const dx = s1.position[0] - s0.position[0],
      dy = s1.position[1] - s0.position[1],
      length = dx * dx + dy * dy;
    const a = ((q[0] - p[0]) * dx + (q[1] - p[1]) * dy) / length,
      b = ((q[1] - p[1]) * dx - (q[0] - p[0]) * dy) / length;
    for (const s of entry.samples) {
      const actual = map.projectPoint(s.source as Position)!;
      expect(actual, `${s.source}`).toBeTruthy();
      const x = s.position[0] - s0.position[0],
        y = s.position[1] - s0.position[1];
      expect(
        Math.hypot(
          actual.position[0] - (p[0] + a * x - b * y),
          actual.position[1] - (p[1] + b * x + a * y)
        ),
        `${s.source}`
      ).toBeLessThan(2e-5);
    }
    expect(map.getLayout().bounds.every(Number.isFinite)).toBe(true);
  });

test('off-equator interruptions remain connected below their cut latitude', () => {
  const create = (latitudes: {north: number; south: number}) =>
    new MapEngine({
      version: 1,
      id: 'custom-interruptions',
      definition: {
        type: 'interrupted',
        projection: 'sinusoidal',
        latitudes,
        lobes: {
          north: [
            [-180, -90, 0],
            [0, 90, 180]
          ],
          south: [
            [-180, -90, 0],
            [0, 90, 180]
          ]
        }
      }
    });
  const map = create({north: 35, south: -10});
  const gap = (latitude: number) => {
    const a = map.projectPoint([-1e-7, latitude])!.position,
      b = map.projectPoint([1e-7, latitude])!.position;
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  };
  expect(gap(20)).toBeLessThan(1e-8);
  expect(gap(60)).toBeGreaterThan(0.5);
  expect(gap(-5)).toBeLessThan(1e-8);
  expect(gap(-40)).toBeGreaterThan(0.5);
  for (const p of [
    [-70, 20],
    [10, 60],
    [100, -40]
  ] as Position[]) {
    const q = map.projectPoint(p)!,
      back = map.unprojectPoint(q.position, q.regionId)[0];
    expect(back.position[0]).toBeCloseTo(p[0], 7);
    expect(back.position[1]).toBeCloseTo(p[1], 7);
  }
  expect(() => create({north: 90, south: 0})).toThrow(/latitudes/);
});
