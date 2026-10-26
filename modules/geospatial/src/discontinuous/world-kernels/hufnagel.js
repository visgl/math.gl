// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {asin, cos, pi, sign, sin, sqrt} from './math.js';
import {solve} from './newton.js';

export function hufnagelRaw(a, b, psiMax, ratio) {
  var k = sqrt(
      (4 * pi) /
        (2 * psiMax +
          (1 + a - b / 2) * sin(2 * psiMax) +
          ((a + b) / 2) * sin(4 * psiMax) +
          (b / 2) * sin(6 * psiMax))
    ),
    c = sqrt(
      ratio * sin(psiMax) * sqrt((1 + a * cos(2 * psiMax) + b * cos(4 * psiMax)) / (1 + a + b))
    ),
    M = psiMax * mapping(1);

  function radius(psi) {
    return sqrt(1 + a * cos(2 * psi) + b * cos(4 * psi));
  }

  function mapping(t) {
    var psi = t * psiMax;
    return (
      (2 * psi +
        (1 + a - b / 2) * sin(2 * psi) +
        ((a + b) / 2) * sin(4 * psi) +
        (b / 2) * sin(6 * psi)) /
      psiMax
    );
  }

  function inversemapping(psi) {
    return radius(psi) * sin(psi);
  }

  var forward = function (lambda, phi) {
    var psi = psiMax * solve(mapping, (M * sin(phi)) / psiMax, phi / pi);
    if (Number.isNaN(psi)) psi = psiMax * sign(phi);
    var kr = k * radius(psi);
    return [((kr * c * lambda) / pi) * cos(psi), (kr / c) * sin(psi)];
  };

  forward.invert = function (x, y) {
    var psi = solve(inversemapping, (y * c) / k);
    return [
      (x * pi) / (cos(psi) * k * c * radius(psi)),
      asin((psiMax * mapping(psi / psiMax)) / M)
    ];
  };

  if (psiMax === 0) {
    k = sqrt(ratio / pi);
    forward = function (lambda, phi) {
      return [lambda * k, sin(phi) / k];
    };
    forward.invert = function (x, y) {
      return [x / k, asin(y * k)];
    };
  }

  return forward;
}
