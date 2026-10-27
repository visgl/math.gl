# EllipsoidTangentPlane

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

A two-dimensional east-north plane tangent to a supplied ellipsoid (WGS84 by default). It converts fixed Cartesian positions into local coordinates near a point on the ellipsoid.

## Usage[​](#usage "Direct link to Usage")

```
import {Ellipsoid, EllipsoidTangentPlane} from '@math.gl/geospatial';



const origin = Ellipsoid.WGS84.cartographicToCartesian([-122.4, 37.8, 0]);

const tangentPlane = new EllipsoidTangentPlane(origin);

const position = Ellipsoid.WGS84.cartographicToCartesian([-122.399, 37.801, 20]);

const localPosition = tangentPlane.projectPointToNearestOnPlane(position);
```

The returned `Vector2` is expressed in meters. Its `x` component points east and its `y` component points north.

## Fields[​](#fields "Direct link to Fields")

### origin : Vector3[​](#origin--vector3 "Direct link to origin : Vector3")

The Cartesian point where the plane touches the WGS84 ellipsoid. An input point away from the surface is projected onto the ellipsoid when the plane is constructed.

### plane : Plane[​](#plane--plane "Direct link to plane : Plane")

The tangent plane in Hessian normal form.

### xAxis : Vector3[​](#xaxis--vector3 "Direct link to xAxis : Vector3")

The unit vector pointing east from `origin`.

### yAxis : Vector3[​](#yaxis--vector3 "Direct link to yAxis : Vector3")

The unit vector pointing north from `origin`.

### zAxis : Vector3[​](#zaxis--vector3 "Direct link to zAxis : Vector3")

The outward-facing unit normal of the ellipsoid at `origin`.

## Methods[​](#methods "Direct link to Methods")

### constructor(origin : Number\[3], ellipsoid? : Ellipsoid)[​](#constructororigin--number3-ellipsoid--ellipsoid "Direct link to constructor(origin : Number\[3], ellipsoid? : Ellipsoid)")

Creates a tangent plane from a nonzero fixed Cartesian point. An off-surface origin is moved to its nearest ellipsoid surface point.

### projectPointToNearestOnPlane(cartesian : Number\[3], result? : Vector2) : Vector2[​](#projectpointtonearestonplanecartesian--number3-result--vector2--vector2 "Direct link to projectPointToNearestOnPlane(cartesian : Number\[3], result? : Vector2) : Vector2")

Projects a WGS84 Cartesian point orthogonally onto the plane and expresses it in local east-north coordinates.

* `cartesian` - The WGS84 Cartesian point to project.
* `result` - Optional `Vector2` in which to store the result.

Returns the supplied `result` or a new `Vector2`.

## Radial projection and surface inversion[​](#radial-projection-and-surface-inversion "Direct link to Radial projection and surface inversion")

```
const radial = tangentPlane.projectPointRadiallyOntoPlane(position);

if (radial) {

  const surface = tangentPlane.projectPointOntoEllipsoid(radial, 'radial');

}

const normal = tangentPlane.projectPointToNearestOnPlane(position);

const nearestFacingSurface = tangentPlane.projectPointOntoEllipsoid(normal, 'normal');
```

`projectPointRadiallyOntoPlane(cartesian, result?: Vector2)` intersects the outward ray from the ellipsoid center with the tangent plane. It differs from orthogonal projection along the plane normal. Scaling a source vector by a positive factor does not change its radial projection. The zero vector, back-facing rays and near-horizon rays (normalized direction dot normal ≤ `1e-14`) return `undefined` without changing the result. Unrepresentable projected coordinates also fail.

`projectPointOntoEllipsoid(point, mode = 'radial', result?: Vector3)` lifts a two-component local point onto the snapshotted ellipsoid:

| Mode       | Surface mapping                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `'radial'` | Construct the 3D tangent-plane point, then intersect its center ray with the ellipsoid. Inverts radial projection of surface positions.                                        |
| `'normal'` | Intersect the line parallel to the plane normal, selecting the near-facing root. Inverts orthogonal projection only on the near-facing surface branch. May miss the ellipsoid. |

Returns the supplied result or a new vector; a missing or unrepresentable intersection returns `undefined` without writing the result. Neither mapping recovers source height. Surface inversion is not a geoid conversion. Distances use the ellipsoid axes' units, and arbitrary positive three-radius ellipsoids are supported. The tangent basis is orthonormal and constructed from the surface normal, including when the X and Y radii differ.

All scalar inputs must have the exact component count and finite values; malformed inputs and unknown modes throw `RangeError`. Construction rejects zero/ambiguous origins and nonpositive or nonfinite radii. Orthogonal projection throws `RangeError` if finite input arithmetic overflows. The legacy vector getters remain mutable; callers should treat the plane and its basis as read-only.

## Packed projection[​](#packed-projection "Direct link to Packed projection")

`projectPointsFlat(input, mode = 'normal', output?: Float64Array)` maps packed XYZ positions to packed east/north positions and returns `{positions, valid}`:

* `positions` is the supplied output or a new `Float64Array`, with exactly two components per point.
* `valid` is a new `Uint8Array`, with one byte per input point. A successful point has value 1.
* Failed radial intersections have value 0 and a pair of `NaN` coordinates. Records retain their original indices; no points are silently removed.

Input/output views must not overlap. Input lengths, modes, finite ordinates and output length are validated before any coordinate writes. Arithmetic overflow in normal projection throws; writes from preceding records are retained. The empty input produces empty arrays.

```
const input = new Float64Array([...position, ...anotherPosition]);

const {positions, valid} = tangentPlane.projectPointsFlat(input, 'radial');
```

See the [C8 qualification and G7 baselines](https://visgl.github.io/math.gl/next/docs/modules/geospatial/api-reference/local-frame-qualification.md) for independent/native controls, numerical budgets, remaining domains and measured-cost methodology.
