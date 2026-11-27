// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {atan2, cos, sin, sqrt, tan} from './math.js';
import {sinusoidalRaw} from './sinusoidal.js';

export function bonneRaw(phi0) {
  if (!phi0) return sinusoidalRaw;
  var cotPhi0 = 1 / tan(phi0);

  function forward(lambda, phi) {
    var rho = cotPhi0 + phi0 - phi,
      e = rho ? (lambda * cos(phi)) / rho : rho;
    return [rho * sin(e), cotPhi0 - rho * cos(e)];
  }

  forward.invert = function (x, y) {
    var rho = sqrt(x * x + (y = cotPhi0 - y) * y),
      phi = cotPhi0 + phi0 - rho;
    return [(rho / cos(phi)) * atan2(x, y), phi];
  };

  return forward;
}
