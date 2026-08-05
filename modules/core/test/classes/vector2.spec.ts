// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

/* eslint-disable max-statements */
import {test, expect} from 'vitest';

import {Vector2, Matrix4, Matrix3, equals} from '@math.gl/core';

test('Vector2#import', () => {
  expect(typeof Vector2).toBe('function');
});

test('Vector2#construct and Array.isArray check', () => {
  expect(Array.isArray(new Vector2())).toBeTruthy();
});

// ['add', 'cross'];
const VECTOR_METHODS = ['clone'];

test('Vector2#members and methods', () => {
  const v = new Vector2();
  expect(v.x).toBe(0);
  expect(v.y).toBe(0);

  for (const method of VECTOR_METHODS) {
    expect(typeof v[method]).toBe('function');
  }
});

test('Vector2#from', () => {
  let vector2;
  vector2 = new Vector2().from([1, 2]);
  expect(equals(vector2, [1, 2])).toBe(true);
  vector2 = new Vector2().from({x: 1, y: 2});
  expect(equals(vector2, [1, 2])).toBe(true);
});

test('Vector2#to', () => {
  const vector2 = new Vector2(1, 2);
  expect(equals(vector2.to([0, 0]), [1, 2])).toBe(true);
  expect(vector2.to({x: 0, y: 0})).toEqual({x: 1, y: 2});
});

test('Vector2#toString', () => {
  const TEST_CASES = [{input: [0, 1], precision: 5, string: '[0, 1]'}];
  for (const tc of TEST_CASES) {
    const v = new Vector2(tc.input);
    expect(String(v)).toBe(tc.string);
    expect(`${v}`).toBe(tc.string);
  }
});

test('Vector2#scale', () => {
  const TEST_CASES = [
    {input: [1, 2], scale: 5, result: [5, 10]},
    {input: [1, 2], scale: [2, -1], result: [2, -2]}
  ];
  for (const tc of TEST_CASES) {
    const result = new Vector2(tc.input).scale(tc.scale);
    expect(equals(result, tc.result)).toBe(true);
  }
});

test('Vector2#distance', () => {
  const TEST_CASES = [{start: [0, 0], end: [3, 4], result: 5}];
  for (const tc of TEST_CASES) {
    const result = new Vector2(tc.start).distance(tc.end);
    expect(result).toBe(tc.result);
  }
});

test('Vector2#len', () => {
  const TEST_CASES = [
    {input: [0, 0], result: 0},
    {input: [3, 4], result: 5}
  ];
  for (const tc of TEST_CASES) {
    const result = new Vector2(tc.input).len();
    expect(result).toBe(tc.result);
  }
});

test('Vector2#dot', () => {
  const TEST_CASES = [{input1: [1, 3], input2: [4, -2], result: -2}];
  for (const tc of TEST_CASES) {
    const result = new Vector2(tc.input1).dot(tc.input2);
    expect(result).toBe(tc.result);
  }
});

test('Vector2#normalize', () => {
  const TEST_CASES = [
    {input: [0, 0], result: [0, 0]},
    {input: [1, 0], result: [1, 0]},
    {input: [3, 4], result: [0.6, 0.8]},
    {input: [1, 1], result: [1 / Math.sqrt(2), 1 / Math.sqrt(2)]}
  ];
  for (const tc of TEST_CASES) {
    const v = new Vector2(tc.input);
    const result = v.normalize();
    expect(result.equals(tc.result)).toBeTruthy();
  }
});

test('Vector2#horizontalAngle', () => {
  const TEST_CASES = [
    {input: [0, 0], result: 0},
    {input: [1, 0], result: 0},
    {input: [1, 1], result: 0.7853981633974483}
  ];
  for (const tc of TEST_CASES) {
    const result = new Vector2(tc.input).horizontalAngle();
    expect(equals(result, tc.result)).toBe(true);
  }
});

test('Vector2#verticalAngle', () => {
  const TEST_CASES = [
    {input: [0, 0], result: 0},
    {input: [1, 0], result: 1.5707963267948966},
    {input: [1, 1], result: 0.7853981633974483}
  ];
  for (const tc of TEST_CASES) {
    const result = new Vector2(tc.input).verticalAngle();
    expect(equals(result, tc.result)).toBe(true);
  }
});

test('Vector2#transform', () => {
  const transform = new Matrix4().scale([0.5, 0.5, 0.5]).translate([1, 1, 1]);

  const TEST_CASES = [
    {input: [0, 0], result: [0.5, 0.5]},
    {input: [1, 0], result: [1, 0.5]},
    {input: [3, 4], result: [2, 2.5]},
    {input: [1, 1], result: [1, 1]}
  ];
  for (const testCase of TEST_CASES) {
    const v = new Vector2(testCase.input);
    const result = v.transform(transform);
    expect(equals(result, testCase.result)).toBe(true);
  }
});

test('Vector2#transformAsVector', () => {
  const transform = new Matrix4().scale([0.5, 0.5, 0.5]).translate([1, 1, 1]);

  const TEST_CASES = [
    {input: [0, 0], result: [0, 0]},
    {input: [1, 0], result: [0.5, 0]}
  ];
  for (const testCase of TEST_CASES) {
    const v = new Vector2(testCase.input);
    const result = v.transformAsVector(transform);
    expect(equals(result, testCase.result)).toBe(true);
  }
});

test('Vector2#transformByMatrix3', () => {
  const transform = new Matrix3().scale([0.5, 0.5, 0.5]).translate([1, 1, 1]);

  const TEST_CASES = [
    {input: [0, 0], result: [0.5, 0.5]},
    {input: [1, 0], result: [1, 0.5]},
    {input: [3, 4], result: [2, 2.5]},
    {input: [1, 1], result: [1, 1]}
  ];
  for (const testCase of TEST_CASES) {
    const v = new Vector2(testCase.input);
    const result = v.transformByMatrix3(transform);
    expect(equals(result, testCase.result)).toBe(true);
  }
});

test('Vector2#transformByMatrix2x3', () => {
  const transform = [0.5, 0, 0, 0.5, 0.5, 0.5];

  const TEST_CASES = [
    {input: [0, 0], result: [0.5, 0.5]},
    {input: [1, 0], result: [1, 0.5]},
    {input: [3, 4], result: [2, 2.5]},
    {input: [1, 1], result: [1, 1]}
  ];
  for (const testCase of TEST_CASES) {
    const v = new Vector2(testCase.input);
    const result = v.transformByMatrix2x3(transform);
    expect(equals(result, testCase.result)).toBe(true);
  }
});

test('Vector2#transformByMatrix2', () => {
  const transform = [0.5, 0, 0, 0.5];

  const TEST_CASES = [
    {input: [0, 0], result: [0, 0]},
    {input: [1, 0], result: [0.5, 0]},
    {input: [3, 4], result: [1.5, 2]},
    {input: [1, 1], result: [0.5, 0.5]}
  ];
  for (const testCase of TEST_CASES) {
    const v = new Vector2(testCase.input);
    const result = v.transformByMatrix2(transform);
    expect(equals(result, testCase.result)).toBe(true);
  }
});
