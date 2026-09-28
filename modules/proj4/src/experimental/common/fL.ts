// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import {HALF_PI} from './constants';

export default function (x: number, L: number) {
  return 2 * Math.atan(x * Math.exp(L)) - HALF_PI;
}
