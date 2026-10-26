// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {atan, exp, log, quarterPi, pi, tan} from './math.js';

export function millerRaw(lambda, phi) {
  return [lambda, 1.25 * log(tan(quarterPi + 0.4 * phi))];
}

millerRaw.invert = function (x, y) {
  return [x, 2.5 * atan(exp(0.8 * y)) - 0.625 * pi];
};
