// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright © 2010-2018 three.js authors

// This file was copied from THREE.js math test suite (MIT licensed)
// @author bhouston / http://exocortex.com
// @author tschw
// @author TristanVALCKE / https://github.com/Itee

// @ts-nocheck
/* eslint-disable */
import {test, expect} from 'vitest';
import {Quaternion, Vector3, Vector4, Matrix4, Euler} from '@math.gl/core';
import {x, y, z, w, eps} from './constants';

const orders = ['XYZ', 'YXZ', 'ZXY', 'ZYX', 'YZX', 'XZY'];
// const eulerAngles = new Euler(0.1, -0.3, 0.25);

function qSub(a, b) {
  const result = new Quaternion();
  result.copy(a);

  result.x -= b.x;
  result.y -= b.y;
  result.z -= b.z;
  result.w -= b.w;

  return result;
}

function doSlerpObject(aArr, bArr, t) {
  const a = new Quaternion().fromArray(aArr),
    b = new Quaternion().fromArray(bArr),
    c = new Quaternion().fromArray(aArr);

  c.slerp(b, t);

  return {
    equals: function (x, y, z, w, maxError) {
      if (maxError === undefined) maxError = Number.EPSILON;

      return (
        Math.abs(x - c.x) <= maxError &&
        Math.abs(y - c.y) <= maxError &&
        Math.abs(z - c.z) <= maxError &&
        Math.abs(w - c.w) <= maxError
      );
    },

    length: c.len(),

    dotA: c.dot(a),
    dotB: c.dot(b)
  };
}

function doSlerpArray(a, b, t) {
  const result = [0, 0, 0, 0];

  Quaternion.slerpFlat(result, 0, a, 0, b, 0, t);

  function arrDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }

  return {
    equals: function (x, y, z, w, maxError) {
      if (maxError === undefined) maxError = Number.EPSILON;

      return (
        Math.abs(x - result[0]) <= maxError &&
        Math.abs(y - result[1]) <= maxError &&
        Math.abs(z - result[2]) <= maxError &&
        Math.abs(w - result[3]) <= maxError
      );
    },

    length: Math.sqrt(arrDot(result, result)),

    dotA: arrDot(result, a),
    dotB: arrDot(result, b)
  };
}

function slerpTestSkeleton(doSlerp, maxError) {
  const a = [0.6753410084407496, 0.4087830051091744, 0.32856700410659473, 0.5185120064806223];
  const b = [0.6602792107657797, 0.43647413932562285, 0.35119011210236006, 0.5001871596632682];

  let maxNormError = 0;

  function isNormal(result) {
    const normError = Math.abs(1 - result.length);
    maxNormError = Math.max(maxNormError, normError);
    return normError <= maxError;
  }

  let result;

  result = doSlerp(a, b, 0);
  expect(result.equals(a[0], a[1], a[2], a[3], 0), 'Exactly A @ t = 0').toBeTruthy();

  result = doSlerp(a, b, 1);
  expect(result.equals(b[0], b[1], b[2], b[3], 0), 'Exactly B @ t = 1').toBeTruthy();

  result = doSlerp(a, b, 0.5);
  expect(Math.abs(result.dotA - result.dotB) <= Number.EPSILON, 'Symmetry at 0.5').toBeTruthy();
  expect(isNormal(result), 'Approximately normal (at 0.5)').toBeTruthy();

  result = doSlerp(a, b, 0.25);
  expect(result.dotA > result.dotB, 'Interpolating at 0.25').toBeTruthy();
  expect(isNormal(result), 'Approximately normal (at 0.25)').toBeTruthy();

  result = doSlerp(a, b, 0.75);
  expect(result.dotA < result.dotB, 'Interpolating at 0.75').toBeTruthy();
  expect(isNormal(result), 'Approximately normal (at 0.75)').toBeTruthy();

  const D = Math.SQRT1_2;

  result = doSlerp([1, 0, 0, 0], [0, 0, 1, 0], 0.5);
  expect(result.equals(D, 0, D, 0), 'X/Z diagonal from axes').toBeTruthy();
  expect(isNormal(result), 'Approximately normal (X/Z diagonal)').toBeTruthy();

  result = doSlerp([0, D, 0, D], [0, -D, 0, D], 0.5);
  expect(result.equals(0, 0, 0, 1), 'W-Unit from diagonals').toBeTruthy();
  expect(isNormal(result), 'Approximately normal (W-Unit)').toBeTruthy();
}

function changeEulerOrder(euler, order) {
  return new Euler(euler.x, euler.y, euler.z, order);
}

