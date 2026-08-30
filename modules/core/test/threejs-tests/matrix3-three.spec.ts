// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright © 2010-2018 three.js authors

// This file is copied from THREE.js math test suite (MIT licensed)
// @author bhouston / http://exocortex.com
// @author TristanVALCKE / https://github.com/Itee

// @ts-nocheck
/* eslint-disable quotes, no-var */
import {test, expect} from 'vitest';

import {Matrix3} from 'math.gl/matrix3';
import {Matrix4} from 'math.gl/matrix4';

function matrixEquals3(a, b, tolerance) {
  tolerance = tolerance || 0.0001;
  if (a.length !== b.length) {
    return false;
  }

  for (var i = 0, il = a.length; i < il; i++) {
    var delta = a[i] - b[i];
    if (delta > tolerance) {
      return false;
    }
  }

  return true;
}

function toMatrix4(m3) {
  var result = new Matrix4();
  var re = result;
  var me = m3;
  re[0] = me[0];
  re[1] = me[1];
  re[2] = me[2];
  re[4] = me[3];
  re[5] = me[4];
  re[6] = me[5];
  re[8] = me[6];
  re[9] = me[7];
  re[10] = me[8];

  return result;
}

// INSTANCING
test('three.js#Matrix3#Instancing', () => {
  var a = new Matrix3();
  expect(a.determinant() === 1, 'Passed!').toBeTruthy();

  var b = new Matrix3().set(0, 1, 2, 3, 4, 5, 6, 7, 8);
  expect(b[0] === 0).toBeTruthy();
  expect(b[1] === 3).toBeTruthy();
  expect(b[2] === 6).toBeTruthy();
  expect(b[3] === 1).toBeTruthy();
  expect(b[4] === 4).toBeTruthy();
  expect(b[5] === 7).toBeTruthy();
  expect(b[6] === 2).toBeTruthy();
  expect(b[7] === 5).toBeTruthy();
  expect(b[8] === 8).toBeTruthy();

  expect(!matrixEquals3(a, b), 'Passed!').toBeTruthy();
});

// PUBLIC STUFF
test.skip('three.js#Matrix3#isMatrix3', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Matrix3#set', () => {
  var b = new Matrix3();
  expect(b.determinant() === 1, 'Passed!').toBeTruthy();

  b.set(0, 1, 2, 3, 4, 5, 6, 7, 8);
  expect(b[0] === 0).toBeTruthy();
  expect(b[1] === 3).toBeTruthy();
  expect(b[2] === 6).toBeTruthy();
  expect(b[3] === 1).toBeTruthy();
  expect(b[4] === 4).toBeTruthy();
  expect(b[5] === 7).toBeTruthy();
  expect(b[6] === 2).toBeTruthy();
  expect(b[7] === 5).toBeTruthy();
  expect(b[8] === 8).toBeTruthy();
});

test('three.js#Matrix3#identity', () => {
  var b = new Matrix3().set(0, 1, 2, 3, 4, 5, 6, 7, 8);
  expect(b[0] === 0).toBeTruthy();
  expect(b[1] === 3).toBeTruthy();
  expect(b[2] === 6).toBeTruthy();
  expect(b[3] === 1).toBeTruthy();
  expect(b[4] === 4).toBeTruthy();
  expect(b[5] === 7).toBeTruthy();
  expect(b[6] === 2).toBeTruthy();
  expect(b[7] === 5).toBeTruthy();
  expect(b[8] === 8).toBeTruthy();

  var a = new Matrix3();
  expect(!matrixEquals3(a, b), 'Passed!').toBeTruthy();

  b.identity();
  expect(matrixEquals3(a, b), 'Passed!').toBeTruthy();
});

test('three.js#Matrix3#clone', () => {
  var a = new Matrix3().set(0, 1, 2, 3, 4, 5, 6, 7, 8);
  var b = a.clone();

  expect(matrixEquals3(a, b), 'Passed!').toBeTruthy();

  // ensure that it is a true copy
  a[0] = 2;
  expect(!matrixEquals3(a, b), 'Passed!').toBeTruthy();
});

