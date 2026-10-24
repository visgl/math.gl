// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {MapEngine, REGIONAL_PROJECTIONS} from '../../src/discontinuous';
for (const projection of REGIONAL_PROJECTIONS)
  test(`regional ${projection}: clipped geometry`, () => {
    const map = new MapEngine({
      version: 1,
      id: projection,
      definition: {type: 'regional', projection}
    });
    if (['airy', 'craig', 'littrow', 'satellite'].includes(projection))
      expect(map.projectPoint([180, 0])).toBeNull();
    let visible: [number, number] = [0, 0];
    for (let lon = -169; lon < 180; lon += 20)
      for (let lat = -80; lat < 90; lat += 20) {
        const p = map.projectPoint([lon, lat]);
        if (!p) continue;
        visible = [lon, lat];
        const q = map.unprojectPoint(p.position, p.regionId);
        expect(q.length, `${lon},${lat}`).toBe(1);
        const back = map.projectPoint(q[0].position, p.regionId)!;
        expect(
          Math.hypot(back.position[0] - p.position[0], back.position[1] - p.position[1])
        ).toBeLessThan(1e-8);
        // GS50's polynomial folds near the edge of its default cap. A valid
        // inverse branch can differ from the original source point there.
        if (projection !== 'modified-stereographic-gs50') {
          expect(q[0].position[0]).toBeCloseTo(lon, 4);
          expect(q[0].position[1]).toBeCloseTo(lat, 4);
        }
      }
    const [lon, lat] = visible;
    const polygons = map.projectPolygon([
      [
        [lon - 2, lat - 2],
        [lon + 2, lat - 2],
        [lon + 2, lat + 2],
        [lon - 2, lat + 2]
      ]
    ]);
    expect(polygons.length).toBeGreaterThan(0);
    for (const part of polygons)
      for (let k = 0; k < part.coordinates.length; k++)
        for (let i = 0; i < part.coordinates[k].length; i++) {
          const source = part.sourceCoordinates[k][i],
            p = map.projectPoint(source, part.regionId);
          expect(p, `${source}`).toBeTruthy();
          expect(
            Math.hypot(
              p!.position[0] - part.coordinates[k][i][0],
              p!.position[1] - part.coordinates[k][i][1]
            )
          ).toBeLessThan(1e-8);
        }
    expect(map.getLayout().bounds.every(Number.isFinite)).toBe(true);
  });

test('regional clipping excludes remote polygons', () => {
  const satellite = new MapEngine({
    version: 1,
    id: 'sat',
    definition: {type: 'regional', projection: 'satellite'}
  });
  expect(
    satellite.projectPolygon([
      [
        [100, -10],
        [120, -10],
        [120, 10],
        [100, 10]
      ]
    ])
  ).toEqual([]);
  const alaska = new MapEngine({
    version: 1,
    id: 'ak',
    definition: {type: 'regional', projection: 'modified-stereographic-alaska'}
  });
  expect(
    alaska.projectPolygon([
      [
        [-10, -10],
        [10, -10],
        [10, 10],
        [-10, 10]
      ]
    ])
  ).toEqual([]);
});

import reference from './regional-reference.json';
import type {RegionalProjection} from '../../src/discontinuous';
import type {Position} from '../../src/discontinuous/math';
for (const [name, samples] of Object.entries(reference.samples))
  test(`regional ${name}: D3 native aspect and cap`, () => {
    const map = new MapEngine({
      version: 1,
      id: name,
      definition: {type: 'regional', projection: name as RegionalProjection}
    });
    const anchor = samples.find(s => s.visible)!,
      origin = map.projectPoint(anchor.source as Position)!.position;
    for (const sample of samples) {
      const p = map.projectPoint(sample.source as Position);
      expect(Boolean(p), `${sample.source}`).toBe(sample.visible);
      if (p)
        expect(
          Math.hypot(
            p.position[0] - origin[0] - (sample.position[0] - anchor.position[0]),
            p.position[1] - origin[1] - (sample.position[1] - anchor.position[1])
          ),
          `${sample.source}`
        ).toBeLessThan(2e-6);
    }
  });