// INSTANCING
test('three.js#Quaternion#Instancing', () => {
  let a = new Quaternion();
  expect(a.x == 0, 'Passed!').toBeTruthy();
  expect(a.y == 0, 'Passed!').toBeTruthy();
  expect(a.z == 0, 'Passed!').toBeTruthy();
  expect(a.w == 1, 'Passed!').toBeTruthy();

  a = new Quaternion(x, y, z, w);
  expect(a.x === x, 'Passed!').toBeTruthy();
  expect(a.y === y, 'Passed!').toBeTruthy();
  expect(a.z === z, 'Passed!').toBeTruthy();
  expect(a.w === w, 'Passed!').toBeTruthy();
});

// STATIC STUFF
test('three.js#Quaternion#slerp', () => {
  slerpTestSkeleton(doSlerpObject, Number.EPSILON);
});

test.skip('three.js#Quaternion#slerpFlat - NOT IMPLEMENTED', () => {
  slerpTestSkeleton(doSlerpArray, Number.EPSILON);
});

// PROPERTIES
test('three.js#Quaternion#properties', () => {
  const a = new Quaternion();
  // a.onChange(function() {
  //   t.ok(true, 'onChange called');
  // });

  a.x = x;
  a.y = y;
  a.z = z;
  a.w = w;

  expect(a.x, 'Check x').toBe(x);
  expect(a.y, 'Check y').toBe(y);
  expect(a.z, 'Check z').toBe(z);
  expect(a.w, 'Check w').toBe(w);
});

// PUBLIC STUFF
test('three.js#Quaternion#set', () => {
  const a = new Quaternion();
  expect(a.x == 0, 'Passed!').toBeTruthy();
  expect(a.y == 0, 'Passed!').toBeTruthy();
  expect(a.z == 0, 'Passed!').toBeTruthy();
  expect(a.w == 1, 'Passed!').toBeTruthy();

  a.set(x, y, z, w);
  expect(a.x == x, 'Passed!').toBeTruthy();
  expect(a.y == y, 'Passed!').toBeTruthy();
  expect(a.z === z, 'Passed!').toBeTruthy();
  expect(a.w === w, 'Passed!').toBeTruthy();
});

test('three.js#Quaternion#clone', () => {
  expect(true, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Quaternion#copy', () => {
  const a = new Quaternion(x, y, z, w);
  const b = new Quaternion().copy(a);
  expect(b.x == x, 'Passed!').toBeTruthy();
  expect(b.y == y, 'Passed!').toBeTruthy();
  expect(b.z == z, 'Passed!').toBeTruthy();
  expect(b.w == w, 'Passed!').toBeTruthy();

  // ensure that it is a true copy
  a.x = 0;
  a.y = -1;
  a.z = 0;
  a.w = -1;
  expect(b.x == x, 'Passed!').toBeTruthy();
  expect(b.y == y, 'Passed!').toBeTruthy();
});

test.skip('three.js#Quaternion#setFromEuler/setFromQuaternion', () => {
  const angles = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];

  // ensure euler conversion to/from Quaternion matches.
  for (let i = 0; i < orders.length; i++) {
    for (let j = 0; j < angles.length; j++) {
      const eulers2 = new Euler().setFromQuaternion(
        new Quaternion().setFromEuler(new Euler(angles[j].x, angles[j].y, angles[j].z, orders[i])),
        orders[i]
      );
      const newAngle = new Vector3(eulers2.x, eulers2.y, eulers2.z);
      expect(newAngle.distanceTo(angles[j]) < 0.001, 'Passed!').toBeTruthy();
    }
  }
});

test('three.js#Quaternion#setFromAxisAngle', () => {
  // TODO: find cases to validate.
  // t.ok( true, "Passed!" );

  const zero = new Quaternion();

  let a = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0);
  expect(a.equals(zero), 'Passed!').toBeTruthy();
  a = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0);
  expect(a.equals(zero), 'Passed!').toBeTruthy();
  a = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), 0);
  expect(a.equals(zero), 'Passed!').toBeTruthy();

  const b1 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI);
  expect(!a.equals(b1), 'Passed!').toBeTruthy();
  const b2 = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI);
  expect(!a.equals(b2), 'Passed!').toBeTruthy();

  b1.multiply(b2);
  expect(a.equals(b1), 'Passed!').toBeTruthy();
});

