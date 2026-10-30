---
sidebar_label: Introduction
---

import ModuleCatalog from '@site/src/components/module-catalog';

<p className="badges">
  <a href="https://github.com/visgl/math.gl/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT license" height="20" /></a>
  <a href="https://www.npmjs.com/package/@math.gl/core"><img src="https://img.shields.io/npm/dm/@math.gl/core?style=flat-square" alt="Monthly npm downloads for @math.gl/core" height="20" /></a>
  <a href="https://www.npmjs.com/package/@math.gl/core"><img src="https://img.shields.io/npm/v/@math.gl/core?style=flat-square" alt="npm version" height="20" /></a>
  <a href="https://github.com/visgl/math.gl"><img src="https://img.shields.io/github/stars/visgl/math.gl?style=flat-square" alt="GitHub stars" height="20" /></a>
  <a href="https://www.typescriptlang.org/" title="Built with TypeScript 6.0.3"><img src="https://img.shields.io/badge/6.0.3-3178c6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="Built with TypeScript 6.0.3" height="20" /></a>
  <a href="https://coveralls.io/github/visgl/math.gl?branch=master">
    <img src="https://img.shields.io/coveralls/visgl/math.gl.svg?style=flat-square&label=coverage" alt="coverage" />
  </a>
</p>

# Introduction

Welcome to math.gl!

math.gl is a modular TypeScript toolbox for **geospatial** and **3D** math. Start with vectors and matrices in core, then add modules for coordinate conversion, geometry, global grids, and other application needs.

math.gl computes on the CPU and has no GPU dependencies. Its arrays and coordinate utilities can supply WebGL, WebGPU, or other rendering systems.

<div className="foundation-attribution">
  <a href="https://openvisualization.org">
    <img className="openjs-logo-light" src="https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color.svg" alt="OpenJS Foundation" width="150" /><img className="openjs-logo-dark" src="https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color-dark_background.svg" alt="OpenJS Foundation" width="150" />
  </a>
  <p>math.gl is part of <a href="https://openvisualization.org">Open Visualization</a>, an OpenJS Foundation / Linux Foundation project.</p>
</div>

## Modules

<ModuleCatalog />

## Package entry points

The grouped package entry points are:

| Package | Subpaths |
| --- | --- |
| `@math.gl/core` | `/types`, `/expressions` |
| `@math.gl/geometry` | `/utils`, `/curves`, `/polygon`, `/culling`, `/spatial-index` |
| `@math.gl/geospatial` | `/ellipsoid`, `/globe`, `/tiles`, `/crs`, `/projection`, `/web-mercator`, `/wkb`, `/geoarrow`, `/expressions` |
| `@math.gl/earth` | `/geoid`, `/sun`, `/timezone` |

The implementations live in these grouped packages. The former standalone leaf packages have
been removed. `@math.gl/dggs` remains separate; `@math.gl/web-mercator` is retained for compatibility.

## Legacy packages

The unscoped `math.gl` compatibility package has been removed from the workspace; use
`@math.gl/core` for core math. `@math.gl/web-mercator` remains available for compatibility, and
`viewport-mercator-project` re-exports Web Mercator utilities.

## Supported Browsers and Node Versions

math.gl is fully supported on:

- Evergreen browsers: Recent versions of Chrome, Safari, Firefox, Edge etc.
- Node.js: Active and Maintenance [LTS releases](https://nodejs.org/en/about/releases/)

## History

| Year  | Version | Description                                                                                                                                                            |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026 | v5.0 (prerelease) | A new projection engine, global grid adapters, WKB and GeoArrow geometry processing, and Earth utilities, organized into focused package entry points. See [what’s new](./whats-new.md#v50). |
| 2023  | v4.0    | ES module support. gl-matrix was removed as a runtime dependency; adapted numerical kernels remain in core.                                                                         |
| 2022  | v3.6    | Code base fully rewritten in TypeScript.                                                                                                                               |
| 2020+ | v3.x    | Additional geospatial modules have gradually been added to support more advanced use cases for deck.gl.                                                                |
| 2019  | v3.0    | A collaboration with the Cesium team around 3D Tiles led to ports of parts of the Cesium math library into the `math.gl/geospatial` and `@math.gl/geometry/culling` modules. |
| 2018  | v2.0    | The math.gl API started to mature.                                                                                                                                     |
| 2017  | v1.0    | `math.gl` was broken out into its own repository to manage luma.gl growth. The goal was an independently usable set of 3D and Geospatial math modules.                 |
| 2015  | N/A     | `@math.gl/core` classes were created as part of luma.gl v4, as a set of class wrappers for `gl-matrix` for luma.gl and deck.gl frameworks.                             |

## References and credits

See [References and credits](./references-and-credits.md) for contributor acknowledgments,
upstream libraries, scientific references, dataset credits, and third-party notices.

## License

MIT license. Derived kernels retain their upstream notices.

Selected modules include Apache-2.0 or ISC licensed upstream code. Optional datasets can have separate licenses; see each module's attribution and distributed notices.

Package code uses permissive licenses. Dataset licenses and attribution are documented separately.
