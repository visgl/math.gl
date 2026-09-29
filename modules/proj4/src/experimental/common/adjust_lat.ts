// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import {HALF_PI} from './constants';
import sign from './sign';

export default function (x: number) {
  return Math.abs(x) < HALF_PI ? x : x - sign(x) * Math.PI;
}
