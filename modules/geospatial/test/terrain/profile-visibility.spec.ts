// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getTerrainProfileVisibility, sampleTerrainProfile} from '@math.gl/geospatial/terrain';

test('sampled profile visibility reports clear, grazing and obstructed lines', () => {
  const profile = sampleTerrainProfile(x => ({status: 0, height: x === 2 ? 3 : 0}), [0, 0, 4, 0], {
    spacing: 1
  });
  expect(
    getTerrainProfileVisibility(profile, {
      observerHeight: 4,
      targetHeight: 4
    })
  ).toMatchObject({status: 'clear', minimumClearance: 1});
  expect(
    getTerrainProfileVisibility(profile, {
      observerHeight: 3,
      targetHeight: 3
    })
  ).toMatchObject({
    status: 'blocked',
    firstBlockingSample: 2,
    minimumClearance: 0
  });
  expect(
    getTerrainProfileVisibility(profile, {
      observerHeight: 4,
      targetHeight: 0
    })
  ).toMatchObject({status: 'blocked', firstBlockingSample: 2});
});

test('missing terrain is unknown unless a known sample blocks the line', () => {
  const profile = sampleTerrainProfile(
    x => ({status: x === 1 ? 2 : 0, height: x === 2 ? 5 : 0}),
    [0, 0, 3, 0],
    {spacing: 1}
  );
  expect(
    getTerrainProfileVisibility(profile, {
      observerHeight: 6,
      targetHeight: 6
    })
  ).toMatchObject({status: 'unknown', missingSampleCount: 1});
  expect(
    getTerrainProfileVisibility(profile, {
      observerHeight: 4,
      targetHeight: 4
    })
  ).toMatchObject({
    status: 'blocked',
    missingSampleCount: 1,
    firstBlockingSample: 2
  });
});

test('missing endpoints and entirely missing profiles do not imply visibility', () => {
  const profile = sampleTerrainProfile(() => ({status: 2, height: NaN}), [0, 0, 2, 0], {
    spacing: 1
  });
  expect(getTerrainProfileVisibility(profile, {observerHeight: 1, targetHeight: 1})).toEqual({
    status: 'unknown',
    firstBlockingSample: undefined,
    missingSampleCount: 3,
    minimumClearance: undefined
  });
  profile.statuses[2] = 0;
  profile.heights[2] = 1;
  expect(getTerrainProfileVisibility(profile, {observerHeight: 1, targetHeight: 1})).toMatchObject({
    status: 'blocked',
    firstBlockingSample: 2,
    missingSampleCount: 2
  });
});

test('invalid profiles and unrepresentable clearance fail explicitly', () => {
  const profile = sampleTerrainProfile(() => ({status: 0, height: 0}), [0, 0, 2, 0], {spacing: 1});
  expect(() =>
    getTerrainProfileVisibility(profile, {
      observerHeight: 1,
      targetHeight: 1,
      maxSamples: 2
    })
  ).toThrow();
  profile.distances[1] = 0;
  expect(() =>
    getTerrainProfileVisibility(profile, {
      observerHeight: 1,
      targetHeight: 1
    })
  ).toThrow();
  profile.distances[1] = 1;
  profile.heights[1] = -Number.MAX_VALUE;
  expect(() =>
    getTerrainProfileVisibility(profile, {
      observerHeight: Number.MAX_VALUE,
      targetHeight: Number.MAX_VALUE
    })
  ).toThrow();
});
