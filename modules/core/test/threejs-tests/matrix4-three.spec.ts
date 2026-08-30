// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright © 2010-2018 three.js authors

// This file is copied from THREE.js math test suite (MIT licensed)
// @author bhouston / http://exocortex.com
// @author TristanVALCKE / https://github.com/Itee

// @ts-nocheck
/* eslint-disable */
import {test, expect} from 'vitest';
import {Matrix4, Vector3, Quaternion, Euler, toRadians} from '@math.gl/core';
import {eps} from './constants';

function matrixEquals4(a, b, tolerance) {
  tolerance = tolerance || 0.0001;
  if (a.length != b.length) {
    return false;
  }

  for (let i = 0, il = a.length; i < il; i++) {
    const delta = a[i] - b[i];
    if (delta > tolerance) {
      return false;
    }
  }

  return true;
}

// from Euler.js
function eulerEquals(a, b, tolerance) {
  tolerance = tolerance || 0.0001;
  const diff = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
  return diff < tolerance;
}

// INSTANCING
test('three.js#Matrix4#Instancing', () => {
  const a = new Matrix4();
  expect(a.determinant() == 1, 'Passed!').toBeTruthy();

  const b = new Matrix4().set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);

  // NOTE THREE.js is row-major
  b.transpose();
  // NOTE

  expect(b[0] == 0).toBeTruthy();
  expect(b[1] == 4).toBeTruthy();
  expect(b[2] == 8).toBeTruthy();
  expect(b[3] == 12).toBeTruthy();
  expect(b[4] == 1).toBeTruthy();
  expect(b[5] == 5).toBeTruthy();
  expect(b[6] == 9).toBeTruthy();
  expect(b[7] == 13).toBeTruthy();
  expect(b[8] == 2).toBeTruthy();
  expect(b[9] == 6).toBeTruthy();
  expect(b[10] == 10).toBeTruthy();
  expect(b[11] == 14).toBeTruthy();
  expect(b[12] == 3).toBeTruthy();
  expect(b[13] == 7).toBeTruthy();
  expect(b[14] == 11).toBeTruthy();
  expect(b[15] == 15).toBeTruthy();

  expect(!matrixEquals4(a, b), 'Passed!').toBeTruthy();
});

// PUBLIC STUFF
test.skip('three.js#Matrix4#isMatrix4', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Matrix4#set', () => {
  const b = new Matrix4();
  expect(b.determinant() == 1, 'Passed!').toBeTruthy();

  b.set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);

  // NOTE THREE.js is row-major
  b.transpose();
  // NOTE

  expect(b[0] == 0).toBeTruthy();
  expect(b[1] == 4).toBeTruthy();
  expect(b[2] == 8).toBeTruthy();
  expect(b[3] == 12).toBeTruthy();
  expect(b[4] == 1).toBeTruthy();
  expect(b[5] == 5).toBeTruthy();
  expect(b[6] == 9).toBeTruthy();
  expect(b[7] == 13).toBeTruthy();
  expect(b[8] == 2).toBeTruthy();
  expect(b[9] == 6).toBeTruthy();
  expect(b[10] == 10).toBeTruthy();
  expect(b[11] == 14).toBeTruthy();
  expect(b[12] == 3).toBeTruthy();
  expect(b[13] == 7).toBeTruthy();
  expect(b[14] == 11).toBeTruthy();
  expect(b[15] == 15).toBeTruthy();
});

test('three.js#Matrix4#identity', () => {
  const b = new Matrix4().set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);

  // NOTE THREE.js is row-major
  b.transpose();
  // NOTE

  expect(b[0] == 0).toBeTruthy();
  expect(b[1] == 4).toBeTruthy();
  expect(b[2] == 8).toBeTruthy();
  expect(b[3] == 12).toBeTruthy();
  expect(b[4] == 1).toBeTruthy();
  expect(b[5] == 5).toBeTruthy();
  expect(b[6] == 9).toBeTruthy();
  expect(b[7] == 13).toBeTruthy();
  expect(b[8] == 2).toBeTruthy();
  expect(b[9] == 6).toBeTruthy();
  expect(b[10] == 10).toBeTruthy();
  expect(b[11] == 14).toBeTruthy();
  expect(b[12] == 3).toBeTruthy();
  expect(b[13] == 7).toBeTruthy();
  expect(b[14] == 11).toBeTruthy();
  expect(b[15] == 15).toBeTruthy();

  const a = new Matrix4();
  expect(!matrixEquals4(a, b), 'Passed!').toBeTruthy();

  b.identity();
  expect(matrixEquals4(a, b), 'Passed!').toBeTruthy();
});

