// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {abs, pi, sqrt} from './math.js';

export function eckert1Raw(lambda, phi) {
  var alpha = sqrt(8 / (3 * pi));
  return [alpha * lambda * (1 - abs(phi) / pi), alpha * phi];
}

eckert1Raw.invert = function (x, y) {
  var alpha = sqrt(8 / (3 * pi)),
    phi = y / alpha;
  return [x / (alpha * (1 - abs(phi) / pi)), phi];
};
