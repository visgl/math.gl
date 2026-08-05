// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

/* eslint-disable max-statements */
import {test, expect} from 'vitest';
import {Vector2, Vector3, Vector4} from '@math.gl/core';

// FOR TAPE TESTING
export {};

test('Math#types', () => {
  expect(typeof Vector2).toBe('function');
  expect(typeof Vector3).toBe('function');
  expect(typeof Vector4).toBe('function');
});

test('Math#construct and Array.isArray check', () => {
  expect(Array.isArray(new Vector2())).toBeTruthy();
  expect(Array.isArray(new Vector3())).toBeTruthy();
  expect(Array.isArray(new Vector4())).toBeTruthy();
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

test('Vector4#members and methods', () => {
  const v = new Vector4();
  expect(v.x).toBe(0);
  expect(v.y).toBe(0);
  expect(v.z).toBe(0);
  expect(v.w).toBe(0);

  for (const method of VECTOR_METHODS) {
    expect(typeof v[method]).toBe('function');
  }
});
