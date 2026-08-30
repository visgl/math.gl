// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

/* eslint-disable max-statements */
import {test, expect} from 'vitest';
import {Matrix3, config, equals} from '@math.gl/core';

config.EPSILON = 1e-6;

const IDENTITY_MATRIX = [1, 0, 0, 0, 1, 0, 0, 0, 1];

const INDICES_MATRIX = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const TRANSPOSED_INDICES_MATRIX = [1, 4, 7, 2, 5, 8, 3, 6, 9];

test('Matrix3#types', () => {
  expect(typeof Matrix3).toBe('function');
  expect(Matrix3.IDENTITY).toBeTruthy();
  expect(Matrix3.ZERO).toBeTruthy();
});

test('Matrix3#construct and Array.isArray check', () => {
  const m = new Matrix3();
  expect(Array.isArray(m)).toBeTruthy();
  expect(m.INDICES).toBeTruthy();
});

test('Matrix3#from', () => {
  expect(equals(new Matrix3().from([1, 2, 3, 4, 5, 6, 7, 8, 9]), [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(
    true
  );
});

test.skip('Matrix3#to', () => {
  const matrix = new Matrix3([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(equals(matrix.to([0, 0, 0, 0, 0, 0, 0, 0, 0]), [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(true);
});

test('Matrix3#setRowMajor', () => {
  expect(typeof Matrix3.prototype.setRowMajor).toBe('function');
});

test('Matrix3#set', () => {
  expect(typeof Matrix3.prototype.set).toBe('function');

  const INPUT = INDICES_MATRIX;
  const RESULT = INDICES_MATRIX;

  const m = new Matrix3().copy(INPUT);

  expect(equals(m, RESULT), 'set gave the right result').toBe(true);
});

test('Matrix3#getElement and setElement', () => {
  expect(typeof new Matrix3().setElement).toBe('function');
  expect(typeof new Matrix3().getElement).toBe('function');

  const INPUT = INDICES_MATRIX;

  const m = new Matrix3().copy(INPUT);

  const VALUE = 10;

  m.setElement(2, 1, VALUE);
  const result = m.getElement(2, 1);
  expect(equals(result, VALUE), 'getElement gave the right result').toBe(true);
});

test('Matrix3#getColumn and setColumn', () => {
  expect(typeof new Matrix3().setColumn).toBe('function');
  expect(typeof new Matrix3().getColumn).toBe('function');

  const INPUT = INDICES_MATRIX;

  const m = new Matrix3().copy(INPUT);

  expect(equals(m.getColumn(0), [1, 2, 3])).toBe(true);
  expect(equals(m.getColumn(1), [4, 5, 6])).toBe(true);
  expect(equals(m.getColumn(2), [7, 8, 9])).toBe(true);

  m.setColumn(1, [6, -5, 4]);

  expect(equals(m.getColumn(0), [1, 2, 3])).toBe(true);
  expect(equals(m.getColumn(1), [6, -5, 4])).toBe(true);
  expect(equals(m.getColumn(2), [7, 8, 9])).toBe(true);
});

test('Matrix3#determinant', () => {
  const RESULT = 5;

  expect(typeof Matrix3.prototype.determinant).toBe('function');
  const m = new Matrix3().set(1, 2, 3, 0, 1, 5, 5, 6, 0);
  const result = m.determinant();

  expect(equals(result, RESULT), 'determinant gave the right result').toBe(true);
});

test('Matrix3#identity (identity matrix)', () => {
  expect(typeof Matrix3.prototype.identity).toBe('function');
  const m = new Matrix3();
  m.identity();

  const RESULT = IDENTITY_MATRIX;

  expect(equals(m, RESULT)).toBe(true);
});

test('Matrix3#copy', () => {
  expect(typeof Matrix3.prototype.copy).toBe('function');

  const INPUT = INDICES_MATRIX;
  const RESULT = INDICES_MATRIX;

  const m = new Matrix3().copy(INPUT);

  expect(equals(m, RESULT), 'copy gave the right result').toBe(true);
});

// calculation from the website below
// https://www.andre-gaschler.com/rotationconverter/

test('Matrix3#fromQuaternion', () => {
  expect(typeof Matrix3.prototype.fromQuaternion).toBe('function');

  const RESULT = [
    -0.7238737, 0.4321177, 0.5378486, 0.3953417, -0.379099, 0.8366534, 0.5654306, 0.8182654,
    0.1035857
  ];

  const q = [0.3713622, 0.5570433, 0.7427244, 0.0123787];

  const m = new Matrix3().identity();

  const result = m.fromQuaternion(q);

  expect(equals(result, RESULT), 'fromQuaternion gave the right result').toBe(true);
});

test('Matrix3#fromMatrix4', () => {
  const matrix3 = new Matrix3();
  const result = matrix3.fromMatrix4([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

  expect(result).toBe(matrix3);
  expect(equals(result, [1, 2, 3, 5, 6, 7, 9, 10, 11])).toBe(true);
});

test('Matrix3#transpose', () => {
  expect(typeof Matrix3.prototype.transpose).toBe('function');

  const INPUT = INDICES_MATRIX;
  const RESULT = TRANSPOSED_INDICES_MATRIX;

  const m = new Matrix3().copy(INPUT);

  const result = m.transpose();

  expect(equals(result, RESULT), 'transpose gave the right result').toBe(true);
});

test('Matrix3#invert', () => {
  const INPUT = [1, 2, 3, 0, 1, 5, 5, 6, 0];
  const RESULT = [-6, 3.6, 1.4, 5, -3, -1, -1, 0.8, 0.2];

  expect(typeof Matrix3.prototype.invert).toBe('function');
  const m = new Matrix3().copy(INPUT);
  const result = m.invert();

  expect(equals(result, RESULT), 'invert gave the right result').toBe(true);
});

test('Matrix3#multiplyLeft', () => {
  const INPUT_A = INDICES_MATRIX;
  const INPUT_B = [1, 2, 3, 0, 1, 5, 5, 6, 0];
  const RESULT = [16, 22, 13, 34, 49, 37, 52, 76, 61];

  expect(typeof Matrix3.prototype.multiplyLeft).toBe('function');
  const ma = new Matrix3().copy(INPUT_A);
  const mb = new Matrix3().copy(INPUT_B);
  const result = ma.multiplyLeft(mb);

  expect(equals(result, RESULT), 'multiplyLeft gave the right result').toBe(true);
});

test('Matrix3#multiplyRight', () => {
  const INPUT_A = INDICES_MATRIX;
  const INPUT_B = [1, 2, 3, 0, 1, 5, 5, 6, 0];
  const RESULT = [30, 36, 42, 39, 45, 51, 29, 40, 51];

  expect(typeof Matrix3.prototype.multiplyRight).toBe('function');
  const ma = new Matrix3().copy(INPUT_A);
  const mb = new Matrix3().copy(INPUT_B);
  const result = ma.multiplyRight(mb);

  expect(equals(result, RESULT), 'invert gave the right result').toBe(true);
});

test('Matrix3#rotate', () => {
  const RESULT = [0, 1, 0, -1, 0, 0, 0, 0, 1];

  expect(typeof Matrix3.prototype.rotate).toBe('function');
  const m = new Matrix3().identity();
  const result = m.rotate(Math.PI / 2);

  expect(equals(result, RESULT), 'rotate gave the right result').toBe(true);
});

test('Matrix3#scale', () => {
  const M1_RESULT = [1, 0, 0, 0, 2, 0, 0, 0, 1];
  const M2_RESULT = [2, 0, 0, 0, 2, 0, 0, 0, 1];

  expect(typeof Matrix3.prototype.scale).toBe('function');

  const m1 = new Matrix3().identity();
  const m1Result = m1.scale([1, 2, 1]);

  expect(equals(m1Result, M1_RESULT), 'scale gave the right result').toBe(true);

  const m2 = new Matrix3().identity();
  const m2Result = m2.scale(2);

  expect(equals(m2Result, M2_RESULT), 'scale gave the right result').toBe(true);
});

test('Matrix3#translate', () => {
  const RESULT = [1, 0, 0, 0, 1, 0, 1, 2, 1];

  expect(typeof Matrix3.prototype.translate).toBe('function');
  const m = new Matrix3().identity();
  const result = m.translate([1, 2]);

  expect(equals(result, RESULT), 'translate gave the right result').toBe(true);
});

test('Matrix3#transform', () => {
  const TEST_CASES = [
    {
      method: 'transform',
      input: [2, 2, 0],
      expected: [4, 4, 0]
    },
    {
      method: 'transform',
      input: [2, 2],
      expected: [4, 4]
    }
  ];

  const matrix = new Matrix3().scale([2, 2, 2]);

  for (const testCase of TEST_CASES) {
    const p4 = matrix[testCase.method](testCase.input);
    expect(equals(p4, testCase.expected), 'transform gave the right result').toBe(true);
  }

  expect(() => matrix.transform([NaN, 0, 0, 0])).toThrow();
  expect(() => matrix.transform([0])).toThrow();
  expect(() => matrix.transform([0, 0, 0, 0, 0])).toThrow();
  // @ts-expect-error TS2551: Property 'transformAsVector' does not exist
  expect(() => matrix.transformAsVector([0, 0, 0, 0, 0])).toThrow();
  // @ts-expect-error TS2551: Property 'transformAsVector' does not exist
  expect(() => matrix.transformAsPoint([0, 0, 0, 0, 0])).toThrow();
});