test('regional clipping preserves holes and exact great-circle horizon intersections', () => {
  const map = new MapEngine({
    version: 1,
    id: 'satellite',
    definition: {type: 'regional', projection: 'satellite'}
  });
  const pieces = map.projectPolygon([
    [
      [5, 5],
      [25, 5],
      [25, 25],
      [5, 25]
    ],
    [
      [10, 10],
      [10, 15],
      [15, 15],
      [15, 10]
    ]
  ]);
  expect(pieces.length).toBe(1);
  expect(pieces[0].coordinates.length).toBe(2);
  const line = map.projectLine([
    [40, 10],
    [80, 10]
  ]);
  expect(line.length).toBeGreaterThan(0);
  const endpoint = line.at(-1)!.sourceCoordinates.at(-1)!;
  expect(
    Math.cos((endpoint[0] * Math.PI) / 180) * Math.cos((endpoint[1] * Math.PI) / 180)
  ).toBeCloseTo(Math.cos(((60 - 1e-6) * Math.PI) / 180), 9);
  const vector = (p: number[]) => {
    const l = (p[0] * Math.PI) / 180,
      f = (p[1] * Math.PI) / 180;
    return [Math.cos(l) * Math.cos(f), Math.sin(l) * Math.cos(f), Math.sin(f)];
  };
  const a = vector([40, 10]),
    b = vector([80, 10]),
    q = vector(endpoint),
    n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  expect(Math.abs(n.reduce((sum, v, i) => sum + v * q[i], 0))).toBeLessThan(1e-10);
  expect(() => map.getLayout()).not.toThrow();
  expect(() =>
    map.projectPolygon(
      [
        [
          [30, 5],
          [80, 5],
          [80, 25],
          [30, 25]
        ]
      ],
      {tolerance: 1e-100}
    )
  ).toThrow(/sampling limit/);
});

test('regional custom coefficients and control points round trip', () => {
  for (const definition of [
    {
      type: 'regional',
      projection: 'modified-stereographic',
      coefficients: [[1, 0]],
      center: [10, 20]
    },
    {
      type: 'regional',
      projection: 'chamberlin',
      controlPoints: [
        [-30, 20],
        [40, 20],
        [5, -30]
      ]
    },
    {
      type: 'regional',
      projection: 'two-point-azimuthal',
      controlPoints: [
        [-30, 20],
        [40, 25]
      ]
    },
    {
      type: 'regional',
      projection: 'two-point-equidistant',
      controlPoints: [
        [-30, 20],
        [40, 25]
      ]
    },
    {type: 'regional', projection: 'satellite', distance: 3, tilt: 10, center: [10, 20]}
  ] as const) {
    const map = new MapEngine({
      version: 1,
      id: 'custom',
      definition: JSON.parse(JSON.stringify(definition))
    });
    const p = map.projectPoint([10, 10])!,
      q = map.unprojectPoint(p.position, p.regionId)[0];
    expect(q.position[0]).toBeCloseTo(10, 5);
    expect(q.position[1]).toBeCloseTo(10, 5);
  }
  for (const definition of [
    {type: 'regional', projection: 'satellite', distance: 1},
    {type: 'regional', projection: 'satellite', tilt: 89},
    {
      type: 'regional',
      projection: 'chamberlin',
      controlPoints: [
        [0, 0],
        [20, 0],
        [40, 0]
      ]
    },
    {
      type: 'regional',
      projection: 'two-point-azimuthal',
      controlPoints: [
        [0, 0],
        [180, 0]
      ]
    },
    {type: 'regional', projection: 'modified-stereographic', coefficients: []},
    {type: 'regional', projection: 'airy', tilt: 5}
  ])
    expect(
      () => new MapEngine({version: 1, id: 'invalid', definition: definition as never})
    ).toThrow();
});

test('convex fast path detects excluded cap interiors even with visible corners', () => {
  const map = new MapEngine({
    version: 1,
    id: 'airy',
    definition: {type: 'regional', projection: 'airy'}
  });
  expect(
    map.containsConvexPolygon(
      [
        [5, 5],
        [10, 5],
        [10, 10],
        [5, 10]
      ],
      'north-2'
    )
  ).toBe(true);
  expect(
    map.containsConvexPolygon(
      [
        [5, 5],
        [10, 5],
        [8, 7],
        [10, 10],
        [5, 10]
      ],
      'north-2'
    )
  ).toBe(false);
  // A very small cap around Wiechel's antipode lies inside this polar cell.
  const wiechel = new MapEngine({
    version: 1,
    id: 'wiechel',
    definition: {type: 'regional', projection: 'wiechel'}
  });
  const ring: Position[] = [
    [-135, -89],
    [-45, -89],
    [45, -89],
    [135, -89]
  ];
  expect(ring.every(p => wiechel.projectPoint(p))).toBe(true);
  for (const region of wiechel.regions)
    expect(wiechel.containsConvexPolygon(ring, region.id)).toBe(false);
});

test('polar cap clipping does not turn tangent chart slivers into antipodal polygons', () => {
  const map = new MapEngine({
    version: 1,
    id: 'polar-cap',
    definition: {type: 'regional', projection: 'wiechel'}
  });
  const parts = map.projectPolygon(
    [
      [
        [-50, -90],
        [-45, -85],
        [-50, -85],
        [-50, -90]
      ]
    ],
    {tolerance: 1e-5}
  );
  expect(parts.length).toBeGreaterThan(0);
  for (const part of parts)
    for (const ring of part.sourceCoordinates)
      for (const point of ring) {
        expect(map.findRegions(point)).toContain(part.regionId);
        expect(point[1]).toBeGreaterThan(-89.99901);
      }
});
