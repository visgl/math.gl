# EllipsoidTangentPlane

A two-dimensional east-north plane tangent to the WGS84 ellipsoid. It converts WGS84 Cartesian
positions into local coordinates near a point on the ellipsoid.

## Usage

```js
import {Ellipsoid, EllipsoidTangentPlane} from '@math.gl/geospatial';

const origin = Ellipsoid.WGS84.cartographicToCartesian([-122.4, 37.8, 0]);
const tangentPlane = new EllipsoidTangentPlane(origin);
const position = Ellipsoid.WGS84.cartographicToCartesian([-122.399, 37.801, 20]);
const localPosition = tangentPlane.projectPointToNearestOnPlane(position);
```

The returned `Vector2` is expressed in meters. Its `x` component points east and its `y` component
points north.

## Fields

### origin : Vector3

The Cartesian point where the plane touches the WGS84 ellipsoid. An input point away from the
surface is projected onto the ellipsoid when the plane is constructed.

### plane : Plane

The tangent plane in Hessian normal form.

### xAxis : Vector3

The unit vector pointing east from `origin`.

### yAxis : Vector3

The unit vector pointing north from `origin`.

### zAxis : Vector3

The outward-facing unit normal of the ellipsoid at `origin`.

## Methods

### constructor(origin : Number[3])

Creates a tangent plane from a nonzero WGS84 Cartesian point.

### projectPointToNearestOnPlane(cartesian : Number[3], result? : Vector2) : Vector2

Projects a WGS84 Cartesian point orthogonally onto the plane and expresses it in local east-north
coordinates.

- `cartesian` - The WGS84 Cartesian point to project.
- `result` - Optional `Vector2` in which to store the result.

Returns the supplied `result` or a new `Vector2`.
