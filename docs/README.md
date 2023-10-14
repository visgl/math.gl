# Introduction

Welcome to math.gl! 

math.gl is TypeScript math library focused on **geospatial** and **3D** use cases. Designed as a composable, **modular toolbox**. math.gl provides a core module with the standard complement of vector and matrix classes, and a suite of optional modules implementing various aspects of geospatial and 3D math.

math.gl is  **optimized for use with WebGL and WebGPU**, however it is not a GPU math library, meaning that it has no GPU dependencies and is designed to be usable in any application.

## Features

- **Core classes** - Basic vectors and matrices: **`@math.gl/types`**, **`@math.gl/core`**
- **Geospatial projections** - Support for a variety of geospatial projections **`@math.gl/geospatial`**, **`@math.gl/geoid`**, **`@math.gl/proj4`**, **`@math.gl/web-mercator`**
- **Geospatial utilities** - Cutting polygons and calculating sun position and direction **`@math.gl/polygon`**,  **`@math.gl/sun`**
- **Discrete Global Grids** - Standardized interfaces to a number of the major discrete global grids. **`@math.gl/dggs-geohash`**, **`@math.gl/dggs-quadkey`**, **`@math.gl/dggs-s2`**
- **3D math** - 3D primitives and culling: **`@math.gl/culling`**

## Modules

math.gl is a toolbox that offers a suite of composable modules.

| **Core math libraries**           | Module <span style={{width: 300}} /> | Description                                  |
| --------------------------------- | ------------------------------------ | -------------------------------------------- |
|                                   | **`@math.gl/types`**                 | Basic math type helpers (`NumericArray` etc) |
| ![core](./images/core.png 'core') | **`@math.gl/core`**                  | Basic math classes (vectors, matrices, etc)  |

| **Geospatial math libraries**                       | Module <span style={{width: 300}} /> | Description                                        |
| --------------------------------------------------- | ------------------------------------ | -------------------------------------------------- |
| ![geospatial](./images/geospatial.svg 'geospatial') | **`@math.gl/geospatial`**            | Ellipsoidal math for WGS84 coordinates.            |
| ![geoid](./images/geoid.png 'geoid')                | **`@math.gl/geoid`**                 | Earth Gravity Model support .                      |
|                                                     | **`@math.gl/polygon`**               | Polygon math, including geospatial cutting etc.    |
|                                                     | **`@math.gl/proj4`**                 | Conversion between coordinate reference systems.   |
|                                                     | **`@math.gl/sun`**                   | Solar position / direction from position and time. |
|                                                     | **`@math.gl/web-mercator`**          | Supports 3D Web Mercator (spherical) projections.  |

| **DGGS (Discrete global grid support) libraries** | Module <span style={{width: 300}} /> | Description                     |
| ------------------------------------------------- | ------------------------------------ | ------------------------------- |
| ![geohash](./images/dggs/geohash.png 'geohash')   | **`@math.gl/dggs-geohash`**          | Get geometry of GeoHash tokens. |
| ![quadkey](./images/dggs/quadkey.png 'quadkey')   | **`@math.gl/dggs-quadkey`**          | Get geometry of QuadKey tokens  |
| ![s2](./images/dggs/s2.png 's2')                  | **`@math.gl/dggs-s2`**               | Get geometry of S2 tokens.      |

| **3D math libraries**                      | Module <span style={{width: 300}} /> | Description                                |
| ------------------------------------------ | ------------------------------------ | ------------------------------------------ |
| ![culling](./images/culling.png 'culling') | **`@math.gl/culling`**               | Bounding volumes and intersection testing. |

<br/>
In addition, math.gl provides a few deprecated legacy modules, to avoid breaking older applications.
<br/>
<br/>

| Legacy Module                   | Description                                                                                                                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`math.gl`**                   | Re-exports the API from **`@math.gl/core`**. An "alias" for **`@math.gl/core`** to avoid breaking old applications.                                                                                                     |
| **`viewport-mercator-project`** | Re-exports the Web Mercator projection utilities in **`@math.gl/web-mercator`**. The [viewport-mercator-project](https://github.com/uber-common/viewport-mercator-project) repository was moved to math.gl in Oct 2019. |

## Supported Browsers and Node Versions

math.gl is fully supported on:

- Evergreen browsers: Recent versions of Chrome, Safari, Firefox, Edge etc.
- Node.js: Active and Maintenance [LTS releases](https://nodejs.org/en/about/releases/)

## History

| Year  | Version | Description                                                                                                                                                            |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2015  | N/A     | `@math.gl/core` classes were created as part of luma.gl v4, as a set of class wrappers for `gl-matrix` for luma.gl and deck.gl frameworks.                             |
| 2017  | v1.0    | `math.gl` was broken out into its own repository to manage luma.gl growth. The goal was to  independently usable set of 3D and Geospatial math modules.                |
| 2018  | v2.0    | The math.gl API started to mature.                                                                                                                                     |
| 2019  | v3.0    | A collaboration with the Cesium team around 3D Tiles led to parts of the Cesium math library were ported into the `math.gl/geospatial` and `@math.gl/culling` modules. |
| 2020+ | v3.x    | Additional geospatial modules have gradually been added to support more advanced use cases for deck.gl.                                                                |
| 2022  | v3.6    | Code base fully rewritten in TypeScript.                                                                                                                               |
| 2023  | v4.0    | ES module support. gl-matrix was removed as a dependency and math.gl became fully stand-alone.                                                                         |

## Attributions

math.gl was inspired by and built upon some of the most proven open source JavaScript math libraries:

- [`gl-matrix`](http://glmatrix.net/) - math.gl classes use gl-matrix under the hood
- THREE.js math library - math.gl classes are API-compatible with a subset of the THREE.js classes and pass THREE.js test suites.
- The CesiumJS math library (Apache2) - The geospatial and culling modules were ported from Cesium code base.

## License

MIT license. The libraries that the core `@math.gl/core` module are built on (e.g. gl-matrix) are also all open source and MIT licensed.

The `@math.gl/geospatial` and `@math.gl/culling` modules include Cesium-derived code which is Apache2 licensed.

math.gl will never include any code that is not under permissive license.
