// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Adapted from proj4js 2.22.0; corrected the inclusive pole boundary. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import {HALF_PI} from './constants';
import sign from './sign';

export default function (x: number) {
  return Math.abs(x) <= HALF_PI ? x : x - sign(x) * Math.PI;
}
