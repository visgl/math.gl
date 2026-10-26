// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  createAlbersUsaMap,
  createInterruptedMollweideMap,
  createInterruptedHomolosineMap
} from '../../src/discontinuous';

test('Albers USA selects all three regions in a compact conventional inset layout', () => {
  const map = createAlbersUsaMap();
  for (const [id, positions] of [
    [
      'lower48',
      [
        [-122.33, 47.6],
        [-80.19, 25.76],
        [-81.78, 24.55],
        [-67, 45],
        [-124.4, 42]
      ]
    ],
    [
      'alaska',
      [
        [-149.9, 61.2],
        [-134.4, 58.3],
        [-156.8, 71.3]
      ]
    ],
    [
      'hawaii',
      [
        [-157.8, 21.3],
        [-155.6, 19.5]
      ]
    ]
  ] as const) {
    for (const position of positions) {
      const point = map.projectPoint(position)!;
      expect(point.regionId).toBe(id);
      const candidates = map.unprojectPoint(point.position, id);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].position[0]).toBeCloseTo(
        position[0] > 180 ? position[0] - 360 : position[0],
        7
      );
      expect(candidates[0].position[1]).toBeCloseTo(position[1], 7);
    }
  }
  expect(map.projectPoint([0, 0])).toBeNull();
  expect(map.unprojectPoint([10, 10])).toEqual([]);
  expect(map.projectPoint([-96, 38])!.position).toEqual([0, 0]);
});

test('composite geometry clips gaps and retains source coordinates for each inset', () => {
  const map = createAlbersUsaMap();
  const parts = map.projectLine([
    [-150, 60],
    [-100, 38]
  ]);
  expect(parts.map(part => part.regionId).sort()).toEqual(['alaska', 'lower48']);
  for (const part of parts) {
    expect(part.coordinates.length).toBe(part.sourceCoordinates.length);
    part.coordinates.forEach((point, i) => {
      const inverse = map.unprojectPoint(point, part.regionId)[0];
      expect(inverse.position[0]).toBeCloseTo(part.sourceCoordinates[i][0], 6);
      expect(inverse.position[1]).toBeCloseTo(part.sourceCoordinates[i][1], 6);
    });
  }
  const pieces = map.projectPolygon([
    [
      [-170, 15],
      [-140, 15],
      [-140, 35],
      [-170, 35]
    ]
  ]);
  expect(pieces.map(p => p.regionId)).toEqual(['hawaii']);
  expect(pieces[0].coordinates[0][0]).toEqual(pieces[0].coordinates[0].at(-1));
});

for (const factory of [createInterruptedMollweideMap, createInterruptedHomolosineMap]) {
  test(`${factory.name}: global round trips, cuts, poles, polygons, radius`, () => {
    const map = factory();
    for (let latitude = -85; latitude <= 85; latitude += 10) {
      for (let longitude = -175; longitude < 180; longitude += 10) {
        const point = map.projectPoint([longitude, latitude])!;
        const inverse = map.unprojectPoint(point.position, point.regionId)[0];
        expect(inverse.position[0]).toBeCloseTo(longitude, 6);
        expect(inverse.position[1]).toBeCloseTo(latitude, 6);
      }
    }
    for (const latitude of [-90, 90]) {
      const point = map.projectPoint([0, latitude])!;
      expect(map.unprojectPoint(point.position, point.regionId)[0].position[1]).toBe(latitude);
    }
    expect(
      map.projectLine([
        [-70, 30],
        [-50, 30]
      ])
    ).toHaveLength(2);
    expect(
      map.projectPolygon([
        [
          [-70, 20],
          [-50, 20],
          [-50, 40],
          [-70, 40]
        ]
      ])
    ).toHaveLength(2);
    const p = map.projectPoint([20, 50])!.position;
    const scaled = factory({radius: 7}).projectPoint([20, 50])!.position;
    expect(scaled[0]).toBeCloseTo(p[0] * 7, 10);
    expect(scaled[1]).toBeCloseTo(p[1] * 7, 10);
    expect(() => factory({radius: 0})).toThrow();
  });
}

