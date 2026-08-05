// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {test, expect} from 'vitest';

import {_MathUtils, Vector3, Matrix4, equals} from '@math.gl/core';
import {Plane, Ray} from '@math.gl/culling';

const UNIT_X = [1, 0, 0];
const UNIT_Y = [0, 1, 0];
// const UNIT_Z = [0, 0, 1];

test('Plane#constructs', () => {
  const normal = UNIT_X;
  const distance = 1.0;
  const plane = new Plane(normal, distance);
  expect(equals(plane.normal, normal)).toBe(true);
  expect(equals(plane.distance, distance)).toBe(true);
});

test('Plane#constructor throws without a normal', () => {
  expect(() => new Plane(null, 0.0)).toThrow();
});

test.skip('Plane#constructor throws if normal is not normalized', () => {
  expect(() => new Plane(new Vector3(1.0, 2.0, 3.0), 0.0)).toThrow();
});

test('Plane#constructor throws without a distance', () => {
  expect(() => new Plane(UNIT_X, null)).toThrow();
});

test('Plane#constructs from a point and a normal', () => {
  const normal = new Vector3(1.0, 2.0, 3.0).normalize();
  const point = new Vector3(4.0, 5.0, 6.0);
  const plane = new Plane().fromPointNormal(point, normal);
  expect(equals(plane.normal, normal)).toBe(true);
  expect(equals(plane.distance, -normal.dot(point))).toBe(true);
});

test('Plane#constructs from a point and a normal with result', () => {
  const normal = new Vector3(1.0, 2.0, 3.0).normalize();
  const point = new Vector3(4.0, 5.0, 6.0);

  const plane = new Plane().fromPointNormal(point, normal);

  expect(equals(plane.normal, normal)).toBe(true);
  expect(equals(plane.distance, -normal.dot(point))).toBe(true);
});

test('Plane#constructs from coefficents without result', () => {
  const result = new Plane().fromCoefficients(1, 0, 0, 0);

  expect(equals(result.normal, UNIT_X)).toBe(true);
  expect(equals(result.distance, 0.0)).toBe(true);
});

test('Plane#constructs from coefficents with result', () => {
  const result = new Plane().fromCoefficients(1, 0, 0, 0);

  expect(equals(result.normal, UNIT_X)).toBe(true);
  expect(equals(result.distance, 0.0)).toBe(true);
});

test('Plane#fromPointNormal throws without a point', () => {
  expect(() => new Plane().fromPointNormal(undefined, UNIT_X)).toThrow();
});

test('Plane#fromPointNormal throws without a normal', () => {
  expect(() => new Plane().fromPointNormal(UNIT_X, undefined)).toThrow();
});

test.skip('Plane#fromPointNormal throws if normal is not normalized', () => {
  expect(() => new Plane().fromPointNormal(Vector3.ZERO, Vector3.ZERO)).toThrow();
});

test('Plane#fromCoefficients throws without coefficients', () => {
  // @ts-expect-error
  expect(() => new Plane().fromCoefficients(undefined)).toThrow();
});

test('Plane#fromCoefficients throws if normal is not normalized', () => {
  expect(() => new Plane().fromCoefficients(1.0, 2.0, 3.0, 4.0)).toThrow();
});

test('Plane#gets the distance to a point', () => {
  const normal = new Vector3(1.0, 2.0, 3.0).normalize();
  const plane = new Plane(normal, 12.34);
  const point = new Vector3(4.0, 5.0, 6.0);

  expect(equals(plane.getPointDistance(point), plane.normal.dot(point) + plane.distance)).toBe(
    true
  );
});

test('Plane#getPointDistance throws without a plane', () => {
  const point = Vector3.ZERO;
  // @ts-expect-error
  expect(() => new Plane().getPointDistance(undefined, point)).toThrow();
});

test('Plane#getPointDistance throws without a point', () => {
  // const plane = new Plane(UNIT_X, 0.0);
  expect(() => new Plane().getPointDistance(undefined)).toThrow();
});

