// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  MapEngine,
  createHealpixMap,
  createGingeryMap,
  createInterruptedMap,
  type MapDefinition,
  type InterruptedProjection
} from '../../src/discontinuous';
import {geographic} from '../../src/discontinuous/math';

const make = (definition: MapDefinition) => new MapEngine({version: 1, id: 'test', definition});
const roundTrip = (map: MapEngine, p: [number, number]) => {
  for (const region of map.findRegions(p)) {
    const hit = map.projectPoint(p, region)!;
    const inverse = map.unprojectPoint(hit.position, region);
    expect(inverse.length, `${JSON.stringify(map.description.definition)} ${p} ${region}`).toBe(1);
    const a = geographic(p),
      b = geographic(inverse[0].position);
    expect(Math.hypot(...a.map((v, i) => v - b[i]))).toBeLessThan(2e-6);
  }
  expect(map.findRegions(p).length).toBeGreaterThan(0);
};

test('HEALPix transition, poles, cut sides, equal area, and empty gaps', () => {
  const map = make({type: 'healpix'});
  const latitude = (Math.asin(2 / 3) * 180) / Math.PI;
  for (const lon of [-180, -90, 0, 90, 180])
    for (const lat of [
      -90,
      -89.999,
      -latitude,
      -latitude + 1e-6,
      0,
      latitude - 1e-6,
      latitude,
      89.999,
      90
    ])
      roundTrip(map, [lon, lat]);
  expect(map.unprojectPoint([0, 1.5])).toEqual([]);
  expect(map.unprojectPoint([0, 2])).toEqual([]);
  const scale = 180 / Math.PI,
    epsilon = 1e-6;
  for (const lat of [10, 35, 60, -80]) {
    const p = map.projectPoint([25, lat])!;
    const dx = map.projectPoint([25 + epsilon * scale, lat], p.regionId)!.position;
    const dy = map.projectPoint([25, lat + epsilon * scale], p.regionId)!.position;
    const determinant =
      ((dx[0] - p.position[0]) * (dy[1] - p.position[1]) -
        (dx[1] - p.position[1]) * (dy[0] - p.position[0])) /
      epsilon ** 2;
    expect(determinant / Math.cos(lat / scale)).toBeCloseTo((3 * Math.PI) / 8, 4);
  }
  const rotated = make({type: 'healpix', centralMeridian: 400});
  expect(rotated.projectPoint([65, 60])!.position).toEqual(map.projectPoint([25, 60])!.position);
  expect(() => createHealpixMap({radius: -1})).toThrow();
  expect(() => createHealpixMap({centralMeridian: Infinity})).toThrow();
});

test('Gingery parameters, cap joins, tips and inverse branches', () => {
  for (const lobes of [3, 6, 24])
    for (const coreAngle of [1, 30, 89]) {
      const map = make({
        type: 'gingery',
        lobes,
        coreAngle,
        centralMeridian: 17
      });
      for (const lon of [
        17,
        17 + coreAngle - 1e-6,
        17 + coreAngle,
        17 + coreAngle + 1e-6,
        75,
        150,
        197
      ])
        for (const lat of [0, -25, 65]) roundTrip(map, [lon, lat]);
      expect(map.capabilities.disjoint).toBe(false);
      expect(map.seams.some(s => s.kind === 'join')).toBe(true);
    }
  for (const options of [
    {lobes: 2},
    {lobes: 25},
    {lobes: 3.5},
    {coreAngle: 0},
    {coreAngle: 90},
    {coreAngle: NaN},
    {radius: 0}
  ])
    expect(() => createGingeryMap(options)).toThrow();
});

test('Gingery large caps remain invertible across the arc-length integration kink', () => {
  const map = make({type: 'gingery', lobes: 24, coreAngle: 89});
  // A quadrature grid crossing the curve's kink previously jumped enough for
  // picking to reject these valid points after its forward round-trip check.
  for (const p of [
    [-99.7515504, -69.22814495467175],
    [-92.7794817, -25.277322707543476],
    [96.987645, 53.22570170418041]
  ])
    roundTrip(map, p as [number, number]);
  for (let i = 0; i < 1000; i++)
    roundTrip(map, [
      ((i * 137.50776405) % 360) - 180,
      (Math.asin((2 * (i + 0.5)) / 1000 - 1) * 180) / Math.PI
    ]);
});

const lobes = {
  north: [[-180, 0, 180]],
  south: [
    [-180, -90, 0],
    [0, 90, 180]
  ]
} as const;
for (const projection of [
  'sinusoidal',
  'mollweide',
  'homolosine',
  'boggs',
  'sinu-mollweide',
  'quartic-authalic'
] as const) {
  test(`custom ${projection}: wide lobes, antimeridian ownership, and split geometry`, () => {
    const map = make({type: 'interrupted', projection, lobes});
    for (const lon of [-180, -179, -90, 0, 90, 179, 180])
      for (const lat of [-90, -70, -1, 0, 1, 70, 90]) roundTrip(map, [lon, lat]);
    expect(map.regions.length).toBe(8);
    expect(map.seams.some(s => s.kind === 'join')).toBe(true);
    const parts = map.projectPolygon([
      [
        [-10, -40],
        [10, -40],
        [10, -20],
        [-10, -20],
        [-10, -40]
      ]
    ]);
    expect(new Set(parts.map(p => p.regionId)).size).toBe(2);
    for (const part of parts)
      for (const ring of part.coordinates) {
        expect(ring[0]).toEqual(ring[ring.length - 1]);
        expect(ring.flat().every(Number.isFinite)).toBe(true);
      }
    const lines = map.projectLine([
      [-10, -30],
      [10, -30]
    ]);
    expect(lines.length).toBe(2);
    const viewport = map.fit({width: 800, height: 500});
    expect(viewport.scale).toBeGreaterThan(0);
  });
}

test('custom interruptions validate partitions and options', () => {
  const create = (north: number[][]) =>
    createInterruptedMap({
      projection: 'sinusoidal',
      lobes: {north: north as [number, number, number][], south: lobes.south}
    });
  for (const north of [
    [],
    [[-179, 0, 180]],
    [[-180, 0, 179]],
    [[-180, 200, 180]],
    [
      [-180, 0, 0],
      [1, 90, 180]
    ],
    [
      [-180, 0, 0],
      [-1, 90, 180]
    ],
    [[-180, NaN, 180]],
    [[-180, 0]],
    [
      [-180, -180, -180],
      [-180, 0, 180]
    ]
  ])
    expect(() => create(north)).toThrow();
  expect(() =>
    createInterruptedMap({
      projection: 'unknown' as InterruptedProjection,
      lobes
    })
  ).toThrow();
  expect(() =>
    createInterruptedMap({
      projection: 'sinusoidal',
      lobes,
      centralMeridian: Infinity
    })
  ).toThrow();
  expect(() => createInterruptedMap({projection: 'sinusoidal', lobes, radius: 0})).toThrow();
});
