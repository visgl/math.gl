// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {inRing} from '../../src/discontinuous/elastic/geometry';
import {MapEngine} from '../../src/discontinuous';
import {elasticI, elasticII, elasticIII} from '../../src/elastic';
const maps = [elasticI, elasticII, elasticIII].map(
  data => new MapEngine({version: 1, id: data.name, definition: {type: 'elastic', data}})
);
const world = new MapEngine({
  version: 1,
  id: 'world',
  definition: {type: 'world', projection: 'sinusoidal'}
});
for (const [source, target] of [
  [maps[0], maps[1]],
  [maps[1], maps[2]],
  [maps[2], world]
]) {
  test(`morph ${source.description.id} to ${target.description.id}`, () => {
    const transition = source.createTransitionTo(target);
    expect(transition.strategy).toBe('direct');
    const line = transition.prepareLine([
      [-170, 30],
      [0, 45],
      [170, 30]
    ]);
    const polygon = transition.preparePolygon([
      [
        [-40, 20],
        [40, 20],
        [40, 60],
        [-40, 60]
      ]
    ]);
    for (const geometry of [line, polygon]) {
      expect(geometry.parts.length).toBeGreaterThan(0);
      const start = geometry.evaluate(0),
        end = geometry.evaluate(1),
        mid = geometry.evaluate(0.5);
      geometry.parts.forEach((part, k) => {
        expect(part.sourceRegionId).toBeTruthy();
        expect(part.targetRegionId).toBeTruthy();
        part.from.forEach((ring, j) =>
          ring.forEach((p, i) => {
            expect(start[k].coordinates[j][i]).toEqual([...p, 0]);
            expect(end[k].coordinates[j][i]).toEqual([...part.to[j][i], 0]);
            expect(mid[k].coordinates[j][i]).toEqual([
              (p[0] + part.to[j][i][0]) / 2,
              (p[1] + part.to[j][i][1]) / 2,
              0
            ]);
            expect(mid[k].coordinates[j][i].every(Number.isFinite)).toBe(true);
          })
        );
      });
    }
    const p: [number, number] = [-74, 40.7];
    expect(transition.projectPoint(p, 0)).toEqual([...source.projectPoint(p)!.position, 0]);
    expect(transition.projectPoint(p, 1)).toEqual([...target.projectPoint(p)!.position, 0]);
  });
}
test('regional coverage routes through globe and invalid parameters fail', () => {
  const regional = new MapEngine({version: 1, id: 'usa', definition: {type: 'albers-usa'}});
  const transition = maps[0].createTransitionTo(regional);
  expect(transition.strategy).toBe('via-globe');
  expect(() => maps[0].createTransitionTo(regional, {strategy: 'direct'})).toThrow(/coverage/);
  expect(() => transition.projectPoint([0, 0], NaN)).toThrow();
  expect(() =>
    transition
      .prepareLine([
        [0, 0],
        [10, 0]
      ])
      .evaluate(2)
  ).toThrow();
});

test('whole-world octants can be prepared across both Elastic cut layouts', () => {
  const transition = maps[0].createTransitionTo(maps[1]);
  for (let lon = -180; lon < 180; lon += 90)
    for (const ring of [
      [
        [lon, 0],
        [lon + 90, 0],
        [lon + 45, 90]
      ],
      [
        [lon + 90, 0],
        [lon, 0],
        [lon + 45, -90]
      ]
    ])
      expect(transition.preparePolygon([ring as [number, number][]]).parts.length).toBeGreaterThan(
        0
      );
});

