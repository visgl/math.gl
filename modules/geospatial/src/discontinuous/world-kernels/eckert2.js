// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {abs, asin, pi, sign, sin, sqrt} from './math.js';

export function eckert2Raw(lambda, phi) {
  var alpha = sqrt(4 - 3 * sin(abs(phi)));
  return [(2 / sqrt(6 * pi)) * lambda * alpha, sign(phi) * sqrt((2 * pi) / 3) * (2 - alpha)];
}

eckert2Raw.invert = function (x, y) {
  var alpha = 2 - abs(y) / sqrt((2 * pi) / 3);
  return [(x * sqrt(6 * pi)) / (2 * alpha), sign(y) * asin((4 - alpha * alpha) / 3)];
};
