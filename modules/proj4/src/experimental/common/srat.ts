// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (esinp: number, exp: number) {
  return Math.pow((1 - esinp) / (1 + esinp), exp);
}