test.skip('Quaternion#setFromEuler/setFromRotationMatrix', () => {
  // ensure euler conversion for Quaternion matches that of Matrix4
  for (let i = 0; i < orders.length; i++) {
    const q = new Quaternion().setFromEuler(changeEulerOrder(eulerAngles, orders[i]));
    const m = new Matrix4().makeRotationFromEuler(changeEulerOrder(eulerAngles, orders[i]));
    const q2 = new Quaternion().setFromRotationMatrix(m);

    expect(qSub(q, q2).len() < 0.001, 'Passed!').toBeTruthy();
  }
});

test.skip('three.js#Quaternion#setFromRotationMatrix', () => {
  // contrived examples purely to please the god of code coverage...
  // match conditions in constious 'else [if]' blocks

  const a = new Quaternion();
  let q = new Quaternion(-9, -2, 3, -4).normalize();
  const m = new Matrix4().makeRotationFromQuaternion(q);
  let expected = new Vector4(
    0.8581163303210332,
    0.19069251784911848,
    -0.2860387767736777,
    0.38138503569823695
  );

  a.setFromRotationMatrix(m);
  expect(Math.abs(a.x - expected.x) <= eps, 'm11 > m22 && m11 > m33: check x').toBeTruthy();
  expect(Math.abs(a.y - expected.y) <= eps, 'm11 > m22 && m11 > m33: check y').toBeTruthy();
  expect(Math.abs(a.z - expected.z) <= eps, 'm11 > m22 && m11 > m33: check z').toBeTruthy();
  expect(Math.abs(a.w - expected.w) <= eps, 'm11 > m22 && m11 > m33: check w').toBeTruthy();

  q = new Quaternion(-1, -2, 1, -1).normalize();
  m.makeRotationFromQuaternion(q);
  expected = new Vector4(
    0.37796447300922714,
    0.7559289460184544,
    -0.37796447300922714,
    0.37796447300922714
  );

  a.setFromRotationMatrix(m);
  expect(Math.abs(a.x - expected.x) <= eps, 'm22 > m33: check x').toBeTruthy();
  expect(Math.abs(a.y - expected.y) <= eps, 'm22 > m33: check y').toBeTruthy();
  expect(Math.abs(a.z - expected.z) <= eps, 'm22 > m33: check z').toBeTruthy();
  expect(Math.abs(a.w - expected.w) <= eps, 'm22 > m33: check w').toBeTruthy();
});

test.skip('three.js#Quaternion#setFromUnitVectors', () => {
  const a = new Quaternion();
  const b = new Vector3(1, 0, 0);
  const c = new Vector3(0, 1, 0);
  const expected = new Quaternion(0, 0, Math.sqrt(2) / 2, Math.sqrt(2) / 2);

  a.setFromUnitVectors(b, c);
  expect(Math.abs(a.x - expected.x) <= eps, 'Check x').toBeTruthy();
  expect(Math.abs(a.y - expected.y) <= eps, 'Check y').toBeTruthy();
  expect(Math.abs(a.z - expected.z) <= eps, 'Check z').toBeTruthy();
  expect(Math.abs(a.w - expected.w) <= eps, 'Check w').toBeTruthy();
});

test('three.js#Quaternion#inverse/conjugate', () => {
  const a = new Quaternion(x, y, z, w);

  // TODO: add better validation here.

  const b = a.clone().conjugate();

  expect(a.x == -b.x, 'Passed!').toBeTruthy();
  expect(a.y == -b.y, 'Passed!').toBeTruthy();
  expect(a.z == -b.z, 'Passed!').toBeTruthy();
  expect(a.w == b.w, 'Passed!').toBeTruthy();
});

