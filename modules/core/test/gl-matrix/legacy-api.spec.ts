// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import * as glMatrix from '../../src/gl-matrix/common';
import * as mat3 from '../../src/gl-matrix/mat3';
import * as mat4 from '../../src/gl-matrix/mat4';
import * as quat from '../../src/gl-matrix/quat';
import * as vec2 from '../../src/gl-matrix/vec2';
import * as vec3 from '../../src/gl-matrix/vec3';
import * as vec4 from '../../src/gl-matrix/vec4';

function expectArray(actual: ArrayLike<number>, expected: number[], precision = 5): void {
  expect(actual.length).toBe(expected.length);
  for (let index = 0; index < expected.length; index++) {
    expect(actual[index]).toBeCloseTo(expected[index], precision);
  }
}

describe('gl-matrix compatibility API', () => {
  test('common helpers support configurable array types and numeric edge cases', () => {
    expect(glMatrix.round(1.5)).toBe(2);
    expect(glMatrix.round(-1.5)).toBe(-2);
    expect(glMatrix.round(-1.2)).toBe(-1);
    expect(glMatrix.toRadian(180)).toBeCloseTo(Math.PI);
    expect(glMatrix.equals(1, 1 + 1e-7)).toBe(true);
    expect(glMatrix.equals(1, 1.01)).toBe(false);

    const originalType = glMatrix.ARRAY_TYPE;
    try {
      glMatrix.setMatrixArrayType(Array);
      expect(vec2.create()).toEqual([0, 0]);
      expect(mat4.create()).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    } finally {
      glMatrix.setMatrixArrayType(originalType);
    }
  });

  test('vec2 covers arithmetic, transforms, iteration, and compatibility aliases', () => {
    const a = vec2.fromValues(3, 4);
    const b = vec2.fromValues(-1, 2);
    const out = vec2.create();
    expectArray(vec2.clone(a), [3, 4]);
    expectArray(vec2.copy(out, a), [3, 4]);
    expectArray(vec2.set(out, 5, 6), [5, 6]);
    expectArray(vec2.add(out, a, b), [2, 6]);
    expectArray(vec2.subtract(out, a, b), [4, 2]);
    expectArray(vec2.multiply(out, a, b), [-3, 8]);
    expectArray(vec2.divide(out, a, b), [-3, 2]);
    expectArray(vec2.ceil(out, [1.1, -1.1]), [2, -1]);
    expectArray(vec2.floor(out, [1.9, -1.1]), [1, -2]);
    expectArray(vec2.min(out, a, b), [-1, 2]);
    expectArray(vec2.max(out, a, b), [3, 4]);
    expectArray(vec2.round(out, [1.5, -1.5]), [2, -2]);
    expectArray(vec2.scale(out, a, 2), [6, 8]);
    expectArray(vec2.scaleAndAdd(out, a, b, 2), [1, 8]);
    expect(vec2.distance(a, b)).toBeCloseTo(Math.sqrt(20));
    expect(vec2.dist(a, b)).toBeCloseTo(vec2.distance(a, b));
    expect(vec2.squaredDistance(a, b)).toBe(20);
    expect(vec2.sqrDist(a, b)).toBe(20);
    expect(vec2.length(a)).toBe(5);
    expect(vec2.len(a)).toBe(5);
    expect(vec2.squaredLength(a)).toBe(25);
    expect(vec2.sqrLen(a)).toBe(25);
    expectArray(vec2.negate(out, a), [-3, -4]);
    expectArray(vec2.inverse(out, [2, 4]), [0.5, 0.25]);
    expectArray(vec2.normalize(out, a), [0.6, 0.8]);
    expectArray(vec2.normalize(out, [0, 0]), [0, 0]);
    expect(vec2.dot(a, b)).toBe(5);
    expectArray(vec2.cross(vec3.create(), a, b), [0, 0, 10]);
    expectArray(vec2.lerp(out, a, b, 0.25), [2, 3.5]);
    expectArray(vec2.transformMat2(out, [2, 3], [1, 2, 3, 4]), [11, 16]);
    expectArray(vec2.transformMat2d(out, [2, 3], [1, 0, 0, 1, 5, 6]), [7, 9]);
    expectArray(
      vec2.transformMat3(out, [2, 3], mat3.fromTranslation(mat3.create(), [5, 6])),
      [7, 9]
    );
    expectArray(
      vec2.transformMat4(out, [2, 3], mat4.fromTranslation(mat4.create(), [5, 6, 7])),
      [7, 9]
    );
    expectArray(vec2.rotate(out, [1, 0], [0, 0], Math.PI / 2), [0, 1]);
    expect(vec2.angle([1, 0], [0, 1])).toBeCloseTo(Math.PI / 2);
    expectArray(vec2.zero(out), [0, 0]);
    expect(vec2.str([1, 2])).toBe('vec2(1, 2)');
    expect(vec2.exactEquals([1, 2], [1, 2])).toBe(true);
    expect(vec2.equals([1, 2], [1 + 1e-7, 2])).toBe(true);
    expect(vec2.sub).toBe(vec2.subtract);
    expect(vec2.mul).toBe(vec2.multiply);
    expect(vec2.div).toBe(vec2.divide);
    let sum = 0;
    vec2.forEach([1, 2], 2, 0, 1, value => {
      sum += value[0] + value[1];
    });
    expect(sum).toBe(3);
    expectArray(vec2.random(out, 3), [out[0], out[1]]);
    expect(vec2.length(out)).toBeCloseTo(3);
  });

  test('vec3 and vec4 cover interpolation, rotations, and homogeneous transforms', () => {
    const v3 = vec3.fromValues(1, 2, 3);
    const w3 = vec3.fromValues(4, -2, 1);
    const o3 = vec3.create();
    for (const operation of [
      () => vec3.clone(v3),
      () => vec3.copy(o3, v3),
      () => vec3.set(o3, 3, 4, 5),
      () => vec3.add(o3, v3, w3),
      () => vec3.subtract(o3, v3, w3),
      () => vec3.multiply(o3, v3, w3),
      () => vec3.divide(o3, v3, w3),
      () => vec3.ceil(o3, [1.1, 2.1, 3.1]),
      () => vec3.floor(o3, [1.9, 2.9, 3.9]),
      () => vec3.min(o3, v3, w3),
      () => vec3.max(o3, v3, w3),
      () => vec3.round(o3, [1.5, 2.5, 3.5]),
      () => vec3.scale(o3, v3, 2),
      () => vec3.scaleAndAdd(o3, v3, w3, 2),
      () => vec3.negate(o3, v3),
      () => vec3.inverse(o3, v3),
      () => vec3.normalize(o3, v3),
      () => vec3.lerp(o3, v3, w3, 0.25),
      () => vec3.slerp(o3, [1, 0, 0], [0, 1, 0], 0.5),
      () => vec3.hermite(o3, v3, w3, [0, 1, 0], [1, 0, 0], 0.5),
      () => vec3.bezier(o3, v3, w3, [0, 1, 0], [1, 0, 0], 0.5),
      () => vec3.transformMat3(o3, v3, mat3.fromRotation(mat3.create(), 0.25)),
      () => vec3.transformMat4(o3, v3, mat4.fromTranslation(mat4.create(), [1, 2, 3])),
      () => vec3.rotateX(o3, v3, [0, 0, 0], 0.25),
      () => vec3.rotateY(o3, v3, [0, 0, 0], 0.25),
      () => vec3.rotateZ(o3, v3, [0, 0, 0], 0.25),
      () => vec3.transformQuat(o3, v3, quat.setAxisAngle(quat.create(), [0, 0, 1], 0.25)),
      () => vec3.zero(o3)
    ]) {
      expect(operation()).toBeTruthy();
    }
    expect(vec3.cross(o3, v3, w3)).toBe(o3);
    expect(vec3.dot(v3, w3)).toBe(3);
    expect(vec3.angle([1, 0, 0], [0, 1, 0])).toBeCloseTo(Math.PI / 2);
    expect(vec3.str([1, 2, 3])).toBe('vec3(1, 2, 3)');
    expect(vec3.exactEquals(v3, [1, 2, 3])).toBe(true);
    expect(vec3.equals(v3, [1 + 1e-7, 2, 3])).toBe(true);
    expect(vec3.sub).toBe(vec3.subtract);
    expect(vec3.mul).toBe(vec3.multiply);
    expect(vec3.div).toBe(vec3.divide);
    let product = 1;
    vec3.forEach([2, 3, 4], 2, 0, 1, value => {
      product *= value[0] * value[1] * value[2];
    });
    expect(product).toBe(24);
    expect(vec3.length(vec3.random(o3, 2))).toBeCloseTo(2);

    const v4 = vec4.fromValues(1, 2, 3, 1);
    const w4 = vec4.fromValues(4, -2, 1, 2);
    const o4 = vec4.create();
    for (const operation of [
      () => vec4.clone(v4),
      () => vec4.copy(o4, v4),
      () => vec4.set(o4, 3, 4, 5, 6),
      () => vec4.add(o4, v4, w4),
      () => vec4.subtract(o4, v4, w4),
      () => vec4.multiply(o4, v4, w4),
      () => vec4.divide(o4, v4, w4),
      () => vec4.ceil(o4, [1.1, 2.1, 3.1, 4.1]),
      () => vec4.floor(o4, [1.9, 2.9, 3.9, 4.9]),
      () => vec4.min(o4, v4, w4),
      () => vec4.max(o4, v4, w4),
      () => vec4.round(o4, [1.5, 2.5, 3.5, 4.5]),
      () => vec4.scale(o4, v4, 2),
      () => vec4.scaleAndAdd(o4, v4, w4, 2),
      () => vec4.negate(o4, v4),
      () => vec4.inverse(o4, v4),
      () => vec4.normalize(o4, v4),
      () => vec4.lerp(o4, v4, w4, 0.25),
      () => vec4.transformMat4(o4, v4, mat4.fromTranslation(mat4.create(), [1, 2, 3])),
      () => vec4.transformQuat(o4, v4, quat.setAxisAngle(quat.create(), [0, 0, 1], 0.25)),
      () => vec4.zero(o4)
    ]) {
      expect(operation()).toBeTruthy();
    }
    expect(vec4.cross(o4, v4, w4, [0, 1, 0])).toBe(o4);
    expect(vec4.dot(v4, w4)).toBe(5);
    expect(vec4.str([1, 2, 3, 4])).toBe('vec4(1, 2, 3, 4)');
    expect(vec4.exactEquals(v4, [1, 2, 3, 1])).toBe(true);
    expect(vec4.equals(v4, [1 + 1e-7, 2, 3, 1])).toBe(true);
    expect(vec4.sub).toBe(vec4.subtract);
    expect(vec4.mul).toBe(vec4.multiply);
    expect(vec4.div).toBe(vec4.divide);
    let total = 0;
    vec4.forEach([1, 2, 3, 4], 2, 0, 1, value => {
      total += value[0] + value[1] + value[2] + value[3];
    });
    expect(total).toBe(10);
    expect(vec4.length(vec4.random(o4, 2))).toBeCloseTo(2);
  });

  test('mat3 covers construction, transforms, inversion, and arithmetic', () => {
    const a = mat3.fromValues(1, 2, 3, 0, 1, 4, 5, 6, 0);
    const b = mat3.fromValues(2, 0, 1, 1, 2, 0, 0, 1, 2);
    const out = mat3.create();
    expectArray(mat3.clone(a), [...a]);
    expectArray(mat3.copy(out, a), [...a]);
    expectArray(mat3.set(out, 1, 2, 3, 4, 5, 6, 7, 8, 9), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expectArray(
      mat3.fromMat4(out, mat4.fromValues(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)),
      [1, 2, 3, 5, 6, 7, 9, 10, 11]
    );
    expectArray(mat3.transpose(out, a), [1, 0, 5, 2, 1, 6, 3, 4, 0]);
    const inverse = mat3.invert(out, a);
    expect(inverse).toBe(out);
    expectArray(mat3.multiply(mat3.create(), a, inverse), [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    expect(mat3.adjoint(out, a)).toBe(out);
    expect(mat3.determinant(a)).toBe(1);
    expectArray(mat3.multiply(out, a, b), [7, 10, 6, 1, 4, 11, 10, 13, 4]);
    expectArray(mat3.translate(out, mat3.create(), [2, 3]), [1, 0, 0, 0, 1, 0, 2, 3, 1]);
    expectArray(mat3.rotate(out, mat3.create(), Math.PI / 2), [0, 1, 0, -1, 0, 0, 0, 0, 1]);
    expectArray(mat3.scale(out, mat3.create(), [2, 3]), [2, 0, 0, 0, 3, 0, 0, 0, 1]);
    expectArray(mat3.fromTranslation(out, [2, 3]), [1, 0, 0, 0, 1, 0, 2, 3, 1]);
    expectArray(mat3.fromRotation(out, Math.PI / 2), [0, 1, 0, -1, 0, 0, 0, 0, 1]);
    expectArray(mat3.fromScaling(out, [2, 3]), [2, 0, 0, 0, 3, 0, 0, 0, 1]);
    expectArray(mat3.fromMat2d(out, [1, 2, 3, 4, 5, 6]), [1, 2, 0, 3, 4, 0, 5, 6, 1]);
    expectArray(
      mat3.fromQuat(out, quat.setAxisAngle(quat.create(), [0, 0, 1], Math.PI / 2)),
      [0, 1, 0, -1, 0, 0, 0, 0, 1]
    );
    expect(mat3.normalFromMat4(out, mat4.create())).toBe(out);
    expect(mat3.normalFromMat4(out, new Array(16).fill(0))).toBeNull();
    expectArray(mat3.projection(out, 2, 4), [1, 0, 0, 0, -0.5, 0, -1, 1, 1]);
    expect(mat3.str(a)).toContain('mat3(');
    expect(mat3.frob(a)).toBeCloseTo(Math.sqrt(92));
    expectArray(mat3.add(out, a, b), [3, 2, 4, 1, 3, 4, 5, 7, 2]);
    expectArray(mat3.subtract(out, a, b), [-1, 2, 2, -1, -1, 4, 5, 5, -2]);
    expectArray(mat3.multiplyScalar(out, a, 2), [2, 4, 6, 0, 2, 8, 10, 12, 0]);
    expectArray(mat3.multiplyScalarAndAdd(out, a, b, 2), [5, 2, 5, 2, 5, 4, 5, 8, 4]);
    expect(mat3.exactEquals(a, [...a])).toBe(true);
    expect(mat3.equals(a, [1 + 1e-7, 2, 3, 0, 1, 4, 5, 6, 0])).toBe(true);
    expect(mat3.mul).toBe(mat3.multiply);
    expect(mat3.sub).toBe(mat3.subtract);
  });

  test('mat4 covers projection, camera, decomposition, and quaternion conversions', () => {
    const a = mat4.fromValues(1, 2, 3, 0, 0, 1, 4, 0, 5, 6, 0, 0, 1, 2, 3, 1);
    const b = mat4.fromTranslation(mat4.create(), [4, 5, 6]);
    const out = mat4.create();
    expectArray(mat4.clone(a), [...a]);
    expectArray(mat4.copy(out, a), [...a]);
    expectArray(mat4.set(out, ...a), [...a]);
    expectArray(mat4.transpose(out, a), [1, 0, 5, 1, 2, 1, 6, 2, 3, 4, 0, 3, 0, 0, 0, 1]);
    expect(mat4.invert(out, a)).toBeTruthy();
    expect(mat4.adjoint(out, a)).toBe(out);
    expect(mat4.determinant(a)).toBe(1);
    expect(mat4.multiply(out, a, b)).toBe(out);
    expectArray(mat4.translate(out, mat4.create(), [1, 2, 3]), [
      ...mat4.fromTranslation(mat4.create(), [1, 2, 3])
    ]);
    expect(mat4.scale(out, mat4.create(), [2, 3, 4])).toBe(out);
    expect(mat4.rotate(out, mat4.create(), 0.5, [1, 2, 3])).toBe(out);
    expect(mat4.rotateX(out, mat4.create(), 0.5)).toBe(out);
    expect(mat4.rotateY(out, mat4.create(), 0.5)).toBe(out);
    expect(mat4.rotateZ(out, mat4.create(), 0.5)).toBe(out);
    expect(mat4.fromTranslation(out, [1, 2, 3])).toBe(out);
    expect(mat4.fromScaling(out, [2, 3, 4])).toBe(out);
    expect(mat4.fromRotation(out, 0.5, [1, 2, 3])).toBe(out);
    expect(mat4.fromXRotation(out, 0.5)).toBe(out);
    expect(mat4.fromYRotation(out, 0.5)).toBe(out);
    expect(mat4.fromZRotation(out, 0.5)).toBe(out);
    const q = quat.setAxisAngle(quat.create(), [0, 1, 0], 0.5);
    expect(mat4.fromRotationTranslation(out, q, [1, 2, 3])).toBe(out);
    expect(mat4.fromQuat2(out, [0, 0, 0, 1, 1, 2, 3, 0])).toBe(out);
    expectArray(mat4.getTranslation([], b), [4, 5, 6]);
    expectArray(mat4.getScaling([], mat4.fromScaling(mat4.create(), [2, 3, 4])), [2, 3, 4]);
    expect(mat4.getRotation([], mat4.fromRotation(out, 0.5, [0, 1, 0]))).toBeTruthy();
    const rotation = mat4.fromRotationTranslationScale(out, q, [1, 2, 3], [2, 3, 4]);
    expect(mat4.decompose([], [], [], rotation)).toBeTruthy();
    expect(mat4.fromRotationTranslationScaleOrigin(out, q, [1, 2, 3], [2, 3, 4], [1, 1, 1])).toBe(
      out
    );
    expect(mat4.fromQuat(out, q)).toBe(out);
    expect(mat4.frustum(out, -1, 1, -1, 1, 1, 100)).toBe(out);
    expect(mat4.perspectiveNO(out, Math.PI / 2, 1, 1, 100)).toBe(out);
    expect(mat4.perspectiveZO(out, Math.PI / 2, 1, 1, 100)).toBe(out);
    expect(
      mat4.perspectiveFromFieldOfView(
        out,
        {upDegrees: 45, downDegrees: 45, leftDegrees: 45, rightDegrees: 45},
        1,
        100
      )
    ).toBe(out);
    expect(mat4.orthoNO(out, -1, 1, -1, 1, 1, 100)).toBe(out);
    expect(mat4.orthoZO(out, -1, 1, -1, 1, 1, 100)).toBe(out);
    expect(mat4.lookAt(out, [1, 2, 3], [0, 0, 0], [0, 1, 0])).toBe(out);
    expect(mat4.targetTo(out, [1, 2, 3], [0, 0, 0], [0, 1, 0])).toBe(out);
    expect(mat4.str(a)).toContain('mat4(');
    expect(mat4.frob(a)).toBeCloseTo(Math.sqrt(107));
    expect(mat4.add(out, a, b)).toBe(out);
    expect(mat4.subtract(out, a, b)).toBe(out);
    expect(mat4.multiplyScalar(out, a, 2)).toBe(out);
    expect(mat4.multiplyScalarAndAdd(out, a, b, 2)).toBe(out);
    expect(mat4.exactEquals(a, [...a])).toBe(true);
    expect(mat4.equals(a, [...a])).toBe(true);
    expect(mat4.mul).toBe(mat4.multiply);
    expect(mat4.sub).toBe(mat4.subtract);
    expect(mat4.perspective).toBe(mat4.perspectiveNO);
    expect(mat4.ortho).toBe(mat4.orthoNO);
  });

  test('quat covers axis-angle, interpolation, logarithms, and shortest rotations', () => {
    const out = quat.create();
    const q = quat.setAxisAngle(quat.create(), [0, 0, 1], Math.PI / 2);
    const identity = quat.create();
    expectArray(quat.identity(out), [0, 0, 0, 1]);
    expectArray(quat.setAxisAngle(out, [0, 0, 1], Math.PI / 2), [0, 0, 0.707106, 0.707106]);
    expect(quat.getAxisAngle([], q)).toBeCloseTo(Math.PI / 2);
    expect(quat.getAngle(identity, q)).toBeCloseTo(Math.PI / 2);
    expect(quat.multiply(out, q, q)).toBe(out);
    expect(quat.rotateX(out, q, 0.5)).toBe(out);
    expect(quat.rotateY(out, q, 0.5)).toBe(out);
    expect(quat.rotateZ(out, q, 0.5)).toBe(out);
    expect(quat.calculateW(out, [0.1, 0.2, 0.3, 0])).toBe(out);
    expect(quat.exp(out, [0.1, 0.2, 0.3, 0.5])).toBe(out);
    expect(quat.ln(out, q)).toBe(out);
    expect(quat.pow(out, q, 0.5)).toBe(out);
    expect(quat.slerp(out, identity, q, 0.5)).toBe(out);
    expect(quat.slerp(out, identity, identity, 0.5)).toBe(out);
    expect(quat.invert(out, [1, 2, 3, 4])).toBe(out);
    expect(quat.conjugate(out, [1, 2, 3, 4])).toBe(out);
    expect(quat.fromMat3(out, mat3.fromRotation(mat3.create(), 0.5))).toBe(out);
    expect(quat.str(q)).toContain('quat(');
    expect(quat.clone(q)).not.toBe(q);
    expect(quat.fromValues(1, 2, 3, 4)).toEqual(new Float32Array([1, 2, 3, 4]));
    expect(quat.copy(out, q)).toBe(out);
    expect(quat.set(out, 1, 2, 3, 4)).toBe(out);
    expect(quat.add(out, q, identity)).toBe(out);
    expect(quat.mul).toBe(quat.multiply);
    expect(quat.scale(out, q, 2)).toBe(out);
    expect(quat.dot(q, identity)).toBeCloseTo(q[3]);
    expect(quat.lerp(out, identity, q, 0.5)).toBe(out);
    expect(quat.length(q)).toBeCloseTo(1);
    expect(quat.len(q)).toBeCloseTo(1);
    expect(quat.squaredLength(q)).toBeCloseTo(1);
    expect(quat.sqrLen(q)).toBeCloseTo(1);
    expect(quat.normalize(out, [1, 2, 3, 4])).toBe(out);
    expect(quat.exactEquals(q, [...q])).toBe(true);
    expect(quat.equals(q, q)).toBe(true);
    expect(quat.rotationTo(out, [1, 0, 0], [0, 1, 0])).toBe(out);
    expect(quat.rotationTo(out, [1, 0, 0], [1, 0, 0])).toBe(out);
    expect(quat.rotationTo(out, [1, 0, 0], [-1, 0, 0])).toBe(out);
    expect(quat.sqlerp(out, identity, q, q, identity, 0.5)).toBe(out);
    expect(quat.setAxes(out, [0, 0, -1], [1, 0, 0], [0, 1, 0])).toBe(out);
  });
});
