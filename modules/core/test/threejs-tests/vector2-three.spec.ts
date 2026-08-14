// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright © 2010-2018 three.js authors

// This file is copied from THREE.js math test suite (MIT licensed)
// @author bhouston / http://exocortex.com
// @author TristanVALCKE / https://github.com/Itee

// @ts-nocheck
/* eslint-disable quotes, no-var */
import {assert, expect, test} from 'vitest';

import {Vector2, Matrix3} from '@math.gl/core';
import {x, y} from './constants';

// INSTANCING

test('three.js#Vector2#Instancing', () => {
  let a = new Vector2();
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();

  a = new Vector2(x, y);
  expect(a.x === x, 'Passed!').toBeTruthy();
  expect(a.y === y, 'Passed!').toBeTruthy();
});

test('three.js#Vector2#properties', () => {
  var a = new Vector2(0, 0);
  var width = 100;
  var height = 200;

  expect((a.width = width), 'Set width').toBeTruthy();
  expect((a.height = height), 'Set height').toBeTruthy();

  a.set(width, height);
  assert.strictEqual(a.width, width, 'Get width');
  assert.strictEqual(a.height, height, 'Get height');
});

test.skip('Vector2#Vector2#width', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#height', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

// PUBLIC STUFF
test.skip('Vector2#Vector2#isVector2', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Vector2#set', () => {
  var a = new Vector2();
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();

  a.set(x, y);
  expect(a.x === x, 'Passed!').toBeTruthy();
  expect(a.y === y, 'Passed!').toBeTruthy();
});

test.skip('Vector2#Vector2#setScalar', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#setX', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#setY', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#setComponent', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#getComponent', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#clone', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Vector2#copy', () => {
  var a = new Vector2(x, y);
  var b = new Vector2().copy(a);
  expect(b.x === x, 'Passed!').toBeTruthy();
  expect(b.y === y, 'Passed!').toBeTruthy();

  // ensure that it is a true copy
  a.x = 0;
  a.y = -1;
  expect(b.x === x, 'Passed!').toBeTruthy();
  expect(b.y === y, 'Passed!').toBeTruthy();
});

test('three.js#Vector2#add', () => {
  var a = new Vector2(x, y);
  var b = new Vector2(-x, -y);

  a.add(b);
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();

  var c = new Vector2().addVectors(b, b);
  expect(c.x === -2 * x, 'Passed!').toBeTruthy();
  expect(c.y === -2 * y, 'Passed!').toBeTruthy();
});

test.skip('Vector2#Vector2#addScalar', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#addVectors', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Vector2#addScaledVector', () => {
  var a = new Vector2(x, y);
  var b = new Vector2(2, 3);
  var s = 3;

  a.addScaledVector(b, s);
  assert.strictEqual(a.x, x + b.x * s, 'Check x');
  assert.strictEqual(a.y, y + b.y * s, 'Check y');
});

test('three.js#Vector2#sub', () => {
  var a = new Vector2(x, y);
  var b = new Vector2(-x, -y);

  a.sub(b);
  expect(a.x === 2 * x, 'Passed!').toBeTruthy();
  expect(a.y === 2 * y, 'Passed!').toBeTruthy();

  var c = new Vector2().subVectors(a, a);
  expect(c.x === 0, 'Passed!').toBeTruthy();
  expect(c.y === 0, 'Passed!').toBeTruthy();
});

test.skip('Vector2#Vector2#subScalar', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#subVectors', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#multiply', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#multiplyScalar', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#divide', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#divideScalar', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

// TODO
test.skip('Vector2#applyMatrix3', () => {
  var a = new Vector2(x, y);
  var m = new Matrix3().set(2, 3, 5, 7, 11, 13, 17, 19, 23);

  a.applyMatrix3(m);
  assert.strictEqual(a.x, 18, 'Check x');
  assert.strictEqual(a.y, 60, 'Check y');
});

test.skip('Vector2#Vector2#min', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#max', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#clamp', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#clampScalar', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#clampLength', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#floor', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#ceil', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#round', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#roundToZero', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Vector2#negate', () => {
  var a = new Vector2(x, y);

  a.negate();
  expect(a.x === -x, 'Passed!').toBeTruthy();
  expect(a.y === -y, 'Passed!').toBeTruthy();
});

