// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

/* eslint-disable max-statements */
import {test, expect} from 'vitest';

import {Vector3, Matrix4, Matrix3, Quaternion, equals} from '@math.gl/core';

test('Vector3#import', () => {
  expect(typeof Vector3).toBe('function');
});

test('Vector3#construct and Array.isArray check', () => {
  expect(Array.isArray(new Vector3())).toBeTruthy();
});

test('Vector3#from', () => {
  let vector3;
  vector3 = new Vector3().from([1, 2, 3]);
  expect(equals(vector3, [1, 2, 3])).toBe(true);
  vector3 = new Vector3().from({x: 1, y: 2, z: 3});
  expect(equals(vector3, [1, 2, 3])).toBe(true);
});

test('Vector3#to', () => {
  const vector3 = new Vector3(1, 2, 3);
  expect(equals(vector3.to([0, 0, 0]), [1, 2, 3])).toBe(true);
  expect(vector3.to({x: 0, y: 0, z: 0})).toEqual({x: 1, y: 2, z: 3});
});

// ['add', 'cross'];
const VECTOR_METHODS = ['clone'];

test('Vector3#members and methods', () => {
  const v = new Vector3();
  expect(v.x).toBe(0);
  expect(v.y).toBe(0);
  expect(v.z).toBe(0);

  for (const method of VECTOR_METHODS) {
    expect(typeof v[method]).toBe('function');
  }
});

test('Vector3#rotates', () => {
  const TEST_CASES = [
    {input: [0, 0, 1], radians: Math.PI, rotateX: [0, 0, -1]},
    {input: [0, 0, 1], radians: Math.PI / 2, rotateX: [0, -1, 0]}
  ];
  for (const tc of TEST_CASES) {
    const v = new Vector3(tc.input);
    expect(equals(v.rotateX({radians: tc.radians}), tc.rotateX)).toBe(true);
  }
});

test('Vector3#toString', () => {
  const TEST_CASES = [{input: [0, 0, 1], precision: 5, string: '[0, 0, 1]'}];
  for (const tc of TEST_CASES) {
    const v = new Vector3(tc.input);
    expect(String(v)).toBe(tc.string);
    expect(`${v}`).toBe(tc.string);
  }
});

test('Vector3#scale', () => {
  const TEST_CASES = [
    {input: [1, 2, 3], scale: 5, result: [5, 10, 15]},
    {input: [1, 2, 3], scale: [2, 0, -1], result: [2, 0, -3]}
  ];
  for (const tc of TEST_CASES) {
    const result = new Vector3(tc.input).scale(tc.scale);
    expect(equals(result, tc.result)).toBe(true);
  }
});

test('Vector3#distance', () => {
  const TEST_CASES = [{start: [0, 0, 0], end: [3, 4, 0], result: 5}];
  for (const tc of TEST_CASES) {
    const result = new Vector3(tc.start).distance(tc.end);
    expect(result).toBe(tc.result);
  }
});

test('Vector3#len', () => {
  const TEST_CASES = [
    {input: [0, 0, 0], result: 0},
    {input: [3, 4, 0], result: 5}
  ];
  for (const tc of TEST_CASES) {
    const result = new Vector3(tc.input).len();
    expect(result).toBe(tc.result);
  }
});

test('Vector3#dot', () => {
  const TEST_CASES = [{input1: [1, 3, -5], input2: [4, -2, -1], result: 3}];
  for (const tc of TEST_CASES) {
    const result = new Vector3(tc.input1).dot(tc.input2);
    expect(result).toBe(tc.result);
  }
});

test('Vector3#angle', () => {
  const TEST_CASES = [{input: [0, 1, 0], result: Math.PI / 2}];
  for (const tc of TEST_CASES) {
    const result = new Vector3([1, 0, 0]).angle(tc.input);
    expect(equals(result, tc.result)).toBe(true);
  }
});

test('Vector3#normalize', () => {
  const TEST_CASES = [
    {input: [0, 0, 0], result: [0, 0, 0]},
    {input: [1, 0, 0], result: [1, 0, 0]},
    {input: [3, 4, 0], result: [0.6, 0.8, 0]},
    {input: [1, 1, 1], result: [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)]}
  ];
  for (const tc of TEST_CASES) {
    const v = new Vector3(tc.input);
    const result = v.normalize();
    expect(result.equals(tc.result)).toBeTruthy();
  }
});

