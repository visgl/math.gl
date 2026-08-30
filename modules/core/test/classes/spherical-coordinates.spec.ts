// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 Uber Technologies, Inc.

/* eslint-disable max-statements, max-depth */
import {test, expect} from 'vitest';
import {SphericalCoordinates, Vector3, equals} from '@math.gl/core';

const REPRESENTATION_TEST_CASES = [
  {
    representations: [
      {theta: 0, phi: 0, radius: 1},
      {pitch: 0, bearing: 180, radius: 1}
    ],
    vector: [0, 0, 1]
  },
  {
    representations: [
      {theta: Math.PI / 2, phi: Math.PI, radius: 1},
      {pitch: 90, bearing: 0, radius: 1}
    ],
    vector: [0, 1, 0]
  },
  {
    representations: [
      {theta: Math.PI / 2, phi: 0, radius: 1},
      {pitch: 90, bearing: 180, altitude: 1}
    ],
    vector: [0, -1, 0]
  },
  {
    representations: [
      {theta: Math.PI / 2, phi: Math.PI / 2, radius: 1},
      {pitch: 90, bearing: 90, altitude: 1}
    ],
    vector: [1, 0, 0]
  },
  {
    representations: [
      {theta: Math.PI / 2, phi: -Math.PI / 2, radius: 1},
      {pitch: 90, bearing: 270, altitude: 1}
    ],
    vector: [-1, 0, 0]
  },
  {
    representations: [
      {theta: Math.PI, phi: 0, radius: 1},
      {pitch: 180, bearing: 180, altitude: 1}
    ],
    vector: [0, 0, -1]
  }
];

test('SphericalCoordinates#import', () => {
  expect(typeof SphericalCoordinates, 'SphericalCoordinates import OK').toBe('function');
});

test('SphericalCoordinates#constructor', () => {
  const spherical = new SphericalCoordinates();
  expect(spherical, 'SphericalCoordinates default constructor OK').toBeTruthy();
  expect(() => new SphericalCoordinates({bearing: NaN})).toThrow();
  // @ts-ignore
  expect(() => new SphericalCoordinates({bearing: 0, pitch: 'a'})).toThrow();
});

test('SphericalCoordinates#representations', () => {
  for (const tc of REPRESENTATION_TEST_CASES) {
    for (const rep1 of tc.representations) {
      // Create
      const spherical = new SphericalCoordinates(rep1);
      // Checkl various representations
      for (const rep2 of tc.representations) {
        for (const key of Object.keys(rep2)) {
          if (key !== 'radius' && key !== 'altitude') {
            expect(spherical[key], `${key}`).toBe(rep2[key]);
          }
        }
      }
      // Check vector
      expect(equals(spherical.toVector3(), tc.vector), `Vector conversion OK ${spherical}`).toBe(
        true
      );
    }
  }
});

test('SphericalCoordinates#accessors', () => {
  const spherical = new SphericalCoordinates();
  expect(spherical.bearing, 'bearing').toBe(180);
  expect(spherical.pitch, 'pitch').toBe(0);
  // t.equals(spherical.altitude, 0, 'altitude');
  expect(spherical.longitude, 'longitude').toBe(0);
  expect(spherical.latitude, 'latitude').toBe(0);
  expect(spherical.lng, 'lng').toBe(0);
  expect(spherical.lat, 'lat').toBe(0);
  expect(spherical.z, 'z').toBe(0);
});

test('SphericalCoordinates#methods', () => {
  const spherical = new SphericalCoordinates();
  spherical.set(1, 0, 0);
  spherical.copy(new SphericalCoordinates());
  spherical.fromLngLatZ([1, 1, 0]);
  spherical.fromVector3(new Float32Array([1, 1, 1]));

  const result = new Vector3();
  expect(spherical.toVector3(result)).toBe(result);
});

test('SphericalCoordinates#clone', () => {
  const spherical = new SphericalCoordinates();
  const s2 = spherical.clone();
  expect(spherical, 'clone').not.toBe(s2);
  expect(equals(spherical, s2), 'clone').toBe(true);
  expect(spherical.exactEquals(s2), 'clone').toBeTruthy();
});

test('SphericalCoordinates#makeSafe', () => {
  const spherical = new SphericalCoordinates();
  expect(() => spherical.makeSafe()).not.toThrow();
});
