// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Vector2, Vector3} from '@math.gl/core';
import {Ellipsoid, EllipsoidTangentPlane} from '@math.gl/geospatial/ellipsoid';

function close(actual: ArrayLike<number>, expected: ArrayLike<number>, digits = 10): void {
  for (let i = 0; i < expected.length; i++) expect(actual[i]).toBeCloseTo(expected[i], digits);
}
const plane = new EllipsoidTangentPlane([10, 0, 0], new Ellipsoid(10, 10, 10));

test('Tangent plane distinguishes radial and orthogonal projection analytically', () => {
  close(plane.projectPointToNearestOnPlane([6, 8, 0]), [8, 0]);
  close(plane.projectPointRadiallyOntoPlane([6, 8, 0]), [40 / 3, 0]);
  close(plane.projectPointRadiallyOntoPlane([12, 16, 0]), [40 / 3, 0]);
  const result = new Vector2(7, 8);
  for (const point of [
    [0, 0, 0],
    [0, 10, 0],
    [-6, 8, 0]
  ]) {
    expect(plane.projectPointRadiallyOntoPlane(point, result)).toBeUndefined();
    close(result, [7, 8]);
  }
});

test('Inverse projections choose the near-facing surface and expose normal misses', () => {
  close(plane.projectPointOntoEllipsoid([8, 0], 'normal'), [6, 8, 0]);
  close(plane.projectPointOntoEllipsoid([40 / 3, 0], 'radial'), [6, 8, 0]);
  close(plane.projectPointOntoEllipsoid([0, 0]), [10, 0, 0]);
  close(plane.projectPointOntoEllipsoid([10, 0], 'normal'), [0, 10, 0]);
  const result = new Vector3(1, 2, 3);
  expect(plane.projectPointOntoEllipsoid([11, 0], 'normal', result)).toBeUndefined();
  close(result, [1, 2, 3]);
});

test('Tangent-plane inverse supports three-radius ellipsoids with explicit axis equations', () => {
  const triaxial = new EllipsoidTangentPlane([10, 0, 0], new Ellipsoid(10, 8, 6));
  close(triaxial.projectPointOntoEllipsoid([4, 3], 'radial'), [
    10 / Math.sqrt(1.5),
    4 / Math.sqrt(1.5),
    3 / Math.sqrt(1.5)
  ]);
  close(triaxial.projectPointOntoEllipsoid([4, 3], 'normal'), [Math.sqrt(50), 4, 3]);
});

test('Tangent-plane surface round trips work away from the axes and discard height', () => {
  for (const longitude of [-179, -60, 45, 170]) {
    const origin = Ellipsoid.WGS84.cartographicToCartesian([longitude, 55, 300]);
    const local = new EllipsoidTangentPlane(origin);
    const surface = Ellipsoid.WGS84.cartographicToCartesian([longitude + 0.001, 55.002, 0]);
    const radial = local.projectPointRadiallyOntoPlane(surface);
    close(local.projectPointOntoEllipsoid(radial), surface, 7);
    const normal = local.projectPointToNearestOnPlane(surface);
    close(local.projectPointOntoEllipsoid(normal, 'normal'), surface, 7);
  }
});

test('Packed tangent-plane projection preserves indices and reports failed radial points', () => {
  const input = new Float64Array([6, 8, 0, -6, 8, 0, 0, 10, 0]);
  const output = new Float64Array(6);
  const result = plane.projectPointsFlat(input, 'radial', output);
  expect(result.positions).toBe(output);
  expect(Array.from(result.valid)).toEqual([1, 0, 0]);
  close(output.subarray(0, 2), [40 / 3, 0]);
  expect(Array.from(output.subarray(2)).every(Number.isNaN)).toBe(true);
  expect(Array.from(input)).toEqual([6, 8, 0, -6, 8, 0, 0, 10, 0]);
  close(plane.projectPointsFlat(input).positions, [8, 0, 8, 0, 10, 0]);
  expect(plane.projectPointsFlat([]).valid.length).toBe(0);
});

test('Tangent-plane validation precedes writes and rejects overlapping buffers', () => {
  expect(() => new EllipsoidTangentPlane([0, 0, 0])).toThrow(RangeError);
  const output = new Float64Array([1, 2, 3, 4]);
  expect(() => plane.projectPointsFlat([6, 8, 0, NaN, 0, 0], 'normal', output)).toThrow(RangeError);
  close(output, [1, 2, 3, 4]);
  const shared = new Float64Array(9);
  expect(() => plane.projectPointsFlat(shared, 'normal', shared.subarray(0, 6))).toThrow(
    RangeError
  );
  expect(() => plane.projectPointsFlat([1, 2])).toThrow(RangeError);
  expect(() => plane.projectPointsFlat([1, 2, 3], 'normal', new Float64Array(4))).toThrow(
    RangeError
  );
  expect(() => plane.projectPointOntoEllipsoid([1, Infinity])).toThrow(RangeError);
});

test('Three-radius tangent basis is orthonormal away from symmetry axes', () => {
  const ellipsoid = new Ellipsoid(10, 8, 6);
  const surface = ellipsoid.cartographicToCartesian([40, 35, 0]);
  const local = new EllipsoidTangentPlane(surface, ellipsoid);
  expect(local.xAxis.dot(local.zAxis)).toBeCloseTo(0, 14);
  expect(local.yAxis.dot(local.zAxis)).toBeCloseTo(0, 14);
  expect(local.xAxis.len()).toBeCloseTo(1, 14);
  const normal = new Vector3(surface).add(new Vector3(local.zAxis).scale(3));
  close(local.projectPointToNearestOnPlane(normal), [0, 0]);
  const near = ellipsoid.cartographicToCartesian([40.1, 35.2, 0]);
  close(local.projectPointOntoEllipsoid(local.projectPointToNearestOnPlane(near), 'normal'), near);
  close(local.projectPointOntoEllipsoid(local.projectPointRadiallyOntoPlane(near)), near);
});

test('Batch projection permits disjoint views of a shared buffer', () => {
  const storage = new Float64Array([6, 8, 0, 0, 0]);
  const result = plane.projectPointsFlat(storage.subarray(0, 3), 'normal', storage.subarray(3));
  close(result.positions, [8, 0]);
  expect(Array.from(result.valid)).toEqual([1]);
});

test('Finite radial directions are invariant under overflow and subnormal scaling', () => {
  for (const scale of [Number.MIN_VALUE, 1, 1.3e308])
    close(plane.projectPointRadiallyOntoPlane([scale, scale, 0])!, [10, 0], 13);
});

test('Off-axis normal inversion retains tangent contacts but rejects real misses', () => {
  const p = new EllipsoidTangentPlane([6, 8, 0], new Ellipsoid(10, 10, 10));
  const local = p.projectPointToNearestOnPlane([-8, 6, 0]);
  close(local, [10, 0], 13);
  close(p.projectPointOntoEllipsoid(local, 'normal')!, [-8, 6, 0], 12);
  const result = new Vector3(1, 2, 3);
  expect(p.projectPointOntoEllipsoid([10 + 1e-9, 0], 'normal', result)).toBeUndefined();
  close(result, [1, 2, 3]);
});
