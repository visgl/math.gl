// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {atan, quarterPi, sin, tan} from './math.js';

export function timesRaw(lambda, phi) {
  var t = tan(phi / 2),
    s = sin(quarterPi * t);
  return [lambda * (0.74482 - 0.34588 * s * s), 1.70711 * t];
}

timesRaw.invert = function (x, y) {
  var t = y / 1.70711,
    s = sin(quarterPi * t);
  return [x / (0.74482 - 0.34588 * s * s), 2 * atan(t)];
};
