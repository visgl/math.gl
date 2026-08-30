# Bundling

math.gl is published as tree-shakeable ES modules. Application bundle size depends on the APIs imported, the methods used, the bundler configuration, and the compression applied by the server.

Always assess math.gl's impact using a minified production build of the actual application. The installed package size, TypeScript source size, and development bundles are not useful estimates of the bytes delivered to users.

## Importing core classes

Use named imports from `@math.gl/core`:

```js
import {Matrix4, Vector3} from '@math.gl/core';
```

Modern production bundlers can then remove unused classes and methods. Avoid retaining the complete package namespace in application state or passing it through APIs, since that can make every export observable and prevent tree-shaking.

The low-level gl-matrix-compatible functions are intentionally separate from the root entry point in v5. Import only the module needed by the application:

```js
import * as mat4 from '@math.gl/core/mat4';
import * as vec3 from '@math.gl/core/vec3';
```

Available low-level subpaths are `/mat3`, `/mat4`, `/quat`, `/vec2`, `/vec3`, and `/vec4`.

## Core class bundle sizes

The following v5 reference measurements use esbuild 0.28.1 with minification and tree-shaking enabled, ES module output, and browser targets Chrome 110, Firefox 110, and Safari 15. Transfer sizes use gzip level 9 and Brotli quality 11. Values are decimal KB, where 1 KB is 1,000 bytes.

Each named-import fixture constructs one instance from the public `@math.gl/core` entry point. The full public-entry fixture retains every root runtime export. These are stable comparison fixtures, not predictions for every application bundle.

| v5 fixture | Minified | gzip | Brotli |
| --- | ---: | ---: | ---: |
| `Vector2` | 5.75 KB | 1.82 KB | 1.63 KB |
| `Vector3` | 7.45 KB | 2.39 KB | 2.12 KB |
| `Vector4` | 6.08 KB | 2.08 KB | 1.84 KB |
| `Matrix3` | 7.83 KB | 2.79 KB | 2.40 KB |
| `Matrix4` | 15.73 KB | 5.42 KB | 4.43 KB |
| `Quaternion` | 8.60 KB | 2.92 KB | 2.60 KB |
| `Euler` | 7.97 KB | 2.69 KB | 2.38 KB |
| `SphericalCoordinates` | 3.00 KB | 1.26 KB | 1.16 KB |
| `Pose` | 26.10 KB | 8.05 KB | 6.68 KB |
| Full public entry | 41.62 KB | 11.90 KB | 9.96 KB |

`Pose` intentionally composes several lower-level classes, so it retains more code than a single vector or rotation representation. Applications that only need one representation should import that class directly.

## v5 improvements

Compared with the same fixtures built from math.gl v4.1.0, every measured core class is smaller. The largest reductions come from removing deprecated root namespaces, making conversions destination-owned, and replacing runtime peer-class dependencies with structural types and direct calculations.

| Fixture | v4.1 gzip | v5 gzip | Reduction |
| --- | ---: | ---: | ---: |
| `Vector2` | 2.06 KB | 1.82 KB | 12% |
| `Vector3` | 2.63 KB | 2.39 KB | 9% |
| `Vector4` | 2.32 KB | 2.08 KB | 10% |
| `Matrix3` | 3.08 KB | 2.79 KB | 9% |
| `Matrix4` | 5.75 KB | 5.42 KB | 6% |
| `Quaternion` | 4.10 KB | 2.92 KB | 29% |
| `Euler` | 5.67 KB | 2.69 KB | 53% |
| `SphericalCoordinates` | 3.29 KB | 1.26 KB | 62% |
| `Pose` | 10.39 KB | 8.05 KB | 23% |
| Full public entry | 18.96 KB | 11.90 KB | 37% |

In particular, `SphericalCoordinates` now accepts the structural `Vector3Like` type and performs its conversions directly. It no longer imports the `Vector3` class or the low-level `vec3` namespace at runtime.

## Interpreting bundle numbers

- Minified size is useful for attributing code and comparing implementation changes.
- gzip approximates transfer size when a server uses gzip compression.
- Brotli is often smaller for static assets and is worth enabling in production.
- Source maps are excluded and should normally be delivered only when requested by developer tooling.
- Different bundlers, targets, minifiers, dependency versions, and chunk boundaries produce different results. Treat the values above as regression references rather than universal costs.

Tree-shaking operates on the complete application graph. A source file that looks large on disk may add little when only one export is reachable, while a small static import can retain a larger class hierarchy. Compare production bundle analyzer output before and after changing imports.
