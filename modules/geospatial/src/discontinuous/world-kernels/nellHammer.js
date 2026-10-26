// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {abs, cos, epsilon, tan} from './math.js';

export function nellHammerRaw(lambda, phi) {
  return [(lambda * (1 + cos(phi))) / 2, 2 * (phi - tan(phi / 2))];
}

nellHammerRaw.invert = function (x, y) {
  var p = y / 2;
  for (var i = 0, delta = Infinity; i < 10 && abs(delta) > epsilon; ++i) {
    var c = cos(y / 2);
    y -= delta = (y - tan(y / 2) - p) / (1 - 0.5 / (c * c));
  }
  return [(2 * x) / (1 + cos(y)), y];
};
