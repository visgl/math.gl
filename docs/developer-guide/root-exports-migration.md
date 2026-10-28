---
title: Migrating to root exports
---

{/* SPDX-License-Identifier: MIT */}
{/* SPDX-FileCopyrightText: Copyright (c) vis.gl contributors */}

# Migrating to root exports

The APIs below moved to package or capability roots. The old API subpaths are no
longer exported; update imports before upgrading. Existing named symbols and public
types remain available at the destination, except for the explicitly renamed type
collisions below. Projection catalogs and data assets retain their paths.

| Previous import | New import |
| --- | --- |
| `@math.gl/core/expressions` | `@math.gl/core` |
| `@math.gl/core/local-frame` | `@math.gl/core` |
| `@math.gl/core/mat3` | `@math.gl/core` |
| `@math.gl/core/mat4` | `@math.gl/core` |
| `@math.gl/core/quat` | `@math.gl/core` |
| `@math.gl/core/spheroid` | `@math.gl/core` |
| `@math.gl/core/types` | `@math.gl/core` |
| `@math.gl/core/vec2` | `@math.gl/core` |
| `@math.gl/core/vec3` | `@math.gl/core` |
| `@math.gl/core/vec4` | `@math.gl/core` |
| `@math.gl/dggs/a5` | `@math.gl/dggs` |
| `@math.gl/dggs/expressions` | `@math.gl/dggs` |
| `@math.gl/dggs/geohash` | `@math.gl/dggs` |
| `@math.gl/dggs/h3` | `@math.gl/dggs` |
| `@math.gl/dggs/plus-code` | `@math.gl/dggs` |
| `@math.gl/dggs/quadkey` | `@math.gl/dggs` |
| `@math.gl/dggs/s2` | `@math.gl/dggs` |
| `@math.gl/earth/geoid` | `@math.gl/earth` |
| `@math.gl/earth/sun/astronomy` | `@math.gl/earth/sun` |
| `@math.gl/earth/sun/planets` | `@math.gl/earth/sun` |
| `@math.gl/earth/timezone/lookup` | `@math.gl/earth/timezone` |
| `@math.gl/earth/timezone/temporal` | `@math.gl/earth/timezone` |
| `@math.gl/geometry/culling/oriented-box-2d` | `@math.gl/geometry/culling` |
| `@math.gl/geometry/culling/queries` | `@math.gl/geometry/culling` |
| `@math.gl/geometry/curves` | `@math.gl/geometry` |
| `@math.gl/geometry/parametric` | `@math.gl/geometry` |
| `@math.gl/geometry/polygon` | `@math.gl/geometry` |
| `@math.gl/geometry/spatial-index` | `@math.gl/geometry` |
| `@math.gl/geometry/spatial-index/boxes` | `@math.gl/geometry` |
| `@math.gl/geometry/utils` | `@math.gl/geometry` |
| `@math.gl/geometry/utils/interpolate-packed-attributes` | `@math.gl/geometry` |
| `@math.gl/geospatial/coordinates` | `@math.gl/geospatial` |
| `@math.gl/geospatial/crs/metadata` | `@math.gl/geospatial/crs` |
| `@math.gl/geospatial/crs/proj-string` | `@math.gl/geospatial/crs` |
| `@math.gl/geospatial/crs/resolver` | `@math.gl/geospatial/crs` |
| `@math.gl/geospatial/crs/spatial-reference` | `@math.gl/geospatial/crs` |
| `@math.gl/geospatial/crs/wkt` | `@math.gl/geospatial/crs` |
| `@math.gl/geospatial/ellipsoid` | `@math.gl/geospatial` |
| `@math.gl/geospatial/expressions` | `@math.gl/geospatial` |
| `@math.gl/geospatial/geoarrow/builder` | `@math.gl/geospatial/geoarrow` |
| `@math.gl/geospatial/geoarrow/tessellation` | `@math.gl/geospatial/geoarrow` |
| `@math.gl/geospatial/geoarrow/wkb` | `@math.gl/geospatial/geoarrow` |
| `@math.gl/geospatial/geoarrow/worker` | `@math.gl/geospatial/geoarrow` |
| `@math.gl/geospatial/geodesic-buffer` | `@math.gl/geospatial` |
| `@math.gl/geospatial/geodesic-exact` | `@math.gl/geospatial` |
| `@math.gl/geospatial/geographic-atlas` | `@math.gl/geospatial` |
| `@math.gl/geospatial/geographic-cuts` | `@math.gl/geospatial` |
| `@math.gl/geospatial/globe` | `@math.gl/geospatial` |
| `@math.gl/geospatial/terrain/bounds` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/contour-paths` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/contour-simplify` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/contours` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/delatin` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/derivatives` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/geographic` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/geometry` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/martini` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/mesh` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/mesh-edges` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/mesh-error` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/mesh-stitch` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/packed` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/profile` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/profile-measure` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/slope-aspect` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/surface` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/tiled` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/terrain/vertex-tiles` | `@math.gl/geospatial/terrain` |
| `@math.gl/geospatial/tile-matrix` | `@math.gl/geospatial` |
| `@math.gl/geospatial/tiles` | `@math.gl/geospatial` |
| `@math.gl/geospatial/triaxial` | `@math.gl/geospatial` |
| `@math.gl/geospatial/web-mercator` | `@math.gl/geospatial` |
| `@math.gl/geospatial/wkb` | `@math.gl/geospatial` |

`@math.gl/geospatial/terrain`, `@math.gl/geospatial/crs`,
`@math.gl/geospatial/geoarrow`, `@math.gl/geometry/culling`,
`@math.gl/earth/sun`, and `@math.gl/earth/timezone` remain capability roots.
Their public APIs are also available as named exports from the package root.
The `@math.gl/earth/sun/stars` catalog entry and data asset paths remain.

Matrix, quaternion and vector modules share names such as `create` and
`multiply`. Import their namespaces from core, for example
`import {mat4, vec3} from '@math.gl/core'`. For fine-grained tree-shaking,
use prefixed named operations such as `mat4GetScaling` and `vec3Normalize`.
The former geometry-utils structural types `Geometry` and `GeometryAttribute`
are now `UtilityGeometry` and `UtilityGeometryAttribute`, avoiding collisions
with the existing geometry class and attribute type.

Named imports can be eliminated by ESM bundlers. Native Node ESM and CommonJS
load static root dependencies even when a single name is used. In particular,
`astronomy-engine` is now an Earth runtime dependency because astronomy
functions are synchronous root exports. No shader code is introduced.
