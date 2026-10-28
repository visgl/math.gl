// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {
  isLand,
  landArc,
  oceanWeight
} from '../../../../examples/geometry/unfolding-polyhedron/geography';
import {createDymaxion} from '../../../../examples/geometry/unfolding-polyhedron/dymaxion';
import {createCutLayout} from '../../../../examples/geometry/unfolding-polyhedron/cut-layout';
import {createLayout} from '../../../../examples/geometry/unfolding-polyhedron/layout';
import {createSolid, type Vec3} from '../../../../examples/geometry/unfolding-polyhedron/polyhedra';

const point = (lon: number, lat: number): Vec3 => {
  lon *= Math.PI / 180;
  lat *= Math.PI / 180;
  return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
};
describe('geography-aware cut selection', () => {
  it('classifies continental interiors, deserts, ice, oceans and wrapped longitude', () => {
    for (const [lon, lat] of [
      [10, 50],
      [-100, 40],
      [-60, -5],
      [20, 22],
      [135, -25],
      [0, -89]
    ])
      expect(isLand(lon, lat)).toBe(true);
    for (const [lon, lat] of [
      [-140, 0],
      [-30, 0],
      [80, -35],
      [179.9, 0],
      [-179.9, 0]
    ])
      expect(isLand(lon, lat)).toBe(false);
    expect(isLand(370, 50)).toBe(isLand(10, 50));
  });
  it('samples the minor arc across the date line and accounts for polar land', () => {
    expect(landArc(point(179, 0), point(-179, 0))).toBe(0);
    expect(landArc(point(-5, -85), point(5, -85))).toBeGreaterThan(0);
    expect(landArc(point(-100, 35), point(-100, 45))).toBeCloseTo(Math.PI / 18, 6);
    expect(landArc(point(0, 0), point(0, 0))).toBe(0);
    expect(oceanWeight(0.01, -2, 320)).toBeGreaterThan(oceanWeight(0, 0.25, 320));
  });
  it('reduces land cuts on identical subdivided meshes and keeps a valid deterministic tree', () => {
    for (const level of [0, 1, 2, 3]) {
      const mesh = createSolid('icosahedron', level);
      const original = createCutLayout(mesh, 1, 'legacy');
      const ocean = createCutLayout(mesh, 1, 'ocean');
      expect(ocean.cutLandKm).toBeLessThan(original.cutLandKm);
      expect(ocean.baselineLandKm).toBe(original.cutLandKm);
      expect(ocean.edges.filter(e => e.hinge)).toHaveLength(mesh.faces.length - 1);
      const flat = ocean.evaluate(1).flat();
      expect(Math.max(...flat.map(p => Math.abs(p[2])))).toBeLessThan(1e-8);
      expect(createCutLayout(mesh, 1, 'ocean').edges).toEqual(ocean.edges);
    }
  });
  it('preserves the original strategy exactly', () => {
    const mesh = createSolid('icosahedron', 1);
    expect(createCutLayout(mesh, 7, 'legacy').edges).toEqual(createLayout(mesh, 7).edges);
  });
});

describe('AirOcean cut preset', () => {
  it('forms a closed 24-panel mesh with a non-overlapping flat net', () => {
    const {mesh, joins} = createDymaxion();
    const layout = createLayout(mesh, 1, {joins});
    expect(mesh.vertices).toHaveLength(14);
    expect(mesh.faces).toHaveLength(24);
    expect(layout.edges).toHaveLength(36);
    expect(layout.edges.filter(e => e.hinge)).toHaveLength(23);
    expect(layout.overlaps).toBe(0);
    expect(
      Math.max(
        ...layout
          .evaluate(1)
          .flat()
          .map(p => Math.abs(p[2]))
      )
    ).toBeLessThan(1e-8);
    const again = createLayout(mesh, 99, {joins});
    expect(again.edges.filter(e => e.hinge).map(e => [e.a, e.b])).toEqual(
      layout.edges.filter(e => e.hinge).map(e => [e.a, e.b])
    );
  });
  it('orients the prescribed net to avoid major land cuts', () => {
    const layout = createCutLayout(createSolid('icosahedron'), 1, 'dymaxion');
    expect(layout.cutLandKm).toBeLessThan(layout.baselineLandKm * 0.2);
  });
});
