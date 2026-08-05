// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// @ts-nocheck

import {test, expect} from 'vitest';

import {_PerspectiveFrustum as PerspectiveFrustum} from '@math.gl/culling';
import {Vector2, Vector3, Vector4, Matrix4, _MathUtils, equals} from '@math.gl/core';

const VECTOR3_UNIT_Y = Object.freeze(new Vector3(0, 1, 0));
const VECTOR3_UNIT_Z = Object.freeze(new Vector3(0, 0, 1));

function beforeEachTest() {
  const frustum = new PerspectiveFrustum({
    near: 1.0,
    far: 2.0,
    aspectRatio: 1.0,
    fov: Math.PI / 3
  });

  const planes = frustum.computeCullingVolume(
    new Vector3(),
    new Vector3().copy(VECTOR3_UNIT_Z).negate(),
    VECTOR3_UNIT_Y
  ).planes;

  return {frustum, planes};
}

test('PerspectiveFrustum#constructs', () => {
  const options = {
    fov: 1.0,
    aspectRatio: 2.0,
    near: 3.0,
    far: 4.0,
    xOffset: 5.0,
    yOffset: 6.0
  };

  const f = new PerspectiveFrustum(options);
  expect(f.fov).toBe(options.fov);
  expect(f.aspectRatio).toBe(options.aspectRatio);
  expect(f.near).toBe(options.near);
  expect(f.far).toBe(options.far);
  expect(f.xOffset).toBe(options.xOffset);
  expect(f.yOffset).toBe(options.yOffset);
});

test('PerspectiveFrustum#default constructs', () => {
  const f = new PerspectiveFrustum();
  expect(f.fov === undefined).toBeTruthy();
  expect(f.aspectRatio === undefined).toBeTruthy();
  expect(f.near).toBe(1.0);
  expect(f.far).toBe(500000000.0);
  expect(f.xOffset).toBe(0.0);
  expect(f.yOffset).toBe(0.0);
});

test('PerspectiveFrustum#out of range fov causes an exception', () => {
  const {frustum} = beforeEachTest();
  frustum.fov = -1.0;
  expect(() => frustum.projectionMatrix).toThrow();

  frustum.fov = _MathUtils.TWO_PI;

  expect(() => frustum.projectionMatrix).toThrow();
});

test('PerspectiveFrustum#negative aspect ratio throws an exception', () => {
  const {frustum} = beforeEachTest();
  frustum.aspectRatio = -1.0;
  expect(() => frustum.projectionMatrix).toThrow();
});

test('PerspectiveFrustum#out of range near plane throws an exception', () => {
  const {frustum} = beforeEachTest();
  frustum.near = -1.0;
  expect(() => frustum.projectionMatrix).toThrow();
});

test('PerspectiveFrustum#negative far plane throws an exception', () => {
  const {frustum} = beforeEachTest();
  frustum.far = -1.0;
  expect(() => frustum.projectionMatrix).toThrow();
});

test('PerspectiveFrustum#computeCullingVolume with no position throws an exception', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.computeCullingVolume()).toThrow();
});

test('PerspectiveFrustum#computeCullingVolume with no direction throws an exception', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.computeCullingVolume([0, 0, 0])).toThrow();
});

test('PerspectiveFrustum#computeCullingVolume with no up throws an exception', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.computeCullingVolume([0, 0, 0], [0, 0, 0])).toThrow();
});

test('PerspectiveFrustum#get frustum left plane', () => {
  const {planes} = beforeEachTest();
  const leftPlane = planes[0];
  const expectedResult = new Vector4(Math.sqrt(3.0) / 2.0, 0.0, -0.5, 0.0);
  equals(leftPlane, expectedResult, _MathUtils.EPSILON14);
});

test('PerspectiveFrustum#get frustum right plane', () => {
  const {planes} = beforeEachTest();
  const rightPlane = planes[1];
  const expectedResult = new Vector4(-Math.sqrt(3.0) / 2.0, 0.0, -0.5, 0.0);
  equals(rightPlane, expectedResult, _MathUtils.EPSILON14);
});

