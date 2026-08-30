// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

/* eslint-disable*/
import {test, expect} from 'vitest';

import {Euler, Matrix4, Quaternion, Vector3, equals} from '@math.gl/core';
import type {EulerLike} from '@math.gl/core';

test('Quaternion#import', () => {
  expect(typeof Quaternion).toBe('function');
});

test('Quaternion#construct and Array.isArray check', () => {
  expect(Array.isArray(new Quaternion())).toBeTruthy();
});

test('Quaternion#methods', () => {
  const q = new Quaternion();
  expect(q[0]).toBe(0);
  expect(q[1]).toBe(0);
  expect(q[2]).toBe(0);
  expect(q[3]).toBe(1);
  expect(typeof q.add).toBe('function');
  expect(typeof q.clone).toBe('function');
  expect(typeof q.conjugate).toBe('function');
  // t.equals(typeof q.divQuaternion, 'function');
  expect(typeof q.invert).toBe('function');
  expect(typeof q.multiply).toBe('function');
  // t.equals(typeof q.negate, 'function');
  // t.equals(typeof q.norm, 'function');
  // t.equals(typeof q.normSq, 'function');
  expect(typeof q.scale).toBe('function');
  expect(typeof q.set).toBe('function');
});

test('Quaternion#fromMatrix3', () => {
  const TEST_CASES = [
    {
      title: 'legacy',
      matrix3: [1, 0, 0, 0, 0, -1, 0, 1, 0],
      quaternion: [-0.707106, 0, 0, 0.707106]
    }
  ];

  for (const testCase of TEST_CASES) {
    const result = new Quaternion().fromMatrix3(testCase.matrix3);
    if (testCase.quaternion) {
      expect(equals(result, testCase.quaternion), testCase.title).toBe(true);
    }
  }
});

test('Quaternion#fromEuler', () => {
  const orders = ['xyz', 'yxz', 'zxy', 'zyx', 'yzx', 'xzy'] as const;

  for (const order of orders) {
    const euler = new Euler(0.2, -0.4, 0.6, order);
    const eulerLike: EulerLike = {x: euler.x, y: euler.y, z: euler.z, order};
    const quaternion = new Quaternion(1, 2, 3, 4);
    const result = quaternion.fromEuler(eulerLike);

    expect(result).toBe(quaternion);
    expect(equals(new Matrix4().fromQuaternion(result), euler.getRotationMatrix())).toBe(true);
  }
});

test('Quaternion#fromAxisRotation', () => {
  let q = new Quaternion().fromAxisRotation(new Vector3(0, 0, 1), Math.PI);
  expect(equals(q, [0, 0, 1, Math.cos(Math.PI / 2)])).toBe(true);

  q = new Quaternion().fromAxisRotation(new Vector3(0, 1, 0), Math.PI);
  expect(equals(q, [0, 1, 0, Math.cos(Math.PI / 2)])).toBe(true);

  q = new Quaternion().fromAxisRotation(new Vector3(1, 0, 0), Math.PI);
  expect(equals(q, [1, 0, 0, Math.cos(Math.PI / 2)])).toBe(true);
});

const quatA = [1, 2, 3, 4];
// const quatB = [5, 6, 7, 8];
// const out = [0, 0, 0, 0];
// const vec = [1, 1, -1];
// const id = [0, 0, 0, 1];
// const deg90 = Math.PI / 2;

test('Quaternion#create', () => {
  expect(
    equals(new Quaternion(), [0, 0, 0, 1]),
    'should return a 4 element array initialized to an identity quaternion'
  ).toBe(true);
  expect(equals(new Quaternion(1, 1, 1, 1), [1, 1, 1, 1]), 'should return a 4 element array').toBe(
    true
  );
  expect(
    equals(new Quaternion([2, 2, 2, 2]), [2, 2, 2, 2]),
    'should return a 4 element array'
  ).toBe(true);
});

test('Quaternion#clone', () => {
  const result = new Quaternion(quatA).clone();
  expect(
    equals(result, quatA),
    'should return a 4 element array initialized to the values in quatA'
  ).toBe(true);
});

test('Quaternion#copy', () => {
  const result = new Quaternion().copy(quatA);
  expect(equals(result, [1, 2, 3, 4]), 'should place values into out').toBe(true);
});

