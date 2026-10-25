// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {EllipsoidGeodesicExact, GeodesicPolygonExact} from '@math.gl/geospatial/geodesic-exact';
import {qualifyExactArea} from './exact-area-qualification';
for (const row of qualifyExactArea())
  test(`Exact area ${row.mode} ${row.id}`, () =>
    expect(row.passed, JSON.stringify(row)).toBe(true));
for (const b of [0.25, 1, 4])
  test(`Exact polygon contracts ${b}`, () => {
    const axes = {semiMajorAxis: 1, semiMinorAxis: b},
      p = new GeodesicPolygonExact(axes);
    expect(p.compute()).toEqual({number: 0, perimeter: 0, area: 0});
    expect(() => p.addEdge(30, 1)).toThrow();
    p.addPoint(0, 0).addPoint(0, 10);
    const before = p.compute(),
      preview = p.testPoint(90, 0);
    expect(p.compute()).toEqual(before);
    expect(p.number).toBe(2);
    p.addPoint(90, 0);
    expect(p.compute()).toEqual(preview);
    expect(p.compute({reverse: true}).area).toBe(-p.compute().area!);
    const e = new EllipsoidGeodesicExact(axes),
      surface = e.surfaceArea;
    expect(
      Math.abs(p.compute({reverse: true, unsigned: true}).area! + p.compute().area! - surface)
    ).toBeLessThan(5e-14);
    p.clear().addPoint(10, 20);
    const edge = p.testEdge(45, 0.1);
    expect(p.number).toBe(1);
    p.addEdge(45, 0.1);
    expect(p.compute()).toEqual(edge);
    const snapshot = p.compute();
    expect(() => p.addPoint(91, 0)).toThrow();
    expect(p.compute()).toEqual(snapshot);
    expect(() => p.testPoint(0, 0, {longitudeTurns: 1})).toThrow(/winding/);
    expect(p.compute()).toEqual(snapshot);
    const line = new GeodesicPolygonExact(axes, {polyline: true})
      .addPoint(0, 0)
      .addEdge(45, 0.1)
      .addEdge(20, -0.01);
    expect(line.compute().area).toBeUndefined();
    expect(Math.abs(line.compute().perimeter - 0.09)).toBeLessThan(1e-15);
    const options = {area: true, unrollLongitude: true},
      l = e.line(20, 30, 40, options);
    options.area = false;
    const r = l.position(0.1);
    expect(r.S12).toBeTypeOf('number');
    r.S12 = 123;
    expect(l.position(0.1).S12).not.toBe(123);
    expect(e.direct(20, 30, 40, 0.1).S12).toBeUndefined();
  });
test('Exact repeated tiny loops retain a meaningful relative area', () => {
  const b = 0.25,
    d = 1e-7,
    p = new GeodesicPolygonExact({semiMajorAxis: 1, semiMinorAxis: b});
  p.addPoint(0, 0);
  for (let i = 0; i < 1000; i++) p.addPoint(0, d).addPoint(d, 0).addPoint(0, 0);
  const expected = (1000 * b * b * ((d * Math.PI) / 180) ** 2) / 2;
  expect(Math.abs(p.compute().area! - expected)).toBeLessThan(Math.max(1e-27, expected * 2e-8));
});
test('Exact direct winding uses the compensated polygon transit convention', () => {
  const axes = {semiMajorAxis: 1, semiMinorAxis: 2},
    e = new EllipsoidGeodesicExact(axes);
  const p = new GeodesicPolygonExact(axes).addPoint(0, 0).addEdge(90, 2 * Math.PI);
  expect(Math.abs(p.compute().area! - e.surfaceArea / 2)).toBeLessThan(5e-14);
  const l = e.line(30, 20, 40, {area: true});
  expect(Math.abs(l.arcPosition(30).S12! - l.arcPosition(390).S12!)).toBeLessThan(5e-14);
  expect(Math.abs(l.arcPosition(720).S12!)).toBeLessThan(5e-14);
});