test('three.js#Matrix4#clone', () => {
  const a = new Matrix4().set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
  const b = a.clone();

  expect(matrixEquals4(a, b), 'Passed!').toBeTruthy();

  // ensure that it is a true copy
  a[0] = 2;
  expect(!matrixEquals4(a, b), 'Passed!').toBeTruthy();
});

test('three.js#Matrix4#copy', () => {
  const a = new Matrix4().set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
  const b = new Matrix4().copy(a);

  expect(matrixEquals4(a, b), 'Passed!').toBeTruthy();

  // ensure that it is a true copy
  a[0] = 2;
  expect(!matrixEquals4(a, b), 'Passed!').toBeTruthy();
});

test.skip('three.js#Matrix4#copyPosition', () => {
  const a = new Matrix4().set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
  const b = new Matrix4().set(1, 2, 3, 0, 5, 6, 7, 0, 9, 10, 11, 0, 13, 14, 15, 16);

  expect(matrixEquals4(a, b), 'a and b initially not equal').toBeFalsy();

  b.copyPosition(a);
  expect(matrixEquals4(a, b), 'a and b equal after copyPosition()').toBeTruthy();
});

test.skip('three.js#Matrix4#makeBasis/extractBasis', () => {
  const identityBasis = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
  const a = new Matrix4().makeBasis(identityBasis[0], identityBasis[1], identityBasis[2]);
  const identity = new Matrix4();
  expect(matrixEquals4(a, identity), 'Passed!').toBeTruthy();

  const testBases = [[new Vector3(0, 1, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 1)]];
  for (let i = 0; i < testBases.length; i++) {
    const testBasis = testBases[i];
    const b = new Matrix4().makeBasis(testBasis[0], testBasis[1], testBasis[2]);
    const outBasis = [new Vector3(), new Vector3(), new Vector3()];
    b.extractBasis(outBasis[0], outBasis[1], outBasis[2]);
    // check what goes in, is what comes out.
    for (let j = 0; j < outBasis.length; j++) {
      expect(outBasis[j].equals(testBasis[j]), 'Passed!').toBeTruthy();
    }

    // get the basis out the hard war
    for (let j = 0; j < identityBasis.length; j++) {
      outBasis[j].copy(identityBasis[j]);
      outBasis[j].applyMatrix4(b);
    }
    // did the multiply method of basis extraction work?
    for (let j = 0; j < outBasis.length; j++) {
      expect(outBasis[j].equals(testBasis[j]), 'Passed!').toBeTruthy();
    }
  }
});

test.skip('three.js#Matrix4#extractRotation', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#makeRotationFromEuler/extractRotation', () => {
  const testValues = [
    new Euler(0, 0, 0, 'xyz'),
    new Euler(1, 0, 0, 'xyz'),
    new Euler(0, 1, 0, 'zyx'),
    new Euler(0, 0, 0.5, 'yzx'),
    new Euler(0, 0, -0.5, 'yzx')
  ];

  for (let i = 0; i < testValues.length; i++) {
    const v = testValues[i];

    const m = new Matrix4().makeRotationFromEuler(v);

    const v2 = new Euler().setFromRotationMatrix(m, v.order);
    const m2 = new Matrix4().makeRotationFromEuler(v2);

    expect(
      matrixEquals4(m, m2, eps),
      'makeRotationFromEuler #' + i + ': original and Euler-derived matrices are equal'
    ).toBeTruthy();
    expect(
      eulerEquals(v, v2, eps),
      'makeRotationFromEuler #' + i + ': original and matrix-derived Eulers are equal'
    ).toBeTruthy();

    const m3 = new Matrix4().extractRotation(m2);
    const v3 = new Euler().setFromRotationMatrix(m3, v.order);

    expect(
      matrixEquals4(m, m3, eps),
      'extractRotation #' + i + ': original and extracted matrices are equal'
    ).toBeTruthy();
    expect(
      eulerEquals(v, v3, eps),
      'extractRotation #' + i + ': original and extracted Eulers are equal'
    ).toBeTruthy();
  }
});

