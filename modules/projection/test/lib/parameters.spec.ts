// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {wrapLongitude} from '../../src/experimental/parameters';

test.each([-900, -540, -190, -180, -170, 0, 170, 180, 190, 540, 900])(
  'longitude wrapping honors +over at %s degrees',
  degrees => {
    const longitude = (degrees * Math.PI) / 180;
    expect(wrapLongitude(longitude, true)).toBe(longitude);
    expect(wrapLongitude(longitude, false)).toBe(wrapLongitude(longitude));
    expect(wrapLongitude(longitude)).toBeGreaterThanOrEqual(-Math.PI);
    expect(wrapLongitude(longitude)).toBeLessThanOrEqual(Math.PI);
    expect(Math.sin(wrapLongitude(longitude))).toBeCloseTo(Math.sin(longitude), 12);
    expect(Math.cos(wrapLongitude(longitude))).toBeCloseTo(Math.cos(longitude), 12);
  }
);

test('longitude wrapping preserves signed zero and both principal seam endpoints', () => {
  for (const over of [false, true]) {
    for (const longitude of [-0, 0, -Math.PI, Math.PI]) {
      expect(wrapLongitude(longitude, over)).toBe(longitude);
    }
  }
});
