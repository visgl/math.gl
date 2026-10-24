// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {pi, sqrt} from './math.js';

export function eckert3Raw(lambda, phi) {
  var k = sqrt(pi * (4 + pi));
  return [(2 / k) * lambda * (1 + sqrt(1 - (4 * phi * phi) / (pi * pi))), (4 / k) * phi];
}

eckert3Raw.invert = function (x, y) {
  var k = sqrt(pi * (4 + pi)) / 2;
  return [(x * k) / (1 + sqrt(1 - (y * y * (4 + pi)) / (4 * pi))), (y * k) / 2];
};
