// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {atan, cos, sqrtPi, tan} from './math.js';

export function foucautRaw(lambda, phi) {
  var k = phi / 2,
    cosk = cos(k);
  return [((2 * lambda) / sqrtPi) * cos(phi) * cosk * cosk, sqrtPi * tan(k)];
}

foucautRaw.invert = function (x, y) {
  var k = atan(y / sqrtPi),
    cosk = cos(k),
    phi = 2 * k;
  return [(x * sqrtPi) / 2 / (cos(phi) * cosk * cosk), phi];
};
