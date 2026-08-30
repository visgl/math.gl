// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

/* eslint-disable max-statements */
import {test, expect} from 'vitest';
import {Matrix4, Vector3, config, configure, equals} from '@math.gl/core';

config.EPSILON = 1e-6;

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

const INDICES_MATRIX = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

const TRANSPOSED_INDICES_MATRIX = [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16];

// const MATRIX_TEST_CASES = {
//   identity: {
//     title: 'identity matrix',
//     INPUTS: [],
//     RESULT: IDENTITY_MATRIX
//   },
//   set: {}
// };

test('Matrix4#types', () => {
  expect(typeof Matrix4).toBe('function');
  expect(Matrix4.IDENTITY).toBeTruthy();
  expect(Matrix4.ZERO).toBeTruthy();
});

test('Matrix4#construct and Array.isArray check', () => {
  const m = new Matrix4();
  expect(Array.isArray(m)).toBeTruthy();
});

test('Matrix4#fromQuaternion', () => {
  expect(equals(new Matrix4().fromQuaternion([0, 0, 0, 1]), IDENTITY_MATRIX)).toBe(true);
});

test('Matrix4#fromMatrix3', () => {
  const matrix4 = new Matrix4();
  const result = matrix4.fromMatrix3([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  expect(result).toBe(matrix4);
  expect(equals(result, [1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0, 0, 0, 0, 1])).toBe(true);
});

test('Matrix4#from', () => {
  expect(equals(new Matrix4().from(INDICES_MATRIX), INDICES_MATRIX)).toBe(true);
});

test('Matrix4#to', () => {
  const matrix = new Matrix4(INDICES_MATRIX);
  expect(matrix.to(matrix), 'Handles copy to self').toBeTruthy();
});

test('Matrix4#toString', () => {
  const matrix = new Matrix4(INDICES_MATRIX);
  configure({printRowMajor: true});
  expect(equals(String(matrix), '[row-major: 1 5 9 13 2 6 10 14 3 7 11 15 4 8 12 16]')).toBe(true);

  configure({printRowMajor: false});
  expect(equals(String(matrix), '[column-major: 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16]')).toBe(
    true
  );

  configure({printRowMajor: true});
});

test('Matrix4.toFloat32Array', () => {
  expect(typeof Matrix4.prototype.toFloat32Array).toBe('function');
  const m = new Matrix4();
  m.identity();
  expect(m.toFloat32Array().BYTES_PER_ELEMENT).toBe(4);
});

test('Matrix4.equals', () => {
  const m = new Matrix4();
  expect(m.equals(IDENTITY_MATRIX)).toBeTruthy();
  expect(m.equals([...IDENTITY_MATRIX, 0])).toBeFalsy();
});

test('Matrix4.exactEquals', () => {
  const m = new Matrix4();
  expect(m.exactEquals(IDENTITY_MATRIX)).toBeTruthy();
  expect(m.exactEquals([...IDENTITY_MATRIX, 0])).toBeFalsy();
});

test('Matrix4#identity (identity matrix)', () => {
  expect(typeof Matrix4.prototype.identity).toBe('function');
  const m = new Matrix4();
  m.identity();

  const RESULT = IDENTITY_MATRIX;

  expect(equals(m, RESULT)).toBe(true);
});

test('Matrix4#copy', () => {
  expect(typeof Matrix4.prototype.copy).toBe('function');

  const INPUT = INDICES_MATRIX;
  const RESULT = INDICES_MATRIX;

  const m = new Matrix4().copy(INPUT);

  expect(equals(m, RESULT), 'copy gave the right result').toBe(true);
});

test('Matrix4#set', () => {
  expect(typeof Matrix4.prototype.set).toBe('function');

  const INPUT = INDICES_MATRIX;
  const RESULT = INDICES_MATRIX;

  const m = new Matrix4().copy(INPUT);

  expect(equals(m, RESULT), 'set gave the right result').toBe(true);
});

test('Matrix4#setRowMajor', () => {
  const INPUT = INDICES_MATRIX;
  const RESULT = TRANSPOSED_INDICES_MATRIX;

  // @ts-expect-error TS2556: Expected 16 arguments, but got 0 or more.
  const m = new Matrix4().setRowMajor(...INPUT);
  expect(equals(m, RESULT), 'setRowMajor gave the right result').toBe(true);
});

test('Matrix4#toRowMajor', () => {
  const INPUT = INDICES_MATRIX;
  const RESULT = TRANSPOSED_INDICES_MATRIX;

  const m = new Matrix4(INPUT).toRowMajor([...INDICES_MATRIX]);
  expect(equals(m, RESULT), 'setRowMajor gave the right result').toBe(true);
});

test('Matrix4#getScale', () => {
  const INPUT = INDICES_MATRIX;
  const RESULT = [3.7416573867739413, 10.488088481701515, 17.37814719698276];

  const scale = new Matrix4(INPUT).getScale();
  expect(equals(scale, RESULT), 'getScale gave the right result').toBe(true);
});

test('Matrix4#getRotation', () => {
  const INPUT = INDICES_MATRIX;
  const RESULT = [
    0.2672612419124244, 0.19069251784911848, 0.17263060129453078, 0, 1.3363062095621219,
    0.5720775535473555, 0.4028047363539052, 0, 2.4053511772118195, 0.9534625892455924,
    0.6329788714132796, 0, 0, 0, 0, 1
  ];

  const m = new Matrix4(INPUT).getRotation([...INDICES_MATRIX]);
  expect(equals(m, RESULT), 'getRotation gave the right result').toBe(true);
});

test('Matrix4#getRotationMatrix3', () => {
  const INPUT = INDICES_MATRIX;
  const RESULT = [
    0.2672612419124244, 0.19069251784911848, 0.17263060129453078, 1.3363062095621219,
    0.5720775535473555, 0.4028047363539052, 2.4053511772118195, 0.9534625892455924,
    0.6329788714132796
  ];

  const m = new Matrix4(INPUT).getRotationMatrix3([...INDICES_MATRIX.slice(0, 9)]);
  expect(equals(m, RESULT), 'getRotationMatrix3 gave the right result').toBe(true);
});

test('Matrix4#getTranslation', () => {
  const INPUT = INDICES_MATRIX;
  const RESULT = [13, 14, 15];

  const m = new Matrix4(INPUT).getTranslation([0, 0, 0]);
  expect(equals(m, RESULT), 'getTranslation gave the right result').toBe(true);
});

test('Matrix4#perspective#', () => {
  const fovy = Math.PI * 0.5;
  const result = new Matrix4().perspective({fovy, aspect: 1, near: 0, far: 1});
  expect(
    equals(result, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, -1, 0, 0, 0, 0]),
    'should place values into out'
  ).toBe(true);
});

test('Matrix4#perspective#with nonzero near, 45deg fovy, and realistic aspect ratio', () => {
  const result = new Matrix4().perspective({
    fovy: (45 * Math.PI) / 180.0,
    aspect: 640 / 480,
    near: 0.1,
    far: 200
  });
  expect(
    equals(result, [1.81066, 0, 0, 0, 0, 2.414213, 0, 0, 0, 0, -1.001, -1, 0, 0, -0.2001, 0]),
    'should calculate correct matrix'
  ).toBe(true);
});

test('Matrix4#perspective#with no far plane, 45deg fovy, and realistic aspect ratio', () => {
  const result = new Matrix4().perspective({
    fovy: (45 * Math.PI) / 180.0,
    aspect: 640 / 480,
    near: 0.1
  });
  expect(
    equals(result, [1.81066, 0, 0, 0, 0, 2.414213, 0, 0, 0, 0, -1, -1, 0, 0, -0.2, 0], 1e-3),
    'should calculate correct matrix'
  ).toBe(true);
});

test('Matrix4#perspective#with infinite far plane, 45deg fovy, and realistic aspect ratio', () => {
  const result = new Matrix4().perspective({
    fovy: (45 * Math.PI) / 180.0,
    aspect: 640 / 480,
    near: 0.1,
    far: Infinity
  });
  expect(
    equals(result, [1.81066, 0, 0, 0, 0, 2.414213, 0, 0, 0, 0, -1, -1, 0, 0, -0.2, 0]),
    'should calculate correct matrix'
  ).toBe(true);
  expect(() => new Matrix4().perspective({fovy: 10, aspect: 1, near: 0, far: 1})).toThrow();
});

test('Matrix4#orthographic#', () => {
  const fovy = Math.PI * 0.5;
  const result = new Matrix4().orthographic({fovy, aspect: 1, near: 0, far: 1});
  expect(result).toBeTruthy();
  expect(() => new Matrix4().orthographic({fovy: 10, aspect: 1, near: 0, far: 1})).toThrow();
});

test('Matrix4#frustum', () => {
  const result = new Matrix4().frustum({left: -1, right: 1, bottom: -1, top: 1, near: -1, far: 1});
  expect(result).toBeTruthy();
});

test('Matrix4#frustum() works', () => {
  const expected = new Matrix4([2, 0, 3, 0, 0, 2, 5, 0, 0, 0, -3, -4, 0, 0, -1, 0]).transpose();
  const returnedResult = new Matrix4().frustum({
    left: 1,
    right: 2,
    bottom: 2,
    top: 3,
    near: 1,
    far: 2
  });
  expect(equals(returnedResult, expected)).toBe(true);
});

test('Matrix4#frustum(far: Infinity) works', () => {
  const expected = new Matrix4([2, 0, 3, 0, 0, 2, 5, 0, 0, 0, -1, -2, 0, 0, -1, 0]).transpose();
  const returnedResult = new Matrix4().frustum({
    left: 1,
    right: 2,
    bottom: 2,
    top: 3,
    near: 1,
    far: Infinity
  });
  expect(equals(returnedResult, expected)).toBe(true);
});

test('Matrix4#ortho', () => {
  const result = new Matrix4().ortho({left: -1, right: 1, bottom: -1, top: 1, near: -1, far: 1});
  expect(result).toBeTruthy();
});

test('Matrix4#lookat', () => {
  const result = new Matrix4().lookAt({eye: [1, 1, 1], center: [0, 0, 0], up: [0, 1, 0]});
  expect(result).toBeTruthy();
});

test('Matrix4.transpose', () => {
  expect(typeof Matrix4.prototype.transpose).toBe('function');

  const INPUT = INDICES_MATRIX;
  const RESULT = TRANSPOSED_INDICES_MATRIX;

  // @ts-expect-error TS2556: Expected 16 arguments, but got 0 or more.
  const m = new Matrix4().set(...INPUT);

  const result = m.transpose();

  expect(equals(result, RESULT), 'transpose gave the right result').toBe(true);
});

test('Matrix4.add', () => {
  const RESULT = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2];

  let m = new Matrix4().identity();
  m = m.add(m);

  expect(equals(m, RESULT), 'add gave the right result').toBe(true);
});

