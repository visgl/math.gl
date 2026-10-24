// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {MapEngine, type MapDefinition} from '../../src/discontinuous';
import {geographic, coordinates, add, unit} from '../../src/discontinuous/math';
const types = [
  'guyou',
  'gringorten-quincuncial',
  'butterfly',
  'collignon-butterfly',
  'waterman',
  'goode-ocean',
  'interrupted-boggs',
  'interrupted-sinu-mollweide',
  'interrupted-quartic-authalic',
  'interrupted-mollweide-hemispheres'
] as const;
const make = (type: MapDefinition['type'], radius = 1) =>
  new MapEngine({
    version: 1,
    id: type,
    definition: {type} as MapDefinition,
    radius
  });
for (const type of types) {
  test(`${type}: coverage, inverse, boundaries, layout, and transitions`, () => {
    const map = make(type);
    const check = (p: [number, number], id?: string) => {
      const hit = map.projectPoint(p, id);
      expect(hit, `${type} ${p} ${id}`).toBeTruthy();
      expect(hit!.position.every(Number.isFinite), `${p}`).toBe(true);
      const back = map.unprojectPoint(hit!.position, hit!.regionId);
      expect(back.length, `${p}, ${id}: ${hit!.position}`).toBe(1);
      const a = geographic(p),
        b = geographic(back[0].position);
      expect(Math.hypot(...a.map((v, i) => v - b[i])), `${p}`).toBeLessThan(2e-6);
    };
    for (let lon = -173; lon < 180; lon += 23)
      for (let lat = -83; lat < 90; lat += 17) check([lon, lat]);
    for (const region of map.regions) {
      for (let i = 0; i < region.boundary.length; i++) {
        check([...region.boundary[i]], region.id);
        const a = geographic(region.boundary[i]),
          b = geographic(region.boundary[(i + 1) % region.boundary.length]);
        check(coordinates(unit(add(a, b))), region.id);
      }
    }
    expect(map.getLayout().bounds.every(Number.isFinite)).toBe(true);
    expect(map.capabilities.hasCuts).toBe(true);
    expect(map.capabilities.disjoint).toBe(
      type === 'interrupted-quartic-authalic' || type === 'interrupted-mollweide-hemispheres'
    );
    expect(map.planTransitionTo(make('mercator')).strategy).toBe('via-globe');
    expect(map.unprojectPoint([1e6, 1e6])).toEqual([]);
    const p = map.projectPoint([24, 33])!.position,
      q = make(type, 3).projectPoint([24, 33])!.position;
    expect(q[0]).toBeCloseTo(p[0] * 3, 9);
    expect(q[1]).toBeCloseTo(p[1] * 3, 9);
    const lines = map.projectLine([
      [-170, 25],
      [0, 25],
      [170, 25]
    ]);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(line.coordinates.flat().every(Number.isFinite)).toBe(true);
    const polygons = map.projectPolygon([
      [
        [-110, 10],
        [-70, 10],
        [-70, 55],
        [-110, 55],
        [-110, 10]
      ]
    ]);
    expect(polygons.length).toBeGreaterThan(0);
    for (const polygon of polygons)
      expect(polygon.coordinates.flat(2).every(Number.isFinite)).toBe(true);
    expect(() => make(type, 0)).toThrow();
  });
}

import reference from './segmented-reference.json';
test('matches D3 reference formulas and polyhedral shapes', () => {
  for (const entry of reference.cases) {
    const map = make(entry.type as MapDefinition['type']);
    const isPoly = ['butterfly', 'collignon-butterfly', 'waterman'].includes(entry.type);
    // Polyhedral output uses the root-face origin and a fixed −30° orientation.
    // Compare after a single similarity transform, not a per-face fit.
    const [s0, s1] = entry.samples;
    const p = map.projectPoint(s0.source as [number, number])!.position;
    const q = map.projectPoint(s1.source as [number, number])!.position;
    const dx = s1.expected[0] - s0.expected[0],
      dy = s1.expected[1] - s0.expected[1];
    const a = isPoly ? ((q[0] - p[0]) * dx + (q[1] - p[1]) * dy) / (dx * dx + dy * dy) : 1;
    const b = isPoly ? ((q[1] - p[1]) * dx - (q[0] - p[0]) * dy) / (dx * dx + dy * dy) : 0;
    if (isPoly) expect(a * a + b * b).toBeCloseTo(1, 9);
    const tx = isPoly ? p[0] - a * s0.expected[0] + b * s0.expected[1] : 0;
    const ty = isPoly ? p[1] - b * s0.expected[0] - a * s0.expected[1] : 0;
    for (const {
      source,
      expected: [x, y]
    } of entry.samples) {
      const hit = map.projectPoint(source as [number, number])!.position;
      expect(hit[0], `${entry.type} ${source}`).toBeCloseTo(a * x - b * y + tx, 5);
      expect(hit[1], `${entry.type} ${source}`).toBeCloseTo(b * x + a * y + ty, 5);
    }
  }
});

for (const type of ['guyou', 'gringorten-quincuncial'] as const) {
  test(`${type}: axes, nearby branches, and central-meridian rotation`, () => {
    const map = make(type);
    const rotated = new MapEngine({
      version: 1,
      id: type,
      definition: {type, centralMeridian: 17}
    });
    for (const lon of [0, 1e-6, -1e-6, 90, -90, 90 - 1e-6, 90 + 1e-6, 180]) {
      for (const lat of [-89, -60, -45, -1e-6, 0, 1e-6, 45, 60, 89]) {
        const hit = map.projectPoint([lon, lat])!;
        const inverse = map.unprojectPoint(hit.position, hit.regionId);
        expect(
          inverse.length,
          `${type} ${lon},${lat}; xy=${hit.position}; raw=${map.regions.find(r => r.id === hit.regionId)!.unproject(hit.position)}`
        ).toBe(1);
        const a = geographic([lon, lat]),
          b = geographic(inverse[0].position);
        expect(Math.hypot(...a.map((v, i) => v - b[i]))).toBeLessThan(1e-6);
        const shifted = rotated.projectPoint([lon + 17, lat], hit.regionId)!;
        expect(shifted.position[0], `${type} ${lon},${lat}, ${hit.regionId}`).toBeCloseTo(
          hit.position[0],
          7
        );
        expect(shifted.position[1], `${type} ${lon},${lat}, ${hit.regionId}`).toBeCloseTo(
          hit.position[1],
          7
        );
      }
    }
    expect(
      () =>
        new MapEngine({
          version: 1,
          id: type,
          definition: {type, centralMeridian: NaN}
        })
    ).toThrow();
  });
}

test('interrupted direct inverses avoid nested forward latitude solves', () => {
  for (const type of [
    'interrupted-mollweide',
    'goode',
    'interrupted-sinu-mollweide',
    'interrupted-quartic-authalic'
  ] as const) {
    const map = make(type);
    for (const latitude of [-65, -20, 20, 65]) {
      const hit = map.projectPoint([-120, latitude])!;
      const region = map.regions.find(r => r.id === hit.regionId)!;
      const sin = vi.spyOn(Math, 'sin');
      try {
        const back = region.unproject(hit.position)!;
        expect(back[1]).toBeCloseTo(latitude, 8);
        expect(sin.mock.calls.length).toBeLessThan(10);
      } finally {
        sin.mockRestore();
      }
    }
  }
});
