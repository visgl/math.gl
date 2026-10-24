// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4, Quaternion, Vector3, config} from '@math.gl/core';
import {Ellipsoid, LocalReferenceFrame} from '@math.gl/geospatial/ellipsoid';

function close(actual: ArrayLike<number>, expected: ArrayLike<number>, digits = 10): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) expect(actual[i]).toBeCloseTo(expected[i], digits);
}

const sphere = new Ellipsoid(10, 10, 10);
const frame = new LocalReferenceFrame([10, 0, 0], {ellipsoid: sphere});

test('LocalReferenceFrame distinguishes points and vectors with independent axis fixtures', () => {
  close(frame.localToFixedPoint([2, 3, 4]), [14, 2, 3]);
  close(frame.localToFixedVector([2, 3, 4]), [4, 2, 3]);
  close(frame.fixedToLocalPoint([14, 2, 3]), [2, 3, 4]);
  close(frame.fixedToLocalVector([4, 2, 3]), [2, 3, 4]);
  const inPlace = new Vector3(2, 3, 4);
  expect(frame.localToFixedPoint(inPlace, inPlace)).toBe(inPlace);
  close(inPlace, [14, 2, 3]);
  close(frame.localToFixedMatrix.transformAsPoint([2, 3, 4]), [14, 2, 3]);
  close(frame.fixedToLocalMatrix.transformAsPoint([14, 2, 3]), [2, 3, 4]);
});

test('LocalReferenceFrame supports NED, datelines, and both poles', () => {
  const ned = new LocalReferenceFrame([10, 0, 0], {
    ellipsoid: sphere,
    axes: ['north', 'east', 'down']
  });
  close(ned.localToFixedVector([2, 3, 4]), [-4, 3, 2]);
  const north = new LocalReferenceFrame([0, 0, 10], {ellipsoid: sphere});
  close(north.localToFixedVector([1, 0, 0]), [0, 1, 0]);
  close(north.localToFixedVector([0, 1, 0]), [-1, 0, 0]);
  const south = new LocalReferenceFrame([0, 0, -10], {ellipsoid: sphere});
  close(south.localToFixedVector([0, 1, 0]), [1, 0, 0]);
  const dateline = new LocalReferenceFrame([-10, 0, 0], {ellipsoid: sphere});
  close(dateline.localToFixedVector([1, 0, 0]), [0, -1, 0]);
});

test('LocalReferenceFrame elevated origins follow geodetic latitude and snapshot caller state', () => {
  const ellipsoid = new Ellipsoid(10, 10, 8);
  const origin = ellipsoid.cartographicToCartesian([35, 60, 100]);
  const local = new LocalReferenceFrame(origin, {ellipsoid});
  const longitude = (35 * Math.PI) / 180;
  const latitude = (60 * Math.PI) / 180;
  close(
    local.localToFixedVector([0, 0, 1]),
    [
      Math.cos(latitude) * Math.cos(longitude),
      Math.cos(latitude) * Math.sin(longitude),
      Math.sin(latitude)
    ],
    8
  );
  origin.fill(0);
  local.localToFixedMatrix.fill(0);
  local.fixedToLocalMatrix.fill(0);
  close(local.localToFixedVector([1, 0, 0]), [-Math.sin(longitude), Math.cos(longitude), 0], 8);
});

test('Geographic poses have explicit heading, pitch and roll signs', () => {
  close(
    frame
      .headingPitchRollToFixedFrame({heading: Math.PI / 2, pitch: 0, roll: 0})
      .transformAsVector([1, 0, 0]),
    [0, 0, -1]
  );
  close(
    frame
      .headingPitchRollToFixedFrame({heading: 0, pitch: Math.PI / 2, roll: 0})
      .transformAsVector([1, 0, 0]),
    [1, 0, 0]
  );
  close(
    frame
      .headingPitchRollToFixedFrame({heading: 0, pitch: 0, roll: Math.PI / 2})
      .transformAsVector([0, 1, 0]),
    [1, 0, 0]
  );
  const result = new Matrix4();
  expect(frame.headingPitchRollToFixedFrame({heading: 0, pitch: 0, roll: 0}, result)).toBe(result);
});

test('Geographic attitude extraction reconstructs mixed poses and gimbal locks', () => {
  for (const pitch of [-Math.PI / 2, -1.2, 0.4, Math.PI / 2]) {
    const attitude = {heading: 0.7, pitch, roll: -0.3};
    const pose = frame.headingPitchRollToFixedFrame(attitude);
    const extracted = frame.fixedFrameToHeadingPitchRoll(pose);
    close(frame.headingPitchRollToFixedFrame(extracted), pose, 9);
    if (Math.abs(pitch) === Math.PI / 2) expect(extracted.roll).toBe(0);
    const quaternion = new Quaternion();
    expect(frame.headingPitchRollQuaternion(attitude, quaternion)).toBe(quaternion);
    const rotation = new Matrix4().fromQuaternion(quaternion);
    close(rotation.transformAsVector([0.2, 0.3, 0.4]), pose.transformAsVector([0.2, 0.3, 0.4]));
  }
});

