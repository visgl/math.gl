// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (eccent: number, sinphi: number) {
  var con;
  if (eccent > 1.0e-7) {
    con = eccent * sinphi;
    return (
      (1 - eccent * eccent) *
      (sinphi / (1 - con * con) - (0.5 / eccent) * Math.log((1 - con) / (1 + con)))
    );
  } else {
    return 2 * sinphi;
  }
}