test('three.js#Vector2#dot', () => {
  var a = new Vector2(x, y);
  var b = new Vector2(-x, -y);
  var c = new Vector2();

  let result = a.dot(b);
  expect(result === -x * x - y * y, 'Passed!').toBeTruthy();

  result = a.dot(c);
  expect(result === 0, 'Passed!').toBeTruthy();
});

test.skip('Vector2#Vector2#lengthSq', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#length', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#manhattanLength', () => {
  var a = new Vector2(x, 0);
  var b = new Vector2(0, -y);
  var c = new Vector2();

  assert.strictEqual(a.manhattanLength(), x, 'Positive component');
  assert.strictEqual(b.manhattanLength(), y, 'Negative component');
  assert.strictEqual(c.manhattanLength(), 0, 'Empty component');

  a.set(x, y);
  assert.strictEqual(a.manhattanLength(), Math.abs(x) + Math.abs(y), 'Two components');
});

test('three.js#Vector2#normalize', () => {
  var a = new Vector2(x, 0);
  var b = new Vector2(0, -y);

  a.normalize();
  expect(a.len() === 1, 'Passed!').toBeTruthy();
  expect(a.x === 1, 'Passed!').toBeTruthy();

  b.normalize();
  expect(b.len() === 1, 'Passed!').toBeTruthy();
  expect(b.y === -1, 'Passed!').toBeTruthy();
});

test.skip('Vector2#Vector2#angle', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#distanceTo', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#distanceToSquared', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#manhattanDistanceTo', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#setLength', () => {
  let a = new Vector2(x, 0);

  expect(a.len() === x, 'Passed!').toBeTruthy();
  a.setLength(y);
  expect(a.len() === y, 'Passed!').toBeTruthy();

  a = new Vector2(0, 0);
  expect(a.len() === 0, 'Passed!').toBeTruthy();
  a.setLength(y);
  expect(a.len() === 0, 'Passed!').toBeTruthy();
  a.setLength();
  expect(isNaN(a.len()), 'Passed!').toBeTruthy();
});

test.skip('Vector2#Vector2#lerp', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('Vector2#Vector2#lerpVectors', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Vector2#equals', () => {
  var a = new Vector2(x, 0);
  var b = new Vector2(0, -y);

  expect(a.x !== b.x, 'Passed!').toBeTruthy();
  expect(a.y !== b.y, 'Passed!').toBeTruthy();

  expect(!a.equals(b), 'Passed!').toBeTruthy();
  expect(!b.equals(a), 'Passed!').toBeTruthy();

  a.copy(b);
  expect(a.x === b.x, 'Passed!').toBeTruthy();
  expect(a.y === b.y, 'Passed!').toBeTruthy();

  expect(a.equals(b), 'Passed!').toBeTruthy();
  expect(b.equals(a), 'Passed!').toBeTruthy();
});

test('three.js#Vector2#fromArray', () => {
  var a = new Vector2();
  var array = [1, 2, 3, 4];

  a.fromArray(array);
  assert.strictEqual(a.x, 1, 'No offset: check x');
  assert.strictEqual(a.y, 2, 'No offset: check y');

  a.fromArray(array, 2);
  assert.strictEqual(a.x, 3, 'With offset: check x');
  assert.strictEqual(a.y, 4, 'With offset: check y');
});

test('three.js#Vector2#toArray', () => {
  var a = new Vector2(x, y);

  let array = a.toArray();
  assert.strictEqual(array[0], x, 'No array, no offset: check x');
  assert.strictEqual(array[1], y, 'No array, no offset: check y');

  array = [];
  a.toArray(array);
  assert.strictEqual(array[0], x, 'With array, no offset: check x');
  assert.strictEqual(array[1], y, 'With array, no offset: check y');

  array = [];
  a.toArray(array, 1);
  assert.strictEqual(array[0], undefined, 'With array and offset: check [0]');
  assert.strictEqual(array[1], x, 'With array and offset: check x');
  assert.strictEqual(array[2], y, 'With array and offset: check y');
});

/* TODO
test.skip('Vector2#fromBufferAttribute', assert => {
  var a = new Vector2();
  var attr = new BufferAttribute(new Float32Array([1, 2, 3, 4]), 2);

  a.fromBufferAttribute(attr, 0);
  assert.strictEqual(a.x, 1, 'Offset 0: check x');
  assert.strictEqual(a.y, 2, 'Offset 0: check y');

  a.fromBufferAttribute(attr, 1);
  assert.strictEqual(a.x, 3, 'Offset 1: check x');
  assert.strictEqual(a.y, 4, 'Offset 1: check y');
});
*/

