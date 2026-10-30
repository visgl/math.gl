// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {cutSphericalPolygon, projectSphericalPolygon, MapEngine} from '../../src/discontinuous';
import {geographic, dot, cross, angle} from '../../src/discontinuous/math';
const area = (r: readonly (readonly [number, number])[]) => {
  const v = r.map(geographic),
    o = v[0];
  let sum = 0;
  for (let i = 1; i < v.length - 1; i++)
    sum +=
      2 *
      Math.atan2(
        dot(o, cross(v[i], v[i + 1])),
        1 + dot(o, v[i]) + dot(v[i], v[i + 1]) + dot(v[i + 1], o)
      );
  return sum;
};
const total = (p: ReturnType<typeof cutSphericalPolygon>) =>
  p.reduce((a, p) => a + p.rings.reduce((a, r) => a + area(r), 0), 0);
const north: [number, number][] = [
  [-135, 0],
  [-45, 0],
  [45, 0],
  [135, 0]
];
test('Global directed hemispheres partition independently of a single chart', () => {
  const left = cutSphericalPolygon([north], {interior: 'left'}),
    right = cutSphericalPolygon([north], {interior: 'right'});
  expect(total(left)).toBeCloseTo(2 * Math.PI, 10);
  expect(total(right)).toBeCloseTo(2 * Math.PI, 10);
  expect(left.flatMap(p => p.rings.flat()).every(p => p[1] >= -1e-9)).toBe(true);
  expect(right.flatMap(p => p.rings.flat()).every(p => p[1] <= 1e-9)).toBe(true);
});
test('A small triangle and its global complement conserve the complete sphere', () => {
  const triangle: [number, number][] = [
    [10, 10],
    [40, 10],
    [20, 40]
  ];
  const small = cutSphericalPolygon([triangle], {interior: 'left'}),
    large = cutSphericalPolygon([triangle], {interior: 'right'});
  expect(total(small)).toBeCloseTo(area(triangle), 10);
  expect(total(small) + total(large)).toBeCloseTo(4 * Math.PI, 10);
  for (const part of [...small, ...large])
    for (let k = 0; k < part.rings.length; k++) {
      expect(part.edges[k]).toHaveLength(part.rings[k].length - 1);
      for (let i = 0; i < part.edges[k].length; i++) {
        const edge = part.edges[k][i],
          a = geographic(part.rings[k][i]),
          b = geographic(part.rings[k][i + 1]);
        if (edge.kind === 'cut') {
          expect(Math.abs(a[edge.axis])).toBeLessThan(2e-12);
          expect(Math.abs(b[edge.axis])).toBeLessThan(2e-12);
        } else {
          const p = geographic(triangle[edge.edgeIndex]),
            q = geographic(triangle[(edge.edgeIndex + 1) % 3]);
          expect(Math.abs(angle(p, a) - angle(p, q) * edge.startFraction)).toBeLessThan(2e-12);
          expect(Math.abs(angle(p, b) - angle(p, q) * edge.endFraction)).toBeLessThan(2e-12);
        }
      }
    }
});
test('Global polygons feed existing interrupted, polyhedral and cap map clipping', () => {
  for (const definition of [
    {type: 'goode'},
    {type: 'air-ocean'},
    {type: 'regional', projection: 'satellite', center: [0, 0], distance: 2}
  ] as const) {
    const map = new MapEngine({version: 1, id: 'test', definition: definition as never});
    const parts = projectSphericalPolygon(map, [north], {
      interior: 'left',
      maxAngularStep: 10,
      tolerance: 0.01
    });
    expect(parts.length).toBeGreaterThan(0);
    for (const p of parts)
      for (const r of p.coordinates) expect(r.flat().every(Number.isFinite)).toBe(true);
  }
});

import {qualifyGlobalCuts} from '../global-cuts-qualification';
for (const row of qualifyGlobalCuts())
  test(`${row.mode} ${row.id}`, () => expect(row.passed, JSON.stringify(row)).toBe(true));
