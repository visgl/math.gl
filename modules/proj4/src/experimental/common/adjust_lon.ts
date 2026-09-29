// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import {TWO_PI, SPI} from './constants';
import sign from './sign';

export default function (x: number, skipAdjust: boolean) {
  if (skipAdjust) {
    return x;
  }
  return Math.abs(x) <= SPI ? x : x - sign(x) * TWO_PI;
}
