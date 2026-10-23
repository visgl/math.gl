<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
-->

# GeographicLib geodesic source

Upstream: https://github.com/geographiclib/geographiclib-js
Version: 2.2.0
Commit: 9c4036d6242aa997e08e43a20df789e2007fbe6f
License: MIT, Charles Karney; see ../../../GEOGRAPHICLIB-LICENSE.txt.

`runtime.js` combines `geodesic/Math.js.in`, `geodesic/Geodesic.js` and
`geodesic/GeodesicLine.js`, in that order. Version placeholders in Math.js.in
are filled with 2, 2, 0; an ESM `export {geodesic}` and SPDX header are added.
Upstream implementation and comments are retained. The Math.js input already includes Accumulator. The typed facade exposes inverse, direct, arc and line calculations with optional longitude unrolling and edge area. Prolate geodesics are supported. The separate typed GeodesicPolygon uses the existing accumulator and adapts the MIT GeographicLib 2.7 polygon transit/reduction rules; PolygonArea.js is not vendored.

Original math.gl short-edge area follow-up replaces cancellation in the C4 cosine-series subtraction with the trigonometric difference identity, for arcs below 0.01 radians. Native series/Exact disagreements at tiny areas are retained as diagnostics and independently gated by 80-digit small-triangle integrals. See the ellipsoid accuracy audit for qualified domains. No npm dependency is introduced.

Do not replace this robust geodesic solver with a spherical or Vincenty fallback:
the nearly antipodal tests and reduced-length/scale gnomonic checks must pass.