test.skip('three.js#Matrix4#lookAt', () => {
  const a = new Matrix4();
  const expected = new Matrix4().identity();
  const eye = new Vector3(0, 0, 0);
  const target = new Vector3(0, 1, -1);
  const up = new Vector3(0, 1, 0);

  a.lookAt(eye, target, up);
  const rotation = new Euler().setFromRotationMatrix(a);
  t.numEqual(rotation.x * (180 / Math.PI), 45, 'Check the rotation');

  // eye and target are in the same position
  eye.copy(target);
  a.lookAt(eye, target, up);
  expect(matrixEquals4(a, expected), 'Check the result for eye == target').toBeTruthy();

  // up and z are parallel
  eye.set(0, 1, 0);
  target.set(0, 0, 0);
  a.lookAt(eye, target, up);
  expected.set(1, 0, 0, 0, 0, 0.0001, 1, 0, 0, -1, 0.0001, 0, 0, 0, 0, 1);
  expect(
    matrixEquals4(a, expected),
    'Check the result for when up and z are parallel'
  ).toBeTruthy();
});

test.skip('three.js#Matrix4#multiply', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#premultiply', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#multiplyMatrices', () => {
  // Reference:
  //
  // #!/usr/bin/env python
  // from __future__ import print_function
  // import numpy as np
  // print(
  //     np.dot(
  //         np.reshape([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53], (4, 4)),
  //         np.reshape([59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131], (4, 4))
  //     )
  // )
  //
  // [[ 1585  1655  1787  1861]
  //  [ 5318  5562  5980  6246]
  //  [10514 11006 11840 12378]
  //  [15894 16634 17888 18710]]
  const lhs = new Matrix4().set(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53);
  const rhs = new Matrix4().set(
    59,
    61,
    67,
    71,
    73,
    79,
    83,
    89,
    97,
    101,
    103,
    107,
    109,
    113,
    127,
    131
  );
  const ans = new Matrix4();

  ans.multiplyMatrices(lhs, rhs);

  expect(ans[0]).toBe(1585);
  expect(ans[1]).toBe(5318);
  expect(ans[2]).toBe(10514);
  expect(ans[3]).toBe(15894);
  expect(ans[4]).toBe(1655);
  expect(ans[5]).toBe(5562);
  expect(ans[6]).toBe(11006);
  expect(ans[7]).toBe(16634);
  expect(ans[8]).toBe(1787);
  expect(ans[9]).toBe(5980);
  expect(ans[10]).toBe(11840);
  expect(ans[11]).toBe(17888);
  expect(ans[12]).toBe(1861);
  expect(ans[13]).toBe(6246);
  expect(ans[14]).toBe(12378);
  expect(ans[15]).toBe(18710);
});

test('three.js#Matrix4#multiplyScalar', () => {
  const b = new Matrix4().set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);

  // NOTE THREE.js is row-major
  b.transpose();
  // NOTE

  expect(b[0]).toBe(0);
  expect(b[1]).toBe(4);
  expect(b[2]).toBe(8);
  expect(b[3]).toBe(12);
  expect(b[4]).toBe(1);
  expect(b[5]).toBe(5);
  expect(b[6]).toBe(9);
  expect(b[7]).toBe(13);
  expect(b[8]).toBe(2);
  expect(b[9]).toBe(6);
  expect(b[10]).toBe(10);
  expect(b[11]).toBe(14);
  expect(b[12]).toBe(3);
  expect(b[13]).toBe(7);
  expect(b[14]).toBe(11);
  expect(b[15]).toBe(15);

  b.multiplyByScalar(2);
  expect(b[0]).toBe(0 * 2);
  expect(b[1]).toBe(4 * 2);
  expect(b[2]).toBe(8 * 2);
  expect(b[3]).toBe(12 * 2);
  expect(b[4]).toBe(1 * 2);
  expect(b[5]).toBe(5 * 2);
  expect(b[6]).toBe(9 * 2);
  expect(b[7]).toBe(13 * 2);
  expect(b[8]).toBe(2 * 2);
  expect(b[9]).toBe(6 * 2);
  expect(b[10]).toBe(10 * 2);
  expect(b[11]).toBe(14 * 2);
  expect(b[12]).toBe(3 * 2);
  expect(b[13]).toBe(7 * 2);
  expect(b[14]).toBe(11 * 2);
  expect(b[15]).toBe(15 * 2);
});