test('Matrix4.scale', () => {
  const M1_RESULT = [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1];
  const M2_RESULT = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1];

  expect(typeof Matrix4.prototype.scale).toBe('function');
  const m1 = new Matrix4().identity();
  const m1Result = m1.scale([1, 2, 3]);

  expect(equals(m1Result, M1_RESULT), 'scale gave the right result').toBe(true);

  const m2 = new Matrix4().identity();
  const m2Result = m2.scale(2);

  expect(equals(m2Result, M2_RESULT), 'scale gave the right result').toBe(true);
});

test('Matrix4.multiplyRight', () => {
  const RESULT = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2];

  const m = new Matrix4().multiplyRight(RESULT);

  expect(equals(m, RESULT), 'multiplyRight gave the right result').toBe(true);
});

test('Matrix4.multiplyLeft', () => {
  const RESULT = [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2];

  const m = new Matrix4().multiplyLeft(RESULT);

  expect(equals(m, RESULT), 'multiplyLeft gave the right result').toBe(true);
});

test('Matrix4.translate', () => {
  const RESULT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1];

  expect(typeof Matrix4.prototype.translate).toBe('function');
  const m = new Matrix4().identity();
  const result = m.translate([1, 2, 3]);

  expect(equals(result, RESULT), 'translate gave the right result').toBe(true);
});

