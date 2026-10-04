// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {parsePGM} from '@math.gl/geoid';
import {openFile} from './utils/file-utils';

test('optional EGM96 grids preserve source samples and longitude wrapping', async () => {
  const directory = 'modules/geoid/data/';
  const grids = [];
  for (const resolution of ['low', 'hi']) {
    const bytes = (await openFile(`${directory}geoid-egm96-${resolution}.pgm`))!;
    expect(bytes.length).toBe(resolution === 'low' ? 130430 : 2076888);
    grids.push(parsePGM(bytes, {cubic: false}));
  }
  const [low, hi] = grids;
  // Preview nodes must exactly match their original 15-minute samples.
  for (let latitude = -90; latitude <= 90; latitude += 10) {
    for (let longitude = -180; longitude < 180; longitude += 10) {
      expect(low.getHeight(latitude, longitude)).toBe(hi.getHeight(latitude, longitude));
      expect(hi.getHeight(latitude, longitude + 360)).toBeCloseTo(
        hi.getHeight(latitude, longitude),
        9
      );
    }
  }
  expect(hi.getHeight(0, 80)).toBeLessThan(-90);
  expect(hi.getHeight(-5, 145)).toBeGreaterThan(60);
  for (const pole of [-90, 90]) {
    expect(hi.getHeight(pole, 0)).toBeCloseTo(hi.getHeight(pole, 120), 9);
  }
});
