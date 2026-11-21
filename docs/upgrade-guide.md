# Upgrade Guide

## Upgrading to v5.0

Use this guide to upgrade from a stable math.gl 4.x release to 5.0. See
[What’s New](./whats-new.md#v50) for new capabilities.

### Package imports

Install packages by their npm names and import APIs from their feature subpaths. The
`@math.gl/tasks` package keeps its root import.

| 4.x import | 5.0 import |
| --- | --- |
| `@math.gl/core` or `math.gl` for vectors and matrices | `@math.gl/core/matrix` |
| `@math.gl/types` or `@math.gl/core` for shared types and guards | `@math.gl/core/types` |
| `@math.gl/polygon` | `@math.gl/geometry/polygon` |
| `@math.gl/culling` | `@math.gl/geometry/culling` |
| `@math.gl/geospatial` for `Ellipsoid` | `@math.gl/geospatial/ellipsoid` |
| `@math.gl/geospatial` for local reference frames | `@math.gl/geospatial/coordinates` |
| `@math.gl/geospatial` for region bounding boxes | `@math.gl/geospatial/globe` |
| `@math.gl/web-mercator` or `viewport-mercator-project` | `@math.gl/geospatial/web-mercator` |
| `@math.gl/proj4` | `@math.gl/geospatial/projection` |
| `@math.gl/geoid` | `@math.gl/earth/geoid` |
| `@math.gl/sun` | `@math.gl/earth/sun` |
| `@math.gl/dggs-s2`, `@math.gl/dggs-geohash`, `@math.gl/dggs-quadkey` | `@math.gl/dggs/s2`, `@math.gl/dggs/geohash`, `@math.gl/dggs/quadkey` |

### Upgrading from a 5.0 prerelease

Split root imports across the [package entry points](./README.md#npm-packages). For
example, import `queryArrowSQL` from `@math.gl/sql/query`, `SphereGeometry` from
`@math.gl/geometry/primitives`, and `DGGS_DECODERS` from `@math.gl/dggs/decoders`.
For Earth namespace imports, use `import * as sun from '@math.gl/earth/sun'` and
apply the same pattern to geoid and timezone.

Replace slashes within an exported subpath with hyphens. For example,
`@math.gl/geospatial/projection/types` becomes `@math.gl/geospatial/projection-types`,
`@math.gl/geospatial/maps/presets` becomes `@math.gl/geospatial/maps-presets`, and
`@math.gl/earth/sun/stars` becomes `@math.gl/earth/sun-stars`. Use the
[projection entry point index](./modules/geospatial/projection/entry-points.md)
and [kernel index](./modules/geospatial/projection/kernels.md) for exact names.

For Turf and PostGIS-style SQL function registration, replace
`@math.gl/geospatial/turf-expressions` with `@math.gl/geospatial/turf-functions`
and `@math.gl/geospatial/st-functions` as needed.

### Expressions and SQL package

Install [`@math.gl/sql`](./modules/sql/README.md) to query Arrow tables, parse SQL, or
evaluate expressions in 5.0. Install Apache Arrow 17 or later for execution.

### Geometry utilities

- Import `GeometryInput` in place of `UtilityGeometry`. Supply a string `topology` in place
  of numeric `mode`. For triangle meshes, use `topology: 'triangle-list'`.
- Pass a geometry object and optional `{start, end}` range to `makePrimitiveIterator`. The
  iterator yields `Primitive.type` as `'point-list'`, `'line-list'`, or `'triangle-list'`.
  Use `'line-loop'` and `'triangle-fan'` on inputs that require those expansions.
- The `GL`, `GL_TYPE`, `GL_PRIMITIVE`, `GL_PRIMITIVE_MODE`, and `GLType` exports were
  removed. Use typed-array constructors and their `BYTES_PER_ELEMENT` for component
  storage. Convert numeric enums where your renderer requires them.

### Polygon, culling, and viewport APIs

| Removed API | Replacement |
| --- | --- |
| `_Polygon` | `Polygon` |
| `WINDING.CLOCKWISE`, `.COUNTER_CLOCKWISE`, `.NONE` | `'clockwise'`, `'counter-clockwise'`, `'none'` (`WindingDirection`) |
| `INTERSECTION.OUTSIDE`, `.INTERSECTING`, `.INSIDE` | `'outside'`, `'intersecting'`, `'inside'` (`CullingResult`) |
| `viewport.getLocationAtPoint(options)` | `viewport.getMapCenterByLngLatPosition(options)` |

### Ellipsoid frame and oriented bounding box operations

Import ellipsoid frame helpers from `@math.gl/geospatial/coordinates` and oriented bounding box helpers
from `@math.gl/geometry/culling`.

| Removed API | Replacement |
| --- | --- |
| `ellipsoid.eastNorthUpToFixedFrame(origin, result)` | `eastNorthUpToFixedFrame(ellipsoid, origin, result)` from `@math.gl/geospatial/coordinates` |
| `ellipsoid.localFrameToFixedFrame(a, b, c, origin, result)` | `localFrameToFixedFrame(ellipsoid, a, b, c, origin, result)` from `@math.gl/geospatial/coordinates` |
| `box.quaternion` | `getOrientedBoundingBoxQuaternion(box)` |
| `box.fromCenterHalfSizeQuaternion(center, halfSize, quaternion)` | `makeOrientedBoundingBoxFromQuaternion(center, halfSize, quaternion, box)` |

Frame functions preserve the original matrix conventions and return a new `Matrix4` when the result is omitted.

### TypeScript and runtime support

- Use TypeScript 6.0 or later for the `Float16Array` declarations.
- `Float16Array` is optional at runtime. `getFloat16ArrayConstructor()` falls back to `Uint16Array`, which does not encode or decode float16 values. No polyfill is installed.
- JavaScript still targets ES2020; supported browsers and Node.js versions are unchanged.

### Rotation and coordinate conversions

- Replace `euler.getQuaternion()` and `euler.toQuaternion()` with `quaternion.fromEuler(euler)` or `new Quaternion().fromEuler(euler)`.
- Replace `quaternion.transformVector4(vector, result)` with `result.copy(vector).transformByQuaternion(quaternion)` for `Vector4` results, or `transformQuat(result, vector, quaternion)` from `@math.gl/core/matrix` for arrays.
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
| `Matrix3.INDICES`, `Matrix4.INDICES` instance getters | `matrix.getElement(row, column)` for reads or `matrix.getElementIndex(row, column)` for the flat array index |
| `Matrix3.transformVector()`, `transformVector2()`, `transformVector3()` | `Matrix3.transform()` |
| `Matrix4.transformPoint()`, `transformVector()` | `Matrix4.transformAsPoint()` for two- and three-element inputs, or `Matrix4.transform()` for general inputs |
| `Matrix4.transformDirection()` | `Matrix4.transformAsVector()` |
| `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()` | The corresponding `Math` function for scalars; map it over arrays explicitly |

### Low-level function imports

Low-level `mat3`, `mat4`, `quat`, `vec2`, `vec3`, and `vec4` namespaces are named exports from `@math.gl/core/matrix`.

```js
import {mat4, vec3} from '@math.gl/core/matrix';
```

### CRS and proj4 definitions

- Import CRS types, syntax codecs, and spatial-reference descriptors from `@math.gl/geospatial/crs`. Authority codes, WKT, and PROJ definitions remain strings.
- Rename `@math.gl/proj4` imports and dependencies to `@math.gl/geospatial/projection`, and create transforms with `projectionEngine.createProjection({from, to})` instead of `new Proj4Projection(...)`. The alias, `/classic`, and proj4js helpers are removed; install `proj4` directly for its API.
- Use `ProjectionTransform` for a configured CRS pair and `ConfigurableProjectionEngine` for reusable configuration and `checkProjectionCompatibility()` for capability checks. See the [projection support profile](./modules/geospatial/projection/developer-guide/support.md).

- Axis-order enforcement remains opt-in through `enforceAxis: true`. Prepare NTv2 grids with `parseNTv2Grid()` and register them on an engine through `datumGrids` before using definitions that reference them.

- Replace `new Projection(options)` with `projectionEngine.createProjection(options)`. Replace `new LazyProjection(options)` and `LazyProjection.create(options)` with `lazyProjectionEngine.createProjection(options)` and `lazyProjectionEngine.createProjectionAsync(options)`, respectively. Pass registrations to the engine constructor in place of static registration methods.
- Replace the alpha `TypeScriptProjection` export with `ProjectionTransform`. The associated names are `ProjectionTransformOptions`, `ProjectionTransformCreateOptions`, `ProjectionCompatibility`, and `checkProjectionCompatibility`.
- Import nested CRS syntax codecs and resolver APIs from the `@math.gl/geospatial/crs` entry point.

### Map preparation

Replace `@math.gl/geospatial/discontinuous` and map exports from
`@math.gl/geospatial/projection` with the `@math.gl/geospatial/maps` entry points.
Supply presets explicitly, import geometry and transitions as needed, and use
`prepareMapSurface(map, options)` in place of `map.prepareSurface(options)`.

### GeoArrow descriptors

Import physical descriptor helpers from `@math.gl/core/arrow` in place
of `@math.gl/core/arrow`.

### DGGS packages

- Import `S2Decoder`, `GeohashDecoder`, and `QuadkeyDecoder` from `@math.gl/dggs`.
- Each decoder implements the shared `DGGSDecoder` API.
- `DGGSDecoder` cell geometry methods accept `string | bigint`; A5, H3, and S2 support both representations.

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
import {_Euler as Euler} from '@math.gl/core/matrix';
```

BEFORE: math.gl v1.x

```js
import {experimental} from '@math.gl/core/matrix';
const {Euler} = experimental;
```

The `experimental` name space export has been removed.

## Upgrading to v1.1

### Removed Functionality

The `Euler` class is no longer included as an experimental export. It would need to be imported from the `dist` folder.

## Affine extraction correctness

Rotation extraction now rejects singular, sheared, non-finite and projective matrices instead of returning invalid rotations. `mat4Decompose`, `mat4GetRotation`, `Matrix4.getRotation` and `Matrix4.getRotationMatrix3` support finite nonsingular affine TRS, including nonuniform scale and reflections. Reflections are represented with a negative X scale. Preserve original factors when exact original sign assignments matter. AABB transforms now rebuild enclosing bounds under rotation and shear and reject projective matrices.

### Core and geospatial package consolidation

Install `@math.gl/core` in place of `@math.gl/arrow`, and `@math.gl/geospatial` in place of `@math.gl/web-mercator`. Tasks and DGGS remain separate packages.

| Previous import | Current import |
| --- | --- |
| `@math.gl/arrow`, `/geoarrow`, `/geoarrow-utils`, `/wkb` | `@math.gl/core/arrow` |
| `@math.gl/arrow/utf8` | `@math.gl/core/utf8` |
| `@math.gl/web-mercator` | `@math.gl/geospatial/web-mercator` |
| `@math.gl/sql/arrow-scales` | `@math.gl/sql/scales` |
| `@math.gl/geometry/color` | `@math.gl/core/color` |

Import vectors, matrices, and rotations from `@math.gl/core/matrix`. `@math.gl/core/color` provides reusable colors, scales, palettes, and LUTs. Import `parseSQLScaleExpression`, `parseSQLScaleAST`, and `ParsedSQLScale` from `@math.gl/sql/parser`. Use `@math.gl/sql/scales` for Arrow domain resolution and evaluation. If you imported reusable scale helpers or types from `@math.gl/sql/scales`, switch those imports to `@math.gl/core/color`.

Applications importing `@math.gl/core/arrow` install the optional `apache-arrow >=17` peer. Matrix, color, and UTF-8 consumers can omit it. Descriptor kernels retain their names; Arrow vector operations use `getGeoArrowVectorBounds`, `getGeoArrowVectorRowBounds`, `getGeoArrowVectorVertexCount`, `mapGeoArrowVectorCoordinates`, and `rewindGeoArrowVector` to distinguish them from descriptor kernels.

Import `tessellateGeoArrowPolygons` and `tessellateGeoArrowStream` from `@math.gl/geometry/arrow`. Arrow examples now live under `examples/core/`; Web Mercator examples live under `examples/geospatial/`.
