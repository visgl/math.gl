// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import pj_mlfn from './pj_mlfn';
import {EPSLN} from './constants';

var MAX_ITER = 20;

export default function (arg: number, es: number, en: readonly number[]) {
  var k = 1 / (1 - es);
  var phi = arg;
  for (var i = MAX_ITER; i; --i) {
    /* rarely goes over 2 iterations */
    var s = Math.sin(phi);
    var t = 1 - es * s * s;
    // t = this.pj_mlfn(phi, s, Math.cos(phi), en) - arg;
    // phi -= t * (t * Math.sqrt(t)) * k;
    t = (pj_mlfn(phi, s, Math.cos(phi), en) - arg) * (t * Math.sqrt(t)) * k;
    phi -= t;
    if (Math.abs(t) < EPSLN) {
      return phi;
    }
  }
  // ..reportError("cass:pj_inv_mlfn: Convergence error");
  return phi;
}
