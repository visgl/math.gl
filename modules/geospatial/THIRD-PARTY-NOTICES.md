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
| Mike Bostock / d3-geo-projection | Adapted [world projection kernels and modification inventory](./src/discontinuous/world-kernels/README.md), elliptic, Guyou, Gringorten, quincuncial, Berghaus, Gingery, interrupted and polyhedral work; ISC, [D3 notice](./src/discontinuous/D3-LICENSE.txt). Reference fixtures use version 4.0.0; no D3 runtime dependency. |
| Mike Bostock / d3-geo 3.1.1 | Adapted spherical circle clipping; ISC, [retained license](./src/discontinuous/spherical-clip/D3-GEO-LICENSE.txt), [modifications and file inventory](./src/discontinuous/spherical-clip/README.md). No runtime D3 dependency. |
| Ricky Reusser / scijs | Adaptive Simpson integration used by the hyperelliptical kernel, via d3-geo-projection; [MIT license](./src/discontinuous/world-kernels/INTEGRATE-LICENSE.txt). |
| d3-geo-polygon contributors | AirOcean topology/rotation; ISC, [AirOcean notice](./src/discontinuous/AIR-OCEAN-LICENSE.txt). |

The separately installed `polygon-clipping` dependency retains its own package
license. EPSG definitions and external datum-grid fixtures have source-specific
terms documented with the CRS schemas and test fixtures; a standards reference
is not a blanket license to redistribute arbitrary grids.

Projection authors receive mathematical credit in the [projection references](https://math.gl/docs/modules/geospatial/projection/developer-guide/discontinuous-projections#references-and-implementation-credits).
AirOcean is radial/gnomonic, not an exact Gray–Fuller implementation. Nico Belmonte's
myriahedral demonstration is credited as inspiration; its application code is not incorporated.

HEALPix is independently implemented from M. R. Calabretta, [Mapping on the HEALPix grid (2004)](https://arxiv.org/abs/astro-ph/0412607). The HEALPix and Gingery numerical fixtures use d3-geo-projection 4.0.0; the package does not depend on D3 at runtime.

## Gray–Fuller, Petroff, and Snyder maps

- **Robert W. Gray / Buckminster Fuller**: `gray-fuller.ts` implements Gray's
  1995 face equations, also published by **Philippe Rivière** in
  [d3-geo-polygon's Gray–Fuller kernel](https://github.com/d3/d3-geo-polygon/blob/main/src/grayfuller.js)
  with a public-domain dedication. math.gl adds its own monotone inverse and
  integrates the existing ISC-licensed AirOcean topology. Reference fixtures use
  d3-geo-polygon **2.0.1**, without adding a runtime dependency.
- **Matthew A. Petroff**: `petroff.ts` adapts the forward/inverse equations in
  `new_projection.py`, [Zenodo record 4661351](https://doi.org/10.5281/zenodo.4661351).
  The archive's code is **CC0-1.0**, as stated in its
  [retained README/license](./src/discontinuous/PETROFF-LICENSE.txt). The record's
  CC-BY metadata also covers images that are not incorporated. Modifications:
  scalar TypeScript, stable Cartesian evaluation, explicit singular limits,
  chart-boundary ownership, and MapEngine integration. Reference fixtures evaluate
  the original Python with NumPy; no Python/JAX runtime dependency.
- **John P. Snyder**, *An Equal-Area Map Projection for Polyhedral Globes* (1992),
  and [BRSR's vector formulation](https://brsr.github.io/2021/08/31/snyder-equal-area.html):
  mathematical sources for the independently implemented spherical triangle
  equations in `snyder.ts`. ISEA reference fixtures use **PROJ 9.8.1** through
  pyproj 3.8.0, without adding a runtime dependency.
- **Felix Palmer / PROJ contributors**: `snyder-mesh.ts` adapts only polyhedron
  coordinate/face tables and parent trees from PROJ revision
  `5fa31c29f0a806568ed7bc76c1a557604db4a804`, under the
  [retained PROJ MIT-style terms](./src/discontinuous/PROJ-LICENSE.txt).
  Source paths: `src/projections/polyhedral/polyhedra/{icosahedron,dodecahedron}.h`
  and `src/projections/polyhedral/nets/{isea/isea,dsea/dsea}.h`.
  The separately licensed A5/DGGAL projection implementation is not incorporated.

`air-ocean` remains gnomonic; the distinct `gray-fuller` preset uses the exact
Gray–Fuller formula. Neither is advertised as equal-area. Petroff, ISEA, and DSEA
are spherical equal-area maps; they do not implement ellipsoidal CRS transforms.
