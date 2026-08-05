// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// @ts-nocheck

import {test, expect} from 'vitest';

import {_PerspectiveOffCenterFrustum as PerspectiveOffCenterFrustum} from '@math.gl/culling';
import {Vector2, Vector3, Vector4, Matrix4, _MathUtils, equals} from '@math.gl/core';

const VECTOR3_UNIT_Y = Object.freeze(new Vector3(0, 1, 0));
const VECTOR3_UNIT_Z = Object.freeze(new Vector3(0, 0, 1));

function beforeEachTest() {
  const frustum = new PerspectiveOffCenterFrustum({
    right: 1.0,
    left: -1.0,
    top: 1.0,
    bottom: -1.0,
    near: 1.0,
    far: 2.0
  });

  const planes = frustum.computeCullingVolume(
    new Vector3(),
    new Vector3().copy(VECTOR3_UNIT_Z).negate(),
    VECTOR3_UNIT_Y
  ).planes;

  return {frustum, planes};
}

test('PerspectiveOffCenterFrustum#constructs', () => {
  const options = {
    left: -1.0,
    right: 2.0,
    top: 5.0,
    bottom: -1.0,
    near: 3.0,
    far: 4.0
  };
  const f = new PerspectiveOffCenterFrustum(options);
  expect(f.width).toBe(options.width);
  expect(f.aspectRatio).toBe(options.aspectRatio);
  expect(f.near).toBe(options.near);
  expect(f.far).toBe(options.far);
});

test('PerspectiveOffCenterFrustum#default constructs', () => {
  const f = new PerspectiveOffCenterFrustum();
  expect(f.left === undefined).toBeTruthy();
  expect(f.right === undefined).toBeTruthy();
  expect(f.top === undefined).toBeTruthy();
  expect(f.bottom === undefined).toBeTruthy();
  expect(f.near).toBe(1.0);
  expect(f.far).toBe(500000000.0);
});

test('PerspectiveOffCenterFrustum#out of range near plane throws an exception', () => {
  const {frustum} = beforeEachTest();
  frustum.near = -1.0;
  expect(() => frustum.projectionMatrix).toThrow();
});

test('PerspectiveOffCenterFrustum#negative far plane throws an exception', () => {
  const {frustum} = beforeEachTest();
  frustum.far = -1.0;
  expect(() => frustum.projectionMatrix).toThrow();
});

test('PerspectiveOffCenterFrustum#computeCullingVolume with no position throws an exception', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.computeCullingVolume()).toThrow();
});

test('PerspectiveOffCenterFrustum#computeCullingVolume with no direction throws an exception', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.computeCullingVolume(new Vector3())).toThrow();
});

test('PerspectiveOffCenterFrustum#computeCullingVolume with no up throws an exception', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.computeCullingVolume(new Vector3(), new Vector3())).toThrow();
});

test('PerspectiveOffCenterFrustum#get frustum left plane', () => {
  const {planes} = beforeEachTest();
  const leftPlane = planes[0];
  const x = 1.0 / Math.sqrt(2.0);
  const expectedResult = new Vector4(x, 0.0, -x, 0.0);
  equals(leftPlane, expectedResult, _MathUtils.EPSILON15);
});

test('PerspectiveOffCenterFrustum#get frustum right plane', () => {
  const {planes} = beforeEachTest();
  const rightPlane = planes[1];
  const x = 1.0 / Math.sqrt(2.0);
  const expectedResult = new Vector4(-x, 0.0, -x, 0.0);
  equals(rightPlane, expectedResult, _MathUtils.EPSILON15);
});

test('PerspectiveOffCenterFrustum#get frustum bottom plane', () => {
  const {planes} = beforeEachTest();
  const bottomPlane = planes[2];
  const x = 1.0 / Math.sqrt(2.0);
  const expectedResult = new Vector4(0.0, x, -x, 0.0);
  equals(bottomPlane, expectedResult, _MathUtils.EPSILON15);
});

test('PerspectiveOffCenterFrustum#get frustum top plane', () => {
  const {planes} = beforeEachTest();
  const topPlane = planes[3];
  const x = 1.0 / Math.sqrt(2.0);
  const expectedResult = new Vector4(0.0, -x, -x, 0.0);
  equals(topPlane, expectedResult, _MathUtils.EPSILON15);
});

