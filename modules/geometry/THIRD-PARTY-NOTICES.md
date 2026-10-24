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

Hinge evaluation and the myriahedral example were developed independently of
Nico Belmonte's application source. His work is credited as inspiration, not as
licensed source incorporated into this package.
