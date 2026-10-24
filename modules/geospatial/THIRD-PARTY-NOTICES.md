# @math.gl/geospatial: sources and notices

This index distinguishes adapted or vendored source, separately installed
dependencies, datasets, and scientific references. It supplements the full
[package license](./LICENSE), source headers, and adjacent notices; it does not
replace or relicense them. Versions below identify the audited sources, not the
latest available upstream releases.

| Source / author | Use and retained notice |
| --- | --- |
| CesiumJS contributors | Adapted ellipsoid and related geometry utilities; Apache-2.0, [LICENSE](./LICENSE). |
| proj4js 2.22.0 / PROJ | Adapted projection kernels, helpers and datum transformations; [detailed file-level provenance](./projection/THIRD-PARTY-NOTICES.md), [proj4js terms](./projection/PROJ4-LICENSE.md), [PROJ terms](./projection/PROJ-LICENSE.txt). |
| Bernie Jenny and Equal Earth collaborators | Equal Earth kernel ported through proj4js; Apache-2.0, [full license](./projection/APACHE-2.0-LICENSE.txt). Source retains the original collaborator credits. |
| Charles Karney / GeographicLib | Vendored geodesic solver and adapted rhumb, intersection and polygon algorithms; MIT, [notice](./GEOGRAPHICLIB-LICENSE.txt), [vendored version and modifications](./src/vendor/geographiclib-geodesic/README.md). |
| Mike Bostock / d3-geo-projection | Adapted elliptic, Guyou, Gringorten, quincuncial, Berghaus, Gingery, interrupted and polyhedral work; ISC, [D3 notice](./src/discontinuous/D3-LICENSE.txt). Reference fixtures use version 4.0.0; no D3 runtime dependency. |
| d3-geo-polygon contributors | AirOcean topology/rotation; ISC, [AirOcean notice](./src/discontinuous/AIR-OCEAN-LICENSE.txt). |

The separately installed `polygon-clipping` dependency retains its own package
license. EPSG definitions and external datum-grid fixtures have source-specific
terms documented with the CRS schemas and test fixtures; a standards reference
is not a blanket license to redistribute arbitrary grids.

Projection authors receive mathematical credit in the [projection references](https://math.gl/docs/modules/geospatial/projection/developer-guide/discontinuous-projections#references-and-implementation-credits).
AirOcean is radial/gnomonic, not an exact Gray–Fuller implementation. Nico Belmonte's
myriahedral demonstration is credited as inspiration; its application code is not incorporated.

HEALPix is independently implemented from M. R. Calabretta, [Mapping on the HEALPix grid (2004)](https://arxiv.org/abs/astro-ph/0412607). The HEALPix and Gingery numerical fixtures use d3-geo-projection 4.0.0; the package does not depend on D3 at runtime.
