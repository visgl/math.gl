// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Added the inverse limit at the projection center.

import {abs, acos, asin, atan2, cos, epsilon, halfPi, sqrt, sin} from './math.js';

export function hammerRetroazimuthalRaw(phi0) {
  var sinPhi0 = sin(phi0),
    cosPhi0 = cos(phi0),
    rotate = hammerRetroazimuthalRotation(phi0);

  rotate.invert = hammerRetroazimuthalRotation(-phi0);

  function forward(lambda, phi) {
    var p = rotate(lambda, phi);
    (lambda = p[0]), (phi = p[1]);
    var sinPhi = sin(phi),
      cosPhi = cos(phi),
      cosLambda = cos(lambda),
      z = acos(sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLambda),
      sinz = sin(z),
      K = abs(sinz) > epsilon ? z / sinz : 1;
    return [
      K * cosPhi0 * sin(lambda),
      (abs(lambda) > halfPi ? K : -K) * // rotate for back hemisphere
        (sinPhi0 * cosPhi - cosPhi0 * sinPhi * cosLambda)
    ];
  }

  forward.invert = function (x, y) {
    if (Math.hypot(x, y) < 1e-14) return [0, 0];
    var rho = sqrt(x * x + y * y),
      sinz = -sin(rho),
      cosz = cos(rho),
      a = rho * cosz,
      b = -y * sinz,
      c = rho * sinPhi0,
      d = sqrt(a * a + b * b - c * c),
      phi = atan2(a * c + b * d, b * c - a * d),
      lambda =
        (rho > halfPi ? -1 : 1) * atan2(x * sinz, rho * cos(phi) * cosz + y * sin(phi) * sinz);
    return rotate.invert(lambda, phi);
  };

  return forward;
}

// Latitudinal rotation by phi0.
// Temporary hack until D3 supports arbitrary small-circle clipping origins.
function hammerRetroazimuthalRotation(phi0) {
  var sinPhi0 = sin(phi0),
    cosPhi0 = cos(phi0);

  return function (lambda, phi) {
    var cosPhi = cos(phi),
      x = cos(lambda) * cosPhi,
      y = sin(lambda) * cosPhi,
      z = sin(phi);
    return [atan2(y, x * cosPhi0 - z * sinPhi0), asin(z * cosPhi0 + x * sinPhi0)];
  };
}
