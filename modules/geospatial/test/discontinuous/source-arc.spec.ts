// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {clipSourceArc} from '../../src/discontinuous/elastic/source-arc';
import {rectangle} from '../../src/discontinuous/elastic/geometry';
import {sourceArc} from '../../src/discontinuous/source-arc';

test('derivative isolation finds a narrow double crossing between fixed source probes', () => {
  const a: [number, number] = [-1.3, 30],
    b: [number, number] = [0.7, 30];
  // Independent great-circle apex formula for equal-latitude endpoints.
  const apex = (Math.atan(Math.tan(Math.PI / 6) / Math.cos(Math.PI / 180)) * 180) / Math.PI;
  const domain = [rectangle(-0.4, apex - 1e-7, -0.2, apex + 1e-7)];
  const parts = clipSourceArc(a, b, domain);
  expect(parts.length).toBeGreaterThan(0);
  expect(parts[0].a[0]).toBeLessThan(-0.3);
  expect(parts[parts.length - 1].b[0]).toBeGreaterThan(-0.3);
  expect(parts[0].a[1]).toBeCloseTo(apex - 1e-7, 9);
  expect(parts[parts.length - 1].b[1]).toBeCloseTo(apex - 1e-7, 9);
  const reverse = clipSourceArc(b, a, domain);
  expect(reverse[0].a[0]).toBeCloseTo(parts[parts.length - 1].b[0], 9);
});
test('coincident equator constraints and directional longitude sides remain bounded', () => {
  const result = clipSourceArc([-10, 0], [10, 0], [rectangle(-5, 0, 5, 10)]);
  expect(result.length).toBeGreaterThan(0);
  expect(result[0].a[0]).toBeCloseTo(-5, 9);
  expect(result[result.length - 1].b[0]).toBeCloseTo(5, 9);
  expect(sourceArc([180, 30], [170, 35])(0.5)[0]).toBeGreaterThan(170);
  expect(sourceArc([-180, 30], [-170, 35])(0.5)[0]).toBeLessThan(-170);
});

test('source arc endpoints retain the directional meridian limit at exact poles', () => {
  expect(sourceArc([-160, -89], [-163.3, -90])(1)).toEqual([-160, -90]);
  expect(sourceArc([37, 90], [40, 89])(0)).toEqual([40, 90]);
  expect(sourceArc([-180, -90], [-90, -90])(0.5)).toEqual([-135, -90]);
  expect(sourceArc([170, 89], [-160, 90])(0.99)[0]).toBeCloseTo(170, 8);
});

test('nearly coincident meridians use their conserved longitude speed bound', () => {
  const a: [number, number] = [79.99999999999069, 52.50000000000001],
    b: [number, number] = [79.99999999999172, 53.4375];
  const parts = clipSourceArc(a, b, [rectangle(80, 0, 100, 90)]);
  expect(parts.length).toBeGreaterThan(0);
  for (const point of parts.flatMap(part => [part.a, part.b])) {
    expect(Math.abs(point[0] - 80)).toBeLessThan(1e-8);
  }
});
