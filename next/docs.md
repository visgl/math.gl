[![coverage](https://img.shields.io/coveralls/visgl/math.gl.svg?style=flat-square\&label=coverage)](https://coveralls.io/github/visgl/math.gl?branch=master)

# Introduction

Welcome to math.gl!

math.gl is a modular TypeScript toolbox for **geospatial** and **3D** math. Start with vectors and matrices in core, then add modules for coordinate conversion, geometry, global grids, and other application needs.

math.gl computes on the CPU and has no GPU dependencies. Its arrays and coordinate utilities can supply WebGL, WebGPU, or other rendering systems.

## Features[​](#features "Direct link to Features")

* **Core classes** - Basic vectors and matrices: **`@math.gl/types`**, **`@math.gl/core`**
* **Expression parsing** - Parse and evaluate compact JavaScript-style expressions: **`@math.gl/expressions`**
* **Geospatial projections** - CRS definitions and support for a variety of geospatial projections **`@math.gl/crs`**, **`@math.gl/geospatial`**, **`@math.gl/geoid`**, **`@math.gl/projection`**, **`@math.gl/web-mercator`**
* **Geospatial utilities** - Cutting polygons and calculating sun position and direction **`@math.gl/polygon`**, **`@math.gl/sun`**
* **Discrete global grids** - Lightweight geometry decoders and cell-column detection for common grid encodings. **`@math.gl/dggs`**
* **3D math** - 3D primitives, geometry processing and culling: **`@math.gl/geometry`**, **`@math.gl/geometry-utils`**, **`@math.gl/culling`**

## Modules[​](#modules "Direct link to Modules")

math.gl is a toolbox that offers a suite of composable modules.

### Foundations[​](#foundations "Direct link to Foundations")

Vectors, matrices and shared numeric types.

| Module                                                                                                  | Description                                                  |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [`@math.gl/core`](https://visgl.github.io/math.gl/next/docs/modules/core.md)               | Vectors, matrices, quaternions and reusable math primitives. |
| [`@math.gl/types`](https://visgl.github.io/math.gl/next/docs/modules/types.md)             | Shared TypeScript contracts for numeric and geospatial data. |
| [`@math.gl/expressions`](https://visgl.github.io/math.gl/next/docs/modules/expressions.md) | Parse and evaluate compact expressions (experimental).       |

### 3D[​](#3d "Direct link to 3D")

Curves, meshes, geometry processing and visibility.

| Module                                                                                                        | Description                                               |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`@math.gl/curves`](https://visgl.github.io/math.gl/next/docs/modules/curves.md)                 | Parametric curves, interpolation and arc-length sampling. |
| [`@math.gl/geometry`](https://visgl.github.io/math.gl/next/docs/modules/geometry.md)             | Renderer-independent primitive meshes and tessellation.   |
| [`@math.gl/geometry-utils`](https://visgl.github.io/math.gl/next/docs/modules/geometry-utils.md) | Typed-array geometry processing utilities.                |
| [`@math.gl/culling`](https://visgl.github.io/math.gl/next/docs/modules/culling.md)               | Bounding volumes, intersection tests and visibility.      |

### Spatial[​](#spatial "Direct link to Spatial")

Geometry operations, geographic indexing and columnar data.

| Module                                                                                                      | Description                                                                      |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`@math.gl/polygon`](https://visgl.github.io/math.gl/next/docs/modules/polygon.md)             | Clipping, subdivision and polygon and line geometry operations.                  |
| [`@math.gl/spatial-index`](https://visgl.github.io/math.gl/next/docs/modules/spatial-index.md) | Static box, point and triangle indexes for range, ray and nearest queries (POC). |
| [`@math.gl/dggs`](https://visgl.github.io/math.gl/next/docs/modules/dggs.md)                   | Decode boundaries and columns for common global grid encodings.                  |
| [`@math.gl/geoarrow`](https://visgl.github.io/math.gl/next/docs/modules/geoarrow.md)           | Columnar geospatial layouts and kernels over typed-array buffers.                |
| [`@math.gl/wkb`](https://visgl.github.io/math.gl/next/docs/modules/wkb.md)                     | WKB, EWKB and WKT geometry codecs.                                               |

### Earth[​](#earth "Direct link to Earth")

Coordinate reference systems, Earth models, maps and time.

| Module                                                                                                    | Description                                                            |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`@math.gl/crs`](https://visgl.github.io/math.gl/next/docs/modules/crs.md)                   | Coordinate reference system definitions and syntax readers.            |
| [`@math.gl/projection`](https://visgl.github.io/math.gl/next/docs/modules/projection.md)     | Coordinate transformations, pluggable projections and explicit epochs. |
| [`@math.gl/web-mercator`](https://visgl.github.io/math.gl/next/docs/modules/web-mercator.md) | Web Mercator map and camera utilities.                                 |
| [`@math.gl/geospatial`](https://visgl.github.io/math.gl/next/docs/modules/geospatial.md)     | Ellipsoid geometry and geographic coordinate frames.                   |
| [`@math.gl/geoid`](https://visgl.github.io/math.gl/next/docs/modules/geoid.md)               | Earth gravity models and geoid height conversion.                      |
| [`@math.gl/timezone`](https://visgl.github.io/math.gl/next/docs/modules/timezone.md)         | Geographic timezone lookup and local calendar calculations.            |
| [`@math.gl/sun`](https://visgl.github.io/math.gl/next/docs/modules/sun.md)                   | Sun position, daylight and atmospheric lighting.                       |

## Legacy packages[​](#legacy-packages "Direct link to Legacy packages")

`math.gl` re-exports core for older applications. `viewport-mercator-project` re-exports Web Mercator utilities. Use the scoped packages for new code.

## Supported Browsers and Node Versions[​](#supported-browsers-and-node-versions "Direct link to Supported Browsers and Node Versions")

math.gl is fully supported on:

* Evergreen browsers: Recent versions of Chrome, Safari, Firefox, Edge etc.
* Node.js: Active and Maintenance [LTS releases](https://nodejs.org/en/about/releases/)

## History[​](#history "Direct link to History")

| Year  | Version | Description                                                                                                                                                         |
| ----- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2015  | N/A     | `@math.gl/core` classes were created as part of luma.gl v4, as a set of class wrappers for `gl-matrix` for luma.gl and deck.gl frameworks.                          |
| 2017  | v1.0    | `math.gl` was broken out into its own repository to manage luma.gl growth. The goal was an independently usable set of 3D and Geospatial math modules.              |
| 2018  | v2.0    | The math.gl API started to mature.                                                                                                                                  |
| 2019  | v3.0    | A collaboration with the Cesium team around 3D Tiles led to ports of parts of the Cesium math library into the `math.gl/geospatial` and `@math.gl/culling` modules. |
| 2020+ | v3.x    | Additional geospatial modules have gradually been added to support more advanced use cases for deck.gl.                                                             |
| 2022  | v3.6    | Code base fully rewritten in TypeScript.                                                                                                                            |
| 2023  | v4.0    | ES module support. gl-matrix was removed as a dependency and math.gl became fully stand-alone.                                                                      |

## Attributions[​](#attributions "Direct link to Attributions")

math.gl was inspired by and built upon some of the most proven open source JavaScript math libraries:

* [`gl-matrix`](http://glmatrix.net/) - inspiration for the vector and matrix kernels; core no longer depends on the package
* [`expression-eval`](https://www.npmjs.com/package/expression-eval) by [@donmccurdy](https://github.com/donmccurdy) - inspiration and source material for `@math.gl/expressions`
* THREE.js math library - math.gl classes are API-compatible with a subset of the THREE.js classes and pass THREE.js test suites.
* The CesiumJS math library (Apache2) - The geospatial and culling modules were ported from Cesium code base.

## License[​](#license "Direct link to License")

MIT license. Derived kernels retain their upstream notices.

Selected modules include Apache-2.0 or ISC licensed upstream code. Optional datasets can have separate licenses; see each module's attribution and distributed notices.

Package code uses permissive licenses. Dataset licenses and attribution are documented separately.
