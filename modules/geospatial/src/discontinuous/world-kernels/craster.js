// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {asin, cos, sin, sqrt, sqrtPi} from './math.js';

var sqrt3 = sqrt(3);

export function crasterRaw(lambda, phi) {
  return [(sqrt3 * lambda * (2 * cos((2 * phi) / 3) - 1)) / sqrtPi, sqrt3 * sqrtPi * sin(phi / 3)];
}

crasterRaw.invert = function (x, y) {
  var phi = 3 * asin(y / (sqrt3 * sqrtPi));
  return [(sqrtPi * x) / (sqrt3 * (2 * cos((2 * phi) / 3) - 1)), phi];
};
