// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.

import {asin, atan2, cos, sin, sqrt} from './math.js';

function satelliteVerticalRaw(P) {
  function forward(lambda, phi) {
    var cosPhi = cos(phi),
      k = (P - 1) / (P - cosPhi * cos(lambda));
    return [k * cosPhi * sin(lambda), k * sin(phi)];
  }

  forward.invert = function (x, y) {
    var rho2 = x * x + y * y,
      rho = sqrt(rho2),
      sinc = (P - sqrt(1 - (rho2 * (P + 1)) / (P - 1))) / ((P - 1) / rho + rho / (P - 1));
    return [atan2(x * sinc, rho * sqrt(1 - sinc * sinc)), rho ? asin((y * sinc) / rho) : 0];
  };

  return forward;
}

export function satelliteRaw(P, omega) {
  var vertical = satelliteVerticalRaw(P);
  if (!omega) return vertical;
  var cosOmega = cos(omega),
    sinOmega = sin(omega);

  function forward(lambda, phi) {
    var coordinates = vertical(lambda, phi),
      y = coordinates[1],
      A = (y * sinOmega) / (P - 1) + cosOmega;
    return [(coordinates[0] * cosOmega) / A, y / A];
  }

  forward.invert = function (x, y) {
    var k = (P - 1) / (P - 1 - y * sinOmega);
    return vertical.invert(k * x, k * y * cosOmega);
  };

  return forward;
}
