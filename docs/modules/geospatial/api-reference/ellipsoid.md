# Ellipsoid

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

A quadratic surface defined in Cartesian coordinates by the equation `(x / a)^2 + (y / b)^2 + (z / c)^2 = 1`. Primarily used to represent the shape of planetary bodies.

The main use of this class is to convert between the "cartesian" and "cartographic" coordinate systems.

Cartographic positions are represented as `[longitude, latitude, height]`. Longitude and latitude are in degrees, and height is in meters above the ellipsoid.

Use `Ellipsoid.WGS84` for the standard Earth shape, construct three radii directly,
or use `Ellipsoid.fromSpheroid` to import two-axis geometry from a projection CRS.

## Usage

Determine the Cartesian representation of a Cartographic position on a WGS84 ellipsoid.

```js
import {Ellipsoid} from '@math.gl/geospatial';
const cartographicPosition = [21, 78, 5000]; // [longitude, latitude, height]
const cartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(cartographicPosition);
```

Determine the Cartographic representation of a Cartesian position on a WGS84 ellipsoid.

```js
import {Ellipsoid} from '@math.gl/geospatial';
const cartesianPosition = [17832.12, 83234.52, 952313.73];
const cartographicPosition = Ellipsoid.WGS84.cartesianToCartographic(cartesianPosition);
```

Get the transform from a local east-north-up frame at a point on the WGS84 ellipsoid to Earth's fixed frame.

```js
import {Ellipsoid} from '@math.gl/geospatial';
const cartesianOrigin = Ellipsoid.WGS84.cartographicToCartesian([21, 78, 0]);
const transformMatrix = Ellipsoid.WGS84.eastNorthUpToFixedFrame(cartesianOrigin);
```

## Projection interoperability

`@math.gl/projection` uses spheres and oblate spheroids: its X/Y equatorial radii
are equal. `Ellipsoid` also supports three independent radii. The adapters exchange
only the common geometry; they do not transfer a datum, axis order, units or epoch.

```ts
import {Ellipsoid} from '@math.gl/geospatial';
import {normalizeCRS} from '@math.gl/projection/core';

const crs = normalizeCRS('+proj=longlat +ellps=GRS80');
const shape = Ellipsoid.fromSpheroid(crs.ellipsoid);
const parameters = shape.toSpheroid(); // {semiMajorAxis, semiMinorAxis}, in metres
```

