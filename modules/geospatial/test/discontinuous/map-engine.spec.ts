// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {MapEngine, type MapDescription, type GeographicPosition} from '../../src/discontinuous';

test('Mercator has finite coverage, analytic coordinates and explicit antimeridian sides', () => {
  const map = new MapEngine({
    version: 1,
    id: 'mercator',
    radius: 2,
    definition: {type: 'mercator'}
  });
  const hit = map.projectPoint([30, 45])!;
  expect(hit.position[0]).toBeCloseTo(Math.PI / 3, 10);
  expect(hit.position[1]).toBeCloseTo(2 * Math.log(1 + Math.SQRT2), 10);
  expect(map.unprojectPoint(hit.position, hit.regionId)[0].position[1]).toBeCloseTo(45, 8);
  expect(map.projectPoint([0, 89])).toBeNull();
  expect(map.findRegions([0, 89])).toEqual([]);
  expect(map.unprojectPoint([0, 20])).toEqual([]);
  const line = map.projectLine([
    [170, 20],
    [-170, 20]
  ]);
  expect(line).toHaveLength(2);
  expect(
    line.every(
      part =>
        Math.max(...part.coordinates.map(p => p[0])) -
          Math.min(...part.coordinates.map(p => p[0])) <
        1
    )
  ).toBe(true);
  const layout = map.getLayout();
  for (let i = 0; i < 4; i++)
    expect(layout.bounds[i]).toBeCloseTo((i < 2 ? -1 : 1) * 2 * Math.PI, 6);
  expect(map.capabilities).toMatchObject({
    hasCuts: true,
    disjoint: false,
    hasInsets: false,
    hinged: false
  });
});

test('Mercator clips polar polygons and lines instead of clamping input vertices', () => {
  const map = new MapEngine({
    version: 1,
    id: 'm',
    definition: {type: 'mercator', maxLatitude: 70, centralMeridian: 25}
  });
  const line = map.projectLine([
    [30, 60],
    [30, 80]
  ]);
  expect(line.length).toBeGreaterThan(0);
  expect(line.at(-1)!.sourceCoordinates.at(-1)![1]).toBeCloseTo(70, 8);
  const polygons = map.projectPolygon([
    [
      [30, 65],
      [50, 65],
      [50, 80],
      [30, 80]
    ]
  ]);
  expect(polygons.length).toBeGreaterThan(0);
  for (const polygon of polygons) {
    for (const ring of polygon.sourceCoordinates)
      for (const p of ring) expect(p[1]).toBeLessThanOrEqual(70 + 1e-8);
    for (const ring of polygon.coordinates) expect(ring[0]).toEqual(ring.at(-1));
  }
});

test('Goode uses published land lobe centers and a continuous computational Eurasian split', () => {
  const map = new MapEngine({version: 1, id: 'goode', definition: {type: 'goode'}});
  expect(map.regions).toHaveLength(7);
  for (const center of [-100, 30]) {
    const p = map.projectPoint([center, 20])!;
    expect(p.position[0]).toBeCloseTo((center * Math.PI) / 180, 10);
    expect(p.position[1]).toBeCloseTo((20 * Math.PI) / 180, 10);
  }
  expect(map.projectPoint([30, 60], 'north-1')!.position).toEqual(
    map.projectPoint([30, 60], 'north-2')!.position
  );
  const left = map.projectPoint([-40, 50], 'north-0')!;
  const right = map.projectPoint([-40, 50], 'north-1')!;
  expect(Math.abs(left.position[0] - right.position[0])).toBeGreaterThan(0.5);
  for (const source of [
    [100, 60],
    [-140, -60],
    [0, -20]
  ] as GeographicPosition[]) {
    const hit = map.projectPoint(source)!;
    const inverse = map.unprojectPoint(hit.position, hit.regionId)[0].position;
    expect(inverse[0]).toBeCloseTo(source[0], 7);
    expect(inverse[1]).toBeCloseTo(source[1], 7);
  }
});

test('Albers viewport fits, samples and picks every inset in the same pipeline', () => {
  const map = new MapEngine({
    version: 1,
    id: 'usa',
    definition: {type: 'albers-usa', includeTerritories: true}
  });
  const viewport = map.fit({width: 900, height: 600, padding: 20});
  expect(map.capabilities).toMatchObject({hasInsets: true, disjoint: true, hinged: false});
  expect(map.getSamplingRegions(viewport)).toHaveLength(8);
  for (const source of [
    [-157.8, 21.3],
    [144.8, 13.4],
    [-66.1, 18.4],
    [-96, 38]
  ] as GeographicPosition[]) {
    const hit = map.projectPoint(source)!;
    const pick = map.pick(viewport, viewport.project(hit.position))[0];
    expect(pick.regionId).toBe(hit.regionId);
    expect(pick.position[0]).toBeCloseTo(source[0], 6);
    expect(pick.position[1]).toBeCloseTo(source[1], 6);
  }
});

