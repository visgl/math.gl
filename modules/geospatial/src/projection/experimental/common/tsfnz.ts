// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) PROJ contributors
// SPDX-FileComment: Adapted from proj4js 2.22.0; stable half-angle evaluation adapted from PROJ 9.5.1 src/tsfn.cpp (MIT). See ../../../../projection/PROJ-LICENSE.txt. See ../../../PROJ4-LICENSE.md for the upstream license and attribution.

export default function (eccent: number, phi: number, sinphi: number) {
  // PROJ's sign-dependent half-angle identities avoid cancellation near poles.
  const cosphi = Math.cos(phi);
  return (
    Math.exp(eccent * Math.atanh(eccent * sinphi)) *
    (sinphi > 0 ? cosphi / (1 + sinphi) : (1 - sinphi) / cosphi)
  );
}
