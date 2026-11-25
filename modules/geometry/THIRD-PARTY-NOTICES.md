# @math.gl/geometry: sources and notices

This index distinguishes adapted or vendored source, separately installed
dependencies, datasets, and scientific references. It supplements the full
[package license](./LICENSE), source headers, and adjacent notices; it does not
replace or relicense them. Versions below identify the audited sources, not the
latest available upstream releases.

| Source / author | Use and retained notice |
| --- | --- |
| CesiumJS contributors | Adapted culling, bounding-volume and attribute-compression code; Apache-2.0 notices and complete terms in [LICENSE](./LICENSE). |
| Mapbox / earcut | Adapted polygon triangulation for flat arrays; ISC notice retained in `src/polygon/earcut.ts` and [LICENSE](./LICENSE). |
| Mapbox / lineclip | Adapted flat-array clipping; ISC notice retained in `src/polygon/lineclip.ts` and [LICENSE](./LICENSE). |
| luma.gl / vis.gl contributors | CPU geometry tessellation lineage, including truncated cones; MIT, [LICENSE](./LICENSE). |

Hinge evaluation and myriahedral geometry were developed independently of
Nico Belmonte's application source. His work is credited as inspiration, not as
licensed source incorporated into this package.

## polygon-clipping

The planar overlay implementation in `src/polygon/vendor/polygon-clipping` is
adapted from [polygon-clipping v0.15.7](https://github.com/mfogel/polygon-clipping/tree/v0.15.7).
The MIT License (MIT)

Copyright (c) 2018 Mike Fogel <mike@fogel.ca> - covers everything not specially attributed to others below.

Copyright (c) 2016 Alexander Milevski <info@w8r.name> - covers all portions originally part of github:w8r/martinez, from which this project was forked on Febuary 2, 2018.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
