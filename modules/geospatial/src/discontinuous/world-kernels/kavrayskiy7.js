// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {pi, sqrt, tau} from './math.js';

export function kavrayskiy7Raw(lambda, phi) {
  return [(3 / tau) * lambda * sqrt((pi * pi) / 3 - phi * phi), phi];
}

kavrayskiy7Raw.invert = function (x, y) {
  return [((tau / 3) * x) / sqrt((pi * pi) / 3 - y * y), y];
};
