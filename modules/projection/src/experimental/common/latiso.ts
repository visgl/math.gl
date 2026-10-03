// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Direct TypeScript port of proj4js 2.22.0. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import {HALF_PI} from './constants';

export default function (eccent: number, phi: number, sinphi: number) {
  if (Math.abs(phi) > HALF_PI) {
    return Number.NaN;
  }
  if (phi === HALF_PI) {
    return Number.POSITIVE_INFINITY;
  }
  if (phi === -1 * HALF_PI) {
    return Number.NEGATIVE_INFINITY;
  }

  var con = eccent * sinphi;
  return Math.log(Math.tan((HALF_PI + phi) / 2)) + (eccent * Math.log((1 - con) / (1 + con))) / 2;
}
