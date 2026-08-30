// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getS2OrientedBoundingBoxCornerPoints} from '../src/converters/s2-to-obb-points';
import {getS2Region} from '../src/converters/s2-to-region';
import {getS2Cell} from '../src/s2-geometry/s2-geometry';
import {S2Decoder} from '../src/s2-decoder';

test('S2 converters return height-aware corner points and geographic regions', () => {
  const token = '80858004';
  const points = getS2OrientedBoundingBoxCornerPoints(token, {
    minimumHeight: 10,
    maximumHeight: 20
  });
  expect(points).toHaveLength(8);
  expect(points.slice(0, 4).every(point => point[2] === 10)).toBe(true);
  expect(points.slice(4).every(point => point[2] === 20)).toBe(true);
  expect(getS2OrientedBoundingBoxCornerPoints(token)).toEqual(
    getS2OrientedBoundingBoxCornerPoints(token, {minimumHeight: 0, maximumHeight: 0})
  );

  const region = getS2Region(getS2Cell(S2Decoder.tokenToCell(token)));
  expect(region).toHaveLength(4);
  expect(region[0]).toBeLessThan(region[2]);
  expect(region[1]).toBeLessThan(region[3]);
});