test.skip('Vector2#Vector2#rotateAround', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

// TODO (Itee) refactor/split
test.skip('Vector2#setX,setY', () => {
  var a = new Vector2();
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();

  a.setX(x);
  a.setY(y);
  expect(a.x === x, 'Passed!').toBeTruthy();
  expect(a.y === y, 'Passed!').toBeTruthy();
});

test('three.js#Vector2#setComponent,getComponent', () => {
  var a = new Vector2();
  expect(a.x === 0, 'Passed!').toBeTruthy();
  expect(a.y === 0, 'Passed!').toBeTruthy();

  a.setComponent(0, 1);
  a.setComponent(1, 2);
  expect(a.getComponent(0) === 1, 'Passed!').toBeTruthy();
  expect(a.getComponent(1) === 2, 'Passed!').toBeTruthy();
});

test('three.js#Vector2#multiply/divide', () => {
  var a = new Vector2(x, y);
  var b = new Vector2(-x, -y);

  a.multiplyScalar(-2);
  expect(a.x === x * -2, 'Passed!').toBeTruthy();
  expect(a.y === y * -2, 'Passed!').toBeTruthy();

  b.multiplyScalar(-2);
  expect(b.x === 2 * x, 'Passed!').toBeTruthy();
  expect(b.y === 2 * y, 'Passed!').toBeTruthy();

  a.divideScalar(-2);
  expect(a.x === x, 'Passed!').toBeTruthy();
  expect(a.y === y, 'Passed!').toBeTruthy();

  b.divideScalar(-2);
  expect(b.x === -x, 'Passed!').toBeTruthy();
  expect(b.y === -y, 'Passed!').toBeTruthy();
});

test('three.js#Vector2#min/max/clamp', () => {
  var a = new Vector2(x, y);
  var b = new Vector2(-x, -y);
  var c = new Vector2();

  c.copy(a).min(b);
  expect(c.x === -x, 'Passed!').toBeTruthy();
  expect(c.y === -y, 'Passed!').toBeTruthy();

  c.copy(a).max(b);
  expect(c.x === x, 'Passed!').toBeTruthy();
  expect(c.y === y, 'Passed!').toBeTruthy();

  c.set(-2 * x, 2 * y);
  c.clamp(b, a);
  expect(c.x === -x, 'Passed!').toBeTruthy();
  expect(c.y === y, 'Passed!').toBeTruthy();

  c.set(-2 * x, 2 * x);
  c.clampScalar(-x, x);
  expect(c.x, 'scalar clamp x').toBe(-x);
  expect(c.y, 'scalar clamp y').toBe(x);
});

test.skip('Vector2#rounding', () => {
  expect(new Vector2(-0.1, 0.1).floor(), 'floor .1').toEqual(new Vector2(-1, 0));
  expect(new Vector2(-0.5, 0.5).floor(), 'floor .5').toEqual(new Vector2(-1, 0));
  expect(new Vector2(-0.9, 0.9).floor(), 'floor .9').toEqual(new Vector2(-1, 0));

  expect(new Vector2(-0.1, 0.1).ceil(), 'ceil .1').toEqual(new Vector2(0, 1));
  expect(new Vector2(-0.5, 0.5).ceil(), 'ceil .5').toEqual(new Vector2(0, 1));
  expect(new Vector2(-0.9, 0.9).ceil(), 'ceil .9').toEqual(new Vector2(0, 1));

  expect(new Vector2(-0.1, 0.1).round(), 'round .1').toEqual(new Vector2(0, 0));
  expect(new Vector2(-0.5, 0.5).round(), 'round .5').toEqual(new Vector2(0, 1));
  expect(new Vector2(-0.9, 0.9).round(), 'round .9').toEqual(new Vector2(-1, 1));

  expect(new Vector2(-0.1, 0.1).roundToZero(), 'roundToZero .1').toEqual(new Vector2(0, 0));
  expect(new Vector2(-0.5, 0.5).roundToZero(), 'roundToZero .5').toEqual(new Vector2(0, 0));
  expect(new Vector2(-0.9, 0.9).roundToZero(), 'roundToZero .9').toEqual(new Vector2(0, 0));
  expect(new Vector2(-1.1, 1.1).roundToZero(), 'roundToZero 1.1').toEqual(new Vector2(-1, 1));
  expect(new Vector2(-1.5, 1.5).roundToZero(), 'roundToZero 1.5').toEqual(new Vector2(-1, 1));
  expect(new Vector2(-1.9, 1.9).roundToZero(), 'roundToZero 1.9').toEqual(new Vector2(-1, 1));
});

test('three.js#Vector2#length/lengthSq', () => {
  var a = new Vector2(x, 0);
  var b = new Vector2(0, -y);
  var c = new Vector2();

  expect(a.len() === x, 'Passed!').toBeTruthy();
  expect(a.lengthSq() === x * x, 'Passed!').toBeTruthy();
  expect(b.len() === y, 'Passed!').toBeTruthy();
  expect(b.lengthSq() === y * y, 'Passed!').toBeTruthy();
  expect(c.len() === 0, 'Passed!').toBeTruthy();
  expect(c.lengthSq() === 0, 'Passed!').toBeTruthy();

  a.set(x, y);
  expect(a.len() === Math.sqrt(x * x + y * y), 'Passed!').toBeTruthy();
  expect(a.lengthSq() === x * x + y * y, 'Passed!').toBeTruthy();
});

test('three.js#Vector2#distanceTo/distanceToSquared', () => {
  var a = new Vector2(x, 0);
  var b = new Vector2(0, -y);
  var c = new Vector2();

  expect(a.distanceTo(c) === x, 'Passed!').toBeTruthy();
  expect(a.distanceToSquared(c) === x * x, 'Passed!').toBeTruthy();

  expect(b.distanceTo(c) === y, 'Passed!').toBeTruthy();
  expect(b.distanceToSquared(c) === y * y, 'Passed!').toBeTruthy();
});

test('three.js#Vector2#lerp/clone', () => {
  var a = new Vector2(x, 0);
  var b = new Vector2(0, -y);

  expect(a.lerp(a, 0).equals(a.lerp(a, 0.5)), 'Passed!').toBeTruthy();
  expect(a.lerp(a, 0).equals(a.lerp(a, 1)), 'Passed!').toBeTruthy();

  expect(a.clone().lerp(b, 0).equals(a), 'Passed!').toBeTruthy();

  expect(a.clone().lerp(b, 0.5).x === x * 0.5, 'Passed!').toBeTruthy();
  expect(a.clone().lerp(b, 0.5).y === -y * 0.5, 'Passed!').toBeTruthy();

  expect(a.clone().lerp(b, 1).equals(b), 'Passed!').toBeTruthy();
});

test('three.js#Vector2#setComponent/getComponent exceptions', () => {
  var a = new Vector2(0, 0);

  expect(
    () => a.setComponent(2, 0),
    'setComponent with an out of range index throws Error'
  ).toThrow(/index is out of range/);
  expect(() => a.getComponent(2), 'getComponent with an out of range index throws Error').toThrow(
    /index is out of range/
  );
});

test('three.js#Vector2#setScalar/addScalar/subScalar', () => {
  var a = new Vector2(1, 1);
  var s = 3;

  a.setScalar(s);
  assert.strictEqual(a.x, s, 'setScalar: check x');
  assert.strictEqual(a.y, s, 'setScalar: check y');

  a.addScalar(s);
  assert.strictEqual(a.x, 2 * s, 'addScalar: check x');
  assert.strictEqual(a.y, 2 * s, 'addScalar: check y');

  a.subScalar(2 * s);
  assert.strictEqual(a.x, 0, 'subScalar: check x');
  assert.strictEqual(a.y, 0, 'subScalar: check y');
});

test('three.js#Vector2#multiply/divide', () => {
  var a = new Vector2(x, y);
  var b = new Vector2(2 * x, 2 * y);
  var c = new Vector2(4 * x, 4 * y);

  a.multiply(b);
  assert.strictEqual(a.x, x * b.x, 'multiply: check x');
  assert.strictEqual(a.y, y * b.y, 'multiply: check y');

  b.divide(c);
  assert.strictEqual(b.x, 0.5, 'divide: check x');
  assert.strictEqual(b.y, 0.5, 'divide: check y');
});