test('three.js#Matrix3#copy', () => {
  var a = new Matrix3().set(0, 1, 2, 3, 4, 5, 6, 7, 8);
  var b = new Matrix3().copy(a);

  expect(matrixEquals3(a, b), 'Passed!').toBeTruthy();

  // ensure that it is a true copy
  a[0] = 2;
  expect(!matrixEquals3(a, b), 'Passed!').toBeTruthy();
});

test.skip('three.js#Matrix3#setFromMatrix4', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

/*
test('three.js#Matrix3#applyToBufferAttribute', t => {
  var a = new Matrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
  var attr = new Float32BufferAttribute([1, 2, 1, 3, 0, 3], 3);
  var expected = new Float32Array([8, 20, 32, 12, 30, 48]);

  var applied = a.applyToBufferAttribute(attr);

  t.deepEqual(applied.array, expected, 'Check resulting buffer');
});
*/

test('three.js#Matrix3#multiply/premultiply', () => {
  // both simply just wrap multiplyMatrices
  var a = new Matrix3().set(2, 3, 5, 7, 11, 13, 17, 19, 23);
  var b = new Matrix3().set(29, 31, 37, 41, 43, 47, 53, 59, 61);
  var expectedMultiply = [446, 1343, 2491, 486, 1457, 2701, 520, 1569, 2925];
  var expectedPremultiply = [904, 1182, 1556, 1131, 1489, 1967, 1399, 1845, 2435];

  a.multiply(b);
  expect(a, 'multiply: check result').toEqual(expectedMultiply);

  a.set(2, 3, 5, 7, 11, 13, 17, 19, 23);
  a.premultiply(b);
  expect(a, 'premultiply: check result').toEqual(expectedPremultiply);
});

test('three.js#Matrix3#multiplyMatrices', () => {
  // Reference:
  //
  // #!/usr/bin/env python
  // from __future__ import print_function
  // import numpy as np
  // print(
  //     np.dot(
  //         np.reshape([2, 3, 5, 7, 11, 13, 17, 19, 23], (3, 3)),
  //         np.reshape([29, 31, 37, 41, 43, 47, 53, 59, 61], (3, 3))
  //     )
  // )
  //
  // [[ 446  486  520]
  //  [1343 1457 1569]
  //  [2491 2701 2925]]
  var lhs = new Matrix3().set(2, 3, 5, 7, 11, 13, 17, 19, 23);
  var rhs = new Matrix3().set(29, 31, 37, 41, 43, 47, 53, 59, 61);
  var ans = new Matrix3();

  ans.multiplyMatrices(lhs, rhs);

  expect(ans[0] === 446).toBeTruthy();
  expect(ans[1] === 1343).toBeTruthy();
  expect(ans[2] === 2491).toBeTruthy();
  expect(ans[3] === 486).toBeTruthy();
  expect(ans[4] === 1457).toBeTruthy();
  expect(ans[5] === 2701).toBeTruthy();
  expect(ans[6] === 520).toBeTruthy();
  expect(ans[7] === 1569).toBeTruthy();
  expect(ans[8] === 2925).toBeTruthy();
});

test('three.js#Matrix3#multiplyScalar', () => {
  var b = new Matrix3().set(0, 1, 2, 3, 4, 5, 6, 7, 8);
  expect(b[0] === 0).toBeTruthy();
  expect(b[1] === 3).toBeTruthy();
  expect(b[2] === 6).toBeTruthy();
  expect(b[3] === 1).toBeTruthy();
  expect(b[4] === 4).toBeTruthy();
  expect(b[5] === 7).toBeTruthy();
  expect(b[6] === 2).toBeTruthy();
  expect(b[7] === 5).toBeTruthy();
  expect(b[8] === 8).toBeTruthy();

  b.multiplyByScalar(2);
  expect(b[0] === 0 * 2).toBeTruthy();
  expect(b[1] === 3 * 2).toBeTruthy();
  expect(b[2] === 6 * 2).toBeTruthy();
  expect(b[3] === 1 * 2).toBeTruthy();
  expect(b[4] === 4 * 2).toBeTruthy();
  expect(b[5] === 7 * 2).toBeTruthy();
  expect(b[6] === 2 * 2).toBeTruthy();
  expect(b[7] === 5 * 2).toBeTruthy();
  expect(b[8] === 8 * 2).toBeTruthy();
});

test('three.js#Matrix3#determinant', () => {
  var a = new Matrix3();
  expect(a.determinant() === 1, 'Passed!').toBeTruthy();

  a[0] = 2;
  expect(a.determinant() === 2, 'Passed!').toBeTruthy();

  a[0] = 0;
  expect(a.determinant() === 0, 'Passed!').toBeTruthy();

  // calculated via http://www.euclideanspace.com/maths/algebra/matrix/functions/determinant/threeD/index.htm
  a.set(2, 3, 4, 5, 13, 7, 8, 9, 11);
  expect(a.determinant() === -73, 'Passed!').toBeTruthy();
});

test('three.js#Matrix3#getInverse', () => {
  var identity = new Matrix3();
  var identity4 = new Matrix4();
  var a = new Matrix3();
  var b = new Matrix3().set(0, 0, 0, 0, 0, 0, 0, 0, 0);
  var c = new Matrix3().set(0, 0, 0, 0, 0, 0, 0, 0, 0);

  b.getInverse(a, false);
  expect(matrixEquals3(a, identity), 'Matrix a is identity matrix').toBeTruthy();

  try {
    b.getInverse(c, true);
    expect(false, 'Should never get here !').toBeTruthy(); // should never get here.
  } catch (err) {
    expect(true, `Passed: ${err}`).toBeTruthy();
  }

  var testMatrices = [
    new Matrix4().makeRotationX(0.3),
    new Matrix4().makeRotationX(-0.3),
    new Matrix4().makeRotationY(0.3),
    new Matrix4().makeRotationY(-0.3),
    new Matrix4().makeRotationZ(0.3),
    new Matrix4().makeRotationZ(-0.3),
    new Matrix4().makeScale(1, 2, 3),
    new Matrix4().makeScale(1 / 8, 1 / 2, 1 / 3)
  ];

  for (var i = 0, il = testMatrices.length; i < il; i++) {
    var m = testMatrices[i];

    a.setFromMatrix4(m);
    var mInverse3 = b.getInverse(a);

    var mInverse = toMatrix4(mInverse3);

    // the determinant of the inverse should be the reciprocal
    expect(
      Math.abs(a.determinant() * mInverse3.determinant() - 1) < 0.0001,
      'Passed!'
    ).toBeTruthy();
    expect(Math.abs(m.determinant() * mInverse.determinant() - 1) < 0.0001, 'Passed!').toBeTruthy();

    var mProduct = new Matrix4().multiplyMatrices(m, mInverse);
    expect(Math.abs(mProduct.determinant() - 1) < 0.0001, 'Passed!').toBeTruthy();
    expect(matrixEquals3(mProduct, identity4), 'Passed!').toBeTruthy();
  }
});

test('three.js#Matrix3#transpose', () => {
  var a = new Matrix3();
  let b = a.clone().transpose();
  expect(matrixEquals3(a, b), 'Passed!').toBeTruthy();

  b = new Matrix3().set(0, 1, 2, 3, 4, 5, 6, 7, 8);
  var c = b.clone().transpose();
  expect(!matrixEquals3(b, c), 'Passed!').toBeTruthy();
  c.transpose();
  expect(matrixEquals3(b, c), 'Passed!').toBeTruthy();
});

test('three.js#Matrix3#getNormalMatrix', () => {
  var a = new Matrix3();
  var b = new Matrix4().set(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 57);
  var expected = new Matrix3().set(
    -1.2857142857142856,
    0.7142857142857143,
    0.2857142857142857,
    0.7428571428571429,
    -0.7571428571428571,
    0.15714285714285714,
    -0.19999999999999998,
    0.3,
    -0.09999999999999999
  );

  a.getNormalMatrix(b);
  expect(matrixEquals3(a, expected), 'Check resulting Matrix3').toBeTruthy();
});

test.skip('three.js#Matrix3#transposeIntoArray', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Matrix3#setUvTransform', () => {
  var a = new Matrix3().set(
    0.1767766952966369,
    0.17677669529663687,
    0.32322330470336313,
    -0.17677669529663687,
    0.1767766952966369,
    0.5,
    0,
    0,
    1
  );
  var b = new Matrix3();
  var params = {
    centerX: 0.5,
    centerY: 0.5,
    offsetX: 0,
    offsetY: 0,
    repeatX: 0.25,
    repeatY: 0.25,
    rotation: 0.7753981633974483
  };
  var expected = new Matrix3().set(
    0.1785355940258599,
    0.17500011904519763,
    0.32323214346447127,
    -0.17500011904519763,
    0.1785355940258599,
    0.4982322625096689,
    0,
    0,
    1
  );

  a.setUvTransform(
    params.offsetX,
    params.offsetY,
    params.repeatX,
    params.repeatY,
    params.rotation,
    params.centerX,
    params.centerY
  );

  b.identity()
    .translate(-params.centerX, -params.centerY)
    .rotate(params.rotation)
    .scale(params.repeatX, params.repeatY)
    .translate(params.centerX, params.centerY)
    .translate(params.offsetX, params.offsetY);

  expect(matrixEquals3(a, expected), 'Check direct method').toBeTruthy();
  expect(matrixEquals3(b, expected), 'Check indirect method').toBeTruthy();
});

