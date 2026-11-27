// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Domain clipping replaces the upstream out-of-domain y displacement.

import {abs, atan2, cos, epsilon, sin, tan} from './math.js';

export function armadilloRaw(phi0) {
  var sinPhi0 = sin(phi0),
    cosPhi0 = cos(phi0),
    sPhi0 = phi0 >= 0 ? 1 : -1,
    tanPhi0 = tan(sPhi0 * phi0),
    k = (1 + sinPhi0 - cosPhi0) / 2;

  function forward(lambda, phi) {
    var cosPhi = cos(phi),
      cosLambda = cos((lambda /= 2));
    return [
      (1 + cosPhi) * sin(lambda),
      k + sin(phi) * cosPhi0 - (1 + cosPhi) * sinPhi0 * cosLambda // TODO D3 core should allow null or [NaN, NaN] to be returned.
    ];
  }

  forward.invert = function (x, y) {
    var lambda = 0,
      phi = 0,
      i = 50;
    do {
      var cosLambda = cos(lambda),
        sinLambda = sin(lambda),
        cosPhi = cos(phi),
        sinPhi = sin(phi),
        A = 1 + cosPhi,
        fx = A * sinLambda - x,
        fy = k + sinPhi * cosPhi0 - A * sinPhi0 * cosLambda - y,
        dxdLambda = (A * cosLambda) / 2,
        dxdPhi = -sinLambda * sinPhi,
        dydLambda = (sinPhi0 * A * sinLambda) / 2,
        dydPhi = cosPhi0 * cosPhi + sinPhi0 * cosLambda * sinPhi,
        denominator = dxdPhi * dydLambda - dydPhi * dxdLambda,
        dLambda = (fy * dxdPhi - fx * dydPhi) / denominator / 2,
        dPhi = (fx * dydLambda - fy * dxdLambda) / denominator;
      if (abs(dPhi) > 2) dPhi /= 2;
      (lambda -= dLambda), (phi -= dPhi);
    } while ((abs(dLambda) > epsilon || abs(dPhi) > epsilon) && --i > 0);
    return sPhi0 * phi > -atan2(cos(lambda), tanPhi0) - 1e-3 ? [lambda * 2, phi] : null;
  };

  return forward;
}
