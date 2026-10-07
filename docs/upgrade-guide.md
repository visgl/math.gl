# Upgrade Guide

## Upgrading to v5.0

Version 5 removes deprecated APIs and moves low-level functions to focused subpath imports.

### TypeScript and runtime support

- Use TypeScript 6.0 or later for the `Float16Array` declarations.
- `Float16Array` is optional at runtime, with a `Uint16Array` fallback. No polyfill is installed.
- JavaScript still targets ES2020; supported browsers and Node.js versions are unchanged.

### Rotation and coordinate conversions

- Replace `euler.getQuaternion()` and `euler.toQuaternion()` with `quaternion.fromEuler(euler)` or `new Quaternion().fromEuler(euler)`.
- Replace `quaternion.transformVector4(vector, result)` with `result.copy(vector).transformByQuaternion(quaternion)` for `Vector4` results, or `transformQuat(result, vector, quaternion)` from `@math.gl/core/vec4` for arrays.
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

The deprecated `mat3`, `mat4`, `quat`, `vec2`, `vec3`, and `vec4` namespaces are no longer exported from the package root. Import only the low-level module that is needed:

```js
// v5
import * as mat4 from '@math.gl/core/mat4';
import * as vec3 from '@math.gl/core/vec3';

// v4
import {mat4, vec3} from '@math.gl/core';
```

Available subpaths: `@math.gl/core/mat3`, `/mat4`, `/quat`, `/vec2`, `/vec3`, and `/vec4`.

### CRS and proj4 definitions

- Import CRS types, syntax codecs, and spatial-reference descriptors from `@math.gl/crs`. Authority codes, WKT, and PROJ definitions remain strings.
- Rename `@math.gl/proj4` imports and dependencies to `@math.gl/projection`, and `Proj4Projection` to `Projection`. The alias, `/classic`, and proj4js helpers are removed; install `proj4` directly for its API.
- Use `ProjectionTransform` for a configured CRS pair and `CustomProjectionEngine` for reusable configuration and `checkProjectionCompatibility()` for capability checks. See the [migration contract](modules/projection/developer-guide/support.md).

- Axis-order enforcement remains opt-in through `enforceAxis: true`. Register NTv2 grids with `Projection.registerDatumGrid()` before using definitions that reference them.

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
