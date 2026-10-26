// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {cos} from './math.js';

export function sinusoidalRaw(lambda, phi) {
  return [lambda * cos(phi), phi];
}

sinusoidalRaw.invert = function (x, y) {
  return [x / cos(y), y];
};
