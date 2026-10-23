// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  DiscontinuousMap,
  createAlbersUsaMap,
  createInterruptedMollweideMap,
  fitMapLayout,
  pickMapLayout,
  getMapLayout,
  type MapRegion
} from '../../src/discontinuous';

const base = (): MapRegion => ({
  id: 'main',
  boundary: [
    [-20, -20],
    [20, -20],
    [20, 20],
    [-20, 20]
  ],
  interior: [0, 0],
  project: ([x, y]) => [x, y],
  unproject: ([x, y]) => [x, y]
});

test('region presentation metadata is validated, snapshotted and immutable', () => {
  const frame: [number, number, number, number] = [-30, -30, 30, 30];
  const layout = {label: 'Main', relativeScale: 1, drawOrder: 2, frame};
  const map = new DiscontinuousMap([{...base(), layout}]);
  frame[0] = -100;
  layout.label = 'Changed';
  expect(map.regions[0].layout?.label).toBe('Main');
  expect(map.regions[0].layout?.frame?.[0]).toBe(-30);
  expect(Object.isFrozen(map.regions[0].layout?.frame)).toBe(true);
  for (const bad of [
    {relativeScale: 0},
    {relativeScale: Infinity},
    {drawOrder: NaN},
    {parentId: 'missing'},
    {parentId: 'main'},
    {frame: [0, 0, -1, 1] as const}
  ])
    expect(() => new DiscontinuousMap([{...base(), layout: bad}])).toThrow();
  expect(
    () =>
      new DiscontinuousMap([
        {...base(), layout: {parentId: 'child'}},
        {...base(), id: 'child', layout: {parentId: 'main'}}
      ])
  ).toThrow();
});

test('layout samples curved boundaries and preserves explicit frames and stable drawing order', () => {
  const map = new DiscontinuousMap([
    {...base(), id: 'front', layout: {drawOrder: 2}},
    {...base(), id: 'back', layout: {drawOrder: 0, frame: [-30, -30, 30, 30]}},
    {...base(), id: 'front2', layout: {drawOrder: 2}}
  ]);
  const layout = getMapLayout(map);
  expect(layout.regions.map(r => r.id)).toEqual(['back', 'front', 'front2']);
  expect(layout.bounds).toEqual([-30, -30, 30, 30]);
  const region = layout.regions[1];
  expect(region.bounds[3]).toBeGreaterThan(20); // Great-circle top edge bows north.
  expect(region.outlines.flat().length).toBeGreaterThan(4);
  expect(Object.isFrozen(layout.regions)).toBe(true);
});

test('viewport fitting respects asymmetric pixel padding and inverts in either Y direction', () => {
  const layout = getMapLayout(createAlbersUsaMap());
  for (const flipY of [false, true]) {
    const fit = fitMapLayout(layout, {
      width: 900,
      height: 600,
      flipY,
      padding: {left: 40, right: 70, top: 80, bottom: 25}
    });
    expect(fit.bounds[0]).toBeGreaterThanOrEqual(40 - 1e-10);
    expect(fit.bounds[2]).toBeLessThanOrEqual(830 + 1e-10);
    expect(fit.bounds[1]).toBeGreaterThanOrEqual((flipY ? 80 : 25) - 1e-10);
    expect(fit.bounds[3]).toBeLessThanOrEqual((flipY ? 575 : 520) + 1e-10);
    for (const region of layout.regions)
      for (const p of region.outlines.flat()) {
        const restored = fit.unproject(fit.project(p));
        expect(restored[0]).toBeCloseTo(p[0], 12);
        expect(restored[1]).toBeCloseTo(p[1], 12);
      }
    expect(fit.regions.map(r => r.layer)).toEqual([0, 1, 2]);
    expect(fit.regions[1].relativeScale).toBe(0.35);
  }
});

test('viewport fitting rejects invalid dimensions and preserves layout ratios under resize and unit changes', () => {
  const map = createAlbersUsaMap();
  const layout = getMapLayout(map);
  for (const opts of [
    {width: 0, height: 1},
    {width: Infinity, height: 1},
    {width: 100, height: 100, padding: 50},
    {width: 100, height: 100, padding: -1}
  ])
    expect(() => fitMapLayout(layout, opts)).toThrow();
  const a = fitMapLayout(layout, {width: 800, height: 400, padding: 20});
  const b = fitMapLayout(getMapLayout(createAlbersUsaMap({radius: 1e6}), {tolerance: 100}), {
    width: 800,
    height: 400,
    padding: 20
  });
  const p = map.projectPoint([-157.8, 21.3])!.position;
  expect(b.project([p[0] * 1e6, p[1] * 1e6])[0]).toBeCloseTo(a.project(p)[0], 3);
  expect(b.project([p[0] * 1e6, p[1] * 1e6])[1]).toBeCloseTo(a.project(p)[1], 3);
  const world = getMapLayout(createInterruptedMollweideMap());
  expect(fitMapLayout(world, {width: 400, height: 800}).bounds.every(Number.isFinite)).toBe(true);
});

test('U.S. inset metadata identifies parent, scale and frames and includes all main Hawaiian islands', () => {
  const map = createAlbersUsaMap();
  const layout = getMapLayout(map);
  expect(layout.regions.filter(r => r.kind === 'inset').map(r => [r.label, r.parentId])).toEqual([
    ['Alaska', 'lower48'],
    ['Hawaii', 'lower48']
  ]);
  for (const point of [
    [-160.2, 21.9],
    [-159.5, 22.1],
    [-157.8, 21.3],
    [-155.6, 19.5],
    [-155.67, 18.91]
  ] as const)
    expect(map.projectPoint(point)?.regionId).toBe('hawaii');
  expect(layout.regions[2].frame).toBeDefined();
});

test('viewport picking returns the visible inset before overlapping lower layers', () => {
  const map = createAlbersUsaMap();
  const fitted = fitMapLayout(getMapLayout(map), {width: 800, height: 500});
  const hawaii = [-157.8, 21.3] as const;
  const xy = fitted.project(map.projectPoint(hawaii, 'hawaii')!.position);
  const candidates = pickMapLayout(map, fitted, xy);
  expect(candidates[0].regionId).toBe('hawaii');
  expect(candidates[0].position[0]).toBeCloseTo(hawaii[0], 5);
  expect(candidates[0].position[1]).toBeCloseTo(hawaii[1], 5);
  expect(pickMapLayout(map, fitted, [-100, -100])).toEqual([]);
});

test('optional U.S. territory insets project and fit all inhabited territories', () => {
  const map = createAlbersUsaMap({includeTerritories: true});
  const cases = [
    ['puertoRico', [-66.1, 18.2]],
    ['virginIslands', [-64.8, 18.34]],
    ['guam', [144.8, 13.45]],
    ['northernMariana', [145.75, 15.2]],
    ['americanSamoa', [-170.7, -14.3]]
  ] as const;
  const fitted = fitMapLayout(getMapLayout(map), {width: 900, height: 600});
  expect(fitted.regions.filter(region => region.kind === 'inset')).toHaveLength(7);
  for (const [id, coordinate] of cases) {
    const point = map.projectPoint(coordinate, id);
    expect(point?.regionId).toBe(id);
    const candidates = pickMapLayout(map, fitted, fitted.project(point!.position));
    expect(candidates.length, id).toBeGreaterThan(0);
    expect(candidates[0].regionId).toBe(id);
  }
});
