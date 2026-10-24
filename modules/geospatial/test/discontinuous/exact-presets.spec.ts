// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  MapEngine,
  type MapDefinition,
  createPetroffMap,
  createGrayFullerMap,
  createIcosahedralSnyderMap,
  createDodecahedralSnyderMap
} from '../../src/discontinuous';
import {geographic, RAD, type Position} from '../../src/discontinuous/math';
import petroff from './petroff-reference.json';
import fuller from './gray-fuller-reference.json';
const make = (type: MapDefinition['type']) =>
  new MapEngine({version: 1, id: type, definition: {type} as MapDefinition});

test('Petroff agrees with the author’s published implementation', () => {
  const map = make('petroff');
  for (const {source, expected} of petroff.samples) {
    const p = map.projectPoint(source as Position)!.position;
    expect(p[0], String(source)).toBeCloseTo(expected[0], 10);
    expect(p[1], String(source)).toBeCloseTo(expected[1], 10);
  }
});
test('Gray–Fuller agrees with D3 AirOcean over the entire net', () => {
  const map = make('gray-fuller');
  const [s0, s1] = fuller.samples;
  const p = map.projectPoint(s0.source as Position)!.position,
    q = map.projectPoint(s1.source as Position)!.position;
  const dx = s1.expected[0] - s0.expected[0],
    dy = -(s1.expected[1] - s0.expected[1]);
  const a = ((q[0] - p[0]) * dx + (q[1] - p[1]) * dy) / (dx * dx + dy * dy);
  const b = ((q[1] - p[1]) * dx - (q[0] - p[0]) * dy) / (dx * dx + dy * dy);
  const tx = p[0] - a * s0.expected[0] - b * s0.expected[1],
    ty = p[1] - b * s0.expected[0] + a * s0.expected[1];
  for (const {
    source,
    expected: [x, down]
  } of fuller.samples) {
    const point = map.projectPoint(source as Position)!.position;
    expect(point[0], String(source)).toBeCloseTo(a * x + b * down + tx, 8);
    expect(point[1], String(source)).toBeCloseTo(b * x - a * down + ty, 8);
  }
});
for (const type of ['petroff', 'isea', 'dsea'] as const)
  test(`${type}: area Jacobian is constant across the globe`, () => {
    const map = make(type),
      epsilon = 1e-6,
      step = epsilon / RAD;
    for (let lon = -171; lon < 180; lon += 19)
      for (let lat = -79; lat < 80; lat += 13) {
        const p = map.projectPoint([lon, lat])!;
        const x = map.projectPoint([lon + step, lat], p.regionId),
          y = map.projectPoint([lon, lat + step], p.regionId);
        if (!x || !y) continue;
        const determinant =
          ((x.position[0] - p.position[0]) * (y.position[1] - p.position[1]) -
            (x.position[1] - p.position[1]) * (y.position[0] - p.position[0])) /
          epsilon ** 2;
        expect(Math.abs(determinant) / Math.cos(lat * RAD), `${lon},${lat}`).toBeCloseTo(
          type === 'petroff' ? 1 / Math.PI : 1,
          3
        );
      }
  });
test('Petroff axes, poles, triangle meeting point, and meridian rotation', () => {
  const map = make('petroff');
  for (const lon of [-180, -135, -90, -45, 0, 45, 90, 135, 180])
    for (const lat of [-90, -89.999, -67.5, -1e-6, 0, 1e-6, 67.5, 89.999, 90]) {
      const source: Position = [lon, lat];
      for (const region of map.findRegions(source)) {
        const p = map.projectPoint(source, region)!;
        const q = map.unprojectPoint(p.position, region);
        expect(
          q.length,
          `${source} ${region} ${p.position} raw=${map.regions.find(r => r.id === region)!.unproject(p.position)}`
        ).toBe(1);
        const a = geographic(source),
          b = geographic(q[0].position);
        expect(Math.hypot(...a.map((v, i) => v - b[i])), `${source}`).toBeLessThan(2e-6);
      }
    }
  const rotated = createPetroffMap({centralMeridian: 37});
  expect(rotated.projectPoint([62, 14])!.position).toEqual(map.projectPoint([25, 14])!.position);
  expect(() => createPetroffMap({centralMeridian: NaN})).toThrow();
});

import isea from './isea-reference.json';
test('ISEA agrees with PROJ’s independent Snyder implementation', () => {
  const map = make('isea');
  const [s0, s1] = isea.samples;
  const p = map.projectPoint(s0.source as Position)!.position,
    q = map.projectPoint(s1.source as Position)!.position;
  const dx = s1.expected[0] - s0.expected[0],
    dy = s1.expected[1] - s0.expected[1];
  const a = ((q[0] - p[0]) * dx + (q[1] - p[1]) * dy) / (dx * dx + dy * dy);
  const b = ((q[1] - p[1]) * dx - (q[0] - p[0]) * dy) / (dx * dx + dy * dy);
  const tx = p[0] - a * s0.expected[0] + b * s0.expected[1],
    ty = p[1] - b * s0.expected[0] - a * s0.expected[1];
  for (const {
    source,
    expected: [x, y]
  } of isea.samples) {
    const point = map.projectPoint(source as Position)!.position;
    expect(point[0], String(source)).toBeCloseTo(a * x - b * y + tx, 7);
    expect(point[1], String(source)).toBeCloseTo(b * x + a * y + ty, 7);
  }
});

test('public factories validate options and invert face centers', () => {
  for (const factory of [
    createGrayFullerMap,
    createPetroffMap,
    createIcosahedralSnyderMap,
    createDodecahedralSnyderMap
  ]) {
    for (const radius of [0, -1, Infinity, NaN]) expect(() => factory({radius})).toThrow();
    const map = factory();
    for (const region of map.regions) {
      const hit = map.projectPoint(region.interior, region.id)!;
      const result = map.unprojectPoint(hit.position, region.id);
      expect(result.length).toBe(1);
      const a = geographic(region.interior),
        b = geographic(result[0].position);
      expect(Math.hypot(...a.map((v, i) => v - b[i]))).toBeLessThan(1e-8);
    }
  }
});

test('Petroff inverse remains defined arbitrarily close to section centers', () => {
  const map = make('petroff');
  for (const lon of [-135, -45, 45, 135])
    for (const sign of [-1, 1]) {
      for (const delta of [1e-4, 1e-6, 1e-8, 1e-10])
        for (const direction of [-1, 1]) {
          const source: Position = [lon + direction * delta, sign * (67.5 - delta)];
          const hit = map.projectPoint(source)!;
          const inverse = map.unprojectPoint(hit.position, hit.regionId);
          expect(inverse.length, String(source)).toBe(1);
          const a = geographic(source),
            b = geographic(inverse[0].position);
          expect(Math.hypot(...a.map((v, i) => v - b[i]))).toBeLessThan(2e-7);
        }
    }
});
