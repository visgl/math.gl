# References and credits

math.gl combines original vis.gl work, adapted numerical algorithms, vendored libraries, and optional datasets. We thank the authors who made these foundations available. Removing an npm dependency does not remove the provenance of code retained in the repository. Mathematical ideas, compatible APIs, copied source, and redistributed data are credited separately below.

## Acknowledgments[​](#acknowledgments "Direct link to Acknowledgments")

We thank **[Michael Sumner](https://github.com/mdsumner)** for advice on projection correctness and completeness, and recognize **[Kyle Barron](https://github.com/kylebarron)** for his work on **deck.gl-raster**.

These acknowledgments recognize advice and related work; they do not imply code ownership or a dependency relationship.

## Package source inventory[​](#package-source-inventory "Direct link to Package source inventory")

Each published package includes `LICENSE`, `THIRD-PARTY-NOTICES.md`, and the applicable adjacent notices. The indexes link the full terms and describe what was adapted. Source headers identify upstream copyright holders and licenses.

| Package                                                                                                  | Sources and contributions                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [core](https://github.com/visgl/math.gl/blob/master/modules/core/THIRD-PARTY-NOTICES.md)                 | Brandon Jones and Colin MacKenzie IV's gl-matrix kernels; three.js math methods; proj4js spheroid arithmetic; Stephen Oney's jsep and [Don McCurdy](https://github.com/donmccurdy)'s expression-eval; Apache Arrow's BigInt fallback structure.            |
| [geometry](https://github.com/visgl/math.gl/blob/master/modules/geometry/THIRD-PARTY-NOTICES.md)         | CesiumJS culling and bounding volumes; Mapbox earcut and lineclip; luma.gl CPU tessellation lineage.                                                                                                                                                       |
| [geospatial](https://github.com/visgl/math.gl/blob/master/modules/geospatial/THIRD-PARTY-NOTICES.md)     | CesiumJS geometry; proj4js and PROJ projection work; Charles Karney's GeographicLib; Mike Bostock and D3 contributors' segmented projections.                                                                                                              |
| [earth](https://github.com/visgl/math.gl/blob/master/modules/earth/THIRD-PARTY-NOTICES.md)               | GeographicLib geoid interpolation; [Volodymyr Agafonkin](https://github.com/mourner)'s SunCalc; Hošek–Wilkie model data; Bretton Wade's star catalogue conversion; Temporal/JSBI; PhotoStructure's tz-lookup; optional NGA and timezone boundary datasets. |
| [dggs](https://github.com/visgl/math.gl/blob/master/modules/dggs/THIRD-PARTY-NOTICES.md)                 | Jon Atkins and AJ ONeal's s2-geometry; CesiumJS token code; separately installed A5, H3 and Open Location Code libraries.                                                                                                                                  |
| [web-mercator](https://github.com/visgl/math.gl/blob/master/modules/web-mercator/THIRD-PARTY-NOTICES.md) | Perspective viewport utilities; van Wijk and Nuij's zoom/pan algorithm; Mapbox/react-map-gl compatibility references.                                                                                                                                      |

The [projection provenance inventory](https://github.com/visgl/math.gl/blob/master/modules/geospatial/projection/THIRD-PARTY-NOTICES.md) records individual ports, versions, modifications, reference fixtures and grid sources. Vendored jsep, GeographicLib, Temporal and tz-lookup directories include version and regeneration notes. Separately installed dependencies retain their own licenses; the table is not a transitive dependency bill of materials.

## Geometry and numerical foundations[​](#geometry-and-numerical-foundations "Direct link to Geometry and numerical foundations")

* [gl-matrix](https://github.com/toji/gl-matrix) and [three.js math sources](https://github.com/mrdoob/three.js/tree/dev/src/math) are both implementation foundations and useful algorithm documentation. The shipped package notices identify the retained copyright holders.
* [Stephen Oney's jsep](https://github.com/EricSmekens/jsep) and [Don McCurdy's expression-eval](https://github.com/donmccurdy/expression-eval) supplied expression parsing and evaluation source material; retained source and license details are recorded in the core package notices.
* [CesiumJS core mathematics](https://github.com/CesiumGS/cesium/tree/main/packages/engine/Source/Core) supplied the original culling and geospatial ports. The retained Apache-2.0 notices apply to those adaptations even where their interfaces have changed.
* **Stefan Gottschalk, Ming C. Lin and Dinesh Manocha**, *OBBTree: A Hierarchical Structure for Rapid Interference Detection*: [author-hosted paper](http://gamma.cs.unc.edu/users/gottschalk/main.pdf), cited by the oriented bounding-box construction.
* [Mapbox earcut](https://github.com/mapbox/earcut) and [Mapbox lineclip](https://github.com/mapbox/lineclip) are the upstream triangulation and clipping implementations adapted for flat arrays. earcut also credits [Simon Tatham's linked-list merge sort](https://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html).
* **Steven M. LaValle**, [Planning Algorithms: quaternion interpolation](https://planning.cs.uiuc.edu/node198.html), is a free mathematical reference cited in the quaternion kernel.

## Mathematics and geodesy[​](#mathematics-and-geodesy "Direct link to Mathematics and geodesy")

* **Charles F. F. Karney**, [Algorithms for geodesics](https://arxiv.org/abs/1109.4448), with [GeographicLib documentation and source](https://geographiclib.sourceforge.io/). math.gl incorporates attributed GeographicLib code and documents numerical qualification separately from the mathematical model.
* **John P. Snyder**, [Map Projections—A Working Manual, USGS PP 1395](https://pubs.usgs.gov/pp/1395/report.pdf), and **John P. Snyder and Philip M. Voxland**, [An Album of Map Projections, USGS PP 1453](https://pubs.usgs.gov/pp/1453/report.pdf). These freely available references explain projection properties and conventions.
* [PROJ](https://proj.org/) and [proj4js](https://github.com/proj4js/proj4js) supply documented formulas, directly adapted kernels and independent test references. **Bernie Jenny**, **Bojan Šavrič**, **Tom Patterson**, and the implementation contributors named in the Equal Earth source receive credit for that projection and its implementation.
* [EPSG Geodetic Parameter Dataset](https://epsg.org/) and [OGC standards](https://www.ogc.org/standards/) inform CRS definitions and serialization. Dataset terms and fixture provenance apply independently of math.gl's source-code license; support for a format is not certification.
* [S2 geometry](https://s2geometry.io/), [H3](https://h3geo.org/), [A5](https://a5geo.org/), and [Open Location Code](https://github.com/google/open-location-code) define the cell systems exposed by DGGS adapters.
* **Jarke J. van Wijk and Wim A. A. Nuij**, *Smooth and efficient zooming and panning* (2003): [author-hosted paper](https://www.win.tue.nl/~vanwijk/zoompan.pdf). This is the algorithm cited by `flyToViewport`.

## Segmented maps and unfolding[​](#segmented-maps-and-unfolding "Direct link to Segmented maps and unfolding")

See the [projection bibliography and implementation credits](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/developer-guide/discontinuous-projections.md#references-and-implementation-credits) for Peirce, Guyou, Gringorten, Berghaus, Goode, Boggs, Collignon and Waterman, including free sources and the specific D3 code used here. Projection invention, numerical implementation and interactive visualization are distinct contributions.

**[Nico Belmonte](https://github.com/philogb)** inspired the myriahedral examples through his [interactive demonstration](https://philogb.github.io/page/myriahedral/) and [2018 article](https://medium.com/vis-gl/unfolding-the-earth-myriahedral-projections-in-webgl-6b2bcfd00a30). Our [myriahedral background](https://visgl.github.io/math.gl/next/docs/modules/geospatial/myriahedral-maps.md) records the research lineage and implementation differences. The hinge and myriahedral code was developed independently of Nico's application code. Attribution does not imply that an unlicensed application can be copied.

## Astronomy, light and sky[​](#astronomy-light-and-sky "Direct link to Astronomy, light and sky")

These references describe the models used by Earth utilities. Source comments identify which equations or data each implementation uses; simplified display models are not full atmospheric or observatory-grade simulations.

* **[Volodymyr Agafonkin](https://github.com/mourner)**, [SunCalc](https://github.com/mourner/suncalc/tree/v1.9.0), and **Louis Strous**, [solar-position equations](https://www.aa.quae.nl/en/reken/zonpositie.html).
* **Lukas Hošek and Alexander Wilkie**, [Skylight Modelling](https://cgg.mff.cuni.cz/projects/SkylightModelling/): model data distributed with the retained BSD notice.
* **Kevin Krisciunas and Bradley E. Schaefer**, [A model of the brightness of moonlight](https://doi.org/10.1086/132921), and **Andrew Crumey**, [Human contrast threshold and astronomical visibility](https://arxiv.org/abs/1405.4209).
* **Fritz Kasten and Andrew T. Young**, [Revised optical air mass tables and approximation formula](https://doi.org/10.1364/AO.28.004735).
* **Ferdinando Patat and collaborators**, [UBVRI twilight sky brightness at ESO-Paranal](https://arxiv.org/abs/astro-ph/0604128).
* **Francisco J. Ballesteros**, [New insights into black bodies](https://arxiv.org/abs/1201.1809), used for the documented stellar color-temperature approximation.
* **Eric Bruneton and Fabrice Neyret**, [Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/), a reference for the cloud/atmosphere model; see source comments for the approximations actually implemented.
* **Don Cross**, [Astronomy Engine](https://github.com/cosinekitty/astronomy), the planetary ephemeris runtime dependency.
* [JPL planetary physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html) and [USNO sidereal time](https://aa.usno.navy.mil/faq/GAST) supply physical and frame references.

## Datasets, imagery and examples[​](#datasets-imagery-and-examples "Direct link to Datasets, imagery and examples")

Data licenses can differ from the code license. Preserve the dataset-specific credits when redistributing generated assets or derived data.

| Material                            | Provenance and terms                                                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EGM96 geoid grids                   | NGA model, GeographicLib distribution; [source archive, public-domain attribution and checksums](https://github.com/visgl/math.gl/blob/master/modules/earth/geoid/data/README.md).                                                                       |
| Optional timezone boundary geometry | © OpenStreetMap and Timezone Boundary Builder contributors; [ODbL terms, version and simplification](https://github.com/visgl/math.gl/blob/master/modules/earth/timezone/data/README.md). This is separate from the CC0 tz-lookup table.                 |
| Bright-star data                    | [Bretton Wade's YaleBrightStarCatalog conversion](https://github.com/brettonw/YaleBrightStarCatalog); pinned commit and BSD notice accompany the derived data.                                                                                           |
| Earth texture imagery               | [Imagery sources and terms](https://github.com/visgl/math.gl/blob/master/examples/geometry/unfolding-polyhedron/IMAGERY.md); [land-mask provenance](https://github.com/visgl/math.gl/blob/master/examples/geometry/unfolding-polyhedron/data/README.md). |
| Ice Age Explorer                    | [Dataset authors, publications, versions and licenses](https://github.com/visgl/math.gl/blob/master/examples/geospatial/alpine-ice-age/README.md); the displayed reconstruction is distinct from the rendering code.                                     |
| Tectonic Time Machine               | [Model and imagery attribution](https://github.com/visgl/math.gl/blob/master/examples/geospatial/tectonic-time-machine/ATTRIBUTION.md).                                                                                                                  |

## Maintaining provenance[​](#maintaining-provenance "Direct link to Maintaining provenance")

For new adapted code, retain the upstream copyright and full license, record the source version or commit and material modifications, and include the notice in the published package. For datasets, record the upstream product, license, transformations and checksums. Scientific citations should identify the algorithm without claiming that a paper supplied source code. The repository's source-header check complements the package notice indexes; neither is a substitute for investigating the provenance of a new contribution.
