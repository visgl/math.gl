// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2010-2024 Mike Bostock
// Adapted from d3-geo 3.1.1; see ./D3-GEO-LICENSE.txt.

import {atan2, cos, sin, sqrt} from './math.js';

export function spherical(cartesian) {
  return [
    atan2(cartesian[1], cartesian[0]),
    atan2(cartesian[2], Math.hypot(cartesian[0], cartesian[1]))
  ];
}

export function cartesian(spherical) {
  var lambda = spherical[0],
    phi = spherical[1],
    cosPhi = cos(phi);
  return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)];
}

export function cartesianDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cartesianCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// TODO return a
export function cartesianAddInPlace(a, b) {
  (a[0] += b[0]), (a[1] += b[1]), (a[2] += b[2]);
}

export function cartesianScale(vector, k) {
  return [vector[0] * k, vector[1] * k, vector[2] * k];
}

// TODO return d
export function cartesianNormalizeInPlace(d) {
  var l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  (d[0] /= l), (d[1] /= l), (d[2] /= l);
}