test('Velocity orientation normalizes speed and rejects singular motion without writing output', () => {
  const quaternion = frame.velocityQuaternion([0, 250, 0]);
  const rotation = new Matrix4().fromQuaternion(quaternion);
  close(rotation.transformAsVector([1, 0, 0]), [0, 1, 0]);
  close(rotation.transformAsVector([0, 0, 1]), [1, 0, 0]);
  const result = new Quaternion(1, 2, 3, 4);
  for (const velocity of [
    [0, 0, 0],
    [10, 0, 0],
    [-10, 0, 0],
    [1, 1e-14, 0]
  ]) {
    expect(frame.velocityQuaternion(velocity, result)).toBeUndefined();
    close(result, [1, 2, 3, 4]);
  }
  expect(frame.velocityQuaternion([0, 250, 0], result)).toBe(result);
});

test('Frames and poses reject invalid, nonrigid and unsupported inputs', () => {
  for (const origin of [
    [0, 0, 0],
    [NaN, 0, 0],
    [1, 2]
  ])
    expect(() => new LocalReferenceFrame(origin)).toThrow(RangeError);
  expect(() => new LocalReferenceFrame([10, 0, 0], {axes: ['east', 'north', 'down']})).toThrow(
    RangeError
  );
  expect(() => new LocalReferenceFrame([10, 0, 0], {ellipsoid: new Ellipsoid(10, 9, 8)})).toThrow(
    RangeError
  );
  expect(() => frame.fixedFrameToHeadingPitchRoll(new Matrix4().scale([2, 1, 1]))).toThrow(
    RangeError
  );
  expect(() => frame.fixedFrameToHeadingPitchRoll(new Matrix4().scale([-1, 1, 1]))).toThrow(
    RangeError
  );
  const result = new Vector3(1, 2, 3);
  expect(() => frame.localToFixedPoint([Infinity, 0, 0], result)).toThrow(RangeError);
  close(result, [1, 2, 3]);
  const pose = new Matrix4();
  expect(() => frame.headingPitchRollToFixedFrame({heading: NaN, pitch: 0, roll: 0}, pose)).toThrow(
    RangeError
  );
  close(pose, new Matrix4());
});

test('Mixed geographic poses reconstruct across custom frames and near gimbal lock', () => {
  for (const axes of [
    ['east', 'north', 'up'],
    ['north', 'east', 'down']
  ] as const) {
    for (const latitude of [-90, -70, 0, 55, 90]) {
      const origin = Ellipsoid.WGS84.cartographicToCartesian([130, latitude, 1200]);
      const geographic = new LocalReferenceFrame(origin, {axes});
      for (const pitch of [-Math.PI / 2 + 1e-8, -0.9, 0, 1.3, Math.PI / 2 - 1e-8]) {
        const pose = geographic.headingPitchRollToFixedFrame({heading: -2.4, pitch, roll: 1.8});
        const extracted = geographic.fixedFrameToHeadingPitchRoll(pose);
        close(geographic.headingPitchRollToFixedFrame(extracted), pose, 6);
      }
      const original = new Vector3(0.001, -5, 20);
      close(geographic.fixedToLocalPoint(geographic.localToFixedPoint(original)), original, 7);
    }
  }
});

test('Typed array frame input and failed inverse validation preserve reusable results', () => {
  const typed = new LocalReferenceFrame(new Float64Array([10, 0, 0]), {ellipsoid: sphere});
  close(typed.localToFixedVector(new Float32Array([1, 2, 3])), [3, 1, 2]);
  const pose = new Matrix4();
  pose[3] = 0.01;
  expect(() => typed.fixedFrameToHeadingPitchRoll(pose)).toThrow(RangeError);
  expect(() => typed.velocityQuaternion([0, NaN, 0])).toThrow(RangeError);
  expect(() => typed.localToFixedPoint([1, 2, 3, 4])).toThrow(RangeError);
});

test('Subnormal velocity and large invalid rotations cannot produce nonfinite orientations', () => {
  const orientation = frame.velocityQuaternion([0, 1e-320, 0]);
  expect(orientation.every(Number.isFinite)).toBe(true);
  const pose = new Matrix4();
  pose[0] = pose[5] = pose[10] = 1e308;
  expect(() => frame.fixedFrameToHeadingPitchRoll(pose)).toThrow(RangeError);
  const translated = frame.headingPitchRollToFixedFrame({heading: 0.3, pitch: -0.5, roll: 0.2});
  translated[12] = translated[13] = translated[14] = Number.MAX_VALUE;
  const attitude = frame.fixedFrameToHeadingPitchRoll(translated);
  expect(attitude.heading).toBeCloseTo(0.3, 12);
  expect(attitude.pitch).toBeCloseTo(-0.5, 12);
  expect(attitude.roll).toBeCloseTo(0.2, 12);
});

test('Velocity orientation is invariant under extreme finite scaling', () => {
  for (const speed of [Number.MIN_VALUE, 1, 1.3e308]) {
    const q = frame.velocityQuaternion([0, speed, speed])!;
    close(new Vector3(1, 0, 0).transformByQuaternion(q), [0, Math.SQRT1_2, Math.SQRT1_2], 14);
  }
});

test('Local reference frames respect radian cartographic configuration', () => {
  const previous = config._cartographicRadians;
  try {
    config._cartographicRadians = true;
    const f = new LocalReferenceFrame([0, 5 * Math.sqrt(3), 5], {ellipsoid: sphere});
    close(f.localToFixedVector([1, 0, 0]), [-1, 0, 0], 14);
    close(f.localToFixedVector([0, 0, 1]), [0, Math.sqrt(3) / 2, 0.5], 14);
  } finally {
    config._cartographicRadians = previous;
  }
});
