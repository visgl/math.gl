// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {pi, sqrt} from './math.js';

export function wagner6Raw(lambda, phi) {
  return [lambda * sqrt(1 - (3 * phi * phi) / (pi * pi)), phi];
}

wagner6Raw.invert = function (x, y) {
  return [x / sqrt(1 - (3 * y * y) / (pi * pi)), y];
};
