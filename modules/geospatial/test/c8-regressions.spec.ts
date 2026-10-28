// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original analytic large-vector and spherical-horizon controls.
import {expect, test} from 'vitest';
import {Vector3} from '@math.gl/core';
import {Ellipsoid, EllipsoidTangentPlane, LocalReferenceFrame} from '@math.gl/geospatial';

test('C8 radial lift retains representable surface points at extreme finite tangent coordinates', () => {
  for (const radius of [1e-60, 1, 1e60]) {
    const plane = new EllipsoidTangentPlane([radius, 0, 0], new Ellipsoid(radius, radius, radius));
    const result = plane.projectPointOntoEllipsoid([1e308, 0], 'radial');
    expect(result).toBeDefined();
    expect(Math.abs(result![1] / radius - 1)).toBeLessThan(2e-15);
    expect(result![2]).toBe(0);
  }
});

test('C8 spherical normal lift distinguishes contact, a real miss and a unique grazing root', () => {
  const plane = new EllipsoidTangentPlane([10, 0, 0], new Ellipsoid(10, 10, 10));
  const out = new Vector3(7, 8, 9);
  expect(plane.projectPointOntoEllipsoid([10 + 2 ** -49, 0], 'normal', out)).toBeUndefined();
  expect(Array.from(out)).toEqual([7, 8, 9]);
  expect(Array.from(plane.projectPointOntoEllipsoid([10, 0], 'normal')!)).toEqual([0, 10, 0]);
  const y = 10 - 2 ** -49;
  const expectedX = Math.sqrt((10 - y) * (10 + y));
  const near = plane.projectPointOntoEllipsoid([y, 0], 'normal')!;
  expect(Math.abs(near[0] - expectedX)).toBeLessThan(1e-13);
});

test('C8 frame rotations do not mistake intermediate overflow for an unrepresentable result', () => {
  const ellipsoid = new Ellipsoid(1, 1, 1);
  const frame = new LocalReferenceFrame(ellipsoid.cartographicToCartesian([-160, -70, 0]), {
    ellipsoid
  });
  const matrix = frame.localToFixedMatrix;
  const unit = [-1, -0.8, 0.8],
    scale = 1.6e308;
  const reference = [0, 1, 2].map(
    i => matrix[i] * unit[0] + matrix[i + 4] * unit[1] + matrix[i + 8] * unit[2]
  );
  const result = frame.localToFixedVector(unit.map(x => x * scale));
  for (let i = 0; i < 3; i++)
    expect(Math.abs(result[i] / scale - reference[i])).toBeLessThan(2e-15);
});