test.skip('three.js#Matrix4#applyToBufferAttribute', () => {
  const a = new Matrix4().set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
  const attr = new Float32BufferAttribute([1, 2, 1, 3, 0, 3], 3);
  const expected = new Float32BufferAttribute(
    [
      0.1666666716337204, 0.4444444477558136, 0.7222222089767456, 0.1599999964237213,
      0.4399999976158142, 0.7200000286102295
    ],
    3
  );

  const applied = a.applyToBufferAttribute(attr);

  t.strictEqual(
    expected.count,
    applied.count,
    'Applied buffer and expected buffer have the same number of entries'
  );

  for (let i = 0, l = expected.count; i < l; i++) {
    expect(Math.abs(applied.getX(i) - expected.getX(i)) <= eps, 'Check x').toBeTruthy();
    expect(Math.abs(applied.getY(i) - expected.getY(i)) <= eps, 'Check y').toBeTruthy();
    expect(Math.abs(applied.getZ(i) - expected.getZ(i)) <= eps, 'Check z').toBeTruthy();
  }
});

test('three.js#Matrix4#determinant', () => {
  const a = new Matrix4();
  expect(a.determinant() == 1, 'Passed!').toBeTruthy();

  a[0] = 2;
  expect(a.determinant() == 2, 'Passed!').toBeTruthy();

  a[0] = 0;
  expect(a.determinant() == 0, 'Passed!').toBeTruthy();

  // calculated via http://www.euclideanspace.com/maths/algebra/matrix/functions/determinant/fourD/index.htm
  a.set(2, 3, 4, 5, -1, -21, -3, -4, 6, 7, 8, 10, -8, -9, -10, -12);
  expect(a.determinant() == 76, 'Passed!').toBeTruthy();
});

test('three.js#Matrix4#transpose', () => {
  const a = new Matrix4();
  let b = a.clone().transpose();
  expect(matrixEquals4(a, b), 'Passed!').toBeTruthy();

  b = new Matrix4().set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
  const c = b.clone().transpose();
  expect(!matrixEquals4(b, c), 'Passed!').toBeTruthy();
  c.transpose();
  expect(matrixEquals4(b, c), 'Passed!').toBeTruthy();
});

test.skip('three.js#Matrix4#setPosition', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#getInverse', () => {
  const identity = new Matrix4();

  const a = new Matrix4();
  const b = new Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  const c = new Matrix4().set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

  expect(!matrixEquals4(a, b), 'Passed!').toBeTruthy();
  b.getInverse(a, false);
  expect(matrixEquals4(b, new Matrix4()), 'Passed!').toBeTruthy();

  try {
    b.getInverse(c, true);
    expect(false, 'Passed!').toBeTruthy(); // should never get here.
  } catch (err) {
    expect(true, 'Passed!').toBeTruthy();
  }

  const testMatrices = [
    new Matrix4().makeRotationX(0.3),
    new Matrix4().makeRotationX(-0.3),
    new Matrix4().makeRotationY(0.3),
    new Matrix4().makeRotationY(-0.3),
    new Matrix4().makeRotationZ(0.3),
    new Matrix4().makeRotationZ(-0.3),
    new Matrix4().makeScale(1, 2, 3),
    new Matrix4().makeScale(1 / 8, 1 / 2, 1 / 3),
    new Matrix4().makePerspective(-1, 1, 1, -1, 1, 1000),
    new Matrix4().makePerspective(-16, 16, 9, -9, 0.1, 10000),
    new Matrix4().makeTranslation(1, 2, 3)
  ];

  for (let i = 0, il = testMatrices.length; i < il; i++) {
    const m = testMatrices[i];

    const mInverse = new Matrix4().getInverse(m);
    const mSelfInverse = m.clone();
    mSelfInverse.getInverse(mSelfInverse);

    // self-inverse should the same as inverse
    expect(matrixEquals4(mSelfInverse, mInverse), 'Passed!').toBeTruthy();

    // the determinant of the inverse should be the reciprocal
    expect(Math.abs(m.determinant() * mInverse.determinant() - 1) < 0.0001, 'Passed!').toBeTruthy();

    const mProduct = new Matrix4().multiplyMatrices(m, mInverse);

    // the determinant of the identity matrix is 1
    expect(Math.abs(mProduct.determinant() - 1) < 0.0001, 'Passed!').toBeTruthy();
    expect(matrixEquals4(mProduct, identity), 'Passed!').toBeTruthy();
  }
});

test.skip('three.js#Matrix4#scale', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#getMaxScaleOnAxis', () => {
  const a = new Matrix4().set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
  const expected = Math.sqrt(3 * 3 + 7 * 7 + 11 * 11);

  expect(Math.abs(a.getMaxScaleOnAxis() - expected) <= eps, 'Check result').toBeTruthy();
});

