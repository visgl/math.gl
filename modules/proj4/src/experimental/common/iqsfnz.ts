// math.gl
// SPDX-License-Identifier: MIT
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import {HALF_PI} from './constants';

export default function (eccent: number, q: number) {
  var temp = 1 - ((1 - eccent * eccent) / (2 * eccent)) * Math.log((1 - eccent) / (1 + eccent));
  if (Math.abs(Math.abs(q) - temp) < 1.0e-6) {
    if (q < 0) {
      return -1 * HALF_PI;
    } else {
      return HALF_PI;
    }
  }
  // var phi = 0.5* q/(1-eccent*eccent);
  var phi = Math.asin(0.5 * q);
  var dphi;
  var sin_phi;
  var cos_phi;
  var con;
  for (var i = 0; i < 30; i++) {
    sin_phi = Math.sin(phi);
    cos_phi = Math.cos(phi);
    con = eccent * sin_phi;
    dphi =
      (Math.pow(1 - con * con, 2) / (2 * cos_phi)) *
      (q / (1 - eccent * eccent) -
        sin_phi / (1 - con * con) +
        (0.5 / eccent) * Math.log((1 - con) / (1 + con)));
    phi += dphi;
    if (Math.abs(dphi) <= 0.0000000001) {
      return phi;
    }
  }

  // console.log("IQSFN-CONV:Latitude failed to converge after 30 iterations");
  return NaN;
}
