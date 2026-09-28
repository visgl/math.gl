// math.gl
// SPDX-License-Identifier: MIT
// Adapted from proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (phi: number, sphi: number, cphi: number, en: readonly number[]) {
  cphi *= sphi;
  sphi *= sphi;
  return en[0] * phi - cphi * (en[1] + sphi * (en[2] + sphi * (en[3] + sphi * en[4])));
}
