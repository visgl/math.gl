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
Upstream implementation and comments are retained. PolygonArea and Accumulator
implementations are not included; the typed facade exposes only inverse, direct
and line calculations. No npm dependency is introduced.

Do not replace this robust geodesic solver with a spherical or Vincenty fallback:
the nearly antipodal tests and reduced-length/scale gnomonic checks must pass.
