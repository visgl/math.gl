// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {cos, pi, sqrt} from './math.js';

export function eckert5Raw(lambda, phi) {
  return [(lambda * (1 + cos(phi))) / sqrt(2 + pi), (2 * phi) / sqrt(2 + pi)];
}

eckert5Raw.invert = function (x, y) {
  var k = sqrt(2 + pi),
    phi = (y * k) / 2;
  return [(k * x) / (1 + cos(phi)), phi];
};
