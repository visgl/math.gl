// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// Direct TypeScript port of proj4js 2.22.0. Copyright (c) 2014, proj4js authors.
// See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

import fL from './fL';

export default function (eccent: number, ts: number) {
  var phi = fL(1, ts);
  var Iphi = 0;
  var con = 0;
  let iterations = 0;
  do {
    if (++iterations > 50) throw new Error('Isometric latitude inverse did not converge');
    Iphi = phi;
    con = eccent * Math.sin(Iphi);
    phi = fL(Math.exp((eccent * Math.log((1 + con) / (1 - con))) / 2), ts);
  } while (Math.abs(phi - Iphi) > 1.0e-12);
  return phi;
}
