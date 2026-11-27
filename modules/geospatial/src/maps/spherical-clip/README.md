# Spherical cap clipping

Adapted from [d3-geo 3.1.1](https://github.com/d3/d3-geo/tree/v3.1.1/src),
Copyright 2010–2024 Mike Bostock, under the retained [ISC license](./D3-GEO-LICENSE.txt).
Flattened filenames preserve the source path (`clip/circle.js` → `clip-circle.js`).

Changes: only circle clipping and its dependencies retained; unused display circle
factory removed; precision and interpolation callbacks added; epsilon tightened to
1e-12 for chart-local geometry; latitude recovered with atan2 rather than asin
near polar limits. `helpers.js` independently supplies array flattening
and Neumaier compensated summation, replacing the d3-array dependency. math.gl's
`cap-map.ts` adds bounded adaptive projected-curve sampling, source-coordinate
retention, chart trimming, hole grouping and regional coverage outlines.

The numeric projection kernels and their separate provenance are in
[world-kernels](../world-kernels/README.md). No D3 package is needed at runtime.
