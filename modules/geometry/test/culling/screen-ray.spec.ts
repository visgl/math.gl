// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {unprojectScreenRay} from '../../src/culling';

describe('unprojectScreenRay', () => {
  const viewport = {x: 100, y: 50, width: 200, height: 100};
  const identity = new Matrix4();

  test('routes absolute top-origin pixels through the selected viewport', () => {
    expect(unprojectScreenRay(identity, viewport, [200, 100])).toEqual({
      origin: [0, 0, -1],
      direction: [0, 0, 2]
    });
    expect(unprojectScreenRay(identity, viewport, [100, 50])).toEqual({
      origin: [-1, 1, -1],
      direction: [0, 0, 2]
    });
    expect(unprojectScreenRay(identity, {...viewport, x: 300}, [400, 100])).toEqual({
      origin: [0, 0, -1],
      direction: [0, 0, 2]
    });
    expect(unprojectScreenRay(identity, viewport, [0, 100])?.origin[0]).toBe(-2);
  });

  test('applies caller-supplied output space and depth convention without mutating inputs', () => {
    const matrix = new Matrix4().translate([10, 20, 30]).scale([2, 2, 3]);
    const before = [...matrix];
    expect(unprojectScreenRay(matrix, viewport, [200, 100])).toEqual({
      origin: [10, 20, 27],
      direction: [0, 0, 6]
    });
    expect(unprojectScreenRay(matrix, viewport, [200, 100], [0, 1])).toEqual({
      origin: [10, 20, 30],
      direction: [0, 0, 3]
    });
    expect([...matrix]).toEqual(before);
  });

  test('performs the homogeneous divide for perspective transforms', () => {
    const matrix = new Matrix4();
    matrix[11] = 0.5;
    const ray = unprojectScreenRay(matrix, viewport, [300, 100]);
    expect(ray?.origin).toEqual([2, 0, -2]);
    expect(ray?.direction[0]).toBeCloseTo(2 / 3 - 2);
    expect(ray?.direction[2]).toBeCloseTo(2 / 3 + 2);
  });

  test('rejects singular, non-finite, zero-sized and unbounded inputs', () => {
    expect(unprojectScreenRay(new Matrix4().scale([0, 1, 1]), viewport, [200, 100])).toBeNull();
    expect(unprojectScreenRay([1], viewport, [200, 100])).toBeNull();
    expect(unprojectScreenRay(identity, {...viewport, width: 0}, [200, 100])).toBeNull();
    expect(unprojectScreenRay(identity, viewport, [NaN, 100])).toBeNull();
    expect(unprojectScreenRay(identity, viewport, [200, 100], [0, 0])).toBeNull();
    const matrix = new Matrix4();
    matrix[11] = 1;
    expect(unprojectScreenRay(matrix, viewport, [200, 100])).toBeNull();
    matrix[11] = 2;
    expect(unprojectScreenRay(matrix, viewport, [200, 100])).toBeNull();
  });
});