test('globe route crossfades coverage on the sphere without jumping at the midpoint', () => {
  const transition = maps[0].createTransitionTo(maps[1], {strategy: 'via-globe'});
  const geometry = transition.prepareLine([
    [-74, 40.7],
    [-70, 40]
  ]);
  for (const t of [0.4, 0.5, 0.6]) {
    const frames = geometry.evaluate(t);
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames)
      for (const ring of frame.coordinates)
        for (const p of ring) expect(Math.hypot(...p)).toBeCloseTo(1, 10);
    if (t === 0.5) for (const frame of frames) expect(frame.opacity).toBeCloseTo(0.5, 10);
  }
  expect(geometry.evaluate(0).every(p => p.sourceRegionId && !p.targetRegionId)).toBe(true);
  expect(geometry.evaluate(1).every(p => p.targetRegionId && !p.sourceRegionId)).toBe(true);
});
test('missing interpolation cells prevent automatic direct morphs', () => {
  const data = {
    version: 1 as const,
    name: 'hole',
    radius: 1,
    sections: [
      {
        id: 'a',
        rows: 3,
        columns: 5,
        boundary: [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90],
          [-180, -90]
        ] as [number, number][],
        values: Array.from({length: 15}, (_, i) =>
          i === 7 ? [null, null] : [-180 + (i % 5) * 90, -90 + Math.floor(i / 5) * 90]
        ).flat()
      }
    ]
  };
  const incomplete = new MapEngine({version: 1, id: 'hole', definition: {type: 'elastic', data}});
  expect(maps[0].createTransitionTo(incomplete).strategy).toBe('via-globe');
});
test('direct polygons retain holes and immutable endpoint correspondence', () => {
  const geometry = maps[0].createTransitionTo(world).preparePolygon([
    [
      [-35, 20],
      [-5, 20],
      [-5, 50],
      [-35, 50]
    ],
    [
      [-25, 30],
      [-25, 40],
      [-15, 40],
      [-15, 30]
    ]
  ]);
  const covered = (point: [number, number]) =>
    geometry.parts.some(
      p =>
        inRing(point, p.sourceCoordinates[0]) &&
        !p.sourceCoordinates.slice(1).some(r => inRing(point, r))
    );
  expect(covered([-20, 35])).toBe(false);
  expect(covered([-30, 25])).toBe(true);
  expect(Object.isFrozen(geometry.parts)).toBe(true);
  expect(Object.isFrozen(geometry.parts[0].from[0][0])).toBe(true);
  const frame = geometry.evaluate(0);
  frame[0].coordinates[0][0][0] = 999;
  expect(geometry.evaluate(0)[0].coordinates[0][0][0]).not.toBe(999);
});

test('common polygon refinement covers the world once, including rotated target cuts', () => {
  const targets = [
    ...maps,
    ...(['sinusoidal', 'mollweide', 'robinson'] as const).map(
      projection =>
        new MapEngine({
          version: 1,
          id: projection,
          definition: {type: 'world', projection, centralMeridian: -120}
        })
    )
  ];
  const area = (ring: readonly (readonly [number, number])[]) =>
    Math.abs(
      ring.reduce((sum, p, i) => {
        const q = ring[(i + 1) % ring.length];
        return sum + p[0] * q[1] - q[0] * p[1];
      }, 0) / 2
    );
  for (const target of targets) {
    const transition = maps[0].createTransitionTo(target);
    let sum = 0;
    for (let lon = -180; lon < 180; lon += 90)
      for (const ring of [
        [
          [lon, 0],
          [lon + 90, 0],
          [lon + 45, 90]
        ],
        [
          [lon + 90, 0],
          [lon, 0],
          [lon + 45, -90]
        ]
      ])
        for (const part of transition.preparePolygon([ring as [number, number][]]).parts)
          sum +=
            area(part.sourceCoordinates[0]) -
            part.sourceCoordinates.slice(1).reduce((s, r) => s + area(r), 0);
    expect(sum, target.description.id).toBeCloseTo(360 * 180, 5);
  }
});

test('same-engine direct transitions retain overlapping charts without moving copies', () => {
  const map = new MapEngine(
    {
      version: 1,
      id: 'overlap',
      definition: {
        type: 'custom',
        charts: [0, 100].map(x => ({
          id: `chart-${x}`,
          projection: 'degrees',
          boundary: [
            [0, 0],
            [30, 0],
            [0, 30]
          ],
          interior: [10, 10],
          placement: [1, 0, 0, 1, x, 0]
        }))
      }
    },
    {projections: {degrees: {project: ([x, y]) => [x, y], unproject: ([x, y]) => [x, y]}}}
  );
  const transition = map.createTransitionTo(map);
  for (const geometry of [
    transition.prepareLine([
      [5, 5],
      [10, 10]
    ]),
    transition.preparePolygon([
      [
        [5, 5],
        [10, 5],
        [5, 10]
      ]
    ])
  ]) {
    expect(geometry.parts).toHaveLength(2);
    for (const part of geometry.parts) {
      expect(part.sourceRegionId).toBe(part.targetRegionId);
      expect(part.from).toEqual(part.to);
    }
    expect(geometry.evaluate(0.5)).toEqual(geometry.evaluate(0));
    expect(geometry.evaluate(1)).toEqual(geometry.evaluate(0));
  }
});
