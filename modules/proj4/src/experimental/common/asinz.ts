// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (x: number) {
  if (Math.abs(x) > 1) {
    x = x > 1 ? 1 : -1;
  }
  return Math.asin(x);
}
