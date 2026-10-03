// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Direct TypeScript port of proj4js 2.22.0. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import {TWO_PI, SPI} from './constants';
import sign from './sign';

export default function (x: number, skipAdjust: boolean) {
  if (skipAdjust) {
    return x;
  }
  return Math.abs(x) <= SPI ? x : x - sign(x) * TWO_PI;
}
