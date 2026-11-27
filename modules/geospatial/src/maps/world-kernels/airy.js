// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.

import {abs, asin, atan2, cos, epsilon, log, sin, sqrt, tan} from './math.js';

export function airyRaw(beta) {
  var tanBeta_2 = tan(beta / 2),
    b = (2 * log(cos(beta / 2))) / (tanBeta_2 * tanBeta_2);

  function forward(x, y) {
    var cosx = cos(x),
      cosy = cos(y),
      siny = sin(y),
      cosz = cosy * cosx,
      k = -((1 - cosz ? log((1 + cosz) / 2) / (1 - cosz) : -0.5) + b / (1 + cosz));
    return [k * cosy * sin(x), k * siny];
  }

  forward.invert = function (x, y) {
    var r = sqrt(x * x + y * y),
      z = -beta / 2,
      i = 50,
      delta;
    if (!r) return [0, 0];
    do {
      var z_2 = z / 2,
        cosz_2 = cos(z_2),
        sinz_2 = sin(z_2),
        tanz_2 = sinz_2 / cosz_2,
        lnsecz_2 = -log(abs(cosz_2));
      z -= delta =
        (((2 / tanz_2) * lnsecz_2 - b * tanz_2 - r) /
          (-lnsecz_2 / (sinz_2 * sinz_2) + 1 - b / (2 * cosz_2 * cosz_2))) *
        (cosz_2 < 0 ? 0.7 : 1);
    } while (abs(delta) > epsilon && --i > 0);
    var sinz = sin(z);
    return [atan2(x * sinz, r * cos(z)), asin((y * sinz) / r)];
  };

  return forward;
}
