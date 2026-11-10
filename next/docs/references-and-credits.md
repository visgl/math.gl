# Attributions

math.gl combines original vis.gl work, adapted numerical algorithms, vendored libraries, and optional datasets. We thank the authors who made these foundations available. Removing an npm dependency does not remove the provenance of code retained in the repository. Mathematical ideas, compatible APIs, copied source, and redistributed data are credited separately below.

Academic references are maintained in the shared [bibliography](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#bibliography). Citation metadata and source links are generated from `references.bib`; code and data licenses below remain independent of those citations.

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

The [projection provenance inventory](https://github.com/visgl/math.gl/blob/master/modules/geospatial/THIRD-PARTY-NOTICES.md) records individual ports, versions, modifications, reference fixtures and grid sources. Vendored jsep, GeographicLib, Temporal and tz-lookup directories include version and regeneration notes. Separately installed dependencies retain their own licenses; the table is not a transitive dependency bill of materials.

## Geometry and numerical foundations[​](#geometry-and-numerical-foundations "Direct link to Geometry and numerical foundations")

* [gl-matrix](https://github.com/toji/gl-matrix) and [three.js math sources](https://github.com/mrdoob/three.js/tree/dev/src/math) are both implementation foundations and useful algorithm documentation. The shipped package notices identify the retained copyright holders.
* [Stephen Oney's jsep](https://github.com/EricSmekens/jsep) and [Don McCurdy's expression-eval](https://github.com/donmccurdy/expression-eval) supplied expression parsing and evaluation source material; retained source and license details are recorded in the core package notices.
* [CesiumJS core mathematics](https://github.com/CesiumGS/cesium/tree/main/packages/engine/Source/Core) supplied the original culling and geospatial ports. The retained Apache-2.0 notices apply to those adaptations even where their interfaces have changed.
* **Stefan Gottschalk, Ming C. Lin and Dinesh Manocha**, *OBBTree: A Hierarchical Structure for Rapid Interference Detection*: [author-hosted paper](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#gottschalk1996 "OBBTree: a hierarchical structure for rapid interference detection"), cited by the oriented bounding-box construction.
* [Mapbox earcut](https://github.com/mapbox/earcut) and [Mapbox lineclip](https://github.com/mapbox/lineclip) are the upstream triangulation and clipping implementations adapted for flat arrays. earcut also credits [Simon Tatham's linked-list merge sort](https://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html).
* **Steven M. LaValle**, [Planning Algorithms: quaternion interpolation](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#lavalle2006 "Planning Algorithms"), is a free mathematical reference cited in the quaternion kernel.

## Mathematics and geodesy[​](#mathematics-and-geodesy "Direct link to Mathematics and geodesy")

* **Charles F. F. Karney**, [Algorithms for geodesics](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#karney2013 "Algorithms for geodesics"), with [GeographicLib documentation and source](https://geographiclib.sourceforge.io/). math.gl incorporates attributed GeographicLib code and documents numerical qualification separately from the mathematical model.
* **John P. Snyder**, [Map Projections—A Working Manual, USGS PP 1395](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#snyder1987 "Map projections: A working manual"), and **John P. Snyder and Philip M. Voxland**, [An Album of Map Projections, USGS PP 1453](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#snyder1989 "An album of map projections"). These freely available references explain projection properties and conventions.
* [PROJ](https://proj.org/) and [proj4js](https://github.com/proj4js/proj4js) supply documented formulas, directly adapted kernels and independent test references. **Bernie Jenny**, **Bojan Šavrič**, **Tom Patterson**, and the implementation contributors named in the Equal Earth source receive credit for that projection and its implementation.
* [EPSG Geodetic Parameter Dataset](https://epsg.org/) and [OGC standards](https://www.ogc.org/standards/) inform CRS definitions and serialization. Dataset terms and fixture provenance apply independently of math.gl's source-code license; support for a format is not certification.
* [S2 geometry](https://s2geometry.io/), [H3](https://h3geo.org/), [A5](https://a5geo.org/), and [Open Location Code](https://github.com/google/open-location-code) define the cell systems exposed by DGGS adapters.
* **Jarke J. van Wijk and Wim A. A. Nuij**, *Smooth and efficient zooming and panning* (2003): [author-hosted paper](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#vanwijk2003 "Smooth and efficient zooming and panning"). This is the algorithm cited by `flyToViewport`.

## Segmented maps and unfolding[​](#segmented-maps-and-unfolding "Direct link to Segmented maps and unfolding")

See the [projection bibliography and implementation credits](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/developer-guide/discontinuous-projections.md#references-and-implementation-credits) for Peirce, Guyou, Gringorten, Berghaus, Goode, Boggs, Collignon and Waterman, including free sources and the specific D3 code used here. Projection invention, numerical implementation and interactive visualization are distinct contributions.

**[Nico Belmonte](https://github.com/philogb)** inspired the myriahedral examples through his [interactive demonstration](https://philogb.github.io/page/myriahedral/) and [2018 article](https://medium.com/vis-gl/unfolding-the-earth-myriahedral-projections-in-webgl-6b2bcfd00a30). Our [myriahedral background](https://visgl.github.io/math.gl/next/docs/modules/geospatial/maps/myriahedral-maps.md) records the research lineage and implementation differences. The hinge and myriahedral code was developed independently of Nico's application code. Attribution does not imply that an unlicensed application can be copied.

## Astronomy, light and sky[​](#astronomy-light-and-sky "Direct link to Astronomy, light and sky")

These references describe the models used by Earth utilities. Source comments identify which equations or data each implementation uses; simplified display models are not full atmospheric or observatory-grade simulations.

* **[Volodymyr Agafonkin](https://github.com/mourner)**, [SunCalc](https://github.com/mourner/suncalc/tree/v1.9.0), and **Louis Strous**, [solar-position equations](https://www.aa.quae.nl/en/reken/zonpositie.html).
* **Lukas Hošek and Alexander Wilkie**, [Skylight Modelling](https://cgg.mff.cuni.cz/projects/SkylightModelling/): model data distributed with the retained BSD notice.
* **Kevin Krisciunas and Bradley E. Schaefer**, [A model of the brightness of moonlight](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#krisciunas1991 "A model of the brightness of moonlight"), and **Andrew Crumey**, [Human contrast threshold and astronomical visibility](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#crumey2014 "Human contrast threshold and astronomical visibility").
* **Fritz Kasten and Andrew T. Young**, [Revised optical air mass tables and approximation formula](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#kasten1989 "Revised optical air mass tables and approximation formula").
* **Ferdinando Patat and collaborators**, [UBVRI twilight sky brightness at ESO-Paranal](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#patat2006 "UBVRI twilight sky brightness at ESO-Paranal").
* **Francisco J. Ballesteros**, [New insights into black bodies](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#ballesteros2012 "New insights into black bodies"), used for the documented stellar color-temperature approximation.
* **Eric Bruneton and Fabrice Neyret**, [Precomputed Atmospheric Scattering](https://visgl.github.io/math.gl/next/docs/references-and-credits.md#bruneton2008 "Precomputed Atmospheric Scattering"), a reference for the cloud/atmosphere model; see source comments for the approximations actually implemented.
* **Don Cross**, [Astronomy Engine](https://github.com/cosinekitty/astronomy), the planetary ephemeris runtime dependency.
* [JPL planetary physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html) and [USNO sidereal time](https://aa.usno.navy.mil/faq/GAST) supply physical and frame references.

## Datasets, imagery and examples[​](#datasets-imagery-and-examples "Direct link to Datasets, imagery and examples")

Data licenses can differ from the code license. Preserve the dataset-specific credits when redistributing generated assets or derived data.

| Material                            | Provenance and terms                                                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EGM96 geoid grids                   | NGA model, GeographicLib distribution; [source archive, public-domain attribution and checksums](https://github.com/visgl/math.gl/blob/master/modules/earth/data/geoid/README.md).                                                                       |
| Optional timezone boundary geometry | © OpenStreetMap and Timezone Boundary Builder contributors; [ODbL terms, version and simplification](https://github.com/visgl/math.gl/blob/master/modules/earth/data/timezone/README.md). This is separate from the CC0 tz-lookup table.                 |
| Bright-star data                    | [Bretton Wade's YaleBrightStarCatalog conversion](https://github.com/brettonw/YaleBrightStarCatalog); pinned commit and BSD notice accompany the derived data.                                                                                           |
| Earth texture imagery               | [Imagery sources and terms](https://github.com/visgl/math.gl/blob/master/examples/geometry/unfolding-polyhedron/IMAGERY.md); [land-mask provenance](https://github.com/visgl/math.gl/blob/master/examples/geometry/unfolding-polyhedron/data/README.md). |
| Ice Age Explorer                    | [Dataset authors, publications, versions and licenses](https://github.com/visgl/math.gl/blob/master/examples/geospatial/alpine-ice-age/README.md); the displayed reconstruction is distinct from the rendering code.                                     |
| Tectonic Time Machine               | [Model and imagery attribution](https://github.com/visgl/math.gl/blob/master/examples/geospatial/tectonic-time-machine/ATTRIBUTION.md).                                                                                                                  |

## Maintaining provenance[​](#maintaining-provenance "Direct link to Maintaining provenance")

For new adapted code, retain the upstream copyright and full license, record the source version or commit and material modifications, and include the notice in the published package. For datasets, record the upstream product, license, transformations and checksums. Scientific citations should identify the algorithm without claiming that a paper supplied source code. The repository's source-header check complements the package notice indexes; neither is a substitute for investigating the provenance of a new contribution.

<!-- -->

## Bibliography[​](#bibliography "Direct link to Bibliography")

<!-- -->

Download the shared [BibTeX bibliography](https://visgl.github.io/math.gl/next/assets/files/references-1292348881a67f20bb4a97b5beb5bb6b.bib) or [CSL-JSON metadata](https://visgl.github.io/math.gl/next/assets/files/references-3a0560bc52e2a801aa45fafa438420f8.json).

Academic sources cited throughout the documentation.

### Ballesteros (2012)[​](#ballesteros2012 "Direct link to Ballesteros (2012)")

F. J. Ballesteros (2012). **New insights into black bodies**. EPL (Europhysics Letters), 97, (3), 34008. [DOI](https://doi.org/10.1209/0295-5075/97/34008) · [Source](https://arxiv.org/abs/1201.1809)

### Bruneton & Neyret (2008)[​](#bruneton2008 "Direct link to Bruneton & Neyret (2008)")

Eric Bruneton, Fabrice Neyret (2008). **Precomputed Atmospheric Scattering**. Computer Graphics Forum, 27, (4), 1079-1086. [DOI](https://doi.org/10.1111/j.1467-8659.2008.01245.x) · [Source](https://ebruneton.github.io/precomputed_atmospheric_scattering/)

### Calabretta (2004)[​](#calabretta2004 "Direct link to Calabretta (2004)")

M. R. Calabretta (2004). **Mapping on the HEALPix grid**. [Source](https://arxiv.org/abs/astro-ph/0412607)

Original single-author preprint cited for the projection equations.

### Cao et al. (2024)[​](#cao2024 "Direct link to Cao et al. (2024)")

Xianzhi Cao, Alan S. Collins, Sergei Pisarevsky, Nicolas Flament, Sanzhong Li, Derrick Hasterok, R. Dietmar Müller (2024). **Earth’s tectonic and plate boundary evolution over 1.8 billion years**. Geoscience Frontiers, 15, (6), 101922. [DOI](https://doi.org/10.1016/j.gsf.2024.101922)

### Crumey (2014)[​](#crumey2014 "Direct link to Crumey (2014)")

Andrew Crumey (2014). **Human contrast threshold and astronomical visibility**. Monthly Notices of the Royal Astronomical Society, 442, (3), 2600-2619. [DOI](https://doi.org/10.1093/mnras/stu992) · [Source](https://arxiv.org/abs/1405.4209)

### Goode (1925)[​](#goode1925 "Direct link to Goode (1925)")

J. Paul Goode (1925). **THE HOMOLOSINE PROJECTION: A NEW DEVICE FOR PORTRAYING THE EARTH’S SURFACE ENTIRE**. Annals of the Association of American Geographers, 15, (3), 119-125. [DOI](https://doi.org/10.1080/00045602509356949)

### Gottschalk et al. (1996)[​](#gottschalk1996 "Direct link to Gottschalk et al. (1996)")

S. Gottschalk, M. C. Lin, D. Manocha (1996). **OBBTree: a hierarchical structure for rapid interference detection**. Proceedings of the 23rd annual conference on Computer graphics and interactive techniques, 171-180. [DOI](https://doi.org/10.1145/237170.237244) · [Source](http://gamma.cs.unc.edu/users/gottschalk/main.pdf)

### Gowan et al. (2021)[​](#gowan2021 "Direct link to Gowan et al. (2021)")

Evan J. Gowan, Xu Zhang, Sara Khosravi, Alessio Rovere, Paolo Stocchi, Anna L. C. Hughes, Richard Gyllencreutz, Jan Mangerud, John-Inge Svendsen, Gerrit Lohmann (2021). **A new global ice sheet reconstruction for the past 80 000 years**. Nature Communications, 12, (1). [DOI](https://doi.org/10.1038/s41467-021-21469-w)

### Hosek & Wilkie (2012)[​](#hosek2012 "Direct link to Hosek & Wilkie (2012)")

Lukas Hosek, Alexander Wilkie (2012). **An analytic model for full spectral sky-dome radiance**. ACM Transactions on Graphics, 31, (4), 1-9. [DOI](https://doi.org/10.1145/2185520.2185591) · [Source](https://cgg.mff.cuni.cz/projects/SkylightModelling/)

### Johnston et al. (1995)[​](#johnston1995 "Direct link to Johnston et al. (1995)")

Kathryn V. Johnston, David N. Spergel, Lars Hernquist (1995). **The Disruption of the Sagittarius Dwarf Galaxy**. [Source](https://arxiv.org/abs/astro-ph/9502005v1)

Cites the original arXiv draft whose potential parameters are used by the illustrative stellar-motion model.

### Karney (2013)[​](#karney2013 "Direct link to Karney (2013)")

Charles F. F. Karney (2013). **Algorithms for geodesics**. Journal of Geodesy, 87, (1), 43-55. [DOI](https://doi.org/10.1007/s00190-012-0578-z) · [Source](https://arxiv.org/abs/1109.4448)

### Karney (2024)[​](#karney2024 "Direct link to Karney (2024)")

Charles F. F. Karney (2024). **Geodesic Intersections**. Journal of Surveying Engineering, 150, (3). [DOI](https://doi.org/10.1061/jsued2.sueng-1483) · [Source](https://arxiv.org/abs/2308.00495)

### Kasten & Young (1989)[​](#kasten1989 "Direct link to Kasten & Young (1989)")

Fritz Kasten, Andrew T. Young (1989). **Revised optical air mass tables and approximation formula**. Applied Optics, 28, (22), 4735. [DOI](https://doi.org/10.1364/ao.28.004735)

### Krisciunas & Schaefer (1991)[​](#krisciunas1991 "Direct link to Krisciunas & Schaefer (1991)")

Kevin Krisciunas, Bradley E. Schaefer (1991). **A model of the brightness of moonlight**. Publications of the Astronomical Society of the Pacific, 103, 1033. [DOI](https://doi.org/10.1086/132921)

### Kunimune (2019)[​](#kunimune2019 "Direct link to Kunimune (2019)")

Justin Kunimune (2019). **Minimum-error world map projections defined by polydimensional meshes**. [Source](https://kunimune.blog/wp-content/uploads/2019/11/danseiji-paper-preprint.pdf)

Author-hosted preprint compiled November 8, 2019.

### LaValle (2006)[​](#lavalle2006 "Direct link to LaValle (2006)")

Steven M. LaValle (2006). **Planning Algorithms**. Cambridge University Press. [Source](https://planning.cs.uiuc.edu/node198.html)

Section on quaternion interpolation.

### Liu et al. (2011)[​](#liu2011 "Direct link to Liu et al. (2011)")

J.-C. Liu, Z. Zhu, H. Zhang (2011). **Reconsidering the Galactic coordinate system**. Astronomy & Astrophysics, 526, A16. [DOI](https://doi.org/10.1051/0004-6361/201014961)

### Merdith et al. (2021)[​](#merdith2021 "Direct link to Merdith et al. (2021)")

Andrew S. Merdith, Simon E. Williams, Alan S. Collins, Michael G. Tetley, Jacob A. Mulder, Morgan L. Blades, Alexander Young, Sheree E. Armistead, John Cannon, Sabin Zahirovic, R. Dietmar Müller (2021). **Extending full-plate tectonic models into deep time: Linking the Neoproterozoic and the Phanerozoic**. Earth-Science Reviews, 214, 103477. [DOI](https://doi.org/10.1016/j.earscirev.2020.103477)

### Müller et al. (2022)[​](#muller2022 "Direct link to Müller et al. (2022)")

R. Dietmar Müller, Nicolas Flament, John Cannon, Michael G. Tetley, Simon E. Williams, Xianzhi Cao, Ömer F. Bodur, Sabin Zahirovic, Andrew Merdith (2022). **A tectonic-rules-based mantle reference frame since 1 billion years ago – implications for supercontinent cycles and plate–mantle system evolution**. Solid Earth, 13, (7), 1127-1159. [DOI](https://doi.org/10.5194/se-13-1127-2022)

### Patat et al. (2006)[​](#patat2006 "Direct link to Patat et al. (2006)")

F. Patat, O. S. Ugolnikov, O. V. Postylyakov (2006). **UBVRI twilight sky brightness at ESO-Paranal**. Astronomy & Astrophysics, 455, (1), 385-393. [DOI](https://doi.org/10.1051/0004-6361:20064992) · [Source](https://arxiv.org/abs/astro-ph/0604128)

### Peirce (1879)[​](#peirce1879 "Direct link to Peirce (1879)")

Charles Sanders Peirce (1879). **A Quincuncial Projection of the Sphere**. [Source](https://www.unav.es/gep/Quincuncial1879.pdf)

### Petroff (2021)[​](#petroff2021 "Direct link to Petroff (2021)")

Matthew A. Petroff (2021). **A Square Equal-Area Map Projection with Low Angular Distortion, Minimal Cusps, and Closed-Form Solutions**. ACM Transactions on Spatial Algorithms and Systems, 7, (4), 1-16. [DOI](https://doi.org/10.1145/3460521) · [Source](https://arxiv.org/abs/2008.13670)

### Preetham et al. (1999)[​](#preetham1999 "Direct link to Preetham et al. (1999)")

A. J. Preetham, Peter Shirley, Brian Smits (1999). **A practical analytic model for daylight**. Proceedings of the 26th annual conference on Computer graphics and interactive techniques - SIGGRAPH ’99, 91-100. [DOI](https://doi.org/10.1145/311535.311545)

### Schönrich et al. (2010)[​](#schoenrich2010 "Direct link to Schönrich et al. (2010)")

Ralph Schönrich, James Binney, Walter Dehnen (2010). **Local kinematics and the local standard of rest**. Monthly Notices of the Royal Astronomical Society, 403, (4), 1829-1833. [DOI](https://doi.org/10.1111/j.1365-2966.2010.16253.x)

### Seguinot et al. (2018)[​](#seguinot2018 "Direct link to Seguinot et al. (2018)")

Julien Seguinot, Susan Ivy-Ochs, Guillaume Jouvet, Matthias Huss, Martin Funk, Frank Preusser (2018). **Modelling last glacial cycle ice dynamics in the Alps**. The Cryosphere, 12, (10), 3265-3285. [DOI](https://doi.org/10.5194/tc-12-3265-2018)

### Snyder (1987)[​](#snyder1987 "Direct link to Snyder (1987)")

John P. Snyder (1987). **Map projections: A working manual**. Professional Paper. [DOI](https://doi.org/10.3133/pp1395) · [Source](https://pubs.usgs.gov/pp/1395/report.pdf)

### Snyder & Voxland (1989)[​](#snyder1989 "Direct link to Snyder & Voxland (1989)")

John P. Snyder, Philip M. Voxland (1989). **An album of map projections**. Professional Paper. [DOI](https://doi.org/10.3133/pp1453) · [Source](https://pubs.usgs.gov/pp/1453/report.pdf)

### Snyder (1992)[​](#snyder1992 "Direct link to Snyder (1992)")

John P. Snyder (1992). **An Equal-Area Map Projection For Polyhedral Globes**. Cartographica, 29, (1), 10-21. [DOI](https://doi.org/10.3138/27h7-8k88-4882-1752)

### Tousey & Koomen (1953)[​](#tousey1953 "Direct link to Tousey & Koomen (1953)")

R. Tousey, M. J. Koomen (1953). **The Visibility of Stars and Planets During Twilight**. Journal of the Optical Society of America, 43, (3), 177. [DOI](https://doi.org/10.1364/josa.43.000177)

### van Wijk & Nuij (2003)[​](#vanwijk2003 "Direct link to van Wijk & Nuij (2003)")

Jarke J. van Wijk, Wim A. A. Nuij (2003). **Smooth and efficient zooming and panning**. IEEE Symposium on Information Visualization. [Source](https://www.win.tue.nl/~vanwijk/zoompan.pdf)

### van Wijk (2008)[​](#vanwijk2008 "Direct link to van Wijk (2008)")

Jarke J. van Wijk (2008). **Unfolding the Earth: Myriahedral Projections**. The Cartographic Journal, 45, (1), 32-42. [DOI](https://doi.org/10.1179/000870408x276594)

### Veevers (2004)[​](#veevers2004 "Direct link to Veevers (2004)")

J.J. Veevers (2004). **Gondwanaland from 650–500 Ma assembly through 320 Ma merger in Pangea to 185–100 Ma breakup: supercontinental tectonics via stratigraphy and radiometric dating**. Earth-Science Reviews, 68, (1-2), 1-132. [DOI](https://doi.org/10.1016/j.earscirev.2004.05.002)

<!-- -->

## References

1. S. Gottschalk, M. C. Lin, D. Manocha (1996). OBBTree: a hierarchical structure for rapid interference detection. Proceedings of the 23rd annual conference on Computer graphics and interactive techniques, 171-180. [doi:10.1145/237170.237244](https://doi.org/10.1145/237170.237244) [Source](http://gamma.cs.unc.edu/users/gottschalk/main.pdf)
2. Steven M. LaValle (2006). Planning Algorithms. Cambridge University Press.
   <!-- -->
   [Source](https://planning.cs.uiuc.edu/node198.html)
3. Charles F. F. Karney (2013). Algorithms for geodesics. Journal of Geodesy, 87, (1), 43-55. [doi:10.1007/s00190-012-0578-z](https://doi.org/10.1007/s00190-012-0578-z) [Source](https://arxiv.org/abs/1109.4448)
4. John P. Snyder (1987). Map projections: A working manual. Professional Paper. [doi:10.3133/pp1395](https://doi.org/10.3133/pp1395) [Source](https://pubs.usgs.gov/pp/1395/report.pdf)
5. John P. Snyder, Philip M. Voxland (1989). An album of map projections. Professional Paper. [doi:10.3133/pp1453](https://doi.org/10.3133/pp1453) [Source](https://pubs.usgs.gov/pp/1453/report.pdf)
6. Jarke J. van Wijk, Wim A. A. Nuij (2003). Smooth and efficient zooming and panning. IEEE Symposium on Information Visualization.
   <!-- -->
   [Source](https://www.win.tue.nl/~vanwijk/zoompan.pdf)
7. Kevin Krisciunas, Bradley E. Schaefer (1991). A model of the brightness of moonlight. Publications of the Astronomical Society of the Pacific, 103, 1033. [doi:10.1086/132921](https://doi.org/10.1086/132921)
8. Andrew Crumey (2014). Human contrast threshold and astronomical visibility. Monthly Notices of the Royal Astronomical Society, 442, (3), 2600-2619. [doi:10.1093/mnras/stu992](https://doi.org/10.1093/mnras/stu992) [Source](https://arxiv.org/abs/1405.4209)
9. Fritz Kasten, Andrew T. Young (1989). Revised optical air mass tables and approximation formula. Applied Optics, 28, (22), 4735. [doi:10.1364/ao.28.004735](https://doi.org/10.1364/ao.28.004735)
10. F. Patat, O. S. Ugolnikov, O. V. Postylyakov (2006). UBVRI twilight sky brightness at ESO-Paranal. Astronomy & Astrophysics, 455, (1), 385-393. [doi:10.1051/0004-6361:20064992](https://doi.org/10.1051/0004-6361:20064992) [Source](https://arxiv.org/abs/astro-ph/0604128)
11. F. J. Ballesteros (2012). New insights into black bodies. EPL (Europhysics Letters), 97, (3), 34008. [doi:10.1209/0295-5075/97/34008](https://doi.org/10.1209/0295-5075/97/34008) [Source](https://arxiv.org/abs/1201.1809)
12. Eric Bruneton, Fabrice Neyret (2008). Precomputed Atmospheric Scattering. Computer Graphics Forum, 27, (4), 1079-1086. [doi:10.1111/j.1467-8659.2008.01245.x](https://doi.org/10.1111/j.1467-8659.2008.01245.x) [Source](https://ebruneton.github.io/precomputed_atmospheric_scattering/)
