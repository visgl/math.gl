// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {abs, asin, cos, epsilon, halfPi, pi, sin, sqrt2} from './math.js';

export function mollweideBromleyTheta(cp, phi) {
  var cpsinPhi = cp * sin(phi),
    i = 30,
    delta;
  do phi -= delta = (phi + sin(phi) - cpsinPhi) / (1 + cos(phi));
  while (abs(delta) > epsilon && --i > 0);
  return phi / 2;
}

export function mollweideBromleyRaw(cx, cy, cp) {
  function forward(lambda, phi) {
    return [cx * lambda * cos((phi = mollweideBromleyTheta(cp, phi))), cy * sin(phi)];
  }

  forward.invert = function (x, y) {
    return (y = asin(y / cy)), [x / (cx * cos(y)), asin((2 * y + sin(2 * y)) / cp)];
  };

  return forward;
}

export var mollweideRaw = mollweideBromleyRaw(sqrt2 / halfPi, sqrt2, pi);