test('three.js#Quaternion#dot', () => {
  expect(true, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Quaternion#normalize/length/lengthSq', () => {
  const a = new Quaternion(x, y, z, w);

  expect(a.len() != 1, 'Passed!').toBeTruthy();
  expect(a.lengthSq() != 1, 'Passed!').toBeTruthy();
  a.normalize();
  expect(a.len() == 1, 'Passed!').toBeTruthy();
  expect(a.lengthSq() == 1, 'Passed!').toBeTruthy();

  a.set(0, 0, 0, 0);
  expect(a.lengthSq() == 0, 'Passed!').toBeTruthy();
  expect(a.len() == 0, 'Passed!').toBeTruthy();
  a.normalize();
  expect(a.lengthSq() == 1, 'Passed!').toBeTruthy();
  expect(a.len() == 1, 'Passed!').toBeTruthy();
});

test.skip('Quaternion#multiplyQuaternions/multiply', () => {
  const angles = [new Euler(1, 0, 0), new Euler(0, 1, 0), new Euler(0, 0, 1)];

  const q1 = new Quaternion().setFromEuler(changeEulerOrder(angles[0], 'XYZ'));
  const q2 = new Quaternion().setFromEuler(changeEulerOrder(angles[1], 'XYZ'));
  const q3 = new Quaternion().setFromEuler(changeEulerOrder(angles[2], 'XYZ'));

  const q = new Quaternion().multiplyQuaternions(q1, q2).multiply(q3);

  const m1 = new Matrix4().makeRotationFromEuler(changeEulerOrder(angles[0], 'XYZ'));
  const m2 = new Matrix4().makeRotationFromEuler(changeEulerOrder(angles[1], 'XYZ'));
  const m3 = new Matrix4().makeRotationFromEuler(changeEulerOrder(angles[2], 'XYZ'));

  const m = new Matrix4().multiplyMatrices(m1, m2).multiply(m3);

  const qFromM = new Quaternion().setFromRotationMatrix(m);

  expect(qSub(q, qFromM).len() < 0.001, 'Passed!').toBeTruthy();
});

test('three.js#Quaternion#premultiply', () => {
  const a = new Quaternion(x, y, z, w);
  const b = new Quaternion(2 * x, -y, -2 * z, w);
  const expected = new Quaternion(42, -32, -2, 58);

  a.premultiply(b);
  expect(Math.abs(a.x - expected.x) <= eps, 'Check x').toBeTruthy();
  expect(Math.abs(a.y - expected.y) <= eps, 'Check y').toBeTruthy();
  expect(Math.abs(a.z - expected.z) <= eps, 'Check z').toBeTruthy();
  expect(Math.abs(a.w - expected.w) <= eps, 'Check w').toBeTruthy();
});

test('three.js#Quaternion#slerp', () => {
  expect(true, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Quaternion#equals', () => {
  const a = new Quaternion(x, y, z, w);
  const b = new Quaternion(-x, -y, -z, -w);

  expect(a.x != b.x, 'Passed!').toBeTruthy();
  expect(a.y != b.y, 'Passed!').toBeTruthy();

  expect(!a.equals(b), 'Passed!').toBeTruthy();
  expect(!b.equals(a), 'Passed!').toBeTruthy();

  a.copy(b);
  expect(a.x == b.x, 'Passed!').toBeTruthy();
  expect(a.y == b.y, 'Passed!').toBeTruthy();

  expect(a.equals(b), 'Passed!').toBeTruthy();
  expect(b.equals(a), 'Passed!').toBeTruthy();
});

test('three.js#Quaternion#fromArray', () => {
  expect(true, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Quaternion#toArray', () => {
  const a = new Quaternion(x, y, z, w);

  let array = a.toArray();
  expect(array[0], 'No array, no offset: check x').toBe(x);
  expect(array[1], 'No array, no offset: check y').toBe(y);
  expect(array[2], 'No array, no offset: check z').toBe(z);
  expect(array[3], 'No array, no offset: check w').toBe(w);

  array = [];
  a.toArray(array);
  expect(array[0], 'With array, no offset: check x').toBe(x);
  expect(array[1], 'With array, no offset: check y').toBe(y);
  expect(array[2], 'With array, no offset: check z').toBe(z);
  expect(array[3], 'With array, no offset: check w').toBe(w);

  array = [];
  a.toArray(array, 1);
  expect(array[0], 'With array and offset: check [0]').toBeUndefined();
  expect(array[1], 'With array and offset: check x').toBe(x);
  expect(array[2], 'With array and offset: check y').toBe(y);
  expect(array[3], 'With array and offset: check z').toBe(z);
  expect(array[4], 'With array and offset: check w').toBe(w);
});

test.skip('three.js#Quaternion#onChange - NOT IMPLEMENTED', () => {
  expect(true, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Quaternion#onChangeCallback - NOT IMPLEMENTED', () => {
  expect(true, "everything's gonna be alright").toBeTruthy();
});

// OTHERS
test.skip('Quaternion#multiplyVector3', () => {
  const angles = [new Euler(1, 0, 0), new Euler(0, 1, 0), new Euler(0, 0, 1)];

  // ensure euler conversion for Quaternion matches that of Matrix4
  for (let i = 0; i < orders.length; i++) {
    for (let j = 0; j < angles.length; j++) {
      const q = new Quaternion().setFromEuler(changeEulerOrder(angles[j], orders[i]));
      const m = new Matrix4().makeRotationFromEuler(changeEulerOrder(angles[j], orders[i]));

      const v0 = new Vector3(1, 0, 0);
      const qv = v0.clone().applyQuaternion(q);
      const mv = v0.clone().applyMatrix4(m);

      expect(qv.distanceTo(mv) < 0.001, 'Passed!').toBeTruthy();
    }
  }
});
