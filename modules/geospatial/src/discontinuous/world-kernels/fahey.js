// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {atan, cos, radians, sqrt, tan} from './math.js';

var faheyK = cos(35 * radians);

export function faheyRaw(lambda, phi) {
  var t = tan(phi / 2);
  return [lambda * faheyK * sqrt(1 - t * t), (1 + faheyK) * t];
}

faheyRaw.invert = function (x, y) {
  var t = y / (1 + faheyK);
  return [x && x / (faheyK * sqrt(1 - t * t)), 2 * atan(t)];
};
