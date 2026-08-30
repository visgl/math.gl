# Upgrade Guide

## Upgrading to v5.0

Version 5 removes APIs that were deprecated in earlier releases and tightens the dependency boundaries between core classes. The class entry point remains tree-shakeable; low-level gl-matrix-compatible functions now use focused subpath imports.

### Rotation and coordinate conversions

- Replace `euler.getQuaternion()` and `euler.toQuaternion()` with the destination-owned `new Quaternion().fromEuler(euler)`. To reuse an allocation, call `quaternion.fromEuler(euler)` on an existing quaternion.
- Replace `quaternion.transformVector4(vector, result)` with `result.copy(vector).transformByQuaternion(quaternion)` when `result` is a `Vector4`. For a new result, use `new Vector4(vector).transformByQuaternion(quaternion)`. To retain a tuple or typed-array result, use `transformQuat(result, vector, quaternion)` from `@math.gl/core/vec4`.
- Replace `quaternion.slerp({start, target, ratio})` with `quaternion.slerp(start, target, ratio)`.
- `SphericalCoordinates.fromVector3()` and `toVector3()` now use the structural `Vector3Like` type. `toVector3()` returns a plain array by default; pass a `Vector3`, tuple, or typed array as its result argument when a particular representation should be reused.

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

The available subpaths are `@math.gl/core/mat3`, `/mat4`, `/quat`, `/vec2`, `/vec3`, and `/vec4`. Keeping these namespaces out of the root entry point substantially reduces the cost of retaining every root export.

### DGGS packages

- The individual DGGS packages `@math.gl/dggs-s2`, `@math.gl/dggs-geohash`, and `@math.gl/dggs-quadkey` have been removed. Install only `@math.gl/dggs` and use its `/s2`, `/geohash`, and `/quadkey` subpath exports.
- New `/a5`, `/h3`, and `/plus-code` subpath exports provide the same small cell-geometry contract for additional systems.
- The new module exports a decoder object for each DGGS. Each object conforms to the common `DGGSDecoder` API.
- `DGGSDecoder` cell geometry methods accept `string | bigint`; A5, H3, and S2 support both representations.
- To upgrade, import the decoder object and replace individual function calls. For example, replace `getS2LngLat(...)` with `S2Decoder.cellToLngLat(...)`.

## Upgrading to v4.1

- The `NumberArray` type now only covers classic JavaScript arrays `number[]`, not typed arrays. Use `NumericArray` to cover both classic and typed arrays.
- `isTypedArray()`, `isNumericArray()` - These utilities now return booleans rather than a typecasted input, but instead perform type narrowing, meaning that code after a check does not need a cast.

## Upgrading to v4.0

- math.gl v4.0 is now packaged as ESM modules, but with additional CommonJS exports. In most cases you should not have problems importing 4.0.
- The `gl-matrix` dependency has been removed. You can still install / import gl-matrix in your application, it should remain highly compatible with math.gl.

## Upgrading to v3.6

In version 3.6 the entire math.gl code base was converted to typescript (`.ts`).
While the API itself has not changed, in some cases, the introduction of types
made it harder to keep supporting some type signatures and overloads.

Known changes

- `Matrix4.lookAt()` - Now only accepts named parameters.
- `SphericalCoordinates()` - Constructor is now more restrictive in terms of what parameters it accepts.

Note that some omissions may be unintentional, feel free to report upgrade issues
in the math.gl github repo.

## Upgrading to v3.0

### Matrix API changes

Matrix setter functions no longer support ommitted parameters. (Motivation: Increased API rigor, improved debugging and library compactness).

### Matrix transforms now return Arrays by default

The `Matrix4` and `Matrix3` classes no longer by default create new `Vector2`, `Vector3` and `Vector4` instances. Instead they create standard JavaScript arrays.

Previously a new `Vector4` would be allocated if no `result` parameter was provided.

```js
import {Matrix4, Vector4} from '@math.gl/core';
const vector = new Matrix4().transform([0, 0, 0, 1]);
assert(vector instanceof Vector4);
```

Now a plain JavaScript `Array` is allocated

```js
import {Matrix4} from '@math.gl/core';
const vector = new Matrix4().transform([0, 0, 0, 1]);
assert(vector instanceof Array);
```

The old behavior can be restored by providing the result parameter

```js
import {Matrix4, Vector4} from '@math.gl/core';
const vector = new Matrix4().transform([0, 0, 0, 1], new Vector4());
assert(vector instanceof Vector4);
```

Motivation: This change reduces dependencies between math.gl core classes which improves tree-shaking and bundle sizes.

### Matrix setter functions no longer support ommitted parameters

Motivation: This change increases rigor, facilitates debugging, and improves library compactness, and the use case for default parameters was questionable.

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
