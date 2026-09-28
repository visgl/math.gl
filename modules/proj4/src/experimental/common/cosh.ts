// math.gl
// SPDX-License-Identifier: MIT
// Adapted from proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (x: number) {
  var r = Math.exp(x);
  r = (r + 1 / r) / 2;
  return r;
}
