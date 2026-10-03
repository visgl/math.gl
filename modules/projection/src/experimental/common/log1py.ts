// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Direct TypeScript port of proj4js 2.22.0. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (x: number) {
  var y = 1 + x;
  var z = y - 1;

  return z === 0 ? x : (x * Math.log(y)) / z;
}
