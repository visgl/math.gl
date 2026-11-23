---
sidebar_label: Overview
---

# Overview

import LibraryOverview from '@site/src/components/library-overview';

<p className="badges introduction-badges">
  <a href="https://github.com/visgl/math.gl/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT license" height="20" /></a>
  <a href="https://coveralls.io/github/visgl/math.gl?branch=master">
    <img src="https://img.shields.io/coveralls/visgl/math.gl.svg?style=flat-square&label=coverage" alt="coverage" />
  </a>
  <a href="https://www.typescriptlang.org/" title="Built with TypeScript 6.0.3"><img src="https://img.shields.io/badge/6.0.3-3178c6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="Built with TypeScript 6.0.3" height="20" /></a>
  <a href="https://www.npmjs.com/package/@math.gl/core"><img src="https://img.shields.io/npm/v/@math.gl/core?style=flat-square&amp;color=8064a2" alt="npm version" height="20" /></a>
  <a href="https://www.npmjs.com/package/@math.gl/core"><img src="https://img.shields.io/npm/dm/@math.gl/core?style=flat-square&amp;color=8064a2" alt="Monthly npm downloads for @math.gl/core" height="20" /></a>
</p>

<p className="badges introduction-badges">
  <a href="https://github.com/visgl/math.gl"><img src="https://img.shields.io/github/stars/visgl/math.gl?style=flat-square&amp;label=%E2%98%85&amp;logo=github&amp;logoColor=white&amp;color=24292f&amp;labelColor=24292f" alt="GitHub stars" height="20" /></a>
  <a href="https://github.com/visgl/math.gl/graphs/contributors"><img src="https://img.shields.io/github/contributors/visgl/math.gl?style=flat-square&amp;logo=github&amp;logoColor=white&amp;color=24292f&amp;labelColor=24292f" alt="GitHub contributors" height="20" /></a>
  <a href="https://github.com/visgl/math.gl/pulls?q=is%3Apr+is%3Amerged"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Fsearch%2Fissues%3Fq%3Drepo%3Avisgl%2Fmath.gl%2Bis%3Apr%2Bis%3Amerged&amp;query=%24.total_count&amp;label=PRs&amp;style=flat-square&amp;logo=github&amp;logoColor=white&amp;color=24292f&amp;labelColor=24292f" alt="Merged pull requests" height="20" /></a>
</p>

<LibraryOverview />

<div className="foundation-attribution">
  <a href="https://openvisualization.org">
    <img className="openjs-logo-light" src="https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color.svg" alt="OpenJS Foundation" width="150" /><img className="openjs-logo-dark" src="https://raw.githubusercontent.com/openjs-foundation/artwork/main/openjs_foundation/openjs_foundation-logo-horizontal-color-dark_background.svg" alt="OpenJS Foundation" width="150" />
  </a>
  <p>math.gl is an <a href="https://openvisualization.org/">Open Visualization</a>, <a href="https://openjsf.org/">OpenJS Foundation</a> and <a href="https://www.linuxfoundation.org/">Linux Foundation</a> project.</p>
</div>

## npm packages

These packages export subpaths for different features. See each package’s documentation for the full list.

| Package | Description |
| --- | --- |
| [`@math.gl/core`](./modules/core/README.md) | Vectors, matrices, and quaternions for 3D math, along with color, UTF-8, and Apache Arrow utilities. |
| [`@math.gl/geometry`](./modules/geometry/README.md) | Geometry primitives and mesh operations for tessellation, spatial queries, and visibility testing. |
| [`@math.gl/geospatial`](./modules/geospatial/README.md) | Coordinate systems and map projections, terrain sampling, and tools for processing geospatial data. |
| [`@math.gl/earth`](./modules/earth/README.md) | Tools for calculating sunlight and star positions, looking up time zones, and modeling the geoid and oceans. |
| [`@math.gl/dggs`](./modules/dggs/README.md) | Decodes and indexes cells in discrete global grids. |
| [`@math.gl/sql`](./modules/sql/README.md) | An optimized SQL parser and engine that works directly on Apache Arrow tables. |
| [`@math.gl/tasks`](./modules/tasks/README.md) | Runs heavy computations on worker threads. |

## Supported Browsers and Node Versions

math.gl is fully supported on:

- Evergreen browsers: Recent versions of Chrome, Safari, Firefox, Edge etc.
- Node.js: Active and Maintenance [LTS releases](https://nodejs.org/en/about/releases/)

## History

| Year  | Version | Description                                                                                                                                                            |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026 | **v5.0** | A new projection engine, global grid adapters, WKB and GeoArrow geometry processing, and Earth utilities, organized into focused package entry points. See [what’s new](./whats-new.md#v50). |
| 2023  | **v4.0**    | `gl-matrix` dropped 64-bit support and was replaced with adapted numerical kernels.                                                                         |
| 2022  | **v3.6**    | Code base fully rewritten in TypeScript.                                                                                                                               |
| 2020+ | **v3.x**    | Additional geospatial modules were added based on needs from the [luma.gl](https://luma.gl/) and [deck.gl](https://deck.gl/) community.                                                                |
| 2019  | **v3.0**    | A collaboration with the Cesium team around 3D Tiles support introduced the `math.gl/geospatial` and `@math.gl/geometry/culling` modules. |
| 2018  | **v2.0**    | API stabilization.                                                                                                                                     |
| 2017  | **v1.0**    | `math.gl` got its own repository to provide an independently usable set of 3D and Geospatial math modules. |
| 2015  | **N/A**     | The math.gl matrix library (`@math.gl/core/matrix`) started as a set of class wrappers for [`gl-matrix`](https://glmatrix.net/) inside [luma.gl](https://luma.gl/). |

## Attributions

See [Attributions](./references-and-credits.md) for contributor acknowledgments,
upstream libraries, scientific references, dataset credits, and third-party notices.

## License

math.gl is released under the [MIT License](https://github.com/visgl/math.gl/blob/master/LICENSE).
Some modules include upstream code under other permissive licenses such as Apache-2.0 or ISC and retain the original license notices.

Optional datasets may have their own licenses. See [Attribution](./references-and-credits.md)
and the notices included with each dataset.
