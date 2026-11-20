# Overview

<!-- -->

[![MIT license](https://img.shields.io/badge/license-MIT-green?style=flat-square)](https://github.com/visgl/math.gl/blob/master/LICENSE)[![coverage](https://img.shields.io/coveralls/visgl/math.gl.svg?style=flat-square\&label=coverage)](https://coveralls.io/github/visgl/math.gl?branch=master)[![Built with TypeScript 6.0.3](https://img.shields.io/badge/6.0.3-3178c6?style=flat-square\&logo=typescript\&logoColor=white)](https://www.typescriptlang.org/ "Built with TypeScript 6.0.3")[![npm version](https://img.shields.io/npm/v/@math.gl/core?style=flat-square\&color=8064a2)](https://www.npmjs.com/package/@math.gl/core)[![Monthly npm downloads for @math.gl/core](https://img.shields.io/npm/dm/@math.gl/core?style=flat-square\&color=8064a2)](https://www.npmjs.com/package/@math.gl/core)

[![GitHub stars](https://img.shields.io/github/stars/visgl/math.gl?style=flat-square\&label=%E2%98%85\&logo=github\&logoColor=white\&color=24292f\&labelColor=24292f)](https://github.com/visgl/math.gl)[![GitHub contributors](https://img.shields.io/github/contributors/visgl/math.gl?style=flat-square\&logo=github\&logoColor=white\&color=24292f\&labelColor=24292f)](https://github.com/visgl/math.gl/graphs/contributors)[![Merged pull requests](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Fsearch%2Fissues%3Fq%3Drepo%3Avisgl%2Fmath.gl%2Bis%3Apr%2Bis%3Amerged\&query=%24.total_count\&label=PRs\&style=flat-square\&logo=github\&logoColor=white\&color=24292f\&labelColor=24292f)](https://github.com/visgl/math.gl/pulls?q=is%3Apr+is%3Amerged)

Library overview

## Math for the shape of the world.

From matrices to coordinate systems and planetary geometry. Composable tools for the world you are building.

[Get started ↗](https://visgl.github.io/math.gl/next/docs/developer-guide.md)[Packages ↗](https://visgl.github.io/math.gl/next/docs/modules.md)[Upgrading ↗](https://visgl.github.io/math.gl/next/docs/upgrade-guide.md)

[![OpenJS Foundation](https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color.svg)![OpenJS Foundation](https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color-dark_background.svg)](https://openvisualization.org)

math.gl is an [Open Visualization](https://openvisualization.org/), [OpenJS Foundation](https://openjsf.org/) and [Linux Foundation](https://www.linuxfoundation.org/) project.

## npm packages[​](#npm-packages "Direct link to npm packages")

These packages export subpaths for different features. See each package’s documentation for the full list.

| Package                                                                                               | Description                                                                                                  |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`@math.gl/core`](https://visgl.github.io/math.gl/next/docs/modules/core.md)             | Vectors, matrices, and quaternions for 3D math, along with color, UTF-8, and Apache Arrow utilities.         |
| [`@math.gl/geometry`](https://visgl.github.io/math.gl/next/docs/modules/geometry.md)     | Geometry primitives and mesh operations for tessellation, spatial queries, and visibility testing.           |
| [`@math.gl/geospatial`](https://visgl.github.io/math.gl/next/docs/modules/geospatial.md) | Coordinate systems and map projections, terrain sampling, and tools for processing geospatial data.          |
| [`@math.gl/earth`](https://visgl.github.io/math.gl/next/docs/modules/earth.md)           | Tools for calculating sunlight and star positions, looking up time zones, and modeling the geoid and oceans. |
| [`@math.gl/dggs`](https://visgl.github.io/math.gl/next/docs/modules/dggs.md)             | Decodes and indexes cells in discrete global grids.                                                          |
| [`@math.gl/sql`](https://visgl.github.io/math.gl/next/docs/modules/sql.md)               | An optimized SQL parser and engine that works directly on Apache Arrow tables.                               |
| [`@math.gl/tasks`](https://visgl.github.io/math.gl/next/docs/modules/tasks.md)           | Runs heavy computations on worker threads.                                                                   |

## Supported Browsers and Node Versions[​](#supported-browsers-and-node-versions "Direct link to Supported Browsers and Node Versions")

math.gl is fully supported on:

* Evergreen browsers: Recent versions of Chrome, Safari, Firefox, Edge etc.
* Node.js: Active and Maintenance [LTS releases](https://nodejs.org/en/about/releases/)

## History[​](#history "Direct link to History")

| Year  | Version  | Description                                                                                                                                                                                                                                       |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026  | **v5.0** | A new projection engine, global grid adapters, WKB and GeoArrow geometry processing, and Earth utilities, organized into focused package entry points. See [what’s new](https://visgl.github.io/math.gl/next/docs/whats-new.md#v50). |
| 2023  | **v4.0** | `gl-matrix` dropped 64-bit support and was replaced with adapted numerical kernels.                                                                                                                                                               |
| 2022  | **v3.6** | Code base fully rewritten in TypeScript.                                                                                                                                                                                                          |
| 2020+ | **v3.x** | Additional geospatial modules were added based on needs from the [luma.gl](https://luma.gl/) and [deck.gl](https://deck.gl/) community.                                                                                                           |
| 2019  | **v3.0** | A collaboration with the Cesium team around 3D Tiles support introduced the `math.gl/geospatial` and `@math.gl/geometry/culling` modules.                                                                                                         |
| 2018  | **v2.0** | API stabilization.                                                                                                                                                                                                                                |
| 2017  | **v1.0** | `math.gl` got its own repository to provide an independently usable set of 3D and Geospatial math modules.                                                                                                                                        |
| 2015  | **N/A**  | The math.gl matrix library (`@math.gl/core/matrix`) started as a set of class wrappers for [`gl-matrix`](https://glmatrix.net/) inside [luma.gl](https://luma.gl/).                                                                               |

## Attributions[​](#attributions "Direct link to Attributions")

See [Attributions](https://visgl.github.io/math.gl/next/docs/references-and-credits.md) for contributor acknowledgments, upstream libraries, scientific references, dataset credits, and third-party notices.

## License[​](#license "Direct link to License")

math.gl is released under the [MIT License](https://github.com/visgl/math.gl/blob/master/LICENSE). Some modules include upstream code under other permissive licenses such as Apache-2.0 or ISC and retain the original license notices.

Optional datasets may have their own licenses. See [Attribution](https://visgl.github.io/math.gl/next/docs/references-and-credits.md) and the notices included with each dataset.