test('PerspectiveOffCenterFrustum#get frustum near plane', () => {
  const {planes} = beforeEachTest();
  const nearPlane = planes[4];
  const expectedResult = new Vector4(0.0, 0.0, -1.0, -1.0);
  equals(nearPlane, expectedResult, _MathUtils.EPSILON15);
});

test('PerspectiveOffCenterFrustum#get frustum far plane', () => {
  const {planes} = beforeEachTest();
  const farPlane = planes[5];
  const expectedResult = new Vector4(0.0, 0.0, 1.0, 2.0);
  equals(farPlane, expectedResult, _MathUtils.EPSILON15);
});

test('PerspectiveOffCenterFrustum#get perspective projection matrix', () => {
  const {frustum} = beforeEachTest();
  const projectionMatrix = frustum.projectionMatrix;

  const top = frustum.top;
  const bottom = frustum.bottom;
  const right = frustum.right;
  const left = frustum.left;
  const near = frustum.near;
  const far = frustum.far;
  const expected = new Matrix4().frustum({
    left,
    right,
    bottom,
    top,
    near,
    far
  });

  expect(equals(projectionMatrix, expected), _MathUtils.EPSILON6).toBe(true);
});

test('PerspectiveOffCenterFrustum#get infinite perspective matrix', () => {
  const {frustum} = beforeEachTest();
  const top = frustum.top;
  const bottom = frustum.bottom;
  const right = frustum.right;
  const left = frustum.left;
  const near = frustum.near;

  const expected = new Matrix4().frustum({
    left,
    right,
    bottom,
    top,
    near,
    far: Infinity
  });
  expect(equals(expected, frustum.infiniteProjectionMatrix)).toBe(true);
});

test('PerspectiveOffCenterFrustum#get pixel dimensions throws without canvas height', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.getPixelDimensions(1.0, undefined, 1.0, new Vector2())).toThrow();
});

test('PerspectiveOffCenterFrustum#get pixel dimensions throws without canvas width', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.getPixelDimensions(undefined, 1.0, 1.0, new Vector2())).toThrow();
});

test('PerspectiveOffCenterFrustum#get pixel dimensions throws with canvas width less than or equal to zero', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.getPixelDimensions(0.0, 1.0, 1.0, new Vector2())).toThrow();
});

test('PerspectiveOffCenterFrustum#get pixel dimensions throws with canvas height less than or equal to zero', () => {
  const {frustum} = beforeEachTest();
  expect(() => frustum.getPixelDimensions(1.0, 0.0, 1.0, new Vector2())).toThrow();
});

test('PerspectiveOffCenterFrustum#get pixel dimensions', () => {
  const {frustum} = beforeEachTest();
  const pixelSize = frustum.getPixelDimensions(1.0, 1.0, 1.0, new Vector2());
  expect(pixelSize.x).toBe(2.0);
  expect(pixelSize.y).toBe(2.0);
});

test('PerspectiveOffCenterFrustum#equals', () => {
  const {frustum} = beforeEachTest();
  const frustum2 = new PerspectiveOffCenterFrustum();
  frustum2.right = 1.0;
  frustum2.left = -frustum.right;
  frustum2.top = 1.0;
  frustum2.bottom = -frustum.top;
  frustum2.near = 1.0;
  frustum2.far = 2.0;
  frustum2.position = new Vector3();
  frustum2.direction = new Vector3().negate(new Vector3(0, 0, 1), new Vector3());
  frustum2.up = new Vector3(0, 1, 0);

  expect(equals(frustum, frustum2)).toBe(true);
});

test('PerspectiveOffCenterFrustum#throws with undefined frustum parameters', () => {
  const frustum = new PerspectiveOffCenterFrustum();
  expect(() => frustum.infiniteProjectionMatrix).toThrow();
});

test('PerspectiveOffCenterFrustum#clone', () => {
  const {frustum} = beforeEachTest();
  const frustum2 = frustum.clone();
  expect(equals(frustum, frustum2)).toBe(true);
});
