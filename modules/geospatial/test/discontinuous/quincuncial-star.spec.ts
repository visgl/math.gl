// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {MapEngine, type MapDefinition} from '../../src/discontinuous';
import reference from './quincuncial-star-reference.json';
import {add, scale, unit, cross, coordinates, geographic} from '../../src/discontinuous/math';

const make = (definition: MapDefinition, radius = 1) =>
  new MapEngine({version: 1, id: 'test', definition, radius});

test('matches D3 4.0.0 reference coordinates in the documented equatorial aspect', () => {
  for (const entry of reference.cases) {
    const map = make({type: entry.type, lobes: entry.lobes} as MapDefinition);
    for (const {source, expected} of entry.samples) {
      const p = map.projectPoint(source as [number, number])!.position;
      expect(p[0], `${entry.type} ${source}`).toBeCloseTo(expected[0], 7);
      expect(p[1], `${entry.type} ${source}`).toBeCloseTo(expected[1], 7);
    }
  }
});

for (const type of ['peirce-quincuncial', 'berghaus'] as const) {
  test(`${type}: global coverage, inverse, fitting and globe transitions`, () => {
    const map = make({type});
    for (let lon = -177; lon < 180; lon += 19)
      for (let lat = -83; lat < 90; lat += 17) {
        const hit = map.projectPoint([lon, lat])!;
        expect(hit, `${lon},${lat}`).not.toBeNull();
        expect(hit.position.every(Number.isFinite)).toBe(true);
        const inverse = map.unprojectPoint(hit.position, hit.regionId);
        expect(inverse.length, `${lon},${lat}: ${hit.regionId} ${hit.position}`).toBe(1);
        expect(inverse[0].position[0]).toBeCloseTo(lon, 6);
        expect(inverse[0].position[1]).toBeCloseTo(lat, 6);
      }
    expect(map.capabilities.hasCuts).toBe(true);
    expect(map.capabilities.hinged).toBe(false);
    expect(map.planTransitionTo(make({type: 'mercator'})).strategy).toBe('via-globe');
    const globe = map.evaluate({type: 'globe'}).projectPoint([30, 20])!.position;
    expect(Math.hypot(...globe)).toBeCloseTo(1, 12);
    expect(() => map.evaluate({type: 'hinge', amount: 0.5})).toThrow();
    expect(map.getLayout().bounds.every(Number.isFinite)).toBe(true);
    expect(map.unprojectPoint([100, 100])).toEqual([]);
    const scaled = make({type}, 3);
    const p = map.projectPoint([30, 20])!.position;
    const q = scaled.projectPoint([30, 20])!.position;
    expect(q[0]).toBeCloseTo(3 * p[0], 9);
    expect(q[1]).toBeCloseTo(3 * p[1], 9);
  });
  test(`${type}: finite exact chart boundaries, poles and antipode`, () => {
    const map = make({type});
    for (const region of map.regions)
      for (const point of region.boundary) {
        const projected = map.projectPoint(point, region.id)!.position;
        expect(projected.every(Number.isFinite)).toBe(true);
        expect(
          map.unprojectPoint(projected, region.id).length,
          `${region.id}: ${point}; xy=${projected}; inverse=${region.unproject(projected)}`
        ).toBe(1);
      }
    for (const point of [
      [0, 90],
      [0, -90],
      [180, 0],
      [0, 0]
    ] as [number, number][]) {
      expect(map.projectPoint(point)!.position.every(Number.isFinite)).toBe(true);
    }
  });
  test(`${type}: chart-edge interiors remain invertible on either side`, () => {
    const map = make({type});
    for (const region of map.regions) {
      for (let edge = 0; edge < region.boundary.length; edge++) {
        const a = geographic(region.boundary[edge]);
        const b = geographic(region.boundary[(edge + 1) % region.boundary.length]);
        for (const t of [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
          const source = coordinates(unit(add(scale(a, 1 - t), scale(b, t))));
          const hit = map.projectPoint(source, region.id)!;
          const inverse = map.unprojectPoint(hit.position, region.id);
          expect(inverse.length, `${region.id} edge ${edge} t=${t}: ${source}`).toBe(1);
          const expected = geographic(source),
            actual = geographic(inverse[0].position);
          expect(Math.hypot(...actual.map((v, i) => v - expected[i]))).toBeLessThan(1e-7);
        }
      }
    }
    for (const lon of [-90, 90]) {
      const hit = map.projectPoint([lon, -60])!;
      expect(map.unprojectPoint(hit.position, hit.regionId)[0].position[1]).toBeCloseTo(-60, 7);
    }
  });
  test(`${type}: cuts split lines and polygons with holes into closed pieces`, () => {
    const map = make({type});
    const seam = map.seams.find(s => s.kind === 'cut')!;
    const region = map.regions.find(r => r.id === seam.regions[0])!;
    const a = geographic(region.boundary[seam.edges[0]]);
    const b = geographic(region.boundary[(seam.edges[0] + 1) % region.boundary.length]);
    const middle = unit(add(a, b)),
      normal = unit(cross(a, b)),
      along = unit(cross(middle, normal));
    const point = (x: number, y: number) =>
      coordinates(unit(add(middle, add(scale(normal, x), scale(along, y)))));
    const pieces = map.projectLine([point(-0.05, 0), point(0.05, 0)]);
    expect(pieces).toHaveLength(2);
    const p = pieces[0].coordinates.at(-1)!,
      q = pieces[1].coordinates[0];
    expect(Math.hypot(p[0] - q[0], p[1] - q[1])).toBeGreaterThan(0.01);
    const ring = (size: number) => [
      point(-size, -size),
      point(size, -size),
      point(size, size),
      point(-size, size),
      point(-size, -size)
    ];
    const parts = map.projectPolygon([ring(0.08), ring(0.02)]);
    expect(parts.length).toBeGreaterThanOrEqual(2);
    const area = (polygons: typeof parts) =>
      polygons.reduce(
        (total, polygon) =>
          total +
          polygon.coordinates.reduce(
            (sum, ring) =>
              sum +
              ring.slice(1).reduce((a, p, i) => a + ring[i][0] * p[1] - p[0] * ring[i][1], 0) / 2,
            0
          ),
        0
      );
    const filledArea = area(map.projectPolygon([ring(0.08)]));
    expect(area(parts)).toBeGreaterThan(0);
    expect(area(parts)).toBeLessThan(filledArea * 0.99);
    for (const part of parts)
      for (const ring of part.coordinates) {
        expect(ring[0]).toEqual(ring.at(-1));
        expect(ring.flat().every(Number.isFinite)).toBe(true);
      }
    const fitted = map.fit({width: 800, height: 500, padding: 20});
    const hit = map.projectPoint([30, 20])!;
    expect(
      map.pick(fitted, fitted.project(hit.position)).some(p => Math.abs(p.position[0] - 30) < 1e-6)
    ).toBe(true);
    const rotated = make({type, centralMeridian: 37});
    const rotatedHit = rotated.projectPoint([67, 20])!;
    expect(rotatedHit.position[0]).toBeCloseTo(hit.position[0], 8);
    expect(rotatedHit.position[1]).toBeCloseTo(hit.position[1], 8);
    expect(rotated.unprojectPoint(rotatedHit.position)[0].position[0]).toBeCloseTo(67, 7);
  });
}

test('Berghaus front hemisphere has analytic azimuthal distances', () => {
  const map = make({type: 'berghaus'});
  expect(map.projectPoint([60, 0])!.position[0]).toBeCloseTo(Math.PI / 3, 12);
  expect(map.projectPoint([0, 60])!.position[1]).toBeCloseTo(Math.PI / 3, 12);
  for (const lobes of [3, 4, 5, 8, 24])
    expect(make({type: 'berghaus', lobes}).regions).toHaveLength(lobes * 2);
  for (const lobes of [0, 2, 25, 3.5]) expect(() => make({type: 'berghaus', lobes})).toThrow();
  expect(() => make({type: 'peirce-quincuncial', centralMeridian: Infinity})).toThrow();
});