test('hinge frame preserves panel lengths and converges to placed map coordinates at nonunit radius', () => {
  const map = new MapEngine({
    version: 1,
    id: 'panels',
    radius: 3,
    definition: {type: 'myriahedral', preset: 'polyhedral', solid: 'icosahedron', subdivisions: 0}
  });
  expect(map.capabilities.hinged).toBe(true);
  const flat = map.evaluate({type: 'hinge', amount: 1});
  const middle = map.evaluate({type: 'hinge', amount: 0.4});
  for (const region of map.regions) {
    const p = region.boundary
      .slice(0, 2)
      .map(source => map.projectPoint(source, region.id)!.position);
    const q = p.map(xy => middle.projectPlacedPoint(xy, region.id)!);
    expect(Math.hypot(...q[0].map((v, i) => v - q[1][i]))).toBeCloseTo(
      Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1]),
      7
    );
    const result = flat.projectPlacedPoint(p[0], region.id)!;
    expect(result[0]).toBeCloseTo(p[0][0], 7);
    expect(result[1]).toBeCloseTo(p[0][1], 7);
    expect(result[2]).toBeCloseTo(0, 7);
  }
  const globe = map.evaluate({type: 'globe'}).projectPoint([10, 20])!;
  expect(Math.hypot(...globe.position)).toBeCloseTo(3, 10);
  expect(() => map.evaluate({type: 'hinge', amount: 2})).toThrow();
});

test('a shared renderer can project points, seam-split lines and polygons in map and globe frames', () => {
  for (const definition of [
    {type: 'mercator'},
    {type: 'goode'},
    {type: 'albers-usa'},
    {type: 'myriahedral', preset: 'polyhedral', subdivisions: 0}
  ] as MapDescription['definition'][]) {
    const engine = new MapEngine({version: 1, id: definition.type, definition});
    const ring: GeographicPosition[] = [
      [-110, 30],
      [-90, 30],
      [-90, 40],
      [-110, 40]
    ];
    for (const type of ['map', 'globe'] as const) {
      const frame = engine.evaluate({type});
      const parts = frame.projectPolygon([ring]);
      expect(parts.length).toBeGreaterThan(0);
      expect(frame.projectLine(ring).length).toBeGreaterThan(0);
      expect(frame.projectPoint([-100, 35])).not.toBeNull();
      for (const part of parts)
        for (const points of part.coordinates)
          for (const p of points) {
            expect(p).toHaveLength(3);
            expect(p.every(Number.isFinite)).toBe(true);
            if (type === 'globe') expect(Math.hypot(...p)).toBeCloseTo(1, 10);
          }
    }
  }
});

test('hinge basis selection is independent of output radius', () => {
  const radius = 1e-8;
  const map = new MapEngine({
    version: 1,
    id: 'small',
    radius,
    definition: {type: 'myriahedral', preset: 'polyhedral', subdivisions: 0}
  });
  const p = map.projectPoint([10, 20])!;
  const frame = map.evaluate({type: 'hinge', amount: 1});
  const q = frame.projectPlacedPoint(p.position, p.regionId)!;
  expect(q[0] / radius).toBeCloseTo(p.position[0] / radius, 7);
  expect(q[1] / radius).toBeCloseTo(p.position[1] / radius, 7);
  expect(q[2] / radius).toBeCloseTo(0, 7);
});

test('description snapshots and runtime bindings stay separate; transitions do not compare names', () => {
  const description: MapDescription = {version: 1, id: 'map', definition: {type: 'mercator'}};
  const a = new MapEngine(description);
  description.definition = {type: 'goode'};
  expect(a.description.definition.type).toBe('mercator');
  expect(Object.isFrozen(a.description.definition)).toBe(true);
  const b = new MapEngine(JSON.parse(JSON.stringify(description)));
  expect(a.planTransitionTo(b)).toMatchObject({
    strategy: 'via-globe',
    resplit: true,
    coverage: 'fade-unmatched'
  });
  expect(a.planTransitionTo(a).strategy).toBe('direct');
  expect(() => a.evaluate({type: 'hinge', amount: 0})).toThrow();
  expect(() => new MapEngine({...description, radius: NaN})).toThrow();
  expect(
    () =>
      new MapEngine({
        version: 1,
        id: 'custom',
        definition: {
          type: 'custom',
          charts: [
            {
              id: 'x',
              projection: 'missing',
              boundary: [
                [0, 0],
                [90, 0],
                [0, 90]
              ],
              interior: [30, 30]
            }
          ]
        }
      })
  ).toThrow('Missing projection');
});

test('custom chart bindings scale placements, frames, inverse picking and sampling consistently', () => {
  const description: MapDescription = {
    version: 1,
    id: 'custom',
    radius: 2,
    definition: {
      type: 'custom',
      charts: [
        {
          id: 'local',
          projection: 'degrees',
          boundary: [
            [0, 0],
            [30, 0],
            [0, 30]
          ],
          interior: [10, 10],
          layout: {kind: 'main', frame: [-1, -1, 31, 31]}
        }
      ]
    }
  };
  const map = new MapEngine(description, {
    projections: {
      degrees: {
        project: ([x, y]) => [x, y],
        unproject: ([x, y]) => [x, y]
      }
    }
  });
  for (const value of map.projectPoint([10, 10])!.position) expect(value).toBeCloseTo(20, 10);
  expect(map.getLayout().regions[0].frame).toEqual([-2, -2, 62, 62]);
  const viewport = map.fit({width: 640, height: 640});
  const scales = map.getSamplingRegions(viewport)[0].getPixelScale([10, 10])!;
  expect(scales[0]).toBeCloseTo((20 * 180) / Math.PI, 4);
  expect(scales[1]).toBeCloseTo(scales[0], 4);
  expect(map.pick(viewport, viewport.project([20, 20]))[0].position[0]).toBeCloseTo(10, 10);
  expect(map.getSamplingRegions(viewport)[0].getPixelScale([-20, 0])).toBeNull();
  expect(() => new MapEngine({...description, title: (() => '') as unknown as string})).toThrow(
    'JSON'
  );
});
