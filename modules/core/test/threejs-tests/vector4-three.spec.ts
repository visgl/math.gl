// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright © 2010-2018 three.js authors

// @author bhouston / http://exocortex.com
// @author TristanVALCKE / https://github.com/Itee

// @ts-nocheck
/* eslint-disable quotes, no-var */
import {assert, expect, test} from 'vitest';

import {Vector4, Matrix4} from '@math.gl/core';
import {x, y, z, w, eps} from './constants';

// INSTANCING
test('three.js#Vector4#Instancing', () => {
  let a = new Vector4();
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();
  expect(a.z === 0, 'Passed!').toBeTruthy();

  a = new Vector4(x, y, z, w);
  expect(a.x === x, 'Passed!').toBeTruthy();
  expect(a.y === y, 'Passed!').toBeTruthy();
  expect(a.z === z, 'Passed!').toBeTruthy();
  expect(a.w === w, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#set', () => {
  const a = new Vector4();
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();
  expect(a.z === 0, 'Passed!').toBeTruthy();

  a.set(x, y, z, w);
  expect(a.x === x, 'Passed!').toBeTruthy();
  expect(a.y === y, 'Passed!').toBeTruthy();
  expect(a.z === z, 'Passed!').toBeTruthy();
  expect(a.w === w, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#setScalar', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#setX', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#setY', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#setZ', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#setW', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#setComponent', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#getComponent', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#clone', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#copy', () => {
  const a = new Vector4(x, y, z, w);
  const b = new Vector4().copy(a);
  expect(b.x === x, 'Passed!').toBeTruthy();
  expect(b.y === y, 'Passed!').toBeTruthy();
  expect(b.z === z, 'Passed!').toBeTruthy();
  expect(b.w === w, 'Passed!').toBeTruthy();

  // ensure that it is a true copy
  a.x = 0;
  a.y = -1;
  a.z = -2;
  a.w = -3;
  expect(b.x === x, 'Passed!').toBeTruthy();
  expect(b.y === y, 'Passed!').toBeTruthy();
  expect(b.z === z, 'Passed!').toBeTruthy();
  expect(b.w === w, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#add', () => {
  const a = new Vector4(x, y, z, w);
  const b = new Vector4(-x, -y, -z, -w);

  a.add(b);
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();
  expect(a.z === 0, 'Passed!').toBeTruthy();
  expect(a.w === 0, 'Passed!').toBeTruthy();

  var c = new Vector4().addVectors(b, b);
  expect(c.x === -2 * x, 'Passed!').toBeTruthy();
  expect(c.y === -2 * y, 'Passed!').toBeTruthy();
  expect(c.z === -2 * z, 'Passed!').toBeTruthy();
  expect(c.w === -2 * w, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#addScalar', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#addVectors', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#addScaledVector', () => {
  const a = new Vector4(x, y, z, w);
  const b = new Vector4(6, 7, 8, 9);
  const s = 3;

  a.addScaledVector(b, s);
  assert.strictEqual(a.x, x + b.x * s, 'Check x');
  assert.strictEqual(a.y, y + b.y * s, 'Check y');
  assert.strictEqual(a.z, z + b.z * s, 'Check z');
  assert.strictEqual(a.w, w + b.w * s, 'Check w');
});

test('three.js#Vector4#sub', () => {
  const a = new Vector4(x, y, z, w);
  const b = new Vector4(-x, -y, -z, -w);

  a.sub(b);
  expect(a.x === 2 * x, 'Passed!').toBeTruthy();
  expect(a.y === 2 * y, 'Passed!').toBeTruthy();
  expect(a.z === 2 * z, 'Passed!').toBeTruthy();
  expect(a.w === 2 * w, 'Passed!').toBeTruthy();

  const c = new Vector4().subVectors(a, a);
  expect(c.x === 0, 'Passed!').toBeTruthy();
  expect(c.y === 0, 'Passed!').toBeTruthy();
  expect(c.z === 0, 'Passed!').toBeTruthy();
  expect(c.w === 0, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#subScalar', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#subVectors', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#multiplyScalar', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#applyMatrix4', () => {
  var a = new Vector4(x, y, z, w);
  var m = new Matrix4().makeRotationX(Math.PI);
  var expected = new Vector4(2, -3, -4, 5);

  a.applyMatrix4(m);
  expect(Math.abs(a.x - expected.x) <= eps, 'Rotation matrix: check x').toBeTruthy();
  expect(Math.abs(a.y - expected.y) <= eps, 'Rotation matrix: check y').toBeTruthy();
  expect(Math.abs(a.z - expected.z) <= eps, 'Rotation matrix: check z').toBeTruthy();
  expect(Math.abs(a.w - expected.w) <= eps, 'Rotation matrix: check w').toBeTruthy();
});

test('three.js#Vector4#divideScalar', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#setAxisAngleFromQuaternion', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#setAxisAngleFromRotationMatrix', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#min', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#max', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#clamp', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#clampScalar', () => {
  var a = new Vector4(-0.1, 0.01, 0.5, 1.5);
  var clamped = new Vector4(0.1, 0.1, 0.5, 1.0);

  a.clampScalar(0.1, 1.0);
  expect(Math.abs(a.x - clamped.x) <= eps, 'Check x').toBeTruthy();
  expect(Math.abs(a.y - clamped.y) <= eps, 'Check y').toBeTruthy();
  expect(Math.abs(a.z - clamped.z) <= eps, 'Check z').toBeTruthy();
  expect(Math.abs(a.w - clamped.w) <= eps, 'Check w').toBeTruthy();
});

test('three.js#Vector4#clampLength', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#floor', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#ceil', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#round', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#roundToZero', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#negate', () => {
  var a = new Vector4(x, y, z, w);

  a.negate();
  expect(a.x === -x, 'Passed!').toBeTruthy();
  expect(a.y === -y, 'Passed!').toBeTruthy();
  expect(a.z === -z, 'Passed!').toBeTruthy();
  expect(a.w === -w, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#dot', () => {
  const a = new Vector4(x, y, z, w);
  const b = new Vector4(-x, -y, -z, -w);
  const c = new Vector4(0, 0, 0, 0);

  let result = a.dot(b);
  expect(result === -x * x - y * y - z * z - w * w, 'Passed!').toBeTruthy();

  result = a.dot(c);
  expect(result === 0, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#lengthSq', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#length', () => {
  console.log("everything's gonna be alright");
});

test.skip('three.js#Vector4#manhattanLength', () => {
  const a = new Vector4(x, 0, 0, 0);
  const b = new Vector4(0, -y, 0, 0);
  const c = new Vector4(0, 0, z, 0);
  const d = new Vector4(0, 0, 0, w);
  const e = new Vector4(0, 0, 0, 0);

  expect(a.manhattanLength() === x, 'Positive x').toBeTruthy();
  expect(b.manhattanLength() === y, 'Negative y').toBeTruthy();
  expect(c.manhattanLength() === z, 'Positive z').toBeTruthy();
  expect(d.manhattanLength() === w, 'Positive w').toBeTruthy();
  expect(e.manhattanLength() === 0, 'Empty initialization').toBeTruthy();

  a.set(x, y, z, w);
  expect(
    a.manhattanLength() === Math.abs(x) + Math.abs(y) + Math.abs(z) + Math.abs(w),
    'All components'
  ).toBeTruthy();
});

test('three.js#Vector4#normalize', () => {
  const a = new Vector4(x, 0, 0, 0);
  const b = new Vector4(0, -y, 0, 0);
  const c = new Vector4(0, 0, z, 0);
  const d = new Vector4(0, 0, 0, -w);

  a.normalize();
  expect(a.len() === 1, 'Passed!').toBeTruthy();
  expect(a.x === 1, 'Passed!').toBeTruthy();

  b.normalize();
  expect(b.len() === 1, 'Passed!').toBeTruthy();
  expect(b.y === -1, 'Passed!').toBeTruthy();

  c.normalize();
  expect(c.len() === 1, 'Passed!').toBeTruthy();
  expect(c.z === 1, 'Passed!').toBeTruthy();

  d.normalize();
  expect(d.len() === 1, 'Passed!').toBeTruthy();
  expect(d.w === -1, 'Passed!').toBeTruthy();
});

test.skip('three.js#Vector4#setLength', () => {
  let a = new Vector4(x, 0, 0, 0);

  expect(a.len() === x, 'Passed!').toBeTruthy();
  a.setLength(y);
  expect(a.len() === y, 'Passed!').toBeTruthy();

  a = new Vector4(0, 0, 0, 0);
  expect(a.len() === 0, 'Passed!').toBeTruthy();
  a.setLength(y);
  expect(a.len() === 0, 'Passed!').toBeTruthy();
  a.setLength();
  expect(isNaN(a.len()), 'Passed!').toBeTruthy();
});

test('three.js#Vector4#lerp', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#lerpVectors', () => {
  console.log("everything's gonna be alright");
});

test('three.js#Vector4#equals', () => {
  const a = new Vector4(x, 0, z, 0);
  const b = new Vector4(0, -y, 0, -w);

  expect(a.x !== b.x, 'Passed!').toBeTruthy();
  expect(a.y !== b.y, 'Passed!').toBeTruthy();
  expect(a.z !== b.z, 'Passed!').toBeTruthy();
  expect(a.w !== b.w, 'Passed!').toBeTruthy();

  expect(!a.equals(b), 'Passed!').toBeTruthy();
  expect(!b.equals(a), 'Passed!').toBeTruthy();

  a.copy(b);
  expect(a.x === b.x, 'Passed!').toBeTruthy();
  expect(a.y === b.y, 'Passed!').toBeTruthy();
  expect(a.z === b.z, 'Passed!').toBeTruthy();
  expect(a.w === b.w, 'Passed!').toBeTruthy();

  expect(a.equals(b), 'Passed!').toBeTruthy();
  expect(b.equals(a), 'Passed!').toBeTruthy();
});

test('three.js#Vector4#fromArray', () => {
  const a = new Vector4();
  const array = [1, 2, 3, 4, 5, 6, 7, 8];

  a.fromArray(array);
  assert.strictEqual(a.x, 1, 'No offset: check x');
  assert.strictEqual(a.y, 2, 'No offset: check y');
  assert.strictEqual(a.z, 3, 'No offset: check z');
  assert.strictEqual(a.w, 4, 'No offset: check w');

  a.fromArray(array, 4);
  assert.strictEqual(a.x, 5, 'With offset: check x');
  assert.strictEqual(a.y, 6, 'With offset: check y');
  assert.strictEqual(a.z, 7, 'With offset: check z');
  assert.strictEqual(a.w, 8, 'With offset: check w');
});

test('three.js#Vector4#toArray', () => {
  const a = new Vector4(x, y, z, w);

  let array = a.toArray();
  assert.strictEqual(array[0], x, 'No array, no offset: check x');
  assert.strictEqual(array[1], y, 'No array, no offset: check y');
  assert.strictEqual(array[2], z, 'No array, no offset: check z');
  assert.strictEqual(array[3], w, 'No array, no offset: check w');

  array = [];
  a.toArray(array);
  assert.strictEqual(array[0], x, 'With array, no offset: check x');
  assert.strictEqual(array[1], y, 'With array, no offset: check y');
  assert.strictEqual(array[2], z, 'With array, no offset: check z');
  assert.strictEqual(array[3], w, 'With array, no offset: check w');

  array = [];
  a.toArray(array, 1);
  assert.strictEqual(array[0], undefined, 'With array and offset: check [0]');
  assert.strictEqual(array[1], x, 'With array and offset: check x');
  assert.strictEqual(array[2], y, 'With array and offset: check y');
  assert.strictEqual(array[3], z, 'With array and offset: check z');
  assert.strictEqual(array[4], w, 'With array and offset: check w');
});

/*
test.skip('three.js#Vector4#fromBufferAttribute', assert => {
  var a = new Vector4();
  var attr = new BufferAttribute(new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]), 4);

  a.fromBufferAttribute(attr, 0);
  assert.strictEqual(a.x, 1, 'Offset 0: check x');
  assert.strictEqual(a.y, 2, 'Offset 0: check y');
  assert.strictEqual(a.z, 3, 'Offset 0: check z');
  assert.strictEqual(a.w, 4, 'Offset 0: check w');

  a.fromBufferAttribute(attr, 1);
  assert.strictEqual(a.x, 5, 'Offset 1: check x');
  assert.strictEqual(a.y, 6, 'Offset 1: check y');
  assert.strictEqual(a.z, 7, 'Offset 1: check z');
  assert.strictEqual(a.w, 8, 'Offset 1: check w');
});
*/

// TODO (Itee) refactor/split
test.skip('three.js#Vector4#setX,setY,setZ,setW', () => {
  var a = new Vector4();
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();
  expect(a.z === 0, 'Passed!').toBeTruthy();

  a.setX(x);
  a.setY(y);
  a.setZ(z);
  a.setW(w);

  expect(a.x === x, 'Passed!').toBeTruthy();
  expect(a.y === y, 'Passed!').toBeTruthy();
  expect(a.z === z, 'Passed!').toBeTruthy();
  expect(a.w === w, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#setComponent,getComponent', () => {
  var a = new Vector4();
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();
  expect(a.z === 0, 'Passed!').toBeTruthy();

  a.setComponent(0, 1);
  a.setComponent(1, 2);
  a.setComponent(2, 3);
  a.setComponent(3, 4);
  expect(a.getComponent(0) === 1, 'Passed!').toBeTruthy();
  expect(a.getComponent(1) === 2, 'Passed!').toBeTruthy();
  expect(a.getComponent(2) === 3, 'Passed!').toBeTruthy();
  expect(a.getComponent(3) === 4, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#setComponent/getComponent exceptions', () => {
  var a = new Vector4();

  expect(
    () => a.setComponent(4, 0),
    'setComponent with an out of range index throws Error'
  ).toThrow(/index is out of range/);
  expect(() => a.getComponent(4), 'getComponent with an out of range index throws Error').toThrow(
    /index is out of range/
  );
});

test('three.js#Vector4#setScalar/addScalar/subScalar', () => {
  var a = new Vector4();
  var s = 3;

  a.setScalar(s);
  assert.strictEqual(a.x, s, 'setScalar: check x');
  assert.strictEqual(a.y, s, 'setScalar: check y');
  assert.strictEqual(a.z, s, 'setScalar: check z');
  assert.strictEqual(a.w, s, 'setScalar: check w');

  a.addScalar(s);
  assert.strictEqual(a.x, 2 * s, 'addScalar: check x');
  assert.strictEqual(a.y, 2 * s, 'addScalar: check y');
  assert.strictEqual(a.z, 2 * s, 'addScalar: check z');
  assert.strictEqual(a.w, 2 * s, 'addScalar: check w');

  a.subScalar(2 * s);
  assert.strictEqual(a.x, 0, 'subScalar: check x');
  assert.strictEqual(a.y, 0, 'subScalar: check y');
  assert.strictEqual(a.z, 0, 'subScalar: check z');
  assert.strictEqual(a.w, 0, 'subScalar: check w');
});

test('three.js#Vector4#multiply/divide', () => {
  var a = new Vector4(x, y, z, w);
  var b = new Vector4(-x, -y, -z, -w);

  a.multiplyScalar(-2);
  expect(a.x === x * -2, 'Passed!').toBeTruthy();
  expect(a.y === y * -2, 'Passed!').toBeTruthy();
  expect(a.z === z * -2, 'Passed!').toBeTruthy();
  expect(a.w === w * -2, 'Passed!').toBeTruthy();

  b.multiplyScalar(-2);
  expect(b.x === 2 * x, 'Passed!').toBeTruthy();
  expect(b.y === 2 * y, 'Passed!').toBeTruthy();
  expect(b.z === 2 * z, 'Passed!').toBeTruthy();
  expect(b.w === 2 * w, 'Passed!').toBeTruthy();

  a.divideScalar(-2);
  expect(a.x === x, 'Passed!').toBeTruthy();
  expect(a.y === y, 'Passed!').toBeTruthy();
  expect(a.z === z, 'Passed!').toBeTruthy();
  expect(a.w === w, 'Passed!').toBeTruthy();

  b.divideScalar(-2);
  expect(b.x === -x, 'Passed!').toBeTruthy();
  expect(b.y === -y, 'Passed!').toBeTruthy();
  expect(b.z === -z, 'Passed!').toBeTruthy();
  expect(b.w === -w, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#min/max/clamp', () => {
  const a = new Vector4(x, y, z, w);
  const b = new Vector4(-x, -y, -z, -w);
  const c = new Vector4();

  c.copy(a).min(b);
  expect(c.x === -x, 'Passed!').toBeTruthy();
  expect(c.y === -y, 'Passed!').toBeTruthy();
  expect(c.z === -z, 'Passed!').toBeTruthy();
  expect(c.w === -w, 'Passed!').toBeTruthy();

  c.copy(a).max(b);
  expect(c.x === x, 'Passed!').toBeTruthy();
  expect(c.y === y, 'Passed!').toBeTruthy();
  expect(c.z === z, 'Passed!').toBeTruthy();
  expect(c.w === w, 'Passed!').toBeTruthy();

  c.set(-2 * x, 2 * y, -2 * z, 2 * w);
  c.clamp(b, a);
  expect(c.x === -x, 'Passed!').toBeTruthy();
  expect(c.y === y, 'Passed!').toBeTruthy();
  expect(c.z === -z, 'Passed!').toBeTruthy();
  expect(c.w === w, 'Passed!').toBeTruthy();
});

test('three.js#Vector4#length/lengthSq', () => {
  const a = new Vector4(x, 0, 0, 0);
  const b = new Vector4(0, -y, 0, 0);
  const c = new Vector4(0, 0, z, 0);
  const d = new Vector4(0, 0, 0, w);
  const e = new Vector4(0, 0, 0, 0);

  expect(a.len() === x, 'Passed!').toBeTruthy();
  expect(a.lengthSq() === x * x, 'Passed!').toBeTruthy();
  expect(b.len() === y, 'Passed!').toBeTruthy();
  expect(b.lengthSq() === y * y, 'Passed!').toBeTruthy();
  expect(c.len() === z, 'Passed!').toBeTruthy();
  expect(c.lengthSq() === z * z, 'Passed!').toBeTruthy();
  expect(d.len() === w, 'Passed!').toBeTruthy();
  expect(d.lengthSq() === w * w, 'Passed!').toBeTruthy();
  expect(e.len() === 0, 'Passed!').toBeTruthy();
  expect(e.lengthSq() === 0, 'Passed!').toBeTruthy();

  a.set(x, y, z, w);
  expect(a.len() === Math.sqrt(x * x + y * y + z * z + w * w), 'Passed!').toBeTruthy();
  expect(a.lengthSq() === x * x + y * y + z * z + w * w, 'Passed!').toBeTruthy();
});

test.skip('three.js#Vector4#lerp/clone', () => {
  const a = new Vector4(x, 0, z, 0);
  const b = new Vector4(0, -y, 0, -w);

  expect(a.lerp(a, 0).equals(a.lerp(a, 0.5)), 'Passed!').toBeTruthy();
  expect(a.lerp(a, 0).equals(a.lerp(a, 1)), 'Passed!').toBeTruthy();

  expect(a.clone().lerp(b, 0).equals(a), 'Passed!').toBeTruthy();

  expect(a.clone().lerp(b, 0.5).x === x * 0.5, 'Passed!').toBeTruthy();
  expect(a.clone().lerp(b, 0.5).y === -y * 0.5, 'Passed!').toBeTruthy();
  expect(a.clone().lerp(b, 0.5).z === z * 0.5, 'Passed!').toBeTruthy();
  expect(a.clone().lerp(b, 0.5).w === -w * 0.5, 'Passed!').toBeTruthy();

  expect(a.clone().lerp(b, 1).equals(b), 'Passed!').toBeTruthy();
});
