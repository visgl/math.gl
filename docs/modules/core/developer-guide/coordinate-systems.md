# 3D Coordinate Systems

Choose coordinates that fit the operation you need. Core provides Cartesian vectors, spherical coordinates, and homogeneous coordinates for matrix transforms.

| Representation | Use it for |
| --- | --- |
| `Vector3` | Cartesian positions and directions with X, Y, and Z components |
| `SphericalCoordinates` | Legacy radius/angle storage and conversions (see limits below) |
| `Vector4` | Points and directions with an explicit homogeneous W component |

## Convert spherical coordinates

```js
import {SphericalCoordinates, Vector3} from '@math.gl/core';

const spherical = new SphericalCoordinates({radius: 1, phi: Math.PI / 2, theta: Math.PI / 2});
const cartesian = spherical.toVector3(); // Returns a plain array
const result = spherical.toVector3(new Vector3()); // Reuses a vector
```

`SphericalCoordinates` retains legacy angle conventions, and its forward and inverse conversions are not a general inverse pair. Check the [current formulas and limits](../api-reference/spherical-coordinates.md#vector-conversions) before using it for coordinate exchange. Use explicit spherical conversion equations when a standard convention or round trip is required.

Spherical coordinates describe geometry around a center; they are not ellipsoidal longitude, latitude, and height. Use [geospatial](../../geospatial/README.md) for ellipsoid conversions and [projection](../../projection/README.md) for CRS transformations.

See [SphericalCoordinates](../api-reference/spherical-coordinates.md), [homogeneous coordinates](./homogeneous-coordinates.md), and [rotations](./rotations.md) for details.
