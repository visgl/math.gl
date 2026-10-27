// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original controls using independent Decimal references and analytic distance minima.
import {expect, test} from 'vitest';
import {Ellipsoid} from '@math.gl/geospatial';
import {cartesianToSpheroid} from '@math.gl/core';
import fixtures from '../../projection/test/fixtures/interior-reference.json';
import cuspFixtures from '../../projection/test/fixtures/nearest-cusp-reference.json';

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

for (const [index, row] of cuspFixtures.cases.entries()) {
  test(`nearest surface: conditioned independent cusp ${index}`, () => {
    const ellipsoid = new Ellipsoid(...(row.radii as [number, number, number]));
    const result = ellipsoid.scaleToGeodeticSurface(row.xyz);
    expect(result).toBeDefined();
    const alias = [...row.xyz, 42];
    expect(ellipsoid.scaleToGeodeticSurface(alias, alias)).toBe(alias);
    expect(alias.slice(0, 3)).toEqual(result);
    expect(alias[3]).toBe(42);
    const inverse = ellipsoid.cartesianToCartographic(row.xyz);
    expect(inverse).toBeDefined();
    const longitude = (inverse[0] * Math.PI) / 180,
      latitude = (inverse[1] * Math.PI) / 180;
    const normal = [
      Math.cos(latitude) * Math.cos(longitude),
      Math.cos(latitude) * Math.sin(longitude),
      Math.sin(latitude)
    ];
    expect(Math.hypot(...normal.map((v, i) => v - row.reference.normal[i]))).toBeLessThan(5e-14);
    expect(Math.abs(inverse[2] - row.reference.height)).toBeLessThanOrEqual(
      2e-12 * Math.max(...row.radii)
    );
    if (row.radii[0] === row.radii[1] && row.radii[2] < row.radii[0]) {
      const point = {x: row.xyz[0], y: row.xyz[1], z: row.xyz[2]};
      const shape = {
        semiMajorAxis: row.radii[0],
        semiMinorAxis: row.radii[2],
        eccentricitySquared: 1 - (row.radii[2] / row.radii[0]) ** 2
      };
      expect(cartesianToSpheroid(point, shape)).toBe(true);
      const expectedLatitude = Math.atan2(
        row.reference.normal[2],
        Math.hypot(...row.reference.normal.slice(0, 2))
      );
      if (expectedLatitude === 0) expect(point.y).toBe(0);
      else
        expect(Math.abs((point.y - expectedLatitude) / expectedLatitude)).toBeLessThanOrEqual(
          2e-12
        );
    }
    for (let i = 0; i < 3; i++) {
      const expected = row.reference.footpoint[i];
      if (expected === 0) expect(Math.abs(result[i])).toBe(0);
      else expect(Math.abs((result[i] - expected) / expected)).toBeLessThanOrEqual(2e-12);
    }
  });
}

test('exact unique boundary cusps succeed while ambiguous neighbors reject atomically', () => {
  for (const [axes, point, expected] of [
    [
      [1, 2, 3],
      [0, 1.5, 0],
      [0, 2, 0]
    ],
    [
      [1, 4, 4],
      [0, 2.25, 3],
      [0, 2.4, 3.2]
    ],
    [
      [2, 2, 1],
      [1.5, 0, 0],
      [2, 0, 0]
    ]
  ]) {
    const ellipsoid = new Ellipsoid(...(axes as [number, number, number]));
    const result = [7, 8, 9, 42];
    expect(ellipsoid.scaleToGeodeticSurface(point, result)).toBe(result);
    for (let i = 0; i < 3; i++)
      expect(Math.abs(result[i] - expected[i])).toBeLessThanOrEqual(1e-15);
    expect(result[3]).toBe(42);
    const inside = point.map(v => v * (1 - Number.EPSILON));
    const output = [7, 8, 9];
    expect(ellipsoid.scaleToGeodeticSurface(inside, output)).toBeUndefined();
    expect(output).toEqual([7, 8, 9]);
  }
});

test('deep-interior signed height remains representable when height dot input underflows', () => {
  const ellipsoid = new Ellipsoid(1e-60, 2e-60, 3e-60);
  expect(ellipsoid.cartesianToCartographic([1e-300, 0, 0])).toEqual([0, 0, -1e-60]);
});

test('recovered cusp inverse preserves aliases, M and reentrant output commits', () => {
  const row = cuspFixtures.cases.find(
    row =>
      row.radii[0] === 1 &&
      row.radii[1] === 4 &&
      row.radii[2] === 16 &&
      row.xyz[0] === 1e-120 &&
      row.xyz[1] === 2.25
  )!;
  const ellipsoid = new Ellipsoid(1, 4, 16);
  const normal = row.reference.normal;
  const expected = [
    (Math.atan2(normal[1], normal[0]) * 180) / Math.PI,
    (Math.atan2(normal[2], Math.hypot(normal[0], normal[1])) * 180) / Math.PI,
    row.reference.height
  ];
  const alias = [...row.xyz, 42];
  expect(ellipsoid.cartesianToCartographic(alias, alias)).toBe(alias);
  for (let i = 0; i < 3; i++) expect(Math.abs(alias[i] - expected[i])).toBeLessThan(1e-12);
  expect(alias[3]).toBe(42);
  let longitude = 0;
  const result = {
    get longitude() {
      return longitude;
    },
    set longitude(value: number) {
      longitude = value;
      new Ellipsoid(1, 4, 4).cartesianToCartographic([1e-60, 2.25, 3]);
    },
    latitude: 0,
    height: 0
  };
  expect(ellipsoid.cartesianToCartographic(row.xyz, result as unknown as number[])).toBe(result);
  for (const [actual, value] of [
    [result.longitude, expected[0]],
    [result.latitude, expected[1]],
    [result.height, expected[2]]
  ])
    expect(Math.abs(actual - value)).toBeLessThan(1e-12);
});

test('rounded equatorial radius does not turn an ambiguous interior into a unique cusp', () => {
  const ellipsoid = new Ellipsoid(13, 13, 6.5);
  const shape = {semiMajorAxis: 13, semiMinorAxis: 6.5, eccentricitySquared: 0.75};
  // (3.75,9) has exact radius 9.75, the cusp. One step down in X is
  // strictly inside although binary64 hypot still rounds to 9.75.
  const x = 3.75 - 2 ** -51;
  expect(Math.hypot(x, 9)).toBe(9.75);
  const point = {x, y: 9, z: 0};
  expect(cartesianToSpheroid(point, shape)).toBe(false);
  expect(point).toEqual({x, y: 9, z: 0});
  const output = [7, 8, 9];
  expect(ellipsoid.cartesianToCartographic([x, 9, 0], output)).toBeUndefined();
  expect(output).toEqual([7, 8, 9]);
  expect(ellipsoid.scaleToGeodeticSurface([x, 9, 0], output)).toBeUndefined();
  expect(output).toEqual([7, 8, 9]);
  expect(ellipsoid.scaleToGeodeticSurface([3.75, 9, 0])).toEqual([5, 12, 0]);
});