test('three.js#Matrix3#scale', () => {
  var a = new Matrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
  var expected = new Matrix3().set(0.25, 0.5, 0.75, 1, 1.25, 1.5, 7, 8, 9);

  a.scale(0.25, 0.25);
  expect(matrixEquals3(a, expected), 'Check scaling result').toBeTruthy();
});

test('three.js#Matrix3#rotate', () => {
  var a = new Matrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
  var expected = new Matrix3().set(
    3.5355339059327373,
    4.949747468305833,
    6.363961030678928,
    2.121320343559643,
    2.121320343559643,
    2.1213203435596433,
    7,
    8,
    9
  );

  a.rotate(Math.PI / 4);
  expect(matrixEquals3(a, expected), 'Check rotated result').toBeTruthy();
});

test('three.js#Matrix3#translate', () => {
  var a = new Matrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
  var expected = new Matrix3().set(22, 26, 30, 53, 61, 69, 7, 8, 9);

  a.translate(3, 7);
  expect(matrixEquals3(a, expected), 'Check translation result').toBeTruthy();
});

test('three.js#Matrix3#equals', () => {
  var a = new Matrix3().set(0, 1, 2, 3, 4, 5, 6, 7, 8);
  var b = new Matrix3().set(0, -1, 2, 3, 4, 5, 6, 7, 8);

  expect(a.equals(b), 'Check that a does not equal b').toBeFalsy();
  expect(b.equals(a), 'Check that b does not equal a').toBeFalsy();

  a.copy(b);
  expect(a.equals(b), 'Check that a equals b after copy()').toBeTruthy();
  expect(b.equals(a), 'Check that b equals a after copy()').toBeTruthy();
});

test.skip('three.js#Matrix3#fromArray', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Matrix3#toArray', () => {
  var a = new Matrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
  var noOffset = [1, 4, 7, 2, 5, 8, 3, 6, 9];
  var withOffset = [undefined, 1, 4, 7, 2, 5, 8, 3, 6, 9];

  let array = a.toArray();
  expect(array, 'No array, no offset').toEqual(noOffset);

  array = [];
  a.toArray(array);
  expect(array, 'With array, no offset').toEqual(noOffset);

  array = [];
  a.toArray(array, 1);
  expect(array, 'With array, with offset').toEqual(withOffset);
});
