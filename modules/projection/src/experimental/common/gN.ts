// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Direct TypeScript port of proj4js 2.22.0. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (a: number, e: number, sinphi: number) {
  var temp = e * sinphi;
  return a / Math.sqrt(1 - temp * temp);
}
