// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {MapEngine} from '../../src/discontinuous';
import {worldKernels, type WorldProjection} from '../../src/discontinuous/world-kernels';
import {geographic, type Position} from '../../src/discontinuous/math';
for (const projection of Object.keys(worldKernels) as WorldProjection[])
  test(`world ${projection}: globe coverage and chart-local inverse`, () => {
    const map = new MapEngine({
      version: 1,
      id: projection,
      definition: {type: 'world', projection}
    });
    const check = (source: Position, id?: string) => {
      const p = map.projectPoint(source, id)!;
      expect(p, `${source}`).toBeTruthy();
      expect(p.position.every(Number.isFinite), `${source}`).toBe(true);
      const q = map.unprojectPoint(p.position, p.regionId);
      expect(q.length, `${source} ${p.regionId} ${p.position}`).toBe(1);
      const a = geographic(source),
        b = geographic(q[0].position);
      expect(Math.hypot(...a.map((v, i) => v - b[i])), `${source}`).toBeLessThan(2e-6);
    };
    for (let lon = -173; lon < 180; lon += 29)
      for (let lat = -83; lat < 90; lat += 17) check([lon, lat]);
    for (const r of map.regions) for (const p of r.boundary) check([...p], r.id);
    expect(map.getLayout().bounds.every(Number.isFinite)).toBe(true);
    expect(map.unprojectPoint([1e9, 1e9])).toEqual([]);
  });

import reference from './world-reference.json';
import {createWorldKernel} from '../../src/discontinuous/world-kernels';
for (const [name, samples] of Object.entries(reference.samples))
  test(`world ${name}: independent D3 4.0.0 reference`, () => {
    const kernel = createWorldKernel(name as WorldProjection);
    for (const sample of samples) {
      const p = kernel((sample.source[0] * Math.PI) / 180, (sample.source[1] * Math.PI) / 180);
      expect(Math.hypot(p[0] - sample.position[0], p[1] - sample.position[1])).toBeLessThan(2e-6);
    }
  });

for (const projection of Object.keys(worldKernels) as WorldProjection[])
  test(`world ${projection}: seam-split geometry retains source correspondence`, () => {
    const map = new MapEngine({
      version: 1,
      id: projection,
      definition: {type: 'world', projection}
    });
    const verify = (points: Position[], sources: Position[], id: string) => {
      expect(points.length).toBe(sources.length);
      for (let i = 0; i < points.length; i++) {
        const q = map.projectPoint(sources[i], id)!;
        expect(q).toBeTruthy();
        expect(Math.hypot(q.position[0] - points[i][0], q.position[1] - points[i][1])).toBeLessThan(
          1e-8
        );
      }
    };
    for (const line of map.projectLine([
      [170, 15],
      [-170, 35]
    ]))
      verify(line.coordinates, line.sourceCoordinates, line.regionId);
    for (const ring of [
      [
        [170, 10],
        [-170, 10],
        [-170, 40],
        [170, 40]
      ],
      [
        [10, 75],
        [80, 75],
        [0, 90]
      ]
    ] as Position[][]) {
      const parts = map.projectPolygon([ring]);
      expect(parts.length).toBeGreaterThan(0);
      for (const part of parts)
        for (let i = 0; i < part.coordinates.length; i++) {
          expect(part.coordinates[i][0]).toEqual(part.coordinates[i].at(-1));
          verify(part.coordinates[i], part.sourceCoordinates[i], part.regionId);
        }
    }
  });

test('world parameters and description validation', () => {
  const make = (projection: WorldProjection, parameters = {}) =>
    new MapEngine({
      version: 1,
      id: 'parameters',
      definition: {type: 'world', projection, parameters}
    });
  for (const [name, parameters] of [
    ['bonne', {parallel: 30}],
    ['bottomley', {fraction: 0.8}],
    ['cylindrical-equal-area', {parallel: 45}],
    ['cylindrical-stereographic', {parallel: 30}],
    ['foucaut-sinusoidal', {alpha: 0.8}],
    ['hammer', {coefficient: 3}],
    ['hill', {ratio: 2}],
    ['hufnagel', {a: 0, b: 0}],
    ['hyperelliptical', {alpha: 0.2}],
    ['lagrange', {spacing: 0.7}],
    ['loximuthal', {parallel: 20}],
    ['rectangular-polyconic', {parallel: 30}],
    ['wagner', {inflation: 10}]
  ] as [WorldProjection, Record<string, number>][]) {
    const map = make(name, parameters),
      p = map.projectPoint([23, 37])!;
    const q = map.unprojectPoint(p.position, p.regionId)[0];
    expect(q.position[0]).toBeCloseTo(23, 5);
    expect(q.position[1]).toBeCloseTo(37, 5);
  }
  expect(() => make('aitoff', {parallel: 30})).toThrow(/Unsupported/);
  expect(() => make('lagrange', {spacing: 2})).toThrow(/Invalid/);
  expect(() => make('lagrange', {spacing: 1})).toThrow(/antipodal clip/);
  expect(() => make('hammer', {coefficient: 1})).toThrow(/antipodal clip/);
  expect(() => make('bonne', {parallel: NaN})).toThrow();
  expect(() => make('constructor' as WorldProjection)).toThrow(/Unknown/);
});

for (const [name, samples] of Object.entries(reference.aspects))
  test(`world ${name}: D3 native oblique aspect`, () => {
    const map = new MapEngine({
      version: 1,
      id: name,
      definition: {type: 'world', projection: name as WorldProjection}
    });
    for (const sample of samples) {
      const p = map.projectPoint(sample.source as Position)!;
      expect(
        Math.hypot(p.position[0] - sample.position[0], p.position[1] - sample.position[1])
      ).toBeLessThan(2e-6);
    }
  });
