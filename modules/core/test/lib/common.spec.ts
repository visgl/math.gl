// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

import {test, expect} from 'vitest';
import {Vector2, Vector3, Pose, _MathUtils} from '@math.gl/core';
import {config, configure, isArray, clone, equals, exactEquals, formatValue} from '@math.gl/core';
import {toRadians, toDegrees} from '@math.gl/core';
import {radians, degrees, safeMod, normalizeAngle, clamp, lerp} from '@math.gl/core';

test('math.gl#tests', () => {
  expect(0, '0 and 0 compares equally').toBe(0);
  expect(0 === -0, '0 and -0 compares equally').toBe(true);
  expect([0], '0 and 0 compares equally').toEqual([0]);
  expect(equals([0], [-0]), '0 and -0 compares equally').toBe(true);
});

test('math.gl#types', () => {
  expect(typeof isArray).toBe('function');
  expect(typeof radians).toBe('function');
  expect(typeof equals).toBe('function');
  expect(typeof config.EPSILON).toBe('number');
  expect(_MathUtils).toBeTruthy();
});

test('math.gl#configue', () => {
  const {EPSILON, debug} = config;
  configure({EPSILON: 1e-13, debug: false});
  expect(config.EPSILON).toBe(1e-13);
  expect(config.debug).toBe(false);
  configure({EPSILON, debug});
  expect(config.EPSILON).toBe(EPSILON);
  expect(config.debug).toBe(debug);
});

test('math.gl#isArray', () => {
  expect(isArray([]), 'isArray([])').toBeTruthy();
  expect(isArray(new Float32Array(1)), 'isArray(Float32Array)').toBeTruthy();
  expect(isArray(new ArrayBuffer(4)), 'isArray(ArrayBuffer)').toBeFalsy();
  expect(isArray(new DataView(new ArrayBuffer(16))), 'isArray(DataView)').toBeFalsy();

  expect(isArray(undefined), 'isArray(undefined)').toBeFalsy();
  expect(isArray(null), 'isArray(null)').toBeFalsy();
  expect(isArray({}), 'isArray({})').toBeFalsy();
  expect(isArray({length: 0}), 'isArray({...})').toBeFalsy();
  expect(isArray(1), 'isArray(1)').toBeFalsy();
  expect(isArray(NaN), 'isArray(NaN)').toBeFalsy();
  expect(isArray('NaN'), "isArray('NaN')").toBeFalsy();
  expect(isArray(''), "isArray('')").toBeFalsy();
});

test('math.gl#clone', () => {
  expect(equals(clone([1, 2, 3]), [1, 2, 3]), 'clone([])').toBe(true);
  expect(equals(clone(new Vector3([1, 2, 3])), [1, 2, 3]), 'clone([])').toBe(true);
});

test('math.gl#formatValue', () => {
  expect(formatValue(1)).toBe('1');
});

test('math.gl#equals', () => {
  expect(equals(1.0, 0.0), 'should return false for different numbers').toBeFalsy();
  expect(equals(1.0, 1.0), 'should return true for the same number').toBe(true);
  expect(
    equals(1.0 + config.EPSILON / 2, 1.0),
    'should return true for numbers that are close'
  ).toBe(true);
  expect(
    equals([1.0, 2.0], new Float32Array([1.0, 2.0])),
    'should return true for Array and TypedArray with same values'
  ).toBe(true);
  expect(
    equals([1.0, 2.0], new Float32Array([1.0, 3.0])),
    'should return false for Array and TypedArray with different values'
  ).toBeFalsy();
  expect(equals([0], 0), 'should return false for Array and Number').toBeFalsy();
  expect(equals(null, 0), 'should return false for null and Number').toBeFalsy();
  expect(
    equals([1.0, 2.0], new Vector2([1.0, 2.0])),
    'should return true for Array and Vector2 with same values'
  ).toBe(true);
  expect(
    equals(new Vector2([1.0, 2.0]), [1.0, 2.0]),
    'should return true for Array and Vector2 with same values'
  ).toBeTruthy();
  expect(
    equals([1.0, 2.0], [1.0, 2.0, 3.0]),
    'should return false for Arrays of different lengths'
  ).toBeFalsy();
  expect(
    equals(new Vector2([1.0, 2.0]), [1.0, 2.0]),
    'should return true for Arrays of different types'
  ).toBeTruthy();
  expect(
    equals([1.0, 2.0], new Pose()),
    'should return false for incompatible objects w equals method'
  ).toBeFalsy();
  expect(
    equals(new Pose(), [1.0, 2.0]),
    'should return false for incompatible objects w equals method'
  ).toBeFalsy();
});

