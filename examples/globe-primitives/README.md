<!-- SPDX-License-Identifier: MIT -->
<!-- SPDX-FileCopyrightText: Copyright (c) vis.gl contributors -->

# Shared globe primitives

From the repository root, run:

```sh
node_modules/.bin/vite examples/globe-primitives
```

The standalone Canvas example consumes the public geospatial and polygon exports.
It demonstrates true ray misses, exact horizon ellipses, elevated-point occlusion,
antimeridian/polar imagery bounds and bounded curved meshes with no Kepler dependency.
Camera controls exercise the same geometry together. The marker is fixed at 90°
longitude: raising its height can make it visible beyond the surface horizon.

This is a numerical integration example, not a replacement renderer for deck.gl.
It uses ECEF axes throughout; a deck consumer must convert camera/object coordinates
from its common space. Bounds cover the full visible cap and may overfetch the
screen. The displayed shader-free illumination is decorative, not photometric.

Build with `node_modules/.bin/vite build examples/globe-primitives`.

Basemap imagery uses NASA Blue Marble via the public GIBS EPSG:4326 WMS service,
configured in `examples/common/blue-marble.js`. No access token is required.
