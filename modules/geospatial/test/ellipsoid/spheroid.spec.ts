// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original tests of geometry adapters; no upstream implementation or model data copied.
import {expect, test} from 'vitest';
import {Ellipsoid} from '@math.gl/geospatial';
import type {SpheroidParameters} from '@math.gl/core';

test('Ellipsoid spheroid adapters snapshot axes without datum or derived parameters', () => {
  const parameters = {semiMajorAxis: 6378137, semiMinorAxis: 6356752} satisfies SpheroidParameters;
  const ellipsoid = Ellipsoid.fromSpheroid(parameters);
  expect(Array.from(ellipsoid.radii)).toEqual([6378137, 6378137, 6356752]);
  const snapshot = ellipsoid.toSpheroid();
  expect(snapshot).toEqual(parameters);
  expect(snapshot).not.toBe(parameters);
  expect(Object.isFrozen(snapshot)).toBe(true);
  expect(ellipsoid.toSpheroid()).not.toBe(snapshot);
  parameters.semiMajorAxis = 1;
  expect(ellipsoid.radii.x).toBe(6378137);
  expect(() => {
    ellipsoid.radii.x = 1;
  }).toThrow(TypeError);
  expect(snapshot.semiMajorAxis).toBe(6378137);
  expect(ellipsoid.toSpheroid()).toEqual(snapshot);
});

test('Ellipsoid spheroid adapters accept spheres and reject lossy or invalid geometry', () => {
  expect(Ellipsoid.fromSpheroid({semiMajorAxis: 2, semiMinorAxis: 2}).toSpheroid()).toEqual({
    semiMajorAxis: 2,
    semiMinorAxis: 2
  });
  for (const [a, b] of [
    [0, 0],
    [-1, 1],
    [1, 0],
    [1, -1],
    [1, 2],
    [NaN, 1],
    [1, NaN],
    [Infinity, 1],
    [1, Infinity]
  ]) {
    expect(() => Ellipsoid.fromSpheroid({semiMajorAxis: a, semiMinorAxis: b})).toThrow(
      'finite positive axes'
    );
  }
  for (const radii of [
    [1, 2, 1],
    [1, 1, 2],
    [0, 0, 0],
    [1, 1, 0]
  ]) {
    expect(() => new Ellipsoid(...(radii as [number, number, number])).toSpheroid()).toThrow(
      'Spheroid'
    );
  }

  // The existing three-radius constructor still supports triaxial/prolate geometry.
  expect(Array.from(new Ellipsoid(1, 2, 3).radii)).toEqual([1, 2, 3]);
});

test('Ellipsoid geometry caches cannot diverge through public vector mutation', () => {
  const ellipsoid = new Ellipsoid(3, 3, 2);
  const before = ellipsoid.cartographicToCartesian([30, 45, 1]);
  for (const vector of [
    ellipsoid.radii,
    ellipsoid.radiiSquared,
    ellipsoid.radiiToTheFourth,
    ellipsoid.oneOverRadii,
    ellipsoid.oneOverRadiiSquared
  ]) {
    expect(Object.isFrozen(vector)).toBe(true);
    expect(() => {
      vector[0] = 99;
    }).toThrow(TypeError);
    expect(() => {
      vector.z = 99;
    }).toThrow(TypeError);
  }
  expect(ellipsoid.cartographicToCartesian([30, 45, 1])).toEqual(before);
  expect(ellipsoid.toSpheroid()).toEqual({semiMajorAxis: 3, semiMinorAxis: 2});
});
