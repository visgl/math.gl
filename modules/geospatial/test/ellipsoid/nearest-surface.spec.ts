// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original controls using independent Decimal references and analytic distance minima.
import {expect, test} from 'vitest';
import {Ellipsoid} from '@math.gl/geospatial';
import fixtures from '../../projection/test/fixtures/interior-reference.json';

for (const row of fixtures.cases) {
  test(`nearest surface: independent Decimal ${row.id}`, () => {
    const ellipsoid = new Ellipsoid(...(row.radii as [number, number, number]));
    const output = [7, 8, 9, 42];
    expect(ellipsoid.scaleToGeodeticSurface(row.xyz, output)).toBe(output);
    const scale = Math.max(...row.radii);
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(output[i] - row.reference.footpoint[i])).toBeLessThanOrEqual(scale * 2e-12);
    }
    expect(
      Math.abs(Math.hypot(...output.slice(0, 3).map((q, i) => q / row.radii[i])) - 1)
    ).toBeLessThan(2e-15);
    expect(output[3]).toBe(42);
    const alias = [...row.xyz];
    expect(ellipsoid.scaleToGeodeticSurface(alias, alias)).toBe(alias);
    expect(alias).toEqual(output.slice(0, 3));
  });
}

test('nearest surface rejects ambiguous minima instead of returning a radial approximation', () => {
  for (const [axes, point] of [
    [
      [1, 2, 3],
      [0, 0.1, 0]
    ],
    [
      [1, 1, 2],
      [0, 0, 0.1]
    ],
    [
      [2, 2, 1],
      [0.1, 0, 0]
    ],
    [
      [1, 2, 3],
      [0, 0, 0]
    ]
  ]) {
    const ellipsoid = new Ellipsoid(...(axes as [number, number, number]));
    const output = [7, 8, 9];
    expect(ellipsoid.scaleToGeodeticSurface(point, output)).toBeUndefined();
    expect(output).toEqual([7, 8, 9]);
    expect(ellipsoid.cartesianToCartographic(point, output)).toBeUndefined();
    expect(output).toEqual([7, 8, 9]);
  }
});

test('nearest surface respects axis permutations and exact exterior cardinal points', () => {
  for (const axes of [
    [1, 2, 3],
    [3, 1, 2],
    [2, 3, 1]
  ]) {
    const ellipsoid = new Ellipsoid(...(axes as [number, number, number]));
    for (let i = 0; i < 3; i++) {
      const point = [0, 0, 0];
      point[i] = -10;
      const expected = [0, 0, 0];
      expected[i] = -axes[i];
      expect(ellipsoid.scaleToGeodeticSurface(point)).toEqual(expected);
    }
  }
});