// test('Matrix4.invert', t => {
//   t.equals(typeof Matrix4.prototype.invert, 'function');
//   const m = new Matrix4();
//   m.identity();
//   const ans = m.frustum(-1, 1, -1, 1, 0.1, 100).invert();
//   t.ok(abs(ans.n11 - 9.99999999) < delta);
//   t.ok(abs(ans.n12 - 0) < delta);
//   t.ok(abs(ans.n13 - 0) < delta);
//   t.ok(abs(ans.n14 - 0) < delta);
//   t.ok(abs(ans.n21 - 0) < delta);
//   t.ok(abs(ans.n22 - 9.99999999) < delta);
//   t.ok(abs(ans.n23 - 0) < delta);
//   t.ok(abs(ans.n24 - 0) < delta);
//   t.ok(abs(ans.n31 - 0) < delta);
//   t.ok(abs(ans.n32 - 0) < delta);
//   t.ok(abs(ans.n33 - 0) < delta);
//   t.ok(abs(ans.n34 - -1) < delta);
//   t.ok(abs(ans.n41 - 0) < delta);
//   t.ok(abs(ans.n42 - 0) < delta);
//   t.ok(abs(ans.n43 - -4.995) < delta);
//   t.ok(abs(ans.n44 - 5.005) < delta);
//   t.end();
// });