test('Quaternion#set', () => {
  const result = new Quaternion().set(1, 2, 3, 4);
  expect(
    equals(result, [1, 2, 3, 4]),
    'should return a 4 element array initialized to the values passed'
  ).toBe(true);
});

test('Quaternion#identity', () => {
  const result = new Quaternion(1, 1, 1, 1).identity();
  expect(equals(result, [0, 0, 0, 1]), 'should return identity quaternion').toBe(true);
});

test('Quaternion#rotationTo', () => {
  expect(() => new Quaternion().rotationTo([1, 1, 1, 1], [2, 2, 2, 2])).not.toThrow();
});

test('Quaternion#calculateW', () => {
  expect(() => new Quaternion().calculateW()).not.toThrow();
});

test('Quaternion#invert', () => {
  expect(() => new Quaternion([1, 1, 1, 1]).invert()).not.toThrow();
});

test('Quaternion#lerp', () => {
  expect(() => new Quaternion().lerp([1, 1, 1, 1], [2, 2, 2, 2], 0.5)).not.toThrow();
});

test('Quaternion#slerp', () => {
  expect(() => new Quaternion().slerp([1, 1, 1, 1], [2, 2, 2, 2], 0.5)).not.toThrow();
});

test('Quaternion#scale', () => {
  expect(() => new Quaternion([1, 1, 1, 1]).scale(5)).not.toThrow();
});

test('Quaternion#rotateX', () => {
  expect(() => new Quaternion([1, 1, 1, 1]).rotateX(5)).not.toThrow();
});

test('Quaternion#rotateY', () => {
  expect(() => new Quaternion([1, 1, 1, 1]).rotateY(5)).not.toThrow();
});

test('Quaternion#rotateZ', () => {
  expect(() => new Quaternion([1, 1, 1, 1]).rotateZ(5)).not.toThrow();
});

test('Quaternion#add', () => {
  const quat = new Quaternion(1, 1, 1, 1).identity();
  expect(equals(quat.add([0, 0, 0, 0]), quat), 'should add quaternion').toBe(true);
});

test('Quaternion#setAxisAngle', () => {
  const result = new Quaternion().setAxisAngle([1, 0, 0], Math.PI * 0.5);
  expect(equals(result, [0.707106, 0, 0, 0.707106]), 'should return correct values').toBe(true);
});

test.skip('getAxisAngle', () => {
  test('Quaternion#getAxisAngle for a quaternion representing no rotation', () => {
    const out = [0, 0, 0];
    const quat = new Quaternion().setAxisAngle([0, 1, 0], 0.0);
    // @ts-expect-error
    const deg90 = quat.getAxisAngle(out);
    expect(
      equals(deg90 % (Math.PI * 2.0), 0.0),
      'should return a multiple of 2*PI as the angle component'
    ).toBe(true);
  });
});