test('Plane#projects a point onto the plane', () => {
  const point = new Vector3(1.0, 1.0, 0.0);

  let plane = new Plane(UNIT_X, 0.0);
  let result = plane.projectPointOntoPlane(point);
  expect(equals(result, new Vector3(0.0, 1.0, 0.0))).toBe(true);

  plane = new Plane(UNIT_Y, 0.0);
  result = plane.projectPointOntoPlane(point);
  expect(equals(result, new Vector3(1.0, 0.0, 0.0))).toBe(true);
});

test('Plane#projectPointOntoPlane uses result parameter', () => {
  const point = new Vector3(1.0, 1.0, 0.0);

  const plane = new Plane(UNIT_X, 0.0);
  const result = new Vector3();
  const returnedResult = plane.projectPointOntoPlane(point, result);
  expect(result).toBe(returnedResult);
  expect(equals(result, new Vector3(0.0, 1.0, 0.0))).toBe(true);
});

test('Plane#projectPointOntoPlane requires the point parameter', () => {
  expect(() => new Plane(UNIT_X, 0).projectPointOntoPlane(undefined)).toThrow();
});

test('Plane#intersectWithRay returns the forward intersection without mutating the ray', () => {
  const plane = new Plane(UNIT_X, -2);
  const ray = new Ray(new Vector3(0, 1, 0), new Vector3(1, 0, 0));
  const originalOrigin = ray.origin.clone();
  const originalDirection = ray.direction.clone();
  const result = new Vector3();

  const returnedResult = plane.intersectWithRay(ray, result);

  expect(returnedResult, 'returns the supplied result').toBe(result);
  expect(equals(result, [2, 1, 0])).toBe(true);
  expect(equals(ray.origin, originalOrigin), 'does not mutate the ray origin').toBe(true);
  expect(equals(ray.direction, originalDirection), 'does not mutate the ray direction').toBe(true);
});

test('Plane#intersectWithRay returns undefined for parallel or backward rays', () => {
  const plane = new Plane(UNIT_X, -2);
  expect(
    plane.intersectWithRay(new Ray(new Vector3(0, 0, 0), new Vector3(0, 1, 0))),
    'parallel ray'
  ).toBe(undefined);
  expect(
    plane.intersectWithRay(new Ray(new Vector3(0, 0, 0), new Vector3(-1, 0, 0))),
    'ray points away from plane'
  ).toBe(undefined);
});

test('Plane#clones a plane instance', () => {
  const normal = new Vector3(1.0, 2.0, 3.0).normalize();
  const distance = 4.0;
  const plane = new Plane(normal, distance);

  const result = plane.clone();
  expect(equals(result.normal, normal)).toBe(true);
  expect(equals(result.distance, distance)).toBe(true);
});

test('Plane#equals returns true only if two planes are equal by normal and distance', () => {
  const left = new Plane(UNIT_X, 0.0);
  let right = new Plane(UNIT_Y, 1.0);

  expect(left.equals(right)).toBe(false);

  right = new Plane(UNIT_Y, 0.0);

  expect(left.equals(right)).toBe(false);

  right = new Plane(UNIT_X, 0.0);

  expect(left.equals(right)).toBe(true);

  right = new Plane(UNIT_X, 1.0);

  expect(left.equals(right)).toBe(false);
});

test('Plane#equals throws is right is undefined', () => {
  const plane = new Plane(UNIT_X, 0.0);
  expect(() => plane.equals(undefined)).toThrow();
});

test('Plane#transforms a plane according to a transform', () => {
  const normal = new Vector3(1.0, 2.0, 3.0).normalize();
  const plane = new Plane(normal, 12.34);

  const transform = new Matrix4().scale(2.0).rotateY(Math.PI);

  const transformedPlane = plane.clone().transform(transform);

  expect(equals(transformedPlane.distance, plane.distance * 2.0)).toBe(true);
  expect(
    equals(transformedPlane.normal, [-normal.x, normal.y, -normal.z]),
    'epsilon:' + _MathUtils.EPSILON10
  ).toBe(true);
});

test('Plane#transform throws without a transform', () => {
  const plane = new Plane(UNIT_X, 0.0);
  expect(() => plane.transform(undefined)).toThrow();
});
