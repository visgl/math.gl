# Overview

<!-- -->

[![MIT license](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/visgl/math.gl/blob/master/LICENSE)[![Built with TypeScript 6.0.3](https://img.shields.io/badge/6.0.3-3178c6?style=flat-square\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/ "Built with TypeScript 6.0.3")[![coverage](https://img.shields.io/coveralls/visgl/math.gl.svg?style=flat-square\&label=coverage)](https://coveralls.io/github/visgl/math.gl?branch=master)[![npm version](https://img.shields.io/npm/v/@math.gl/core?style=flat-square\&color=8064a2)](https://www.npmjs.com/package/@math.gl/core)[![Monthly npm downloads for @math.gl/core](https://img.shields.io/npm/dm/@math.gl/core?style=flat-square\&color=8064a2)](https://www.npmjs.com/package/@math.gl/core)

[![GitHub stars](https://img.shields.io/github/stars/visgl/math.gl?style=flat-square\&label=%E2%98%85\&logo=github\&logoColor=white\&color=24292f\&labelColor=24292f)](https://github.com/visgl/math.gl)[![GitHub contributors](https://img.shields.io/github/contributors/visgl/math.gl?style=flat-square\&logo=github\&logoColor=white\&color=24292f\&labelColor=24292f)](https://github.com/visgl/math.gl/graphs/contributors)[![Merged pull requests](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Fsearch%2Fissues%3Fq%3Drepo%3Avisgl%2Fmath.gl%2Bis%3Apr%2Bis%3Amerged\&query=%24.total_count\&label=PRs\&style=flat-square\&logo=github\&logoColor=white\&color=24292f\&labelColor=24292f)](https://github.com/visgl/math.gl/pulls?q=is%3Apr+is%3Amerged)

Library overview

## Math for the shape of the world.

From vectors and matrices to coordinate systems and planetary geometry. Composable TypeScript tools for the world you’re building.

math.gl computes on the CPU with no GPU dependencies. Use its arrays and coordinate utilities with WebGL, WebGPU, or your own analysis pipeline.

[Get started ↗](https://visgl.github.io/math.gl/next/docs/developer-guide.md)[Modules ↗](https://visgl.github.io/math.gl/next/docs/modules.md)[Upgrading ↗](https://visgl.github.io/math.gl/next/docs/upgrade-guide.md)

[![OpenJS Foundation](https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color.svg)![OpenJS Foundation](https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color-dark_background.svg)](https://openvisualization.org)

math.gl is an [Open Visualization](https://openvisualization.org/), OpenJS Foundation and Linux Foundation project.

## Package entry points[​](#package-entry-points "Direct link to Package entry points")

The grouped package entry points are:

| Package                 | Subpaths                                                                |
| ----------------------- | ----------------------------------------------------------------------- |
| `@math.gl/core`         | `/expressions`                                                          |
| `@math.gl/geometry`     | `/culling`, `/lighting`, `/color`                                       |
| `@math.gl/geospatial`   | `/crs`, `/projection`, `/terrain`, `/turf`, `/tasks`                    |
| `@math.gl/earth`        | `/sun`, `/timezone`, `/sun/stars`; optional geoid and timezone datasets |
| `@math.gl/dggs`         | Grid decoding and indexing at the package root                          |
| `@math.gl/web-mercator` | Map viewport and camera calculations at the package root                |
| `@math.gl/arrow`        | `/utf8`, `/geoarrow`, `/geoarrow-utils`, `/wkb`                         |
| `@math.gl/tasks`        | Task execution at the package root                                      |

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

## Attributions[​](#attributions "Direct link to Attributions")

See [Attributions](https://visgl.github.io/math.gl/next/docs/references-and-credits.md) for contributor acknowledgments, upstream libraries, scientific references, dataset credits, and third-party notices.

## License[​](#license "Direct link to License")

MIT license. Derived kernels retain their upstream notices.

Selected modules include Apache-2.0 or ISC licensed upstream code. Optional datasets can have separate licenses; see each module's attribution and distributed notices.

Package code uses permissive licenses. Dataset licenses and attribution are documented separately.