test.skip('three.js#Matrix4#makeTranslation', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#makeRotationX', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#makeRotationY', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#makeRotationZ', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#makeRotationAxis', () => {
  const axis = new Vector3(1.5, 0.0, 1.0).normalize();
  const radians = toRadians(45);
  const a = new Matrix4().makeRotationAxis(axis, radians);

  const expected = new Matrix4().set(
    0.9098790095958609,
    -0.39223227027636803,
    0.13518148560620882,
    0,
    0.39223227027636803,
    0.7071067811865476,
    -0.588348405414552,
    0,
    0.13518148560620882,
    0.588348405414552,
    0.7972277715906868,
    0,
    0,
    0,
    0,
    1
  );

  expect(matrixEquals4(a, expected), 'Check numeric result').toBeTruthy();
});

test.skip('three.js#Matrix4#makeScale', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#makeShear', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#compose/decompose', () => {
  const tValues = [
    new Vector3(),
    new Vector3(3, 0, 0),
    new Vector3(0, 4, 0),
    new Vector3(0, 0, 5),
    new Vector3(-6, 0, 0),
    new Vector3(0, -7, 0),
    new Vector3(0, 0, -8),
    new Vector3(-2, 5, -9),
    new Vector3(-2, -5, -9)
  ];

  const sValues = [
    new Vector3(1, 1, 1),
    new Vector3(2, 2, 2),
    new Vector3(1, -1, 1),
    new Vector3(-1, 1, 1),
    new Vector3(1, 1, -1),
    new Vector3(2, -2, 1),
    new Vector3(-1, 2, -2),
    new Vector3(-1, -1, -1),
    new Vector3(-2, -2, -2)
  ];

  const rValues = [
    new Quaternion(),
    new Quaternion().setFromEuler(new Euler(1, 1, 0)),
    new Quaternion().setFromEuler(new Euler(1, -1, 1)),
    new Quaternion(0, 0.9238795292366128, 0, 0.38268342717215614)
  ];

  for (let ti = 0; ti < tValues.length; ti++) {
    for (let si = 0; si < sValues.length; si++) {
      for (let ri = 0; ri < rValues.length; ri++) {
        const t = tValues[ti];
        const s = sValues[si];
        const r = rValues[ri];

        const m = new Matrix4().compose(r, s);
        const t2 = new Vector3();
        const r2 = new Quaternion();
        const s2 = new Vector3();

        m.decompose(t2, r2, s2);

        const m2 = new Matrix4().compose(t2, r2, s2);

        /*
				// debug code
				const matrixIsSame = matrixEquals4( m, m2 );
				if ( ! matrixIsSame ) {

					console.log( t, s, r );
					console.log( t2, s2, r2 );
					console.log( m, m2 );

				}
				*/

        expect(matrixEquals4(m, m2), 'Passed!').toBeTruthy();
      }
    }
  }
});

test.skip('three.js#Matrix4#makePerspective', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test.skip('three.js#Matrix4#makeOrthographic', () => {
  const a = new Matrix4().makeOrthographic(-1, 1, -1, 1, 1, 100);
  const expected = new Matrix4().set(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -2 / 99, -101 / 99, 0, 0, 0, 1);

  expect(matrixEquals4(a, expected), 'Check result').toBeTruthy();
});

test('three.js#Matrix4#equals', () => {
  const a = new Matrix4().set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
  const b = new Matrix4().set(-1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);

  expect(a.equals(b), 'Check that a does not equal b').toBeFalsy();
  expect(b.equals(a), 'Check that b does not equal a').toBeFalsy();

  a.copy(b);
  expect(a.equals(b), 'Check that a equals b after copy()').toBeTruthy();
  expect(b.equals(a), 'Check that b equals a after copy()').toBeTruthy();
});

test.skip('three.js#Matrix4#fromArray', () => {
  expect(false, "everything's gonna be alright").toBeTruthy();
});

test('three.js#Matrix4#toArray', () => {
  const a = new Matrix4().set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16);
  // NOTE THREE.js is row-major
  a.transpose();
  // NOTE

  const noOffset = [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16];
  const withOffset = [undefined, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16];

  let array = a.toArray();
  expect(array, 'No array, no offset').toEqual(noOffset);

  array = [];
  a.toArray(array);
  expect(array, 'With array, no offset').toEqual(noOffset);

  array = [undefined];
  a.toArray(array, 1);
  expect(array, 'With array, with offset').toEqual(withOffset);
});