test('math.gl#exactEquals', () => {
  expect(exactEquals(1.0, 0.0), 'should return false for different numbers').toBeFalsy();
  expect(exactEquals(1.0, 1.0), 'should return true for the same number').toBeTruthy();
  expect(
    exactEquals(1.0 + config.EPSILON / 2, 1.0),
    'should return false for numbers that are close'
  ).toBeFalsy();
  expect(
    exactEquals([1.0, 2.0], [1.0, 2.0]),
    'should return true for Arrays  with same values'
  ).toBeTruthy();
  expect(
    exactEquals([1.0, 2.0], new Float32Array([1.0, 2.0])),
    'should return false for Array and TypedArray with same values'
  ).toBeFalsy();
  expect(
    exactEquals([1.0, 2.0], new Float32Array([1.0, 3.0])),
    'should return false for Array and TypedArray with different values'
  ).toBeFalsy();
  expect(
    exactEquals([1.0, 2.0], new Vector2([1.0, 2.0])),
    'should return false for Array and Vector2 with same values'
  ).toBeFalsy();
  expect(
    exactEquals([1.0, 2.0], [1.0, 2.0, 3.0]),
    'should return false for Arrays of different lengths'
  ).toBeFalsy();
  expect(
    exactEquals(new Pose(), [1.0, 2.0]),
    'should return false for incompatible objects w equals method'
  ).toBeFalsy();
  expect(
    exactEquals([1.0, 2.0], new Pose()),
    'should return false for incompatible objects w equals method'
  ).toBeFalsy();
  expect(
    exactEquals(new Pose(), new Pose({x: 1})),
    'should return false for different compatible objects w equals method'
  ).toBeFalsy();
  expect(
    exactEquals(new Pose({x: 1}), new Pose()),
    'should return false for different compatible objects w equals method'
  ).toBeFalsy();
  expect(
    exactEquals([new Pose({x: 1})], [new Pose()]),
    'should return false for arrays of different compatible objects w equals method'
  ).toBeFalsy();
});

function runTests(functionUnderTest: Function, testCases: any[]): void {
  for (const testCase of testCases) {
    expect(
      equals(functionUnderTest(testCase.input), testCase.result),
      `should return a value of ${JSON.stringify(testCase.result)}`
    ).toBe(true);
  }
}

test('math.gl#toRadians', () => {
  runTests(toRadians, [
    {input: 180, result: Math.PI},
    {input: [180, 180, 180], result: [Math.PI, Math.PI, Math.PI]},
    {input: new Vector3(180, 180, 180), result: [Math.PI, Math.PI, Math.PI]}
  ]);
});

test('math.gl#toDegrees', () => {
  runTests(toDegrees, [
    {input: Math.PI, result: 180},
    {input: [Math.PI, Math.PI, Math.PI], result: [180, 180, 180]}
  ]);
});

test('math.gl#radians', () => {
  runTests(radians, [
    {input: 180, result: Math.PI},
    {input: [180, 180, 180], result: [Math.PI, Math.PI, Math.PI]},
    {input: new Vector3(180, 180, 180), result: [Math.PI, Math.PI, Math.PI]}
  ]);
});

test('math.gl#degrees', () => {
  runTests(degrees, [
    {input: Math.PI, result: 180},
    {input: [Math.PI, Math.PI, Math.PI], result: [180, 180, 180]}
  ]);
});

test('math.gl#safeMod', () => {
  expect(safeMod(1, 3)).toBe(1);
  expect(safeMod(4, 3)).toBe(1);
  expect(safeMod(-1, 3)).toBe(2);
  expect(safeMod(-4, 3)).toBe(2);
});

test('math.gl#normalizeAngle', () => {
  expect(normalizeAngle(0, 'zero-to-two-pi')).toBe(0);
  expect(normalizeAngle(-Math.PI / 2, 'zero-to-two-pi')).toBe((Math.PI * 3) / 2);
  expect(normalizeAngle(Math.PI * 3, 'zero-to-two-pi')).toBe(Math.PI);
  expect(normalizeAngle(Math.PI * 1.5, 'negative-pi-to-pi')).toBe(-Math.PI / 2);
  expect(normalizeAngle(-Math.PI * 1.5, 'negative-pi-to-pi')).toBe(Math.PI / 2);
});

test('math.gl#clamp', () => {
  expect(equals(clamp(5.0, 2.0, 0.2), 2), 'clamp numbers').toBe(true);
  expect(equals(clamp([1.0, 0.0], -1.0, 0.2), [0.2, -0]), 'clamp arrays').toBe(true);
  expect(equals(clamp(new Float32Array([2.0, -1.0]), -1.0, 1.0), [1.0, -1.0]), 'clamp arrays').toBe(
    true
  );
});

test('math.gl#lerp', () => {
  expect(equals(lerp(1.0, 2.0, 0.2), 1.2), 'interpolate between numbers').toBe(true);
  expect(
    equals(lerp([1.0, 0.0], [2.0, -1.0], 0.2), [1.2, -0.2]),
    'interpolate between arrays'
  ).toBe(true);
  expect(
    equals(lerp(new Float32Array([1.0, 0.0]), [2.0, -1.0], 0.2), [1.2, -0.2]),
    'interpolate between arrays'
  ).toBe(true);
});
