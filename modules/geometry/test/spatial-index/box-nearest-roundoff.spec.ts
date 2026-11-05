// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BoxIndex} from '../../src/spatial-index';

test.each([1e-200, 1, 1e100])(
  'nearest refinement preserves inclusive distance and ties despite bound roundoff at scale %s',
  scale => {
    const exact = 0.29999999999999993 * scale;
    const index = new BoxIndex({
      bounds: [0.3 * scale, -1, 0.4 * scale, 1, 0.2 * scale, -1, 0.4 * scale, 1],
      dimension: 2,
      leafSize: 1
    });
    expect(index.nearest([0, 0], {distanceToItem: () => exact})).toEqual({
      index: 0,
      distance: exact
    });
    expect(index.nearest([0, 0], {maxDistance: exact, distanceToItem: () => exact})).toEqual({
      index: 0,
      distance: exact
    });
    expect(
      index.nearest([0, 0], {maxDistance: exact * (1 - 1e-10), distanceToItem: () => exact})
    ).toBeNull();
    expect(() => index.nearest([0, 0], {distanceToItem: () => 0.19 * scale})).toThrow(
      'below box distance'
    );
  }
);
