// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {
  SampleTrack,
  Matrix4,
  Quaternion,
  mat4,
  quat,
  mat3,
  vectorProjectOnVector,
  vectorProjectOnPlane,
  vectorReflect,
  vectorSetLength,
  vectorClampLength,
  vectorManhattanDistance,
  inverseLerp,
  mapLinear,
  damp,
  smoothstep,
  smootherstep,
  pingpong,
  quatRotateTowards,
  mat4PerspectiveProjection,
  mat4OrthographicProjection,
  mat4FrustumProjection,
  getProjectionDepthRange
} from '@math.gl/core';

const close = (a: ArrayLike<number>, b: ArrayLike<number>, digits = 10) => {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) expect(a[i]).toBeCloseTo(b[i], digits);
};

it('TRS roundtrips nonuniform scales and each reflection orientation', () => {
  const q = quat.setAxisAngle([], [0, 0, 1], 0.7);
  for (const scale of [
    [2, 3, 4],
    [-2, 3, 4],
    [2, -3, 4],
    [2, 3, -4],
    [-2, -3, 4],
    [1e-12, 2e-12, 3e-12]
  ]) {
    const m = mat4.fromRotationTranslationScale([], q, [1, 2, 3], scale);
    const rotation: number[] = [],
      translation: number[] = [],
      resultScale: number[] = [];
    mat4.decompose(rotation, translation, resultScale, m);
    close(mat4.fromRotationTranslationScale([], rotation, translation, resultScale), m);
    close(mat4.getRotation([], m), rotation);
    const signedScale: number[] = [];
    const classRotation = new Matrix4(m).getRotation(undefined, signedScale);
    close(mat4.fromRotationTranslationScale([], rotation, [0, 0, 0], [1, 1, 1]), classRotation);
    close(new Matrix4(m).getRotationMatrix3(), mat3.fromMat4([], classRotation));
    close(signedScale, resultScale);
    const alias = new Matrix4(m);
    alias.getRotation(alias);
    close(alias, classRotation);
  }
});

it('decomposition rejects singular, sheared, nonfinite and projective input before writes', () => {
  const singular = new Matrix4().scale([0, 1, 1]);
  const shear = new Matrix4();
  shear[4] = 0.5;
  const nonfinite = new Matrix4();
  nonfinite[0] = Infinity;
  const projection = new Matrix4().perspective({fovy: 1});
  for (const matrix of [singular, shear, nonfinite, projection]) {
    const out = [9, 8, 7, 6],
      t = [9, 9, 9],
      s = [9, 9, 9];
    expect(() => mat4.decompose(out, t, s, matrix)).toThrow(RangeError);
    expect(out).toEqual([9, 8, 7, 6]);
    expect(t).toEqual([9, 9, 9]);
    expect(s).toEqual([9, 9, 9]);
    expect(() => matrix.getRotation()).toThrow(RangeError);
    expect(() => matrix.getRotationMatrix3()).toThrow(RangeError);
  }
});

it('projection variants map near/far depths and asymmetric frustum corners', () => {
  for (const depthRange of ['negative-one-to-one', 'zero-to-one'] as const)
    for (const reversedDepth of [false, true]) {
      const o = {
        left: -1,
        right: 2,
        bottom: -2,
        top: 1,
        near: 2,
        far: 10,
        depthRange,
        reversedDepth
      };
      const [near, far] = getProjectionDepthRange(o);
      for (const make of [mat4FrustumProjection, mat4OrthographicProjection]) {
        const m = make(new Array(16), o);
        const p = new Matrix4(m);
        close(p.transformAsPoint([o.left, o.bottom, -o.near]), [-1, -1, near]);
        expect(p.transformAsPoint([0, 0, -o.far])[2]).toBeCloseTo(far, 12);
      }
      const infinite = mat4PerspectiveProjection(new Array(16), {
        fovy: 1,
        aspect: 2,
        near: 2,
        far: Infinity,
        depthRange,
        reversedDepth
      });
      expect(new Matrix4(infinite).transformAsPoint([0, 0, -2])[2]).toBeCloseTo(near, 12);
      expect(new Matrix4(infinite).transformAsPoint([0, 0, -1e15])[2]).toBeCloseTo(far, 12);
    }
  expect(() => mat4PerspectiveProjection([], {fovy: 1, aspect: 1, near: 1, far: 10})).toThrow();
  expect(() =>
    mat4PerspectiveProjection(new Array(16), {fovy: 0, aspect: 1, near: 1, far: 10})
  ).toThrow();
  expect(() =>
    mat4OrthographicProjection(new Array(16), {
      left: -1,
      right: 1,
      bottom: -1,
      top: 1,
      near: 1,
      far: Infinity
    })
  ).toThrow();
  expect(() => getProjectionDepthRange({depthRange: 'invalid' as never})).toThrow();
});