// test('Matrix4.mulVector3', t => {
//   t.equals(typeof Matrix4.prototype.mulVector3, 'function');
//   const v = new Vector3(1, 1, 1);
//   const m = new Matrix4();
//   const ans = m.mulVector3(v);

//   t.equals(ans[0], 1);
//   t.equals(ans[1], 1);
//   t.equals(ans[2], 1);
//   t.end();
// });

// test('Matrix4.$mulVector3', t => {
//   t.equals(typeof Matrix4.prototype.$mulVector3, 'function');
//   const v = new Vector3(1, 1, 1);
//   const m = new Matrix4();

//   m.$mulVector3(v);

//   t.equals(v[0], 1);
//   t.equals(v[1], 1);
//   t.equals(v[2], 1);
//   t.end();
// });

// test('Matrix4.mulMatrix42', t => {
//   t.equals(typeof Matrix4.prototype.mulMatrix42, 'function');
//   const m1 = new Matrix4();
//   m1.set(1, 2, 3, 4,
//          5, 6, 7, 8,
//          9, 10, 11, 12,
//          13, 14, 15, 16);

//   const m2 = new Matrix4();
//   m2.set(1, 2, 3, 4,
//          5, 6, 7, 8,
//          9, 10, 11, 12,
//          13, 14, 15, 16).$transpose();

//   const ans = new Matrix4();
//   ans.mulMatrix42(m1, m2);
//   t.ok(abs(ans.n11 - 30) < delta);
//   t.ok(abs(ans.n12 - 70) < delta);
//   t.ok(abs(ans.n13 - 110) < delta);
//   t.ok(abs(ans.n14 - 150) < delta);
//   t.ok(abs(ans.n21 - 70) < delta);
//   t.ok(abs(ans.n22 - 174) < delta);
//   t.ok(abs(ans.n23 - 278) < delta);
//   t.ok(abs(ans.n24 - 382) < delta);
//   t.ok(abs(ans.n31 - 110) < delta);
//   t.ok(abs(ans.n32 - 278) < delta);
//   t.ok(abs(ans.n33 - 446) < delta);
//   t.ok(abs(ans.n34 - 614) < delta);
//   t.ok(abs(ans.n41 - 150) < delta);
//   t.ok(abs(ans.n42 - 382) < delta);
//   t.ok(abs(ans.n43 - 614) < delta);
//   t.ok(abs(ans.n44 - 846) < delta);
//   t.end();
// });

// test('Matrix4.lookAt', t => {
//   t.equals(typeof Matrix4.prototype.lookAt, 'function');
//   t.end();
// });

// test('Matrix4.perspective', t => {
//   t.equals(typeof Matrix4.prototype.perspective, 'function');
//   t.end();
// });

