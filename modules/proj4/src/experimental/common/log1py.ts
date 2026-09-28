// math.gl
// SPDX-License-Identifier: MIT
// Adapted from proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (x: number) {
  var y = 1 + x;
  var z = y - 1;

  return z === 0 ? x : (x * Math.log(y)) / z;
}
