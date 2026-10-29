# Upgrade Guide

## Upgrading to v5.0[​](#upgrading-to-v50 "Direct link to Upgrading to v5.0")

Start with the package mapping below, then check the API changes for the modules you use. See [What’s New](https://visgl.github.io/math.gl/next/docs/whats-new.md#v50) for the highlights.

### Expression evaluation names[​](#expression-evaluation-names "Direct link to Expression evaluation names")

The v5 prerelease expression exports `eval` and `evalAsync` are renamed to `evaluate` and `evaluateAsync`. Update named imports and namespace calls from `@math.gl/core`. The old names are removed: `eval` cannot be used as a local binding in strict-mode modules, including generated namespace wrappers.

```
import {evaluate, parse} from '@math.gl/core';



const value = evaluate(parse('x * 2'), {x: 3});
```

### Grouped package subpaths[​](#grouped-package-subpaths "Direct link to Grouped package subpaths")

Install one of the six package roots listed below and update both dependencies and import specifiers. The unscoped `math.gl` package has been removed; use `@math.gl/core` instead.

Import `subdivideGlobeMesh` and its options from `@math.gl/geospatial`; they are no longer exported by polygon or geometry.

### Removed standalone packages[​](#removed-standalone-packages "Direct link to Removed standalone packages")

| Removed package           | Install                 | Import from                      |
| ------------------------- | ----------------------- | -------------------------------- |
| `@math.gl/types`          | `@math.gl/core`         | `@math.gl/core`                  |
| `@math.gl/expressions`    | `@math.gl/core`         | `@math.gl/core`                  |
| `@math.gl/geometry-utils` | `@math.gl/geometry`     | `@math.gl/geometry`              |
| `@math.gl/curves`         | `@math.gl/geometry`     | `@math.gl/geometry`              |
| `@math.gl/polygon`        | `@math.gl/geometry`     | `@math.gl/geometry`              |
| `@math.gl/culling`        | `@math.gl/geometry`     | `@math.gl/geometry/culling`      |
| `@math.gl/spatial-index`  | `@math.gl/geometry`     | `@math.gl/geometry`              |
| `@math.gl/crs`            | `@math.gl/geospatial`   | `@math.gl/geospatial/crs`        |
| `@math.gl/projection`     | `@math.gl/geospatial`   | `@math.gl/geospatial/projection` |
| `@math.gl/wkb`            | `@math.gl/geospatial`   | `@math.gl/geospatial`            |
| `@math.gl/geoarrow`       | `@math.gl/geospatial`   | `@math.gl/geospatial/geoarrow`   |
| `@math.gl/geoid`          | `@math.gl/earth`        | `@math.gl/earth`                 |
| `@math.gl/sun`            | `@math.gl/earth`        | `@math.gl/earth/sun`             |
| `@math.gl/timezone`       | `@math.gl/earth`        | `@math.gl/earth/timezone`        |
| `@math.gl/proj`           | `@math.gl/web-mercator` | `@math.gl/web-mercator`          |

Some nested entrypoints are consolidated, for example `@math.gl/crs/wkt` becomes `@math.gl/geospatial/crs`, and `@math.gl/timezone/lookup` becomes `@math.gl/earth/timezone`. DGGS expression helpers move from `@math.gl/expressions/dggs` to `@math.gl/dggs`.

### Polygon, culling, and viewport APIs[​](#polygon-culling-and-viewport-apis "Direct link to Polygon, culling, and viewport APIs")

| Removed API                                        | Replacement                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `_Polygon`                                         | `Polygon`                                                           |
| `WINDING.CLOCKWISE`, `.COUNTER_CLOCKWISE`, `.NONE` | `'clockwise'`, `'counter-clockwise'`, `'none'` (`WindingDirection`) |
| `INTERSECTION.OUTSIDE`, `.INTERSECTING`, `.INSIDE` | `'outside'`, `'intersecting'`, `'inside'` (`CullingResult`)         |
| `viewport.getLocationAtPoint(options)`             | `viewport.getMapCenterByLngLatPosition(options)`                    |

### Optional ellipsoid and OBB operations[​](#optional-ellipsoid-and-obb-operations "Direct link to Optional ellipsoid and OBB operations")

Frame and quaternion helpers are standalone named exports so unused operations can be removed from bundles.

| Removed API                                                      | Replacement                                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ellipsoid.eastNorthUpToFixedFrame(origin, result)`              | `eastNorthUpToFixedFrame(ellipsoid, origin, result)` from `@math.gl/geospatial`                             |
| `ellipsoid.localFrameToFixedFrame(a, b, c, origin, result)`      | `localFrameToFixedFrame(ellipsoid, a, b, c, origin, result)` from `@math.gl/geospatial`                     |
| `box.quaternion`                                                 | `getOrientedBoundingBoxQuaternion(box)` from `@math.gl/geometry/culling`                                    |
| `box.fromCenterHalfSizeQuaternion(center, halfSize, quaternion)` | `makeOrientedBoundingBoxFromQuaternion(center, halfSize, quaternion, box)` from `@math.gl/geometry/culling` |

Frame functions preserve the original matrix conventions and return a new `Matrix4` when the result is omitted. The OBB factory allocates a new box when its optional result is omitted.

### TypeScript and runtime support[​](#typescript-and-runtime-support "Direct link to TypeScript and runtime support")

* Use TypeScript 6.0 or later for the `Float16Array` declarations.
* `Float16Array` is optional at runtime. `getFloat16ArrayConstructor()` falls back to `Uint16Array`, which does not encode or decode float16 values. No polyfill is installed.
* JavaScript still targets ES2020; supported browsers and Node.js versions are unchanged.

### Rotation and coordinate conversions[​](#rotation-and-coordinate-conversions "Direct link to Rotation and coordinate conversions")

* Replace `euler.getQuaternion()` and `euler.toQuaternion()` with `quaternion.fromEuler(euler)` or `new Quaternion().fromEuler(euler)`.
* Replace `quaternion.transformVector4(vector, result)` with `result.copy(vector).transformByQuaternion(quaternion)` for `Vector4` results, or `transformQuat(result, vector, quaternion)` from `@math.gl/core` for arrays.
* Replace `quaternion.slerp({start, target, ratio})` with `quaternion.slerp(start, target, ratio)`.
* `SphericalCoordinates` conversions use `Vector3Like`. `toVector3()` returns an array by default; pass a result argument to reuse a vector or typed array.

Euler rotation orders are now represented directly by the `EulerRotationOrder` string type:

| Removed API                                                                  | Replacement                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------- |
| `Euler.XYZ`, `Euler.XZY`, `Euler.YXZ`, `Euler.YZX`, `Euler.ZXY`, `Euler.ZYX` | The corresponding lowercase string, such as `'xyz'` |
| `Euler.RollPitchYaw`, `Euler.DefaultOrder`                                   | `'zyx'`                                             |
| `Euler.RotationOrders`, `Euler.rotationOrder()`                              | An `EulerRotationOrder` string directly             |

### Removed core compatibility APIs[​](#removed-core-compatibility-apis "Direct link to Removed core compatibility APIs")

| Removed API                                                             | Replacement                                                                                                 |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `_Euler`, `_Pose`, `_SphericalCoordinates`                              | `Euler`, `Pose`, `SphericalCoordinates`                                                                     |
| `new Matrix3(m00, ...m22)`                                              | `new Matrix3([m00, ...m22])`                                                                                |
| `mathArray.toFloat32Array()`                                            | `new Float32Array(mathArray)`                                                                               |
| `mathArray.elements`                                                    | `mathArray` (the classes extend `Array`)                                                                    |
| `mathArray.sub(value)`                                                  | `mathArray.subtract(value)`                                                                                 |
| `mathArray.setScalar(value)`                                            | `mathArray.fill(value)`                                                                                     |
| `mathArray.multiplyScalar(value)`                                       | `mathArray.multiplyByScalar(value)`                                                                         |
| `mathArray.divideScalar(value)`                                         | `mathArray.multiplyByScalar(1 / value)`                                                                     |
| `mathArray.addScalar()`, `subScalar()`, `clampScalar()`                 | Use `add()`, `subtract()`, or `clamp()` with matching arrays, or update the elements explicitly             |
| `Matrix3.transformVector()`, `transformVector2()`, `transformVector3()` | `Matrix3.transform()`                                                                                       |
| `Matrix4.transformPoint()`, `transformVector()`                         | `Matrix4.transformAsPoint()` for two- and three-element inputs, or `Matrix4.transform()` for general inputs |
| `Matrix4.transformDirection()`                                          | `Matrix4.transformAsVector()`                                                                               |
| `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`                 | The corresponding `Math` function for scalars; map it over arrays explicitly                                |

### Low-level function imports[​](#low-level-function-imports "Direct link to Low-level function imports")

Low-level `mat3`, `mat4`, `quat`, `vec2`, `vec3`, and `vec4` namespaces are named exports from `@math.gl/core`. The former individual low-level subpaths are no longer exported.

```
import {mat4, vec3} from '@math.gl/core';
```

### CRS and proj4 definitions[​](#crs-and-proj4-definitions "Direct link to CRS and proj4 definitions")

* Import CRS types, syntax codecs, and spatial-reference descriptors from `@math.gl/geospatial/crs`. Authority codes, WKT, and PROJ definitions remain strings.

* Rename `@math.gl/proj4` imports and dependencies to `@math.gl/geospatial/projection`, and create transforms with `projectionEngine.createProjection({from, to})` instead of `new Proj4Projection(...)`. The alias, `/classic`, and proj4js helpers are removed; install `proj4` directly for its API.

* Use `ProjectionTransform` for a configured CRS pair and `ConfigurableProjectionEngine` for reusable configuration and `checkProjectionCompatibility()` for capability checks. See the [migration contract](https://visgl.github.io/math.gl/next/docs/modules/geospatial/projection/support.md).

* Axis-order enforcement remains opt-in through `enforceAxis: true`. Prepare NTv2 grids with `parseNTv2Grid()` and register them on an engine through `datumGrids` before using definitions that reference them.

### DGGS packages[​](#dggs-packages "Direct link to DGGS packages")

* Replace `@math.gl/dggs-s2`, `@math.gl/dggs-geohash`, and `@math.gl/dggs-quadkey` with `@math.gl/dggs` subpaths `/s2`, `/geohash`, and `/quadkey`.
* Additional decoders are available at `/a5`, `/h3`, and `/plus-code`.
* Each decoder implements the shared `DGGSDecoder` API.
* `DGGSDecoder` cell geometry methods accept `string | bigint`; A5, H3, and S2 support both representations.
* Replace standalone calls such as `getS2LngLat(...)` with `S2Decoder.cellToLngLat(...)`.

## Upgrading to v4.1[​](#upgrading-to-v41 "Direct link to Upgrading to v4.1")

* The `NumberArray` type now only covers classic JavaScript arrays `number[]`, not typed arrays. Use `NumericArray` to cover both classic and typed arrays.
* `isTypedArray()`, `isNumericArray()` - These utilities now return booleans rather than a typecasted input, but instead perform type narrowing, meaning that code after a check does not need a cast.

## Upgrading to v4.0[​](#upgrading-to-v40 "Direct link to Upgrading to v4.0")

* math.gl v4.0 is now packaged as ESM modules, but with additional CommonJS exports. In most cases you should not have problems importing 4.0.
* The `gl-matrix` dependency has been removed. You can still install / import gl-matrix in your application, it should remain highly compatible with math.gl.

## Upgrading to v3.6[​](#upgrading-to-v36 "Direct link to Upgrading to v3.6")

In version 3.6 the entire math.gl code base was converted to TypeScript (`.ts`). While the API itself has not changed, in some cases, the introduction of types made it harder to keep supporting some type signatures and overloads.

Known changes

* `Matrix4.lookAt()` - Now only accepts named parameters.
* `SphericalCoordinates()` - Constructor is now more restrictive in terms of what parameters it accepts.

Note that some omissions may be unintentional, feel free to report upgrade issues in the math.gl github repo.

## Upgrading to v3.0[​](#upgrading-to-v30 "Direct link to Upgrading to v3.0")

* Matrix setters require all parameters.
* `Matrix3` and `Matrix4` transforms return plain arrays by default. Pass a result vector to retain the previous behavior:

```
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

## Upgrading to v2.0[​](#upgrading-to-v20 "Direct link to Upgrading to v2.0")

Experimental exports are now exported with a leading underscore (\_), instead of as members of the `experimental` namespace:

NOW: math.gl v2

```
import {_Euler as Euler} from '@math.gl/core';
```

BEFORE: math.gl v1.x

```
import {experimental} from '@math.gl/core';

const {Euler} = experimental;
```

The `experimental` name space export has been removed.

## Upgrading to v1.1[​](#upgrading-to-v11 "Direct link to Upgrading to v1.1")

### Removed Functionality[​](#removed-functionality "Direct link to Removed Functionality")

The `Euler` class is no longer included as an experimental export. It would need to be imported from the `dist` folder.