/*
	test('Quaternion#for a simple rotation about X axis', t => {
		beforeEach(function() { result = quat.setAxisAngle(out, [1, 0, 0], 0.7778); deg90 = quat.getAxisAngle(vec, out); });
		test('Quaternion#should return the same provided angle', function() { expect(deg90).toBeEqualish(0.7778); });
		test('Quaternion#should return the X axis as the angle', function() { expect(vec).toBeEqualish([1, 0, 0]); });
	});

	test('Quaternion#for a simple rotation about Y axis', t => {
		beforeEach(function() { result = quat.setAxisAngle(out, [0, 1, 0], 0.879546); deg90 = quat.getAxisAngle(vec, out); });
		test('Quaternion#should return the same provided angle', function() { expect(deg90).toBeEqualish(0.879546); });
		test('Quaternion#should return the X axis as the angle', function() { expect(vec).toBeEqualish([0, 1, 0]); });
	});

	test('Quaternion#for a simple rotation about Z axis', t => {
		beforeEach(function() { result = quat.setAxisAngle(out, [0, 0, 1], 0.123456); deg90 = quat.getAxisAngle(vec, out); });
		test('Quaternion#should return the same provided angle', function() { expect(deg90).toBeEqualish(0.123456); });
		test('Quaternion#should return the X axis as the angle', function() { expect(vec).toBeEqualish([0, 0, 1]); });
	});

	test('Quaternion#for a slightly irregular axis and right angle', t => {
		beforeEach(function() { result = quat.setAxisAngle(out, [0.707106, 0, 0.707106], Math.PI * 0.5); deg90 = quat.getAxisAngle(vec, out); });
		test('Quaternion#should place values into vec', function() { expect(vec).toBeEqualish([0.707106, 0, 0.707106]); });
		test('Quaternion#should return a numeric angle', function() { expect(deg90).toBeEqualish(Math.PI * 0.5); });
	});

	test('Quaternion#for a very irregular axis and negative input angle', t => {
		beforeEach(function() {
			quatA = quat.setAxisAngle(quatA, [0.65538555, 0.49153915, 0.57346237], 8.8888);
			deg90 = quat.getAxisAngle(vec, quatA);
			quatB = quat.setAxisAngle(quatB, vec, deg90);
		});
		test('Quaternion#should return an angle between 0 and 2*PI', function() { expect(deg90).toBeGreaterThan(0.0); expect(deg90).toBeLessThan(Math.PI * 2.0); });
		test('Quaternion#should create the same quaternion from axis and angle extracted', function() { expect(quatA).toBeEqualish(quatB); });
	});
  t.end();
});

/*
test('Quaternion#add', t => {
	test('Quaternion#with a separate output quaternion', t => {
		beforeEach(function() { result = quat.add(out, quatA, quatB); });

		test('Quaternion#should place values into out', function() { expect(out).toBeEqualish([6, 8, 10, 12]); });
		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
		test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([5, 6, 7, 8]); });
	});

	test('Quaternion#when quatA is the output quaternion', t => {
		beforeEach(function() { result = quat.add(quatA, quatA, quatB); });

		test('Quaternion#should place values into quatA', function() { expect(quatA).toBeEqualish([6, 8, 10, 12]); });
		test('Quaternion#should return quatA', function() { expect(result).toBe(quatA); });
		test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([5, 6, 7, 8]); });
	});

	test('Quaternion#when quatB is the output quaternion', t => {
		beforeEach(function() { result = quat.add(quatB, quatA, quatB); });

		test('Quaternion#should place values into quatB', function() { expect(quatB).toBeEqualish([6, 8, 10, 12]); });
		test('Quaternion#should return quatB', function() { expect(result).toBe(quatB); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
	});
});

test('Quaternion#multiply', t => {
	test('Quaternion#should have an alias called 'mul'', function() { expect(quat.mul).toEqual(quat.multiply); });

	test('Quaternion#with a separate output quaternion', t => {
		beforeEach(function() { result = quat.multiply(out, quatA, quatB); });

		test('Quaternion#should place values into out', function() { expect(out).toBeEqualish([24, 48, 48, -6]); });
		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
		test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([5, 6, 7, 8]); });
	});

	test('Quaternion#when quatA is the output quaternion', t => {
		beforeEach(function() { result = quat.multiply(quatA, quatA, quatB); });

		test('Quaternion#should place values into quatA', function() { expect(quatA).toBeEqualish([24, 48, 48, -6]); });
		test('Quaternion#should return quatA', function() { expect(result).toBe(quatA); });
		test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([5, 6, 7, 8]); });
	});

	test('Quaternion#when quatB is the output quaternion', t => {
		beforeEach(function() { result = quat.multiply(quatB, quatA, quatB); });

		test('Quaternion#should place values into quatB', function() { expect(quatB).toBeEqualish([24, 48, 48, -6]); });
		test('Quaternion#should return quatB', function() { expect(result).toBe(quatB); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
	});
});

test('Quaternion#scale', t => {
	test('Quaternion#with a separate output quaternion', t => {
		beforeEach(function() { result = quat.scale(out, quatA, 2); });

		test('Quaternion#should place values into out', function() { expect(out).toBeEqualish([2, 4, 6, 8]); });
		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
	});

	test('Quaternion#when quatA is the output quaternion', t => {
		beforeEach(function() { result = quat.scale(quatA, quatA, 2); });

		test('Quaternion#should place values into quatA', function() { expect(quatA).toBeEqualish([2, 4, 6, 8]); });
		test('Quaternion#should return quatA', function() { expect(result).toBe(quatA); });
	});
});

test('Quaternion#length', t => {
	test('Quaternion#should have an alias called 'len'', function() { expect(quat.len).toEqual(quat.length); });

	beforeEach(function() { result = quat.len(quatA); });

	test('Quaternion#should return the length', function() { expect(result).toBeEqualish(5.477225); });
});

test('Quaternion#squaredLength', t => {
	test('Quaternion#should have an alias called 'sqrLen'', function() { expect(quat.sqrLen).toEqual(quat.squaredLength); });

	beforeEach(function() { result = quat.squaredLength(quatA); });

	test('Quaternion#should return the squared length', function() { expect(result).toEqual(30); });
});

test('Quaternion#normalize', t => {
	beforeEach(function() { quatA = [5, 0, 0, 0]; });

	test('Quaternion#with a separate output quaternion', t => {
		beforeEach(function() { result = quat.normalize(out, quatA); });

		test('Quaternion#should place values into out', function() { expect(out).toBeEqualish([1, 0, 0, 0]); });
		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([5, 0, 0, 0]); });
	});

	test('Quaternion#when quatA is the output quaternion', t => {
		beforeEach(function() { result = quat.normalize(quatA, quatA); });

		test('Quaternion#should place values into quatA', function() { expect(quatA).toBeEqualish([1, 0, 0, 0]); });
		test('Quaternion#should return quatA', function() { expect(result).toBe(quatA); });
	});
});

test('Quaternion#invert', t => {
	test('Quaternion#with a separate output quaternion', t => {
		beforeEach(function() { result = quat.invert(out, quatA); });

		test('Quaternion#should place values into out', function() { expect(out).toBeEqualish([-0.033333, -0.066666, -0.1, 0.133333]); });
		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
	});

	test('Quaternion#when quatA is the output quaternion', t => {
		beforeEach(function() { result = quat.invert(quatA, quatA); });

		test('Quaternion#should place values into quatA', function() { expect(quatA).toBeEqualish([-0.033333, -0.066666, -0.1, 0.133333]); });
		test('Quaternion#should return quatA', function() { expect(result).toBe(quatA); });
	});
});

test('Quaternion#conjugate', t => {
	test('Quaternion#with a separate output quaternion', t => {
		beforeEach(function() { result = quat.conjugate(out, quatA); });

		test('Quaternion#should place values into out', function() { expect(out).toBeEqualish([-1, -2, -3, 4]); });
		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
	});

	test('Quaternion#when quatA is the output quaternion', t => {
		beforeEach(function() { result = quat.conjugate(quatA, quatA); });

		test('Quaternion#should place values into quatA', function() { expect(quatA).toBeEqualish([-1, -2, -3, 4]); });
		test('Quaternion#should return quatA', function() { expect(result).toBe(quatA); });
	});
});

test('Quaternion#str', t => {
	beforeEach(function() { result = quat.str(quatA); });

	test('Quaternion#should return a string representation of the quaternion', function() { expect(result).toEqual('quat(1, 2, 3, 4)'); });
});

test('Quaternion#exactEquals', t => {
	let quatC, r0, r1;
	beforeEach(function() {
		quatA = [0, 1, 2, 3];
		quatB = [0, 1, 2, 3];
		quatC = [1, 2, 3, 4];
		r0 = quat.exactEquals(quatA, quatB);
		r1 = quat.exactEquals(quatA, quatC);
	});

	test('Quaternion#should return true for identical quaternions', function() { expect(r0).toBe(true); });
	test('Quaternion#should return false for different quaternions', function() { expect(r1).toBe(false); });
	test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([0, 1, 2, 3]); });
	test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([0, 1, 2, 3]); });
});

test('Quaternion#equals', t => {
	let quatC, quatD, r0, r1, r2;
	beforeEach(function() {
		quatA = [0, 1, 2, 3];
		quatB = [0, 1, 2, 3];
		quatC = [1, 2, 3, 4];
		quatD = [1e-16, 1, 2, 3];
		r0 = quat.equals(quatA, quatB);
		r1 = quat.equals(quatA, quatC);
		r2 = quat.equals(quatA, quatD);
	});
	test('Quaternion#should return true for identical quaternions', function() { expect(r0).toBe(true); });
	test('Quaternion#should return false for different quaternions', function() { expect(r1).toBe(false); });
	test('Quaternion#should return true for close but not identical quaternions', function() { expect(r2).toBe(true); });
	test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([0, 1, 2, 3]); });
	test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([0, 1, 2, 3]); });
});

test('Quaternion#slerp', t => {
	test('Quaternion#the normal case', t => {
		beforeEach(function() {
			result = quat.slerp(out, [0, 0, 0, 1], [0, 1, 0, 0], 0.5);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should calculate proper quat', function() {
			expect(result).toBeEqualish([0, 0.707106, 0, 0.707106]);
		});
	});

	test('Quaternion#where a == b', t => {
		beforeEach(function() {
			result = quat.slerp(out, [0, 0, 0, 1], [0, 0, 0, 1], 0.5);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should calculate proper quat', function() {
			expect(result).toBeEqualish([0, 0, 0, 1]);
		});
	});

	test('Quaternion#where theta == 180deg', t => {
		beforeEach(function() {
			quat.rotateX(quatA, [1,0,0,0], Math.PI); // 180 deg
			result = quat.slerp(out, [1,0,0,0], quatA, 1);
		});

		test('Quaternion#should calculate proper quat', function() {
			expect(result).toBeEqualish([0,0,0,-1]);
		});
	});

	test('Quaternion#where a == -b', t => {
		beforeEach(function() {
			result = quat.slerp(out, [1, 0, 0, 0], [-1, 0, 0, 0], 0.5);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should calculate proper quat', function() {
			expect(result).toBeEqualish([1, 0, 0, 0]);
		});
	});
});

test('Quaternion#rotateX', t => {
	beforeEach(function() {
		result = quat.rotateX(out, id, deg90);
	});

	test('Quaternion#should return out', function() { expect(result).toBe(out); });
	test('Quaternion#should transform vec accordingly', function() {
		vec3.transformQuat(vec, [0,0,-1], out);
		expect(vec).toBeEqualish([0, 1, 0]);
	});
});

test('Quaternion#rotateY', t => {
	beforeEach(function() {
		result = quat.rotateY(out, id, deg90);
	});

	test('Quaternion#should return out', function() { expect(result).toBe(out); });
	test('Quaternion#should transform vec accordingly', function() {
		vec3.transformQuat(vec, [0,0,-1], out);
		expect(vec).toBeEqualish([-1, 0, 0]);
	});
});

test('Quaternion#rotateZ', t => {
	beforeEach(function() {
		result = quat.rotateZ(out, id, deg90);
	});

	test('Quaternion#should return out', function() { expect(result).toBe(out); });
	test('Quaternion#should transform vec accordingly', function() {
		vec3.transformQuat(vec, [0,1,0], out);
		expect(vec).toBeEqualish([-1, 0, 0]);
	});
});
*/

