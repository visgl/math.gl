// math.gl
// SPDX-License-Identifier: MIT
// Adapted from proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (eccent: number, sinphi: number, cosphi: number) {
  var con = eccent * sinphi;
  return cosphi / Math.sqrt(1 - con * con);
}
