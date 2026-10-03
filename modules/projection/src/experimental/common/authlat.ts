// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Direct TypeScript port of proj4js 2.22.0. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function authlat(beta: number, APA: readonly number[]) {
  var t = beta + beta;
  return beta + APA[0] * Math.sin(t) + APA[1] * Math.sin(t + t) + APA[2] * Math.sin(t + t + t);
}