Create/cache the adapter result during setup. Coordinate conversions still use
the existing geospatial implementation. The projection module does not import
geospatial at runtime. See [coordinate-system concepts](../../projection/coordinate-systems.md#interoperating-with-geospatial-ellipsoids)
for the units and boundary conventions.

## Static Fields

### Ellipsoid.WGS84 : Ellipsoid (readonly)

An Ellipsoid instance initialized to the WGS84 standard.

## Static Methods

### Ellipsoid.fromSpheroid(parameters: SpheroidParameters): Ellipsoid

Constructs radii `[semiMajorAxis, semiMajorAxis, semiMinorAxis]` from an owned
snapshot of the supplied axes. Accepts the geometry returned by
`normalizeCRS(...).ellipsoid`. Additional fields such as `eccentricitySquared`
are not imported; the axes determine the shape.

Throws if either axis is non-finite or non-positive, or the polar axis is larger
than the equatorial axis. These checks apply to this adapter; the existing
three-radius constructor retains its broader geometry support.

## Members

### radii : Vector3 (readonly)

Gets the radii of the ellipsoid.

### radiiSquared : Vector3 (readonly)

Gets the squared radii of the ellipsoid.

### radiiToTheFourth : Vector3 (readonly)

Gets the radii of the ellipsoid raise to the fourth power.

### oneOverRadii : Vector3 (readonly)

Gets one over the radii of the ellipsoid.

### oneOverRadiiSquared : Vector3 (readonly)

Gets one over the squared radii of the ellipsoid.

### minimumRadius : Number (readonly)

Gets the minimum radius of the ellipsoid.

### maximumRadius : Number

Gets the maximum radius of the ellipsoid.

## Methods

### constructor(x : Number, y : Number, z : Number)

- `x`=`0` The radius in the x direction.
- `y`=`0` The radius in the y direction.
- `z`=`0` The radius in the z direction.

Throws

- All radii components must be greater than or equal to zero.

### clone() : Ellipsoid

Duplicates an Ellipsoid instance.

- result?: Ellipsoid - Optional object onto which to store the result, or undefined if a new instance should be created.

Returns

- The cloned `Ellipsoid`.

### toSpheroid(): SpheroidParameters

Returns a new frozen `{semiMajorAxis, semiMinorAxis}` snapshot in metres.
The snapshot remains independent of subsequent changes to the radii vector.
Throws for unequal X/Y radii, a prolate spheroid, non-finite axes or zero radii.
It never approximates a triaxial ellipsoid by discarding one radius.

### equals(right : Ellipsoid) : Boolean

Compares this Ellipsoid against the provided Ellipsoid componentwise.

- `right` The other Ellipsoid. used.

Returns

- `true` if they are equal, `false` otherwise.

### toString() : String

Creates a string representing this Ellipsoid in the format used `'[radii.x, radii.y, radii.z]`.

Returns

- A string representing this ellipsoid in the format '(radii.x, radii.y, radii.z)'.

### cartographicToCartesian(cartographic : Number[3], result : Number[3]) : Vector3 | Number[3]

Converts the provided cartographic to Cartesian representation.

- `cartographic` The cartographic position as `[longitude, latitude, height]`. Longitude and latitude are in degrees, and height is in meters above the ellipsoid.
- `result` Optional object onto which to store the result.

Returns

- The modified `result` parameter or a new `Vector3` instance if none was provided.

### cartesianToCartographic(cartesian : Number[3], result : Number[3]) : Vector3 | Number[3] | `undefined`

Converts the provided Cartesian position to cartographic representation. Latitude
retains precision near the poles. Returns `undefined` at the center, for non-finite
or unrepresentable inputs, or when its bounded inverse cannot converge; an existing
result is left unchanged. Sphere/oblate surface and exterior conversions use the
shared [spheroid helpers](../../core/api-reference/spheroid.md). Three-radius and
interior surface inversion retain the 64-update bound. The center-neighborhood
radial fallback remains an approximation for deep interior positions. A defined
interior result does not guarantee the nearest-normal representation, including
some inputs whose nearest solution is unique. See
[ellipsoid accuracy and interior boundaries](../../projection/ellipsoid-qualification.md)
for independent references and the distinction between accuracy and fallback checks.

- `cartesian` The Cartesian position to convert to cartographic representation.
- `result` Optional object onto which to store the result.

Returns

- The modified result parameter, a new `Vector3` instance if none was provided, or `undefined` if the inverse is undefined or unsupported. A defined result contains `[longitude, latitude, height]`, with longitude and latitude in degrees and height in meters above the ellipsoid.

### eastNorthUpToFixedFrame(origin : Number[3], result : Number[16]) : Matrix4 | Number[16]

Computes a 4x4 transformation matrix from a reference frame with an east-north-up axes centered at the provided origin to the provided ellipsoid's fixed reference frame.

The local axes are defined as:

- The `x` axis points in the local east direction.
- The `y` axis points in the local north direction.
- The `z` axis points in the direction of the ellipsoid surface normal which passes through the position.

- `origin` The Cartesian position at the center of the local reference frame.
- `result` Optional object onto which to store the result.

Returns

- The modified `result` parameter or a new `Matrix4` instance if none was provided.

Notes

- Calls `localFrameToFixedFrame` with `east`, `north`, `up` axis.

### localFrameToFixedFrame(String firstAxis, secondAxis : String, thirdAxis : String | null, origin : Number[3] \[, result : Number[16]]) : Matrix4 | Number[16]

Computes a 4x4 transformation matrix from a reference frame centered at the provided origin to the ellipsoid's fixed reference frame.

- `firstAxis` name of the first axis of the local reference frame. Must be 'east', 'north', 'up', 'west', 'south' or 'down'.
- `secondAxis` name of the second axis of the local reference frame.
- `thirdAxis` name of the third axis of the local reference frame. Can be omitted as it is implied by the cross product of the first two axis.
- `origin` The Cartesian position at the center of the local reference frame.
- `result` Optional object onto which to store the result.

Returns

- A 4x4 transformation matrix from a reference frame, with first axis and second axis compliant with the parameters, in the modified `result` parameter or a new `Matrix4` instance if none was provided.

### geocentricSurfaceNormal(cartesian : Number[3], result : Number[3]) : Vector3 | Number[3]

Computes the unit vector directed from the center of this ellipsoid toward the provided Cartesian position.

- `cartesian` - The WGS84 Cartesian coordinate for which to determine the geocentric normal.
- `result` - Optional object onto which to store the result.

Returns

- The modified result parameter or a new `Vector3` instance if none was provided.

### geodeticSurfaceNormalCartographic(cartographic : Number[3], result : Number[3]) : Vector3 | Number[3]

Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.

- `cartographic` The cartographic position as `[longitude, latitude, height]`. Longitude and latitude are in degrees.
- `result` Optional object onto which to store the result.

Returns

The modified result parameter or a new `Vector3` instance if none was provided.

### geodeticSurfaceNormal(cartesian : Number[3], result : Number[3]) : Vector3 | Number[3]

Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.

- `cartesian` The Cartesian position for which to determine the surface normal.
- `result` Optional object onto which to store the result.

Returns

- The modified `result` parameter or a new `Vector3` instance if none was provided.

### scaleToGeodeticSurface(cartesian : Number[3], result : Number[3]]) : Vector3 | Number[3] | `undefined`

Scales the provided Cartesian position along the geodetic surface normal onto the
ellipsoid. Returns `undefined` at the center, for non-finite or unrepresentable
inputs, singular updates, or after 64 unsuccessful Newton updates. Caller output
is unchanged on failure. Close to the center, the retained radial intersection is
an approximation rather than a normal footpoint.

- `cartesian` The Cartesian position to scale.
- `result` Optional object onto which to store the result.

Returns

- The modified result parameter, a new `Vector3` instance if none was provided, or `undefined` if the surface inverse is undefined or unsupported.

### scaleToGeocentricSurface(cartesian : Number[3], result : Number[3]]) : Vector3 | Number[3]

Scales the provided Cartesian position along the geocentric surface normal so that it is on the surface of this ellipsoid.

- `cartesian` The Cartesian position to scale.
- `result` Optional object onto which to store the result.

Returns

- The modified `result` parameter or a new `Vector3` instance if none was provided.

### transformPositionToScaledSpace(position : Number[3], result : Number[3]]) : Vector3 | Number[3]

Transforms a Cartesian X, Y, Z position to the ellipsoid-scaled space by multiplying its components by the result of `Ellipsoid.oneOverRadii`.

- `position` The position to transform.
- `result` Optional array into which to copy the result.

Returns

- The position expressed in the scaled space. The returned instance is the one passed as the `result` parameter if it is not undefined, or a new instance of it is.

### transformPositionFromScaledSpace(position : Number[3], result : Number[3]]) : Vector3 | Number[3]

Transforms a Cartesian X, Y, Z position from the ellipsoid-scaled space by multiplying its components by the result of `Ellipsoid.radii`.

- `position` The position to transform.
- `result` Optional array to which to copy the result.

Returns

- The position expressed in the unscaled space. The returned array is the one passed as the `result` parameter, or a new `Vector3` instance.

### getSurfaceNormalIntersectionWithZAxis(position, buffer, result) : | undefined

Computes a point which is the intersection of the surface normal with the z-axis.

- `position` the position. must be on the surface of the ellipsoid.
- `buffer`=`0.0` A buffer to subtract from the ellipsoid size when checking if the point is inside the ellipsoid.
- `result` Optional array into which to copy the result.

Returns

- The intersection point if it's inside the ellipsoid, `undefined` otherwise.

Throws

- `position` is required.
- `Ellipsoid` must be an ellipsoid of revolution (`radii.x == radii.y`).
- Ellipsoid.radii.z must be greater than 0.

Notes:

- In earth case, with common earth datums, there is no need for this buffer since the intersection point is always (relatively) very close to the center.
- In WGS84 datum, intersection point is at max z = +-42841.31151331382 (0.673% of z-axis).
- Intersection point could be outside the ellipsoid if the ratio of MajorAxis / AxisOfRotation is bigger than the square root of 2

## Attribution

This class was ported from [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) under the Apache 2 License.
