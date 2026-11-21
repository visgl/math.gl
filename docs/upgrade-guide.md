# Upgrade Guide

## Upgrading to v5.0[​](#upgrading-to-v50 "Direct link to Upgrading to v5.0")

This section covers upgrades from math.gl 4.x to 5.0. Use TypeScript 6.0 or later to consume the v5 declarations. See [What's New](https://visgl.github.io/math.gl/docs/whats-new.md#v50) for new features.

caution

Manual upgrade is not recommended for v5. Packages and import structure have changed. AI assistance is preferable.

### Package imports[​](#package-imports "Direct link to Package imports")

Update your dependencies to the npm packages shown below, then import from the specified subpaths. For example, install `@math.gl/geometry` to use `@math.gl/geometry/polygon`.

| v4 import                                                                         | v5 import                                                                                                                    |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `@math.gl/core` or `math.gl` for vectors, matrices, rotations, and math utilities | [`@math.gl/core/matrix`](https://visgl.github.io/math.gl/docs/modules/core/matrix.md)                                |
| `@math.gl/types` or `@math.gl/core` for shared array and bounds types and guards  | [`@math.gl/core/types`](https://visgl.github.io/math.gl/docs/modules/core/types.md)                                  |
| `@math.gl/polygon`                                                                | [`@math.gl/geometry/polygon`](https://visgl.github.io/math.gl/docs/modules/geometry/polygon.md)                      |
| `@math.gl/culling`                                                                | [`@math.gl/geometry/culling`](https://visgl.github.io/math.gl/docs/modules/geometry/culling.md)                      |
| `@math.gl/geospatial` for `Ellipsoid` and `isWGS84`                               | [`@math.gl/geospatial/ellipsoid`](https://visgl.github.io/math.gl/docs/modules/geospatial/entry-points/ellipsoid.md) |
| `@math.gl/web-mercator` or `viewport-mercator-project`                            | [`@math.gl/geospatial/web-mercator`](https://visgl.github.io/math.gl/docs/modules/geospatial/web-mercator.md)        |
| `@math.gl/proj4`                                                                  | [`@math.gl/geospatial/projection`](https://visgl.github.io/math.gl/docs/modules/geospatial/projection.md)            |
| `@math.gl/geoid`                                                                  | [`@math.gl/earth/geoid`](https://visgl.github.io/math.gl/docs/modules/earth/geoid.md)                                |
| `@math.gl/sun`                                                                    | [`@math.gl/earth/sun`](https://visgl.github.io/math.gl/docs/modules/earth/sun.md)                                    |
| `@math.gl/dggs-s2`, `@math.gl/dggs-geohash`, `@math.gl/dggs-quadkey`              | `@math.gl/dggs/s2`, `@math.gl/dggs/geohash`, `@math.gl/dggs/quadkey`                                                         |

### Matrix and rotation code[​](#matrix-and-rotation-code "Direct link to Matrix and rotation code")

| v4 API                                                                  | v5 replacement                                                                                                                         |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `_Euler`, `_Pose`, `_SphericalCoordinates`                              | `Euler`, `Pose`, `SphericalCoordinates`                                                                                                |
| `Euler.XYZ` and other order constants                                   | Lowercase order strings such as `'xyz'`. The default and roll-pitch-yaw order is `'zyx'`.                                              |
| `euler.getQuaternion()`, `euler.toQuaternion()`                         | `new Quaternion().fromEuler(euler)`                                                                                                    |
| `quaternion.slerp({start, target, ratio})`                              | `quaternion.slerp(start, target, ratio)`                                                                                               |
| `quaternion.transformVector4(vector, result)`                           | `result.copy(vector).transformByQuaternion(quaternion)` for a `Vector4`, or `vec4TransformQuat(result, vector, quaternion)` for arrays |
| `new Matrix3(m00, ...m22)`                                              | `new Matrix3([m00, ...m22])`                                                                                                           |
| `Matrix3.transformVector()`, `transformVector2()`, `transformVector3()` | `Matrix3.transform()`                                                                                                                  |
| `Matrix4.transformPoint()`, `transformDirection()`, `transformVector()` | `transformAsPoint()`, `transformAsVector()`, `transform()`                                                                             |
| Matrix `INDICES` getters                                                | `getElement(row, column)` or `getElementIndex(row, column)`                                                                            |
| `mathArray.elements`, `mathArray.toFloat32Array()`                      | The array itself, or `new Float32Array(mathArray)`                                                                                     |
| `mathArray.sub()`, `setScalar()`, `multiplyScalar()`                    | `subtract()`, `fill()`, `multiplyByScalar()`                                                                                           |
| `mathArray.divideScalar(x)`                                             | `mathArray.multiplyByScalar(1 / x)`                                                                                                    |
| `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`                 | Use the corresponding `Math` function. Apply it to each element for array inputs.                                                      |

Rotation extraction from an affine matrix rejects singular, sheared, non-finite, and projective inputs. Reflections are represented with a negative X scale.

### Geometry and geospatial code[​](#geometry-and-geospatial-code "Direct link to Geometry and geospatial code")

* Use `Polygon` in place of `_Polygon`. Replace `WINDING` and `INTERSECTION` constants with string values, such as `'clockwise'` and `'inside'`.
* Import `eastNorthUpToFixedFrame` and `localFrameToFixedFrame` from `@math.gl/geospatial/coordinates`. Pass the ellipsoid as the first argument.
* Replace `box.quaternion` with `getOrientedBoundingBoxQuaternion(box)` and `box.fromCenterHalfSizeQuaternion(center, halfSize, quaternion)` with `makeOrientedBoundingBoxFromQuaternion(center, halfSize, quaternion, box)`. Both functions are in `@math.gl/geometry/culling`.
* Rename `viewport.getLocationAtPoint(options)` to `viewport.getMapCenterByLngLatPosition(options)`.
* Replace `new Proj4Projection({from, to})` with `projectionEngine.createProjection({from, to})`. Check your CRS definitions against the [projection support guide](https://visgl.github.io/math.gl/docs/modules/geospatial/projection/support.md). Use `proj4` directly if your application needs the proj4js API.

## Upgrading to v4.1[​](#upgrading-to-v41 "Direct link to Upgrading to v4.1")

Use `NumberArray` for JavaScript arrays and `NumericArray` when typed arrays are also accepted. `isTypedArray()` and `isNumericArray()` now return booleans and narrow types.

## Upgrading to v4.0[​](#upgrading-to-v40 "Direct link to Upgrading to v4.0")

v4 provides ES modules and CommonJS. Install `gl-matrix` separately if your application imports it directly.

## Upgrading to v3.6[​](#upgrading-to-v36 "Direct link to Upgrading to v3.6")

Pass named options to `Matrix4.lookAt()`. The TypeScript conversion also tightened the `SphericalCoordinates` constructor signatures.

## Upgrading to v3.0[​](#upgrading-to-v30 "Direct link to Upgrading to v3.0")

Supply all values to matrix setters and replace `setColumnMajor()` with `set()`. Matrix transforms return plain arrays by default. Pass a result vector to keep the vector return type. Use `Vector3.cross()` in place of `Vector2.cross()`.

## Upgrading to v2.0[​](#upgrading-to-v20 "Direct link to Upgrading to v2.0")

Import experimental classes by their underscore-prefixed names, such as `_Euler`. The `experimental` namespace was removed.

## Upgrading to v1.1[​](#upgrading-to-v11 "Direct link to Upgrading to v1.1")

`Euler` was removed from the experimental exports.