/*
	test('Quaternion#fromMat3', t => {
		const TEST_CASES = [
			{
				title: 'legacy',
				matrix3: [1, 0, 0, 0, 0, -1, 0, 1, 0],
				quaternion: [-0.707106, 0, 0, 0.707106],
				vector3: null,
				transformedVector3: null
			},
			{
				title: 'where trace > 0',
				matrix4: [ 1, 0, 0, 0, 0, -1, 0, 1, 0],
				vector3: [0, 1, 0],
				transformedVector3: [0,0,-1]
			}
		];

		for (const testCase of TEST_CASES) {
			const result = new Quaternion().fromMatrix3(testCase.matrix3);
			if (testCase.quaternion) {
				tapeEquals(t, result, testCase.quaternion, title);
			}
		}

		t.end();
	}

  , 'should set to the correct value');

			result = quat.fromMat3(out, matr);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#should produce the correct transformation', function() {
			expect(vec3.transformQuat([], , out)).toBeEqualish([0,0,-1]);
		});
	});

	test('Quaternion#from a normal matrix looking 'backward'', t => {
		beforeEach(function() {
			matr = mat3.create();
			mat3.transpose(matr, mat3.invert(matr, mat3.fromMat4(matr, mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, 1], [0, 1, 0]))));
			result = quat.fromMat3(out, matr);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#should produce the same transformation as the given matrix', function() {
			expect(vec3.transformQuat([], [3,2,-1], quat.normalize(out, out))).toBeEqualish(vec3.transformMat3([], [3,2,-1], matr));
		});
	});

	test('Quaternion#from a normal matrix looking 'left' and 'upside down'', t => {
		beforeEach(function() {
			matr = mat3.create();
			mat3.transpose(matr, mat3.invert(matr, mat3.fromMat4(matr, mat4.lookAt(mat4.create(), [0, 0, 0], [-1, 0, 0], [0, -1, 0]))));
			result = quat.fromMat3(out, matr);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#should produce the same transformation as the given matrix', function() {
			expect(vec3.transformQuat([], [3,2,-1], quat.normalize(out, out))).toBeEqualish(vec3.transformMat3([], [3,2,-1], matr));
		});
	});

	test('Quaternion#from a normal matrix looking 'upside down'', t => {
		beforeEach(function() {
			matr = mat3.create();
			mat3.transpose(matr, mat3.invert(matr, mat3.fromMat4(matr, mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, -1], [0, -1, 0]))));
			result = quat.fromMat3(out, matr);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#should produce the same transformation as the given matrix', function() {
			expect(vec3.transformQuat([], [3,2,-1], quat.normalize(out, out))).toBeEqualish(vec3.transformMat3([], [3,2,-1], matr));
		});
	});
});

test('Quaternion#fromEuler', t => {
	test('Quaternion#legacy', t => {
		beforeEach(function() {
			result = quat.fromEuler(out, -90, 0, 0);
		});

		test('Quaternion#should set dest to the correct value', function() {
			expect(result).toBeEqualish([-0.707106, 0, 0, 0.707106]);
		});
	});

	test('Quaternion#where trace > 0', t => {
		beforeEach(function() {
			result = quat.fromEuler(out, -90, 0, 0);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#should produce the correct transformation', function() {
			expect(vec3.transformQuat([], [0,1,0], out)).toBeEqualish([0,0,-1]);
		});
	});
});

test('Quaternion#setAxes', t => {
	let r;
	beforeEach(function() { r = vec3.create(); });

	test('Quaternion#looking left', t => {
		let view, up, right;
		beforeEach(function() {
			view = [-1, 0, 0];
			up   = [ 0, 1, 0];
			right= [ 0, 0,-1];
			result = quat.setAxes([], view, right, up);
		});

		test('Quaternion#should transform local view into world left', function() {
			r = vec3.transformQuat([], [0,0,-1], result);
			expect(r).toBeEqualish([1, 0, 0]);
		});

		test('Quaternion#should transform local right into world front', function() {
			r = vec3.transformQuat([], [1,0,0], result);
			expect(r).toBeEqualish([0, 0, 1]);
		});
	});

	test('Quaternion#given opengl defaults', t => {
		let view, up, right;
		beforeEach(function() {
			view = [0, 0, -1];
			up   = [0, 1,  0];
			right= [1, 0,  0];
			result = quat.setAxes(out, view, right, up);
		});

		test('Quaternion#should return out', function() {
			expect(result).toBe(out);
		});

		test('Quaternion#should produce identity', function() {
			expect(out).toBeEqualish([0, 0, 0, 1]);
		});
	});

	test('Quaternion#legacy example', t => {
		let view, up, right;
		beforeEach(function() {
			right= [1,  0, 0];
			up   = [0,  0, 1];
			view = [0, -1, 0];
			result = quat.setAxes(out, view, right, up);
		});

		xtest('Quaternion#should set correct quat4 values', function() {
			expect(result).toBeEqualish([0.707106, 0, 0, 0.707106]);
		});
	});
});

test('Quaternion#rotationTo', t => {
	let r;
	beforeEach(function() { r = vec3.create(); });

	test('Quaternion#at right angle', t => {
		beforeEach(function() {
			result = quat.rotationTo(out, [0, 1, 0], [1, 0, 0]);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#should calculate proper quaternion', function() {
			expect(out).toBeEqualish([0, 0, -0.707106, 0.707106]);
		});
	});

	test('Quaternion#when vectors are parallel', t => {
		beforeEach(function() {
			result = quat.rotationTo(out, [0, 1, 0], [0, 1, 0]);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#multiplying A should produce B', function() {
			expect(vec3.transformQuat(r, [0, 1, 0], out)).toBeEqualish([0, 1, 0]);
		});
	});

	test('Quaternion#when vectors are opposed X', t => {
		beforeEach(function() {
			result = quat.rotationTo(out, [1, 0, 0], [-1, 0, 0]);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#multiplying A should produce B', function() {
			expect(vec3.transformQuat(r, [1, 0, 0], out)).toBeEqualish([-1, 0, 0]);
		});
	});

	test('Quaternion#when vectors are opposed Y', t => {
		beforeEach(function() {
			result = quat.rotationTo(out, [0, 1, 0], [0, -1, 0]);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#multiplying A should produce B', function() {
			expect(vec3.transformQuat(r, [0, 1, 0], out)).toBeEqualish([0, -1, 0]);
		});
	});

	test('Quaternion#when vectors are opposed Z', t => {
		beforeEach(function() {
			result = quat.rotationTo(out, [0, 0, 1], [0, 0, -1]);
		});

		test('Quaternion#should return out', function() { expect(result).toBe(out); });

		test('Quaternion#multiplying A should produce B', function() {
			expect(vec3.transformQuat(r, [0, 0, 1], out)).toBeEqualish([0, 0, -1]);
		});
	});
});

test('Quaternion#lerp', t => {
	test('Quaternion#with a separate output quaternion', t => {
		beforeEach(function() { result = quat.lerp(out, quatA, quatB, 0.5); });

		test('Quaternion#should place values into out', function() { expect(out).toBeEqualish([3, 4, 5, 6]); });
		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
		test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([5, 6, 7, 8]); });
	});

	test('Quaternion#when quatA is the output quaternion', t => {
		beforeEach(function() { result = quat.lerp(quatA, quatA, quatB, 0.5); });

		test('Quaternion#should place values into quatA', function() { expect(quatA).toBeEqualish([3, 4, 5, 6]); });
		test('Quaternion#should return quatA', function() { expect(result).toBe(quatA); });
		test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([5, 6, 7, 8]); });
	});

	test('Quaternion#when quatB is the output quaternion', t => {
		beforeEach(function() { result = quat.lerp(quatB, quatA, quatB, 0.5); });

		test('Quaternion#should place values into quatB', function() { expect(quatB).toBeEqualish([3, 4, 5, 6]); });
		test('Quaternion#should return quatB', function() { expect(result).toBe(quatB); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
	});
});

test('Quaternion#slerp', t => {
	test('Quaternion#with a separate output quaternion', t => {
		beforeEach(function() { result = quat.slerp(out, quatA, quatB, 0.5); });

		test('Quaternion#should place values into out', function() { expect(out).toBeEqualish([3, 4, 5, 6]); });
		test('Quaternion#should return out', function() { expect(result).toBe(out); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
		test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([5, 6, 7, 8]); });
	});

	test('Quaternion#when quatA is the output quaternion', t => {
		beforeEach(function() { result = quat.slerp(quatA, quatA, quatB, 0.5); });

		test('Quaternion#should place values into quatA', function() { expect(quatA).toBeEqualish([3, 4, 5, 6]); });
		test('Quaternion#should return quatA', function() { expect(result).toBe(quatA); });
		test('Quaternion#should not modify quatB', function() { expect(quatB).toBeEqualish([5, 6, 7, 8]); });
	});

	test('Quaternion#when quatB is the output quaternion', t => {
		beforeEach(function() { result = quat.slerp(quatB, quatA, quatB, 0.5); });

		test('Quaternion#should place values into quatB', function() { expect(quatB).toBeEqualish([3, 4, 5, 6]); });
		test('Quaternion#should return quatB', function() { expect(result).toBe(quatB); });
		test('Quaternion#should not modify quatA', function() { expect(quatA).toBeEqualish([1, 2, 3, 4]); });
	});
});

test('Quaternion#random', t => {
	beforeEach(function() { result = quat.random(out); });

	test('Quaternion#should result in a normalized quaternion', function() {
		let copy = quat.clone(out);
		expect(quat.normalize(out, out)).toBeEqualish(copy);
	});
	test('Quaternion#should return out', function() { expect(result).toBe(out); });
});

*/