test('Global preparation keeps artificial cut edges out of stroked original outlines', () => {
  const map = new MapEngine({version: 1, id: 'prepared', definition: {type: 'air-ocean'}});
  const input = {type: 'Polygon' as const, coordinates: [[...north, north[0]]]};
  const before = JSON.stringify(input);
  const output = map.prepareFeatures([{id: 'hemisphere', geometry: input}], {
    sphericalCuts: {interior: 'left'},
    sampling: {tolerance: 0.005, maxAngularStep: 10}
  });
  expect(output.polygons.parts.length).toBeGreaterThan(0);
  for (let i = 1; i < output.paths.sourcePositions.length; i += 2)
    expect(Math.abs(output.paths.sourcePositions[i])).toBeLessThan(1e-9);
  expect(JSON.stringify(input)).toBe(before);
  expect(() => map.projectGlobalPolygon([north], {interior: 'left', maxWork: 2})).toThrow(/limit/);
  expect(() => cutSphericalPolygon([north], {interior: 'left', maxVertices: 4})).toThrow(/limit/);
  expect(() =>
    cutSphericalPolygon(
      [
        [
          [0, 0],
          [180, 0],
          [0, 20]
        ]
      ],
      {interior: 'left'}
    )
  ).toThrow(/Antipodal/);
  expect(() => cutSphericalPolygon([north], {interior: 'other'} as never)).toThrow();
});

test('Mercator global hemisphere covers the exact finite-band rectangle', () => {
  for (const radius of [0.001, 1, 1000])
    for (const centralMeridian of [0, 37]) {
      const map = new MapEngine({
        version: 1,
        id: 'mercator',
        radius,
        definition: {type: 'mercator', centralMeridian}
      });
      const parts = map.projectGlobalPolygon([north], {
        interior: 'left',
        tolerance: 0.005 * radius,
        maxAngularStep: 10
      });
      let sum = 0;
      for (const p of parts)
        for (const ring of p.coordinates)
          for (let i = 1; i < ring.length; i++)
            sum += (ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1]) / 2;
      expect(Math.abs(sum / (radius * radius) - 2 * Math.PI * Math.PI)).toBeLessThan(2e-9);
    }
});

test('atlas provenance composes source fractions and suppresses artificial source borders', () => {
  for (const definition of [
    {type: 'goode'},
    {type: 'myriahedral', preset: 'polyconic', columns: 12}
  ] as const) {
    const map = new MapEngine({
      version: 1,
      id: 'atlas-provenance',
      definition: definition as never
    });
    for (const interior of ['left', 'right'] as const) {
      const plain = map.projectGlobalPolygon([north], {
          interior,
          maxAngularStep: 10,
          tolerance: 0.01
        }),
        rich = map.projectGlobalPolygon([north], {
          interior,
          maxAngularStep: 10,
          tolerance: 0.01,
          polygonEdgeProvenance: true
        });
      expect(rich.map(p => p.coordinates)).toEqual(plain.map(p => p.coordinates));
      const kinds = rich.flatMap(p => p.edgeProvenance!.flat().map(e => e.kind));
      expect(kinds).toContain('source-boundary');
      expect(kinds.some(k => k === 'chart-cut' || k === 'continuous-chart-join')).toBe(true);
      for (const polygon of rich)
        polygon.edgeProvenance!.forEach((edges, ring) =>
          edges.forEach((e, i) => {
            if (e.kind === 'source-boundary') {
              expect(e.ring).toBe(0);
              const a = geographic(north[e.segment]),
                b = geographic(north[(e.segment + 1) % north.length]),
                length = angle(a, b);
              for (const endpoint of [0, 1]) {
                const p = geographic(polygon.sourceCoordinates[ring][i + endpoint]);
                expect(angle(a, p)).toBeCloseTo((endpoint ? e.t1 : e.t0) * length, 9);
                expect(Math.abs(dot(cross(a, b), p))).toBeLessThan(1e-10);
              }
            } else {
              expect(e.ring).toBe(0xffffffff);
              expect(e.segment).toBe(0xffffffff);
            }
          })
        );
    }
  }
});
