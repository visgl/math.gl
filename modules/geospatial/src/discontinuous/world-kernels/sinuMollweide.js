// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {mollweideRaw} from './mollweide.js';
import {sinusoidalRaw} from './sinusoidal.js';

export var sinuMollweidePhi = 0.7109889596207567;

export var sinuMollweideY = 0.0528035274542;

export function sinuMollweideRaw(lambda, phi) {
  return phi > -sinuMollweidePhi
    ? ((lambda = mollweideRaw(lambda, phi)), (lambda[1] += sinuMollweideY), lambda)
    : sinusoidalRaw(lambda, phi);
}

sinuMollweideRaw.invert = function (x, y) {
  return y > -sinuMollweidePhi
    ? mollweideRaw.invert(x, y - sinuMollweideY)
    : sinusoidalRaw.invert(x, y);
};