test('Vector3.rotateX', () => {
  let result = new Vector3([0, 1, 0]).rotateX({radians: Math.PI});
  expect(
    result.equals([0, -1, 0]),
    'rotation around [0, 0, 0] should return rotated vector'
  ).toBeTruthy();

  result = new Vector3([2, 7, 0]).rotateX({radians: Math.PI, origin: [2, 5, 0]});
  expect(
    result.equals([2, 3, 0]),
    'rotation around arbitrary origin should return rotated vector'
  ).toBeTruthy();
});

test('Vector3.rotateY', () => {
  let result = new Vector3([1, 1, 0]).rotateY({radians: Math.PI});
  expect(
    result.equals([-1, 1, 0]),
    'rotation around [0, 0, 0] should return rotated vector'
  ).toBeTruthy();

  result = new Vector3([-2, 3, 10]).rotateY({radians: Math.PI, origin: [-4, 3, 10]});
  expect(
    result.equals([-6, 3, 10]),
    'rotation around arbitrary origin should return rotated vector'
  ).toBeTruthy();
});

test('Vector3.rotateZ', () => {
  let result = new Vector3([0, 1, 0]).rotateZ({radians: Math.PI});
  expect(
    result.equals([0, -1, 0]),
    'rotation around [0, 0, 0] should return rotated vector'
  ).toBeTruthy();

  result = new Vector3([0, 6, -5]).rotateZ({radians: Math.PI, origin: [0, 0, -5]});
  expect(
    result.equals([0, -6, -5]),
    'rotation around arbitrary origin should return rotated vector'
  ).toBeTruthy();
});

test('Vector3#transform', () => {
  const transform = new Matrix4().scale([0.5, 0.5, 0.5]).translate([1, 1, 1]);

  const TEST_CASES = [
    {input: [0, 0, 0], result: [0.5, 0.5, 0.5]},
    {input: [1, 0, 0], result: [1, 0.5, 0.5]},
    {input: [3, 4, 0], result: [2, 2.5, 0.5]},
    {input: [1, 1, 1], result: [1, 1, 1]}
  ];
  for (const testCase of TEST_CASES) {
    const v = new Vector3(testCase.input);
    const result = v.transform(transform);
    expect(equals(result, testCase.result)).toBe(true);
  }
});

test('Vector3#transformByMatrix3', () => {
  const transform = new Matrix3().scale([0.5, 0.5, 0.5]).translate([1, 1, 1]);

  const TEST_CASES = [
    {input: [0, 0, 0], result: [0, 0, 0]},
    {input: [1, 0, 0], result: [0.5, 0, 0]},
    {input: [3, 4, 0], result: [1.5, 2, 0]},
    {input: [1, 1, 1], result: [1, 1, 1]}
  ];
  for (const testCase of TEST_CASES) {
    const v = new Vector3(testCase.input);
    const result = v.transformByMatrix3(transform);
    expect(equals(result, testCase.result)).toBe(true);
  }
});

test('Vector3#transformByMatrix2', () => {
  const transform = [0.5, 0, 0, 0.5];

  const TEST_CASES = [
    {input: [0, 0, 0], result: [0, 0, 0]},
    {input: [1, 0, 0], result: [0.5, 0, 0]},
    {input: [3, 4, 0], result: [1.5, 2, 0]},
    {input: [1, 1, 1], result: [0.5, 0.5, 1]}
  ];
  for (const testCase of TEST_CASES) {
    const v = new Vector3(testCase.input);
    const result = v.transformByMatrix2(transform);
    expect(equals(result, testCase.result)).toBe(true);
  }
});

test('Vector3#transformByQuaternion', () => {
  const transform = new Quaternion(0.5, 0.5, 0.5, 0.5);

  const TEST_CASES = [
    {input: [0, 0, 0], result: [0, 0, 0]},
    {input: [1, 0, 0], result: [0, 1, 0]},
    {input: [3, 4, 0], result: [0, 3, 4]},
    {input: [1, 1, 1], result: [1, 1, 1]}
  ];
  for (const testCase of TEST_CASES) {
    const v = new Vector3(testCase.input);
    const result = v.transformByQuaternion(transform);
    expect(equals(result, testCase.result)).toBe(true);
  }
});
