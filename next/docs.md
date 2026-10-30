[![MIT license](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/visgl/math.gl/blob/master/LICENSE)[![Monthly npm downloads for @math.gl/core](https://img.shields.io/npm/dm/@math.gl/core?style=flat-square)](https://www.npmjs.com/package/@math.gl/core)[![npm version](https://img.shields.io/npm/v/@math.gl/core?style=flat-square)](https://www.npmjs.com/package/@math.gl/core)[![GitHub stars](https://img.shields.io/github/stars/visgl/math.gl?style=flat-square)](https://github.com/visgl/math.gl)[![Built with TypeScript 6.0.3](https://img.shields.io/badge/6.0.3-3178c6?style=flat-square\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/ "Built with TypeScript 6.0.3")[![coverage](https://img.shields.io/coveralls/visgl/math.gl.svg?style=flat-square\&label=coverage)](https://coveralls.io/github/visgl/math.gl?branch=master)

# Introduction

Welcome to math.gl!

math.gl is a modular TypeScript toolbox for **geospatial** and **3D** math. Start with vectors and matrices in core, then add modules for coordinate conversion, geometry, global grids, and other application needs.

math.gl computes on the CPU and has no GPU dependencies. Its arrays and coordinate utilities can supply WebGL, WebGPU, or other rendering systems.

[![OpenJS Foundation](https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color.svg)![OpenJS Foundation](https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color-dark_background.svg)](https://openvisualization.org)

math.gl is part of [Open Visualization](https://openvisualization.org), an OpenJS Foundation / Linux Foundation project.

## Modules[​](#modules "Direct link to Modules")

Modular geospatial & 3D math

## Small tools. Big spatial ideas.

Pick the building blocks you need—from vectors and meshes to coordinate systems, global grids, and time-aware geospatial analysis.

[Foundations](#foundations)[3D](#3d)[Geospatial](#spatial)[Earth](#earth)[DGGS](#dggs)

## Foundations

Vectors, matrices, task execution, shared numeric types and expression evaluation.

[![Interactive 3D transform example](/math.gl/next/images/examples/core-transforms.jpg)@math.gl/core](https://visgl.github.io/math.gl/next/docs/modules/core.md)

### [Core](https://visgl.github.io/math.gl/next/docs/modules/core.md)

[Vectors, matrices, shared types, and expression evaluation.](https://visgl.github.io/math.gl/next/docs/modules/core.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/core.md)

[![Main thread connected through a bounded queue to reusable workers](/math.gl/next/images/tasks.svg)@math.gl/core/tasks](https://visgl.github.io/math.gl/next/docs/modules/core/tasks.md)

### [Tasks](https://visgl.github.io/math.gl/next/docs/modules/core/tasks.md)

[Run small tasks locally and larger jobs in worker pools, with bounded queues and shared state.](https://visgl.github.io/math.gl/next/docs/modules/core/tasks.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/core/tasks.md)

[![Numeric array components and three-dimensional bounds](/math.gl/next/images/modules/types.svg)@math.gl/core/types](https://visgl.github.io/math.gl/next/docs/modules/core/types.md)

### [Types](https://visgl.github.io/math.gl/next/docs/modules/core/types.md)

[Small, reusable TypeScript contracts for math and geospatial data.](https://visgl.github.io/math.gl/next/docs/modules/core/types.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/core/types.md)

[![Expression playground example](/math.gl/next/images/examples/expressions.jpg)@math.gl/core/expressions](https://visgl.github.io/math.gl/next/docs/modules/core/expressions.md)

### [Expressions](https://visgl.github.io/math.gl/next/docs/modules/core/expressions.md)

[Experimental](https://visgl.github.io/math.gl/next/docs/modules/core/expressions.md)

[Parse and evaluate compact expressions with optional geospatial functions.](https://visgl.github.io/math.gl/next/docs/modules/core/expressions.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/core/expressions.md)

## 3D

Curves, meshes, geometry processing and visibility.

[![Interactive parametric curve example](/math.gl/next/images/examples/curves.jpg)@math.gl/geometry/curves](https://visgl.github.io/math.gl/next/docs/modules/geometry/curves.md)

### [Curves](https://visgl.github.io/math.gl/next/docs/modules/geometry/curves.md)

[Parametric curves, interpolation, and arc-length sampling in 2D and 3D.](https://visgl.github.io/math.gl/next/docs/modules/geometry/curves.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geometry/curves.md)

[![3D geometry viewer example](/math.gl/next/images/examples/geometry-viewer.jpg)@math.gl/geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry.md)

### [Geometry](https://visgl.github.io/math.gl/next/docs/modules/geometry.md)

[Meshes, curves, polygon processing, culling, and spatial indexes.](https://visgl.github.io/math.gl/next/docs/modules/geometry.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geometry.md)

[![Renderer-independent mesh example](/math.gl/next/images/examples/geometry-viewer.jpg)@math.gl/geometry/utils](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils.md)

### [Geometry Utils](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils.md)

[Inspect, normalize, and process geometry stored in typed arrays.](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils.md)

[![Frustum culling playground example](/math.gl/next/images/examples/culling-playground.jpg)@math.gl/geometry/culling](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling.md)

### [Culling](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling.md)

[Bounding volumes, intersection tests, and visibility culling.](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling.md)

[![Polygon playground example](/math.gl/next/images/examples/polygon-playground.jpg)@math.gl/geometry/polygon](https://visgl.github.io/math.gl/next/docs/modules/geometry/polygon.md)

### [Polygon](https://visgl.github.io/math.gl/next/docs/modules/geometry/polygon.md)

[Clip, subdivide, triangulate, and transform polygon and line geometry.](https://visgl.github.io/math.gl/next/docs/modules/geometry/polygon.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geometry/polygon.md)

[![Interactive spatial query explorer](/math.gl/next/images/examples/spatial-index.png)@math.gl/geometry/spatial-index](https://visgl.github.io/math.gl/next/docs/modules/geometry/spatial-index.md)

### [Spatial index](https://visgl.github.io/math.gl/next/docs/modules/geometry/spatial-index.md)

[Static box, point and triangle indexes for range, ray and nearest queries (POC).](https://visgl.github.io/math.gl/next/docs/modules/geometry/spatial-index.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geometry/spatial-index.md)

## Geospatial

Coordinate systems, projections, and geospatial data formats.

[![Albers USA map example with geographic insets](/math.gl/next/images/examples/albers-usa.jpg)@math.gl/geospatial](https://visgl.github.io/math.gl/next/docs/modules/geospatial.md)

### [Geospatial](https://visgl.github.io/math.gl/next/docs/modules/geospatial.md)

[Ellipsoids, CRS, projections, WKB, and GeoArrow entry points.](https://visgl.github.io/math.gl/next/docs/modules/geospatial.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geospatial.md)

[![Coordinate reference system transformation example](/math.gl/next/images/examples/external-projection-engines.jpg)@math.gl/geospatial/crs](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs.md)

### [CRS](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs.md)

[Lightweight coordinate reference system definitions and syntax codecs.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs.md)

[![Elastic map projection example with coastlines and graticules](/math.gl/next/images/examples/elastic-maps.jpg)@math.gl/geospatial/projection](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection.md)

### [Projection](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection.md)

[Project coordinates, transform reference systems, and work across epochs.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection.md)

[![Raster projection lab map example](/math.gl/next/images/examples/raster-projection-lab.jpg)@math.gl/web-mercator](https://visgl.github.io/math.gl/next/docs/modules/web-mercator.md)

### [Web Mercator](https://visgl.github.io/math.gl/next/docs/modules/web-mercator.md)

[Map projection and camera utilities for interactive web maps.](https://visgl.github.io/math.gl/next/docs/modules/web-mercator.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/web-mercator.md)

[![GeoArrow logo](https://raw.githubusercontent.com/geoarrow/geoarrow/main/logo/geoarrow_logo.svg)@math.gl/geospatial/geoarrow](https://visgl.github.io/math.gl/next/docs/modules/geospatial/geoarrow.md)

### [GeoArrow](https://visgl.github.io/math.gl/next/docs/modules/geospatial/geoarrow.md)

[Columnar geospatial layouts and kernels over typed-array buffers.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/geoarrow.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geospatial/geoarrow.md)

[![WKT and WKB workbench displaying polygon geometry](/math.gl/next/images/examples/wkb-workbench.jpg)@math.gl/geospatial/wkb](https://visgl.github.io/math.gl/next/docs/modules/geospatial/wkb.md)

### [WKB](https://visgl.github.io/math.gl/next/docs/modules/geospatial/wkb.md)

[Dependency-free WKB, EWKB, and WKT geometry codecs.](https://visgl.github.io/math.gl/next/docs/modules/geospatial/wkb.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/geospatial/wkb.md)

## Earth

Coordinate reference systems, Earth models, maps and time.

[![Tectonic time machine Earth example](/math.gl/next/images/examples/tectonic-time-machine.jpg)@math.gl/earth](https://visgl.github.io/math.gl/next/docs/modules/earth.md)

### [Earth](https://visgl.github.io/math.gl/next/docs/modules/earth.md)

[Grouped paths for geoid, sun, and timezone utilities.](https://visgl.github.io/math.gl/next/docs/modules/earth.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/earth.md)

[![Interactive geoid globe example](/math.gl/next/images/examples/geoid-globe.jpg)@math.gl/earth/geoid](https://visgl.github.io/math.gl/next/docs/modules/earth/geoid.md)

### [Geoid](https://visgl.github.io/math.gl/next/docs/modules/earth/geoid.md)

[Sample Earth gravity models and convert ellipsoidal and geoid heights.](https://visgl.github.io/math.gl/next/docs/modules/earth/geoid.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/earth/geoid.md)

[![Interactive timezone globe example](/math.gl/next/images/examples/timezone-globe.jpg)@math.gl/earth/timezone](https://visgl.github.io/math.gl/next/docs/modules/earth/timezone.md)

### [Timezone](https://visgl.github.io/math.gl/next/docs/modules/earth/timezone.md)

[Geographic timezone lookup and local calendar calculations.](https://visgl.github.io/math.gl/next/docs/modules/earth/timezone.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/earth/timezone.md)

[![Solar terminator example showing daylight and city lights](/math.gl/next/images/examples/sun-terminator.jpg)@math.gl/earth/sun](https://visgl.github.io/math.gl/next/docs/modules/earth/sun.md)

### [Sun](https://visgl.github.io/math.gl/next/docs/modules/earth/sun.md)

[Calculate sun position, daylight, and atmospheric lighting.](https://visgl.github.io/math.gl/next/docs/modules/earth/sun.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/earth/sun.md)

## DGGS

A separate module for discrete global grid systems.

[![DGGS cell explorer displaying a geographic cell boundary](/math.gl/next/images/examples/dggs-cell-explorer.jpg)@math.gl/dggs](https://visgl.github.io/math.gl/next/docs/modules/dggs.md)

### [DGGS](https://visgl.github.io/math.gl/next/docs/modules/dggs.md)

[Decode cell boundaries for H3, S2, GeoHash, A5, and other global grids.](https://visgl.github.io/math.gl/next/docs/modules/dggs.md)

[Explore module →](https://visgl.github.io/math.gl/next/docs/modules/dggs.md)

## Package entry points[​](#package-entry-points "Direct link to Package entry points")

The grouped package entry points are:

| Package               | Subpaths                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `@math.gl/core`       | `/types`, `/expressions`                                                                                      |
| `@math.gl/geometry`   | `/utils`, `/curves`, `/polygon`, `/culling`, `/spatial-index`                                                 |
| `@math.gl/geospatial` | `/ellipsoid`, `/globe`, `/tiles`, `/crs`, `/projection`, `/web-mercator`, `/wkb`, `/geoarrow`, `/expressions` |
| `@math.gl/earth`      | `/geoid`, `/sun`, `/timezone`                                                                                 |

The implementations live in these grouped packages. The former standalone leaf packages have been removed. `@math.gl/dggs` remains separate; `@math.gl/web-mercator` is retained for compatibility.

## Legacy packages[​](#legacy-packages "Direct link to Legacy packages")

The unscoped `math.gl` compatibility package has been removed from the workspace; use `@math.gl/core` for core math. `@math.gl/web-mercator` remains available for compatibility, and `viewport-mercator-project` re-exports Web Mercator utilities.

## Supported Browsers and Node Versions[​](#supported-browsers-and-node-versions "Direct link to Supported Browsers and Node Versions")

math.gl is fully supported on:

* Evergreen browsers: Recent versions of Chrome, Safari, Firefox, Edge etc.
* Node.js: Active and Maintenance [LTS releases](https://nodejs.org/en/about/releases/)

## History[​](#history "Direct link to History")

| Year  | Version           | Description                                                                                                                                                                                                                                       |
| ----- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026  | v5.0 (prerelease) | A new projection engine, global grid adapters, WKB and GeoArrow geometry processing, and Earth utilities, organized into focused package entry points. See [what’s new](https://visgl.github.io/math.gl/next/docs/whats-new.md#v50). |
| 2023  | v4.0              | ES module support. gl-matrix was removed as a runtime dependency; adapted numerical kernels remain in core.                                                                                                                                       |
| 2022  | v3.6              | Code base fully rewritten in TypeScript.                                                                                                                                                                                                          |
| 2020+ | v3.x              | Additional geospatial modules have gradually been added to support more advanced use cases for deck.gl.                                                                                                                                           |
| 2019  | v3.0              | A collaboration with the Cesium team around 3D Tiles led to ports of parts of the Cesium math library into the `math.gl/geospatial` and `@math.gl/geometry/culling` modules.                                                                      |
| 2018  | v2.0              | The math.gl API started to mature.                                                                                                                                                                                                                |
| 2017  | v1.0              | `math.gl` was broken out into its own repository to manage luma.gl growth. The goal was an independently usable set of 3D and Geospatial math modules.                                                                                            |
| 2015  | N/A               | `@math.gl/core` classes were created as part of luma.gl v4, as a set of class wrappers for `gl-matrix` for luma.gl and deck.gl frameworks.                                                                                                        |

## References and credits[​](#references-and-credits "Direct link to References and credits")

See [References and credits](https://visgl.github.io/math.gl/next/docs/references-and-credits.md) for contributor acknowledgments, upstream libraries, scientific references, dataset credits, and third-party notices.

## License[​](#license "Direct link to License")

MIT license. Derived kernels retain their upstream notices.

Selected modules include Apache-2.0 or ISC licensed upstream code. Optional datasets can have separate licenses; see each module's attribution and distributed notices.

Package code uses permissive licenses. Dataset licenses and attribution are documented separately.