it('vector helpers accept non-unit normals and aliases with defined zero handling', () => {
  const a = [2, 3, 4];
  close(vectorProjectOnVector(a, a, [0, 2, 0]), [0, 3, 0]);
  close(vectorProjectOnPlane([0, 0, 0], [2, 3, 4], [0, 2, 0]), [2, 0, 4]);
  const normal = [0, 2, 0];
  close(vectorReflect(normal, [2, 3, 4], normal), [2, -3, 4]);
  close(vectorProjectOnVector([0, 0], [1, 2], [0, 0]), [0, 0]);
  close(vectorProjectOnPlane([0, 0], [1, 2], [0, 0]), [1, 2]);
  close(vectorReflect([0, 0], [1, 2], [0, 0]), [1, 2]);
  close(vectorSetLength([0, 0], [3, 4], 10), [6, 8]);
  close(vectorClampLength([0, 0], [3, 4], 0, 2.5), [1.5, 2]);
  close(vectorClampLength([0, 0], [0, 0], 2, 3), [0, 0]);
  expect(vectorManhattanDistance([1, 2, 3], [-1, 1, 3])).toBe(3);
  expect(() => vectorSetLength([0, 0], [1, 1], -1)).toThrow();
  expect(() => vectorClampLength([0, 0], [1, 1], 3, 2)).toThrow();
  expect(() => vectorReflect([], [1, 2], [1, 0])).toThrow();
  expect(() => vectorManhattanDistance([1, 2], [1, 2, 3])).toThrow();
});

it('scalar helpers define extrapolation, degenerate intervals and timestep invariance', () => {
  expect(inverseLerp(2, 4, 5)).toBe(1.5);
  expect(inverseLerp(2, 2, 5)).toBe(0);
  expect(mapLinear(5, 2, 4, 0, 10)).toBe(15);
  expect(mapLinear(5, 2, 2, 3, 4)).toBe(3);
  expect(damp(damp(0, 10, 2, 0.2), 10, 2, 0.3)).toBeCloseTo(damp(0, 10, 2, 0.5), 12);
  expect(damp(2, 10, 0, 1)).toBe(2);
  expect(damp(2, 10, 2, 0)).toBe(2);
  for (const smooth of [smoothstep, smootherstep]) {
    expect(smooth(-1, 0, 1)).toBe(0);
    expect(smooth(2, 0, 1)).toBe(1);
    expect(smooth(0.5, 0, 1)).toBe(0.5);
    expect(() => smooth(1, 1, 1)).toThrow();
  }
  expect(pingpong(-0.25)).toBe(0.25);
  expect(pingpong(1.5)).toBe(0.5);
  expect(() => damp(0, 1, -1, 1)).toThrow();
  expect(() => pingpong(0, 0)).toThrow();
  expect(() => inverseLerp(0, 1, NaN)).toThrow();
});

it('rotateTowards normalizes, takes shortest arcs and never overshoots', () => {
  const a = [0, 0, 0, 2],
    b = quat.setAxisAngle([], [0, 0, 1], Math.PI / 2),
    out = new Array(4);
  quatRotateTowards(out, a, b, Math.PI / 4);
  close(out, quat.setAxisAngle([], [0, 0, 1], Math.PI / 4));
  quatRotateTowards(out, out, b, Math.PI);
  close(out, b);
  close(new Quaternion().rotateTowards(b, Math.PI), b);
  quatRotateTowards(
    out,
    b,
    b.map(x => -x),
    0.5
  );
  close(out, b);
  expect(() => quatRotateTowards(out, [0, 0, 0, 0], b, 1)).toThrow();
  expect(() => quatRotateTowards(out, a, b, -1)).toThrow();
});

it('normalization helpers preserve finite directions even when their magnitude exceeds Number.MAX_VALUE', () => {
  close(vectorProjectOnVector([0, 0], [1, 2], [1.5e308, 1.5e308]), [1.5, 1.5]);
  close(vectorSetLength([0, 0], [1.5e308, 1.5e308], 2), [Math.SQRT2, Math.SQRT2]);
  close(
    quatRotateTowards(new Array(4), [1e308, 1e308, 1e308, 1e308], [0, 0, 0, 1], 0),
    [0.5, 0.5, 0.5, 0.5]
  );
});

it('large finite reflection and projection preserve finite representable results', () => {
  expect(vectorReflect([0, 0], [1e308, 0], [1, 0])).toEqual([-1e308, 0]);
  const projected = vectorProjectOnVector([0, 0], [1e308, 1e308], [1, 1]);
  for (const value of projected) expect(value / 1e308).toBeCloseTo(1, 12);
});
it('cubic tracks support subnormal time intervals', () => {
  expect(
    new SampleTrack([0, 1e-310], [0, 1], {interpolation: 'cubic'}).evaluate(5e-311)[0]
  ).toBeCloseTo(0.5, 12);
});

it('projection and reflection preserve small components beside large ones', () => {
  expect(vectorProjectOnVector([0, 0], [1e308, 1e-100], [0, 1])).toEqual([0, 1e-100]);
  expect(vectorReflect([0, 0], [1e308, 1e-100], [0, 0])).toEqual([1e308, 1e-100]);
  expect(vectorProjectOnPlane([0, 0], [1e308, 1e-100], [0, 0])).toEqual([1e308, 1e-100]);
});
it('cubic tracks preserve weighted slopes across disparate intervals', () => {
  const value = new SampleTrack([0, 1e-300, 1e100], [0, 0, 1e300], {
    interpolation: 'cubic'
  }).evaluate(5e-301)[0];
  expect(value / -1.25e-101).toBeCloseTo(1, 12);
});
