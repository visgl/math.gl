# Geography and AirOcean sources

## Land polygons (public domain)

`land.json` contains Polygon coordinate arrays from Natural Earth 1:110m land,
version 5.1.2. Feature properties were removed and JSON compacted; all coordinate
rings, including holes, are retained without simplification or rounding.

- Source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_land.geojson
- Original file SHA-256: `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9`
- Terms: https://www.naturalearthdata.com/about/terms-of-use/
- Retrieved October 21, 2026. Made with Natural Earth.

Natural Earth explicitly places its vector and raster data in the public domain,
including modification and redistribution. The bundled data is not MIT-licensed
software. `geography.ts` independently implements point-in-polygon and sampled
minor-great-circle integration. It is an approximate layout heuristic, not a
precise geographic clipping algorithm.

## AirOcean topology (ISC)

`../dymaxion.ts` adapts the face indices, split-face arrangement, parent tree and
geographic rotation from d3-geo-polygon's `src/airocean.js`:

https://github.com/d3/d3-geo-polygon/blob/93f12a456e169d9b1b40fcaa42cbeeeee1251d36/src/airocean.js

Upstream credits Jason Davies (2013), Enrico Spinielli (2017) and Philippe Rivière
(2017, 2018). Copyright 2017–2024 Mike Bostock. The complete upstream license is
retained in [D3-LICENSE.txt](D3-LICENSE.txt). No D3 runtime dependency is required.

This is the AirOcean **cut arrangement**. It uses planar midpoint/centroid splits,
rigid hinge rotations and radial texture lookup, not D3's Gray-Fuller projection.
No application code, shaders, presets or assets from Nico Belmonte's demo are used.