test('Mollweide analytic values and homolosine transition continuity', () => {
  const moll = createInterruptedMollweideMap();
  expect(moll.projectPoint([0, 0])!.position[0]).toBeCloseTo(0, 12);
  expect(moll.projectPoint([0, 90])!.position[1]).toBeCloseTo(Math.SQRT2, 12);
  const goode = createInterruptedHomolosineMap();
  const transition = (0.7109889596207567 * 180) / Math.PI;
  const below = goode.projectPoint([25, transition - 1e-7])!.position;
  const above = goode.projectPoint([25, transition + 1e-7])!.position;
  expect(above[0]).toBeCloseTo(below[0], 8);
  expect(above[1]).toBeCloseTo(below[1], 8);
  expect(goode.projectPoint([25, 20])!.position[0]).toBeCloseTo(
    ((25 * Math.PI) / 180) * Math.cos((20 * Math.PI) / 180),
    12
  );
});

test('U.S. insets sit side by side at lower left and support explicit picking over the ocean background', () => {
  const map = createAlbersUsaMap();
  const alaska = map.projectPoint([-149.9, 61.2])!;
  const hawaii = map.projectPoint([-157.8, 21.3])!;
  expect(alaska.position[0]).toBeLessThan(hawaii.position[0]);
  for (const p of [alaska, hawaii]) {
    expect(p.position[0]).toBeLessThan(0);
    expect(p.position[1]).toBeGreaterThan(-0.24);
    expect(p.position[1]).toBeLessThan(-0.12);
    expect(map.unprojectPoint(p.position, p.regionId)).toHaveLength(1);
  }
  expect(map.projectPoint([-178.3, 28.4])).toBeNull();
  expect(map.projectPoint([172.5, 52.9])).toBeNull();
  for (let lat = 17; lat < 80; lat += 2)
    for (let lon = -190; lon < -64; lon += 2) {
      const p = map.projectPoint([lon, lat]);
      if (!p) continue;
      const candidates = map.unprojectPoint(p.position).filter(q => q.regionId !== 'lower48');
      expect(candidates.length).toBeLessThanOrEqual(1);
    }
});

test('local formulas preserve spherical area with the documented inset scales', () => {
  const rad = Math.PI / 180;
  for (const [map, point, size] of [
    [createAlbersUsaMap(), [-96, 38], 1],
    [createAlbersUsaMap(), [-154, 60], 0.35],
    [createAlbersUsaMap(), [-157, 21], 1],
    [createInterruptedMollweideMap(), [20, 60], 1],
    [createInterruptedHomolosineMap(), [20, 60], 1]
  ] as const) {
    const step = 1e-4;
    const x0 = map.projectPoint([point[0] - step, point[1]])!.position;
    const x1 = map.projectPoint([point[0] + step, point[1]])!.position;
    const y0 = map.projectPoint([point[0], point[1] - step])!.position;
    const y1 = map.projectPoint([point[0], point[1] + step])!.position;
    const determinant =
      ((x1[0] - x0[0]) * (y1[1] - y0[1]) - (x1[1] - x0[1]) * (y1[0] - y0[0])) /
      (2 * step * rad) ** 2;
    expect(determinant).toBeCloseTo(size * size * Math.cos(point[1] * rad), 7);
  }
});

test('convex grid cells tangent to a regional edge do not create boolean-kernel failures', async () => {
  const {DiscontinuousMap} = await import('../../src/discontinuous');
  const map = new DiscontinuousMap([
    {
      id: 'alaska-domain',
      boundary: [
        [-190, 40],
        [-130, 40],
        [-130, 78],
        [-190, 78]
      ],
      interior: [-154, 60],
      project: ([x, y]) => [x, y],
      unproject: ([x, y]) => [x, y]
    }
  ]);
  expect(
    map.projectPolygon([
      [
        [-130, 40],
        [-125, 40],
        [-125, 45],
        [-130, 45]
      ]
    ])
  ).toEqual([]);
  const parts = map.projectPolygon([
    [
      [-135, 50],
      [-125, 50],
      [-125, 55],
      [-135, 55]
    ]
  ]);
  expect(parts).toHaveLength(1);
  expect(
    parts[0].sourceCoordinates[0].every(p => map.findRegions(p).includes('alaska-domain'))
  ).toBe(true);
});