// test('Matrix4.frustum', t => {
//   t.equals(typeof Matrix4.prototype.frustum, 'function');
//   const m = new Matrix4();
//   m.identity();
//   const ans = m.frustum(-1, 1, -1, 1, 0.1, 100);
//   t.ok(abs(ans.n11 - 0.1) < delta);
//   t.ok(abs(ans.n12 - 0) < delta);
//   t.ok(abs(ans.n13 - 0) < delta);
//   t.ok(abs(ans.n14 - 0) < delta);
//   t.ok(abs(ans.n21 - 0) < delta);
//   t.ok(abs(ans.n22 - 0.1) < delta);
//   t.ok(abs(ans.n23 - 0) < delta);
//   t.ok(abs(ans.n24 - 0) < delta);
//   t.ok(abs(ans.n31 - 0) < delta);
//   t.ok(abs(ans.n32 - 0) < delta);
//   t.ok(abs(ans.n33 - -1.002002002002002) < delta);
//   t.ok(abs(ans.n34 - -0.20020020020020018) < delta);
//   t.ok(abs(ans.n41 - 0) < delta);
//   t.ok(abs(ans.n42 - 0) < delta);
//   t.ok(abs(ans.n43 - -1) < delta);
//   t.ok(abs(ans.n44 - 0) < delta);
//   t.end();
// });

test('Matrix4.rotateAxis', () => {
  expect(typeof Matrix4.prototype.rotateAxis).toBe('function');
  const v = new Vector3(1, 2, 3).normalize();
  const theta = Math.PI / 4;
  const m = new Matrix4();

  const result = m.rotateAxis(theta, v);
  const reference = new Matrix4([
    0.7280277013778687, -0.525104820728302, 0.4407272934913635, 0, 0.6087885979157627,
    0.7907905578613281, -0.06345657259225845, 0, -0.3152016404063445, 0.3145079017103789,
    0.8953952789306641, 0, 0, 0, 0, 1
  ]).transpose();
  expect(result.equals(reference), 'rotateAxis generated expected matrix').toBeTruthy();
});

test('Matrix4.rotateXYZ', () => {
  const m = new Matrix4();
  const result = m.rotateXYZ([1, 2, 3]);
  const reference = [
    0.411982245665683, -0.6812427202564033, 0.6051272472413688, 0, 0.05872664492762098,
    -0.642872836134547, -0.7637183366502791, 0, 0.9092974268256817, 0.35017548837401463,
    -0.2248450953661529, 0, 0, 0, 0, 1
  ];
  expect(equals(result, reference), 'rotateXYZ generated expected matrix').toBe(true);
});

test('Matrix4#transform', () => {
  const matrix = new Matrix4().translate([1, 2, 3]).scale([2, 2, 2]);

  const TEST_CASES = [
    // {
    //   method: 'transform',
    //   input: [2, 2, 0, 1],
    //   expected: [5, 6, 3, 1]
    // },
    {
      method: 'transform',
      input: [2, 2, 0],
      expected: [5, 6, 3]
    },
    {
      method: 'transform',
      input: [2, 2],
      expected: [5, 6]
    },
    {
      method: 'transformAsPoint',
      input: [2, 2, 0],
      expected: [5, 6, 3]
    },
    {
      method: 'transformAsPoint',
      input: [2, 2],
      expected: [5, 6]
    },
    {
      method: 'transformAsVector',
      input: [2, 2, 0],
      expected: [4, 4, 0]
    },
    {
      method: 'transformAsVector',
      input: [2, 2],
      expected: [4, 4]
    },
    // DEPRECATED
    {
      method: 'transformPoint',
      input: [2, 2, 0],
      expected: [5, 6, 3]
    },
    {
      method: 'transformVector',
      input: [2, 2, 0],
      expected: [5, 6, 3]
    },
    {
      method: 'transformDirection',
      input: [2, 2, 0],
      expected: [4, 4, 0]
    },
    // DEPRECATED
    {
      method: 'transformPoint',
      input: [2, 2],
      expected: [5, 6]
    },
    {
      method: 'transformVector',
      input: [2, 2],
      expected: [5, 6]
    },
    {
      method: 'transformDirection',
      input: [2, 2],
      expected: [4, 4]
    }
  ];

  for (const testCase of TEST_CASES) {
    const p4 = matrix[testCase.method](testCase.input);
    expect(equals(p4, testCase.expected), 'transform gave the right result').toBe(true);
  }

  expect(() => matrix.transform([NaN, 0, 0, 0])).toThrow();
  expect(() => matrix.transform([0])).toThrow();
  expect(() => matrix.transform([0, 0, 0, 0, 0])).toThrow();
  expect(() => matrix.transformAsVector([0, 0, 0, 0, 0])).toThrow();
  expect(() => matrix.transformAsPoint([0, 0, 0, 0, 0])).toThrow();
});