test('PerspectiveFrustum#get frustum bottom plane', () => {
  const {planes} = beforeEachTest();
  const bottomPlane = planes[2];
  const expectedResult = new Vector4(0.0, Math.sqrt(3.0) / 2.0, -0.5, 0.0);
  equals(bottomPlane, expectedResult, _MathUtils.EPSILON14);
});

test('PerspectiveFrustum#get frustum top plane', () => {
  const {planes} = beforeEachTest();
  const topPlane = planes[3];
  const expectedResult = new Vector4(0.0, -Math.sqrt(3.0) / 2.0, -0.5, 0.0);
  equals(topPlane, expectedResult, _MathUtils.EPSILON14);
});

test('PerspectiveFrustum#get frustum near plane', () => {
  const {planes} = beforeEachTest();
  const nearPlane = planes[4];
  const expectedResult = new Vector4(0.0, 0.0, -1.0, -1.0);
  equals(nearPlane, expectedResult, _MathUtils.EPSILON15);
});

test('PerspectiveFrustum#get frustum far plane', () => {
  const {planes} = beforeEachTest();
  const farPlane = planes[5];
  const expectedResult = new Vector4(0.0, 0.0, 1.0, 2.0);
  equals(farPlane, expectedResult, _MathUtils.EPSILON15);
});

test('PerspectiveFrustum#get sseDenominator', () => {
  const {frustum} = beforeEachTest();
  equals(frustum.sseDenominator, 1.1547, _MathUtils.EPSILON5);
});

test('PerspectiveFrustum#get perspective projection matrix', () => {
  const {frustum} = beforeEachTest();
  const projectionMatrix = frustum.projectionMatrix;
  const expected = new Matrix4().perspective({
    fovy: frustum.fovy,
    aspectRatio: frustum.aspectRatio,
    near: frustum.near,
    far: frustum.far
  });
  expect(equals(projectionMatrix, expected, _MathUtils.EPSILON6)).toBe(true);
});

test('PerspectiveFrustum#get infinite perspective matrix', () => {
  const {frustum} = beforeEachTest();
  const top = frustum.near * Math.tan(0.5 * frustum.fovy);
  const bottom = -top;
  const right = frustum.aspectRatio * top;
  const left = -right;
  const near = frustum.near;

  const expected = new Matrix4().frustum({
    left,
    right,
    bottom,
    top,
    near,
    far: Infinity
  });
  expect(equals(frustum.infiniteProjectionMatrix, expected)).toBe(true);
});

test('PerspectiveFrustum#get pixel dimensions', () => {
  const {frustum} = beforeEachTest();
  const dimensions = new Vector2(1.0, 1.0);
  const pixelSize = frustum.getPixelDimensions(dimensions.x, dimensions.y, 1.0, new Vector2());
  const expected = frustum._offCenterFrustum.getPixelDimensions(
    dimensions.x,
    dimensions.y,
    1.0,
    new Vector2()
  );
  expect(pixelSize.x).toBe(expected.x);
  expect(pixelSize.y).toBe(expected.y);
});

test('PerspectiveFrustum#equals', () => {
  const {frustum} = beforeEachTest();
  const frustum2 = new PerspectiveFrustum();
  frustum2.near = 1.0;
  frustum2.far = 2.0;
  frustum2.fov = Math.PI / 3.0;
  frustum2.aspectRatio = 1.0;
  expect(frustum.equals(frustum2)).toBeTruthy();
});

test('PerspectiveFrustum#equals undefined', () => {
  const {frustum} = beforeEachTest();
  expect(frustum.equals()).toBeFalsy();
});

test('PerspectiveFrustum#throws with undefined frustum parameters', () => {
  const frustum = new PerspectiveFrustum();
  expect(() => frustum.infiniteProjectionMatrix).toThrow();
});

test('PerspectiveFrustum#clone', () => {
  const {frustum} = beforeEachTest();
  const frustum2 = frustum.clone();
  expect(equals(frustum, frustum2)).toBe(true);
});
