# Upgrade Guide

## Upgrading to v5.0

Start with the package mapping below, then check the API changes for the modules you use. See [What’s New](./whats-new.md#v50) for the highlights.

### Migrating to root exports

The APIs below moved to package or capability roots. The old API subpaths are no
longer exported; update imports before upgrading. Existing named symbols and public
types remain available at the destination, except for the explicitly renamed type
collisions below. Projection catalogs and data assets retain their paths.

| Previous import | New import |
| --- | --- |
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
| `@math.gl/geospatial/crs` | `@math.gl/geospatial/crs` |
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

### Expression imports and evaluation names

Import expression APIs and types from `@math.gl/core/expressions`. If you used
the package root in an earlier v5 prerelease, update the import specifier.

The v5 prerelease expression exports `eval` and `evalAsync` are renamed to
`evaluate` and `evaluateAsync`. Update named imports and namespace calls. The old names are removed: `eval` cannot be used as a local
binding in strict-mode modules, including generated namespace wrappers.

```ts
import {evaluate, parse} from '@math.gl/core/expressions';

const value = evaluate(parse('x * 2'), {x: 3});
```

### Grouped package subpaths

Install one of the six package roots listed below and update both dependencies and import specifiers. The unscoped `math.gl` package has been removed; use `@math.gl/core` instead.

Import `subdivideGlobeMesh` and its options from `@math.gl/geospatial`; they are no longer exported by polygon or geometry.

### Removed standalone packages

| Removed package | Install | Import from |
| --- | --- | --- |
| `@math.gl/types` | `@math.gl/core` | `@math.gl/core` |
| `@math.gl/expressions` | `@math.gl/core` | `@math.gl/core/expressions` |
| `@math.gl/geometry-utils` | `@math.gl/geometry` | `@math.gl/geometry` |
| `@math.gl/curves` | `@math.gl/geometry` | `@math.gl/geometry` |
| `@math.gl/polygon` | `@math.gl/geometry` | `@math.gl/geometry` |
| `@math.gl/culling` | `@math.gl/geometry` | `@math.gl/geometry/culling` |
| `@math.gl/spatial-index` | `@math.gl/geometry` | `@math.gl/geometry` |
| `@math.gl/crs` | `@math.gl/geospatial` | `@math.gl/geospatial/crs` |
| `@math.gl/projection` | `@math.gl/geospatial` | `@math.gl/geospatial/projection` |
| `@math.gl/wkb` | `@math.gl/geospatial` | `@math.gl/geospatial` |
| `@math.gl/geoarrow` | `@math.gl/geospatial` | `@math.gl/geospatial/geoarrow` |
| `@math.gl/geoid` | `@math.gl/earth` | `@math.gl/earth` |
| `@math.gl/sun` | `@math.gl/earth` | `@math.gl/earth/sun` |
| `@math.gl/timezone` | `@math.gl/earth` | `@math.gl/earth/timezone` |
| `@math.gl/proj` | `@math.gl/web-mercator` | `@math.gl/web-mercator` |

Some nested entrypoints are consolidated, for example `@math.gl/crs/wkt` becomes
`@math.gl/geospatial/crs`, and `@math.gl/timezone/lookup` becomes
`@math.gl/earth/timezone`. DGGS expression helpers move from
`@math.gl/expressions/dggs` to `@math.gl/dggs`.

### Polygon, culling, and viewport APIs

| Removed API | Replacement |
| --- | --- |
| `_Polygon` | `Polygon` |
| `WINDING.CLOCKWISE`, `.COUNTER_CLOCKWISE`, `.NONE` | `'clockwise'`, `'counter-clockwise'`, `'none'` (`WindingDirection`) |
| `INTERSECTION.OUTSIDE`, `.INTERSECTING`, `.INSIDE` | `'outside'`, `'intersecting'`, `'inside'` (`CullingResult`) |
| `viewport.getLocationAtPoint(options)` | `viewport.getMapCenterByLngLatPosition(options)` |

### Optional ellipsoid and OBB operations

Frame and quaternion helpers are standalone named exports so unused operations can be removed from bundles.

| Removed API | Replacement |
| --- | --- |
| `ellipsoid.eastNorthUpToFixedFrame(origin, result)` | `eastNorthUpToFixedFrame(ellipsoid, origin, result)` from `@math.gl/geospatial` |
| `ellipsoid.localFrameToFixedFrame(a, b, c, origin, result)` | `localFrameToFixedFrame(ellipsoid, a, b, c, origin, result)` from `@math.gl/geospatial` |
| `box.quaternion` | `getOrientedBoundingBoxQuaternion(box)` from `@math.gl/geometry/culling` |
| `box.fromCenterHalfSizeQuaternion(center, halfSize, quaternion)` | `makeOrientedBoundingBoxFromQuaternion(center, halfSize, quaternion, box)` from `@math.gl/geometry/culling` |

Frame functions preserve the original matrix conventions and return a new `Matrix4` when the result is omitted.
The OBB factory allocates a new box when its optional result is omitted.

### TypeScript and runtime support

- Use TypeScript 6.0 or later for the `Float16Array` declarations.
- `Float16Array` is optional at runtime. `getFloat16ArrayConstructor()` falls back to `Uint16Array`, which does not encode or decode float16 values. No polyfill is installed.
- JavaScript still targets ES2020; supported browsers and Node.js versions are unchanged.

### Rotation and coordinate conversions

- Replace `euler.getQuaternion()` and `euler.toQuaternion()` with `quaternion.fromEuler(euler)` or `new Quaternion().fromEuler(euler)`.
- Replace `quaternion.transformVector4(vector, result)` with `result.copy(vector).transformByQuaternion(quaternion)` for `Vector4` results, or `transformQuat(result, vector, quaternion)` from `@math.gl/core` for arrays.
- Replace `quaternion.slerp({start, target, ratio})` with `quaternion.slerp(start, target, ratio)`.
- `SphericalCoordinates` conversions use `Vector3Like`. `toVector3()` returns an array by default; pass a result argument to reuse a vector or typed array.

Euler rotation orders are now represented directly by the `EulerRotationOrder` string type:

| Removed API | Replacement |
| --- | --- |
| `Euler.XYZ`, `Euler.XZY`, `Euler.YXZ`, `Euler.YZX`, `Euler.ZXY`, `Euler.ZYX` | The corresponding lowercase string, such as `'xyz'` |
| `Euler.RollPitchYaw`, `Euler.DefaultOrder` | `'zyx'` |
| `Euler.RotationOrders`, `Euler.rotationOrder()` | An `EulerRotationOrder` string directly |

### Removed core compatibility APIs

| Removed API | Replacement |
| --- | --- |
| `_Euler`, `_Pose`, `_SphericalCoordinates` | `Euler`, `Pose`, `SphericalCoordinates` |
| `new Matrix3(m00, ...m22)` | `new Matrix3([m00, ...m22])` |
| `mathArray.toFloat32Array()` | `new Float32Array(mathArray)` |
| `mathArray.elements` | `mathArray` (the classes extend `Array`) |
| `mathArray.sub(value)` | `mathArray.subtract(value)` |
| `mathArray.setScalar(value)` | `mathArray.fill(value)` |
| `mathArray.multiplyScalar(value)` | `mathArray.multiplyByScalar(value)` |
| `mathArray.divideScalar(value)` | `mathArray.multiplyByScalar(1 / value)` |
| `mathArray.addScalar()`, `subScalar()`, `clampScalar()` | Use `add()`, `subtract()`, or `clamp()` with matching arrays, or update the elements explicitly |
| `Matrix3.transformVector()`, `transformVector2()`, `transformVector3()` | `Matrix3.transform()` |
| `Matrix4.transformPoint()`, `transformVector()` | `Matrix4.transformAsPoint()` for two- and three-element inputs, or `Matrix4.transform()` for general inputs |
| `Matrix4.transformDirection()` | `Matrix4.transformAsVector()` |
| `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()` | The corresponding `Math` function for scalars; map it over arrays explicitly |

### Low-level function imports

Low-level `mat3`, `mat4`, `quat`, `vec2`, `vec3`, and `vec4` namespaces are named exports from `@math.gl/core`. The former individual low-level subpaths are no longer exported.

```js
import {mat4, vec3} from '@math.gl/core';
```

### CRS and proj4 definitions

- Import CRS types, syntax codecs, and spatial-reference descriptors from `@math.gl/geospatial/crs`. Authority codes, WKT, and PROJ definitions remain strings.
- Rename `@math.gl/proj4` imports and dependencies to `@math.gl/geospatial/projection`, and create transforms with `projectionEngine.createProjection({from, to})` instead of `new Proj4Projection(...)`. The alias, `/classic`, and proj4js helpers are removed; install `proj4` directly for its API.
- Use `ProjectionTransform` for a configured CRS pair and `ConfigurableProjectionEngine` for reusable configuration and `checkProjectionCompatibility()` for capability checks. See the [migration contract](./modules/geospatial/projection/developer-guide/support.md).

- Axis-order enforcement remains opt-in through `enforceAxis: true`. Prepare NTv2 grids with `parseNTv2Grid()` and register them on an engine through `datumGrids` before using definitions that reference them.

### DGGS packages

- Replace `@math.gl/dggs-s2`, `@math.gl/dggs-geohash`, and `@math.gl/dggs-quadkey` with `@math.gl/dggs` subpaths `/s2`, `/geohash`, and `/quadkey`.
- Additional decoders are available at `/a5`, `/h3`, and `/plus-code`.
- Each decoder implements the shared `DGGSDecoder` API.
- `DGGSDecoder` cell geometry methods accept `string | bigint`; A5, H3, and S2 support both representations.
- Replace standalone calls such as `getS2LngLat(...)` with `S2Decoder.cellToLngLat(...)`.

## Upgrading to v4.1

- The `NumberArray` type now only covers classic JavaScript arrays `number[]`, not typed arrays. Use `NumericArray` to cover both classic and typed arrays.
- `isTypedArray()`, `isNumericArray()` - These utilities now return booleans rather than a typecasted input, but instead perform type narrowing, meaning that code after a check does not need a cast.

## Upgrading to v4.0

- math.gl v4.0 is now packaged as ESM modules, but with additional CommonJS exports. In most cases you should not have problems importing 4.0.
- The `gl-matrix` dependency has been removed. You can still install / import gl-matrix in your application, it should remain highly compatible with math.gl.

## Upgrading to v3.6

In version 3.6 the entire math.gl code base was converted to TypeScript (`.ts`).
While the API itself has not changed, in some cases, the introduction of types
made it harder to keep supporting some type signatures and overloads.

Known changes

- `Matrix4.lookAt()` - Now only accepts named parameters.
- `SphericalCoordinates()` - Constructor is now more restrictive in terms of what parameters it accepts.

Note that some omissions may be unintentional, feel free to report upgrade issues
in the math.gl github repo.

## Upgrading to v3.0

- Matrix setters require all parameters.
- `Matrix3` and `Matrix4` transforms return plain arrays by default. Pass a result vector to retain the previous behavior:

```js
const vector = new Matrix4().transform([0, 0, 0, 1], new Vector4());
```

The following functions have been deprecated:

| Method                       | Replacement                 | Reason             |
| ---------------------------- | --------------------------- | ------------------ |
| `Matrix*.setColumnMajor`     | `Matrix*.set`               | API simplification |
| `Matrix4.transformPoint`     | `Matrix4.transform`         | Name alignment     |
| `Matrix4.transformVector`    | `Matrix4.transform`         | Name alignment     |
| `Matrix4.transformDirection` | `Matrix4.transformAsVector` | Name alignment     |
| `Matrix3.transformVector`    | `Matrix3.transform`         | Name alignment     |
| `Matrix3.transformVector2`   | `Matrix3.transform`         | Generalize         |
| `Matrix3.transformVector3`   | `Matrix3.transform`         | Generalize         |

The following functions have been removed:

| Method          | Replacement     | Reason                                                      |
| --------------- | --------------- | ----------------------------------------------------------- |
| `Vector2.cross` | `Vector3.cross` | Cross products by definition work on 3 dimensional vectors. |

## Upgrading to v2.0

Experimental exports are now exported with a leading underscore (\_), instead of as members of the `experimental` namespace:

NOW: math.gl v2

```js
import {_Euler as Euler} from '@math.gl/core';
```

BEFORE: math.gl v1.x

```js
import {experimental} from '@math.gl/core';
const {Euler} = experimental;
```

The `experimental` name space export has been removed.

## Upgrading to v1.1

### Removed Functionality

The `Euler` class is no longer included as an experimental export. It would need to be imported from the `dist` folder.

## Affine extraction correctness

Rotation extraction now rejects singular, sheared, non-finite and projective matrices instead of returning invalid rotations. `mat4Decompose`, `mat4GetRotation`, `Matrix4.getRotation` and `Matrix4.getRotationMatrix3` support finite nonsingular affine TRS, including nonuniform scale and reflections. Reflections are represented with a negative X scale. Preserve original factors when exact original sign assignments matter. AABB transforms now rebuild enclosing bounds under rotation and shear and reject projective matrices.
